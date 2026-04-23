import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BUCKET = "dream-shelf-images";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const safeString = (value: unknown) => String(value || "").trim();

const slugify = (value: string) =>
  safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "dream-item";

const extensionFromContentType = (contentType: string) => {
  if (/png/i.test(contentType)) return "png";
  if (/webp/i.test(contentType)) return "webp";
  if (/avif/i.test(contentType)) return "avif";
  if (/gif/i.test(contentType)) return "gif";
  return "jpg";
};

const isSupabaseDreamShelfUrl = (url: string) => {
  if (!SUPABASE_URL) return false;
  try {
    const parsed = new URL(url);
    const supabaseHost = new URL(SUPABASE_URL).host;
    return parsed.host === supabaseHost && parsed.pathname.includes(`/storage/v1/object/public/${BUCKET}/`);
  } catch {
    return false;
  }
};

const getAuthenticatedUser = async (req: Request) => {
  const authHeader = req.headers.get("Authorization") || "";
  const anonKey = req.headers.get("apikey") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!SUPABASE_URL || !anonKey || !token) return null;

  const supabase = createClient(SUPABASE_URL, anonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ ok: false, error: "Supabase env vars are missing." }, 500);
  }

  const user = await getAuthenticatedUser(req);
  if (!user?.id) return json({ ok: false, error: "Unauthorized" }, 401);

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const imageUrl = safeString(payload.imageUrl);
  const name = safeString(payload.name || "dream-item");
  if (!imageUrl) return json({ ok: false, error: "imageUrl is required." }, 400);
  if (imageUrl.startsWith("data:")) return json({ ok: true, imageUrl });
  if (isSupabaseDreamShelfUrl(imageUrl)) return json({ ok: true, imageUrl });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return json({ ok: false, error: "imageUrl must be a valid URL." }, 400);
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return json({ ok: false, error: "Only http and https image URLs are supported." }, 400);
  }

  try {
    const sourceResponse = await fetch(parsedUrl.toString(), {
      headers: {
        "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5",
        "User-Agent": "our-calendar-dream-shelf-image-cache/1.0",
      },
    });

    if (!sourceResponse.ok || !sourceResponse.body) {
      return json({ ok: false, error: `Image fetch failed with status ${sourceResponse.status}.` }, 400);
    }

    const contentType = safeString(sourceResponse.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!contentType.startsWith("image/")) {
      return json({ ok: false, error: "URL did not return an image." }, 400);
    }

    const contentLength = Number(sourceResponse.headers.get("content-length") || "0");
    if (contentLength > MAX_IMAGE_BYTES) {
      return json({ ok: false, error: "Image is too large." }, 413);
    }

    const imageBuffer = await sourceResponse.arrayBuffer();
    if (imageBuffer.byteLength > MAX_IMAGE_BYTES) {
      return json({ ok: false, error: "Image is too large." }, 413);
    }

    const digest = await crypto.subtle.digest("SHA-256", imageBuffer);
    const hash = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16);
    const ext = extensionFromContentType(contentType);
    const objectPath = `dreamshelf/${slugify(name)}-${hash}.${ext}`;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.storage.createBucket(BUCKET, { public: true }).then(() => undefined, () => undefined);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, imageBuffer, {
        contentType,
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return json({ ok: true, imageUrl: data.publicUrl, path: objectPath });
  } catch (error) {
    console.error("cache-product-image failed", error);
    return json({ ok: false, error: safeString((error as Error)?.message || error || "Unknown error") }, 500);
  }
});
