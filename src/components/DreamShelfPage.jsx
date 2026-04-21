import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Camera } from "lucide-react";
import { supabase } from "../supabaseClient";

// ─── Color tokens ─────────────────────────────────────────────────────────────
// Someday palette: Oat, Linen, Stone, Amber, Char.
const OAT          = "#F0E6D6";
const LINEN        = "#FAF6F0";
const STONE        = "#8A8178";
const STONE_LIGHT  = "#D4C9BB";
const STONE_MUTED  = "rgba(138,129,120,0.12)";
const CHAR         = "#2A2420";
const CHAR_SOFT    = "#3E3630";
const AMBER        = "#C88435";
const AMBER_DARK   = "#8B5725";
const AMBER_MUTED  = "rgba(200,132,53,0.10)";
const AMBER_BORDER = "rgba(200,132,53,0.28)";
const TEAL        = "#0d9488";
const TEAL_MUTED  = "rgba(13,148,136,0.10)";
const TEAL_BORDER = "rgba(13,148,136,0.30)";
const LAVENDER_LIGHT = "#f5f3ff";
const LAVENDER_DARK_BG = "rgba(168,85,247,0.10)";
const LAVENDER_BORDER = "rgba(168,85,247,0.25)";
const LAVENDER_TEXT = "#7c3aed";
const LAVENDER_TEXT_DARK = "#c4b5fd";

const getDreamShelfImageKey = (item = {}) => (
  item.id ||
  item.product_name ||
  item.name ||
  `${item.product_brand || item.brand || ""}-${item.product_name || item.name || ""}`
).toString();

const getDreamShelfImageQuery = (item = {}) => [
  item.imageQuery,
  item.product_brand || item.brand,
  item.product_name || item.name,
  item.category,
  "lifestyle",
].filter(Boolean).join(" ");

const isDreamShelfWeakImageUrl = (url = "") => (
  /source\.unsplash\.com\/featured/i.test(String(url || ""))
);

const getDreamShelfCategoryMeta = (categoryId) => (
  CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
);

const inferDreamShelfCategory = (text = "") => {
  const q = text.toLowerCase();
  if (/(watch|rolex|omega|patek|audemars|cartier santos|iwc|tag heuer|daytona|submariner|hublot|big bang)/.test(q)) return "watches";
  if (/(bag|purse|tote|birkin|kelly|chanel|celine|prada|bottega|louis vuitton|gucci)/.test(q)) return "bags";
  if (/(ring|bracelet|necklace|earring|jewelry|jewellery|tiffany|van cleef|love bracelet)/.test(q)) return "jewelry";
  if (/(sneaker|shoe|jordan|nike|adidas|new balance|common projects|dunk|samba)/.test(q)) return "sneakers";
  if (/(golf|putter|driver|iron|scotty|taylormade|titleist)/.test(q)) return "golf";
  if (/(cookware|cooking|kitchen|dutch oven|le creuset|espresso|breville|coffee machine)/.test(q)) return "kitchen";
  if (/(camera|guitar|piano|art|leica|fender|gibson)/.test(q)) return "hobbies";
  if (/(whiskey|whisky|bourbon|macallan|yamazaki|hibiki|pappy|van winkle|clase azul|don julio|cognac|louis xiii)/.test(q)) return "whiskey";
  if (/(wine|champagne|cellar|bordeaux|burgundy)/.test(q)) return "cellar";
  if (/(ski|bike|snowboard|tent|kayak|adventure)/.test(q)) return "adventure";
  return "watches";
};

const getDreamShelfFallbackDescription = (query = "") => (
  `A searched Someday find for "${query}". Add your own photo if this is the exact piece you want to save.`
);

const DREAMSHELF_IMAGES = {
  w1: "https://media.rolex.com/image/upload/q_auto/f_auto/t_v7-cover-majesty-landscape/c_limit,w_1200/v1/a677b2c664f6/catalogue/2026/upright-c/m124060-0001",
  w2: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&q=80",
  w3: "https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguet/lbv3_RO_collection?size=1920,0&wid=1920&fmt=avif-alpha&dpr=off",
  w4: "https://www.omegawatches.com/media/catalog/product/o/m/omega-speedmaster-moonwatch-professional-co-axial-master-chronometer-chronograph-42-mm-31030425001001-3ccf4a.png?w=900",
  w5: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&q=80",
  w6: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
  w7: "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?w=600&q=80",
  w8: "https://img.iwc.com/cluster-overview-lg-2/o-dpr-2/e6a2f75233ae6901b6842c6abe142d6834ebf5fc.jpg",
  w9: "https://source.unsplash.com/featured/?luxury,watch,hublot,black,gold,wrist",
  b1: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
  b2: "https://assets.hermes.com/is/image/hermesedito/P_11_Birkin_2018?fit=wrap%2C0&wid=1920&resMode=sharp2&op_usm=1%2C1%2C6%2C0",
  b3: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80",
  b4: "https://image.celine.com/4f155e4444f81751/original/L102H3J20-27RE_1_SUM26_W_V1.jpg?im=Resize=(1200)",
  b5: "https://bottega-veneta.dam.kering.com/asset/f218add7-b810-4d7e-8617-cea4a2e50434/Large/766016VCPP14181_A.jpg?v=2",
  b6: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
  b7: "https://www.prada.com/content/dam/pradabkg_products/1/1BA/1BA457/NZVF0046/1BA457_NZV_F0046_V_EOM_SLF.jpg/_jcr_content/renditions/cq5dam.web.hebebed.1200.1200.jpg",
  b8: "https://assets.hermes.com/is/image/hermesedito/P_169_KELLY_HEADER?fit=wrap%2C0&wid=1920&resMode=sharp2&op_usm=1%2C1%2C6%2C0",
  g1: "https://source.unsplash.com/featured/?golf,putter,green,course,lifestyle",
  g2: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600&q=80",
  g3: "https://images.unsplash.com/photo-1530028828-25e8270793c5?w=600&q=80",
  g4: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&q=80",
  g5: "https://images.unsplash.com/photo-1592919505780-303950717480?w=600&q=80",
  g6: "https://images.unsplash.com/photo-1562204320-31975a5e09c4?w=600&q=80",
  g7: "https://source.unsplash.com/featured/?golf,driver,club,course,luxury,golfing",
  g8: "https://source.unsplash.com/featured/?golf,bag,clubs,course,sunrise",
  j1: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
  j2: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
  j3: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
  j4: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&q=80",
  j5: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
  j6: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80",
  j7: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&q=80",
  j8: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
  s1: "https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Chicago-Reimagined-Product.jpg?fit=fill&bg=FFFFFF&w=140&h=75&q=57&dpr=2&trim=color&updated_at=1738193358",
  s2: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQhynJlN1yrf037AvDWWDJYI5wC6c8CMshpSyIYM1g90oPfwzSlqUr25x1gNiQSmlfjKeIIxZYrJEfmubsRbgcK54vE7L_ZewlPuLmYVAlPnODL85ERZwoW",
  s3: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80",
  s4: "data:image/webp;base64,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",
  s5: "https://images.unsplash.com/photo-1584735174914-6b1272458e3e?w=600&q=80",
  s6: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80",
  s7: "https://www.mrporter.com/variants/images/3024088872901549/in/w2000_q60.jpg",
  s8: "https://images.unsplash.com/photo-1606813902770-34e9a1c5b1c5?w=600&q=80",
  a1: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=600&q=80",
  a2: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=600&q=80",
  a3: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&q=80",
  a4: "https://images.unsplash.com/photo-1508973379184-7517410fb0c9?w=600&q=80",
  a5: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
  a6: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=600&q=80",
  a7: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80",
  a8: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80",
  a9: "https://source.unsplash.com/featured/?parasailing,sunset,ocean",
  a10: "https://source.unsplash.com/featured/?skydiving,clouds,gopro",
  a11: "https://source.unsplash.com/featured/?bungee,jump,canyon,river",
  h1: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80",
  h2: "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?w=600&q=80",
  h3: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
  h4: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&q=80",
  h5: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80",
  h6: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
  h7: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&q=80",
  h8: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&q=80",
  h9: "https://source.unsplash.com/featured/?dutch,oven,cooking,kitchen,cozy",
  h10: "https://source.unsplash.com/featured/?espresso,machine,home,coffee,barista",
  c1: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
  c2: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&q=80",
  c3: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&q=80",
  c4: "https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=600&q=80",
  c5: "https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=600&q=80",
  c6: "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=600&q=80",
  c7: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=600&q=80",
  c8: "https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=600&q=80",
  wh1: "https://source.unsplash.com/featured/?macallan,whisky,scotch,bottle,warm,bar",
  wh2: "https://source.unsplash.com/featured/?yamazaki,japanese,whisky,bottle,minimal",
  wh3: "https://source.unsplash.com/featured/?hibiki,whisky,glass,decanter,japanese",
  wh4: "https://source.unsplash.com/featured/?bourbon,rare,whiskey,bottle,wood,shelf",
  wh5: "https://source.unsplash.com/featured/?clase,azul,tequila,ceramic,bottle,luxury",
  wh6: "https://source.unsplash.com/featured/?don,julio,tequila,bottle,elegant,bar",
  wh7: "https://source.unsplash.com/featured/?louis,xiii,cognac,decanter,luxury,crystal",
};

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "watches",   label: "Watches",    emoji: "⌚" },
  { id: "bags",      label: "Bags",       emoji: "👜" },
  { id: "jewelry",   label: "Jewelry",    emoji: "💍" },
  { id: "golf",      label: "Golf",       emoji: "⛳" },
  { id: "sneakers",  label: "Sneakers",   emoji: "👟" },
  { id: "hobbies",   label: "Hobbies",    emoji: "🎸" },
  { id: "kitchen",   label: "Kitchen",    emoji: "🍳" },
  { id: "cellar",    label: "Cellar",     emoji: "🍷" },
  { id: "whiskey",   label: "Whiskey",    emoji: "🥃" },
  { id: "adventure", label: "Adventure",  emoji: "🎿" },
];

const DREAM_WORLDS = [
  {
    id: "style",
    label: "Style",
    title: "Quiet choices, your identity",
    emoji: "✦",
    categoryIds: ["watches", "bags", "jewelry", "sneakers"],
  },
  {
    id: "pursuits",
    label: "Pursuits",
    title: "The things that draw you in",
    emoji: "⛰️",
    categoryIds: ["golf", "adventure", "hobbies"],
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    title: "The rhythm of your life",
    emoji: "☕",
    categoryIds: ["hobbies", "kitchen"],
  },
  {
    id: "collection",
    label: "Collection",
    title: "Built over time",
    emoji: "🍷",
    categoryIds: ["watches", "sneakers", "cellar", "whiskey"],
  },
];

const getDreamWorldForCategory = (categoryId) => (
  DREAM_WORLDS.find(world => world.categoryIds.includes(categoryId)) || null
);

