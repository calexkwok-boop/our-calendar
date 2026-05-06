const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

const toText = (value: unknown) => String(value || "").trim();

const buildInput = (messages: Array<{ role: string; content: string }>, context: Record<string, unknown>) => {
  const system = [
    "You are a concise calendar assistant.",
    "Help with scheduling, reminders, and planning.",
    "Prefer practical, short suggestions.",
  ].join(" ");

  const input: Array<Record<string, unknown>> = [{
    role: "system",
    content: [{ type: "input_text", text: system }],
  }];

  if (context && Object.keys(context).length > 0) {
    input.push({
      role: "system",
      content: [{ type: "input_text", text: `Context: ${JSON.stringify(context)}` }],
    });
  }

  for (const m of messages || []) {
    const role = m?.role === "assistant" ? "assistant" : "user";
    const content = toText(m?.content);
    if (!content) continue;
    input.push({
      role,
      content: [{ type: "input_text", text: content }],
    });
  }
  return input;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

async function getAuthenticatedUser(jwt: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${jwt}`, apikey: SUPABASE_ANON_KEY },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ? data : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const jwt = req.headers.get("authorization")?.replace("Bearer ", "").trim() ?? "";
  if (!jwt) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const authUser = await getAuthenticatedUser(jwt);
  if (!authUser) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "Missing OPENAI_API_KEY secret" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const context = body?.context && typeof body.context === "object" ? body.context : {};

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: buildInput(messages, context),
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      const errorMessage = toText(json?.error?.message || "OpenAI request failed");
      return new Response(JSON.stringify({ ok: false, error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reply = toText(json?.output_text);
    return new Response(JSON.stringify({ ok: true, reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: toText((err as Error)?.message || "Unknown error") }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
