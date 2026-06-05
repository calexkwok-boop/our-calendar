import { findExploreCatalogImageUrlByTitle, getExploreCardImageUrl } from "../components/ExplorePage";
import { getDestinationImageOverride } from "../data/destinationImageOverrides";

const DIRECT_IMAGE_FIELDS = [
  "photo",
  "image",
  "image_url",
  "imageUrl",
  "restaurant_image",
  "restaurantImage",
  "thumbnail",
  "thumbnail_url",
  "thumbnailUrl",
  "displayUrl",
  "display_url",
  "main_path",
  "mainPath",
  "original_path",
  "originalPath",
  "destination_image",
  "photo_url",
  "photoUrl",
  "cover_photo",
  "coverPhoto",
  "attachment_url",
  "attachmentUrl",
];

const normalizeDreamImageUrl = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  const lower = normalized.toLowerCase();
  if (
    lower === "?"
    || lower === "??"
    || lower === "null"
    || lower === "undefined"
    || lower === "[object object]"
    || lower === "n/a"
    || lower === "na"
  ) {
    return "";
  }
  return normalized;
};

const proxiedRemoteImageUrl = (value = "") => {
  const normalized = normalizeDreamImageUrl(value);
  if (!normalized) return "";
  if (!/^https?:\/\//i.test(normalized)) return normalized;
  return `/api/image-proxy?url=${encodeURIComponent(normalized)}`;
};

const DREAM_CATEGORY_MAP = {
  places: "travel",
  travel: "travel",
  food: "food",
  experiences: "adventure",
  adventure: "adventure",
  culture: "adventure",
  wellness: "adventure",
  buy: "buy",
  shopping: "buy",
  products: "buy",
  dreamshelf: "buy",
  home: "home",
  fun: "fun",
  movies: "fun",
  games: "fun",
};

const TITLE_IMAGE_OVERRIDES = {
  "disneyland park": "https://commons.wikimedia.org/wiki/Special:FilePath/File:Disneyland%20park%20-%20Anaheim%20Los%20Angeles%20California%20USA%20%289894308516%29.jpg",
  "machu pichu": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/1280px-Machu_Picchu%2C_Peru.jpg",
  "machu picchu": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/1280px-Machu_Picchu%2C_Peru.jpg",
  "ceres": proxiedRemoteImageUrl("https://static.wixstatic.com/media/d832cc_6aebeb1e54344fc4a7a679d62645db78~mv2.jpg/v1/fill/w_980%2Ch_588%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/d832cc_6aebeb1e54344fc4a7a679d62645db78~mv2.jpg"),
  "nobu": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
  "nobu los angeles": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
  "gary danko": proxiedRemoteImageUrl("https://garydanko.com/wp-content/uploads/garydanko/bg-about.jpg"),
  "gary dankok": proxiedRemoteImageUrl("https://garydanko.com/wp-content/uploads/garydanko/bg-about.jpg"),
  "willow osteria": proxiedRemoteImageUrl("https://ryx527b3ca.wpdns.site/wp-content/uploads/2025/12/IMG_9034-768x1024.jpg"),
  "willow osteria clovis": proxiedRemoteImageUrl("https://ryx527b3ca.wpdns.site/wp-content/uploads/2025/12/IMG_9034-768x1024.jpg"),
  "the french laundry": proxiedRemoteImageUrl("https://images.squarespace-cdn.com/content/v1/638931dddf47a848a9e6fa5b/1719259694095-52NCG4U8PBFU0AIVLX11/TheFrenchLaundry1-Restaurant-Bar-Napa-California.jpg"),
  "french laundry": proxiedRemoteImageUrl("https://images.squarespace-cdn.com/content/v1/638931dddf47a848a9e6fa5b/1719259694095-52NCG4U8PBFU0AIVLX11/TheFrenchLaundry1-Restaurant-Bar-Napa-California.jpg"),
  "french laudry": proxiedRemoteImageUrl("https://images.squarespace-cdn.com/content/v1/638931dddf47a848a9e6fa5b/1719259694095-52NCG4U8PBFU0AIVLX11/TheFrenchLaundry1-Restaurant-Bar-Napa-California.jpg"),
  "old quarter street wander hanoi": "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=900&q=80",
  "old quarter street wander, hanoi": "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=900&q=80",
  "the marble mountains": "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80",
  "ba na hills": "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=900&q=80",
  "pho bo for breakfast": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=900&q=80",
  "pho bo breakfast": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=900&q=80",
};

const TITLE_TYPE_OVERRIDES = {
  "chanel classic flap": "products",
  "chanel classic flip": "products",
  "din tai fung": "restaurants",
  "willow osteria": "restaurants",
  "nobu": "restaurants",
  "nobu los angeles": "restaurants",
  "gary danko": "restaurants",
  "gary dankok": "restaurants",
  "the french laundry": "restaurants",
  "french laundry": "restaurants",
  "french laudry": "restaurants",
  "ceres": "restaurants",
  "hublot big bang": "products",
  "machu picchu": "destinations",
  "machu pichu": "destinations",
  "oldboy": "movies",
  "the italian job": "movies",
  "italian job": "movies",
};

const TITLE_PLACE_QUERY_OVERRIDES = {
  "nobu": "Nobu Los Angeles West Hollywood CA restaurant",
  "nobu los angeles": "Nobu Los Angeles West Hollywood CA restaurant",
  "gary danko": "Restaurant Gary Danko San Francisco CA",
  "french laundry": "The French Laundry Yountville CA",
  "the french laundry": "The French Laundry Yountville CA",
  "willow osteria": "Willow Osteria restaurant",
  "ceres": "Ceres restaurant",
  "pho bo for breakfast": "pho bo Hanoi Vietnam",
};

const TITLE_IMAGE_SEARCH_OVERRIDES = {
  "nobu": "Nobu Los Angeles West Hollywood restaurant exterior food",
  "nobu los angeles": "Nobu Los Angeles West Hollywood restaurant exterior food",
  "gary danko": "Restaurant Gary Danko San Francisco dining room",
  "french laundry": "The French Laundry Yountville restaurant exterior",
  "the french laundry": "The French Laundry Yountville restaurant exterior",
  "willow osteria": "Willow Osteria restaurant dining",
  "ceres": "Ceres restaurant dining",
  "pho bo for breakfast": "pho bo Hanoi Vietnam breakfast",
  "machu picchu": "Machu Picchu Peru travel destination",
  "machu pichu": "Machu Picchu Peru travel destination",
};

const NORMALIZED_TITLE_ALIASES = {
  "machu pichu": "machu picchu",
  "gary dankok": "gary danko",
  "french laudry": "french laundry",
  "restaurant gary danko": "gary danko",
  "gary danko san francisco": "gary danko",
  "the french laundry yountville": "the french laundry",
  "french laundry yountville": "french laundry",
  "willow osteria clovis": "willow osteria",
  "pho bo breakfast": "pho bo for breakfast",
};

const GENERIC_RESTAURANT_IMAGE_URLS = new Set([
  "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
]);
const GENERIC_RESTAURANT_IMAGE_LIST = Array.from(GENERIC_RESTAURANT_IMAGE_URLS);

const hashTitleIndex = (value = "", modulo = 1) => {
  const text = String(value || "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return modulo > 0 ? Math.abs(hash) % modulo : 0;
};

const normalizeLookupTitle = (value = "") => String(value)
  .trim()
  .toLowerCase()
  .replace(/^(visit|see|go to|stay at|eat at|try|explore)\s+/i, "")
  .replace(/^(the)\s+/i, "")
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const normalizeLookupTitleAlias = (value = "") => {
  const normalized = normalizeLookupTitle(value);
  return NORMALIZED_TITLE_ALIASES[normalized] || normalized;
};

const findTitleOverrideImage = (value = "") => {
  const normalizedTitle = normalizeLookupTitleAlias(value);
  if (!normalizedTitle) return "";

  for (const [key, imageUrl] of Object.entries(TITLE_IMAGE_OVERRIDES)) {
    const normalizedKey = normalizeLookupTitleAlias(key);
    if (!normalizedKey) continue;
    if (normalizedKey === normalizedTitle) return imageUrl;
  }

  const normalizedTokens = normalizedTitle.split(" ").filter(Boolean);
  let bestMatch = "";
  let bestScore = 0;

  for (const [key, imageUrl] of Object.entries(TITLE_IMAGE_OVERRIDES)) {
    const normalizedKey = normalizeLookupTitleAlias(key);
    if (!normalizedKey) continue;
    if (normalizedTitle.includes(normalizedKey) || normalizedKey.includes(normalizedTitle)) {
      const score = Math.max(normalizedKey.length, normalizedTitle.length) + 100;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = imageUrl;
      }
      continue;
    }
    const keyTokens = normalizedKey.split(" ").filter(Boolean);
    const sharedTokenCount = normalizedTokens.filter((token) => keyTokens.includes(token)).length;
    if (sharedTokenCount >= 2) {
      const score = sharedTokenCount * 10 + normalizedKey.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = imageUrl;
      }
    }
  }

  return bestMatch;
};