// ─── Sub-filters per category ─────────────────────────────────────────────────
const SUB_FILTERS = {
  watches: [
    { id: "all",      label: "All"      },
    { id: "everyday", label: "Everyday" },
    { id: "sport",    label: "Sport"    },
    { id: "dress",    label: "Dress"    },
    { id: "grail",    label: "Grail"    },
    { id: "timeless", label: "Timeless" },
  ],
  bags: [
    { id: "all",       label: "All"       },
    { id: "everyday",  label: "Everyday"  },
    { id: "statement", label: "Statement" },
    { id: "travel",    label: "Travel"    },
    { id: "iconic",    label: "Iconic"    },
  ],
  jewelry: [
    { id: "all",       label: "All"       },
    { id: "everyday",  label: "Everyday"  },
    { id: "devotion",  label: "Devotion"  },
    { id: "heirloom",  label: "Heirloom"  },
    { id: "statement", label: "Statement" },
    { id: "gold",      label: "Warm Gold" },
  ],
  golf: [
    { id: "all",      label: "All"             },
    { id: "weekend",  label: "Weekend Rounds"  },
    { id: "practice", label: "Practice Ritual" },
    { id: "course",   label: "Dream Course"    },
    { id: "setup",    label: "The Bag"         },
  ],
  sneakers: [
    { id: "all",      label: "All"       },
    { id: "everyday", label: "Everyday"  },
    { id: "grail",    label: "Grail"     },
    { id: "classic",  label: "Classic"   },
    { id: "collab",   label: "Collab"    },
  ],
  hobbies: [
    { id: "all",      label: "All"       },
    { id: "creative", label: "Creative"  },
    { id: "ritual",   label: "Ritual"    },
    { id: "studio",   label: "Studio"    },
    { id: "drive",    label: "Drive"     },
  ],
  kitchen: [
    { id: "all",      label: "All"       },
    { id: "cooking",  label: "Cooking"   },
    { id: "coffee",   label: "Coffee"    },
    { id: "ritual",   label: "Ritual"    },
  ],
  cellar: [
    { id: "all",         label: "All"          },
    { id: "dinner",      label: "Dinner Table" },
    { id: "celebration", label: "Celebration"  },
    { id: "cellar",      label: "Cellar Build" },
    { id: "rare",        label: "Special Bottle" },
  ],
  whiskey: [
    { id: "all",      label: "All"          },
    { id: "neat",     label: "Neat Pour"    },
    { id: "japanese", label: "Japanese"     },
    { id: "bourbon",  label: "Bourbon"      },
    { id: "tequila",  label: "Tequila"      },
    { id: "cognac",   label: "Cognac"       },
  ],
  adventure: [
    { id: "all",      label: "All"       },
    { id: "mountain", label: "Mountain"  },
    { id: "climb",    label: "Climb"     },
    { id: "ride",     label: "Ride"      },
    { id: "water",    label: "Water"     },
    { id: "gear",     label: "Ready Bag" },
  ],
};

