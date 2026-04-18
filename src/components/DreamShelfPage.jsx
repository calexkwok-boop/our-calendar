import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Camera } from "lucide-react";
import { supabase } from "../supabaseClient";

// ─── Color tokens ─────────────────────────────────────────────────────────────
// Gold/silver aspirational palette replaces purple
const GOLD        = "#C9A84C";
const GOLD_LIGHT  = "#F5E6B8";
const GOLD_DARK   = "#8A6A1F";
const GOLD_MUTED  = "rgba(201,168,76,0.15)";
const GOLD_BORDER = "rgba(201,168,76,0.35)";
const SILVER      = "#A8B0BC";
const SILVER_MUTED = "rgba(168,176,188,0.12)";
const TEAL        = "#0d9488";
const TEAL_MUTED  = "rgba(45,212,191,0.15)";
const TEAL_BORDER = "rgba(45,212,191,0.35)";
const LAVENDER_LIGHT = "#f5f3ff";
const LAVENDER_DARK_BG = "rgba(168,85,247,0.12)";
const LAVENDER_BORDER = "rgba(168,85,247,0.28)";
const LAVENDER_TEXT = "#7c3aed";
const LAVENDER_TEXT_DARK = "#c4b5fd";

const getDreamShelfImageKey = (item = {}) => (
  item.id ||
  item.product_name ||
  item.name ||
  `${item.product_brand || item.brand || ""}-${item.product_name || item.name || ""}`
).toString();

const getDreamShelfImageQuery = (item = {}) => [
  item.product_brand || item.brand,
  item.product_name || item.name,
  "product",
  "official",
].filter(Boolean).join(" ");

const DREAMSHELF_IMAGES = {
  w1: "https://media.rolex.com/image/upload/q_auto/f_auto/t_v7-cover-majesty-landscape/c_limit,w_1200/v1/a677b2c664f6/catalogue/2026/upright-c/m124060-0001",
  w2: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&q=80",
  w3: "https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguet/lbv3_RO_collection?size=1920,0&wid=1920&fmt=avif-alpha&dpr=off",
  w4: "https://www.omegawatches.com/media/catalog/product/o/m/omega-speedmaster-moonwatch-professional-co-axial-master-chronometer-chronograph-42-mm-31030425001001-3ccf4a.png?w=900",
  w5: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&q=80",
  w6: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
  w7: "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?w=600&q=80",
  w8: "https://img.iwc.com/cluster-overview-lg-2/o-dpr-2/e6a2f75233ae6901b6842c6abe142d6834ebf5fc.jpg",
  b1: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
  b2: "https://assets.hermes.com/is/image/hermesedito/P_11_Birkin_2018?fit=wrap%2C0&wid=1920&resMode=sharp2&op_usm=1%2C1%2C6%2C0",
  b3: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80",
  b4: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&q=80",
  b5: "https://images.unsplash.com/photo-1592878849122-1cfad6a1c8a6?w=600&q=80",
  b6: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
  b7: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80",
  b8: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&q=80",
};

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "watches",   label: "Watches",    emoji: "⌚" },
  { id: "bags",      label: "Bags",       emoji: "👜" },
  { id: "jewelry",   label: "Jewelry",    emoji: "💍" },
  { id: "golf",      label: "Golf",       emoji: "⛳" },
  { id: "sneakers",  label: "Sneakers",   emoji: "👟" },
  { id: "hobbies",   label: "Hobbies",    emoji: "🎸" },
  { id: "cellar",    label: "Cellar",     emoji: "🍷" },
  { id: "adventure", label: "Adventure",  emoji: "🎿" },
];

