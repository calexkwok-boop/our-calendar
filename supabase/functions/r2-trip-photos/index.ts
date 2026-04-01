import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID") || "";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") || "";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";
const R2_BUCKET = Deno.env.get("R2_BUCKET") || "";
const R2_PUBLIC_BASE_URL = (Deno.env.get("R2_PUBLIC_BASE_URL") || "").replace(/\/+$/, "");

const safeString = (value: unknown) => String(value || "").trim();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getAuthenticatedUser = async (req: Request) => {
  const authHeader = req.headers.get("Authorization") || "";
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !authHeader) return null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
};

const getAwsClient = () => new AwsClient({
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  service: "s3",
  region: "auto",
});

const getObjectUrl = (path: string) => {
  const normalizedPath = safeString(path).replace(/^\/+/, "");
  return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${normalizedPath}`;
};

const getPublicUrl = (path: string) => {
  const normalizedPath = encodeURI(safeString(path).replace(/^\/+/, ""));
  return `${R2_PUBLIC_BASE_URL}/${normalizedPath}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ ok: false, error: "Supabase env vars are missing." }, 500);
  }
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_BASE_URL) {
    return json({ ok: false, error: "R2 env vars are missing." }, 500);
  }

  const user = await getAuthenticatedUser(req);
  if (!user?.id) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {}

  const action = safeString(payload?.action);
  const aws = getAwsClient();

  try {
    if (action === "createUploadUrls") {
      const files = Array.isArray(payload?.files) ? payload.files : [];
      const signedFiles = await Promise.all(files.map(async (file: any) => {
        const path = safeString(file?.path);
        const contentType = safeString(file?.contentType || "image/jpeg");
        if (!path) {
          throw new Error("Each upload file needs a path.");
        }
        const objectUrl = getObjectUrl(path);
        const signedRequest = await aws.sign(objectUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          aws: { signQuery: true },
        });
        return {
          path,
          uploadUrl: signedRequest.url,
          publicUrl: getPublicUrl(path),
          headers: { "Content-Type": contentType },
        };
      }));
      return json({ ok: true, files: signedFiles });
    }

    if (action === "deleteObjects") {
      const paths = Array.isArray(payload?.paths)
        ? payload.paths.map((value: unknown) => safeString(value)).filter(Boolean)
        : [];
      await Promise.all(paths.map(async (path: string) => {
        const response = await aws.fetch(getObjectUrl(path), { method: "DELETE" });
        if (!response.ok && response.status !== 404) {
          throw new Error(`Delete failed for ${path} with status ${response.status}`);
        }
      }));
      return json({ ok: true });
    }

    return json({ ok: false, error: "Unknown action." }, 400);
  } catch (error) {
    return json({ ok: false, error: safeString((error as Error)?.message || error || "Unknown error") }, 500);
  }
});
