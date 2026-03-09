const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ICS_BYTES = 2 * 1024 * 1024; // 2MB

const toText = (value: unknown) => String(value || "").trim();

const normalizeInputUrl = (raw: unknown) => {
  const text = toText(raw);
  if (!text) return "";
  if (/^webcal:\/\//i.test(text)) return text.replace(/^webcal:\/\//i, "https://");
  return text;
};

const isPrivateOrLocalHost = (hostname: string) => {
  const h = hostname.toLowerCase();
  if (!h) return true;
  if (h === "localhost" || h === "127.0.0.1" || h === "::1") return true;
  if (h.endsWith(".local")) return true;
  if (h === "metadata.google.internal") return true;
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  const m172 = h.match(/^172\.(\d{1,3})\./);
  if (m172) {
    const n = Number(m172[1]);
    if (Number.isInteger(n) && n >= 16 && n <= 31) return true;
  }
  if (/^\[?fc/i.test(h) || /^\[?fd/i.test(h) || /^\[?fe80:/i.test(h)) return true;
  return false;
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
    const body = await req.json().catch(() => ({}));
    const normalizedUrl = normalizeInputUrl(body?.url);
    if (!normalizedUrl) {
      return new Response(JSON.stringify({ ok: false, error: "Missing URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: URL;
    try {
      parsed = new URL(normalizedUrl);
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["https:", "http:"].includes(parsed.protocol)) {
      return new Response(JSON.stringify({ ok: false, error: "URL must use http(s) or webcal" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (isPrivateOrLocalHost(parsed.hostname)) {
      return new Response(JSON.stringify({ ok: false, error: "Private/local URLs are not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "our-calendar-ics-import/1.0",
        Accept: "text/calendar,text/plain,*/*",
      },
    });
    clearTimeout(timer);

    if (!response.ok) {
      return new Response(JSON.stringify({
        ok: false,
        error: `Calendar URL fetch failed (${response.status})`,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentLength = Number(response.headers.get("content-length") || "0");
    if (contentLength > MAX_ICS_BYTES) {
      return new Response(JSON.stringify({ ok: false, error: "Calendar file too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_ICS_BYTES) {
      return new Response(JSON.stringify({ ok: false, error: "Calendar file too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const icsText = new TextDecoder().decode(bytes);
    if (!/BEGIN:VCALENDAR/i.test(icsText)) {
      return new Response(JSON.stringify({ ok: false, error: "URL did not return valid ICS data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      finalUrl: response.url,
      contentType: toText(response.headers.get("content-type")),
      icsText,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: toText((err as Error)?.message || "Unknown error") }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