export const isFallbackRestaurantDreamImage = (item, url = "") => {
  if (!isRestaurantDream(item)) return false;
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl) return false;
  if (GENERIC_RESTAURANT_IMAGE_URLS.has(normalizedUrl)) return true;
  const titleOverrideImage = findTitleOverrideImage(
    String(
      item?.text
      || item?.label
      || item?.cardTitle
      || item?.title
      || item?.name
      || item?.dream
      || item?.destination_name
      || ""
    ).trim()
  );
  return Boolean(titleOverrideImage && normalizedUrl === String(titleOverrideImage).trim());
};

const resolveRawType = (item) => {
  const rawSourceType = String(item?.sourceType || "").trim().toLowerCase();
  if (rawSourceType) return rawSourceType;

  const rawType = String(item?.type || "").trim().toLowerCase();
  if (rawType && !["photo", "note", "label", "sticker", "checklist", "countdown"].includes(rawType)) {
    return rawType;
  }

  const rawCategory = String(item?.category || item?.categoryId || "").trim().toLowerCase();
  const rawEmoji = String(item?.emoji || "").trim();

  if (rawCategory === "fun" || rawCategory === "movies" || rawEmoji === "🎬") return "movies";
  if (rawCategory === "games" || rawEmoji === "🎲") return "games";
  if (rawCategory === "food" || ["🍜", "🍽️", "🍣", "🍕", "☕", "🍷", "🥐", "🍰"].includes(rawEmoji)) return "restaurants";
  if (rawCategory === "travel" || rawCategory === "places" || ["✈️", "🗺️", "🌍", "🏝️", "🏖️", "🏰"].includes(rawEmoji)) return "destinations";
  if (rawCategory === "adventure" || rawCategory === "experiences" || ["🥾", "⛰️", "🌄", "🏔️"].includes(rawEmoji)) return "hiking";
  if (rawCategory === "buy" || rawCategory === "shopping" || ["✨", "🛍️", "🛋️"].includes(rawEmoji)) return "products";

  return "";
};