// ─── Sub-filters per category ─────────────────────────────────────────────────
const SUB_FILTERS = {
  watches: [
    { id: "all",    label: "All"         },
    { id: "u5k",    label: "Under $5k"   },
    { id: "5k15k",  label: "$5k–$15k"    },
    { id: "15kp",   label: "$15k+"       },
    { id: "sport",  label: "Sport"       },
    { id: "dress",  label: "Dress"       },
    { id: "rolex",  label: "Rolex"       },
    { id: "patek",  label: "Patek"       },
    { id: "omega",  label: "Omega"       },
  ],
  bags: [
    { id: "all",    label: "All"         },
    { id: "u2k",    label: "Under $2k"   },
    { id: "2k5k",   label: "$2k–$5k"     },
    { id: "5kp",    label: "$5k+"        },
    { id: "tote",   label: "Tote"        },
    { id: "shoulder", label: "Shoulder"  },
    { id: "chanel", label: "Chanel"      },
    { id: "hermes", label: "Hermès"      },
    { id: "lv",     label: "LV"          },
  ],
  jewelry: [
    { id: "all",        label: "All"         },
    { id: "anniversary",label: "Anniversary" },
    { id: "birthday",   label: "Birthday"    },
    { id: "everyday",   label: "Everyday"    },
    { id: "gold",       label: "Gold"        },
    { id: "silver",     label: "Silver"      },
    { id: "cartier",    label: "Cartier"     },
    { id: "tiffany",    label: "Tiffany"     },
  ],
  golf: [
    { id: "all",      label: "All"       },
    { id: "putters",  label: "Putters"   },
    { id: "irons",    label: "Irons"     },
    { id: "drivers",  label: "Drivers"   },
    { id: "sets",     label: "Full Sets" },
    { id: "exp",      label: "Experiences"},
    { id: "u500",     label: "Under $500"},
    { id: "500_2k",   label: "$500–$2k"  },
    { id: "2kp",      label: "$2k+"      },
  ],
  sneakers: [
    { id: "all",      label: "All"        },
    { id: "jordan",   label: "Jordan"     },
    { id: "nike",     label: "Nike"       },
    { id: "adidas",   label: "Adidas"     },
    { id: "collab",   label: "Collabs"    },
    { id: "grail",    label: "Grails"     },
  ],
  hobbies: [
    { id: "all",      label: "All"        },
    { id: "music",    label: "Music"      },
    { id: "camera",   label: "Camera"     },
    { id: "auto",     label: "Auto"       },
    { id: "art",      label: "Art"        },
  ],
  cellar: [
    { id: "all",      label: "All"        },
    { id: "red",      label: "Red"        },
    { id: "white",    label: "White"      },
    { id: "champagne",label: "Champagne"  },
    { id: "rare",     label: "Rare"       },
  ],
  adventure: [
    { id: "all",      label: "All"        },
    { id: "ski",      label: "Ski"        },
    { id: "climb",    label: "Climbing"   },
    { id: "bike",     label: "Cycling"    },
    { id: "water",    label: "Water"      },
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
  ],
  bags: [
    { id: "b1",  name: "Chanel Classic Flap",         brand: "Chanel",  priceRange: "$8,000–$10,000",  subFilter: ["chanel","shoulder","5kp"],emoji: "👜", description: "The most iconic bag ever made. Quilted leather, gold chain, and a logo that needs no introduction." },
    { id: "b2",  name: "Hermès Birkin",                brand: "Hermès",  priceRange: "$10,000–$500,000+",subFilter: ["hermes","tote","5kp"],    emoji: "👜", description: "You can't just buy one. You earn the right to buy one. That's the point." },
    { id: "b3",  name: "Louis Vuitton Neverfull",      brand: "LV",      priceRange: "$1,800–$2,500",   subFilter: ["lv","tote","2k5k"],       emoji: "👜", description: "The tote that never goes out of style. A first serious bag for many, a forever bag for most." },
    { id: "b4",  name: "Celine Box Bag",               brand: "Celine",  priceRange: "$2,500–$3,500",   subFilter: ["shoulder","2k5k"],        emoji: "👜", description: "Minimalist, structured, and quietly superior. The anti-logo luxury bag." },
    { id: "b5",  name: "Bottega Veneta Jodie",         brand: "Bottega", priceRange: "$2,200–$3,000",   subFilter: ["shoulder","2k5k"],        emoji: "👜", description: "The intrecciato weave is so recognizable it doesn't need a logo. That's the flex." },
    { id: "b6",  name: "Gucci Dionysus",               brand: "Gucci",   priceRange: "$2,000–$3,500",   subFilter: ["shoulder","2k5k"],        emoji: "👜", description: "Tiger head clasp, GG web strap, and the energy of someone who knows exactly who they are." },
    { id: "b7",  name: "Prada Re-Edition 2005",        brand: "Prada",   priceRange: "$1,200–$1,800",   subFilter: ["shoulder","u2k"],         emoji: "👜", description: "Nylon and a triangle logo. Somehow still the coolest bag in the room every time." },
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
    { id: "g1",  name: "Scotty Cameron Newport 2",     brand: "Scotty Cameron",priceRange: "$400–$600",  subFilter: ["putters","u500"],         emoji: "⛳", description: "The putter Tour pros hoard and collectors obsess over. Feel unlike anything else on the green." },
    { id: "g2",  name: "Titleist TSR3 Driver",         brand: "Titleist",priceRange: "$550–$650",        subFilter: ["drivers","500_2k"],       emoji: "⛳", description: "The driver that the best players in the world trust when it actually matters." },
    { id: "g3",  name: "Callaway Paradym Custom Irons",brand: "Callaway",priceRange: "$1,500–$2,500",   subFilter: ["irons","500_2k"],         emoji: "⛳", description: "Custom fit, custom look. The set you commission when you're serious about the game." },
    { id: "g4",  name: "Ping G430 Full Set",           brand: "Ping",    priceRange: "$2,500–$3,500",   subFilter: ["sets","2kp"],             emoji: "⛳", description: "The complete bag upgrade. Everything matched, everything fitted, everything right." },
    { id: "g5",  name: "Round at Pebble Beach",        brand: "Pebble Beach",priceRange: "$600–$1,000",  subFilter: ["exp","500_2k"],           emoji: "⛳", description: "The 18th green borders the Pacific Ocean. One of the greatest rounds of golf anyone will ever play." },
    { id: "g6",  name: "Augusta National Members Round",brand: "Augusta",priceRange: "Priceless",        subFilter: ["exp"],                    emoji: "⛳", description: "You can't buy your way in. You get invited. If this is on your list, dream big." },
    { id: "g7",  name: "TaylorMade Stealth 2 HD Driver",brand: "TaylorMade",priceRange: "$450–$600",    subFilter: ["drivers","u500"],         emoji: "⛳", description: "Carbon face technology that genuinely changes what a golf ball can do in the air." },
    { id: "g8",  name: "FootJoy Tour Alpha Bag",       brand: "FootJoy", priceRange: "$350–$500",        subFilter: ["u500"],                   emoji: "⛳", description: "The bag that says you take this seriously. Organized, beautiful, and built for the long game." },
  ],
  sneakers: [
    { id: "s1",  name: "Air Jordan 1 Retro High OG",   brand: "Nike/Jordan",priceRange: "$170–$2,000+", subFilter: ["jordan","grail"],         emoji: "👟", description: "The shoe that started everything. Every colorway tells a story. The grail for a reason." },
    { id: "s2",  name: "Nike x Sacai LDWaffle",        brand: "Nike",    priceRange: "$180–$800+",       subFilter: ["collab","grail"],         emoji: "👟", description: "Double swoosh, deconstructed design, and the collab that changed what a running shoe could be." },
    { id: "s3",  name: "Adidas Samba OG",              brand: "Adidas",  priceRange: "$100–$130",        subFilter: ["adidas"],                 emoji: "👟", description: "The 1950s indoor soccer shoe that somehow became the shoe of the decade. Again." },
    { id: "s4",  name: "New Balance 550",              brand: "New Balance",priceRange: "$110–$140",     subFilter: ["collab"],                 emoji: "👟", description: "Aime Leon Dore put these back on the map and now everyone wants a pair. Deservedly." },
    { id: "s5",  name: "Air Max 97 Silver Bullet",     brand: "Nike",    priceRange: "$175–$500+",       subFilter: ["nike","grail"],           emoji: "👟", description: "Full-length air unit and a silver upper inspired by bullet trains. Still the best Air Max ever." },
    { id: "s6",  name: "Jordan 4 Retro",               brand: "Jordan",  priceRange: "$200–$1,000+",     subFilter: ["jordan","grail"],         emoji: "👟", description: "The shoe from Do the Right Thing. Every retro release sells out in minutes. For good reason." },
    { id: "s7",  name: "Salehe Bembury x Crocs",       brand: "Crocs",   priceRange: "$80–$300+",        subFilter: ["collab"],                 emoji: "👟", description: "The collaboration nobody expected and everyone wanted. Proof that great design transcends category." },
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
  cellar: [
    { id: "c1",  name: "Opus One 2018",                brand: "Opus One",priceRange: "$350–$450 /bottle",subFilter: ["red","rare"],            emoji: "🍷", description: "The Napa Valley Bordeaux blend that made California wine taken seriously worldwide." },
    { id: "c2",  name: "Dom Pérignon Vintage 2013",    brand: "Moët",    priceRange: "$200–$280 /bottle",subFilter: ["champagne"],             emoji: "🥂", description: "The vintage that only happens when Dom's cellar master decides conditions were perfect." },
    { id: "c3",  name: "Pétrus 2015",                  brand: "Pétrus",  priceRange: "$3,000–$5,000 /bottle",subFilter: ["red","rare"],        emoji: "🍷", description: "The most coveted Bordeaux on earth. Pure Merlot from a single patch of iron-rich clay in Pomerol." },
    { id: "c4",  name: "Screaming Eagle Cabernet",     brand: "Screaming Eagle",priceRange: "$3,000–$5,000 /bottle",subFilter: ["red","rare"], emoji: "🍷", description: "Napa Valley cult wine with a mailing list years long. Getting a bottle means knowing someone." },
    { id: "c5",  name: "Krug Grande Cuvée",            brand: "Krug",    priceRange: "$180–$250 /bottle",subFilter: ["champagne"],             emoji: "🥂", description: "The champagne house that refuses to compromise. Every bottle is a blend of up to 120 reserve wines." },
    { id: "c6",  name: "Sassicaia 2019",               brand: "Tenuta San Guido",priceRange: "$200–$300 /bottle",subFilter: ["red"],          emoji: "🍷", description: "The original Super Tuscan. A wine that invented a category and still defines it sixty years later." },
    { id: "c7",  name: "Puligny-Montrachet Premier Cru",brand: "Various",priceRange: "$100–$200 /bottle",subFilter: ["white"],                emoji: "🥂", description: "Burgundy's greatest white. Minerality, precision, and the kind of complexity that takes years to understand." },
    { id: "c8",  name: "EuroCave Wine Cabinet",        brand: "EuroCave",priceRange: "$1,500–$4,000",   subFilter: [],                         emoji: "🪣", description: "Because the bottles you're collecting deserve the right temperature, humidity, and darkness." },
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
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Item Modal ───────────────────────────────────────────────────────────────
function ItemModal({ item, isSaved, onSomeday, onMilestone, onShare, onClose, darkMode }) {
  const dm = darkMode;
  const [saved, setSaved] = useState(isSaved);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSomeday = () => {
    if (!saved) onSomeday(item);
    setSaved(s => !s);
  };

  const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[0];

  return createPortal(
    <div
      className="fixed inset-0 z-[10100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border ${dm ? 'bg-[#0e1520] border-white/10' : 'bg-white border-slate-200'}`}>
        {/* Image / emoji header */}
        <div className="relative flex-shrink-0">
          {item.image ? (
            <img src={item.image} alt={item.name} className={`w-full h-56 object-contain p-8 ${dm ? 'bg-[#131c2e]' : 'bg-slate-50'}`} />
          ) : (
            <div className={`w-full h-56 flex flex-col items-center justify-center gap-3 ${dm ? 'bg-[#131c2e]' : 'bg-gradient-to-br from-amber-50 to-yellow-50'}`}>
              <span className="text-7xl">{item.emoji || cat.emoji}</span>
              <span className="text-xs uppercase tracking-widest font-medium" style={{ color: GOLD }}>{item.brand}</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-slate-300 hover:text-white flex items-center justify-center text-sm transition-colors"
          >✕</button>
          {/* Gold shimmer badge */}
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: dm ? 'rgba(201,168,76,0.2)' : '#FFF8E1', color: GOLD_DARK, border: `1px solid ${GOLD_BORDER}` }}>
            {cat.emoji} {cat.label}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 pb-2">
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: SILVER }}>
            {item.brand}
          </p>
          <h2 className={`font-['Caveat'] text-3xl font-bold leading-tight mb-2 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
            {item.name}
          </h2>

          {item.priceRange && (
            <p className="font-['Caveat'] text-2xl font-bold mb-3" style={{ color: GOLD }}>
              {item.priceRange}
            </p>
          )}

          <p className={`text-sm leading-relaxed mb-4 italic ${dm ? 'text-slate-400' : 'text-slate-500'}`}>
            {item.description}
          </p>
        </div>

        {/* Actions */}
        <div className={`flex-shrink-0 p-6 pt-3 border-t flex flex-col gap-2.5 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] ${dm ? 'border-white/5' : 'border-slate-100'}`}>
          <button
            onClick={handleSomeday}
            className="w-full rounded-2xl py-3 text-base font-['Caveat'] font-bold border transition-all duration-200"
            style={{
              background: dm ? TEAL_MUTED : '#f0fdfa',
              border: `1px solid ${TEAL_BORDER}`,
              color: TEAL,
              fontFamily: "'Caveat', cursive",
            }}
          >
            {saved ? "✓ On my Someday List" : "+ Add to Someday List"}
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={() => { onMilestone(item); onClose(); }}
              className="flex-1 rounded-2xl py-3 text-sm font-['Caveat'] font-bold transition-all text-center border"
              style={{ background: dm ? LAVENDER_DARK_BG : LAVENDER_LIGHT, border: `1px solid ${LAVENDER_BORDER}`, color: dm ? LAVENDER_TEXT_DARK : LAVENDER_TEXT, fontFamily: "'Caveat', cursive" }}
            >
              🎯 Make it a milestone
            </button>
            <button
              onClick={() => { onShare(item); onClose(); }}
              className="flex-1 rounded-2xl py-3 text-sm font-['Caveat'] font-bold transition-all border"
              style={{ background: dm ? GOLD_MUTED : '#FFFBEB', border: `1px solid ${GOLD_BORDER}`, color: GOLD_DARK }}
            >
              Share with friends
            </button>
          </div>
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

  return (
    <div
      onClick={() => onOpen(item)}
      className={`border rounded-[26px] overflow-hidden transition-all duration-200 flex flex-col cursor-pointer group ${dm ? 'bg-[#161f30] border-white/5 hover:border-amber-400/25' : 'bg-white border-amber-100/70 hover:border-amber-300/50'} hover:-translate-y-1`}
      style={{
        boxShadow: dm
          ? '0 16px 34px rgba(0,0,0,0.24)'
          : '0 14px 32px rgba(143,113,66,0.10)',
      }}
    >
      {/* Image / emoji */}
      <div className={`w-full h-52 flex flex-col items-center justify-center gap-2 relative ${dm ? 'bg-[#131c2e]' : 'bg-gradient-to-br from-[#fffaf0] via-[#fffdf7] to-[#f3e7ce]'}`}>
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-52 object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <>
            <span className="text-6xl">{item.emoji}</span>
            <span className="dream-shelf-product-text text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: GOLD }}>{item.brand}</span>
          </>
        )}
        {isSaved && (
          <div className="dream-shelf-product-text absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md text-white" style={{ background: '#0d9488' }}>
            ✓ Someday
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="dream-shelf-product-text text-[11px] uppercase tracking-[0.2em] mb-1 font-semibold" style={{ color: SILVER }}>{item.brand}</p>
        <h3 className={`dream-shelf-product-text text-2xl font-semibold leading-tight mb-2 flex-1 line-clamp-2 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
          {item.name}
        </h3>

        {item.priceRange && (
          <p className="dream-shelf-product-text text-xl font-semibold mb-0" style={{ color: GOLD }}>
            {item.priceRange}
          </p>
        )}
      </div>
    </div>
  );
});

