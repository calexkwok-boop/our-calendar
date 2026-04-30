import { supabase } from "../supabaseClient";

const safeString = (value) => String(value || "").trim();

const slugify = (value) => (
  safeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
);

export const getDestinationCacheKey = (destination = {}) => {
  const id = safeString(destination?.id);
  if (id) return `id:${id}`;
  const name = safeString(
    destination?.name
    || destination?.destination_name
    || destination?.cardTitle
    || destination?.title
  );
  const location = safeString(destination?.location);
  const slug = [name, location].map(slugify).filter(Boolean).join("--");
  return slug || "";
};

export const loadDestinationImageCache = async (destinations = []) => {
  const keys = Array.from(new Set(
    (Array.isArray(destinations) ? destinations : [])
      .map((destination) => getDestinationCacheKey(destination))
      .filter(Boolean)
  ));
  if (keys.length === 0) return {};
  try {
    const { data, error } = await supabase
      .from("destination_image_cache")
      .select("destination_key, image_url")
      .in("destination_key", keys);
    if (error || !Array.isArray(data)) return {};
    return data.reduce((acc, row) => {
      const key = safeString(row?.destination_key);
      const imageUrl = safeString(row?.image_url);
      if (key && imageUrl) acc[key] = imageUrl;
      return acc;
    }, {});
  } catch {
    return {};
  }
};

export const persistDestinationImageCache = async ({ destination = {}, imageUrl = "" } = {}) => {
  const destinationKey = getDestinationCacheKey(destination);
  const rawImageUrl = safeString(imageUrl);
  if (!destinationKey || !rawImageUrl) return rawImageUrl;

  let absoluteImageUrl = rawImageUrl;
  try {
    if (typeof window !== "undefined") {
      absoluteImageUrl = new URL(rawImageUrl, window.location.origin).toString();
    }
  } catch {}

  try {
    const { data, error } = await supabase.functions.invoke("cache-destination-image", {
      body: {
        key: destinationKey,
        name: safeString(destination?.name || destination?.destination_name || destination?.cardTitle || destination?.title),
        location: safeString(destination?.location),
        imageUrl: absoluteImageUrl,
      },
    });
    if (error) return rawImageUrl;
    const stableImageUrl = safeString(data?.imageUrl) || rawImageUrl;
    const payload = {
      destination_key: destinationKey,
      destination_name: safeString(destination?.name || destination?.destination_name || destination?.cardTitle || destination?.title),
      location: safeString(destination?.location),
      image_url: stableImageUrl,
      updated_at: new Date().toISOString(),
    };
    await supabase.from("destination_image_cache").upsert(payload, { onConflict: "destination_key" });
    return stableImageUrl;
  } catch {
    return rawImageUrl;
  }
};