export const readDirectDreamImageUrl = (item) => {
  const readFromObject = (candidate) => {
    if (!candidate || typeof candidate !== "object") return "";
    for (const field of DIRECT_IMAGE_FIELDS) {
      const value = normalizeDreamImageUrl(candidate?.[field]);
      if (value) return value;
    }
    return normalizeDreamImageUrl(
      candidate?.photos?.[0]?.url
      || candidate?.photos?.[0]?.photoUrl
      || candidate?.photos?.[0]?.photo_url
    );
  };

  const topLevel = readFromObject(item);
  if (topLevel) return topLevel;

  const metaImage = readFromObject(item?.meta);
  if (metaImage) return metaImage;

  const sources = Array.isArray(item?.sources) ? item.sources : [];
  for (const source of sources) {
    if (typeof source === "string") {
      const value = normalizeDreamImageUrl(source);
      if (value) return value;
      continue;
    }
    const sourceImage = readFromObject(source);
    if (sourceImage) return sourceImage;
  }

  return "";
};

export const normalizeDreamCategory = (item) => {
  const rawCategory = String(item?.category || item?.categoryId || "").trim().toLowerCase();
  return DREAM_CATEGORY_MAP[rawCategory] || rawCategory || "travel";
};

export const resolveDreamContentType = (item) => {
  const rawType = resolveRawType(item);
  const category = normalizeDreamCategory(item);
  const rawCategoryId = String(item?.categoryId || "").trim().toLowerCase();
  const title = String(
    item?.text
    || item?.label
    || item?.cardTitle
    || item?.title
    || item?.name
    || item?.dream
    || item?.destination_name
    || ""
  ).trim().toLowerCase();
  const normalizedTitle = normalizeLookupTitleAlias(title);
  const titleTypeOverride = TITLE_TYPE_OVERRIDES[normalizedTitle];
  if (titleTypeOverride) return titleTypeOverride;

  if (rawType === "destinations") return "destinations";
  if (rawType === "products" || rawType === "dreamshelf") return "products";
  if (rawType === "restaurants") return "restaurants";
  if (rawType === "hiking") return "hiking";
  if (rawType === "movies") return "movies";
  if (rawType === "games") return "games";

  if (rawCategoryId === "places" || category === "travel") return "destinations";
  if (rawCategoryId === "food" || category === "food") return "restaurants";
  if (rawCategoryId === "experiences" || category === "adventure") return "hiking";
  if (rawCategoryId === "buy" || category === "buy") return "products";

  if (/(disneyland|disney world|orlando|anaheim|boston|iceland|northern lights|mountains|mountain|beach|bay|park|island|islands|coast|canyon|falls|temple|resort|hotel|hyatt)/.test(title)) return "destinations";
  if (/(din tai fung|nobu|brodard|oiza|kitchen|bbq|grill|cafe|coffee|ramen|sushi|pizza|restaurant|eatery|bistro|diner|osteria|trattoria)/.test(title)) return "restaurants";
  if (/(ray-ban|meta|wayfarer|bag|handbag|flap|chanel|birkin|watch|hublot|big bang|bracelet|ring|shoes|sneakers|camera|whoop|oura|garmin|bike|paddle|purse)/.test(title)) return "products";
  if (/(oldboy|italian job|movie|film|criterion|screening)/.test(title)) return "movies";
  if (/(hike|trail|summit|peak|trek|climb|camp|adventure|skydiving|parasailing)/.test(title)) return "hiking";

  return "";
};

