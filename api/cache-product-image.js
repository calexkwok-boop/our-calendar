/**
 * /api/cache-product-image.js
 *
 * Optional image stabilizer for Dream Shelf saves.
 *
 * Preferred R2 cache env vars:
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET
 *   R2_PUBLIC_BASE_URL
 *
 * Supabase fallback cache env vars:
 *   SUPABASE_URL or REACT_APP_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   DREAMSHELF_IMAGE_BUCKET = Supabase Storage bucket name
 *
 * If caching is not configured or fails, the endpoint returns the original imageUrl.
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

function getR2Config() {
  const publicBaseUrl = String(process.env.R2_PUBLIC_BASE_URL || process.env.REACT_APP_R2_PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
  return {
    accountId: String(process.env.R2_ACCOUNT_ID || "").trim(),
    accessKeyId: String(process.env.R2_ACCESS_KEY_ID || "").trim(),
    secretAccessKey: String(process.env.R2_SECRET_ACCESS_KEY || "").trim(),
    bucket: String(process.env.R2_BUCKET || "").trim(),
    publicBaseUrl,
  };
}

function hasR2Config(config) {
  return Boolean(config.accountId && config.accessKeyId && config.secretAccessKey && config.bucket && config.publicBaseUrl);
}

function encodeR2Path(path = "") {
  return String(path || "")
    .split("/")
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join("/");
}

function hashHex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function getSignatureKey(secretAccessKey, dateStamp, regionName, serviceName) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, regionName);
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, "aws4_request");
}

async function uploadToR2(buffer, contentType, path) {
  const config = getR2Config();
  if (!hasR2Config(config)) return null;

  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const encodedObjectPath = encodeR2Path(path);
  const canonicalUri = `/${encodeURIComponent(config.bucket)}/${encodedObjectPath}`;
  const url = `https://${host}${canonicalUri}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";
  const payloadHash = hashHex(buffer);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    "",
  ].join("\n");
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    hashHex(canonicalRequest),
  ].join("\n");
  const signingKey = getSignatureKey(config.secretAccessKey, dateStamp, region, service);
  const signature = hmac(signingKey, stringToSign, "hex");
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: buffer,
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed with status ${response.status}`);
  }

  return `${config.publicBaseUrl}/${encodedObjectPath}`;
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

  try {
    const imageResponse = await fetch(url, {
      headers: { "User-Agent": "KomoBookImageCache/1.0" },
    });
    if (!imageResponse.ok) throw new Error("image fetch failed");

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) throw new Error("not an image");

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) throw new Error("image too large");

    const ext = extensionFromContentType(contentType);
    const path = `dreamshelf/${safeSlug(name)}-${Date.now()}.${ext}`;
    const r2Url = await uploadToR2(buffer, contentType, path);
    if (r2Url) {
      return res.json({ imageUrl: r2Url, cached: true, provider: "r2" });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.DREAMSHELF_IMAGE_BUCKET || "dream-shelf-images";

    if (!supabaseUrl || !serviceKey) {
      return res.json({ imageUrl: url, cached: false, reason: "image cache not configured" });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    const supabasePath = `${safeSlug(name)}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(supabasePath, buffer, {
        contentType,
        upsert: false,
      });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(supabasePath);
    return res.json({ imageUrl: data.publicUrl || url, cached: !!data.publicUrl, provider: data.publicUrl ? "supabase" : "" });
  } catch (error) {
    return res.json({ imageUrl: url, cached: false, reason: "cache failed" });
  }
}
