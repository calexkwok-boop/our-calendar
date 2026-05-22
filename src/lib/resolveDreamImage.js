import { getExploreCardImageUrl } from "../components/ExplorePage";

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

const resolveRawType = (item) => {
  const rawType = String(item?.type || item?.sourceType || "").trim().toLowerCase();
  if (rawType) return rawType;
  const rawCategory = String(item?.category || item?.categoryId || "").trim().toLowerCase();
  const rawEmoji = String(item?.emoji || "").trim();
  if (rawCategory === "fun" || rawCategory === "movies" || rawEmoji === "🎬") return "movies";
  if (rawCategory === "games" || rawEmoji === "🎲") return "games";
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

const inferExploreType = (item) => {
  const rawType = resolveRawType(item);
  const category = normalizeDreamCategory(item);
  const rawCategoryId = String(item?.categoryId || "").trim().toLowerCase();

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

  return "";
};

export const getDreamImageSearchQuery = (item) => {
  const rawType = resolveRawType(item);
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
  if (rawType === "games") return `${title} board game box`;
  if (rawType === "movies") return `${title} movie poster`;
  return "";
};

export const resolveDreamImage = (item) => {
  const directImageUrl = readDirectDreamImageUrl(item);
  const exploreType = inferExploreType(item);
  if (!exploreType) return directImageUrl;

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

  return getExploreCardImageUrl({
    type: exploreType,
    cardTitle: title,
    title,
    name: title,
    destination_name: title,
    location: String(item?.location || item?.mapQuery || "").trim(),
    imageUrl: String(item?.imageUrl || item?.image_url || "").trim(),
    destination_image: String(item?.destination_image || "").trim(),
    photo: String(item?.photo || "").trim(),
  }, directImageUrl || "");
};