export const isRestaurantDream = (item) => resolveDreamContentType(item) === "restaurants";
export const isMovieDream = (item) => resolveDreamContentType(item) === "movies";

export const getDreamPlacePhotoQuery = (item) => {
  if (!isRestaurantDream(item)) return "";
  const title = String(
    item?.text
    || item?.label
    || item?.cardTitle
    || item?.title
    || item?.name
    || item?.dream
    || item?.destination_name
    || ""
  ).trim();
  const location = String(
    item?.location
    || item?.address
    || item?.mapQuery
    || ""
  ).trim();
  if (!title) return "";
  const normalizedTitle = normalizeLookupTitleAlias(title);
  const queryOverride = TITLE_PLACE_QUERY_OVERRIDES[normalizedTitle];
  if (queryOverride) return queryOverride;
  return `${title} restaurant ${location}`.trim();
};

export const getDreamImageSearchQuery = (item) => {
  const rawType = resolveRawType(item);
  const category = normalizeDreamCategory(item);
  const inferredType = resolveDreamContentType(item);
  const title = String(
    item?.text
    || item?.label
    || item?.cardTitle
    || item?.title
    || item?.name
    || item?.dream
    || item?.destination_name
    || ""
  ).trim();
  if (!title) return "";
  const normalizedTitle = normalizeLookupTitleAlias(title);
  const searchOverride = TITLE_IMAGE_SEARCH_OVERRIDES[normalizedTitle];
  if (searchOverride) return searchOverride;
  if (rawType === "games" || inferredType === "games") return `${title} board game box`;
  if (rawType === "movies" || inferredType === "movies") return `${title} movie poster`;
  if (rawType === "destinations" || inferredType === "destinations" || category === "travel") return `${title} travel destination`;
  if (rawType === "restaurants" || inferredType === "restaurants" || category === "food") return `${title} restaurant`;
  if (rawType === "hiking" || inferredType === "hiking" || category === "adventure") return `${title} landmark travel`;
  if (rawType === "products" || inferredType === "products" || category === "buy") return `${title} product`;
  return "";
};

