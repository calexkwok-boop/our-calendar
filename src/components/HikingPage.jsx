import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../supabaseClient";

// ─── Constants ───────────────────────────────────────────────────────────────

const RAPIDAPI_KEY  = process.env.REACT_APP_TRAILAPI_KEY;
const RAPIDAPI_HOST = "trailapi-trailapi.p.rapidapi.com";

const DIFFICULTY_MAP = {
  1: { label: "Easy",     style: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" },
  2: { label: "Moderate", style: "bg-amber-500/10   text-amber-600   border border-amber-500/20"   },
  3: { label: "Hard",     style: "bg-red-500/10     text-red-600     border border-red-500/20"     },
};

const TRAIL_EMOJIS = ["🌲", "🏔️", "🌄", "🌿", "🌊", "🦅", "🌸", "🍂"];

const TRAIL_COLLECTIONS = [
  { id: "bucket_list", label: "Bucket list", emoji: "📋" },
  { id: "trending", label: "Trending", emoji: "🔥" },
  { id: "best_views", label: "Best views", emoji: "🌄" },
  { id: "worth_trip", label: "Worth the trip", emoji: "🗺️" },
  { id: "dog_friendly", label: "Dog friendly", emoji: "🐕" },
  { id: "kid_friendly", label: "Kid friendly", emoji: "🧒" },
  { id: "waterfalls", label: "Waterfalls", emoji: "💦" },
  { id: "easy_wins", label: "Easy wins", emoji: "🌿" },
  { id: "nearby", label: "Nearby", emoji: "✨" },
];

const CURATED_TRAIL_COLLECTIONS = {
  bucket_list: [
    { id: 1001, name: "Half Dome Trail", city: "Yosemite National Park", state: "California", difficulty: 3, length: 16.5, ascent: 4800, rating: 4.9, ratingCount: 12000, features: ["Views"], description: "The cables, the granite, the Yosemite Valley views. A true rite-of-passage hike that requires planning and a permit." },
    { id: 1002, name: "Angels Landing Trail", city: "Zion National Park", state: "Utah", difficulty: 3, length: 4.3, ascent: 1827, rating: 4.9, ratingCount: 34000, features: ["Views"], description: "A dramatic spine of sandstone with huge Zion Canyon views. Iconic, exposed, and absolutely a someday hike." },
    { id: 1003, name: "Kalalau Trail", city: "Na Pali Coast", state: "Hawaii", difficulty: 3, length: 22, ascent: 6100, rating: 4.8, ratingCount: 7000, features: ["Views"], description: "Remote coastal cliffs, jungle, beaches, and serious logistics. One of America's most spectacular backpacking routes." },
    { id: 1004, name: "Havasu Falls, Mooney Falls, and Beaver Falls", city: "Supai", state: "Arizona", difficulty: 3, length: 24.5, ascent: 3600, rating: 4.8, ratingCount: 5000, features: ["Waterfalls"], description: "Turquoise waterfalls in the desert. This is the kind of trail people plan an entire trip around." },
    { id: 1005, name: "Skyline Trail Loop", city: "Mount Rainier National Park", state: "Washington", difficulty: 3, length: 5.6, ascent: 1788, rating: 4.9, ratingCount: 23000, features: ["Views", "Wildflowers"], description: "Wildflowers, glaciers, waterfalls, and Mount Rainier looming over everything. Big payoff in a classic national park loop." },
    { id: 1006, name: "The Narrows", city: "Zion National Park", state: "Utah", difficulty: 2, length: 8.9, ascent: 695, rating: 4.8, ratingCount: 20000, features: ["Water"], description: "A hike through the Virgin River between towering canyon walls. Unusual, immersive, and unforgettable." },
    { id: 1007, name: "South Kaibab Trail to Skeleton Point", city: "Grand Canyon National Park", state: "Arizona", difficulty: 3, length: 6.0, ascent: 2040, rating: 4.8, ratingCount: 9000, features: ["Views"], description: "A classic Grand Canyon descent with massive views and a serious climb back out." },
    { id: 1008, name: "Cascade Canyon Trail", city: "Grand Teton National Park", state: "Wyoming", difficulty: 2, length: 9.1, ascent: 1100, rating: 4.8, ratingCount: 9000, features: ["Views", "Wildlife"], description: "Teton peaks, a glacial lake approach, and a valley that feels cinematic from start to finish." },
    { id: 1009, name: "Precipice Trail", city: "Acadia National Park", state: "Maine", difficulty: 3, length: 2.1, ascent: 1053, rating: 4.8, ratingCount: 6000, features: ["Views"], description: "Iron rungs, exposed cliffs, ocean views, and a very memorable short hike." },
    { id: 1010, name: "Old Rag Mountain Loop", city: "Shenandoah National Park", state: "Virginia", difficulty: 3, length: 9.4, ascent: 2600, rating: 4.8, ratingCount: 14000, features: ["Views"], description: "A beloved East Coast scramble with summit views and enough personality to feel earned." },
  ],
  best_views: [
    { id: 1101, name: "Navajo Loop and Queens Garden Trail", city: "Bryce Canyon National Park", state: "Utah", difficulty: 2, length: 3.0, ascent: 650, rating: 4.9, ratingCount: 28000, features: ["Views"], description: "Hoodoos, switchbacks, amphitheater views, and some of the most surreal scenery in the park system." },
    { id: 1102, name: "Angels Landing Trail", city: "Zion National Park", state: "Utah", difficulty: 3, length: 4.3, ascent: 1827, rating: 4.9, ratingCount: 34000, features: ["Views"], description: "A bucket-list overlook with Zion Canyon spread out below." },
    { id: 1103, name: "Devil's Bridge Trail", city: "Sedona", state: "Arizona", difficulty: 2, length: 3.9, ascent: 521, rating: 4.7, ratingCount: 29000, features: ["Views"], description: "Red rock drama and a natural sandstone arch that delivers the photo everyone wants." },
    { id: 1104, name: "Skyline Trail Loop", city: "Mount Rainier National Park", state: "Washington", difficulty: 3, length: 5.6, ascent: 1788, rating: 4.9, ratingCount: 23000, features: ["Views"], description: "Glacier views, alpine meadows, and Rainier filling the frame." },
    { id: 1105, name: "Emerald Lake Trail", city: "Rocky Mountain National Park", state: "Colorado", difficulty: 2, length: 3.2, ascent: 702, rating: 4.8, ratingCount: 23000, features: ["Views", "Lake"], description: "A string of alpine lakes with classic Rocky Mountain scenery the whole way." },
    { id: 1106, name: "Cathedral Rock Trail", city: "Sedona", state: "Arizona", difficulty: 2, length: 1.5, ascent: 741, rating: 4.8, ratingCount: 18000, features: ["Views"], description: "Short, steep, and glowing at sunset. One of Sedona's signature view hikes." },
    { id: 1107, name: "Highline Trail", city: "Glacier National Park", state: "Montana", difficulty: 3, length: 11.8, ascent: 1950, rating: 4.9, ratingCount: 9000, features: ["Views", "Wildlife"], description: "Big alpine traversing, wildlife, and endless Glacier National Park drama." },
    { id: 1108, name: "Lands End Trail", city: "San Francisco", state: "California", difficulty: 1, length: 3.5, ascent: 320, rating: 4.6, ratingCount: 5000, features: ["Views"], description: "Ocean cliffs, cypress, and Golden Gate views without needing a full-day expedition." },
    { id: 1109, name: "Delicate Arch Trail", city: "Arches National Park", state: "Utah", difficulty: 2, length: 3.2, ascent: 629, rating: 4.8, ratingCount: 16000, features: ["Views"], description: "The payoff is one of the most famous natural arches in the world." },
    { id: 1110, name: "Mount Storm King", city: "Olympic National Park", state: "Washington", difficulty: 3, length: 4.1, ascent: 2100, rating: 4.8, ratingCount: 10000, features: ["Views"], description: "A steep climb to a huge Lake Crescent viewpoint. Short mileage, serious reward." },
  ],
  worth_trip: [
    { id: 1201, name: "Sahale Arm Trail", city: "North Cascades National Park", state: "Washington", difficulty: 3, length: 12.0, ascent: 4000, rating: 4.9, ratingCount: 3000, features: ["Views"], description: "Jagged peaks, glacier camp energy, and one of the most jaw-dropping alpine approaches in the country." },
    { id: 1202, name: "Enchanted Valley Trail", city: "Olympic National Park", state: "Washington", difficulty: 3, length: 26.0, ascent: 1700, rating: 4.8, ratingCount: 2000, features: ["Waterfalls", "Wildlife"], description: "A rainforest valley, waterfalls pouring off cliffs, and an old chalet deep in Olympic wilderness." },
    { id: 1203, name: "The Wave Trail", city: "Coyote Buttes North", state: "Arizona", difficulty: 2, length: 6.4, ascent: 1200, rating: 4.9, ratingCount: 2500, features: ["Views"], description: "Permit-only sandstone swirls that feel almost unreal. Worth the lottery and the planning." },
    { id: 1204, name: "Paintbrush Canyon - Cascade Canyon Loop", city: "Grand Teton National Park", state: "Wyoming", difficulty: 3, length: 19.0, ascent: 4000, rating: 4.9, ratingCount: 2500, features: ["Views", "Lake"], description: "A huge Teton loop with lakes, passes, wildlife, and all-day mountain grandeur." },
    { id: 1205, name: "Grinnell Glacier Trail", city: "Glacier National Park", state: "Montana", difficulty: 3, length: 10.6, ascent: 1600, rating: 4.9, ratingCount: 8000, features: ["Views", "Lake"], description: "Turquoise lakes, cliffs, wildlife, and a glacier viewpoint that feels like a reward." },
    { id: 1206, name: "Hoh River Trail to Blue Glacier", city: "Olympic National Park", state: "Washington", difficulty: 3, length: 34.0, ascent: 3700, rating: 4.8, ratingCount: 1800, features: ["Forest", "Views"], description: "Rainforest to glacier in one epic route. A true Pacific Northwest journey." },
    { id: 1207, name: "Coyote Gulch", city: "Grand Staircase-Escalante", state: "Utah", difficulty: 3, length: 16.0, ascent: 2100, rating: 4.8, ratingCount: 2500, features: ["Water", "Views"], description: "Arches, canyon walls, water, and desert backpacking magic." },
    { id: 1208, name: "Clouds Rest Trail", city: "Yosemite National Park", state: "California", difficulty: 3, length: 14.5, ascent: 3100, rating: 4.9, ratingCount: 7000, features: ["Views"], description: "A less-famous Yosemite epic with some of the best Half Dome and high-country views in the park." },
    { id: 1209, name: "Wonderland Trail", city: "Mount Rainier National Park", state: "Washington", difficulty: 3, length: 93.0, ascent: 22000, rating: 4.9, ratingCount: 1200, features: ["Views"], description: "A full circumnavigation of Mount Rainier. Not casual, very someday-worthy." },
    { id: 1210, name: "Teton Crest Trail", city: "Grand Teton National Park", state: "Wyoming", difficulty: 3, length: 40.0, ascent: 8000, rating: 4.9, ratingCount: 1600, features: ["Views"], description: "A multi-day alpine classic through one of America's most beautiful mountain ranges." },
  ],
  dog_friendly: [
    { id: 1251, name: "Runyon Canyon Loop", city: "Los Angeles", state: "California", difficulty: 2, length: 2.7, ascent: 748, rating: 4.5, ratingCount: 16000, features: ["Dog Friendly", "Views"], description: "A classic LA dog-friendly hike with city views and plenty of people-watching." },
    { id: 1252, name: "Red Rocks Trading Post Trail", city: "Morrison", state: "Colorado", difficulty: 1, length: 1.5, ascent: 357, rating: 4.7, ratingCount: 7000, features: ["Dog Friendly", "Views"], description: "A short, scenic loop through red sandstone formations near Red Rocks Amphitheatre." },
    { id: 1253, name: "Mount Falcon Castle Trail", city: "Morrison", state: "Colorado", difficulty: 2, length: 7.4, ascent: 1725, rating: 4.6, ratingCount: 6000, features: ["Dog Friendly", "Views"], description: "Ruins, foothill views, and enough mileage to make it feel like a real outing." },
    { id: 1254, name: "Lands End Trail", city: "San Francisco", state: "California", difficulty: 1, length: 3.5, ascent: 320, rating: 4.6, ratingCount: 5000, features: ["Dog Friendly", "Views"], description: "Coastal views, cypress trees, and a leash-friendly city escape." },
    { id: 1255, name: "Turkey Mountain Yellow Trail", city: "Tulsa", state: "Oklahoma", difficulty: 2, length: 4.4, ascent: 450, rating: 4.5, ratingCount: 3000, features: ["Dog Friendly"], description: "A beloved urban wilderness area with enough trail variety for repeat dog walks." },
    { id: 1256, name: "Walnut Creek Trail", city: "Austin", state: "Texas", difficulty: 1, length: 7.3, ascent: 350, rating: 4.5, ratingCount: 2500, features: ["Dog Friendly"], description: "Shaded, casual, and popular with local dogs and their humans." },
    { id: 1257, name: "Discovery Park Loop Trail", city: "Seattle", state: "Washington", difficulty: 1, length: 2.8, ascent: 314, rating: 4.7, ratingCount: 7000, features: ["Dog Friendly", "Views"], description: "Forest, bluff, beach energy, and a city-friendly leash walk with big payoff." },
    { id: 1258, name: "Mount Tabor Loop Trail", city: "Portland", state: "Oregon", difficulty: 1, length: 1.9, ascent: 347, rating: 4.6, ratingCount: 4000, features: ["Dog Friendly"], description: "A gentle volcano-park loop with trees, neighborhood charm, and city views." },
    { id: 1259, name: "Eagle Rock via the PCT", city: "Warner Springs", state: "California", difficulty: 2, length: 6.2, ascent: 951, rating: 4.7, ratingCount: 5000, features: ["Dog Friendly", "Views"], description: "A dog-friendly section of the Pacific Crest Trail with a whimsical rock formation payoff." },
    { id: 1260, name: "Forest Park Wildwood Trail", city: "Portland", state: "Oregon", difficulty: 2, length: 6.0, ascent: 900, rating: 4.7, ratingCount: 6000, features: ["Dog Friendly", "Forest"], description: "A lush forest trail system that feels far from the city while staying close to home." },
  ],
  kid_friendly: [
    { id: 1271, name: "Bear Lake Loop", city: "Rocky Mountain National Park", state: "Colorado", difficulty: 1, length: 0.7, ascent: 49, rating: 4.7, ratingCount: 9000, features: ["Kid Friendly", "Lake"], description: "Short, beautiful, and easy to turn into a family mountain memory." },
    { id: 1272, name: "Mossy Cave Trail", city: "Bryce Canyon National Park", state: "Utah", difficulty: 1, length: 0.9, ascent: 121, rating: 4.4, ratingCount: 4000, features: ["Kid Friendly", "Views"], description: "A short Bryce Canyon walk with hoodoos, color, and just enough adventure." },
    { id: 1273, name: "Jordan Pond Path", city: "Acadia National Park", state: "Maine", difficulty: 1, length: 3.3, ascent: 150, rating: 4.7, ratingCount: 6000, features: ["Kid Friendly", "Lake"], description: "A gentle loop with beautiful views and a very good post-hike snack tradition." },
    { id: 1274, name: "Gorge Trail", city: "Watkins Glen State Park", state: "New York", difficulty: 1, length: 2.4, ascent: 520, rating: 4.8, ratingCount: 12000, features: ["Kid Friendly", "Waterfalls"], description: "A fairy-tale gorge hike with stone bridges, waterfalls, and nonstop visual rewards." },
    { id: 1275, name: "Sol Duc Falls Trail", city: "Olympic National Park", state: "Washington", difficulty: 1, length: 1.6, ascent: 200, rating: 4.7, ratingCount: 8000, features: ["Kid Friendly", "Waterfalls"], description: "Rainforest atmosphere and a waterfall bridge scene without a long mileage commitment." },
    { id: 1276, name: "Lower Yosemite Fall Trail", city: "Yosemite National Park", state: "California", difficulty: 1, length: 1.2, ascent: 59, rating: 4.6, ratingCount: 11000, features: ["Kid Friendly", "Waterfalls"], description: "An easy Yosemite classic with huge waterfall drama in season." },
    { id: 1277, name: "Pa'rus Trail", city: "Zion National Park", state: "Utah", difficulty: 1, length: 3.5, ascent: 134, rating: 4.6, ratingCount: 7000, features: ["Kid Friendly", "Views"], description: "Paved, scenic, and relaxed, with big Zion walls all around." },
    { id: 1278, name: "Taggart Lake Loop", city: "Grand Teton National Park", state: "Wyoming", difficulty: 1, length: 3.8, ascent: 439, rating: 4.7, ratingCount: 7000, features: ["Kid Friendly", "Lake"], description: "A family-friendly Teton outing with lake views and mountain drama." },
    { id: 1279, name: "Hidden Valley Nature Trail", city: "Joshua Tree National Park", state: "California", difficulty: 1, length: 1.0, ascent: 118, rating: 4.7, ratingCount: 9000, features: ["Kid Friendly", "Views"], description: "Boulders, desert plants, and a short loop that feels like a natural playground." },
    { id: 1280, name: "Bumpass Hell Trail", city: "Lassen Volcanic National Park", state: "California", difficulty: 2, length: 2.7, ascent: 423, rating: 4.8, ratingCount: 3000, features: ["Kid Friendly"], description: "Boardwalks over bubbling geothermal features. Weird, memorable, and very kid-interesting." },
  ],
  waterfalls: [
    { id: 1301, name: "Mist Trail to Vernal and Nevada Falls", city: "Yosemite National Park", state: "California", difficulty: 3, length: 6.4, ascent: 2200, rating: 4.9, ratingCount: 17000, features: ["Waterfalls"], description: "Granite stairs, roaring water, and two iconic Yosemite waterfalls in one unforgettable climb." },
    { id: 1302, name: "Havasu Falls, Mooney Falls, and Beaver Falls", city: "Supai", state: "Arizona", difficulty: 3, length: 24.5, ascent: 3600, rating: 4.8, ratingCount: 5000, features: ["Waterfalls"], description: "Blue-green waterfalls in red canyon country. The ultimate waterfall trip." },
    { id: 1303, name: "Multnomah Falls and Wahkeena Falls Loop", city: "Columbia River Gorge", state: "Oregon", difficulty: 2, length: 5.1, ascent: 1600, rating: 4.7, ratingCount: 9000, features: ["Waterfalls"], description: "A classic Gorge loop that stacks waterfall after waterfall into one lush hike." },
    { id: 1304, name: "Ricketts Glen Falls Trail Loop", city: "Ricketts Glen State Park", state: "Pennsylvania", difficulty: 2, length: 7.2, ascent: 1036, rating: 4.8, ratingCount: 8000, features: ["Waterfalls"], description: "A waterfall-lover's loop with more cascades than seems reasonable." },
    { id: 1305, name: "Trail of Ten Falls", city: "Silver Falls State Park", state: "Oregon", difficulty: 2, length: 7.4, ascent: 1100, rating: 4.8, ratingCount: 12000, features: ["Waterfalls"], description: "Walk behind waterfalls, through mossy forest, and into peak Pacific Northwest atmosphere." },
    { id: 1306, name: "Gorge Trail", city: "Watkins Glen State Park", state: "New York", difficulty: 1, length: 2.4, ascent: 520, rating: 4.8, ratingCount: 12000, features: ["Waterfalls"], description: "Stone stairways, narrow gorge walls, and a parade of waterfalls." },
    { id: 1307, name: "Cummins Falls Trail", city: "Cummins Falls State Park", state: "Tennessee", difficulty: 2, length: 2.4, ascent: 350, rating: 4.6, ratingCount: 4000, features: ["Waterfalls"], description: "A rugged creek hike to one of Tennessee's most beloved swimming-hole waterfalls." },
    { id: 1308, name: "Abrams Falls Trail", city: "Great Smoky Mountains National Park", state: "Tennessee", difficulty: 2, length: 5.0, ascent: 629, rating: 4.7, ratingCount: 7000, features: ["Waterfalls"], description: "A Smokies classic with a powerful waterfall payoff." },
    { id: 1309, name: "Bridalveil Fall Trail", city: "Yosemite National Park", state: "California", difficulty: 1, length: 0.5, ascent: 80, rating: 4.5, ratingCount: 6000, features: ["Waterfalls"], description: "Short, misty, iconic, and perfect when you want waterfall drama without a long day." },
    { id: 1310, name: "Sol Duc Falls Trail", city: "Olympic National Park", state: "Washington", difficulty: 1, length: 1.6, ascent: 200, rating: 4.7, ratingCount: 8000, features: ["Waterfalls"], description: "Rainforest atmosphere and a photogenic waterfall bridge scene." },
  ],
  easy_wins: [
    { id: 1401, name: "Lands End Trail", city: "San Francisco", state: "California", difficulty: 1, length: 3.5, ascent: 320, rating: 4.6, ratingCount: 5000, features: ["Views"], description: "Golden Gate views, ocean cliffs, and city-accessible magic." },
    { id: 1402, name: "Emerald Lake Trail", city: "Rocky Mountain National Park", state: "Colorado", difficulty: 2, length: 3.2, ascent: 702, rating: 4.8, ratingCount: 23000, features: ["Lake", "Views"], description: "A manageable alpine-lake classic with huge payoff." },
    { id: 1403, name: "Navajo Loop and Queens Garden Trail", city: "Bryce Canyon National Park", state: "Utah", difficulty: 2, length: 3.0, ascent: 650, rating: 4.9, ratingCount: 28000, features: ["Views"], description: "Short enough to fit into a trip day, memorable enough to define it." },
    { id: 1404, name: "Devil's Bridge Trail", city: "Sedona", state: "Arizona", difficulty: 2, length: 3.9, ascent: 521, rating: 4.7, ratingCount: 29000, features: ["Views"], description: "A moderate hike with a famous red-rock arch payoff." },
    { id: 1405, name: "Gorge Trail", city: "Watkins Glen State Park", state: "New York", difficulty: 1, length: 2.4, ascent: 520, rating: 4.8, ratingCount: 12000, features: ["Waterfalls"], description: "Short, dramatic, and packed with visual reward." },
    { id: 1406, name: "Sol Duc Falls Trail", city: "Olympic National Park", state: "Washington", difficulty: 1, length: 1.6, ascent: 200, rating: 4.7, ratingCount: 8000, features: ["Waterfalls"], description: "A lush rainforest walk to a waterfall scene that feels much farther from the road." },
    { id: 1407, name: "Mossy Cave Trail", city: "Bryce Canyon National Park", state: "Utah", difficulty: 1, length: 0.9, ascent: 121, rating: 4.4, ratingCount: 4000, features: ["Views"], description: "A tiny Bryce hike with hoodoos, color, and a sweet little payoff." },
    { id: 1408, name: "Jordan Pond Path", city: "Acadia National Park", state: "Maine", difficulty: 1, length: 3.3, ascent: 150, rating: 4.7, ratingCount: 6000, features: ["Lake", "Views"], description: "A gentle loop with mountain reflections and post-hike popover energy." },
    { id: 1409, name: "Taggart Lake Loop", city: "Grand Teton National Park", state: "Wyoming", difficulty: 1, length: 3.8, ascent: 439, rating: 4.7, ratingCount: 7000, features: ["Lake", "Views"], description: "Approachable Teton scenery with lake views and very little drama." },
    { id: 1410, name: "Bear Lake Loop", city: "Rocky Mountain National Park", state: "Colorado", difficulty: 1, length: 0.7, ascent: 49, rating: 4.7, ratingCount: 9000, features: ["Lake", "Views"], description: "A tiny loop with classic alpine scenery. Perfect for starting or ending a mountain day." },
  ],
};

const trailAddKey = (trail = {}) => (
  trail.id
  || `${trail.name || ""}-${trail.city || ""}-${trail.state || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
);

const TRAIL_PHOTOS = {
  mountain: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80",
  canyon: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=900&q=80",
  waterfall: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=900&q=80",
  forest: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80",
  lake: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
  desert: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  coast: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  dog: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&w=900&q=80",
  family: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=900&q=80",
};

const getCuratedTrailThumbnail = (trail = {}) => {
  const text = `${trail.name || ""} ${trail.city || ""} ${trail.state || ""} ${(trail.features || []).join(" ")}`.toLowerCase();
  if (text.includes("dog")) return TRAIL_PHOTOS.dog;
  if (text.includes("kid")) return TRAIL_PHOTOS.family;
  if (text.includes("waterfall") || text.includes("falls") || text.includes("gorge")) return TRAIL_PHOTOS.waterfall;
  if (text.includes("lake") || text.includes("pond")) return TRAIL_PHOTOS.lake;
  if (text.includes("canyon") || text.includes("zion") || text.includes("bryce") || text.includes("sedona") || text.includes("arches") || text.includes("grand canyon")) return TRAIL_PHOTOS.canyon;
  if (text.includes("coast") || text.includes("beach") || text.includes("lands end") || text.includes("acadia") || text.includes("kalalau")) return TRAIL_PHOTOS.coast;
  if (text.includes("forest") || text.includes("woods") || text.includes("olympic") || text.includes("hoh")) return TRAIL_PHOTOS.forest;
  if (text.includes("desert") || text.includes("joshua tree") || text.includes("coyote") || text.includes("wave")) return TRAIL_PHOTOS.desert;
  return TRAIL_PHOTOS.mountain;
};

const withCuratedTrailThumbnails = (items = []) => (
  items.map((trail) => ({ ...trail, thumbnail: trail.thumbnail || getCuratedTrailThumbnail(trail) }))
);

const parseGooglePlaceLocation = (place = {}, suggestion = {}) => {
  const raw = place.formatted_address || suggestion.secondary_text || "";
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    city: parts[0] || "",
    state: parts[1] || "",
  };
};

const googlePlaceToTrail = (place = {}, suggestion = {}) => {
  const location = parseGooglePlaceLocation(place, suggestion);
  const photo = place.photos?.[0];
  const name = place.name || suggestion.main_text || suggestion.description || "Saved trail";

  return {
    id: place.place_id || suggestion.place_id || `google-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    googlePlaceId: place.place_id || suggestion.place_id || "",
    name,
    city: location.city,
    state: location.state,
    lat: place.geometry?.location?.lat ?? null,
    lon: place.geometry?.location?.lng ?? null,
    difficulty: 2,
    length: null,
    ascent: null,
    rating: place.rating || null,
    ratingCount: place.user_ratings_total || null,
    thumbnail: photo?.photo_reference
      ? `/api/places?action=photo&ref=${encodeURIComponent(photo.photo_reference)}&maxwidth=800`
      : getCuratedTrailThumbnail({ name, ...location, features: ["Views"] }),
    features: ["Views"],
    description: place.editorial_summary?.overview || "A saved outdoor place from Google Places. Details may vary, but it is ready to add to Someday.",
    directions: place.formatted_address || suggestion.description || "",
  };
};

