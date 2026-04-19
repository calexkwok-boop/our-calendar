/**
 * /api/cache-product-image.js
 *
 * Optional image stabilizer for Dream Shelf saves.
 *
 * Required for caching:
 *   SUPABASE_URL or REACT_APP_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   DREAMSHELF_IMAGE_BUCKET = Supabase Storage bucket name
 *
 * If caching is not configured or fails, the endpoint returns the original imageUrl.
 */

import { createClient } from "@supabase/supabase-js";

const MAX_BYTES = 7 * 1024 * 1024;

function safeSlug(value = "dream-item") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "dream-item";
}

function extensionFromContentType(contentType = "") {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("avif")) return "avif";
  return "jpg";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { imageUrl = "", name = "dream-item" } = req.body || {};
  const url = String(imageUrl || "").trim();
  if (!url) return res.status(400).json({ error: "imageUrl required" });
  if (url.startsWith("data:")) return res.json({ imageUrl: url, cached: false });

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: "invalid imageUrl" });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "unsupported image protocol" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.DREAMSHELF_IMAGE_BUCKET || "dream-shelf-images";

  if (!supabaseUrl || !serviceKey) {
    return res.json({ imageUrl: url, cached: false, reason: "supabase cache not configured" });
  }

  try {
    const imageResponse = await fetch(url, {
      headers: { "User-Agent": "KomoBookImageCache/1.0" },
    });
    if (!imageResponse.ok) throw new Error("image fetch failed");

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) throw new Error("not an image");

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) throw new Error("image too large");

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    const ext = extensionFromContentType(contentType);
    const path = `${safeSlug(name)}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return res.json({ imageUrl: data.publicUrl || url, cached: !!data.publicUrl });
  } catch (error) {
    return res.json({ imageUrl: url, cached: false, reason: "cache failed" });
  }
}
