import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const DREAMSHELF_FILE = path.resolve("src/components/DreamShelfPage.jsx");
const MAX_BYTES = 7 * 1024 * 1024;

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(path.resolve(filePath), "utf8");
    raw.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const index = trimmed.indexOf("=");
      if (index < 0) return;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch {
    // Optional local env files are allowed to be missing.
  }
}

const args = new Set(process.argv.slice(2));
const getArg = (name, fallback = "") => {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find(arg => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const SHOULD_UPLOAD = args.has("--upload");
const SHOULD_APPLY = args.has("--apply");
const INCLUDE_ALL = args.has("--all");
const LIMIT = Number(getArg("--limit", "0")) || Infinity;
const ONLY_IDS = new Set(String(getArg("--ids", "")).split(",").map(value => value.trim()).filter(Boolean));
const OUT_FILE = getArg("--out", "");
const STORAGE_PROVIDER = getArg("--provider", "supabase").toLowerCase();

const clean = value => String(value || "").trim();
const isWeakImageUrl = url => /source\.unsplash\.com\/featured/i.test(clean(url));

function safeSlug(value = "dream-item") {
  return clean(value)
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

function getR2Config() {
  const publicBaseUrl = clean(process.env.R2_PUBLIC_BASE_URL || process.env.REACT_APP_R2_PUBLIC_BASE_URL).replace(/\/+$/, "");
  return {
    accountId: clean(process.env.R2_ACCOUNT_ID),
    accessKeyId: clean(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: clean(process.env.R2_SECRET_ACCESS_KEY),
    bucket: clean(process.env.R2_BUCKET),
    publicBaseUrl,
  };
}

function getSupabaseConfig() {
  return {
    url: clean(process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL),
    serviceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    bucket: clean(process.env.DREAMSHELF_IMAGE_BUCKET || "dream-shelf-images"),
  };
}

function assertRuntimeEnv() {
  if (!SHOULD_UPLOAD) return;
  const missing = [];
  if (!process.env.SERPER_API_KEY) missing.push("SERPER_API_KEY");
  if (STORAGE_PROVIDER === "r2") {
    const r2 = getR2Config();
    if (!r2.accountId) missing.push("R2_ACCOUNT_ID");
    if (!r2.accessKeyId) missing.push("R2_ACCESS_KEY_ID");
    if (!r2.secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
    if (!r2.bucket) missing.push("R2_BUCKET");
    if (!r2.publicBaseUrl) missing.push("R2_PUBLIC_BASE_URL");
  } else {
    const supabase = getSupabaseConfig();
    if (!supabase.url) missing.push("SUPABASE_URL or REACT_APP_SUPABASE_URL");
    if (!supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabase.bucket) missing.push("DREAMSHELF_IMAGE_BUCKET");
  }
  if (missing.length) {
    throw new Error(`Missing env vars for upload: ${missing.join(", ")}`);
  }
}

function parseStringField(line, field) {
  const match = line.match(new RegExp(`${field}:\\s*"([^"]*)"`));
  return match?.[1] || "";
}

function parseDreamShelfImages(source) {
  const start = source.indexOf("const DREAMSHELF_IMAGES = {");
  if (start < 0) return {};
  const end = source.indexOf("\n};", start);
  const block = source.slice(start, end);
  const images = {};
  for (const match of block.matchAll(/^\s*([a-zA-Z0-9_-]+):\s*"([^"]*)",?/gm)) {
    images[match[1]] = match[2];
  }
  return images;
}

function parseCuratedItems(source, imageMap) {
  return source
    .split(/\r?\n/)
    .filter(line => line.includes("{ id: "))
    .map(line => {
      const id = parseStringField(line, "id");
      const name = parseStringField(line, "name");
      const brand = parseStringField(line, "brand");
      const imageQuery = parseStringField(line, "imageQuery");
      const directImage = parseStringField(line, "image");
      const imageRef = line.match(/image:\s*DREAMSHELF_IMAGES\.([a-zA-Z0-9_-]+)/)?.[1] || "";
      const currentImage = directImage || imageMap[imageRef || id] || "";
      const query = imageQuery || [brand, name].filter(Boolean).join(" ");
      return { id, name, brand, imageQuery, query, currentImage };
    })
    .filter(item => item.id && item.name && item.query)
    .filter(item => ONLY_IDS.size === 0 || ONLY_IDS.has(item.id))
    .filter(item => INCLUDE_ALL || !item.currentImage || isWeakImageUrl(item.currentImage));
}

async function findSerperImage(query) {
  const response = await fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.SERPER_API_KEY,
    },
    body: JSON.stringify({ q: query, num: 8 }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Serper failed with ${response.status}`);
  }
  const images = Array.isArray(data?.images) ? data.images : [];
  return clean(images.find(item => item?.imageUrl)?.imageUrl || "");
}

async function downloadImage(imageUrl) {
  const response = await fetch(imageUrl, {
    headers: { "User-Agent": "KomoBookDreamShelfCache/1.0" },
  });
  if (!response.ok) throw new Error(`Image download failed with ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error(`Not an image: ${contentType}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) throw new Error("Image is too large");
  return { buffer, contentType };
}

function encodeR2Path(value = "") {
  return clean(value).split("/").filter(Boolean).map(segment => encodeURIComponent(segment)).join("/");
}

async function uploadToR2(buffer, contentType, objectPath) {
  const config = getR2Config();
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const encodedObjectPath = encodeR2Path(objectPath);
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
  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, hashHex(canonicalRequest)].join("\n");
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
  if (!response.ok) throw new Error(`R2 upload failed with ${response.status}`);
  return `${config.publicBaseUrl}/${encodedObjectPath}`;
}

async function uploadToSupabase(buffer, contentType, objectPath) {
  const config = getSupabaseConfig();
  const supabase = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.storage
    .from(config.bucket)
    .upload(objectPath, buffer, {
      contentType,
      upsert: true,
    });
  if (error) throw error;
  const { data } = supabase.storage.from(config.bucket).getPublicUrl(objectPath);
  const publicUrl = clean(data?.publicUrl);
  if (!publicUrl) throw new Error("Supabase returned no public URL");
  return publicUrl;
}

async function uploadCachedImage(buffer, contentType, objectPath) {
  if (STORAGE_PROVIDER === "r2") {
    return uploadToR2(buffer, contentType, objectPath);
  }
  return uploadToSupabase(buffer, contentType, objectPath);
}

function toImageMapSnippet(results) {
  return results
    .filter(result => result.cachedUrl)
    .map(result => `  ${result.id}: ${JSON.stringify(result.cachedUrl)},`)
    .join("\n");
}

async function applyImageMap(results) {
  const updates = Object.fromEntries(results.filter(result => result.cachedUrl).map(result => [result.id, result.cachedUrl]));
  if (!Object.keys(updates).length) return false;
  let source = await fs.readFile(DREAMSHELF_FILE, "utf8");
  const start = source.indexOf("const DREAMSHELF_IMAGES = {");
  const end = source.indexOf("\n};", start);
  if (start < 0 || end < 0) throw new Error("Could not locate DREAMSHELF_IMAGES block.");
  const before = source.slice(0, start);
  const block = source.slice(start, end);
  const after = source.slice(end);
  const existing = [];
  const seen = new Set();
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^(\s*)([a-zA-Z0-9_-]+):\s*"([^"]*)",?/);
    if (!match) {
      existing.push(line);
      continue;
    }
    const [, indent, key] = match;
    if (updates[key]) {
      existing.push(`${indent}${key}: ${JSON.stringify(updates[key])},`);
      seen.add(key);
    } else {
      existing.push(line);
    }
  }
  const insertions = Object.entries(updates)
    .filter(([key]) => !seen.has(key))
    .map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`);
  const nextBlock = [...existing, ...insertions].join("\n");
  source = `${before}${nextBlock}${after}`;
  await fs.writeFile(DREAMSHELF_FILE, source);
  return true;
}

async function main() {
  await loadEnvFile(".env.dreamshelf.local");
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");
  assertRuntimeEnv();
  const source = await fs.readFile(DREAMSHELF_FILE, "utf8");
  const imageMap = parseDreamShelfImages(source);
  const items = parseCuratedItems(source, imageMap).slice(0, LIMIT);

  if (!SHOULD_UPLOAD) {
    console.log(`Dry run: ${items.length} items would be resolved. Add --upload to call Serper and ${STORAGE_PROVIDER === "r2" ? "R2" : "Supabase Storage"}.`);
    console.log(items.map(item => `${item.id}: ${item.query}`).join("\n"));
    return;
  }

  const results = [];
  for (const item of items) {
    try {
      console.log(`Resolving ${item.id}: ${item.query}`);
      const imageUrl = await findSerperImage(item.query);
      if (!imageUrl) throw new Error("No Serper image result");
      const { buffer, contentType } = await downloadImage(imageUrl);
      const ext = extensionFromContentType(contentType);
      const objectPath = `dreamshelf/${item.id}-${safeSlug(item.name)}.${ext}`;
      const cachedUrl = await uploadCachedImage(buffer, contentType, objectPath);
      results.push({ ...item, sourceImageUrl: imageUrl, cachedUrl, provider: STORAGE_PROVIDER });
      console.log(`  cached -> ${cachedUrl}`);
    } catch (error) {
      results.push({ ...item, error: error?.message || String(error) });
      console.log(`  failed: ${error?.message || error}`);
    }
  }

  if (OUT_FILE) {
    await fs.writeFile(path.resolve(OUT_FILE), `${JSON.stringify(results, null, 2)}\n`);
  }
  if (SHOULD_APPLY) {
    await applyImageMap(results);
  }
  console.log("\nDREAMSHELF_IMAGES entries:\n");
  console.log(toImageMapSnippet(results));
}

main().catch(error => {
  console.error(error?.message || error);
  process.exit(1);
});
