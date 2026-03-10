const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_FETCH_BYTES = 2 * 1024 * 1024; // 2MB

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

const parseSymbolList = (raw: unknown) => {
  const text = toText(raw);
  if (!text) return new Set<string>();
  return new Set(
    text
      .split(",")
      .map((v) => toText(v).toUpperCase())
      .filter(Boolean),
  );
};

const parseAlphaHorizon = (raw: unknown) => {
  const value = toText(raw).toLowerCase();
  if (value === "3month" || value === "6month" || value === "12month") return value;
  return "3month";
};

const fetchAlphaVantageEarningsCsv = async (horizonRaw: unknown, symbolsRaw: unknown) => {
  const apiKey = toText(Deno.env.get("ALPHA_VANTAGE_API_KEY"));
  if (!apiKey) throw new Error("Missing ALPHA_VANTAGE_API_KEY secret in edge function.");
  const horizon = parseAlphaHorizon(horizonRaw);
  const url = `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=${encodeURIComponent(horizon)}&apikey=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "our-calendar-edge/1.0",
      Accept: "text/csv,application/json,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Alpha Vantage fetch failed (${response.status}).`);
  }
  const text = await response.text();
  if (!text.trim()) return "";

  // Rate-limit/error payloads are JSON strings; bubble readable error.
  if (/^\s*\{/.test(text)) {
    try {
      const parsed = JSON.parse(text);
      const msg = toText(parsed?.Information || parsed?.Note || parsed?.Error || parsed?.Message);
      if (msg) throw new Error(msg);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Alpha Vantage returned JSON response.");
    }
  }

  const symbolFilter = parseSymbolList(symbolsRaw);
  if (symbolFilter.size === 0) return text;

  // Filter CSV rows server-side by symbol if requested.
  const lines = text.split(/\r?\n/).filter((line) => toText(line));
  if (lines.length < 2) return text;
  const header = lines[0];
  const headers = header.split(",").map((h) => toText(h).toLowerCase());
  const symbolIdx = headers.indexOf("symbol");
  if (symbolIdx < 0) return text;
  const filtered = [header];
  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i];
    const cols = row.split(",");
    const symbol = toText(cols[symbolIdx]).replace(/^"|"$/g, "").toUpperCase();
    if (!symbol || !symbolFilter.has(symbol)) continue;
    filtered.push(row);
  }
  return filtered.join("\n");
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
    const modeRaw = toText(body?.mode).toLowerCase();
    const mode = modeRaw === "text" || modeRaw === "alpha_earnings" ? modeRaw : "ics";
    if (mode === "alpha_earnings") {
      const csvText = await fetchAlphaVantageEarningsCsv(body?.horizon, body?.symbols);
      return new Response(JSON.stringify({
        ok: true,
        mode,
        provider: "alpha_vantage",
        contentType: "text/csv",
        text: csvText,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: mode === "text" ? "text/html,text/plain,application/json,*/*" : "text/calendar,text/plain,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: `${parsed.protocol}//${parsed.hostname}/`,
      },
    });
    clearTimeout(timer);

    if (!response.ok) {
      return new Response(JSON.stringify({
        ok: false,
        error: `URL fetch failed (${response.status}) for ${parsed.hostname}`,
        status: response.status,
        finalUrl: response.url,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentLength = Number(response.headers.get("content-length") || "0");
    if (contentLength > MAX_FETCH_BYTES) {
      return new Response(JSON.stringify({ ok: false, error: "Fetched file too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_FETCH_BYTES) {
      return new Response(JSON.stringify({ ok: false, error: "Fetched file too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = new TextDecoder().decode(bytes);
    if (mode === "ics") {
      if (!/BEGIN:VCALENDAR/i.test(text)) {
        return new Response(JSON.stringify({ ok: false, error: "URL did not return valid ICS data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        ok: true,
        mode,
        finalUrl: response.url,
        contentType: toText(response.headers.get("content-type")),
        icsText: text,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      mode,
      finalUrl: response.url,
      contentType: toText(response.headers.get("content-type")),
      text,
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