// ─── Friends feed placeholder ────────────────────────────────────────────────

const FRIEND_HIKES = [];

// ─── TrailModal ──────────────────────────────────────────────────────────────

function TrailModal({ trail, photoUrl, photoAttribution, isSaved, onSave, onPlanTrip, onClose, darkMode }) {
  const dm   = darkMode;
  const diff  = DIFFICULTY_MAP[trail.difficulty] ?? DIFFICULTY_MAP[2];
  const emoji = TRAIL_EMOJIS[Math.abs(Number(trail.id) || 0) % TRAIL_EMOJIS.length];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[10100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border max-h-[92vh] flex flex-col ${dm ? 'bg-[#0e1520] border-white/8' : 'bg-white border-slate-200'}`}>

        {/* ── Photo header ── */}
        <div className="relative flex-shrink-0">
          {photoUrl || trail.thumbnail ? (
            <img src={photoUrl || trail.thumbnail} alt={trail.name} className="w-full h-56 object-cover" />
          ) : (
            <div className={`w-full h-56 flex items-center justify-center text-8xl bg-gradient-to-br ${dm ? 'from-[#162b3a] to-[#1a3a4a]' : 'from-teal-50 to-teal-100'}`}>
              {emoji}
            </div>
          )}
          {photoAttribution && (
            <div
              className="absolute bottom-3 right-3 max-w-[70%] rounded-full bg-black/55 px-2.5 py-1 text-[10px] text-white/80 backdrop-blur-sm"
              dangerouslySetInnerHTML={{ __html: photoAttribution }}
            />
          )}
          <div className={`absolute inset-0 bg-gradient-to-t ${dm ? 'from-[#0e1520]' : 'from-white/60'} via-transparent to-black/20`} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-4">
            <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-medium ${diff.style}`}>
              {diff.label}
            </span>
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 pt-4 pb-6">
            <h2 className={`font-['Caveat'] text-3xl font-bold leading-tight mb-0.5 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
              {trail.name}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {trail.city}{trail.state ? `, ${trail.state}` : ""}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {trail.length && (
                <div className={`border rounded-2xl p-3 text-center ${dm ? 'bg-[#161f30] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-['Caveat'] text-xl font-bold text-teal-500 block leading-none">
                    {Number(trail.length).toFixed(1)} mi
                  </span>
                  <span className="text-[10px] uppercase text-slate-500 tracking-wide mt-1 block">Distance</span>
                </div>
              )}
              {trail.ascent && (
                <div className={`border rounded-2xl p-3 text-center ${dm ? 'bg-[#161f30] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-['Caveat'] text-xl font-bold text-teal-500 block leading-none">
                    {Math.round(trail.ascent).toLocaleString()} ft
                  </span>
                  <span className="text-[10px] uppercase text-slate-500 tracking-wide mt-1 block">Elevation</span>
                </div>
              )}
              {trail.rating && (
                <div className={`border rounded-2xl p-3 text-center ${dm ? 'bg-[#161f30] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-['Caveat'] text-xl font-bold text-amber-500 block leading-none">
                    {Number(trail.rating).toFixed(1)} ★
                  </span>
                  <span className="text-[10px] uppercase text-slate-500 tracking-wide mt-1 block">
                    {trail.ratingCount ? `${trail.ratingCount} reviews` : "Rating"}
                  </span>
                </div>
              )}
            </div>

            {/* Features */}
            {trail.features?.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mb-5">
                {trail.features.map((f) => (
                  <span key={f} className="text-[11px] text-teal-600 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1">
                    {f}
                  </span>
                ))}
              </div>
            )}

            {trail.description && (
              <div className="mb-5">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">About</p>
                <p className="text-sm text-slate-500 leading-relaxed">{trail.description}</p>
              </div>
            )}

            {trail.directions && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Getting there</p>
                <p className="text-sm text-slate-500 leading-relaxed">{trail.directions}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => onSave(trail)}
                className={`flex-1 rounded-2xl py-3 text-sm font-['Caveat'] font-bold transition-all duration-200 border ${
                  isSaved
                    ? "bg-teal-500/20 border-teal-500/30 text-teal-600"
                    : dm
                      ? "bg-teal-400 border-transparent text-[#0e1520] hover:bg-teal-300"
                      : "bg-teal-500 border-transparent text-white hover:bg-teal-600"
                }`}
              >
                {isSaved ? "✓ Someday" : "+ Someday"}
              </button>
              <button
                onClick={onPlanTrip}
                className={`flex-1 rounded-2xl py-3 text-sm font-['Caveat'] font-bold transition-all duration-200 border ${dm ? 'bg-violet-400/10 border-violet-400/25 text-violet-400 hover:bg-violet-400/20' : 'bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100'}`}
              >
                + Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── TrailCard ───────────────────────────────────────────────────────────────

function TrailCard({ trail, photoUrl, photoAttribution, onSave, savedIds, onOpen, onPlanTrip, darkMode }) {
  const dm     = darkMode;
  const isSaved = savedIds.has(trail.id);
  const diff    = DIFFICULTY_MAP[trail.difficulty] ?? DIFFICULTY_MAP[2];
  const emoji   = TRAIL_EMOJIS[Math.abs(Number(trail.id) || 0) % TRAIL_EMOJIS.length];
  const imgSrc  = photoUrl || trail.thumbnail;

  return (
    <div
      onClick={onOpen}
      className={`border rounded-2xl overflow-hidden hover:border-teal-400/25 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full flex flex-col ${dm ? 'bg-[#161f30] border-white/5' : 'bg-white border-slate-200'}`}
    >
      {imgSrc ? (
        <div className="relative">
          <img src={imgSrc} alt={trail.name} className="w-full h-36 object-cover" />
          {photoAttribution && (
            <div
              className="absolute bottom-2 right-2 max-w-[75%] rounded-full bg-black/55 px-2 py-0.5 text-[9px] text-white/80 backdrop-blur-sm"
              dangerouslySetInnerHTML={{ __html: photoAttribution }}
            />
          )}
        </div>
      ) : (
        <div className={`w-full h-36 flex items-center justify-center text-5xl bg-gradient-to-br ${dm ? 'from-[#1a2540] to-[#1e3040]' : 'from-teal-50 to-teal-100'}`}>
          {emoji}
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-medium ${diff.style}`}>
            {diff.label}
          </span>
          {trail.rating && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <span className="text-amber-500">★</span>
              {Number(trail.rating).toFixed(1)}
              {trail.ratingCount && <span className="text-slate-400">({trail.ratingCount})</span>}
            </span>
          )}
        </div>

        <h3 className={`font-['Caveat'] text-xl font-semibold leading-tight mb-0.5 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
          {trail.name}
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {trail.city}{trail.state ? `, ${trail.state}` : ""}
        </p>

        <div className="flex gap-1.5 flex-wrap mb-3">
          {trail.length && (
            <span className={`text-[11px] text-slate-500 rounded-md px-2 py-0.5 ${dm ? 'bg-white/5' : 'bg-slate-100'}`}>
              {Number(trail.length).toFixed(1)} mi
            </span>
          )}
          {trail.ascent && (
            <span className={`text-[11px] text-slate-500 rounded-md px-2 py-0.5 ${dm ? 'bg-white/5' : 'bg-slate-100'}`}>
              {Math.round(trail.ascent).toLocaleString()} ft gain
            </span>
          )}
          {trail.features?.slice(0, 1).map((f) => (
            <span key={f} className={`text-[11px] text-slate-500 rounded-md px-2 py-0.5 ${dm ? 'bg-white/5' : 'bg-slate-100'}`}>{f}</span>
          ))}
        </div>

        <div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onSave(trail)}
            className={`flex-1 rounded-xl py-2 text-sm font-['Caveat'] font-bold transition-all duration-200 border ${
              isSaved
                ? "bg-teal-500/20 border-teal-500/30 text-teal-600"
                : dm
                  ? "bg-teal-400/8 border-teal-400/20 text-teal-400 hover:bg-teal-400/15"
                  : "bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100"
            }`}
          >
            {isSaved ? "✓ Someday" : "+ Someday"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlanTrip?.(trail);
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-['Caveat'] font-bold transition-all duration-200 border ${dm ? 'bg-violet-400/8 border-violet-400/20 text-violet-400 hover:bg-violet-400/15' : 'bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100'}`}
          >
            + Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FeedCard ─────────────────────────────────────────────────────────────────

function FeedCard({ item, darkMode }) {
  const dm = darkMode;
  const [liked, setLiked] = useState(false);
  const likeCount = liked ? item.likes + 1 : item.likes;

  return (
    <div className={`border rounded-2xl p-4 flex gap-3 ${dm ? 'bg-[#161f30] border-white/5' : 'bg-white border-slate-200'}`}>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-violet-500 flex items-center justify-center font-['Caveat'] text-base font-bold text-white flex-shrink-0">
        {item.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start flex-wrap gap-x-1.5 gap-y-0.5 mb-1">
          <span className={`text-sm font-medium ${dm ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</span>
          <span className="text-sm text-slate-500">{item.action}</span>
          <span className="text-sm text-teal-500">{item.trail}</span>
          {item.suffix && <span className="text-sm text-slate-500">{item.suffix}</span>}
          <span className="text-xs text-slate-400 ml-auto">{item.time}</span>
        </div>
        {item.note && (
          <p className="text-sm text-slate-500 italic leading-relaxed mb-2">"{item.note}"</p>
        )}
        {item.hasPhoto && (
          <div className={`w-full h-24 rounded-xl flex items-center justify-center text-3xl mb-2 bg-gradient-to-br ${dm ? 'from-[#1a2540] to-[#1e3040]' : 'from-teal-50 to-teal-100'}`}>
            📸
          </div>
        )}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLiked((l) => !l)}
            className={`text-xs flex items-center gap-1 transition-colors duration-150 ${liked ? "text-pink-500" : "text-slate-400 hover:text-pink-500"}`}
          >
            {liked ? "♥" : "♡"} {likeCount} likes
          </button>
          <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-150">
            💬 {item.comments} comments
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function TrailRecommendModal({ query, onQueryChange, onSearch, onClose, loading, darkMode }) {
  const dm = darkMode;

  return createPortal(
    <div
      className="fixed inset-0 z-[10100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl border p-5 shadow-2xl ${dm ? 'bg-[#0e1520] border-white/8' : 'bg-white border-slate-200'}`}>
        <div className="w-10 h-1 rounded-full bg-slate-400/30 mx-auto mb-5" />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-teal-500 font-bold">Recommend a trail</p>
            <h2 className={`font-['Caveat'] text-3xl font-bold leading-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
              Share a hike worth saving
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${dm ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
          >
            ×
          </button>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed mb-5">
          Search for the trail, park, or city. We'll pull matching trails into the sheet so you can save one to Someday.
        </p>
        <div className="flex gap-2.5">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Try: Skyline Trail, Zion, waterfalls..."
            className={`flex-1 min-w-0 border rounded-2xl px-4 py-3 text-sm outline-none ${dm ? 'bg-[#161f30] border-white/7 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'}`}
          />
          <button
            onClick={onSearch}
            disabled={loading || !query.trim()}
            className={`rounded-2xl px-5 py-3 text-sm font-medium disabled:opacity-50 ${dm ? 'bg-teal-400 text-[#0e1520]' : 'bg-teal-500 text-white'}`}
          >
            Search
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function HikingPage({ onBack, onAddToSomeday, onPlanEvent, darkMode = false } = {}) {
  const dm = darkMode;
  const [query, setQuery]               = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [trails, setTrails]             = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [savedIds, setSavedIds]         = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);
  const [placePhotos, setPlacePhotos]   = useState({});
  const [photoAttributions, setPhotoAttributions] = useState({});
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [trailSuggestions, setTrailSuggestions] = useState([]);
  const [trailSuggesting, setTrailSuggesting] = useState(false);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [recommendQuery, setRecommendQuery] = useState("");
  const fetchedRef = useRef(new Set());

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      ()    => setUserLocation({ lat: 37.7749, lon: -122.4194 })
    );
  }, []);

  useEffect(() => {
    if (activeFilter === "nearby" && userLocation) fetchTrails(userLocation.lat, userLocation.lon);
  }, [activeFilter, userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTrails = useCallback(async (lat, lon, searchQuery = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat, lon, radius: 30, limit: 20,
        ...(searchQuery && { "q[name_cont]": searchQuery }),
      });
      const res = await fetch(`https://${RAPIDAPI_HOST}/trails/explore/?${params}`, {
        headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST },
      });
      if (!res.ok) throw new Error("Failed to fetch trails");
      const data = await res.json();
      const normalized = (data.data || []).map((t, i) => ({
        id:          t.unique_id ?? i,
        name:        t.name,
        city:        t.city,
        state:       t.state,
        lat:         t.lat,
        lon:         t.lon,
        description: t.description,
        directions:  t.directions,
        difficulty:  parseDifficulty(t.activities),
        length:      t.activities?.[0]?.attribs?.length ?? null,
        ascent:      t.activities?.[0]?.attribs?.["ele_gain"] ?? null,
        rating:      t.activities?.[0]?.rating ?? null,
        ratingCount: t.activities?.[0]?.rating_count ?? null,
        thumbnail:   t.activities?.[0]?.thumbnail ?? null,
        url:         t.activities?.[0]?.url ?? null,
        features:    parseFeatures(t),
      }));
      setTrails(normalized);
      return normalized;
    } catch (err) {
      console.error(err);
      setError("Couldn't load trails. Check your API key or try again.");
      setTrails(MOCK_TRAILS);
      return MOCK_TRAILS;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrailPhoto = useCallback(async (trail) => {
    if (fetchedRef.current.has(String(trail.id))) return;
    fetchedRef.current.add(String(trail.id));
    try {
      const q = encodeURIComponent(`${trail.name} trail ${trail.city || ""} ${trail.state || ""}`);
      const res  = await fetch(`/api/places?action=textsearch&query=${q}&type=park`);
      const data = await res.json();
      const photo = data.results?.[0]?.photos?.[0];
      const photoRef = photo?.photo_reference;
      if (photoRef) {
        const url = `/api/places?action=photo&ref=${encodeURIComponent(photoRef)}&maxwidth=800`;
        setPlacePhotos((prev) => ({ ...prev, [trail.id]: url }));
        const attribution = photo.html_attributions?.[0] || '';
        if (attribution) {
          setPhotoAttributions((prev) => ({ ...prev, [trail.id]: attribution }));
        }
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!trails.length) return;
    trails.forEach((t) => fetchTrailPhoto(t));
  }, [trails, fetchTrailPhoto]);

  const handleSearch = () => {
    setActiveFilter("");
    if (userLocation) fetchTrails(userLocation.lat, userLocation.lon, query);
  };

  const handleRecommendSearch = () => {
    const nextQuery = recommendQuery.trim();
    if (!nextQuery) return;
    setQuery(nextQuery);
    setActiveFilter("");
    setIsRecommendOpen(false);
    if (userLocation) fetchTrails(userLocation.lat, userLocation.lon, nextQuery);
  };

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setTrailSuggestions([]);
      setTrailSuggesting(false);
      return;
    }

    let active = true;
    setTrailSuggesting(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?action=autocomplete&input=${encodeURIComponent(term)}`);
        const data = await res.json();
        if (!active) return;
        if (data.status === "OK" && Array.isArray(data.predictions)) {
          setTrailSuggestions(data.predictions.slice(0, 5).map((p) => ({
            place_id: p.place_id,
            description: p.description,
            main_text: p.structured_formatting?.main_text || p.description,
            secondary_text: p.structured_formatting?.secondary_text || "",
          })));
        } else {
          setTrailSuggestions([]);
        }
      } catch {
        if (active) setTrailSuggestions([]);
      } finally {
        if (active) setTrailSuggesting(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSuggestionSelect = async (suggestion) => {
    const nextQuery = suggestion.main_text || suggestion.description;
    setQuery(nextQuery);
    setActiveFilter("");
    setTrailSuggestions([]);
    setTrailSuggesting(false);

    try {
      const res = await fetch(`/api/places?action=details&place_id=${encodeURIComponent(suggestion.place_id)}`);
      const data = await res.json();
      const place = data.result;
      const loc = place?.geometry?.location;
      if (loc) {
        const nextLocation = { lat: loc.lat, lon: loc.lng };
        setUserLocation(nextLocation);
        const googleTrail = googlePlaceToTrail(place, suggestion);
        const matchedTrails = await fetchTrails(nextLocation.lat, nextLocation.lon, nextQuery);
        const hasExactMatch = (matchedTrails || []).some((trail) => (
          String(trail.id) === String(googleTrail.id)
          || trail.googlePlaceId === googleTrail.googlePlaceId
          || trail.name?.trim().toLowerCase() === googleTrail.name.trim().toLowerCase()
        ));
        setTrails(hasExactMatch ? matchedTrails : [googleTrail, ...(matchedTrails || [])]);

        const attribution = place.photos?.[0]?.html_attributions?.[0] || "";
        if (attribution) {
          setPhotoAttributions((prev) => ({ ...prev, [googleTrail.id]: attribution }));
        }
        return;
      }
    } catch {
      // Fall through to the normal TrailAPI name search.
    }

    if (userLocation) fetchTrails(userLocation.lat, userLocation.lon, nextQuery);
  };

  const fetchTrendingTrails = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQuery("");
    setTrailSuggestions([]);
    setTrailSuggesting(false);

    try {
      const { data, error } = await supabase.rpc("get_most_added_trails", { p_limit: 10 });
      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        setTrails(data.map((row) => ({
          id: row.trail_key,
          name: row.trail_name,
          city: row.city || "",
          state: row.state || "",
          difficulty: Number(row.difficulty || 2),
          length: row.length == null ? null : Number(row.length),
          ascent: row.ascent == null ? null : Number(row.ascent),
          rating: row.rating == null ? null : Number(row.rating),
          ratingCount: row.rating_count == null ? null : Number(row.rating_count),
          thumbnail: row.photo || getCuratedTrailThumbnail({
            name: row.trail_name,
            city: row.city,
            state: row.state,
            features: Array.isArray(row.features) ? row.features : [],
          }),
          features: Array.isArray(row.features) ? row.features : [],
          description: row.description || `Added to ${Number(row.add_count || 0).toLocaleString()} Someday board${Number(row.add_count || 0) === 1 ? "" : "s"}.`,
        })));
        return true;
      }
    } catch {
      // Fall back until the trail add-count migration has been applied.
    } finally {
      setLoading(false);
    }

    setTrails(withCuratedTrailThumbnails(CURATED_TRAIL_COLLECTIONS.bucket_list));
    setError("Trending will use real Someday saves after the trail add-count migration is applied. Showing bucket-list trails for now.");
    return true;
  }, []);

  const handleTrailCollection = (collection) => {
    if (activeFilter === collection.id) {
      setActiveFilter("");
      setQuery("");
      setTrailSuggestions([]);
      setTrailSuggesting(false);
      setError(null);
      setTrails([]);
      return;
    }

    setActiveFilter(collection.id);
    setQuery("");
    setTrailSuggestions([]);
    setTrailSuggesting(false);
    setError(null);

    if (collection.id === "nearby") {
      if (userLocation) fetchTrails(userLocation.lat, userLocation.lon);
      return;
    }

    if (collection.id === "trending") {
      fetchTrendingTrails();
      return;
    }

    setTrails(withCuratedTrailThumbnails(CURATED_TRAIL_COLLECTIONS[collection.id] || CURATED_TRAIL_COLLECTIONS.bucket_list));
  };

  const recordTrailAdd = useCallback(async (trail = {}) => {
    const trailName = trail.name || trail.title || "";
    const key = trailAddKey({ ...trail, name: trailName });
    if (!key || !trailName) return;

    try {
      await supabase.rpc("record_trail_add", {
        p_trail_key: String(key),
        p_trail_name: trailName,
        p_city: trail.city || null,
        p_state: trail.state || null,
        p_photo: trail.thumbnail || placePhotos[trail.id] || null,
        p_difficulty: trail.difficulty ? Number(trail.difficulty) : null,
        p_length: trail.length ? Number(trail.length) : null,
        p_ascent: trail.ascent ? Number(trail.ascent) : null,
        p_rating: trail.rating ? Number(trail.rating) : null,
        p_rating_count: trail.ratingCount ? Number(trail.ratingCount) : null,
        p_features: Array.isArray(trail.features) ? trail.features : [],
        p_description: trail.description || null,
      });
    } catch {
      // Trending gracefully falls back until this migration exists in Supabase.
    }
  }, [placePhotos]);

  const handleSave = (trail) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(trail.id) ? next.delete(trail.id) : next.add(trail.id);
      return next;
    });
    recordTrailAdd(trail);
    onAddToSomeday?.(trail);
  };

  const handlePlanTrip = (trail) => {
    setSelectedTrail(null);
    onPlanEvent?.({ title: `Hike: ${trail.name}` });
  };

  const filteredTrails = trails;

  const featuredTrail = filteredTrails[0] ?? null;
  const gridTrails    = filteredTrails.slice(1, 7);
  const activeCollection = TRAIL_COLLECTIONS.find((item) => item.id === activeFilter);
  const sectionLabel = activeFilter === "nearby"
    ? "Trails near you"
    : activeCollection?.label || (query.trim() ? `Results for "${query.trim()}"` : "Trails worth saving");

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen font-sans ${dm ? 'bg-[#0e1520] text-slate-200' : 'bg-[#faf8f3] text-slate-800'}`}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap'); .font-handwritten { font-family: 'Caveat', cursive; }`}</style>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-28">

        {/* -- Hero -- */}
        <div className={`relative bg-gradient-to-br rounded-3xl p-8 mb-6 overflow-hidden border ${dm ? 'from-[#0f2027] via-[#162b3a] to-[#0e1520] border-white/5' : 'from-slate-50 via-teal-50 to-slate-50 border-teal-100'}`}>
          {onBack && (
            <button
              onClick={onBack}
              className={`absolute top-5 left-5 z-10 w-9 h-9 rounded-xl flex items-center justify-center active:opacity-70 flex-shrink-0 ${dm ? 'bg-white/5 text-slate-300' : 'bg-white/80 text-slate-600 border border-slate-200/70'}`}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(45,212,191,0.08),transparent)]" />
          <div className="absolute right-8 top-6 text-8xl opacity-10 rotate-12 select-none">🏔️</div>
          <h1 className={`font-handwritten text-5xl font-bold leading-tight mb-2 mt-10 bg-gradient-to-r bg-clip-text text-transparent ${dm ? 'from-slate-100 to-teal-300' : 'from-slate-800 to-teal-600'}`}>
            Hit the trails
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
            Discover trails near you, save hikes to your Someday List, and see where your friends have been adventuring.
          </p>
        </div>

        {/* ── Search ── */}
        <div className="relative flex gap-2.5 mb-5">
          <div className="relative flex-1 min-w-0">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search trails, parks, or cities..."
              className={`w-full border rounded-2xl px-4 py-3 text-sm outline-none transition-colors ${dm ? 'bg-[#161f30] border-white/7 text-slate-200 placeholder-slate-500 focus:border-teal-400/40' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-400'}`}
            />
            {(trailSuggesting || trailSuggestions.length > 0) && query.trim().length >= 2 && (
              <div className={`absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border shadow-xl ${dm ? 'bg-[#111827] border-white/10 shadow-black/30' : 'bg-white border-slate-200 shadow-slate-900/10'}`}>
                {trailSuggesting && trailSuggestions.length === 0 ? (
                  <div className={`px-4 py-3 text-sm ${dm ? 'text-slate-400' : 'text-slate-500'}`}>Looking up trails and parks...</div>
                ) : trailSuggestions.map((suggestion, idx) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={`w-full border-0 px-4 py-3 text-left transition-colors ${idx === trailSuggestions.length - 1 ? '' : dm ? 'border-b border-white/7' : 'border-b border-slate-100'} ${dm ? 'bg-transparent hover:bg-white/5 text-slate-100' : 'bg-transparent hover:bg-slate-50 text-slate-800'}`}
                  >
                    <div className="text-sm font-semibold leading-tight">{suggestion.main_text}</div>
                    {suggestion.secondary_text && (
                      <div className={`mt-1 text-xs ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{suggestion.secondary_text}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`rounded-2xl px-5 py-3 text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap ${dm ? 'bg-teal-400 text-[#0e1520] hover:bg-teal-300' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
          >
            {loading ? "Searching…" : "Find Trails"}
          </button>
        </div>

        {/* ── Filter chips ── */}
        <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TRAIL_COLLECTIONS.map((collection) => (
            <button
              key={collection.id}
              onClick={(e) => {
                e.currentTarget.blur();
                handleTrailCollection(collection);
              }}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs transition-all duration-200 border focus:outline-none focus-visible:outline-none ${
                activeFilter === collection.id
                  ? "bg-teal-400/12 border-teal-400/40 text-teal-600"
                  : dm
                    ? "bg-white/5 border-white/7 text-slate-500"
                    : "bg-slate-100 border-slate-200 text-slate-500"
              }`}
            >
              {collection.emoji} {collection.label}
            </button>
          ))}
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-500 mb-6">
            {error}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`rounded-2xl h-64 animate-pulse border ${dm ? 'bg-[#161f30] border-white/5' : 'bg-slate-200 border-slate-200'}`} />
            ))}
          </div>
        )}

        {/* ── Featured trail ── */}
        {!loading && featuredTrail && (
          <>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">Featured {sectionLabel}</p>
            <div
              onClick={() => setSelectedTrail(featuredTrail)}
              className={`border border-teal-400/15 rounded-3xl overflow-hidden mb-8 hover:border-teal-400/30 transition-colors cursor-pointer ${dm ? 'bg-[#161f30]' : 'bg-white'}`}
            >
              <div className="grid grid-cols-2 max-sm:grid-cols-1">
                {(placePhotos[featuredTrail.id] || featuredTrail.thumbnail) ? (
                  <div className="relative">
                    <img
                      src={placePhotos[featuredTrail.id] || featuredTrail.thumbnail}
                      alt={featuredTrail.name}
                      className="w-full h-52 object-cover"
                    />
                    {placePhotos[featuredTrail.id] && photoAttributions[featuredTrail.id] && (
                      <div
                        className="absolute bottom-3 right-3 max-w-[70%] rounded-full bg-black/55 px-2.5 py-1 text-[10px] text-white/80 backdrop-blur-sm"
                        dangerouslySetInnerHTML={{ __html: photoAttributions[featuredTrail.id] }}
                      />
                    )}
                  </div>
                ) : (
                  <div className={`h-52 flex items-center justify-center text-7xl bg-gradient-to-br ${dm ? 'from-[#162b3a] to-[#1a3a4a]' : 'from-teal-50 to-teal-100'}`}>
                    🌲
                  </div>
                )}
                <div className="p-6 flex flex-col justify-center">
                  <p className="text-[10px] uppercase tracking-widest text-teal-500 mb-2">⭐ Top rated this week</p>
                  <h2 className={`font-['Caveat'] text-2xl font-bold leading-tight mb-2 ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
                    {featuredTrail.name}
                  </h2>
                  {featuredTrail.description && (
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                      {featuredTrail.description}
                    </p>
                  )}
                  <div className="flex gap-4 flex-wrap">
                    {featuredTrail.length && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-500">
                          {Number(featuredTrail.length).toFixed(1)} mi
                        </span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Distance</span>
                      </div>
                    )}
                    {featuredTrail.ascent && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-500">
                          {Math.round(featuredTrail.ascent).toLocaleString()} ft
                        </span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Elevation</span>
                      </div>
                    )}
                    {featuredTrail.rating && (
                      <div className="flex flex-col">
                        <span className="font-['Caveat'] text-xl font-semibold text-teal-500">
                          {Number(featuredTrail.rating).toFixed(1)} ★
                        </span>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wide">Rating</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Recommend a trail CTA ── */}
        <div className={`relative overflow-hidden rounded-3xl border p-6 mb-8 text-center ${dm ? 'bg-gradient-to-br from-[#102331] via-[#162b3a] to-[#0e1520] border-teal-400/15 shadow-black/20' : 'bg-gradient-to-br from-teal-50 via-emerald-50 to-slate-50 border-teal-100'}`}>
          <div className={`absolute -right-10 -top-10 w-28 h-28 rounded-full ${dm ? 'bg-teal-400/10' : 'bg-teal-300/20'}`} />
          <div className={`absolute -left-8 -bottom-8 w-24 h-24 rounded-full ${dm ? 'bg-violet-400/8' : 'bg-violet-200/25'}`} />
          <div className="relative">
            <div className="text-3xl mb-2">🥾</div>
            <h3 className={`font-['Caveat'] text-2xl font-bold leading-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>
              Know a trail worth saving?
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Recommend a hike, hidden overlook, or park people should add to Someday.
            </p>
            <button
              onClick={() => setIsRecommendOpen(true)}
              className={`rounded-full px-6 py-3 font-['Caveat'] text-lg font-bold transition-all ${dm ? 'bg-teal-400 text-[#0e1520] hover:bg-teal-300' : 'bg-teal-500 text-white hover:bg-teal-600'}`}
            >
              Recommend a trail
            </button>
          </div>
        </div>

        {/* ── Trail grid ── */}
        {!loading && gridTrails.length > 0 && (
          <>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">{sectionLabel}</p>
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3 mb-8">
              {gridTrails.map((trail) => (
                <TrailCard
                  key={trail.id}
                  trail={trail}
                  photoUrl={placePhotos[trail.id] || trail.thumbnail || null}
                  photoAttribution={placePhotos[trail.id] ? photoAttributions[trail.id] : ''}
                  onSave={handleSave}
                  savedIds={savedIds}
                  onOpen={() => setSelectedTrail(trail)}
                  onPlanTrip={(item) => handlePlanTrip(item)}
                  darkMode={dm}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && filteredTrails.length === 0 && !error && (activeFilter || query.trim()) && (
          <div className="text-center py-16 text-slate-400 mb-8">
            <div className="text-5xl mb-4">🗺️</div>
            <p className={`font-['Caveat'] text-2xl mb-1 ${dm ? 'text-slate-400' : 'text-slate-600'}`}>No trails found</p>
            <p className="text-sm">Try a different location or filter</p>
          </div>
        )}

        {/* ── Someday banner ── */}
        {savedIds.size > 0 && (
          <div className="bg-gradient-to-r from-violet-500/10 to-pink-500/8 border border-violet-400/20 rounded-3xl p-5 mb-8 flex items-center gap-4">
            <span className="text-3xl flex-shrink-0">📌</span>
            <div>
              <h3 className={`font-['Caveat'] text-xl font-bold leading-tight ${dm ? 'text-slate-100' : 'text-slate-900'}`}>Your Someday List</h3>
              <p className="text-sm text-slate-500">
                You've saved {savedIds.size} trail{savedIds.size !== 1 ? "s" : ""} — ready to pick a date?
              </p>
            </div>
            <button className="ml-auto bg-violet-400/12 border border-violet-400/25 rounded-2xl px-4 py-2.5 text-sm text-violet-600 hover:bg-violet-400/20 transition-all whitespace-nowrap">
              View list →
            </button>
          </div>
        )}

        {/* ── Community feed ── */}
        {FRIEND_HIKES.length > 0 && (
          <>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-3">Friends' recent hikes</p>
            <div className="flex flex-col gap-2.5">
              {FRIEND_HIKES.map((item) => <FeedCard key={item.id} item={item} darkMode={dm} />)}
            </div>
          </>
        )}

      </div>

      {/* ── Modal ── */}
      {selectedTrail && (
        <TrailModal
          trail={selectedTrail}
          photoUrl={placePhotos[selectedTrail.id] || selectedTrail.thumbnail || null}
          photoAttribution={placePhotos[selectedTrail.id] ? photoAttributions[selectedTrail.id] : ''}
          isSaved={savedIds.has(selectedTrail.id)}
          onSave={handleSave}
          onPlanTrip={() => handlePlanTrip(selectedTrail)}
          onClose={() => setSelectedTrail(null)}
          darkMode={dm}
        />
      )}

      {isRecommendOpen && (
        <TrailRecommendModal
          query={recommendQuery}
          onQueryChange={setRecommendQuery}
          onSearch={handleRecommendSearch}
          onClose={() => setIsRecommendOpen(false)}
          loading={loading}
          darkMode={dm}
        />
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDifficulty(activities) {
  if (!activities?.length) return 2;
  const desc = (activities[0]?.difficulty ?? "").toLowerCase();
  if (desc.includes("easy") || desc === "green") return 1;
  if (desc.includes("hard") || desc.includes("black") || desc.includes("expert")) return 3;
  return 2;
}

function parseFeatures(trail) {
  const features = [];
  const desc = trail.description?.toLowerCase() ?? "";
  if (desc.includes("dog"))                             features.push("Dog Friendly");
  if (desc.includes("kid") || desc.includes("family")) features.push("Kid Friendly");
  if (desc.includes("view") || desc.includes("summit")) features.push("Views");
  return features;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TRAILS = [
  { id: 1, name: "Mission Peak Loop",       city: "Fremont",       state: "California", difficulty: 2, length: 6.1,  ascent: 2100, rating: 4.7, ratingCount: 312, thumbnail: null, features: ["Views"],                   description: "A challenging loop to the summit of Mission Peak with panoramic views of the Bay Area. The final push to the pole is steep but rewarding.", directions: "Take Mission Boulevard to Stanford Avenue. Parking at the Hidden Valley trailhead." },
  { id: 2, name: "Muir Woods Loop",         city: "Mill Valley",   state: "California", difficulty: 1, length: 2.4,  ascent: 180,  rating: 4.5, ratingCount: 891, thumbnail: null, features: ["Dog Friendly"],            description: "A gentle stroll through ancient coast redwoods. The Cathedral Grove section features trees over 1,000 years old.", directions: "Take US-101 to the Muir Woods Road exit. Parking reservations required." },
  { id: 3, name: "Mt. Tamalpais East Peak", city: "Marin County",  state: "California", difficulty: 3, length: 10.5, ascent: 3400, rating: 4.9, ratingCount: 145, thumbnail: null, features: ["Views"],                   description: "An epic summit hike with sweeping views of the Golden Gate and San Francisco Bay on clear days.", directions: "Access via Pantoll Station on Panoramic Highway. Take the Steep Ravine trail to the summit." },
  { id: 4, name: "Lands End Trail",         city: "San Francisco", state: "California", difficulty: 1, length: 3.5,  ascent: 320,  rating: 4.6, ratingCount: 527, thumbnail: null, features: ["Kid Friendly"],            description: "A scenic coastal trail along the western edge of San Francisco with views of the Marin Headlands and shipwrecks below.", directions: "Start at the Lands End Lookout visitor center off Point Lobos Avenue." },
  { id: 5, name: "Ring Mountain Preserve",  city: "Tiburon",       state: "California", difficulty: 2, length: 4.2,  ascent: 850,  rating: 4.4, ratingCount: 203, thumbnail: null, features: ["Views", "Dog Friendly"],   description: "A hidden gem in Marin with wildflowers in spring and stunning bay views. Look for the ancient Native American rock carvings.", directions: "Take Paradise Drive north from Corte Madera. Trailhead parking on Paradise Drive." },
];
