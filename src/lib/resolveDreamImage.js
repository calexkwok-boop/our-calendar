import { findExploreCatalogImageUrlByTitle, getExploreCardImageUrl } from "../components/ExplorePage";
import { getDestinationImageOverride } from "../data/destinationImageOverrides";

const DIRECT_IMAGE_FIELDS = [
  "photo",
  "image",
  "image_url",
  "imageUrl",
  "destination_image",
  "photo_url",
  "photoUrl",
  "cover_photo",
  "coverPhoto",
  "attachment_url",
  "attachmentUrl",
];

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
  "old quarter street wander hanoi": "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=900&q=80",
  "old quarter street wander, hanoi": "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=900&q=80",
  "the marble mountains": "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80",
  "ba na hills": "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=900&q=80",
  "pho bo for breakfast": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=900&q=80",
};

const TITLE_TYPE_OVERRIDES = {
  "chanel classic flap": "products",
  "chanel classic flip": "products",
  "oldboy": "movies",
  "the italian job": "movies",
  "italian job": "movies",
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
  for (const field of DIRECT_IMAGE_FIELDS) {
    const value = String(item?.[field] || "").trim();
    if (value) return value;
  }
  return String(item?.photos?.[0]?.url || "").trim();
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
  const normalizedTitle = normalizeLookupTitle(title);
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
  if (/(din tai fung|nobu|brodard|oiza|kitchen|bbq|grill|cafe|coffee|ramen|sushi|pizza|restaurant|eatery|bistro|diner)/.test(title)) return "restaurants";
  if (/(ray-ban|meta|wayfarer|bag|handbag|flap|chanel|birkin|watch|bracelet|ring|shoes|sneakers|camera|whoop|oura|garmin|bike|paddle|purse)/.test(title)) return "products";
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
  const titleKey = title.toLowerCase();
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
  if (TITLE_IMAGE_OVERRIDES[titleKey]) queueCandidate(TITLE_IMAGE_OVERRIDES[titleKey]);

  const directImageUrl = readDirectDreamImageUrl(item);
  const catalogImageUrl = findExploreCatalogImageUrlByTitle(title);
  if (directImageUrl) queueCandidate(directImageUrl);

  const destinationOverrideImage = getDestinationImageOverride({
    id: item?.id,
    name: title,
    destination_name: title,
    cardTitle: title,
    title,
  });
  if (destinationOverrideImage) queueCandidate(destinationOverrideImage);

  const normalizedTitle = normalizeLookupTitle(title);
  const titleOverrideEntry = Object.entries(TITLE_IMAGE_OVERRIDES).find(([key]) => (
    normalizeLookupTitle(key) === normalizedTitle
  ));
  if (titleOverrideEntry?.[1]) queueCandidate(titleOverrideEntry[1]);

  if (catalogImageUrl) queueCandidate(catalogImageUrl);

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

  if (isRestaurantDream(item) && candidates.length === 0 && GENERIC_RESTAURANT_IMAGE_LIST.length > 0) {
    queueCandidate(
      GENERIC_RESTAURANT_IMAGE_LIST[hashTitleIndex(title, GENERIC_RESTAURANT_IMAGE_LIST.length)],
      { allowGenericRestaurant: true }
    );
  }

  return dedupeImageUrls(candidates);
};

export const resolveDreamImage = (item) => resolveDreamImageCandidates(item)[0] || "";
