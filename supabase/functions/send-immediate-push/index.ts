import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const safeString = (value: unknown) => String(value || "").trim();
const normalizePhone = (value: unknown) => safeString(value).replace(/[^\d+]/g, "");

const normalizePayload = async (req: Request) => {
  try {
    return await req.json();
  } catch {
    return {};
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "Missing env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const payload = await normalizePayload(req);
    const type = safeString(payload?.type || "update");
    const title = safeString(payload?.title || "Calendar Update");
    const body = safeString(payload?.body || "");
    const data = payload?.data && typeof payload.data === "object" ? payload.data : {};
    const actorUserId = safeString(payload?.actorUserId);
    const actorEmail = safeString(payload?.actorEmail).toLowerCase();
    const layerId = safeString(payload?.layerId);
    const subCalendarId = safeString(payload?.subCalendarId);

    if (!title) {
      return new Response(JSON.stringify({ ok: false, error: "Missing title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipientIds = new Set<string>();
    if (actorUserId) recipientIds.add(actorUserId);
    let cachedAuthUsers: any[] | null = null;
    const listAuthUsers = async () => {
      if (cachedAuthUsers) return cachedAuthUsers;
      const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      cachedAuthUsers = authUsers?.users || [];
      return cachedAuthUsers;
    };

    if (layerId) {
      const { data: shareRows } = await supabase
        .from("shared_access")
        .select("owner_id,shared_with_id,shared_with_email,shared_with_phone")
        .eq("layer_id", layerId);

      for (const row of shareRows || []) {
        const ownerId = safeString(row?.owner_id);
        const sharedWithId = safeString(row?.shared_with_id);
        const sharedWithEmail = safeString(row?.shared_with_email).toLowerCase();
        const sharedWithPhone = normalizePhone(row?.shared_with_phone);
        if (ownerId) recipientIds.add(ownerId);
        if (sharedWithId) recipientIds.add(sharedWithId);

        // Best-effort recipient resolution if shared_with_id wasn't backfilled yet.
        if (!sharedWithId && (sharedWithEmail || sharedWithPhone)) {
          const users = await listAuthUsers();
          const match = users.find((u) => {
            const emailMatch = sharedWithEmail && safeString(u?.email).toLowerCase() === sharedWithEmail;
            const phoneMatch = sharedWithPhone && normalizePhone(u?.phone) === sharedWithPhone;
            return Boolean(emailMatch || phoneMatch);
          });
          if (match?.id) recipientIds.add(String(match.id));
        }
      }
    }

    if (subCalendarId) {
      const { data: memberRows } = await supabase
        .from("sub_calendar_members")
        .select("email,phone")
        .eq("sub_calendar_id", subCalendarId)
        .in("status", ["accepted", "pending"]);
      const emails = Array.from(new Set((memberRows || []).map((row) => safeString(row?.email).toLowerCase()).filter(Boolean)));
      const phones = Array.from(new Set((memberRows || []).map((row) => normalizePhone(row?.phone)).filter(Boolean)));
      if (emails.length > 0 || phones.length > 0) {
        const users = await listAuthUsers();
        for (const email of emails) {
          const match = users.find((u) => safeString(u?.email).toLowerCase() === email);
          if (match?.id) recipientIds.add(String(match.id));
        }
        for (const phone of phones) {
          const match = users.find((u) => normalizePhone(u?.phone) === phone);
          if (match?.id) recipientIds.add(String(match.id));
        }
      }
    }

    if (recipientIds.size === 0 && actorEmail) {
      const users = await listAuthUsers();
      const match = users.find((u) => safeString(u?.email).toLowerCase() === actorEmail);
      if (match?.id) recipientIds.add(String(match.id));
    }

    const ids = Array.from(recipientIds);
    if (ids.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, disabledSubs: 0, skipped: "no-recipients" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs, error: subsErr } = await supabase
      .from("push_subscriptions")
      .select("id,user_id,endpoint,p256dh,auth,enabled")
      .eq("enabled", true)
      .in("user_id", ids);
    if (subsErr) throw subsErr;

    const pushPayload = JSON.stringify({
      notification: { title, body },
      data: {
        ...data,
        type,
        url: safeString(data?.url || "/"),
      },
    });

    let sent = 0;
    let disabledSubs = 0;
    for (const sub of subs || []) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(subscription as any, pushPayload);
        sent += 1;
      } catch (err: any) {
        const statusCode = Number(err?.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").update({ enabled: false }).eq("id", sub.id);
          disabledSubs += 1;
        } else {
          console.error("send-immediate-push failure:", err);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent, disabledSubs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