const dedupeImageUrls = (urls = []) => {
  const seen = new Set();
  return urls.filter((url) => {
    const normalized = String(url || "").trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

export const resolveDreamImageCandidates = (item) => {
  const title = String(
    item?.text
    || item?.label
    || item?.cardTitle
    || item?.title
    || item?.name
    || item?.dream
    || item?.destination_name
    || ""
  ).trim();
  const restaurantDream = isRestaurantDream(item);
  const candidates = [];
  const queueCandidate = (url, options = {}) => {
    const { allowGenericRestaurant = false } = options;
    const normalized = String(url || "").trim();
    if (!normalized) return;
    if (!allowGenericRestaurant && isRestaurantDream(item) && GENERIC_RESTAURANT_IMAGE_URLS.has(normalized)) {
      return;
    }
    candidates.push(normalized);
  };
  const titleOverrideImage = findTitleOverrideImage(title);
  const titleOverrideType = resolveDreamContentType({ ...item, text: title, label: title, title });
  const titleOverrideIsRestaurantFallback = Boolean(
    restaurantDream
    && titleOverrideImage
    && titleOverrideType === "restaurants"
  );
  if (titleOverrideImage && !["restaurants", "products"].includes(titleOverrideType)) {
    return [String(titleOverrideImage).trim()];
  }

  if (titleOverrideIsRestaurantFallback) {
    queueCandidate(titleOverrideImage, { allowGenericRestaurant: true });
  }

  const directImageUrl = readDirectDreamImageUrl(item);
  const catalogImageUrl = findExploreCatalogImageUrlByTitle(title);
  const shouldSkipStaticRestaurantFallback = restaurantDream && (
    (titleOverrideImage && directImageUrl === String(titleOverrideImage).trim())
    || GENERIC_RESTAURANT_IMAGE_URLS.has(String(directImageUrl || "").trim())
  );
  if (directImageUrl && !shouldSkipStaticRestaurantFallback) queueCandidate(directImageUrl);

  const destinationOverrideImage = getDestinationImageOverride({
    id: item?.id,
    name: title,
    destination_name: title,
    cardTitle: title,
    title,
  });
  if (destinationOverrideImage && !restaurantDream) queueCandidate(destinationOverrideImage);

  if (catalogImageUrl && !restaurantDream) queueCandidate(catalogImageUrl);
  if (titleOverrideImage && !restaurantDream) {
    queueCandidate(titleOverrideImage, {
      allowGenericRestaurant: true,
    });
  }

  const exploreType = resolveDreamContentType(item);
  if (exploreType && exploreType !== "restaurants") {
    queueCandidate(getExploreCardImageUrl({
      type: exploreType,
      cardTitle: title,
      title,
      name: title,
      destination_name: title,
      location: String(item?.location || item?.mapQuery || "").trim(),
      imageUrl: String(item?.imageUrl || item?.image_url || "").trim(),
      destination_image: String(item?.destination_image || "").trim(),
      photo: String(item?.photo || "").trim(),
    }, ""));
  }

  return dedupeImageUrls(candidates);
};

export const resolveDreamImage = (item) => resolveDreamImageCandidates(item)[0] || "";