// ─── Curated items per category ───────────────────────────────────────────────
const CURATED_ITEMS = {
  watches: [
    { id: "w1",  name: "Rolex Submariner",           brand: "Rolex",   priceRange: "$9,000–$14,000",  subFilter: ["rolex","sport","5k15k"],  emoji: "⌚", description: "The watch people save for a decade and wear for a lifetime. Timeless, waterproof, and worth every penny." },
    { id: "w2",  name: "Patek Philippe Nautilus",     brand: "Patek",   priceRange: "$40,000+",         subFilter: ["patek","sport","15kp"],   emoji: "⌚", description: "The grail. A waiting list most people never reach. If you get one, you've earned a story." },
    { id: "w3",  name: "Audemars Piguet Royal Oak",   brand: "AP",      priceRange: "$25,000+",         subFilter: ["sport","15kp"],           emoji: "⌚", description: "Octagonal bezel, integrated bracelet, and a design so bold it still looks futuristic fifty years later." },
    { id: "w4",  name: "Omega Speedmaster Professional", brand: "Omega", priceRange: "$6,000–$8,000",  subFilter: ["omega","sport","5k15k"],  emoji: "⌚", description: "The watch that went to the moon. NASA-certified and still the most storied chronograph ever made." },
    { id: "w5",  name: "Rolex Daytona",               brand: "Rolex",   priceRange: "$15,000–$30,000",  subFilter: ["rolex","sport","15kp"],   emoji: "⌚", description: "Made for racing, coveted by everyone else. The Paul Newman dial alone is worth googling." },
    { id: "w6",  name: "Cartier Santos",               brand: "Cartier", priceRange: "$6,000–$9,000",   subFilter: ["dress","5k15k"],          emoji: "⌚", description: "The world's first wristwatch, made for an aviator in 1904. Still the most elegant thing on a wrist." },
    { id: "w7",  name: "TAG Heuer Carrera",            brand: "TAG",     priceRange: "$3,000–$6,000",   subFilter: ["sport","u5k"],            emoji: "⌚", description: "Race-bred, beautifully legible, and the entry point into serious watchmaking." },
    { id: "w8",  name: "IWC Portugieser Chronograph",  brand: "IWC",     priceRange: "$8,000–$12,000",  subFilter: ["dress","5k15k"],          emoji: "⌚", description: "Clean, architectural, and quietly perfect. The watch for people who know watches." },
    { id: "w9",  name: "Hublot Big Bang",              brand: "Hublot",  priceRange: "$8,000-$18,000",   subFilter: ["sport","5k15k"],          emoji: "⌚", description: "Bold case architecture, rubber strap energy, and a wrist presence that refuses to be quiet." },
  ],
  bags: [
    { id: "b1",  name: "Chanel Classic Flap",         brand: "Chanel",  priceRange: "$8,000–$10,000",  subFilter: ["chanel","shoulder","5kp"],emoji: "👜", description: "The most iconic bag ever made. Quilted leather, gold chain, and a logo that needs no introduction." },
    { id: "b2",  name: "Hermès Birkin",                brand: "Hermès",  priceRange: "$10,000–$500,000+",subFilter: ["hermes","tote","5kp"],    emoji: "👜", description: "You can't just buy one. You earn the right to buy one. That's the point." },
    { id: "b3",  name: "Louis Vuitton Neverfull",      brand: "LV",      priceRange: "$1,800–$2,500",   subFilter: ["lv","tote","2k5k"],       emoji: "👜", description: "The tote that never goes out of style. A first serious bag for many, a forever bag for most." },
    { id: "b4",  name: "Celine Bucket Bag",            brand: "Celine",  priceRange: "$2,500–$3,500",   subFilter: ["shoulder","2k5k"],        emoji: "👜", description: "Minimalist, structured, and quietly superior. The anti-logo luxury bag." },
    { id: "b5",  name: "Bottega Veneta Andiamo",       brand: "Bottega", priceRange: "$4,500–$7,000",   subFilter: ["shoulder","2k5k"],        emoji: "👜", description: "The intrecciato weave is so recognizable it doesn't need a logo. That's the flex." },
    { id: "b6",  name: "Gucci Dionysus",               brand: "Gucci",   priceRange: "$2,000–$3,500",   subFilter: ["shoulder","2k5k"],        emoji: "👜", description: "Tiger head clasp, GG web strap, and the energy of someone who knows exactly who they are." },
    { id: "b7",  name: "Prada Galleria",               brand: "Prada",   priceRange: "$3,000–$7,000",   subFilter: ["shoulder","2k5k"],        emoji: "👜", description: "Nylon and a triangle logo. Somehow still the coolest bag in the room every time." },
    { id: "b8",  name: "Hermès Kelly",                 brand: "Hermès",  priceRange: "$8,000–$20,000",  subFilter: ["hermes","5kp"],           emoji: "👜", description: "Grace Kelly made it famous in 1956 and it hasn't aged a day since. A true forever bag." },
  ],
  jewelry: [
    { id: "j1",  name: "Cartier Love Bracelet",        brand: "Cartier", priceRange: "$5,000–$7,000",   subFilter: ["cartier","everyday","gold"],emoji: "💍", description: "Screwed shut with a tiny screwdriver. Made for wearing forever. The ultimate symbol of devotion." },
    { id: "j2",  name: "Van Cleef & Arpels Alhambra", brand: "Van Cleef",priceRange: "$2,500–$6,000",  subFilter: ["everyday","gold"],        emoji: "💍", description: "Four-leaf clover motif in gold and mother-of-pearl. The piece that whispers luxury without screaming it." },
    { id: "j3",  name: "Tiffany T Wire Bracelet",      brand: "Tiffany", priceRange: "$800–$1,500",     subFilter: ["tiffany","everyday","gold"],emoji: "💍", description: "The modern Tiffany icon. Thin, architectural, and the kind of thing you never take off." },
    { id: "j4",  name: "Cartier Juste un Clou",        brand: "Cartier", priceRange: "$3,500–$5,500",   subFilter: ["cartier","everyday"],     emoji: "💍", description: "A nail bent into a bracelet. The best proof that simplicity is the ultimate luxury." },
    { id: "j5",  name: "David Yurman Infinity Band",   brand: "Yurman",  priceRange: "$600–$1,200",     subFilter: ["everyday","anniversary"], emoji: "💍", description: "The cable bracelet that defined a generation of American fine jewelry. Instantly recognizable." },
    { id: "j6",  name: "Bvlgari Serpenti",             brand: "Bvlgari", priceRange: "$3,000–$8,000",   subFilter: ["anniversary"],            emoji: "💍", description: "A coiled serpent in gold and gemstones. The most dramatic thing you'll ever put on your wrist." },
    { id: "j7",  name: "Mikimoto Pearl Strand",        brand: "Mikimoto",priceRange: "$1,500–$5,000",   subFilter: ["anniversary","gold"],     emoji: "💍", description: "The original pearl jeweler, still the best. A strand of Mikimoto pearls is an heirloom from day one." },
    { id: "j8",  name: "Harry Winston Round Diamond Solitaire", brand: "Harry Winston", priceRange: "$10,000+", subFilter: ["anniversary"], emoji: "💍", description: "The King of Diamonds. When the moment demands something truly extraordinary." },
  ],
  golf: [
    { id: "g1",  name: "Scotty Cameron Newport 2",     brand: "Scotty Cameron",priceRange: "$400–$600",  subFilter: ["putters","u500"],         emoji: "⛳", image: DREAMSHELF_IMAGES.g1, description: "The putter Tour pros hoard and collectors obsess over. Feel unlike anything else on the green." },
    { id: "g2",  name: "Titleist TSR3 Driver",         brand: "Titleist",priceRange: "$550–$650",        subFilter: ["drivers","500_2k"],       emoji: "⛳", image: DREAMSHELF_IMAGES.g2, description: "The driver that the best players in the world trust when it actually matters." },
    { id: "g3",  name: "Callaway Paradym Custom Irons",brand: "Callaway",priceRange: "$1,500–$2,500",   subFilter: ["irons","500_2k"],         emoji: "⛳", image: DREAMSHELF_IMAGES.g3, description: "Custom fit, custom look. The set you commission when you're serious about the game." },
    { id: "g4",  name: "Ping G430 Full Set",           brand: "Ping",    priceRange: "$2,500–$3,500",   subFilter: ["sets","2kp"],             emoji: "⛳", image: DREAMSHELF_IMAGES.g4, description: "The complete bag upgrade. Everything matched, everything fitted, everything right." },
    { id: "g5",  name: "Round at Pebble Beach",        brand: "Pebble Beach",priceRange: "$600–$1,000",  subFilter: ["exp","500_2k"],           emoji: "⛳", image: DREAMSHELF_IMAGES.g5, description: "The 18th green borders the Pacific Ocean. One of the greatest rounds of golf anyone will ever play." },
    { id: "g7",  name: "TaylorMade Stealth 2 HD Driver",brand: "TaylorMade",priceRange: "$450–$600",    subFilter: ["drivers","u500"],         emoji: "⛳", image: DREAMSHELF_IMAGES.g7, description: "Carbon face technology that genuinely changes what a golf ball can do in the air." },
    { id: "g8",  name: "FootJoy Tour Setup Bag",       brand: "FootJoy", priceRange: "$350–$500",        subFilter: ["u500"],                   emoji: "⛳", image: DREAMSHELF_IMAGES.g8, description: "The bag that says you take this seriously. Organized, beautiful, and built for the long game." },
  ],
  sneakers: [
    { id: "s1",  name: "Air Jordan 1 Retro High OG",   brand: "Nike/Jordan",priceRange: "$170–$2,000+", subFilter: ["jordan","grail"],         emoji: "👟", description: "The shoe that started everything. Every colorway tells a story. The grail for a reason." },
    { id: "s2",  name: "Nike x Sacai LDWaffle",        brand: "Nike",    priceRange: "$180–$800+",       subFilter: ["collab","grail"],         emoji: "👟", description: "Double swoosh, deconstructed design, and the collab that changed what a running shoe could be." },
    { id: "s3",  name: "Adidas Samba OG",              brand: "Adidas",  priceRange: "$100–$130",        subFilter: ["adidas"],                 emoji: "👟", description: "The 1950s indoor soccer shoe that somehow became the shoe of the decade. Again." },
    { id: "s4",  name: "New Balance 550",              brand: "New Balance",priceRange: "$110–$140",     subFilter: ["collab"],                 emoji: "👟", description: "Aime Leon Dore put these back on the map and now everyone wants a pair. Deservedly." },
    { id: "s5",  name: "Air Max 97 Silver Bullet",     brand: "Nike",    priceRange: "$175–$500+",       subFilter: ["nike","grail"],           emoji: "👟", description: "Full-length air unit and a silver upper inspired by bullet trains. Still the best Air Max ever." },
    { id: "s6",  name: "Jordan 4 Retro",               brand: "Jordan",  priceRange: "$200–$1,000+",     subFilter: ["jordan","grail"],         emoji: "👟", description: "The shoe from Do the Right Thing. Every retro release sells out in minutes. For good reason." },
    { id: "s7",  name: "Common Projects Achilles Low", brand: "Common Projects", priceRange: "$500–$750", subFilter: ["grail"],                  emoji: "👟", description: "Minimal, Italian-made, and quietly iconic. The white sneaker that makes everything look more considered." },
    { id: "s8",  name: "Nike Dunk Low Panda",          brand: "Nike",    priceRange: "$110–$200+",       subFilter: ["nike"],                   emoji: "👟", description: "Black and white, simple as it gets, and somehow still the hardest dunk to keep in stock." },
  ],
  hobbies: [
    { id: "h1",  name: "Gibson Les Paul Standard",     brand: "Gibson",  priceRange: "$2,500–$4,000",   subFilter: ["music"],                  emoji: "🎸", description: "The guitar Page, Slash, and Clapton chose. If you're going to learn, learn on the real thing." },
    { id: "h2",  name: "Leica M11 Rangefinder",        brand: "Leica",   priceRange: "$8,000–$10,000",  subFilter: ["camera"],                 emoji: "📷", description: "The camera Cartier-Bresson used. Manual, quiet, and the reason photographers make pilgrimages to Wetzlar." },
    { id: "h3",  name: "Porsche 911 Carrera",          brand: "Porsche", priceRange: "$110,000+",        subFilter: ["auto"],                   emoji: "🏎️", description: "Sixty years of the same shape, infinitely refined. The car that rewards the driver who learns it." },
    { id: "h4",  name: "Steinway Model O Grand Piano", brand: "Steinway",priceRange: "$60,000–$90,000", subFilter: ["music"],                  emoji: "🎹", description: "Every concert hall has one. If you're going to have a piano in your home, have this piano." },
    { id: "h5",  name: "Hasselblad X2D 100C",          brand: "Hasselblad",priceRange: "$8,000–$10,000",subFilter: ["camera"],                 emoji: "📷", description: "Medium format. 100 megapixels. The camera that makes professional photographers emotional." },
    { id: "h6",  name: "Fender Custom Shop Stratocaster",brand: "Fender",priceRange: "$3,000–$6,000",  subFilter: ["music"],                  emoji: "🎸", description: "Built by master builders in Corona, California. The instrument you commission, not just buy." },
    { id: "h7",  name: "Ferrari 488 GTB",              brand: "Ferrari", priceRange: "$250,000+",        subFilter: ["auto"],                   emoji: "🏎️", description: "Twin-turbo V8, 660 horsepower, and a sound that makes grown adults cry. A pure dream." },
    { id: "h8",  name: "Warhol Screen Print (Authenticated)",brand: "Andy Warhol",priceRange: "$5,000–$50,000+",subFilter: ["art"],            emoji: "🖼️", description: "A piece of art history you can hang in your home. Pop art that only gets more meaningful with time." },
  ],
  kitchen: [
    { id: "h9",  name: "Le Creuset Dutch Oven",        brand: "Le Creuset",priceRange: "$300-$500",      subFilter: ["cooking","ritual"],       emoji: "🍳", image: "https://source.unsplash.com/featured/?dutch,oven,cooking,kitchen,cozy", description: "The heirloom kitchen piece. Braises, soups, bread, and Sunday sauces all feel more special in enameled cast iron." },
    { id: "h10", name: "Breville Espresso Machine",    brand: "Breville", priceRange: "$500-$900",      subFilter: ["coffee","ritual"],        emoji: "☕", image: "https://source.unsplash.com/featured/?espresso,machine,home,coffee,barista", description: "A countertop ritual machine for dialing in espresso, steaming milk, and making every morning feel a little more intentional." },
  ],
  cellar: [
    { id: "c1",  name: "Opus One 2018",                brand: "Opus One",priceRange: "$350–$450 /bottle",subFilter: ["red","rare"],            emoji: "🍷", image: DREAMSHELF_IMAGES.c1, description: "The Napa Valley Bordeaux blend that made California wine taken seriously worldwide." },
    { id: "c2",  name: "Dom Pérignon Vintage 2013",    brand: "Moët",    priceRange: "$200–$280 /bottle",subFilter: ["champagne"],             emoji: "🥂", image: DREAMSHELF_IMAGES.c2, description: "The vintage that only happens when Dom's cellar master decides conditions were perfect." },
    { id: "c3",  name: "Pétrus 2015",                  brand: "Pétrus",  priceRange: "$3,000–$5,000 /bottle",subFilter: ["red","rare"],        emoji: "🍷", image: DREAMSHELF_IMAGES.c3, description: "The most coveted Bordeaux on earth. Pure Merlot from a single patch of iron-rich clay in Pomerol." },
    { id: "c4",  name: "Screaming Eagle Cabernet",     brand: "Screaming Eagle",priceRange: "$3,000–$5,000 /bottle",subFilter: ["red","rare"], emoji: "🍷", image: DREAMSHELF_IMAGES.c4, description: "Napa Valley cult wine with a mailing list years long. Getting a bottle means knowing someone." },
    { id: "c5",  name: "Krug Grande Cuvée",            brand: "Krug",    priceRange: "$180–$250 /bottle",subFilter: ["champagne"],             emoji: "🥂", image: DREAMSHELF_IMAGES.c5, description: "The champagne house that refuses to compromise. Every bottle is a blend of up to 120 reserve wines." },
    { id: "c6",  name: "Sassicaia 2019",               brand: "Tenuta San Guido",priceRange: "$200–$300 /bottle",subFilter: ["red"],          emoji: "🍷", image: DREAMSHELF_IMAGES.c6, description: "The original Super Tuscan. A wine that invented a category and still defines it sixty years later." },
    { id: "c7",  name: "Puligny-Montrachet Premier Cru",brand: "Various",priceRange: "$100–$200 /bottle",subFilter: ["white"],                emoji: "🥂", image: DREAMSHELF_IMAGES.c7, description: "Burgundy's greatest white. Minerality, precision, and the kind of complexity that takes years to understand." },
    { id: "c8",  name: "EuroCave Wine Cabinet",        brand: "EuroCave",priceRange: "$1,500–$4,000",   subFilter: [],                         emoji: "🪣", image: DREAMSHELF_IMAGES.c8, description: "Because the bottles you're collecting deserve the right temperature, humidity, and darkness." },
  ],
  whiskey: [
    { id: "wh1", name: "Macallan 18",                  brand: "The Macallan",priceRange: "$350-$500 /bottle",subFilter: ["neat"],              emoji: "🥃", image: DREAMSHELF_IMAGES.wh1, description: "A slow, sherried pour for the nightcap shelf. Rich, polished, and made for quiet celebrations." },
    { id: "wh2", name: "Yamazaki 18",                  brand: "Suntory",    priceRange: "$900-$1,500 /bottle",subFilter: ["japanese","neat"], emoji: "🥃", image: DREAMSHELF_IMAGES.wh2, description: "Japanese whisky with patience built into it. The kind of bottle you open when the moment deserves ceremony." },
    { id: "wh3", name: "Hibiki Harmony",               brand: "Suntory",    priceRange: "$90-$130 /bottle", subFilter: ["japanese","neat"],    emoji: "🥃", image: DREAMSHELF_IMAGES.wh3, description: "Soft, floral, and balanced. A beautiful everyday-celebration bottle for sharing with people who notice details." },
    { id: "wh4", name: "Pappy Van Winkle",             brand: "Old Rip Van Winkle",priceRange: "$1,000+ /bottle",subFilter: ["bourbon","rare"],emoji: "🥃", image: DREAMSHELF_IMAGES.wh4, description: "The impossible bourbon. Part bottle, part legend, part story you tell before the cork even moves." },
    { id: "wh5", name: "Clase Azul",                   brand: "Clase Azul", priceRange: "$150-$200 /bottle",subFilter: ["tequila"],            emoji: "🥃", image: DREAMSHELF_IMAGES.wh5, description: "The sculptural bottle for a celebratory pour. It looks as intentional on the shelf as it tastes in the glass." },
    { id: "wh6", name: "Don Julio 1942",               brand: "Don Julio",  priceRange: "$170-$220 /bottle",subFilter: ["tequila"],            emoji: "🥃", image: DREAMSHELF_IMAGES.wh6, description: "A golden after-dinner pour that makes the table linger a little longer." },
    { id: "wh7", name: "Louis XIII Cognac",            brand: "Rémy Martin",priceRange: "$4,000+ /bottle",subFilter: ["cognac","rare"],        emoji: "🥃", image: DREAMSHELF_IMAGES.wh7, description: "A decanter-level dream. The kind of bottle that feels less like a purchase and more like an occasion waiting to happen." },
  ],
  adventure: [
    { id: "a1",  name: "Völkl Mantra M6 Skis",        brand: "Völkl",   priceRange: "$800–$1,000",     subFilter: ["ski"],                    emoji: "🎿", description: "The all-mountain benchmark. Skis that make every run feel intentional and every turn feel earned." },
    { id: "a2",  name: "Arc'teryx Alpha SV Jacket",    brand: "Arc'teryx",priceRange: "$850–$1,000",    subFilter: ["ski","climb"],            emoji: "🧥", description: "The jacket mountaineers trust in the most severe conditions on earth. Built to last a lifetime." },
    { id: "a3",  name: "Petzl Vertigo Wire-Lock",      brand: "Petzl",   priceRange: "$25–$40",         subFilter: ["climb"],                  emoji: "🧗", description: "The carabiner that professional guides trust. A small thing that means everything." },
    { id: "a4",  name: "Trek Domane SLR 9",            brand: "Trek",    priceRange: "$9,000–$12,000",  subFilter: ["bike"],                   emoji: "🚴", description: "Carbon frame, Shimano Dura-Ace, and the smoothest ride on any road surface. The dream cycling setup." },
    { id: "a5",  name: "Patagonia Black Hole Duffel 70L",brand: "Patagonia",priceRange: "$250–$300",   subFilter: ["ski","climb"],            emoji: "🎒", description: "The bag that goes on every adventure and comes back looking fine. Built to outlast the trip." },
    { id: "a6",  name: "Capita DOA Snowboard",         brand: "Capita",  priceRange: "$600–$700",       subFilter: ["ski"],                    emoji: "🏂", description: "The people's board. Versatile, responsive, and the first thing intermediate riders reach for." },
    { id: "a7",  name: "Hobie Mirage Pro Angler Kayak",brand: "Hobie",   priceRange: "$3,500–$4,500",   subFilter: ["water"],                  emoji: "🛶", description: "Pedal-powered fishing kayak with hands-free steering. The serious angler's dream craft." },
    { id: "a8",  name: "Garmin Fenix 7X Solar",        brand: "Garmin",  priceRange: "$700–$900",       subFilter: ["ski","climb","bike"],     emoji: "⌚", description: "Solar charging, topographic maps, and a battery that lasts longer than any expedition." },
    { id: "a9",  name: "Parasailing Over Clear Water", brand: "Ocean Day",priceRange: "$80–$180",        subFilter: ["water"],                  emoji: "🪂", description: "Floating above bright water with nothing but wind, sunlight, and the kind of view you remember years later." },
    { id: "a10", name: "Skydiving First Jump",         brand: "Drop Zone",priceRange: "$250–$400",       subFilter: ["mountain"],               emoji: "🪂", description: "The leap you talk about for the rest of your life. A few wild seconds that make everything feel bigger." },
    { id: "a11", name: "Bungee Jumping",               brand: "Adventure Day",priceRange: "$120–$300",   subFilter: ["climb"],                  emoji: "🌉", description: "A bridge, a cord, a countdown, and the clean shock of doing something you were scared to do." },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCuratedDreamShelfMatches(query = "") {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];

  return Object.entries(CURATED_ITEMS)
    .flatMap(([category, categoryItems]) => categoryItems.map(item => {
      const cat = getDreamShelfCategoryMeta(category);
      return {
        ...item,
        category,
        emoji: item.emoji || cat.emoji,
        preferResolvedImage: true,
        image: "",
      };
    }))
    .map(item => {
      const haystack = [
        item.name,
        item.brand,
        item.priceRange,
        item.description,
        item.category,
        ...(item.subFilter || []),
      ].filter(Boolean).join(" ").toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { item, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(result => result.item);
}

function getDraftDreamShelfMatch(query = "") {
  const category = inferDreamShelfCategory(query);
  const cat = getDreamShelfCategoryMeta(category);
  return {
    id: `draft-${query.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: query,
    brand: "Dream find",
    priceRange: "",
    image: "",
    category,
    emoji: cat.emoji,
    description: getDreamShelfFallbackDescription(query),
    external: true,
  };
}

function formatTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function itemMatchesSubFilter(categoryId, item, subId) {
  if (!subId || subId === "all") return true;
  const filters = Array.isArray(item?.subFilter) ? item.subFilter : [];
  const haystack = [item?.name, item?.brand, item?.description, ...filters].filter(Boolean).join(" ").toLowerCase();
  const has = (...terms) => terms.some(term => haystack.includes(term));
  const matchers = {
    watches: {
      everyday: () => has("cartier", "tag", "omega", "santos", "carrera", "5k15k", "u5k"),
      sport: () => filters.includes("sport") || has("submariner", "daytona", "hublot", "speedmaster", "royal oak"),
      dress: () => filters.includes("dress") || has("santos", "portugieser"),
      grail: () => has("patek", "nautilus", "royal oak", "daytona", "hublot", "15kp"),
      timeless: () => has("rolex", "omega", "cartier", "iwc", "tag", "submariner", "speedmaster"),
    },
    bags: {
      everyday: () => has("neverfull", "galleria", "bucket", "tote", "shoulder"),
      statement: () => has("gucci", "bottega", "dionysus", "andiamo", "chanel"),
      travel: () => has("neverfull", "tote", "prada", "galleria"),
      iconic: () => has("chanel", "hermes", "birkin", "kelly", "louis vuitton", "prada"),
    },
    jewelry: {
      everyday: () => filters.includes("everyday") || has("tiffany", "love bracelet", "alhambra"),
      devotion: () => has("love", "diamond", "anniversary", "solitaire", "band"),
      heirloom: () => has("mikimoto", "harry winston", "diamond", "pearl", "bvlgari"),
      statement: () => has("serpenti", "clou", "diamond", "bvlgari"),
      gold: () => filters.includes("gold") || has("gold", "cartier", "van cleef"),
    },
    golf: {
      weekend: () => has("driver", "putter", "bag", "round", "pebble"),
      practice: () => has("putter", "irons", "driver"),
      course: () => has("pebble", "round", "experience"),
      setup: () => has("set", "bag", "irons", "driver", "putter"),
    },
    sneakers: {
      everyday: () => has("samba", "common projects", "panda", "new balance"),
      grail: () => filters.includes("grail") || has("jordan", "sacai", "silver bullet"),
      classic: () => has("jordan", "samba", "air max", "achilles", "dunk"),
      collab: () => filters.includes("collab") || has("sacai", "aime leon dore"),
    },
    hobbies: {
      creative: () => has("guitar", "camera", "piano", "screen print", "art", "hasselblad", "leica", "fender", "gibson", "warhol"),
      ritual: () => has("piano", "camera"),
      studio: () => has("guitar", "piano", "camera", "hasselblad", "leica", "fender", "gibson"),
      drive: () => has("porsche", "ferrari", "911", "gtb"),
    },
    kitchen: {
      cooking: () => filters.includes("cooking") || has("dutch oven", "le creuset", "cookware", "cooking"),
      coffee: () => filters.includes("coffee") || has("espresso", "breville", "coffee"),
      ritual: () => filters.includes("ritual") || has("dutch oven", "le creuset", "espresso", "breville", "coffee"),
    },
    cellar: {
      dinner: () => has("red", "white", "cabernet", "sassicaia", "puligny", "opus"),
      celebration: () => has("champagne", "dom", "krug", "cuvée", "cuvee"),
      cellar: () => has("cabinet", "eurocave", "cellar"),
      rare: () => filters.includes("rare") || has("pétrus", "petrus", "screaming eagle", "opus"),
    },
    whiskey: {
      neat: () => has("macallan", "yamazaki", "hibiki", "pappy", "whisky", "whiskey", "bourbon", "pour"),
      japanese: () => filters.includes("japanese") || has("yamazaki", "hibiki", "suntory", "japanese"),
      bourbon: () => filters.includes("bourbon") || has("pappy", "van winkle", "bourbon"),
      tequila: () => filters.includes("tequila") || has("clase azul", "don julio", "tequila"),
      cognac: () => filters.includes("cognac") || has("louis xiii", "cognac", "rémy", "remy"),
    },
    adventure: {
      mountain: () => has("ski", "snowboard", "jacket", "mountain", "snow"),
      climb: () => filters.includes("climb") || has("climb", "carabiner", "arc'teryx"),
      ride: () => filters.includes("bike") || has("bike", "cycling", "trek", "ride"),
      water: () => filters.includes("water") || has("kayak", "water"),
      gear: () => has("duffel", "jacket", "watch", "garmin", "bag"),
    },
  };
  return Boolean(matchers[categoryId]?.[subId]?.());
}

function getDreamShelfVibe(item = {}) {
  const text = `${item.name || ""} ${item.brand || ""} ${item.description || ""}`.toLowerCase();
  if (text.includes("espresso") || text.includes("coffee")) return "Morning ritual";
  if (text.includes("dutch oven") || text.includes("le creuset")) return "Dinner with friends";
  if (text.includes("golf") || text.includes("pebble")) return "A day worth clearing";
  if (text.includes("wine") || text.includes("champagne") || text.includes("krug") || text.includes("dom")) return "Saved for a celebration";
  if (text.includes("whisky") || text.includes("whiskey") || text.includes("bourbon") || text.includes("tequila") || text.includes("cognac") || text.includes("pour")) return "Celebration pour";
  if (text.includes("guitar") || text.includes("piano")) return "Creative life";
  if (text.includes("camera") || text.includes("leica") || text.includes("hasselblad")) return "Seeing more closely";
  if (text.includes("porsche") || text.includes("ferrari")) return "The long drive";
  if (text.includes("ski") || text.includes("snowboard") || text.includes("kayak") || text.includes("climb")) return "Weekend outside";
  if (text.includes("bag") || text.includes("tote") || text.includes("birkin") || text.includes("kelly")) return "Carry the life you want";
  if (text.includes("ring") || text.includes("bracelet") || text.includes("diamond") || text.includes("pearl")) return "A future heirloom";
  if (text.includes("sneaker") || text.includes("jordan") || text.includes("samba") || text.includes("dunk")) return "Everyday uniform";
  if (text.includes("watch") || text.includes("rolex") || text.includes("hublot") || text.includes("omega")) return "One day watch";
  return "Part of the life I want";
}

// ─── Item Modal ───────────────────────────────────────────────────────────────
function ItemModal({ item, isSaved, onSomeday, onMilestone, onShare, onClose, darkMode }) {
  const dm = darkMode;
  const [saved, setSaved] = useState(isSaved);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => { setImageFailed(false); }, [item.image]);

  const handleSomeday = () => {
    if (!saved) onSomeday(item);
    setSaved(s => !s);
  };

  const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[10100] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');`}</style>
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden border"
        style={{
          background: dm ? CHAR : LINEN,
          borderColor: dm ? "rgba(250,246,240,0.10)" : STONE_LIGHT,
          boxShadow: dm ? '0 8px 40px rgba(0,0,0,0.40)' : '0 8px 32px rgba(42,36,32,0.12)',
        }}>
        {/* Image / emoji header */}
        <div className="relative flex-shrink-0">
          {item.image && !imageFailed ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-60 object-contain p-8"
              style={{ background: dm ? CHAR_SOFT : OAT }}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-full h-60 flex flex-col items-center justify-center gap-3" style={{ background: dm ? CHAR_SOFT : OAT }}>
              <span className="text-6xl">{item.emoji || cat.emoji}</span>
              <span className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: AMBER_DARK }}>{item.brand}</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors"
            style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.75)' }}
          >✕</button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 pt-5 pb-2">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-1.5" style={{ color: STONE }}>
            {item.brand}
          </p>
          <h2 className="leading-snug mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.75rem', fontWeight: 600, color: dm ? LINEN : CHAR }}>
            {item.name}
          </h2>

          {item.priceRange && (
            <p className="text-xl font-medium mb-3" style={{ color: AMBER_DARK, fontFamily: "'Cormorant Garamond', serif" }}>
              {item.priceRange}
            </p>
          )}

          <p className="text-sm leading-relaxed mb-4 italic" style={{ color: dm ? "rgba(250,246,240,0.55)" : STONE }}>
            {item.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 px-6 pt-3 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] flex flex-col gap-2.5 border-t"
          style={{ borderColor: dm ? 'rgba(250,246,240,0.07)' : 'rgba(212,201,187,0.4)' }}>
          <button
            onClick={handleSomeday}
            className="w-full rounded-xl py-3 text-base border transition-all duration-200"
            style={{ background: dm ? TEAL_MUTED : '#f0fdfa', border: `1px solid ${TEAL_BORDER}`, color: TEAL, fontFamily: "'Caveat', cursive", fontWeight: 700 }}
          >
            {saved ? "✓ On my Someday List" : "+ Add to Someday List"}
          </button>
          <button
            onClick={() => { onMilestone(item); onClose(); }}
            className="w-full rounded-xl py-3 text-base transition-all text-center border"
            style={{ background: dm ? LAVENDER_DARK_BG : LAVENDER_LIGHT, border: `1px solid ${LAVENDER_BORDER}`, color: dm ? LAVENDER_TEXT_DARK : LAVENDER_TEXT, fontFamily: "'Caveat', cursive", fontWeight: 700 }}
          >
            ✨ Make it happen
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Item Card ────────────────────────────────────────────────────────────────
const ItemCard = React.memo(function ItemCard({ item, savedIds, onOpen, darkMode }) {
  const dm = darkMode;
  const isSaved = savedIds.has(item.id);
  const [imageFailed, setImageFailed] = useState(false);
  const vibe = getDreamShelfVibe(item);

  useEffect(() => { setImageFailed(false); }, [item.image]);

  return (
    <div
      onClick={() => onOpen(item)}
      className="border overflow-hidden transition-all duration-200 flex flex-col cursor-pointer group hover:-translate-y-0.5"
      style={{
        background: dm ? CHAR_SOFT : LINEN,
        borderColor: dm ? "rgba(250,246,240,0.09)" : STONE_LIGHT,
        borderRadius: '16px',
        boxShadow: dm
          ? '0 4px 20px rgba(0,0,0,0.18)'
          : '0 2px 12px rgba(42,36,32,0.06)',
      }}
    >
      {/* Image / emoji */}
      <div className={`w-full h-56 flex flex-col items-center justify-center gap-2 relative`} style={{ background: dm ? CHAR : OAT, borderRadius: '16px 16px 0 0' }}>
        {item.image && !imageFailed ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-56 object-contain p-7 transition-transform duration-300 group-hover:scale-[1.02]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <>
            <span className="text-5xl">{item.emoji}</span>
            <span className="dream-shelf-product-text text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: AMBER_DARK }}>{item.brand}</span>
          </>
        )}
        {isSaved && (
          <div className="dream-shelf-product-text absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-md text-white" style={{ background: '#0d9488', letterSpacing: '0.06em' }}>
            ✓ Someday
          </div>
        )}
      </div>

      <div className="px-5 pt-4 pb-5 flex flex-col flex-1">
        <p className="dream-shelf-product-text text-[10px] uppercase tracking-[0.22em] mb-1.5 font-semibold" style={{ color: STONE }}>{item.brand}</p>
        <h3 className={`dream-shelf-product-text text-[1.35rem] font-semibold leading-snug mb-2 flex-1 line-clamp-2 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
          {item.name}
        </h3>

        <p className="font-handwritten text-lg leading-tight" style={{ color: AMBER_DARK }}>
          {vibe}
        </p>
      </div>
    </div>
  );
});

// ─── Community Post ───────────────────────────────────────────────────────────
const CommunityPost = React.memo(function CommunityPost({ post, photoUrl, currentUserId, onAddToSomeday, onVote, onOpen, darkMode }) {
  const dm = darkMode;
  const [vote, setVote]     = useState(0);
  const [likes, setLikes]   = useState(post.likes_count ?? 0);
  const [wished, setWished] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedImage = post.product_image || photoUrl || "";

  useEffect(() => { setLikes(post.likes_count ?? 0); }, [post.id, post.likes_count]);
  useEffect(() => { setImageFailed(false); }, [resolvedImage]);

  const handleVote = async (nextVote) => {
    const delta = nextVote - vote;
    if (!delta) return;
    setVote(nextVote);
    setLikes(n => Math.max(0, n + delta));
    onVote?.(post, delta);
  };

  const displayName = post.profiles?.full_name ?? (post.user_id === currentUserId ? "You" : "Someone");
  const initials = String(displayName || "??").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const cat = CATEGORIES.find(c => c.id === post.category);
  const vibe = getDreamShelfVibe({ name: post.product_name, brand: post.product_brand, description: post.review, category: post.category });

  return (
    <div className="border rounded-2xl p-4" style={{ background: dm ? CHAR_SOFT : LINEN, borderColor: dm ? "rgba(241,230,216,0.10)" : STONE_LIGHT }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-['Caveat'] text-base font-bold text-white flex-shrink-0" style={{ background: `linear-gradient(135deg, ${AMBER}, ${CHAR})` }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${dm ? 'text-slate-200' : 'text-slate-800'}`}>
            {displayName} added to their Someday
          </p>
          <p className="text-xs text-slate-500">{cat ? `${cat.emoji} ${cat.label}` : 'Someday'} · {formatTime(post.created_at)}</p>
        </div>
      </div>

      {/* Product block */}
      <div className="flex gap-3 mb-3 cursor-pointer" onClick={() => onOpen?.({ id: post.id, name: post.product_name, brand: post.product_brand, image: resolvedImage, category: post.category, description: post.review, priceRange: post.product_price, emoji: cat?.emoji || "✨" })}>
        {resolvedImage && !imageFailed ? (
          <img
            src={resolvedImage}
            alt={post.product_name}
            className="w-20 h-20 rounded-xl object-contain p-1.5 flex-shrink-0"
            style={{ background: dm ? CHAR : OAT }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: dm ? CHAR : OAT }}>
            {cat?.emoji || "✨"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-['Caveat'] text-lg font-semibold leading-tight mb-0.5 line-clamp-2 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
            {post.product_name}
          </h3>
          {post.product_brand && <p className="text-xs text-slate-500 mb-1">{post.product_brand}</p>}
          <p className="font-['Caveat'] text-base leading-tight mb-1" style={{ color: AMBER_DARK }}>{vibe}</p>
          {post.review && <p className="text-sm text-slate-500 italic leading-relaxed line-clamp-2">"{post.review}"</p>}
        </div>
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-4 pt-3 border-t ${dm ? 'border-white/5' : 'border-slate-100'}`}>
        <div className="flex items-center gap-1.5">
          <button onClick={() => handleVote(vote === 1 ? 0 : 1)} className={`text-xs px-2 py-1 rounded-full border transition-colors ${vote === 1 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'text-slate-400 border-transparent hover:text-emerald-600'}`} aria-label="Upvote">▲</button>
          <span className="text-xs text-slate-500 tabular-nums">{likes}</span>
          <button onClick={() => handleVote(vote === -1 ? 0 : -1)} className={`text-xs px-2 py-1 rounded-full border transition-colors ${vote === -1 ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'text-slate-400 border-transparent hover:text-rose-600'}`} aria-label="Downvote">▼</button>
        </div>
        <button
          onClick={() => {
            if (!wished) onAddToSomeday?.({ title: post.product_name, imageUrl: resolvedImage, emoji: cat?.emoji || "✨", type: "dreamshelf", categoryId: "buy" });
            setWished(w => !w);
          }}
          className="ml-auto text-sm px-3 py-1.5 rounded-xl border font-['Caveat'] font-bold transition-all duration-200"
          style={{ background: dm ? TEAL_MUTED : '#f0fdfa', border: `1px solid ${TEAL_BORDER}`, color: TEAL, fontFamily: "'Caveat', cursive" }}
        >
          {wished ? "✓ Someday" : "+ Someday"}
        </button>
      </div>
    </div>
  );
});

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareItemModal({ item, onClose, onSubmit, darkMode }) {
  const dm = darkMode;
  const photoInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const cat = CATEGORIES.find(c => c.id === item?.category) || CATEGORIES[0];
  const [draft, setDraft] = useState({
    name:     item?.name || "",
    brand:    item?.brand || "",
    image:    item?.image || "",
    price:    item?.priceRange || "",
    category: item?.category || cat.id,
    review:   "",
  });

  const updateField = (f, v) => setDraft(p => ({ ...p, [f]: v }));

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const readFile = file => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ""));
    r.onerror = () => rej(new Error("Could not read image"));
    r.readAsDataURL(file);
  });

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try { const url = await readFile(files[0]); updateField("image", url); }
    catch { setSubmitError("Could not read that image."); }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!draft.review.trim()) { setSubmitError("Tell your friends why this is worth it."); return; }
    setSubmitting(true); setSubmitError("");
    const ok = await onSubmit?.(draft);
    setSubmitting(false);
    if (ok) onClose();
    else setSubmitError("Could not post right now. Try again.");
  };

  const inputCls = "w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors";
  const inputStyle = { fontFamily: "'Caveat', cursive", background: dm ? CHAR_SOFT : OAT, borderColor: dm ? "rgba(241,230,216,0.12)" : STONE_LIGHT, color: dm ? LINEN : CHAR };

  return createPortal(
    <div className="fixed inset-0 z-[10100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');`}</style>
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border" style={{ background: dm ? CHAR : LINEN, borderColor: dm ? "rgba(241,230,216,0.16)" : STONE_LIGHT }}>
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 border-b flex items-start justify-between ${dm ? 'border-white/5' : 'border-slate-100'}`}>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1 font-semibold" style={{ color: AMBER_DARK }}>Someday ✨</p>
            <h2 className={`text-2xl font-bold ${dm ? 'text-slate-100' : 'text-slate-900'}`} style={{ fontFamily: "'Caveat', cursive" }}>Share something you're dreaming of</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 text-sm">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          {/* Item name */}
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-['Caveat']">Item name *</span>
            <input type="text" value={draft.name} onChange={e => updateField("name", e.target.value)} placeholder="Rolex Submariner" className={inputCls} style={inputStyle} />
          </label>

          {/* Brand */}
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-['Caveat']">Brand</span>
            <input type="text" value={draft.brand} onChange={e => updateField("brand", e.target.value)} placeholder="Rolex" className={inputCls} style={inputStyle} />
          </label>

          {/* Category chips */}
          <div className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-['Caveat']">Category</span>
            <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map(c => (
                <button key={c.id} type="button" onClick={() => updateField("category", c.id)}
                  className="px-3 py-1.5 rounded-full text-sm border transition-all flex-shrink-0"
                  style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, background: draft.category === c.id ? AMBER_MUTED : (dm ? "rgba(241,230,216,0.06)" : OAT), border: `1px solid ${draft.category === c.id ? AMBER_BORDER : (dm ? "rgba(241,230,216,0.10)" : STONE_LIGHT)}`, color: draft.category === c.id ? AMBER_DARK : STONE }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-['Caveat']">Price range</span>
            <input type="text" value={draft.price} onChange={e => updateField("price", e.target.value)} placeholder="$9,000–$14,000" className={inputCls} style={inputStyle} />
          </label>

          {/* Photo */}
          <div className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-['Caveat']">Photo</span>
            {draft.image ? (
              <div className="relative rounded-2xl overflow-hidden h-44">
                <img src={draft.image} alt="preview" className="w-full h-full object-contain bg-slate-100" />
                <button type="button" onClick={() => updateField("image", "")} className="absolute bottom-2 right-2 px-3 py-1 rounded-lg bg-white/90 text-xs font-semibold text-slate-700">Remove</button>
                <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute bottom-2 left-2 px-3 py-1 rounded-lg bg-white/90 text-xs font-semibold text-slate-700">Change photo</button>
              </div>
            ) : (
              <button type="button" onClick={() => photoInputRef.current?.click()} className="py-6 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2" style={{ background: dm ? CHAR_SOFT : OAT, borderColor: dm ? "rgba(241,230,216,0.14)" : STONE_LIGHT }}>
                <Camera className="w-6 h-6 text-slate-400" />
                <span className={`text-sm font-['Caveat'] font-bold ${dm ? 'text-slate-400' : 'text-slate-600'}`}>Add a photo</span>
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
          </div>

          {/* Why */}
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-['Caveat']">Why do you dream about this? *</span>
            <textarea value={draft.review} onChange={e => updateField("review", e.target.value)} placeholder="Tell your friends what makes this worth dreaming about..." rows={4} className={`${inputCls} resize-none`} style={inputStyle} />
          </label>

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        </div>

        <div className="px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t" style={{ background: dm ? CHAR_SOFT : LINEN, borderColor: dm ? "rgba(241,230,216,0.12)" : STONE_LIGHT }}>
          <button
            onClick={handleSubmit}
            disabled={!draft.review.trim() || submitting}
            className="w-full rounded-2xl py-3 text-base transition-colors disabled:opacity-40 text-white"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, background: submitting ? AMBER_BORDER : AMBER }}
          >
            {submitting ? "Sharing…" : "Share with friends ✨"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DreamShelfPage({ onBack, onAddToSomeday, onAddEvent, darkMode = false } = {}) {
  const dm = darkMode;
  const communityFeedRef = useRef(null);

  const [activeWorld, setActiveWorld] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubFilter, setActiveSubFilter] = useState("all");
  const [items, setItems]                   = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [featuredPost, setFeaturedPost]     = useState(null);
  const [savedIds, setSavedIds]             = useState(new Set());
  const [loading, setLoading]               = useState(false);
  const [selectedItem, setSelectedItem]     = useState(null);
  const [sharingItem, setSharingItem]       = useState(null);
  const [currentUserId, setCurrentUserId]   = useState(null);
  const [itemImages, setItemImages]         = useState({});
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [searching, setSearching]           = useState(false);
  const [searchError, setSearchError]       = useState("");
  const hasFetchedRef = useRef(false);
  const imageFetchedRef = useRef(new Set());
  const imageRequestsRef = useRef(new Map());
  const itemImagesRef = useRef({});
  const searchRequestIdRef = useRef(0);
  const categoryLoadIdRef = useRef(0);

  useEffect(() => {
    itemImagesRef.current = itemImages;
  }, [itemImages]);

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data?.user?.id ?? null));
  }, []);

  // ── Community posts ──
  const fetchCommunityPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("dreamshelf_posts")
      .select("id, user_id, product_name, product_brand, product_image, product_price, review, category, likes_count, created_at")
      .order("likes_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data && data.length > 0) {
      setCommunityPosts(data);
      setFeaturedPost(data[0] ?? null);
    } else {
      setCommunityPosts([]);
      setFeaturedPost(null);
    }
  }, []);

  useEffect(() => { fetchCommunityPosts(); }, [fetchCommunityPosts]);

  // ── Load curated items for active category ──
  const loadCategory = useCallback((cat, subFilter = "all") => {
    setLoading(true);
    setActiveSubFilter(subFilter);
    const loadId = categoryLoadIdRef.current + 1;
    categoryLoadIdRef.current = loadId;
    const allItems = (CURATED_ITEMS[cat.id] || []).map(item => ({
      ...item,
      category: cat.id,
      preferResolvedImage: true,
      image: "",
    }));
    const filtered = subFilter === "all"
      ? allItems
      : allItems.filter(item => itemMatchesSubFilter(cat.id, item, subFilter));
    setTimeout(() => {
      if (categoryLoadIdRef.current !== loadId) return;
      setItems(filtered);
      setLoading(false);
    }, 250);
  }, []);

  const loadWorld = useCallback((world) => {
    if (!world) return;
    setLoading(true);
    setActiveSubFilter("all");
    const loadId = categoryLoadIdRef.current + 1;
    categoryLoadIdRef.current = loadId;
    const worldItems = world.categoryIds.flatMap((categoryId) => {
      const cat = getDreamShelfCategoryMeta(categoryId);
      return (CURATED_ITEMS[categoryId] || []).map(item => ({
        ...item,
        category: cat.id,
        emoji: item.emoji || cat.emoji,
        preferResolvedImage: true,
        image: "",
      }));
    });
    setTimeout(() => {
      if (categoryLoadIdRef.current !== loadId) return;
      setItems(worldItems);
      setLoading(false);
    }, 250);
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    categoryLoadIdRef.current += 1;
    setItems([]);
    setLoading(false);
  }, []);

  // ── Handlers ──
  const normalizeSearchItems = useCallback((rawItems = [], query = "") => (
    rawItems.map((item, index) => {
      const name = item.name || item.title || query;
      const category = item.category || inferDreamShelfCategory(`${name} ${item.brand || ""} ${query}`);
      const cat = getDreamShelfCategoryMeta(category);
      return {
        id: `search-${getDreamShelfImageKey(item || {}) || `${query}-${index}`}`,
        name,
        brand: item.brand || item.sourceName || "Dream find",
        priceRange: item.priceRange || item.price || "",
        image: item.image || item.imageUrl || item.thumbnail || "",
        sourceUrl: item.sourceUrl || item.link || "",
        sourceName: item.sourceName || item.source || "",
        category,
        emoji: cat.emoji,
        description: item.description || getDreamShelfFallbackDescription(query),
        external: true,
      };
    })
  ), []);

  const fetchDreamShelfImage = useCallback(async (item) => {
    const key = getDreamShelfImageKey(item);
    const cachedImage = itemImagesRef.current[key] || (!item?.preferResolvedImage ? (item?.image || item?.product_image || "") : "");
    if (!key || cachedImage) return cachedImage;
    if (imageRequestsRef.current.has(key)) return imageRequestsRef.current.get(key);
    if (imageFetchedRef.current.has(key)) return "";

    const query = getDreamShelfImageQuery(item);
    if (!query) return "";

    const request = (async () => {
      try {
        let imageUrl = "";
        if (item?.preferResolvedImage) {
          const productResponse = await fetch(`/api/product-search?q=${encodeURIComponent(query)}`);
          if (productResponse.ok) {
            const productData = await productResponse.json();
            const productResult = normalizeSearchItems(productData.items || [], query).find(result => result?.image);
            imageUrl = productResult?.image || "";
          }
        }
        if (!imageUrl) {
          const response = await fetch(`/api/google-image-search?query=${encodeURIComponent(query)}&num=1`);
          if (!response.ok) return "";
          const data = await response.json();
          const result = data?.results?.[0];
          imageUrl = result?.displayUrl || result?.thumbnail || result?.url || "";
        }
        if (!imageUrl) return "";

        setItemImages(prev => {
          if (prev[key]) return prev;
          const next = { ...prev, [key]: imageUrl };
          itemImagesRef.current = next;
          return next;
        });
        return imageUrl;
      } catch (error) {
        // Keep the emoji fallback if image search is unavailable.
        return "";
      } finally {
        imageFetchedRef.current.add(key);
        imageRequestsRef.current.delete(key);
      }
    })();

    imageRequestsRef.current.set(key, request);
    return request;
  }, [normalizeSearchItems]);

  const buildManualSearchItem = useCallback(async (query) => {
    const category = inferDreamShelfCategory(query);
    const cat = getDreamShelfCategoryMeta(category);
    const fallbackItem = {
      id: `manual-${Date.now()}`,
      name: query,
      brand: "Dream find",
      priceRange: "",
      image: "",
      category,
      emoji: cat.emoji,
      description: getDreamShelfFallbackDescription(query),
      external: true,
    };
    const image = await fetchDreamShelfImage(fallbackItem);
    return { ...fallbackItem, image };
  }, [fetchDreamShelfImage]);

  const cacheDreamShelfImage = useCallback(async (imageUrl, name) => {
    if (!imageUrl || imageUrl.startsWith("data:")) return imageUrl || "";
    try {
      const response = await fetch("/api/cache-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, name }),
      });
      if (!response.ok) return imageUrl;
      const data = await response.json();
      return data.imageUrl || imageUrl;
    } catch {
      return imageUrl;
    }
  }, []);

  const runProductSearch = useCallback(async (query, { allowFallback = false } = {}) => {
    if (!query) return;

    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    setSearching(true);
    if (allowFallback) setSearchError("");
    try {
      const response = await fetch(`/api/product-search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const results = normalizeSearchItems(data.items || [], query);
        if (results.length) {
          if (requestId !== searchRequestIdRef.current) return;
          setSearchResults(results);
          setSearching(false);
          return;
        }
      }

      if (allowFallback) {
        const fallback = await buildManualSearchItem(query);
        if (requestId !== searchRequestIdRef.current) return;
        setSearchResults([fallback]);
        setSearchError("Showing a best-effort match. If the photo is off, add your own picture.");
      }
    } catch (error) {
      if (allowFallback) {
        const fallback = await buildManualSearchItem(query);
        if (requestId !== searchRequestIdRef.current) return;
        setSearchResults([fallback]);
        setSearchError("Search was limited, so I made a draft card you can refine.");
      }
    } finally {
      if (requestId === searchRequestIdRef.current) setSearching(false);
    }
  }, [buildManualSearchItem, normalizeSearchItems]);

  const handleProductSearch = useCallback(async (event) => {
    event?.preventDefault?.();
    const query = searchQuery.trim();
    await runProductSearch(query, { allowFallback: true });
  }, [runProductSearch, searchQuery]);

  const clearProductSearch = useCallback(() => {
    searchRequestIdRef.current += 1;
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    setSearching(false);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      searchRequestIdRef.current += 1;
      setSearchResults([]);
      setSearchError("");
      setSearching(false);
      return undefined;
    }

    const localMatches = getCuratedDreamShelfMatches(query);
    setSearchResults(localMatches.length ? localMatches : [getDraftDreamShelfMatch(query)]);
    setSearchError(localMatches.length ? "" : "Press Find it to search wider, or add your own photo.");

    const timeout = window.setTimeout(() => {
      runProductSearch(query, { allowFallback: false });
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [runProductSearch, searchQuery]);

  useEffect(() => {
    const imageTargets = [
      ...items.slice(0, 24),
      ...searchResults.slice(0, 8),
      featuredPost,
      ...communityPosts.slice(0, 8),
    ].filter(Boolean);

    imageTargets.forEach(fetchDreamShelfImage);
  }, [communityPosts, featuredPost, fetchDreamShelfImage, items, searchResults]);

  const handleCategoryClick = (cat) => {
    if (activeCategory?.id === cat.id) {
      setActiveCategory(null);
      setActiveSubFilter("all");
      if (activeWorld) {
        loadWorld(activeWorld);
      } else {
        categoryLoadIdRef.current += 1;
        setItems([]);
        setLoading(false);
      }
      return;
    }
    const world = activeWorld?.categoryIds.includes(cat.id)
      ? activeWorld
      : getDreamWorldForCategory(cat.id);
    if (world) setActiveWorld(world);
    setActiveCategory(cat);
    setActiveSubFilter("all");
    loadCategory(cat, "all");
  };

  const handleWorldClick = (world) => {
    setActiveWorld(world);
    setActiveCategory(null);
    setActiveSubFilter("all");
    loadWorld(world);
  };

  const handleSubFilter = (subId) => {
    if (!activeCategory) return;
    setActiveSubFilter(subId);
    loadCategory(activeCategory, subId);
  };

  const handleSomeday = useCallback(async (item) => {
    const alreadySaved = savedIds.has(item.id);
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
      return next;
    });
    if (!alreadySaved) {
      const fallbackImage = isDreamShelfWeakImageUrl(item.image) ? "" : item.image;
      const imageUrl = itemImages[getDreamShelfImageKey(item)] || await fetchDreamShelfImage(item) || fallbackImage || "";
      const stableImageUrl = await cacheDreamShelfImage(imageUrl, item.name);
      onAddToSomeday?.({ title: item.name, imageUrl: stableImageUrl, emoji: item.emoji || "✨", type: "dreamshelf", categoryId: "buy", notes: `${item.brand} · ${item.priceRange || ""}` });
    }
  }, [cacheDreamShelfImage, fetchDreamShelfImage, itemImages, onAddToSomeday, savedIds]);

  const handleCommunitySomeday = useCallback(async (payload) => {
    const stableImageUrl = await cacheDreamShelfImage(payload?.imageUrl || "", payload?.title || "dream-item");
    onAddToSomeday?.({ ...payload, imageUrl: stableImageUrl });
  }, [cacheDreamShelfImage, onAddToSomeday]);

  const handleMilestone = useCallback((item) => {
    onAddEvent?.({ title: `🎯 Get my ${item.name}`, notes: `${item.brand} · ${item.priceRange || ""} · Someday milestone`, category: "milestone" });
  }, [onAddEvent]);

  const handleShareSubmit = async (draft) => {
    const payload = {
      user_id: currentUserId,
      product_name: draft.name.trim(),
      product_brand: draft.brand.trim() || null,
      product_image: draft.image || null,
      product_price: draft.price.trim() || null,
      review: draft.review.trim(),
      category: draft.category || null,
      likes_count: 0,
    };
    const { data, error } = await supabase.from("dreamshelf_posts").insert(payload).select("*").single();
    if (error) { console.error(error); return false; }
    if (data) {
      setCommunityPosts(prev => [data, ...prev]);
      setFeaturedPost(data);
      window.setTimeout(() => communityFeedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
    return true;
  };

  const handleVoteCommunityPost = useCallback(async (post, delta) => {
    if (!post?.id || !delta) return;
    try { await supabase.rpc("vote_on_dreamshelf_post", { post_id: post.id, vote_delta: delta }); }
    catch (e) { console.error(e); }
    finally {
      setCommunityPosts(prev => prev.map(item => item.id === post.id ? { ...item, likes_count: Math.max(0, (item.likes_count ?? 0) + delta) } : item));
      setFeaturedPost(prev => prev && prev.id === post.id ? { ...prev, likes_count: Math.max(0, (prev.likes_count ?? 0) + delta) } : prev);
    }
  }, []);

  const handleFeaturedSomeday = useCallback(async (featured, imageUrl) => {
    if (!featured) return;
    setSavedIds(prev => {
      const next = new Set(prev);
      next.add(featured.id);
      return next;
    });
    const stableImageUrl = await cacheDreamShelfImage(imageUrl || "", featured.product_name || "dream-item");
    onAddToSomeday?.({ title: featured.product_name, imageUrl: stableImageUrl, emoji: "✨", type: "dreamshelf", categoryId: "buy" });
  }, [cacheDreamShelfImage, onAddToSomeday]);

  const activeWorldCategories = activeWorld
    ? CATEGORIES.filter(cat => activeWorld.categoryIds.includes(cat.id))
    : [];
  const subFilters = SUB_FILTERS[activeCategory?.id] || [];
  const featured = featuredPost;
  const featuredImage = featured
    ? (featured.product_image || itemImages[getDreamShelfImageKey(featured)] || "")
    : "";
  const featuredSaved = featured ? savedIds.has(featured.id) : false;
  const selectedItemWithImage = selectedItem
    ? {
        ...selectedItem,
        image: selectedItem.preferResolvedImage
          ? (itemImages[getDreamShelfImageKey(selectedItem)] || (isDreamShelfWeakImageUrl(selectedItem.image) ? "" : selectedItem.image) || "")
          : (selectedItem.image || itemImages[getDreamShelfImageKey(selectedItem)] || "")
      }
    : null;
  const categoryItemsWithImages = items.map(item => ({
    ...item,
    image: item.preferResolvedImage
      ? (itemImages[getDreamShelfImageKey(item)] || (isDreamShelfWeakImageUrl(item.image) ? "" : item.image) || "")
      : (item.image || itemImages[getDreamShelfImageKey(item)] || ""),
  }));
  const categoryItemPairs = Array.from(
    { length: Math.ceil(categoryItemsWithImages.length / 2) },
    (_, index) => categoryItemsWithImages.slice(index * 2, index * 2 + 2)
  );
  const communityPostPairs = Array.from(
    { length: Math.ceil(communityPosts.length / 2) },
    (_, index) => communityPosts.slice(index * 2, index * 2 + 2)
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-['DM_Sans']" style={{ background: dm ? CHAR : OAT, color: dm ? LINEN : CHAR }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap'); .font-handwritten { font-family: 'Caveat', cursive !important; } .dream-shelf-pill { font-family: 'Caveat', cursive !important; } .dream-shelf-product-text { font-family: 'Cormorant Garamond', serif !important; }`}</style>
      <div className="max-w-3xl mx-auto px-5 py-5 pb-24">

        {/* ── Hero ── */}
        <div className="relative px-1 pt-2 pb-7 mb-5">
          <div className="relative z-10">
            {onBack && (
              <button onClick={onBack} className={`w-9 h-9 rounded-xl flex items-center justify-center active:opacity-70 flex-shrink-0 mb-5 ${dm ? 'bg-white/8 text-white border border-white/12' : 'bg-white/70 text-slate-600 border border-slate-200/60'}`} aria-label="Back">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
            <h1 className="font-handwritten text-6xl font-bold leading-none mb-3" style={{ color: dm ? LINEN : CHAR }}>
              Someday
            </h1>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: dm ? "rgba(250,246,240,0.55)" : STONE, letterSpacing: '0.01em' }}>
              Some dreams take you somewhere. Others you take with you.
            </p>
          </div>
        </div>

        {/* ── Category strip ── */}
        {/* Search / add your own */}
        {/* ── Search / add your own ── */}
        <form
          onSubmit={handleProductSearch}
          className="rounded-2xl border p-3 mb-5"
          style={{
            background: dm ? CHAR_SOFT : LINEN,
            borderColor: dm ? "rgba(250,246,240,0.08)" : STONE_LIGHT,
            boxShadow: dm ? '0 2px 12px rgba(0,0,0,0.16)' : '0 2px 10px rgba(42,36,32,0.05)',
          }}
        >
          <div className="flex gap-2">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search a dream, ritual, or someday piece..."
              className="flex-1 min-w-0 rounded-xl px-4 py-2.5 text-sm outline-none border"
              style={{ background: dm ? CHAR : OAT, borderColor: dm ? "rgba(250,246,240,0.10)" : STONE_LIGHT, color: dm ? LINEN : CHAR }}
            />
            <button
              type="submit"
              disabled={!searchQuery.trim() || searching}
              className="dream-shelf-pill flex-shrink-0 rounded-xl px-4 py-2 text-base font-bold border disabled:opacity-40"
              style={{ background: 'transparent', border: `1px solid ${AMBER_BORDER}`, color: dm ? AMBER : AMBER_DARK }}
            >
              {searching ? "Finding..." : "Find it"}
            </button>
          </div>
          <div className="flex items-center justify-end gap-3 px-1 pt-2">
            <button
              type="button"
              onClick={() => setSharingItem({ name: searchQuery.trim(), brand: "", image: "", priceRange: "", category: inferDreamShelfCategory(searchQuery), description: "" })}
              className="dream-shelf-pill flex-shrink-0 text-sm font-bold"
              style={{ color: TEAL }}
            >
              Add manually
            </button>
          </div>
          {searchError && (
            <p className="px-1 pt-2 text-xs" style={{ color: AMBER_DARK }}>
              {searchError}
            </p>
          )}
        </form>

        {searchResults.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: STONE }}>
                Search results for "{searchQuery.trim()}"
              </p>
              <button
                type="button"
                onClick={clearProductSearch}
                className="dream-shelf-pill text-sm font-bold"
                style={{ color: STONE }}
              >
                Back to curated shelf
              </button>
            </div>
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4 mb-6">
              {searchResults.map(item => {
                const itemWithImage = {
                  ...item,
                  image: item.preferResolvedImage
                    ? (itemImages[getDreamShelfImageKey(item)] || "")
                    : (item.image || itemImages[getDreamShelfImageKey(item)] || "")
                };
                return (
                  <ItemCard
                    key={item.id}
                    item={itemWithImage}
                    savedIds={savedIds}
                    onOpen={setSelectedItem}
                    darkMode={dm}
                  />
                );
              })}
            </div>
          </>
        )}

        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-[0.16em] mb-3" style={{ color: STONE }}>
            What moves you?
          </p>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {DREAM_WORLDS.map(world => (
              <button
                key={world.id}
                type="button"
                onClick={() => handleWorldClick(world)}
                className="text-left rounded-2xl border p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none min-h-[112px] sm:min-h-[150px]"
                style={{
                  background: activeWorld?.id === world.id ? (dm ? CHAR_SOFT : LINEN) : (dm ? "rgba(250,246,240,0.035)" : "rgba(250,246,240,0.72)"),
                  borderColor: activeWorld?.id === world.id ? AMBER_BORDER : (dm ? "rgba(250,246,240,0.08)" : "rgba(212,201,187,0.55)"),
                  boxShadow: activeWorld?.id === world.id ? (dm ? "0 8px 22px rgba(0,0,0,0.22)" : "0 8px 22px rgba(42,36,32,0.08)") : "none",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-handwritten text-xl sm:text-2xl font-bold leading-none mb-1" style={{ color: dm ? LINEN : CHAR }}>
                      {world.emoji} {world.label}
                    </div>
                    <div className="text-[9px] sm:text-[11px] uppercase tracking-[0.1em] sm:tracking-[0.14em] mb-1 sm:mb-2 leading-snug" style={{ color: AMBER_DARK }}>
                      {world.title}
                    </div>
                  </div>
                  <span className="text-base sm:text-lg flex-shrink-0" style={{ color: STONE }}>›</span>
                </div>
                <p className="text-xs sm:text-sm leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none" style={{ color: dm ? "rgba(250,246,240,0.55)" : STONE }}>
                  {world.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {activeWorld && (
          <div className="flex gap-2 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {activeWorldCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className="dream-shelf-pill flex-shrink-0 rounded-full px-3 py-1 text-sm font-bold transition-all duration-200 border focus:outline-none"
                style={{
                  background: activeCategory?.id === cat.id
                    ? (dm ? CHAR_SOFT : LINEN)
                    : 'transparent',
                  border: activeCategory?.id === cat.id
                    ? `1px solid ${dm ? "rgba(250,246,240,0.22)" : STONE_LIGHT}`
                    : `1px solid ${dm ? "rgba(250,246,240,0.08)" : "rgba(212,201,187,0.5)"}`,
                  color: activeCategory?.id === cat.id ? (dm ? LINEN : CHAR) : STONE,
                  fontFamily: "'Caveat', cursive",
                  boxShadow: activeCategory?.id === cat.id
                    ? (dm ? '0 2px 8px rgba(0,0,0,0.18)' : '0 2px 8px rgba(42,36,32,0.07)')
                    : 'none',
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Mood-filter strip (contextual) ── */}
        {activeWorld && subFilters.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {subFilters.map(sf => (
              <button
                key={sf.id}
                onClick={() => handleSubFilter(sf.id)}
                className="dream-shelf-pill flex-shrink-0 rounded-full px-3 py-0.5 text-sm font-bold transition-all duration-200 border focus:outline-none"
                style={{
                  background: activeSubFilter === sf.id ? STONE_MUTED : 'transparent',
                  border: `1px solid ${activeSubFilter === sf.id ? STONE_LIGHT : (dm ? "rgba(250,246,240,0.08)" : "rgba(212,201,187,0.4)")}`,
                  color: activeSubFilter === sf.id ? (dm ? LINEN : CHAR_SOFT) : STONE,
                  fontFamily: "'Caveat', cursive",
                }}
              >
                {sf.label}
              </button>
            ))}
          </div>
        )}

        {/* ── CTA Card ── */}
        <div style={{
          borderRadius: '16px',
          background: dm ? CHAR_SOFT : LINEN,
          border: `1px solid ${dm ? "rgba(250,246,240,0.10)" : STONE_LIGHT}`,
          boxShadow: dm ? '0 4px 20px rgba(0,0,0,0.16)' : '0 2px 12px rgba(42,36,32,0.06)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          textAlign: 'center',
          marginBottom: '28px',
        }}>
          <p style={{ fontSize: '20px', fontWeight: 700, color: dm ? LINEN : CHAR, fontFamily: "'Caveat', cursive", margin: 0 }}>
            Something on your dream list?
          </p>
          <p style={{ fontSize: '14px', color: STONE, margin: '0 0 14px', letterSpacing: '0.01em' }}>
            Share what you're saving for with your friends
          </p>
          <button
            onClick={() => setSharingItem({ name: "", brand: "", image: "", priceRange: "", category: activeCategory?.id || "watches", description: "" })}
            style={{ background: 'transparent', color: dm ? LINEN : CHAR, border: `1px solid ${dm ? "rgba(250,246,240,0.18)" : STONE_LIGHT}`, borderRadius: '50px', padding: '9px 26px', fontSize: '17px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Caveat', cursive" }}
          >
            Add to Someday
          </button>
        </div>

        {/* ── Mixed dream feed ── */}
        <p className="text-[10px] uppercase tracking-[0.16em] mb-3" style={{ color: STONE }}>
          {activeCategory
            ? `${activeWorld?.label ? `${activeWorld.label} · ` : ""}${activeCategory.emoji} ${activeCategory.label}${activeSubFilter !== "all" ? ` · ${SUB_FILTERS[activeCategory.id]?.find(f => f.id === activeSubFilter)?.label || ""}` : ""}`
            : activeWorld
              ? `${activeWorld.label} · All`
              : "Start with a world above"}
        </p>

        {loading ? (
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4 mb-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse border" style={{ borderRadius: '16px', background: dm ? CHAR_SOFT : OAT, borderColor: dm ? "rgba(250,246,240,0.08)" : STONE_LIGHT }} />
            ))}
          </div>
        ) : categoryItemPairs.length > 0 ? (
          <>
            {categoryItemPairs.map((pair, pairIndex) => (
              <React.Fragment key={`dream-feed-pair-${pairIndex}`}>
                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4 mb-8">
                  {pair.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      savedIds={savedIds}
                      onOpen={setSelectedItem}
                      darkMode={dm}
                    />
                  ))}
                </div>

                {pairIndex === 0 && featured && (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.16em] mb-3" style={{ color: STONE }}>Most dreamed about this week</p>
                    <div className="border overflow-hidden mb-8 transition-transform duration-200 cursor-pointer hover:-translate-y-0.5"
                      style={{ background: dm ? CHAR_SOFT : LINEN, borderColor: dm ? "rgba(250,246,240,0.09)" : STONE_LIGHT, borderRadius: '16px', boxShadow: dm ? '0 4px 20px rgba(0,0,0,0.16)' : '0 2px 12px rgba(42,36,32,0.06)' }}
                      onClick={() => setSelectedItem({
                        id: featured.id,
                        name: featured.product_name,
                        brand: featured.product_brand,
                        image: featuredImage,
                        category: featured.category,
                        description: featured.review,
                        priceRange: featured.product_price,
                        emoji: CATEGORIES.find(c => c.id === featured.category)?.emoji || "✨",
                      })}>
                      <div className="grid grid-cols-2 max-sm:grid-cols-1">
                        <div className="h-52 flex items-center justify-center" style={{ background: dm ? CHAR : OAT }}>
                          {featuredImage ? (
                            <img src={featuredImage} alt={featured.product_name} className="w-full h-full object-contain p-6" />
                          ) : (
                            <span className="text-6xl">{CATEGORIES.find(c => c.id === featured.category)?.emoji || "✨"}</span>
                          )}
                        </div>
                        <div className="p-6 flex flex-col justify-center">
                          <p className="dream-shelf-product-text text-[10px] uppercase tracking-[0.2em] mb-1.5 font-semibold" style={{ color: AMBER_DARK }}>
                            Most dreamed
                          </p>
                          <h2 className={`dream-shelf-product-text text-xl font-semibold leading-snug mb-1 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
                            {featured.product_name}
                          </h2>
                          {featured.product_brand && <p className="dream-shelf-product-text text-[10px] uppercase tracking-[0.2em] mb-2 font-semibold" style={{ color: STONE }}>{featured.product_brand}</p>}
                          {featured.review && (
                            <p className="text-sm text-slate-500 italic leading-relaxed mb-4 line-clamp-3">"{featured.review}"</p>
                          )}
                          <div className="flex gap-4 flex-wrap mb-4">
                            <div className="flex flex-col">
                              <span className="font-handwritten text-xl leading-none" style={{ color: AMBER_DARK }}>
                                {getDreamShelfVibe({ name: featured.product_name, brand: featured.product_brand, description: featured.review, category: featured.category })}
                              </span>
                              <span className="text-[10px] uppercase tracking-wide" style={{ color: STONE }}>Vibe</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="dream-shelf-product-text text-lg font-medium" style={{ color: STONE }}>{featured.likes_count ?? 0}</span>
                              <span className="text-[10px] uppercase tracking-wide" style={{ color: STONE }}>Saves</span>
                            </div>
                          </div>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!featuredSaved) handleFeaturedSomeday(featured, featuredImage);
                            }}
                            className="self-start px-4 py-1.5 rounded-xl text-sm font-['Caveat'] font-bold border transition-all"
                            style={{ background: dm ? TEAL_MUTED : '#f0fdfa', border: `1px solid ${TEAL_BORDER}`, color: TEAL, fontFamily: "'Caveat', cursive" }}
                          >
                            {featuredSaved ? "✓ Someday" : "+ Someday"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {pairIndex > 0 && communityPostPairs[pairIndex - 1]?.length > 0 && (
                  <>
                    <p ref={pairIndex === 1 ? communityFeedRef : null} className="text-[10px] uppercase tracking-[0.16em] mb-3" style={{ color: STONE }}>
                      What friends are dreaming about
                    </p>
                    <div className="flex flex-col gap-2.5 mb-8">
                      {communityPostPairs[pairIndex - 1].map(post => (
                        <CommunityPost
                          key={post.id}
                          post={post}
                          photoUrl={itemImages[getDreamShelfImageKey(post)] || ""}
                          currentUserId={currentUserId}
                          onAddToSomeday={handleCommunitySomeday}
                          onVote={handleVoteCommunityPost}
                          onOpen={setSelectedItem}
                          darkMode={dm}
                        />
                      ))}
                    </div>
                  </>
                )}
              </React.Fragment>
            ))}

            {communityPostPairs.slice(Math.max(0, categoryItemPairs.length - 1)).map((pair, pairIndex) => (
              <React.Fragment key={`dream-feed-extra-friends-${pairIndex}`}>
                <p ref={categoryItemPairs.length <= 1 && pairIndex === 0 ? communityFeedRef : null} className="text-[10px] uppercase tracking-[0.16em] mb-3" style={{ color: STONE }}>
                  What friends are dreaming about
                </p>
                <div className="flex flex-col gap-2.5 mb-8">
                  {pair.map(post => (
                    <CommunityPost
                      key={post.id}
                      post={post}
                      photoUrl={itemImages[getDreamShelfImageKey(post)] || ""}
                      currentUserId={currentUserId}
                      onAddToSomeday={handleCommunitySomeday}
                      onVote={handleVoteCommunityPost}
                      onOpen={setSelectedItem}
                      darkMode={dm}
                    />
                  ))}
                </div>
              </React.Fragment>
            ))}
          </>
        ) : (
          <div className="text-center py-16 mb-8" style={{ color: STONE }}>
            <div className="text-4xl mb-4 opacity-40">✦</div>
            <p className="font-['Caveat'] text-2xl mb-1">{activeCategory ? "Nothing here yet" : "Choose a life chapter"}</p>
            <p className="text-sm opacity-60">{activeCategory ? "Try a different mood filter" : "Pick Style, Experiences, Lifestyle, or Collection to begin."}</p>
          </div>
        )}

      </div>

      {/* ── Item detail modal ── */}
      {selectedItemWithImage && (
        <ItemModal
          item={selectedItemWithImage}
          isSaved={savedIds.has(selectedItemWithImage.id)}
          onSomeday={handleSomeday}
          onMilestone={handleMilestone}
          onShare={setSharingItem}
          onClose={() => setSelectedItem(null)}
          darkMode={dm}
        />
      )}

      {/* ── Share modal ── */}
      {sharingItem && (
        <ShareItemModal
          item={sharingItem}
          onClose={() => setSharingItem(null)}
          onSubmit={handleShareSubmit}
          darkMode={dm}
        />
      )}
    </div>
  );
}
