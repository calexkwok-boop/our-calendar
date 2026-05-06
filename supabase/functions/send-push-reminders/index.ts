import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { DateTime } from "npm:luxon@3.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";
const REMINDER_TIMEZONE = Deno.env.get("REMINDER_TIMEZONE") || "America/Los_Angeles";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const toEventDateTime = (dateKey: string, timeValue: string | null) => {
  const [y, m, d] = String(dateKey || "").split("-").map((n) => Number(n));
  if (!y || !m || !d) return null;
  const [hh, mm] = timeValue && /^\d{2}:\d{2}$/.test(timeValue)
    ? timeValue.split(":").map((n) => Number(n))
    : [9, 0];
  const dt = DateTime.fromObject(
    { year: y, month: m, day: d, hour: hh || 0, minute: mm || 0, second: 0, millisecond: 0 },
    { zone: REMINDER_TIMEZONE },
  );
  if (!dt.isValid) return null;
  return dt.toJSDate();
};

const fmtDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const now = new Date();
    const start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    const { data: events, error: eventsErr } = await supabase
      .from("events")
      .select("id,date,time,title,layer_id,user_id,is_private,is_urgent")
      .gte("date", fmtDate(start))
      .lte("date", fmtDate(end))
      .limit(2000);
    if (eventsErr) throw eventsErr;

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, skipped: 0, disabledSubs: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Scope shared_access to only the layer_ids that appear in the events window.
    // Previously this was an unbounded full table scan on every invocation.
    const uniqueLayerIds = Array.from(new Set(
      events.map((ev) => String(ev.layer_id || "")).filter(Boolean)
    ));
    const { data: shares, error: sharesErr } = uniqueLayerIds.length > 0
      ? await supabase
          .from("shared_access")
          .select("owner_id,layer_id,shared_with_id")
          .in("layer_id", uniqueLayerIds)
      : { data: [], error: null };
    if (sharesErr) throw sharesErr;

    const shareRecipients = new Map<string, Set<string>>();
    for (const row of shares || []) {
      if (!row?.owner_id || !row?.layer_id || !row?.shared_with_id) continue;
      const k = `${row.owner_id}|${row.layer_id}`;
      if (!shareRecipients.has(k)) shareRecipients.set(k, new Set<string>());
      shareRecipients.get(k)!.add(String(row.shared_with_id));
    }

    const { data: subs, error: subsErr } = await supabase
      .from("push_subscriptions")
      .select("id,user_id,endpoint,p256dh,auth,enabled")
      .eq("enabled", true)
      .limit(5000);
    if (subsErr) throw subsErr;

    const subsByUser = new Map<string, Array<any>>();
    for (const sub of subs || []) {
      const uid = String(sub.user_id || "");
      if (!uid) continue;
      if (!subsByUser.has(uid)) subsByUser.set(uid, []);
      subsByUser.get(uid)!.push(sub);
    }

    // Pre-fetch all already-sent log entries for these events in one query
    // instead of doing individual INSERTs (and eating duplicate errors) per combination.
    const eventIds = events.map((ev) => String(ev.id)).filter(Boolean);
    const { data: existingLogRows } = await supabase
      .from("push_notification_log")
      .select("user_id,event_id,date_key,window_key")
      .in("event_id", eventIds)
      .limit(50000);
    const sentKeys = new Set<string>(
      (existingLogRows || []).map((r) => `${r.user_id}|${r.event_id}|${r.date_key}|${r.window_key}`)
    );

    const windows = [
      { key: "week", leadMs: 7 * 24 * 60 * 60 * 1000, title: "Event in 1 Week" },
      { key: "day", leadMs: 24 * 60 * 60 * 1000, title: "Event in 1 Day" },
      { key: "hour", leadMs: 60 * 60 * 1000, title: "Event in 1 Hour" },
      { key: "at-time", leadMs: 0, title: "Event starting now" },
    ];

    let sent = 0;
    let skipped = 0;
    let disabledSubs = 0;
    const graceMs = 5 * 60 * 1000;
    const newLogEntries: Array<{ user_id: string; event_id: string; date_key: string; window_key: string }> = [];
    const disabledSubIds: string[] = [];

    for (const ev of events) {
      const eventDateTime = toEventDateTime(ev.date, ev.time);
      if (!eventDateTime) continue;
      const diffMs = eventDateTime.getTime() - now.getTime();
      if (diffMs < -(2 * 60 * 60 * 1000)) continue;
      if (diffMs > 8 * 24 * 60 * 60 * 1000) continue;

      const recipients = new Set<string>();
      if (ev.user_id) recipients.add(String(ev.user_id));
      const key = `${String(ev.user_id || "")}|${String(ev.layer_id || "")}`;
      const shared = shareRecipients.get(key);
      if (shared) shared.forEach((uid) => recipients.add(uid));

      for (const recipientId of recipients) {
        const userSubs = subsByUser.get(recipientId) || [];
        if (userSubs.length === 0) continue;

        for (const windowDef of windows) {
          if (diffMs > windowDef.leadMs) continue;
          if (diffMs < -graceMs) continue;

          const logKey = `${recipientId}|${String(ev.id)}|${String(ev.date)}|${windowDef.key}`;
          if (sentKeys.has(logKey)) {
            skipped += 1;
            continue;
          }
          sentKeys.add(logKey);
          newLogEntries.push({
            user_id: recipientId,
            event_id: String(ev.id),
            date_key: String(ev.date),
            window_key: windowDef.key,
          });

          const payload = JSON.stringify({
            title: windowDef.title,
            body: `${String(ev.title || "Event")} - ${eventDateTime.toLocaleString()}`,
            tag: `event-${ev.id}-${ev.date}-${windowDef.key}`,
            data: { url: "/" },
          });

          for (const sub of userSubs) {
            const subscription = {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            };
            try {
              await webpush.sendNotification(subscription as any, payload);
              sent += 1;
            } catch (err: any) {
              const statusCode = Number(err?.statusCode || 0);
              if (statusCode === 404 || statusCode === 410) {
                disabledSubIds.push(sub.id);
                disabledSubs += 1;
              } else {
                console.error("Push send failed", err);
              }
            }
          }
        }
      }
    }

    // Batch insert new log entries instead of one INSERT per notification
    if (newLogEntries.length > 0) {
      await supabase.from("push_notification_log").insert(newLogEntries);
    }

    // Prune log entries older than 10 days — they can never match future events.
    await supabase
      .from("push_notification_log")
      .delete()
      .lt("created_at", new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString());

    // Batch disable expired subscriptions
    for (const subId of disabledSubIds) {
      await supabase.from("push_subscriptions").update({ enabled: false }).eq("id", subId);
    }

    return new Response(
      JSON.stringify({ ok: true, sent, skipped, disabledSubs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