// ─── Community Post ───────────────────────────────────────────────────────────
const CommunityPost = React.memo(function CommunityPost({ post, photoUrl, currentUserId, onAddToSomeday, onVote, darkMode }) {
  const dm = darkMode;
  const [vote, setVote]     = useState(0);
  const [likes, setLikes]   = useState(post.likes_count ?? 0);
  const [wished, setWished] = useState(false);
  const resolvedImage = post.product_image || photoUrl || "";

  useEffect(() => { setLikes(post.likes_count ?? 0); }, [post.id, post.likes_count]);

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

  return (
    <div className={`border rounded-2xl p-4 ${dm ? 'bg-[#161f30] border-white/5' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-['Caveat'] text-base font-bold text-white flex-shrink-0" style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})` }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${dm ? 'text-slate-200' : 'text-slate-800'}`}>
            {displayName} added to their Dream Shelf
          </p>
          <p className="text-xs text-slate-500">{cat ? `${cat.emoji} ${cat.label}` : 'Dream Shelf'} · {formatTime(post.created_at)}</p>
        </div>
      </div>

      {/* Product block */}
      <div className="flex gap-3 mb-3">
        {resolvedImage ? (
          <img src={resolvedImage} alt={post.product_name} className={`w-20 h-20 rounded-xl object-contain p-1.5 flex-shrink-0 ${dm ? 'bg-[#131c2e]' : 'bg-amber-50'}`} />
        ) : (
          <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${dm ? 'bg-[#131c2e]' : 'bg-amber-50'}`}>
            {cat?.emoji || "✨"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-['Caveat'] text-lg font-semibold leading-tight mb-0.5 line-clamp-2 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
            {post.product_name}
          </h3>
          {post.product_brand && <p className="text-xs text-slate-500 mb-1">{post.product_brand}</p>}
          {post.review && <p className="text-sm text-slate-500 italic leading-relaxed line-clamp-2">"{post.review}"</p>}
          {post.product_price && (
            <p className="font-['Caveat'] text-lg font-bold mt-1" style={{ color: GOLD }}>{post.product_price}</p>
          )}
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
            if (!wished) onAddToSomeday?.({ title: post.product_name, imageUrl: resolvedImage, emoji: cat?.emoji || "✨", type: "dreamshelf" });
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

  const inputCls = `w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors ${dm ? `bg-[#0e1520] border-white/8 text-slate-200 focus:border-amber-400/40` : `bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-400`}`;

  return createPortal(
    <div className="fixed inset-0 z-[10100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border ${dm ? 'bg-[#0e1520] border-white/10' : 'bg-white border-slate-200'}`}>
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 border-b flex items-start justify-between ${dm ? 'border-white/5' : 'border-slate-100'}`}>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1 font-semibold" style={{ color: GOLD }}>Dream Shelf ✨</p>
            <h2 className={`font-['Caveat'] text-2xl font-bold ${dm ? 'text-slate-100' : 'text-slate-900'}`}>Share something you're dreaming of</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 text-sm">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
          {/* Item name */}
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500">Item name *</span>
            <input type="text" value={draft.name} onChange={e => updateField("name", e.target.value)} placeholder="Rolex Submariner" className={inputCls} />
          </label>

          {/* Brand */}
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500">Brand</span>
            <input type="text" value={draft.brand} onChange={e => updateField("brand", e.target.value)} placeholder="Rolex" className={inputCls} />
          </label>

          {/* Category chips */}
          <div className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500">Category</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.id} type="button" onClick={() => updateField("category", c.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-['Caveat'] font-bold border transition-all"
                  style={{ background: draft.category === c.id ? GOLD_MUTED : (dm ? 'rgba(255,255,255,0.05)' : '#f3f4f6'), border: `1px solid ${draft.category === c.id ? GOLD_BORDER : (dm ? 'rgba(255,255,255,0.07)' : '#e5e7eb')}`, color: draft.category === c.id ? GOLD_DARK : (dm ? '#6b7280' : '#9ca3af') }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500">Price range</span>
            <input type="text" value={draft.price} onChange={e => updateField("price", e.target.value)} placeholder="$9,000–$14,000" className={inputCls} />
          </label>

          {/* Photo */}
          <div className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500">Photo</span>
            {draft.image ? (
              <div className="relative rounded-2xl overflow-hidden h-44">
                <img src={draft.image} alt="preview" className="w-full h-full object-contain bg-slate-100" />
                <button type="button" onClick={() => updateField("image", "")} className="absolute bottom-2 right-2 px-3 py-1 rounded-lg bg-white/90 text-xs font-semibold text-slate-700">Remove</button>
              </div>
            ) : (
              <button type="button" onClick={() => photoInputRef.current?.click()} className={`py-6 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2 ${dm ? 'border-white/10 bg-white/2' : 'border-slate-200 bg-slate-50'}`}>
                <Camera className="w-6 h-6 text-slate-400" />
                <span className={`text-sm font-semibold ${dm ? 'text-slate-400' : 'text-slate-600'}`}>Add a photo</span>
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
          </div>

          {/* Why */}
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-500">Why do you dream about this? *</span>
            <textarea value={draft.review} onChange={e => updateField("review", e.target.value)} placeholder="Tell your friends what makes this worth dreaming about..." rows={4} className={`${inputCls} resize-none`} />
          </label>

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        </div>

        <div className={`px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t ${dm ? 'border-white/10 bg-[#161f30]' : 'border-slate-100 bg-white'}`}>
          <button
            onClick={handleSubmit}
            disabled={!draft.review.trim() || submitting}
            className="w-full rounded-2xl py-3 text-base font-['Caveat'] font-bold transition-colors disabled:opacity-40 text-white"
            style={{ background: submitting ? GOLD_BORDER : GOLD }}
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

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
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
  const hasFetchedRef = useRef(false);
  const imageFetchedRef = useRef(new Set());
  const imageRequestsRef = useRef(new Map());

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
    const allItems = (CURATED_ITEMS[cat.id] || []).map(item => ({
      ...item,
      category: cat.id,
      image: item.image || DREAMSHELF_IMAGES[item.id] || "",
    }));
    const filtered = subFilter === "all"
      ? allItems
      : allItems.filter(item => item.subFilter?.includes(subFilter));
    setTimeout(() => { setItems(filtered); setLoading(false); }, 250);
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    loadCategory(CATEGORIES[0]);
  }, [loadCategory]);

  // ── Handlers ──
  const fetchDreamShelfImage = useCallback(async (item) => {
    const key = getDreamShelfImageKey(item);
    const cachedImage = item?.image || item?.product_image || itemImages[key] || "";
    if (!key || cachedImage) return cachedImage;
    if (imageRequestsRef.current.has(key)) return imageRequestsRef.current.get(key);
    if (imageFetchedRef.current.has(key)) return "";

    const query = getDreamShelfImageQuery(item);
    if (!query) return "";

    const request = (async () => {
      try {
        const response = await fetch(`/api/google-image-search?query=${encodeURIComponent(query)}&num=1`);
        if (!response.ok) return "";
        const data = await response.json();
        const result = data?.results?.[0];
        const imageUrl = result?.displayUrl || result?.thumbnail || result?.url || "";
        if (!imageUrl) return "";

        setItemImages(prev => prev[key] ? prev : { ...prev, [key]: imageUrl });
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
  }, [itemImages]);

  useEffect(() => {
    const imageTargets = [
      ...items.slice(0, 24),
      featuredPost,
      ...communityPosts.slice(0, 8),
    ].filter(Boolean);

    imageTargets.forEach(fetchDreamShelfImage);
  }, [communityPosts, featuredPost, fetchDreamShelfImage, items]);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setActiveSubFilter("all");
    loadCategory(cat, "all");
  };

  const handleSubFilter = (subId) => {
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
      const imageUrl = item.image || itemImages[getDreamShelfImageKey(item)] || await fetchDreamShelfImage(item) || "";
      onAddToSomeday?.({ title: item.name, imageUrl, emoji: item.emoji || "✨", type: "dreamshelf", notes: `${item.brand} · ${item.priceRange || ""}` });
    }
  }, [fetchDreamShelfImage, itemImages, onAddToSomeday, savedIds]);

  const handleMilestone = useCallback((item) => {
    onAddEvent?.({ title: `🎯 Get my ${item.name}`, notes: `${item.brand} · ${item.priceRange || ""} · Dream Shelf milestone`, category: "milestone" });
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

  const subFilters = SUB_FILTERS[activeCategory?.id] || [];
  const featured = featuredPost;
  const featuredImage = featured
    ? (featured.product_image || itemImages[getDreamShelfImageKey(featured)] || "")
    : "";
  const selectedItemWithImage = selectedItem
    ? { ...selectedItem, image: selectedItem.image || itemImages[getDreamShelfImageKey(selectedItem)] || "" }
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen font-['DM_Sans'] ${dm ? 'bg-[#0e1520] text-slate-200' : 'bg-[#faf8f3] text-slate-800'}`}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap'); .font-handwritten, .dream-shelf-pill { font-family: 'Caveat', cursive !important; } .dream-shelf-product-text { font-family: 'Cormorant Garamond', serif !important; } @keyframes dreamShelfChromeSweep { 0% { transform: translateX(-130%) rotate(12deg); opacity: 0; } 24% { opacity: .34; } 58% { opacity: .18; } 100% { transform: translateX(155%) rotate(12deg); opacity: 0; } }`}</style>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">

        {/* ── Hero ── */}
        <div className="relative rounded-3xl p-8 mb-6 overflow-hidden border"
          style={{
            background: dm
              ? 'linear-gradient(135deg, #070a12 0%, #1c2432 18%, #f8fafc 31%, #8f7142 39%, #151a24 52%, #d8be7f 66%, #080b12 100%)'
              : 'linear-gradient(135deg, #fffdf7 0%, #d8be7f 16%, #ffffff 31%, #c7b68d 43%, #f8efe0 56%, #fef9ec 74%, #b9954f 100%)',
            borderColor: dm ? 'rgba(216,190,127,0.55)' : 'rgba(143,113,66,0.48)',
            borderWidth: 1.5,
            boxShadow: dm
              ? '0 24px 64px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -1px 0 rgba(216,190,127,0.24)'
              : '0 20px 50px rgba(143,113,66,0.18), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(143,113,66,0.18)',
          }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: [
              `radial-gradient(ellipse at 18% 8%, ${dm ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.72)'}, transparent 38%)`,
              `radial-gradient(circle at 82% 18%, ${dm ? 'rgba(216,190,127,0.26)' : 'rgba(216,190,127,0.38)'}, transparent 18%)`,
              `linear-gradient(116deg, transparent 0%, transparent 30%, ${dm ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.62)'} 38%, ${dm ? 'rgba(216,190,127,0.12)' : 'rgba(216,190,127,0.22)'} 44%, transparent 55%, transparent 100%)`,
            ].join(', '),
          }} />
          <div className="absolute -inset-y-8 left-0 w-20 pointer-events-none"
            style={{
              animation: 'dreamShelfChromeSweep 5.5s ease-in-out infinite',
              background: `linear-gradient(90deg, transparent, ${dm ? 'rgba(255,244,204,0.28)' : 'rgba(255,255,255,0.74)'}, transparent)`,
              filter: 'blur(0.5px)',
            }}
          />
          <div className="absolute right-8 top-7 h-14 w-14 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${dm ? 'rgba(255,244,204,0.42)' : 'rgba(255,255,255,0.95)'} 0 2px, transparent 3px), radial-gradient(circle, rgba(216,190,127,0.36), transparent 58%)`,
              opacity: dm ? 0.58 : 0.72,
            }}
          />
          <div className="absolute right-16 top-20 h-px w-24 rotate-[-24deg] pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${dm ? 'rgba(255,244,204,0.55)' : 'rgba(143,113,66,0.34)'}, transparent)` }}
          />
          <div className="absolute left-8 bottom-8 h-px w-20 rotate-[18deg] pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${dm ? 'rgba(216,190,127,0.28)' : 'rgba(143,113,66,0.22)'}, transparent)` }}
          />
          <div className="absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 rotate-[-8deg] pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${dm ? 'rgba(255,255,255,0.00)' : 'rgba(255,255,255,0.00)'} 30%, ${dm ? 'rgba(255,244,204,0.08)' : 'rgba(255,255,255,0.32)'} 48%, transparent 63%, transparent 100%)`,
              filter: 'blur(1px)',
            }}
          />
          <div className="absolute right-20 top-24 h-20 w-28 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 12px 10px, ${dm ? 'rgba(255,244,204,0.42)' : 'rgba(143,113,66,0.25)'} 0 1px, transparent 2px), radial-gradient(circle at 64px 26px, ${dm ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.75)'} 0 1px, transparent 2px), radial-gradient(circle at 94px 8px, ${dm ? 'rgba(216,190,127,0.40)' : 'rgba(143,113,66,0.20)'} 0 1px, transparent 2px)`,
              opacity: 0.75,
            }}
          />
          <div className="absolute right-10 top-8 text-2xl opacity-30 -rotate-6 select-none pointer-events-none">✨</div>

          <div className="relative z-10">
            {onBack && (
              <button onClick={onBack} className={`w-9 h-9 rounded-xl flex items-center justify-center active:opacity-70 flex-shrink-0 mb-4 ${dm ? 'bg-white/5 text-slate-300' : 'bg-white/80 text-slate-600 border border-slate-200/70'}`} aria-label="Back">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
            <h1 className="font-handwritten text-5xl font-bold leading-tight mb-2 bg-gradient-to-r bg-clip-text text-transparent"
              style={{
                backgroundImage: dm ? `linear-gradient(90deg, #f8fafc, ${GOLD})` : `linear-gradient(90deg, #1a1208, ${GOLD_DARK})`,
                fontFamily: "'Caveat', cursive",
              }}>
              Dream Shelf
            </h1>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: dm ? '#9ca3af' : '#78716c' }}>
              Some dreams take you somewhere. Others you take with you.
            </p>
          </div>
        </div>

        {/* ── Category strip ── */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className="dream-shelf-pill flex-shrink-0 rounded-full px-3 py-1 text-base font-bold transition-all duration-200 border focus:outline-none relative overflow-hidden"
              style={{
                background: activeCategory?.id === cat.id
                  ? (dm
                    ? 'linear-gradient(135deg, #070a12 0%, #1c2432 18%, #f8fafc 31%, #8f7142 39%, #151a24 52%, #d8be7f 66%, #080b12 100%)'
                    : 'linear-gradient(135deg, #fffdf7 0%, #d8be7f 16%, #ffffff 31%, #c7b68d 43%, #f8efe0 56%, #fef9ec 74%, #b9954f 100%)')
                  : (dm ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                border: activeCategory?.id === cat.id
                  ? `1.5px solid ${dm ? 'rgba(216,190,127,0.55)' : 'rgba(143,113,66,0.48)'}`
                  : `1px solid ${dm ? 'rgba(255,255,255,0.07)' : '#e5e7eb'}`,
                color: activeCategory?.id === cat.id ? (dm ? '#fff7d6' : '#4a3210') : (dm ? '#6b7280' : '#9ca3af'),
                fontFamily: "'Caveat', cursive",
                boxShadow: activeCategory?.id === cat.id
                  ? (dm
                    ? '0 5px 16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(216,190,127,0.20)'
                    : '0 5px 14px rgba(143,113,66,0.13), inset 0 1px 0 rgba(255,255,255,0.92), inset 0 -1px 0 rgba(143,113,66,0.14)')
                  : 'none',
              }}
            >
              {activeCategory?.id === cat.id && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(116deg, transparent 0%, transparent 28%, ${dm ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.62)'} 42%, transparent 56%, transparent 100%)`,
                  }}
                />
              )}
              <span className="relative z-10">
              {cat.emoji} {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* ── Sub-filter strip (contextual) ── */}
        {subFilters.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {subFilters.map(sf => (
              <button
                key={sf.id}
                onClick={() => handleSubFilter(sf.id)}
                className="dream-shelf-pill flex-shrink-0 rounded-full px-3 py-1 text-base font-bold transition-all duration-200 border focus:outline-none"
                style={{
                  background: activeSubFilter === sf.id ? (dm ? 'rgba(168,176,188,0.15)' : 'rgba(168,176,188,0.12)') : 'transparent',
                  border: `1px solid ${activeSubFilter === sf.id ? SILVER : (dm ? 'rgba(255,255,255,0.07)' : '#e5e7eb')}`,
                  color: activeSubFilter === sf.id ? (dm ? '#e2e8f0' : '#374151') : (dm ? '#6b7280' : '#9ca3af'),
                  fontFamily: "'Caveat', cursive",
                }}
              >
                {sf.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Featured community post ── */}
        {featured && (
          <>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">Most dreamed about this week</p>
            <div className={`border rounded-3xl overflow-hidden mb-8 transition-colors ${dm ? 'bg-[#161f30]' : 'bg-white'}`}
              style={{ borderColor: dm ? GOLD_BORDER : 'rgba(201,168,76,0.25)' }}>
              <div className="grid grid-cols-2 max-sm:grid-cols-1">
                <div className={`h-52 flex items-center justify-center text-7xl ${dm ? 'bg-[#131c2e]' : 'bg-gradient-to-br from-amber-50 to-yellow-50'}`}>
                  {featuredImage ? (
                    <img src={featuredImage} alt={featured.product_name} className="w-full h-full object-contain p-5" />
                  ) : (
                    CATEGORIES.find(c => c.id === featured.category)?.emoji || "✨"
                  )}
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: GOLD }}>
                    ✨ Most dreamed
                  </p>
                  <h2 className={`font-['Caveat'] text-2xl font-bold leading-tight mb-1 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
                    {featured.product_name}
                  </h2>
                  {featured.product_brand && <p className="text-xs text-slate-500 mb-2">{featured.product_brand}</p>}
                  {featured.review && (
                    <p className="text-sm text-slate-500 italic leading-relaxed mb-4 line-clamp-3">"{featured.review}"</p>
                  )}
                  <div className="flex gap-3 flex-wrap mb-4">
                    {featured.product_price && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold" style={{ color: GOLD }}>{featured.product_price}</span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Price</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-['Caveat'] text-xl font-semibold" style={{ color: SILVER }}>{featured.likes_count ?? 0}</span>
                      <span className="text-[10px] uppercase text-slate-500 tracking-wide">Saves</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onAddToSomeday?.({ title: featured.product_name, imageUrl: featuredImage, emoji: "✨", type: "dreamshelf" })}
                    className="self-start px-4 py-2 rounded-xl text-sm font-['Caveat'] font-bold border transition-all"
                    style={{ background: dm ? TEAL_MUTED : '#f0fdfa', border: `1px solid ${TEAL_BORDER}`, color: TEAL, fontFamily: "'Caveat', cursive" }}
                  >
                    + Someday
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Item grid ── */}
        <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">
          {activeCategory?.emoji} {activeCategory?.label}{activeSubFilter !== "all" ? ` · ${SUB_FILTERS[activeCategory?.id]?.find(f => f.id === activeSubFilter)?.label || ""}` : ""}
        </p>

        {loading ? (
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-5 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`rounded-[26px] h-80 animate-pulse border ${dm ? 'bg-[#161f30] border-white/5' : 'bg-amber-50/60 border-amber-100'}`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-5 mb-8">
            {items.length > 0 ? items.map(item => {
              const itemWithImage = { ...item, image: item.image || itemImages[getDreamShelfImageKey(item)] || "" };
              return (
                <ItemCard
                  key={item.id}
                  item={itemWithImage}
                  savedIds={savedIds}
                  onOpen={setSelectedItem}
                  darkMode={dm}
                />
              );
            }) : (
              <div className="col-span-2 max-sm:col-span-1 text-center py-16 text-slate-400">
                <div className="text-5xl mb-4">✨</div>
                <p className="font-['Caveat'] text-2xl mb-1">Nothing here yet</p>
                <p className="text-sm">Try a different filter</p>
              </div>
            )}
          </div>
        )}

        {/* ── CTA Card ── */}
        <div style={{
          borderRadius: '24px',
          background: dm
            ? 'linear-gradient(135deg, #070a12 0%, #1c2432 18%, #f8fafc 31%, #8f7142 39%, #151a24 52%, #d8be7f 66%, #080b12 100%)'
            : 'linear-gradient(135deg, #fffdf7 0%, #d8be7f 16%, #ffffff 31%, #c7b68d 43%, #f8efe0 56%, #fef9ec 74%, #b9954f 100%)',
          border: `1.5px solid ${dm ? 'rgba(216,190,127,0.55)' : 'rgba(143,113,66,0.48)'}`,
          boxShadow: dm
            ? '0 20px 56px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(216,190,127,0.22)'
            : '0 18px 44px rgba(143,113,66,0.14), inset 0 1px 0 rgba(255,255,255,0.92), inset 0 -1px 0 rgba(143,113,66,0.16)',
          padding: '30px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '32px',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: [
              `radial-gradient(ellipse at 18% 8%, ${dm ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.68)'}, transparent 40%)`,
              `linear-gradient(116deg, transparent 0%, transparent 30%, ${dm ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.58)'} 41%, ${dm ? 'rgba(216,190,127,0.10)' : 'rgba(216,190,127,0.20)'} 47%, transparent 58%, transparent 100%)`,
            ].join(', '),
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1, fontSize: '22px', marginBottom: '2px', opacity: 0.72 }}>✨</div>
          <p style={{ position: 'relative', zIndex: 1, fontSize: '20px', fontWeight: 700, color: dm ? '#fff7d6' : '#4a3210', fontFamily: "'Caveat', cursive", margin: 0, textShadow: dm ? '0 1px 12px rgba(0,0,0,0.35)' : '0 1px 8px rgba(255,255,255,0.55)' }}>
            Something on your dream list?
          </p>
          <p style={{ position: 'relative', zIndex: 1, fontSize: '15px', color: dm ? 'rgba(255,247,214,0.72)' : 'rgba(74,50,16,0.68)', margin: '0 0 12px', fontFamily: "'Caveat', cursive" }}>
            Share what you're saving for with your friends
          </p>
          <button
            onClick={() => setSharingItem({ name: "", brand: "", image: "", priceRange: "", category: activeCategory?.id || "watches", description: "" })}
            style={{ position: 'relative', zIndex: 1, background: dm ? 'rgba(8,11,18,0.62)' : 'rgba(255,255,255,0.72)', color: dm ? '#fff7d6' : '#4a3210', border: `1px solid ${dm ? 'rgba(255,247,214,0.28)' : 'rgba(143,113,66,0.28)'}`, borderRadius: '50px', padding: '11px 28px', fontSize: '18px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Caveat', cursive", boxShadow: dm ? 'inset 0 1px 0 rgba(255,255,255,0.12)' : '0 8px 20px rgba(143,113,66,0.12), inset 0 1px 0 rgba(255,255,255,0.9)' }}
          >
            Add to the Dream Shelf
          </button>
        </div>

        {/* ── Community feed ── */}
        <p ref={communityFeedRef} className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">
          What friends are dreaming about
        </p>
        <div className="flex flex-col gap-2.5">
          {communityPosts.map(post => (
            <CommunityPost
              key={post.id}
              post={post}
              photoUrl={itemImages[getDreamShelfImageKey(post)] || ""}
              currentUserId={currentUserId}
              onAddToSomeday={onAddToSomeday}
              onVote={handleVoteCommunityPost}
              darkMode={dm}
            />
          ))}
        </div>

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
