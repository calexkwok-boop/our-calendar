import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
const NAVY_DEEP    = "#0F1929";
const NAVY_SURFACE = "#162240";
const DREAMSHELF_IMAGE_CACHE_STORAGE_KEY = "dream-shelf-image-cache-v1";

const readDreamShelfImageCache = () => {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DREAMSHELF_IMAGE_CACHE_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const writeDreamShelfImageCache = (cache) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DREAMSHELF_IMAGE_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {}
};

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

const getDreamShelfProductSearchQuery = (item = {}) => {
  const brand = item.product_brand || item.brand || "";
  const name = item.product_name || item.name || "";
  const query = [brand, name].filter(Boolean).join(" ").trim();
  return query || item.imageQuery || name;
};

const isDreamShelfWeakImageUrl = (url = "") => (
  /source\.unsplash\.com\/featured/i.test(String(url || ""))
);

const isDreamShelfCachedImageUrl = (url = "") => (
  /\/storage\/v1\/object\/public\/dream-shelf-images\//i.test(String(url || ""))
);

const getDreamShelfCategoryMeta = (categoryId) => (
  CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
);

const inferDreamShelfCategory = (text = "") => {
  const q = text.toLowerCase();
  if (/(watch|rolex|omega|patek|audemars|cartier santos|iwc|tag heuer|daytona|submariner|hublot|big bang)/.test(q)) return "watches";
  if (/(bag|purse|tote|birkin|kelly|chanel|celine|prada|bottega|louis vuitton|gucci)/.test(q)) return "bags";
  if (/(ring|bracelet|necklace|earring|jewelry|jewellery|tiffany|van cleef|love bracelet)/.test(q)) return "jewelry";
  if (/(sneaker|jordan|nike|adidas|new balance|common projects|dunk|samba)/.test(q)) return "sneakers";
  if (/(heel|heels|pump|stiletto|louboutin|manolo|jimmy choo|aquazzura|gianvito|sergio rossi|opyum|mule)/.test(q)) return "heels";
  if (/(golf|putter|driver|iron|scotty|taylormade|titleist|footjoy|vokey|bushnell|tennis|pickleball|selkirk|running|marathon|garmin forerunner|peloton|cycling|bike|formula 1|f1|grand prix|nba|courtside|basketball)/.test(q)) return "golf";
  if (/(cookware|cooking|kitchen|dutch oven|le creuset)/.test(q)) return "kitchen";
  if (/(espresso|breville|la marzocco|niche zero|pour over|coffee grinder|coffee machine|stagg kettle|acaia)/.test(q)) return "coffee";
  if (/(sofa|linen sheet|parachute|aesop candle|byredo|le labo|santal|restoration hardware|hay chair|sonos|gallery wall|fragrance|perfume)/.test(q)) return "home";
  if (/(eight sleep|oura ring|theragun|sauna|red light|whoop|normatec|hyperice|joovv)/.test(q)) return "wellness";
  if (/(porsche|ferrari|bmw m3|mclaren|lamborghini|range rover|mercedes amg|taycan|supercar|sports car|track day)/.test(q)) return "cars";
  if (/(safari|northern lights|aurora|amalfi|cappadocia|michelin star|private chef|coachella|napa valley|tokyo food)/.test(q)) return "experiences";
  if (/(camera|guitar|piano|art|leica|fender|gibson)/.test(q)) return "hobbies";
  if (/(whiskey|whisky|bourbon|macallan|yamazaki|hibiki|pappy|van winkle|clase azul|don julio|cognac|louis xiii)/.test(q)) return "whiskey";
  if (/(wine|champagne|cellar|bordeaux|burgundy)/.test(q)) return "cellar";
  if (/(ski|snowboard|tent|kayak|adventure)/.test(q)) return "adventure";
  return "watches";
};

const getDreamShelfFallbackDescription = (query = "") => (
  `A searched Someday find for "${query}". Add your own photo if this is the exact piece you want to save.`
);

const DREAMSHELF_IMAGES = {
  w1: "https://media.rolex.com/image/upload/q_auto/f_auto/t_v7-cover-majesty-landscape/c_limit,w_1200/v1/a677b2c664f6/catalogue/2026/upright-c/m124060-0001",
  w2: "https://cdn11.bigcommerce.com/s-bc02e/images/stencil/1280x1280/products/115242/131000/5811-1G-001__92862.1759960514.jpg?c=2",
  w3: "https://dynamicmedia.audemarspiguet.com/is/image/audemarspiguet/lbv3_RO_collection?size=1920,0&wid=1920&fmt=avif-alpha&dpr=off",
  w4: "https://www.omegawatches.com/media/catalog/product/o/m/omega-speedmaster-moonwatch-professional-co-axial-master-chronometer-chronograph-42-mm-31030425001001-3ccf4a.png?w=900",
  w5: "https://cdn2.jomashop.com/media/catalog/product/cache/0ee3019724ce73007b606b54ba535a23/r/o/rolex-cosmograph-daytona-white-dial-stainless-steel-oyster-mens-watch-116500wso-m116500ln0001.jpg?width=546&height=546",
  w6: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/w6-cartier-santos.avif",
  w7: "https://www.watchesofswitzerland.com/cdn/shop/files/17381902_1.jpg?height=948&v=1743889835&width=948",
  w8: "https://img.iwc.com/cluster-overview-lg-2/o-dpr-2/e6a2f75233ae6901b6842c6abe142d6834ebf5fc.jpg",
  w9: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/w9-hublot-big-bang.jpg",
  b1: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80",
  b2: "https://assets.hermes.com/is/image/hermesedito/P_11_Birkin_2018?fit=wrap%2C0&wid=1920&resMode=sharp2&op_usm=1%2C1%2C6%2C0",
  b3: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80",
  b4: "https://image.celine.com/4f155e4444f81751/original/L102H3J20-27RE_1_SUM26_W_V1.jpg?im=Resize=(1200)",
  b5: "https://bottega-veneta.dam.kering.com/asset/f218add7-b810-4d7e-8617-cea4a2e50434/Large/766016VCPP14181_A.jpg?v=2",
  b6: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
  b7: "https://www.prada.com/content/dam/pradabkg_products/1/1BA/1BA457/NZVF0046/1BA457_NZV_F0046_V_EOM_SLF.jpg/_jcr_content/renditions/cq5dam.web.hebebed.1200.1200.jpg",
  b8: "https://assets.hermes.com/is/image/hermesedito/P_169_KELLY_HEADER?fit=wrap%2C0&wid=1920&resMode=sharp2&op_usm=1%2C1%2C6%2C0",
  g1: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/g1-scotty-cameron-newport-2.jpg",
  g2: "https://dks.scene7.com/is/image/GolfGalaxy/22TTLMTSR3DRVRPJXDRV?qlt=70&wid=1100&hei=1100&fmt=webp&op_sharpen=1&fit=constrain",
  g3: "https://edge.dis.commercecloud.salesforce.com/dw/image/v2/AADH_PRD/on/demandware.static/-/Sites-CGI-ItemMaster/en_US/v1776878292442/sits/irons-2023-paradym/irons-2023-paradym___1.jpg?sw=2048&q=90&bgcolor=F7F7F7&sfrm=png",
  g4: "https://club14golf.com/cdn/shop/files/complete_20set_20-_20ping_20g440_5000x.jpg?v=1768347658",
  g5: "https://images.unsplash.com/photo-1592919505780-303950717480?w=600&q=80",
  g6: "https://images.unsplash.com/photo-1562204320-31975a5e09c4?w=600&q=80",
  g7: "https://edge.dis.commercecloud.salesforce.com/dw/image/v2/AADH_PRD/on/demandware.static/-/Sites-CGI-ItemMaster/default/v1776878292444/sits/taylormade-stealth-2-hd-driver-2023/taylormade-stealth-2-hd-driver-2023___1.png?sw=2048&q=90&bgcolor=F7F7F7&sfrm=png",
  g8: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQVh9gt8nrSG2XKDr2MhEXm2H7zYsT85cBb0rxTvQyLEwU7-WXWFYBbCMf4NPcQ5OBsiMcoyskF7kGQ1g_ybyiO6bOns2Tufw",
  j1: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/j1-cartier-love-bracelet.jpg",
  j2: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/j2-van-cleef-arpels-alhambra.png",
  j3: "https://media.tiffany.com/is/image/tco/60010761_BLT_MAIN1X1?hei=2000&wid=2000&fmt=webp",
  j4: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/j4-cartier-juste-un-clou.avif",
  j5: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/j5-david-yurman-infinity-band.webp",
  j6: "https://media.bulgari.com/image/upload/c_pad,h_851,w_1090/q_auto/f_auto/1556895.png",
  j7: "https://www.mikimotoamerica.com/media/wysiwyg/mikimoto_index_im22_pc.jpg",
  j8: "https://www.harrywinston.com/-/media/project/harry-winston/corporate/harry-winston-int/fine-jewelry/others-by-harry-winston/solitaire-round-brilliant-engagement-ring/solitaire_round_brilliant_engagement_ring_diamond_rgdprd005nss_n_1.png?rev=18e464eecf0443d68d115e3b5fd8b30f",
  j9: "https://image.brilliantearth.com/media/product_images/I6/BE2277_yellow_top.jpg",
  j10: "https://balacia.com/cdn/shop/files/golden-legacy-miami-cuban-link-chain-solid-14k-gold-311795.png?v=1742414447&width=1024",
  j11: "https://media.davidyurman.com/productsv2/R15184M/R15184MBB/R15184MBB.jpg?version=15&width=1000",
  s1: "https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Chicago-Reimagined-Product.jpg?fit=fill&bg=FFFFFF&w=140&h=75&q=57&dpr=2&trim=color&updated_at=1738193358",
  s2: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQhynJlN1yrf037AvDWWDJYI5wC6c8CMshpSyIYM1g90oPfwzSlqUr25x1gNiQSmlfjKeIIxZYrJEfmubsRbgcK54vE7L_ZewlPuLmYVAlPnODL85ERZwoW",
  s3: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80",
  s4: "https://cdn-images.farfetch-contents.com/17/94/24/02/17942402_37988937_1000.jpg",
  s5: "https://media.gq.com/photos/58eeabf0c28cae5a8aac4a00/16:9/w_1920,c_limit/air-max-silver-01.jpg",
  s6: "https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/b2e538a6-79f7-4e1f-90d0-adc1e359872d/AIR+JORDAN+4+RETRO+OG+FC.png",
  s7: "https://www.mrporter.com/variants/images/3024088872901549/in/w2000_q60.jpg",
  s8: "https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/af53d53d-561f-450a-a483-70a7ceee380f/W+NIKE+DUNK+LOW.png",
  a1: "https://outdoorgearlab.b-cdn.net/photos/26/70/388518_17858_XXL.webp",
  a2: "https://images-dynamic-arcteryx.imgix.net/details/1350x1710/F25-X000009990-Alpha-SV-Jacket-Black-Women-s-Front-View.jpg?auto=format&q=70&fit=crop&fill=white&max-w=1350&max-h=1710&ixlib=react-9.10.0&w=594",
  a3: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&q=80",
  a4: "https://www.sefiles.net/images/library/large/trek-domane-slr-7-gen-4-1244225-13.png",
  a5: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
  a6: "https://www.skibarndurango.com/cdn/shop/files/DOA.jpg?v=1750783158&width=1800",
  a7: "https://i.ebayimg.com/images/g/F-4AAOSwHbtoWrIO/s-l1600.webp",
  a8: "https://assets.basspro.com/image/upload/b_rgb:FFFFFF,c_limit,dpr_1.0,f_auto,h_700,q_auto,w_1500/c_limit,h_700,w_1500/v1/ProductImages/400/carbongraytitanium_101195363_main?pgw=1",
  a9: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/a9-parasailing-over-clear-water.jpg",
  a10: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/a10-skydiving-first-jump.jpg",
  a11: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/a11-bungee-jumping.jpg",
  h1: "https://www.gibson.com/cdn/shop/files/LPSS00NVNH1_front.webp?v=1744039955&width=823",
  h2: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/h2-leica-m11-rangefinder.webp",
  h3: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
  h4: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&q=80",
  h5: "https://i5.walmartimages.com/seo/Hasselblad-X2D-100C-100MP-Medium-Format-Mirrorless-Camera_86f8685c-b469-4022-bbab-98e41a209347.343dccc8598f720d2716a822e5c9c2c8.jpeg?odnHeight=573&odnWidth=573&odnBg=FFFFFF",
  h6: "https://media.guitarcenter.com/is/image/MMGS7/M01782000001000-00-264x264.jpg",
  h7: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&q=80",
  h8: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&q=80",
  h9: "https://assets.wsimgs.com/wsimgs/rk/images/dp/wcm/202552/0013/img84z.jpg",
  h10: "https://cb.scene7.com/is/image/Crate/BrevilleBrstExEsprsAVSSS21_VND?$web_pdp_main_carousel_high$",
  h11: "https://cdn.sanity.io/images/fr9flhkd/main/fcaa37dfaed0bdedcf501891843e04b8cc082a52-1500x1500.jpg?fm=webp&q=75&w=1280",
  c1: "https://images.vivino.com/thumbs/1Rm8louuTKKSUZvSNVbeLw_pb_x960.png",
  c2: "https://images.vivino.com/thumbs/s5aXYaQiTu-V_xEYI3KXRg_pb_x960.png",
  c3: "https://www.ackerwines.com/wp-content/uploads/2023/11/Petrus-Scrub.jpg",
  c4: "https://grandcruliquidassets.com/cdn/shop/files/USRSCRSCRE-0750-2022-F0L0C0_600x.jpg?v=1742520049",
  c5: "https://winechateau.com/cdn/shop/files/KGC173_new_1.avif?v=1769621769&width=990",
  c6: "https://133973339.cdn6.editmysite.com/uploads/1/3/3/9/133973339/WNRZJI75IF5WHANS5R33TCOG.jpeg?width=2560&optimize=medium",
  c7: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Domaine_Jean-Marc_Boillot_Les_Referts_2012.jpg/500px-Domaine_Jean-Marc_Boillot_Les_Referts_2012.jpg",
  c8: "https://res.cloudinary.com/htt8g4cd/image/upload/t_825x825/f_auto,q_auto/we/23528084X_1",
  ex1: "https://57hours.com/wp-content/uploads/2024/05/serengeti-tanzania-safari-tour.jpg",
  ex3: "https://www.agoda.com/wp-content/uploads/2018/07/Experience-Tokyo_food-and-drink_Featured-image-1200x350_sushi-tray_Tokyo.jpg",
  ex4: "https://media.cntraveller.com/photos/696f54795af4d8b82732cb6d/16:9/w_1920%2Cc_limit/Amalfi%2520Coast_Italy_200126_GettyImages-2252198284.jpg",
  ex6: "https://d1hdnpfpyy58x9.cloudfront.net/context/frontend/landing/landing02/personalize-your-menu_02.jpg,w_278,h_392,c_1,q_80,fd_1,e_.webp",
  wh1: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/wh1-macallan-18.jpg",
  wh2: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/wh2-yamazaki-18.jpg",
  wh3: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/wh3-hibiki-harmony.jpg",
  wh4: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/wh4-pappy-van-winkle.jpg",
  wh5: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/wh5-clase-azul.jpg",
  wh6: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/wh6-don-julio-1942.png",
  wh7: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/wh7-louis-xiii-cognac.jpg",
  h15: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/h15-global-g-2-knife-set.jpg",
  car1: "https://pictures.dealer.com/p/porschefresno/0474/05d4adcbf20de3eb3fa235084b570115x.jpg?impolicy=downsize_bkpt&imdensity=1&w=1024",
  car2: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/car2-ferrari-296-gtb.avif",
  car3: "https://www.bmw-m.com/content/dam/bmw/marketBMW_M/www_bmw-m_com/all-models/model-navigation/bmw-m3-competition-sedan-m-xdrive-lci-flyout.png?imwidth=1280",
  car4: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/2022_McLaren_GT.jpg/960px-2022_McLaren_GT.jpg",
  car5: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/2022_Land_Rover_Range_Rover_SE_P440e_AWD_Automatic_3.0_Front.jpg/960px-2022_Land_Rover_Range_Rover_SE_P440e_AWD_Automatic_3.0_Front.jpg",
  car6: "https://cdn.motor1.com/images/mgl/vxZBrR/s3/2025-mercedes-amg-gt63-pro.jpg",
  car7: "https://www.lamborghini.com/sites/it-en/files/DAM/lamborghini/facelift_2019/model_detail/huracan/evo_rwd_spyder/2023/02_21/hura_evo_rwd_spy_s_02.jpg",
  car9: "https://www.thespeedjournal.com/wp-content/uploads/2021/06/mclaren-gt4-laguna-seca-trackday-01.jpg",
  car10: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/2007-07-08_Porsche_356_C_%2801_kl_ret%29.jpg/960px-2007-07-08_Porsche_356_C_%2801_kl_ret%29.jpg",
  sp1: "https://www.carlsgolfland.com/media/catalog/product/cache/d69ef9f06ed26ee571b3d9d7a80a892a/t/i/titleist_vokey_design_sm10_tour_chrome_wedges_54_10_hero.jpg",
  sp2: "https://cdn11.bigcommerce.com/s-ms459ombhg/images/stencil/800x1024/products/2305/4456/BG-DTC-202450-Pro-X3-Plus-Hero__38872.1748636017.png?c=2",
  sp3: "https://shopindoorgolf.com/cdn/shop/files/r50-ball.jpg?v=1757706230&width=1024",
  sp4: "https://cdn.britannica.com/61/283561-050-5BD3BB6A/Closeup-golf-club-ball-on-tee.jpg?w=300",
  sp5: "https://lh3.googleusercontent.com/p/AF1QipM1GrFhDL5EnPcUQp3tJG4fQUc0JI8yzdEPjPEx=s1360-w1360-h1020-rw",
  sp7: "https://www.brotherrice.org/wp-content/uploads/2021/04/Masters-Main-Picture.jpg",
  sp8: "https://dks.scene7.com/is/image/GolfGalaxy/25FOOMGOLFPRMRSRSWPUI_White_Midnight_Navy_Steel_Blue?qlt=70&wid=1100&hei=1100&fmt=webp&op_sharpen=1&fit=constrain",
  sp9: "https://worldwidegolf.vtexassets.com/arquivos/ids/13434244-1200-auto?v=639075838350400000&width=1200&height=auto&aspect=true",
  sp10: "https://dks.scene7.com/is/image/GolfGalaxy/21SCNM2021PHNTMX1PTRA?wid=2000&hei=2000&fit=constrain&fmt=pjpeg",
  sp11: "https://dks.scene7.com/is/image/GolfGalaxy/23WILAPRSTFFTMV14TNN_Gold?qlt=70&wid=1100&hei=1100&fmt=webp&op_sharpen=1&fit=constrain",
  sp11b: "https://img.tennis-warehouse.com/watermark/rs.php?path=BARO-1.jpg&nw=1102",
  sp11c: "https://cdn.shopify.com/s/files/1/0603/3031/1875/files/main-square_7ea1acb0-13f5-45cd-adc2-41c7b804d38c_1080x.jpg?=75&v=1772260794",
  sp11d: "https://spinshotsports.com/cdn/shop/files/spinshot-player-00_1512x.png?v=1698365674",
  sp11e: "https://www.tvguide.com/a/img/resize/8131fc7d66d2c157eb7cf28b90552591c6685853/hub/2024/06/26/a60ccb61-544d-493f-bff3-8dbecf239a6f/wimbledon.jpg?auto=webp&width=1092",
  sp12: "https://photo-assets.usopen.org/images/pics/large/f_logo_NEW_20180319.jpg",
  sp13: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tennis_Racket_and_Balls.jpg/960px-Tennis_Racket_and_Balls.jpg",
  sp14: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/sp14-selkirk-pickleball-paddle.webp",
  sp14b: "https://img.pickleballwarehouse.com/watermark/rs.php?path=JHBJPV-BL-1.jpg&nw=731",
  sp14c: "https://cdn.prod.website-files.com/6390c2d9fbb8357ffc404b63/6612f97cff3fd2e80bcb5b1c_What%20is%20Pickleball.png",
  sp14d: "https://www.sportsbasement.com/cdn/shop/files/100277496-BLK-1.png?v=1722963825",
  sp15: "https://s.abcnews.com/images/US/new-york-city-marathon-gty-jt-221104_1667610038390_hpMain.jpg?w=992",
  sp15b: "https://world-masters-athletics.org/wp-content/uploads/2023/08/Bucharest_Marathon-2048x1105.jpg",
  sp15c: "https://cdn.fleetfeet.com/productPrimaryHi4/products/AURORA_FD8311-104_PHSRH000-2000.jpeg",
  sp15d: "https://www.rei.com/media/108237f1-1d91-40a3-97d2-e4b486eb537a.jpg?size=1500",
  sp15e: "https://cdn11.bigcommerce.com/s-c0cjv/images/stencil/960w/attribute_rule_images/114136847_source_1749131542.jpg",
  sp15f: "https://img.runningwarehouse.com/watermark/rs.php?path=SADV129-BK-1.jpg&nw=1102",
  sp16: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/2433eb08-dc1a-48fa-b5f3-6199eac24e22.jpg;maxHeight=1920;maxWidth=900?format=webp",
  sp17: "https://mygymequipment.com/cdn/shop/files/Peloton_Bike_Plus_2dea7fc3-f985-4d01-ae02-02640e5cde4b.jpg?v=1728773857&width=493",
  sp17b: "https://epic-cycles.com/cdn/shop/files/aFxEsHfc4bHWiuYz_0L0R5HUI2C-PROFILE-Web.webp?v=1769123427",
  sp17c: "https://dma.canyon.com/image/upload/w_1439,c_fit/b_rgb:F2F2F2/f_auto/q_auto/v1749130145/2026_FULL_aeroad_cf-slx-8-di2_4036_R107_P01_qunek5",
  sp17d: "https://www.rei.com/media/9935f9de-31f4-4a1e-9218-75d145111559.jpg?size=1500",
  sp17e: "https://www.recoveryforathletes.com/cdn/shop/products/garmin-edge-1040-solar-5.jpg?crop=center&height=750&v=1657905049&width=750",
  sp17g: "https://www.statebicycle.com/cdn/shop/products/Zipp303STubelssDisc-BrakeWheelSet_Shimano_SRAM11_12speed_5_1024x1024.jpg?v=1759257662",
  sp17h: "https://www.rideinternationaltours.com/wp-content/uploads/2020/01/2020-tour-de-france-alps-paris-800x321.jpg",
  sp17f: "https://media.rapha.cc/image/upload/w_480,dpr_2,f_auto,q_auto:eco,b_white,c_fill,ar_1/mannequin/CUN01XX_CAI_Mens-Pro-Team-Training-Jersey_H126_mannequin_26.jpg",
  sp18: "https://images.ctfassets.net/1fvlg6xqnm65/3Cr8iQaI1zvcM2Luk01Vxr/d1ad63076f541f636033e3e05138d0ff/DEBRIEF-THUMB-SINGAPORE_top.jpg?w=1920&q=75&fm=webp",
  sp19: "https://www.ticketsmarter.com/insider/wp-content/uploads/2023/05/courtside-tickets-nba-icketsmarter-inbody.jpg.webp",
  sp6: "https://lh3.googleusercontent.com/p/AF1QipPSQ8zuzwTy3fJRluIw4RI5E3OZ6VMsXZv4jnVH=s1360-w1360-h1020-rw",
  s3: "https://dks.scene7.com/is/image/GolfGalaxy/24ADIWSMBGBLCKGRNFTW_White_Black_White?wid=2000&hei=2000&fit=constrain&fmt=pjpeg",
  wl2: "https://insider.fitt.co/wp-content/uploads/2024/10/Oura-Ring-4.png",
  wl6: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/wl6-whoop-4-0-membership.webp",
  cf1: "https://home.lamarzoccousa.com/wp-content/uploads/2024/01/Bianca-front--2048x1363.png",
  cf2: "https://www.baristamagazine.com/wp-content/uploads/2019/11/nichezero-678x381.jpg",
  cf3: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/cf3-fellow-stagg-ekg-kettle.webp",
  cf4: "https://fellowproducts.com/cdn/shop/files/Web_PDP_ThePourOverKit_1_bf148788-0e0b-47ca-a862-eb44dff287eb.png?v=1773358455&width=1200",
  cf5: "https://www.wholelattelove.com/cdn/shop/files/BrevilleOracleTouch-BrushedStainlessSteel.jpg?v=1763664378&width=823",
  cf7: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/cf7-acaia-pearl-scale.webp",
  ex2: "https://www.thetimes.com/imageserver/image/d54db4b8-dfc1-4c7e-a380-1a24b8290010.jpg?strip=all&format=webp&crop=1600px%2C900px%2C0px%2C0px&resize=1328",
  ex7: "https://media.timeout.com/images/105698079/1920/1440/image.webp",
  ex8: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/ex8-napa-valley-harvest-weekend.jpg",
  ex9: "https://dynamic-media.tacdn.com/media/photo-o/2e/d5/05/6d/caption.jpg?w=1400&h=1000&s=1",
  ex10: "https://assets.beatportal.com/images/transforms/content-item/_1920x1080_crop_center-center_none/1375922/Coachella-Weekend-2.avif",
  cf6: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/cf6-coffee-origin-trip.webp",
  car8: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/car8-porsche-taycan-turbo-s.avif",
  hl1: "https://www.manoloblahnik.com/media/catalog/product/cache/0990eb17180c8a7a679bd8585f3427fc/0/d/0d53605260f919a3783b1df0a73dac5a1b942288_designer-women-blue-satin-jewel-buckle-pumps-hangisi_50.webp",
  hl2: "https://media.neimanmarcus.com/f_auto,q_auto:low,ar_4:5,c_fill,dpr_2.0,w_418/01/nm_878680_100106_m",
  hl3: "https://media.jimmychoo.com/image/upload/f_auto,q_auto:best,dpr_2.0,w_520,h_520,c_fit/USPROD_PRODUCT/images/original/ROMY100SUE_010003_SIDE_vg01.jpg",
  hl4: "https://bottega-veneta.dam.kering.com/asset/044da2c3-aa26-4df8-afbb-7b0a29edacf1/Large/610538VBSF01000_A.jpg?v=5",
  hl5: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/hl5-gianvito-rossi-105-pumps.avif",
  hl6: "https://is4.fwrdassets.com/images/p/fw/z/SLAU-WZ1226_V1.jpg",
  hl7: "https://media.aquazzura.com/media/catalog/product/D/E/DENHIGP0-SUE-ECA_01.jpg?auto=compress&w=1400",
  hl8: "https://di2ponv0v5otw.cloudfront.net/posts/2024/02/02/65bdc727ac1b04443df9e443/l_wp_65bdcd8381078a81249d3470.webp",
  h12: "https://qyifsblebdnlcyurrgbt.supabase.co/storage/v1/object/public/dream-shelf-images/dreamshelf/h12-vitamix-ascent-a3500.avif",
  h13: "https://assets.wsimgs.com/wsimgs/rk/images/dp/wcm/202551/0322/img14z.jpg",
  h14: "https://ooni.com/cdn/shop/files/1000x1000-Ovens-ToScale-Karu2Pro-F_fb2a4824-8fc4-43d2-b031-6f158f77b22c.webp?crop=center&height=640&v=1749094517&width=640",
  wl3: "https://www.recoveryforathletes.com/cdn/shop/files/Theragun-Pro-Plus-Performance-Re_746ee862-807e-47de-b2de-68dc1b94a85a.jpg?v=1696533822&width=800",
  wl5: "https://joovv.com/cdn/shop/products/joovv-go-2-0-setup-charging-dock-002_1000x.jpg?v=1708025273",
  wl1: "https://res.cloudinary.com/eightsleep/image/upload/c_fill,g_auto,f_auto,dpr_2.0,h_1000,q_80/v1762291964/Pod5-Desktop_ca1n38.png",
  wl4: "https://infraredsauna.com/wp-content/uploads/2024/10/Sanctuary_1_Hero_Mahogany_Title-scaled.png",
  wl7: "https://www.recoveryforathletes.com/cdn/shop/products/image_1c701ff6-21a5-4567-9b24-a80a9fbe54de.jpg?v=1666291030&width=800",
  hm1: "https://parachutehome.com/cdn/shop/files/linen-sheet-set-bone-_f-q_k-ck__01_f39c5ff8-36b2-4a81-bba1-b23dbd14fd47.jpg?v=1762839007&width=1200",
  hm2: "https://www.aesop.com/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-aesop-us-master-catalog/default/dw68e81ede/images/products/HM02/Aesop_Home_Ptolemy_Aromatique_Candle_Web_Front_2000x2000px.jpg?sw=1400&sh=1400&sm=cut&sfrm=png&q=70&bgcolor=fffef2",
  hm3: "https://images.bloomingdalesassets.com/is/image/BLM/products/4/optimized/13797594_fpx.tif?op_sharpen=1&wid=700&fit=fit,1&fmt=webp",
  hm4: "https://rh.com/content/dam/rh-inc/us/en/home/project-library/digital/world-of-rh/landing-pages/cloud/04142026/041426_Cloud_LP_H6_Lengths.png",
  hm5: "https://images.hermanmiller.group/m/b4efc9b53c699972/W-HAY_2514619_100127979_olive_a.png?trim=auto&trim-sd=1&blend-mode=darken&blend=f8f8f8&bg=f8f8f8&auto=format&w=1000&q=70&h=1000",
  hm6: "https://www.byredo.com/cdn-cgi/image/width=auto,height=1200,fit=scale-down,gravity=auto,format=webp,quality=70/https://www.byredo.com/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/8/0/806168_1_full_no.jpg",
  hm7: "https://www.framebridge.com/cdn/shop/files/GW_EndlessOrganicBlack.jpg?v=1694542627&width=1070",
  hm8: "https://slimages.macysassets.com/is/image/MCY/products/2/optimized/28529052_fpx.tif?op_sharpen=1&wid=1500&fit=fit%2C1&fmt=webp",
  ex5: "https://cdn.prod.website-files.com/63b6ce0006af9431cafdc845/6894d331c72df45d8df2c0f2_unnamed.png",
};

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "watches",   label: "Watches",    emoji: "⌚" },
  { id: "bags",      label: "Bags",       emoji: "👜" },
  { id: "jewelry",   label: "Jewelry",    emoji: "💍" },
  { id: "golf",      label: "Sports",     emoji: "⛳" },
  { id: "sneakers",  label: "Sneakers",   emoji: "👟" },
  { id: "heels",     label: "Heels",      emoji: "👠" },
  { id: "hobbies",   label: "Hobbies",    emoji: "🎸" },
  { id: "kitchen",   label: "Kitchen",    emoji: "🍳" },
  { id: "home",      label: "Home",       emoji: "🪴" },
  { id: "wellness",  label: "Wellness",   emoji: "🧘" },
  { id: "coffee",    label: "Coffee",     emoji: "☕" },
  { id: "cellar",      label: "Cellar",      emoji: "🍷" },
  { id: "whiskey",     label: "Whiskey",     emoji: "🥃" },
  { id: "adventure",   label: "Adventure",   emoji: "🎿" },
  { id: "cars",        label: "Cars",        emoji: "🚗" },
  { id: "experiences", label: "Experiences", emoji: "✈️" },
];

const DREAM_WORLDS = [
  {
    id: "style",
    label: "Style",
    title: "Quiet choices, your identity",
    emoji: "✦",
    categoryIds: ["watches", "bags", "jewelry", "sneakers", "heels"],
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
    categoryIds: ["kitchen", "home", "wellness", "coffee", "cellar", "whiskey", "cars"],
  },
  {
    id: "experiences",
    label: "Experiences",
    title: "Moments worth saving for",
    emoji: "✈️",
    categoryIds: ["experiences", "adventure"],
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
    { id: "mens",      label: "Men's"     },
    { id: "everyday",  label: "Everyday"  },
    { id: "devotion",  label: "Devotion"  },
    { id: "heirloom",  label: "Heirloom"  },
    { id: "statement", label: "Statement" },
    { id: "gold",      label: "Warm Gold" },
  ],
  golf: [
    { id: "all",        label: "All"        },
    { id: "golf",       label: "Golf"       },
    { id: "tennis",     label: "Tennis"     },
    { id: "pickleball", label: "Pickleball" },
    { id: "running",    label: "Running"    },
    { id: "cycling",    label: "Cycling"    },
    { id: "training",   label: "Training"   },
    { id: "events",     label: "Events"     },
  ],
  sneakers: [
    { id: "all",      label: "All"       },
    { id: "everyday", label: "Everyday"  },
    { id: "grail",    label: "Grail"     },
    { id: "classic",  label: "Classic"   },
    { id: "collab",   label: "Collab"    },
  ],
  heels: [
    { id: "all",       label: "All"       },
    { id: "classic",   label: "Classic"   },
    { id: "party",     label: "Party"     },
    { id: "everyday",  label: "Everyday"  },
    { id: "grail",     label: "Grail"     },
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
  cars: [
    { id: "all",        label: "All"        },
    { id: "sports",     label: "Sports"     },
    { id: "luxury",     label: "Luxury"     },
    { id: "suv",        label: "SUV"        },
    { id: "ev",         label: "Electric"   },
    { id: "classic",    label: "Classic"    },
    { id: "grail",      label: "Grail"      },
    { id: "experience", label: "Track Day"  },
  ],
  experiences: [
    { id: "all",          label: "All"          },
    { id: "bucket-list",  label: "Bucket List"  },
    { id: "nature",       label: "Nature"       },
    { id: "food",         label: "Food"         },
    { id: "city",         label: "City"         },
    { id: "road-trip",    label: "Road Trip"    },
    { id: "music",        label: "Music"        },
    { id: "luxury",       label: "Luxury"       },
  ],
  home: [
    { id: "all",       label: "All"        },
    { id: "living",    label: "Living"     },
    { id: "bedroom",   label: "Bedroom"    },
    { id: "scent",     label: "Scent"      },
    { id: "fragrance", label: "Fragrance"  },
    { id: "audio",     label: "Audio"      },
    { id: "art",       label: "Art"        },
  ],
  wellness: [
    { id: "all",      label: "All"       },
    { id: "sleep",    label: "Sleep"     },
    { id: "recovery", label: "Recovery"  },
    { id: "tracking", label: "Tracking"  },
    { id: "sauna",    label: "Sauna"     },
  ],
  coffee: [
    { id: "all",        label: "All"        },
    { id: "espresso",   label: "Espresso"   },
    { id: "pour-over",  label: "Pour Over"  },
    { id: "machine",    label: "Machine"    },
    { id: "grinder",    label: "Grinder"    },
    { id: "gear",       label: "Gear"       },
    { id: "experience", label: "Experience" },
  ],
};

// ─── Curated items per category ───────────────────────────────────────────────
const CURATED_ITEMS = {
  watches: [
    { id: "w1",  name: "Rolex Submariner",           brand: "Rolex",   priceRange: "$9,000–$14,000",  subFilter: ["rolex","sport","5k15k"],  emoji: "⌚", description: "The watch people save for a decade and wear for a lifetime. Timeless, waterproof, and worth every penny." },
    { id: "w2",  name: "Patek Philippe Nautilus",     brand: "Patek",   priceRange: "$40,000+",         subFilter: ["patek","sport","15kp"],   emoji: "⌚", description: "The grail. A waiting list most people never reach. If you get one, you've earned a story." },
    { id: "w3",  name: "Audemars Piguet Royal Oak",   brand: "AP",      priceRange: "$25,000+",         subFilter: ["sport","15kp"],           emoji: "⌚", description: "Octagonal bezel, integrated bracelet, and a design so bold it still looks futuristic fifty years later." },
    { id: "w4",  name: "Omega Speedmaster Professional", brand: "Omega", priceRange: "$6,000–$8,000",  subFilter: ["omega","sport","5k15k"],  emoji: "⌚", description: "The watch that went to the moon. NASA-certified and still the most storied chronograph ever made." },
    { id: "w5",  name: "Rolex Daytona",               brand: "Rolex",   priceRange: "$25,000-$50,000",  subFilter: ["rolex","sport","15kp"],   emoji: "⌚", description: "Made for racing, coveted by everyone else. The Paul Newman dial alone is worth googling." },
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
    { id: "j6",  name: "Bvlgari Serpenti",             brand: "Bvlgari", priceRange: "$3,000–$8,000",   subFilter: ["anniversary"],            emoji: "💍", image: DREAMSHELF_IMAGES.j6, description: "A coiled serpent in gold and gemstones. The most dramatic thing you'll ever put on your wrist." },
    { id: "j7",  name: "Mikimoto Pearl Strand",        brand: "Mikimoto",priceRange: "$1,500–$5,000",   subFilter: ["anniversary","gold"],     emoji: "💍", description: "The original pearl jeweler, still the best. A strand of Mikimoto pearls is an heirloom from day one." },
    { id: "j8",  name: "Harry Winston Round Diamond Solitaire", brand: "Harry Winston", priceRange: "$10,000+", subFilter: ["anniversary"], emoji: "💍", image: DREAMSHELF_IMAGES.j8, description: "The King of Diamonds. When the moment demands something truly extraordinary." },
    { id: "j9",  name: "Gold Signet Ring",               brand: "Bespoke",  priceRange: "$800–$3,000",     subFilter: ["mens","gold","everyday"],  emoji: "💍", imageQuery: "gold signet ring mens hand pinky", image: DREAMSHELF_IMAGES.j9, description: "The oldest piece of jewelry in history, still the most quietly powerful thing a man can wear." },
    { id: "j10", name: "Cuban Link Chain 14k Gold",      brand: "Various",  priceRange: "$1,500–$8,000",   subFilter: ["mens","gold"],             emoji: "📿", imageQuery: "Cuban link gold chain mens jewelry", description: "Heavy, warm, and undeniably confident. The chain that works with everything from a white tee to a suit." },
    { id: "j11", name: "David Yurman Chevron Ring",      brand: "Yurman",   priceRange: "$500–$1,200",     subFilter: ["mens","everyday"],         emoji: "💍", imageQuery: "David Yurman men ring silver cable", image: DREAMSHELF_IMAGES.j11, description: "Cable-inspired architecture in sterling and gold. The ring men reach for when they want something with character." },
  ],
  golf: [
    { id: "g1",  name: "Scotty Cameron Newport 2",     brand: "Scotty Cameron",priceRange: "$400–$600",  subFilter: ["golf"],                   emoji: "⛳", imageQuery: "Scotty Cameron Newport 2 putter", image: DREAMSHELF_IMAGES.g1, description: "The putter Tour pros hoard and collectors obsess over. Feel unlike anything else on the green." },
    { id: "g2",  name: "Titleist TSR3 Driver",         brand: "Titleist",priceRange: "$550–$650",        subFilter: ["golf"],                   emoji: "⛳", imageQuery: "Titleist TSR3 driver golf course", image: DREAMSHELF_IMAGES.g2, description: "The driver that the best players in the world trust when it actually matters." },
    { id: "g3",  name: "Callaway Paradym Custom Irons",brand: "Callaway",priceRange: "$1,500–$2,500",   subFilter: ["golf"],                   emoji: "⛳", imageQuery: "Callaway Paradym custom irons golf", image: DREAMSHELF_IMAGES.g3, description: "Custom fit, custom look. The set you commission when you're serious about the game." },
    { id: "g4",  name: "Ping G430 Full Set",           brand: "Ping",    priceRange: "$2,500–$3,500",   subFilter: ["golf"],                   emoji: "⛳", imageQuery: "Ping G430 golf clubs full set", image: DREAMSHELF_IMAGES.g4, description: "The complete bag upgrade. Everything matched, everything fitted, everything right." },
    { id: "g5",  name: "Round at Pebble Beach",        brand: "Pebble Beach",priceRange: "$600–$1,000",  subFilter: ["golf","events"],          emoji: "⛳", imageQuery: "pebble beach", image: DREAMSHELF_IMAGES.g5, description: "The 18th green borders the Pacific Ocean. One of the greatest rounds of golf anyone will ever play." },
    { id: "g7",  name: "TaylorMade Stealth 2 HD Driver",brand: "TaylorMade",priceRange: "$450–$600",    subFilter: ["golf"],                   emoji: "⛳", imageQuery: "golf driver club course luxury golfing", image: DREAMSHELF_IMAGES.g7, description: "Carbon face technology that genuinely changes what a golf ball can do in the air." },
    { id: "g8",  name: "FootJoy Lightweight Travel Backpack",brand: "FootJoy", priceRange: "$100-$300",        subFilter: ["golf"],                   emoji: "⛳", imageQuery: "FootJoy lightweight travel backpack", image: DREAMSHELF_IMAGES.g8, description: "The bag that says you take this seriously. Organized, beautiful, and built for the long game." },
    { id: "sp1", name: "Titleist Vokey SM10 Wedges",   brand: "Titleist",priceRange: "$190–$220",        subFilter: ["golf"],                   emoji: "⛳", imageQuery: "Titleist Vokey SM10 wedges golf", image: DREAMSHELF_IMAGES.sp1, description: "A short-game upgrade for the kind of touch that makes a round feel personal." },
    { id: "sp2", name: "Bushnell Pro X3 Rangefinder",  brand: "Bushnell",priceRange: "$550–$600",        subFilter: ["golf","training"],        emoji: "⛳", imageQuery: "Bushnell Pro X3 rangefinder golf course", image: DREAMSHELF_IMAGES.sp2, description: "A quiet little confidence tool for picking a number and committing to the shot." },
    { id: "sp3", name: "Garmin Approach R50 Launch Monitor", brand: "Garmin",priceRange: "$4,999",       subFilter: ["golf","training"],        emoji: "⛳", imageQuery: "Garmin Approach R50 launch monitor golf", image: DREAMSHELF_IMAGES.sp3, description: "Practice that feels like a private studio session, even when you're working on one swing at a time." },
    { id: "sp4", name: "Custom Club Fitting Session",  brand: "Golf Studio",priceRange: "$150–$400",     subFilter: ["golf","training"],        emoji: "⛳", imageQuery: "custom golf club fitting session", description: "A measured afternoon of finding the clubs that make your swing feel more like yours." },
    { id: "sp5", name: "Pinehurst No. 2 Round",        brand: "Pinehurst",priceRange: "$400–$700",        subFilter: ["golf","events"],          emoji: "⛳", imageQuery: "Pinehurst No. 2 golf course", image: DREAMSHELF_IMAGES.sp5, description: "A legendary walk through crowned greens, history, and a scorecard you'll keep." },
    { id: "sp6", name: "Bandon Dunes Golf Trip",       brand: "Bandon Dunes",priceRange: "$1,500+",       subFilter: ["golf","events"],          emoji: "⛳", imageQuery: "Bandon Dunes golf course", image: DREAMSHELF_IMAGES.sp6, description: "Wind, ocean, walking-only golf, and the kind of trip people talk about for years." },
    { id: "sp7", name: "Masters Sunday Watch Party",   brand: "Augusta Sunday",priceRange: "Experience", subFilter: ["golf","events"],          emoji: "🏆", imageQuery: "Masters golf Sunday watch party", description: "Clear the afternoon, make the snacks, and let the final nine become a little ritual." },
    { id: "sp8", name: "FootJoy Premiere Series Shoes",brand: "FootJoy", priceRange: "$200–$250",        subFilter: ["golf"],                   emoji: "⛳", imageQuery: "FootJoy Premiere Series golf shoes", image: DREAMSHELF_IMAGES.sp8, description: "A crisp first-tee feeling for the rounds you want to dress up for." },
    { id: "sp9", name: "Vessel Player IV Bag",         brand: "Vessel",  priceRange: "$395–$450",        subFilter: ["golf"],                   emoji: "⛳", imageQuery: "Vessel Player IV golf bag", image: DREAMSHELF_IMAGES.sp9, description: "A beautiful everyday bag for the version of you that keeps clubs by the door." },
    { id: "sp10",name: "Scotty Cameron Phantom X Putter",brand: "Scotty Cameron",priceRange: "$450–$550", subFilter: ["golf"],                  emoji: "⛳", imageQuery: "Scotty Cameron Phantom X putter", description: "A modern mallet for the calm little ritual of lining up a putt." },
    { id: "sp11",name: "Wilson Pro Staff v14",          brand: "Wilson",  priceRange: "$230–$280",        subFilter: ["tennis"],                 emoji: "🎾", imageQuery: "Wilson Pro Staff tennis racket white red", image: DREAMSHELF_IMAGES.sp11, description: "The classic player's racket. Dense pattern, precise control, and the feel that serious club players obsess over." },
    { id: "sp11b",name: "Babolat Pure Aero",           brand: "Babolat", priceRange: "$230–$260",        subFilter: ["tennis"],                 emoji: "🎾", imageQuery: "Babolat Pure Aero tennis racket yellow", image: DREAMSHELF_IMAGES.sp11b, description: "Rafa's racket. Built for topspin, pop on serve, and the satisfying thwack of a clean cross-court." },
    { id: "sp11c",name: "Nike Air Zoom Vapor Pro 2",   brand: "Nike",    priceRange: "$130–$150",        subFilter: ["tennis"],                 emoji: "👟", imageQuery: "Nike Air Zoom Vapor Pro tennis shoes court", description: "Light, low, and locked in. The shoe that makes lateral cuts feel effortless." },
    { id: "sp11d",name: "Spinshot Player Ball Machine",brand: "Spinshot",priceRange: "$800–$1,000",      subFilter: ["tennis","training"],      emoji: "🎾", imageQuery: "tennis ball machine court practice", description: "An hour alone on court, drilling exactly the shot you keep missing. The solo practice upgrade." },
    { id: "sp11e",name: "Wimbledon Tickets",           brand: "AELTC",   priceRange: "$200–$2,000+",     subFilter: ["tennis","events"],        emoji: "🎾", imageQuery: "Wimbledon Centre Court tennis grass", description: "Strawberries, whites, grass, and the quietest crowd in sport. A bucket list afternoon." },
    { id: "sp12",name: "US Open Weekend",              brand: "USTA",    priceRange: "$500+",            subFilter: ["tennis","events"],        emoji: "🎾", imageQuery: "US Open tennis stadium night", description: "A late-summer city weekend built around night matches, big serves, and one more set." },
    { id: "sp13",name: "Private Tennis Lesson Package",brand: "Local Pro",priceRange: "$400–$1,200",     subFilter: ["tennis","training"],      emoji: "🎾", imageQuery: "private tennis lesson court coach", description: "A few focused mornings to make the game feel smoother, lighter, and more yours." },
    { id: "sp14",name: "Selkirk Pickleball Paddle",    brand: "Selkirk", priceRange: "$150–$250",        subFilter: ["pickleball"],             emoji: "🏓", imageQuery: "Selkirk pickleball paddle", description: "Easy to bring, quick to share, and perfect for the hobby that keeps becoming a plan." },
    { id: "sp14b",name: "Joola Ben Johns Hyperion Paddle", brand: "Joola",  priceRange: "$180–$220",       subFilter: ["pickleball"],             emoji: "🏓", imageQuery: "Joola Ben Johns Hyperion pickleball paddle carbon", image: DREAMSHELF_IMAGES.sp14b, description: "The paddle the world no. 1 plays with. When you're ready to stop sharing and start improving." },
    { id: "sp14c",name: "Pickleball Lesson Series",    brand: "Local Pro",priceRange: "$200–$500",        subFilter: ["pickleball","training"],  emoji: "🏓", imageQuery: "pickleball lesson court coach", description: "Four sessions to crack the third-shot drop. The upgrade that changes how the whole game feels." },
    { id: "sp14d",name: "Selkirk Pickleball Bag",      brand: "Selkirk", priceRange: "$80–$120",         subFilter: ["pickleball"],             emoji: "🎒", imageQuery: "Selkirk pickleball bag court", image: DREAMSHELF_IMAGES.sp14d, description: "Holds four paddles, your shoes, and still looks like a bag worth carrying everywhere else." },
    { id: "sp15",name: "Run a Half Marathon",          brand: "Race Day",priceRange: "$80–$200",         subFilter: ["running","events"],       emoji: "🏃", imageQuery: "half marathon race morning start line runners", description: "A date on the calendar that turns ordinary mornings into training miles." },
    { id: "sp15b",name: "Run a Full Marathon",        brand: "Race Day",priceRange: "$100–$300",         subFilter: ["running","events"],       emoji: "🏃", imageQuery: "marathon race finish line crowd runners", description: "The one you train six months for and talk about the rest of your life. Worth every early morning." },
    { id: "sp15c",name: "Nike Alphafly 3",            brand: "Nike",    priceRange: "$285–$310",         subFilter: ["running","training"],     emoji: "👟", imageQuery: "Nike Alphafly 3 running shoe carbon plate", image: DREAMSHELF_IMAGES.sp15c, description: "The carbon-plate race shoe. The one you put on for the event and feel genuinely different in." },
    { id: "sp15d",name: "Hoka Clifton 9",             brand: "Hoka",    priceRange: "$145",              subFilter: ["running","training"],     emoji: "👟", imageQuery: "Hoka Clifton running shoe road", image: DREAMSHELF_IMAGES.sp15d, description: "The workhorse trainer. Soft enough for every day, stable enough for long miles, ugly enough to be iconic." },
    { id: "sp15e",name: "Hoka Speedgoat 6",           brand: "Hoka",    priceRange: "$155",              subFilter: ["running","training"],     emoji: "🏔️", imageQuery: "Hoka Speedgoat trail running shoe", image: DREAMSHELF_IMAGES.sp15e, description: "Grip, cushion, and confidence on any trail. The shoe that makes you want to find a harder route." },
    { id: "sp15f",name: "Salomon Active Skin Vest",   brand: "Salomon", priceRange: "$110–$140",         subFilter: ["running","training"],     emoji: "🏃", imageQuery: "Salomon running vest trail hydration", image: DREAMSHELF_IMAGES.sp15f, description: "Carry water, gels, and your phone without thinking about them. Built for when you add an hour to the run." },
    { id: "sp16",name: "Garmin Forerunner 965",        brand: "Garmin",  priceRange: "$600",             subFilter: ["running","training"],     emoji: "⌚", imageQuery: "Garmin Forerunner 965 running watch", image: DREAMSHELF_IMAGES.sp16, description: "A tiny coach on your wrist for the season where you decide to get consistent." },
    { id: "sp17",name: "Peloton Bike+",                brand: "Peloton", priceRange: "$2,495",           subFilter: ["cycling","training","home"], emoji: "🚴", imageQuery: "Peloton Bike Plus home workout", description: "A home ritual for rainy days, reset days, and the days you still show up." },
    { id: "sp17b",name: "Cervélo R5",                brand: "Cervélo", priceRange: "$8,000–$12,000",   subFilter: ["cycling"],                emoji: "🚴", imageQuery: " R5 road bike carbon climbing", description: "The climber's bike. Stiff, light, and beautiful in a way that makes every elevation gain feel earCerveloned." },
    { id: "sp17c",name: "Canyon Aeroad CF SLX",      brand: "Canyon",  priceRange: "$5,000–$8,000",    subFilter: ["cycling"],                emoji: "🚴", imageQuery: "Canyon Aeroad road bike aero carbon", description: "UCI WorldTour geometry at a fraction of the price. The bike that wins races and confuses people who ask what it cost." },
    { id: "sp17d",name: "Wahoo KICKR Core Trainer",  brand: "Wahoo",   priceRange: "$900–$1,100",      subFilter: ["cycling","training"],     emoji: "🚴", imageQuery: "Wahoo KICKR smart trainer indoor cycling", description: "Winter training, Zwift intervals, and the reason you don't lose your fitness between October and March." },
    { id: "sp17e",name: "Garmin Edge 1040 Solar",    brand: "Garmin",  priceRange: "$650–$750",        subFilter: ["cycling","training"],     emoji: "📡", imageQuery: "Garmin Edge 1040 cycling computer handlebar", description: "Turn-by-turn maps, power metrics, solar charging. The computer that makes every ride feel like a mission." },
    { id: "sp17f",name: "Rapha Pro Team Jersey",     brand: "Rapha",   priceRange: "$200–$260",        subFilter: ["cycling"],                emoji: "🚴", imageQuery: "Rapha Pro Team cycling jersey road", description: "The kit that makes you stand up a little straighter on the bike. Merino-blend, understated, and deeply good." },
    { id: "sp17g",name: "Zipp 303 S Wheelset",       brand: "Zipp",    priceRange: "$1,600–$2,000",    subFilter: ["cycling"],                emoji: "⚙️", imageQuery: "Zipp 303 S carbon wheelset road bike", image: DREAMSHELF_IMAGES.sp17g, description: "The upgrade that changes how the whole bike feels. Lighter, stiffer, and worth every dollar on a fast descent." },
    { id: "sp17h",name: "Tour de France Stage Trip", brand: "Various", priceRange: "$500–$3,000",      subFilter: ["cycling","events"],       emoji: "🏆", imageQuery: "Tour de France cycling crowd mountain stage", description: "Roadside on a mountain pass, watching the peloton go by. One of those afternoons that stays with you." },
    { id: "sp18",name: "Formula 1 Grand Prix Weekend", brand: "Formula 1",priceRange: "$500+",           subFilter: ["events"],                 emoji: "🏁", imageQuery: "Formula 1 Grand Prix weekend", description: "A full-throttle travel weekend with engines, grandstands, and a reason to plan ahead." },
    { id: "sp19",name: "NBA Courtside Game",           brand: "NBA",     priceRange: "$1,000+",          subFilter: ["events"],                 emoji: "🏀", imageQuery: "NBA courtside game seats", description: "One night close enough to hear the sneakers, the bench, and the buzz in the room." },
  ],
  sneakers: [
    { id: "s1",  name: "Air Jordan 1 Retro High OG",   brand: "Nike/Jordan",priceRange: "$170–$2,000+", subFilter: ["jordan","grail"],         emoji: "👟", description: "The shoe that started everything. Every colorway tells a story. The grail for a reason." },
    { id: "s2",  name: "Nike x Sacai LDWaffle",        brand: "Nike",    priceRange: "$180–$800+",       subFilter: ["collab","grail"],         emoji: "👟", description: "Double swoosh, deconstructed design, and the collab that changed what a running shoe could be." },
    { id: "s3",  name: "Adidas Samba OG",              brand: "Adidas",  priceRange: "$100–$130",        subFilter: ["adidas"],                 emoji: "👟", image: DREAMSHELF_IMAGES.s3, description: "The 1950s indoor soccer shoe that somehow became the shoe of the decade. Again." },
    { id: "s4",  name: "New Balance 550",              brand: "New Balance",priceRange: "$110–$140",     subFilter: ["collab"],                 emoji: "👟", image: DREAMSHELF_IMAGES.s4, description: "Aime Leon Dore put these back on the map and now everyone wants a pair. Deservedly." },
    { id: "s5",  name: "Air Max 97 Silver Bullet",     brand: "Nike",    priceRange: "$175–$500+",       subFilter: ["nike","grail"],           emoji: "👟", description: "Full-length air unit and a silver upper inspired by bullet trains. Still the best Air Max ever." },
    { id: "s6",  name: "Jordan 4 Retro",               brand: "Jordan",  priceRange: "$200–$1,000+",     subFilter: ["jordan","grail"],         emoji: "👟", description: "The shoe from Do the Right Thing. Every retro release sells out in minutes. For good reason." },
    { id: "s7",  name: "Common Projects Achilles Low", brand: "Common Projects", priceRange: "$500–$750", subFilter: ["grail"],                  emoji: "👟", description: "Minimal, Italian-made, and quietly iconic. The white sneaker that makes everything look more considered." },
    { id: "s8",  name: "Nike Dunk Low Panda",          brand: "Nike",    priceRange: "$110–$200+",       subFilter: ["nike"],                   emoji: "👟", image: DREAMSHELF_IMAGES.s8, description: "Black and white, simple as it gets, and somehow still the hardest dunk to keep in stock." },
  ],
  heels: [
    { id: "hl1", name: "Manolo Blahnik Hangisi",        brand: "Manolo Blahnik", priceRange: "$1,000–$1,500",subFilter: ["classic","grail"],        emoji: "👠", imageQuery: "blue satin jeweled buckle high heels fashion", image: DREAMSHELF_IMAGES.hl1, description: "The buckle pump that became a cultural symbol. Carrie Bradshaw's wedding shoe. An heirloom you wear." },
    { id: "hl2", name: "Christian Louboutin So Kate",   brand: "Louboutin",      priceRange: "$700–$900",    subFilter: ["classic","grail"],        emoji: "👠", imageQuery: "red sole black stiletto heels fashion", description: "120mm of red-soled intention. The heel that started a thousand imitations and can't be replicated." },
    { id: "hl3", name: "Jimmy Choo Romy 100",           brand: "Jimmy Choo",     priceRange: "$650–$850",    subFilter: ["classic","party"],        emoji: "👠", imageQuery: "pointed toe suede pump heels fashion", image: DREAMSHELF_IMAGES.hl3, description: "Pointed toe, kitten-to-stiletto range, no frills — just the shape that works every time." },
    { id: "hl4", name: "Bottega Veneta Stretch Mule",   brand: "Bottega Veneta", priceRange: "$750–$1,100",  subFilter: ["everyday","classic"],     emoji: "👠", imageQuery: "leather mule heels fashion editorial", image: DREAMSHELF_IMAGES.hl4, description: "The heel you wear like a flat. Intrecciato leather, no logo, and somehow impossible to miss." },
    { id: "hl5", name: "Gianvito Rossi 105 Pumps",      brand: "Gianvito Rossi", priceRange: "$700–$900",    subFilter: ["classic","everyday"],     emoji: "👠", imageQuery: "nude leather pointed pump heels fashion", description: "The Italian pump that walks better than anything. Nude pairs with everything; the heel height is forgiving." },
    { id: "hl6", name: "Saint Laurent Opyum Sandal",    brand: "Saint Laurent",  priceRange: "$900–$1,300",  subFilter: ["party","grail"],          emoji: "👠", imageQuery: "black stiletto sandal logo heel fashion", image: DREAMSHELF_IMAGES.hl6, description: "The logo is the heel. Audacious, architectural, and the kind of shoe that owns the room before you do." },
    { id: "hl7", name: "Aquazzura Deneuve Bow Pump",    brand: "Aquazzura",      priceRange: "$850–$1,050",  subFilter: ["party","classic"],        emoji: "👠", imageQuery: "bow satin pointed pump heels fashion", image: DREAMSHELF_IMAGES.hl7, description: "A bow at the toe, a pointed heel, satin finish. The party shoe that photographs as well as it wears." },
    { id: "hl8", name: "Sergio Rossi SR1 Pumps",        brand: "Sergio Rossi",   priceRange: "$500–$700",    subFilter: ["everyday","classic"],     emoji: "👠", imageQuery: "minimal leather pointed pump heels fashion", image: DREAMSHELF_IMAGES.hl8, description: "The understated Italian heel. No logo, no buckle — just a beautifully proportioned shoe that goes with everything." },
  ],
  hobbies: [
    { id: "h1",  name: "Gibson Les Paul Standard",     brand: "Gibson",  priceRange: "$2,500–$4,000",   subFilter: ["music"],                  emoji: "🎸", image: DREAMSHELF_IMAGES.h1, description: "The guitar Page, Slash, and Clapton chose. If you're going to learn, learn on the real thing." },
    { id: "h2",  name: "Leica M11 Rangefinder",        brand: "Leica",   priceRange: "$8,000–$10,000",  subFilter: ["camera"],                 emoji: "📷", description: "The camera Cartier-Bresson used. Manual, quiet, and the reason photographers make pilgrimages to Wetzlar." },
    { id: "h4",  name: "Steinway Model O Grand Piano", brand: "Steinway",priceRange: "$60,000–$90,000", subFilter: ["music"],                  emoji: "🎹", imageQuery: "Steinway grand piano", description: "Every concert hall has one. If you're going to have a piano in your home, have this piano." },
    { id: "h5",  name: "Hasselblad X2D 100C",          brand: "Hasselblad",priceRange: "$8,000–$10,000",subFilter: ["camera"],                 emoji: "📷", image: DREAMSHELF_IMAGES.h5, description: "Medium format. 100 megapixels. The camera that makes professional photographers emotional." },
    { id: "h6",  name: "Fender Custom Shop Stratocaster",brand: "Fender",priceRange: "$3,000–$6,000",  subFilter: ["music"],                  emoji: "🎸", image: DREAMSHELF_IMAGES.h6, description: "Built by master builders in Corona, California. The instrument you commission, not just buy." },
    { id: "h8",  name: "Warhol Screen Print (Authenticated)",brand: "Andy Warhol",priceRange: "$5,000–$50,000+",subFilter: ["art"],            emoji: "🖼️", description: "A piece of art history you can hang in your home. Pop art that only gets more meaningful with time." },
  ],
  kitchen: [
    { id: "h9",  name: "Le Creuset Dutch Oven",        brand: "Le Creuset",priceRange: "$300–$500",      subFilter: ["cooking","ritual"],       emoji: "🍳", image: DREAMSHELF_IMAGES.h9, description: "The heirloom kitchen piece. Braises, soups, bread, and Sunday sauces all feel more special in enameled cast iron." },
    { id: "h10", name: "Breville Espresso Machine",    brand: "Breville", priceRange: "$500–$900",      subFilter: ["coffee","ritual"],        emoji: "☕", image: DREAMSHELF_IMAGES.h10, description: "A countertop ritual machine for dialing in espresso, steaming milk, and making every morning feel a little more intentional." },
    { id: "h11", name: "All-Clad D3 10-Piece Set",    brand: "All-Clad", priceRange: "$700–$1,000",    subFilter: ["cooking"],                emoji: "🍳", imageQuery: "All-Clad stainless steel cookware set kitchen", image: DREAMSHELF_IMAGES.h11, description: "The set professional cooks put in their home kitchens. Tri-ply stainless that lasts decades and only gets better." },
    { id: "h12", name: "Vitamix Ascent A3500",        brand: "Vitamix",  priceRange: "$600–$700",      subFilter: ["cooking","ritual"],       emoji: "🥤", imageQuery: "Vitamix blender countertop kitchen", description: "The blender that handles anything. Smoothies, soups, nut butters — the kind of machine that changes what you cook." },
    { id: "h13", name: "Staub Cocotte 5.5qt",         brand: "Staub",    priceRange: "$350–$450",      subFilter: ["cooking"],                emoji: "🍳", imageQuery: "Staub cocotte cast iron black oven", image: DREAMSHELF_IMAGES.h13, description: "Matte enamel interior, self-basting lid, and a weight that means business. The French alternative to Le Creuset." },
    { id: "h14", name: "Ooni Karu 16 Pizza Oven",     brand: "Ooni",     priceRange: "$849",           subFilter: ["cooking","outdoor"],      emoji: "🍕", imageQuery: "Ooni pizza oven outdoor wood fire", image: DREAMSHELF_IMAGES.h14, description: "Restaurant-quality pizza in your backyard in sixty seconds. The oven that turns any evening into an event." },
    { id: "h15", name: "Global G-2 Knife Set",        brand: "Global",   priceRange: "$400–$600",      subFilter: ["cooking"],                emoji: "🔪", imageQuery: "Global G-2 Japanese knife set kitchen", description: "Japanese steel, razor edge, and a handle that disappears in your hand. The knives you sharpen and keep forever." },
  ],
  cellar: [
    { id: "c1",  name: "Opus One 2018",                brand: "Opus One",priceRange: "$350–$450 /bottle",subFilter: ["red","rare"],            emoji: "🍷", image: DREAMSHELF_IMAGES.c1, description: "The Napa Valley Bordeaux blend that made California wine taken seriously worldwide." },
    { id: "c2",  name: "Dom Pérignon Vintage 2013",    brand: "Moët",    priceRange: "$200–$280 /bottle",subFilter: ["champagne"],             emoji: "🥂", image: DREAMSHELF_IMAGES.c2, description: "The vintage that only happens when Dom's cellar master decides conditions were perfect." },
    { id: "c3",  name: "Petrus 2015",                  brand: "Pétrus",  priceRange: "$3,000–$5,000 /bottle",subFilter: ["red","rare"],        emoji: "🍷", image: DREAMSHELF_IMAGES.c3, description: "The most coveted Bordeaux on earth. Pure Merlot from a single patch of iron-rich clay in Pomerol." },
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
    { id: "a2",  name: "Arc'teryx Alpha SV Jacket",    brand: "Arc'teryx",priceRange: "$850–$1,000",    subFilter: ["ski","climb"],            emoji: "🧥", image: DREAMSHELF_IMAGES.a2, description: "The jacket mountaineers trust in the most severe conditions on earth. Built to last a lifetime." },
    { id: "a3",  name: "Petzl Vertigo Wire-Lock",      brand: "Petzl",   priceRange: "$25–$40",         subFilter: ["climb"],                  emoji: "🧗", description: "The carabiner that professional guides trust. A small thing that means everything." },
    { id: "a4",  name: "Trek Domane SLR 9",            brand: "Trek",    priceRange: "$9,000–$12,000",  subFilter: ["bike","cycling"],         emoji: "🚴", imageQuery: "Trek Domane SLR road bike carbon", description: "Carbon frame, Shimano Dura-Ace, and the smoothest ride on any road surface. The dream cycling setup." },
    { id: "a5",  name: "Patagonia Black Hole Duffel 70L",brand: "Patagonia",priceRange: "$250–$300",   subFilter: ["ski","climb"],            emoji: "🎒", description: "The bag that goes on every adventure and comes back looking fine. Built to outlast the trip." },
    { id: "a6",  name: "Capita DOA Snowboard",         brand: "Capita",  priceRange: "$600–$700",       subFilter: ["ski"],                    emoji: "🏂", description: "The people's board. Versatile, responsive, and the first thing intermediate riders reach for." },
    { id: "a7",  name: "Hobie Mirage Pro Angler Kayak",brand: "Hobie",   priceRange: "$3,500–$4,500",   subFilter: ["water"],                  emoji: "🛶", description: "Pedal-powered fishing kayak with hands-free steering. The serious angler's dream craft." },
    { id: "a8",  name: "Garmin Fenix 7X Solar",        brand: "Garmin",  priceRange: "$700–$900",       subFilter: ["ski","climb","bike"],     emoji: "⌚", image: DREAMSHELF_IMAGES.a8, description: "Solar charging, topographic maps, and a battery that lasts longer than any expedition." },
    { id: "a9",  name: "Parasailing Over Clear Water", brand: "Ocean Day",priceRange: "$80–$180",        subFilter: ["water"],                  emoji: "🪂", description: "Floating above bright water with nothing but wind, sunlight, and the kind of view you remember years later." },
    { id: "a10", name: "Skydiving First Jump",         brand: "Drop Zone",priceRange: "$250–$400",       subFilter: ["mountain"],               emoji: "🪂", imageQuery: "skydiving", description: "The leap you talk about for the rest of your life. A few wild seconds that make everything feel bigger." },
    { id: "a11", name: "Bungee Jumping",               brand: "Adventure Day",priceRange: "$120–$300",   subFilter: ["climb"],                  emoji: "🌉", imageQuery: "bungee jumping", description: "A bridge, a cord, a countdown, and the clean shock of doing something you were scared to do." },
  ],
  cars: [
    { id: "car1", name: "Porsche 911 Carrera",         brand: "Porsche",  priceRange: "$110,000+",        subFilter: ["sports","grail"],          emoji: "🏎️", imageQuery: "Porsche 911 Carrera road driving", image: DREAMSHELF_IMAGES.car1, description: "Sixty years of the same shape, infinitely refined. The car that rewards the driver who learns it." },
    { id: "car2", name: "Ferrari 296 GTB",             brand: "Ferrari",  priceRange: "$320,000+",        subFilter: ["sports","grail"],          emoji: "🏎️", imageQuery: "Ferrari 296 GTB red supercar", description: "Hybrid V6, 830 horsepower, and a soundtrack that belongs in an opera house. Ferrari's most exciting car in decades." },
    { id: "car3", name: "BMW M3 Competition",          brand: "BMW",      priceRange: "$80,000–$95,000",  subFilter: ["sports","attainable"],     emoji: "🚗", imageQuery: "BMW M3 Competition car road", image: DREAMSHELF_IMAGES.car3, description: "The benchmark sports sedan. Track-capable, daily-driveable, and the car that makes every drive feel intentional." },
    { id: "car4", name: "McLaren GT",                  brand: "McLaren",  priceRange: "$220,000+",        subFilter: ["sports","grail"],          emoji: "🏎️", imageQuery: "McLaren GT silver supercar road", image: DREAMSHELF_IMAGES.car4, description: "A grand tourer that happens to be a supercar. Fast enough for a track, comfortable enough for the coast." },
    { id: "car5", name: "Range Rover Autobiography",   brand: "Land Rover",priceRange: "$200,000+",       subFilter: ["luxury","suv"],            emoji: "🚙", imageQuery: "Range Rover Autobiography luxury SUV", image: DREAMSHELF_IMAGES.car5, description: "The most accomplished SUV ever made. Quiet, elevated, and capable of anything." },
    { id: "car6", name: "Mercedes-AMG GT 63",          brand: "Mercedes-AMG",priceRange: "$165,000+",     subFilter: ["sports","luxury"],         emoji: "🚗", imageQuery: "Mercedes AMG GT 63 car road", image: DREAMSHELF_IMAGES.car6, description: "Four doors, AMG performance, and a presence that announces itself before you even open the door." },
    { id: "car7", name: "Lamborghini Huracán EVO",     brand: "Lamborghini",priceRange: "$250,000+",      subFilter: ["sports","grail"],          emoji: "🏎️", imageQuery: "Lamborghini Huracan yellow supercar", description: "The car that makes people stop and stare every single time. No apologies, no compromises." },
    { id: "car8", name: "Porsche Taycan Turbo S",      brand: "Porsche",  priceRange: "$185,000+",        subFilter: ["sports","ev"],             emoji: "⚡", imageQuery: "Porsche Taycan Turbo S electric car", description: "0–60 in 2.6 seconds with zero emissions. The car that proved electric performance could be this good." },
    { id: "car9", name: "Track Day Experience",        brand: "Various",  priceRange: "$300–$1,500",      subFilter: ["experience"],              emoji: "🏁", imageQuery: "track day driving experience supercar circuit", description: "An afternoon on a closed circuit in something fast. The experience that recalibrates what driving means." },
    { id: "car10",name: "Vintage Porsche 356",         brand: "Porsche",  priceRange: "$80,000–$200,000", subFilter: ["classic","grail"],         emoji: "🚗", imageQuery: "vintage Porsche 356 classic car", image: DREAMSHELF_IMAGES.car10, description: "The original. Before 911, there was 356. A piece of automotive history you can actually drive." },
  ],
  experiences: [
    { id: "ex1", name: "Safari in the Serengeti",      brand: "Tanzania", priceRange: "$5,000–$15,000",   subFilter: ["nature","bucket-list"],   emoji: "🦁", imageQuery: "giraffes and lions safari Africa", image: DREAMSHELF_IMAGES.ex1, description: "Dawn game drives, golden light, and the most alive you will ever feel. The trip that changes your frame of reference." },
    { id: "ex2", name: "Northern Lights in Iceland",   brand: "Iceland",  priceRange: "$2,000–$5,000",    subFilter: ["nature","bucket-list"],   emoji: "🌌", imageQuery: "northern lights aurora borealis green sky stars", image: DREAMSHELF_IMAGES.ex2, description: "Standing under a sky that looks like a painting. One of the few things that genuinely exceeds the photographs." },
    { id: "ex3", name: "Tokyo Food Trip",              brand: "Japan",    priceRange: "$3,000–$6,000",    subFilter: ["food","city"],            emoji: "🍜", imageQuery: "Tokyo sushi omakase Japan chef counter", description: "The best food city on earth, by a wide margin. Every meal a discovery, every neighbourhood a different world." },
    { id: "ex4", name: "Amalfi Coast Road Trip",       brand: "Italy",    priceRange: "$4,000–$8,000",    subFilter: ["road-trip","bucket-list"],emoji: "🛣️", imageQuery: "Amalfi Coast Italy village cliffs turquoise water", description: "Narrow roads, blue water, and the most dramatic coastline in Europe. The drive you plan for years." },
    { id: "ex5", name: "Michelin Star Dinner",         brand: "Various",  priceRange: "$200–$800",        subFilter: ["food","luxury"],          emoji: "⭐", imageQuery: "Michelin star restaurant fine dining", description: "A meal that takes three hours and stays with you for years. The best argument for spending money on experiences." },
    { id: "ex6", name: "Private Chef Dinner at Home",  brand: "Various",  priceRange: "$400–$1,500",      subFilter: ["food","luxury"],          emoji: "🍽️", imageQuery: "private chef dinner home table", image: DREAMSHELF_IMAGES.ex6, description: "Your own kitchen, a professional chef, and a table of the people you love. A celebration that feels entirely yours." },
    { id: "ex7", name: "New Year's Eve in NYC",        brand: "New York", priceRange: "$1,000–$5,000",    subFilter: ["city","bucket-list"],     emoji: "🎆", imageQuery: "New York Times Square New Year's Eve celebration", image: DREAMSHELF_IMAGES.ex7, description: "The city that made New Year's Eve what it is. Once is enough. Once is everything." },
    { id: "ex8", name: "Napa Valley Harvest Weekend",  brand: "California",priceRange: "$1,500–$4,000",   subFilter: ["food","nature"],          emoji: "🍇", imageQuery: "Napa Valley vineyard harvest autumn wine", description: "September in wine country — crush season, barrel tastings, and tables set among the vines." },
    { id: "ex9", name: "Hot Air Balloon over Cappadocia", brand: "Turkey",priceRange: "$200–$400",        subFilter: ["nature","bucket-list"],   emoji: "🎈", imageQuery: "hot air balloon Cappadocia Turkey sunrise", description: "Dozens of balloons rising over fairy chimneys at sunrise. One of the most photographed mornings on earth, for good reason." },
    { id: "ex10",name: "Coachella Weekend",            brand: "Various",  priceRange: "$500–$2,000",      subFilter: ["city","music"],           emoji: "🎵", image: DREAMSHELF_IMAGES.ex10, imageQuery: "Coachella music festival desert night lights", description: "Music, desert air, and the feeling that everything is possible. The festival worth planning a year ahead for." },
  ],
  home: [
    { id: "hm1", name: "Parachute Linen Sheet Set",    brand: "Parachute", priceRange: "$200–$350",        subFilter: ["bedroom","textiles"],     emoji: "🛏️", imageQuery: "Parachute linen sheets bed natural light", image: DREAMSHELF_IMAGES.hm1, description: "The sheets that make every morning feel like a slow one. Softer every time you wash them." },
    { id: "hm2", name: "Aesop Aromatique Candle",      brand: "Aesop",     priceRange: "$80–$110",         subFilter: ["scent","living"],         emoji: "🕯️", imageQuery: "Aesop candle warm interior minimal", image: DREAMSHELF_IMAGES.hm2, description: "Botanical and medicinal. The candle that makes a room smell like somewhere you want to stay." },
    { id: "hm3", name: "Le Labo Santal 33",            brand: "Le Labo",   priceRange: "$220–$320",        subFilter: ["scent","fragrance"],      emoji: "🌿", imageQuery: "Le Labo Santal 33 perfume bottle", image: DREAMSHELF_IMAGES.hm3, description: "The fragrance everyone recognises and no one admits to wearing. Woody, leathery, and completely addictive." },
    { id: "hm4", name: "Restoration Hardware Cloud Sofa", brand: "RH",    priceRange: "$3,000–$8,000",    subFilter: ["living","statement"],     emoji: "🛋️", imageQuery: "RH cloud sofa living room linen", description: "The sofa people build rooms around. Deep enough to disappear into, beautiful enough to anchor everything else." },
    { id: "hm5", name: "Hay Palissade Lounge Chair",   brand: "Hay",       priceRange: "$500–$700",        subFilter: ["living","statement"],     emoji: "🪑", imageQuery: "Hay outdoor lounge chair design", image: DREAMSHELF_IMAGES.hm5, description: "Scandinavian outdoor design that looks as considered inside as out." },
    { id: "hm6", name: "Byredo Gypsy Water",           brand: "Byredo",    priceRange: "$200–$280",        subFilter: ["scent","fragrance"],      emoji: "🌿", imageQuery: "Byredo perfume bottle minimal", image: DREAMSHELF_IMAGES.hm6, description: "Bergamot, pine needles, vanilla. The scent of a campfire you went to in your twenties that you haven't stopped thinking about." },
    { id: "hm7", name: "Gallery Wall Curation",        brand: "Various",   priceRange: "$500–$3,000",      subFilter: ["art","living"],           emoji: "🖼️", imageQuery: "gallery wall art prints home interior", image: DREAMSHELF_IMAGES.hm7, description: "A wall that says something about you. The collection you build slowly and never quite finish." },
    { id: "hm8", name: "Sonos Era 300",                brand: "Sonos",     priceRange: "$449",             subFilter: ["audio","living"],         emoji: "🔊", imageQuery: "Sonos Era 300 speaker room", description: "Spatial audio in a form that actually looks right on a shelf. The room sounds different after." },
  ],
  wellness: [
    { id: "wl1", name: "Eight Sleep Pod 5",            brand: "Eight Sleep",priceRange: "$2,295–$3,295",   subFilter: ["sleep","recovery"],       emoji: "🛏️", imageQuery: "Eight Sleep Pod 5 smart mattress cover", image: DREAMSHELF_IMAGES.wl1, description: "Temperature-regulated sleep. The upgrade that makes everything else in your health stack perform better." },
    { id: "wl2", name: "Oura Ring Gen 4",              brand: "Oura",      priceRange: "$349–$499",        subFilter: ["tracking","sleep"],       emoji: "💍", imageQuery: "Oura Ring health tracker hand", image: DREAMSHELF_IMAGES.wl2, description: "The ring that knows your readiness before you do. Subtle, accurate, and actually changes how you manage your days." },
    { id: "wl3", name: "Theragun Pro",                 brand: "Therabody", priceRange: "$399–$499",        subFilter: ["recovery","training"],    emoji: "💪", imageQuery: "Theragun Pro massage gun recovery", image: DREAMSHELF_IMAGES.wl3, description: "Deep tissue percussion you actually use. The recovery tool that earns its counter space." },
    { id: "wl4", name: "Clearlight Sanctuary Sauna",  brand: "Clearlight",priceRange: "$4,000–$6,000",    subFilter: ["sauna","recovery"],       emoji: "🧖", imageQuery: "home infrared sauna wood cedar interior", image: DREAMSHELF_IMAGES.wl4, description: "An infrared sauna that fits in a spare corner. Twenty minutes in, and you remember what relaxed feels like." },
    { id: "wl5", name: "Joovv Red Light Panel",       brand: "Joovv",     priceRange: "$600–$1,200",      subFilter: ["recovery","tracking"],    emoji: "🔴", imageQuery: "red light therapy panel wellness", image: DREAMSHELF_IMAGES.wl5, description: "Ten minutes of red and near-infrared light. The longevity routine that's now standard in performance circles." },
    { id: "wl6", name: "Whoop 4.0 Membership",        brand: "Whoop",     priceRange: "$239/yr",          subFilter: ["tracking","sleep"],       emoji: "⌚", imageQuery: "Whoop fitness tracker wrist", description: "No screen, no distraction — just strain, recovery, and sleep data that quietly rewires your habits." },
    { id: "wl7", name: "Hyperice Normatec 3 Legs",    brand: "Hyperice",  priceRange: "$699",             subFilter: ["recovery"],               emoji: "🦵", imageQuery: "Normatec compression boots recovery", image: DREAMSHELF_IMAGES.wl7, description: "The compression boots serious athletes use post-run. You feel the difference the next morning." },
  ],
  coffee: [
    { id: "cf1", name: "La Marzocco Linea Mini",       brand: "La Marzocco",priceRange: "$4,500–$5,500",   subFilter: ["espresso","machine"],     emoji: "☕", imageQuery: "La Marzocco Linea Mini espresso home", description: "The machine baristas dream of putting in their kitchen. Commercial quality, counter-sized, completely worth it." },
    { id: "cf2", name: "Niche Zero Grinder",           brand: "Niche",     priceRange: "$700–$800",        subFilter: ["espresso","grinder"],     emoji: "⚙️", imageQuery: "Niche Zero coffee grinder single dose", image: DREAMSHELF_IMAGES.cf2, description: "Single-dose, zero retention, beautiful on the counter. The grinder that changed what home espresso could taste like." },
    { id: "cf3", name: "Fellow Stagg EKG Kettle",      brand: "Fellow",    priceRange: "$165–$199",        subFilter: ["pour-over","gear"],       emoji: "🫖", imageQuery: "Fellow Stagg EKG kettle pour over coffee", description: "Precision temperature, a slow gooseneck pour, and the ritual that makes mornings worth waking up for." },
    { id: "cf4", name: "Arlo Blanco Pour-Over Set",    brand: "Fellow",    priceRange: "$85–$120",         subFilter: ["pour-over","gear"],       emoji: "☕", imageQuery: "pour over coffee dripper ceramic morning", image: DREAMSHELF_IMAGES.cf4, description: "The slow-coffee setup for the kind of morning where you have nowhere to be for twenty minutes." },
    { id: "cf5", name: "Breville Oracle Touch",        brand: "Breville",  priceRange: "$1,500–$1,800",    subFilter: ["espresso","machine"],     emoji: "☕", imageQuery: "Breville Oracle Touch espresso machine", description: "Auto-grind, auto-tamp, auto-steam. The machine for people who want La Marzocco results with fewer variables." },
    { id: "cf6", name: "Coffee Origin Trip",           brand: "Various",   priceRange: "$500–$2,000",      subFilter: ["experience"],             emoji: "✈️", imageQuery: "coffee farm Ethiopia Colombia origin", description: "Ethiopia, Colombia, Costa Rica — visiting a farm changes how you drink coffee for the rest of your life." },
    { id: "cf7", name: "Acaia Pearl Scale",            brand: "Acaia",     priceRange: "$150–$200",        subFilter: ["pour-over","espresso","gear"], emoji: "⚖️", imageQuery: "Acaia coffee scale precision", description: "The scale coffee obsessives swear by. Real-time flow rate, Bluetooth logging, and enough precision to finally dial in your shot." },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function getAllCuratedItemsShuffled() {
  const buckets = shuffleArray(Object.entries(CURATED_ITEMS)).map(([categoryId, categoryItems]) => {
    const cat = getDreamShelfCategoryMeta(categoryId);
    return {
      categoryId,
      items: shuffleArray(categoryItems.map(item => ({
        ...item,
        category: categoryId,
        emoji: item.emoji || cat.emoji,
        preferResolvedImage: true,
        image: item.image || DREAMSHELF_IMAGES[item.id] || "",
      }))),
    };
  });

  const mixed = [];
  while (buckets.some(bucket => bucket.items.length > 0)) {
    shuffleArray(buckets.filter(bucket => bucket.items.length > 0)).forEach(bucket => {
      const next = bucket.items.shift();
      if (next) mixed.push(next);
    });
  }
  return mixed;
}

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
        image: item.image || DREAMSHELF_IMAGES[item.id] || "",
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
      mens: () => filters.includes("mens") || has("signet", "cuban", "chevron", "chain", "yurman"),
      everyday: () => filters.includes("everyday") || has("tiffany", "love bracelet", "alhambra"),
      devotion: () => has("love", "diamond", "anniversary", "solitaire", "band"),
      heirloom: () => has("mikimoto", "harry winston", "diamond", "pearl", "bvlgari"),
      statement: () => has("serpenti", "clou", "diamond", "bvlgari"),
      gold: () => filters.includes("gold") || has("gold", "cartier", "van cleef"),
    },
    golf: {
      golf: () => filters.includes("golf") || has("golf", "putter", "driver", "iron", "pebble", "scotty", "taylormade", "titleist", "footjoy", "vokey", "bushnell", "vessel", "pinehurst", "bandon", "masters"),
      tennis: () => filters.includes("tennis") || has("tennis", "wilson", "pro staff", "babolat", "pure aero", "vapor pro", "spinshot", "wimbledon", "us open"),
      pickleball: () => filters.includes("pickleball") || has("pickleball", "selkirk", "joola", "ben johns", "hyperion"),
      running: () => filters.includes("running") || has("run", "running", "marathon", "forerunner", "alphafly", "hoka", "clifton", "speedgoat", "salomon", "vest"),
      cycling: () => filters.includes("cycling") || has("cycling", "bike", "peloton", "cervélo", "cervelo", "canyon", "aeroad", "wahoo", "kickr", "rapha", "zipp", "tour de france", "trek", "domane"),
      training: () => filters.includes("training") || has("training", "lesson", "fitting", "rangefinder", "launch monitor", "garmin", "forerunner", "peloton"),
      events: () => filters.includes("events") || has("pebble", "pinehurst", "bandon", "masters", "us open", "half marathon", "formula 1", "f1", "grand prix", "nba", "courtside"),
    },
    sneakers: {
      everyday: () => has("samba", "common projects", "panda", "new balance"),
      grail: () => filters.includes("grail") || has("jordan", "sacai", "silver bullet"),
      classic: () => has("jordan", "samba", "air max", "achilles", "dunk"),
      collab: () => filters.includes("collab") || has("sacai", "aime leon dore"),
    },
    heels: {
      classic: () => has("manolo", "louboutin", "gianvito", "sergio rossi", "bottega"),
      party: () => filters.includes("party") || has("louboutin", "saint laurent", "opyum", "aquazzura", "jimmy choo"),
      everyday: () => has("bottega", "gianvito", "sergio rossi"),
      grail: () => filters.includes("grail") || has("manolo", "louboutin", "saint laurent"),
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
    cars: {
      sports: () => filters.includes("sports") || has("porsche", "ferrari", "bmw", "mclaren", "amg", "lamborghini", "taycan", "911", "m3"),
      luxury: () => filters.includes("luxury") || has("range rover", "mercedes", "amg", "rolls"),
      suv: () => filters.includes("suv") || has("range rover", "suv"),
      ev: () => filters.includes("ev") || has("taycan", "electric", "tesla"),
      classic: () => filters.includes("classic") || has("356", "vintage", "classic"),
      grail: () => filters.includes("grail") || has("ferrari", "lamborghini", "mclaren", "porsche 911", "911", "taycan"),
      experience: () => filters.includes("experience") || has("track", "circuit", "day"),
      attainable: () => filters.includes("attainable") || has("bmw", "m3"),
    },
    experiences: {
      "bucket-list": () => filters.includes("bucket-list") || has("serengeti", "northern lights", "aurora", "amalfi", "cappadocia", "nyc", "new year"),
      nature: () => filters.includes("nature") || has("safari", "northern lights", "balloon", "cappadocia", "napa", "harvest"),
      food: () => filters.includes("food") || has("tokyo", "michelin", "chef", "dinner", "napa", "wine"),
      city: () => filters.includes("city") || has("tokyo", "nyc", "new york", "coachella"),
      "road-trip": () => filters.includes("road-trip") || has("amalfi", "road trip", "coast", "drive"),
      music: () => filters.includes("music") || has("coachella", "festival", "music"),
      luxury: () => filters.includes("luxury") || has("michelin", "private chef", "chef", "star"),
    },
    adventure: {
      mountain: () => has("ski", "snowboard", "jacket", "mountain", "snow"),
      climb: () => filters.includes("climb") || has("climb", "carabiner", "arc'teryx"),
      ride: () => filters.includes("bike") || has("bike", "cycling", "trek", "ride"),
      water: () => filters.includes("water") || has("kayak", "water"),
      gear: () => has("duffel", "jacket", "watch", "garmin", "bag"),
    },
    home: {
      bedroom: () => filters.includes("bedroom") || has("sheet", "linen", "parachute", "sleep"),
      living: () => filters.includes("living") || has("sofa", "chair", "speaker", "sonos", "hay", "rh", "restoration", "peloton"),
      scent: () => filters.includes("scent") || has("candle", "aesop", "le labo", "byredo", "fragrance", "santal"),
      fragrance: () => filters.includes("fragrance") || has("le labo", "byredo", "perfume", "scent", "santal", "gypsy"),
      audio: () => filters.includes("audio") || has("sonos", "speaker", "audio"),
      art: () => filters.includes("art") || has("art", "gallery", "print", "wall"),
      statement: () => filters.includes("statement") || has("sofa", "chair", "rh", "restoration", "hay"),
      textiles: () => filters.includes("textiles") || has("sheet", "linen", "parachute"),
    },
    wellness: {
      sleep: () => filters.includes("sleep") || has("sleep", "eight sleep", "oura", "pod"),
      recovery: () => filters.includes("recovery") || has("theragun", "normatec", "sauna", "red light", "joovv", "hyperice", "compression"),
      tracking: () => filters.includes("tracking") || has("oura", "whoop", "ring", "tracker"),
      sauna: () => filters.includes("sauna") || has("sauna", "infrared", "clearlight"),
      training: () => filters.includes("training") || has("theragun", "normatec", "hyperice"),
    },
    coffee: {
      espresso: () => filters.includes("espresso") || has("espresso", "la marzocco", "breville", "linea", "oracle", "niche", "grinder"),
      "pour-over": () => filters.includes("pour-over") || has("pour over", "kettle", "stagg", "fellow", "dripper"),
      grinder: () => filters.includes("grinder") || has("grinder", "niche", "zero"),
      machine: () => filters.includes("machine") || has("machine", "la marzocco", "breville", "oracle", "linea"),
      gear: () => filters.includes("gear") || has("kettle", "scale", "acaia", "fellow", "gear"),
      experience: () => filters.includes("experience") || has("origin", "trip", "farm", "ethiopia", "colombia"),
    },
  };
  return Boolean(matchers[categoryId]?.[subId]?.());
}

function getDreamShelfVibe(item = {}) {
  const text = `${item.name || ""} ${item.brand || ""} ${item.description || ""}`.toLowerCase();
  if (text.includes("espresso") || text.includes("coffee")) return "Morning ritual";
  if (text.includes("dutch oven") || text.includes("le creuset")) return "Dinner with friends";
  if (text.includes("formula 1") || text.includes("grand prix") || text.includes("nba") || text.includes("us open")) return "A day worth clearing";
  if (text.includes("half marathon") || text.includes("running") || text.includes("forerunner")) return "The next training arc";
  if (text.includes("tennis") || text.includes("pickleball") || text.includes("lesson")) return "A game to grow into";
  if (text.includes("peloton") || text.includes("cycling")) return "A rhythm worth keeping";
  if (text.includes("golf") || text.includes("pebble") || text.includes("putter") || text.includes("driver")) return "A day worth clearing";
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
          background: dm ? NAVY_DEEP : LINEN,
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
              style={{ background: dm ? NAVY_SURFACE : OAT }}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="w-full h-60 flex flex-col items-center justify-center gap-3" style={{ background: dm ? NAVY_SURFACE : OAT }}>
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
        background: dm ? NAVY_SURFACE : LINEN,
        borderColor: dm ? "rgba(250,246,240,0.09)" : STONE_LIGHT,
        borderRadius: '16px',
        boxShadow: dm
          ? '0 4px 20px rgba(0,0,0,0.18)'
          : '0 2px 12px rgba(42,36,32,0.06)',
      }}
    >
      {/* Image / emoji */}
      <div className={`w-full h-56 flex flex-col items-center justify-center gap-2 relative`} style={{ background: dm ? NAVY_DEEP : OAT, borderRadius: '16px 16px 0 0' }}>
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
    <div className="border rounded-2xl p-4" style={{ background: dm ? NAVY_SURFACE : LINEN, borderColor: dm ? "rgba(241,230,216,0.10)" : STONE_LIGHT }}>
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
            style={{ background: dm ? NAVY_DEEP : OAT }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: dm ? NAVY_DEEP : OAT }}>
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
  const inputStyle = { fontFamily: "'Caveat', cursive", background: dm ? NAVY_SURFACE : OAT, borderColor: dm ? "rgba(241,230,216,0.12)" : STONE_LIGHT, color: dm ? LINEN : CHAR };

  return createPortal(
    <div className="fixed inset-0 z-[10100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');`}</style>
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border" style={{ background: dm ? NAVY_DEEP : LINEN, borderColor: dm ? "rgba(241,230,216,0.16)" : STONE_LIGHT }}>
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
              <button type="button" onClick={() => photoInputRef.current?.click()} className="py-6 rounded-2xl border-2 border-dashed flex flex-col items-center gap-2" style={{ background: dm ? NAVY_SURFACE : OAT, borderColor: dm ? "rgba(241,230,216,0.14)" : STONE_LIGHT }}>
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

        <div className="px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] border-t" style={{ background: dm ? NAVY_SURFACE : LINEN, borderColor: dm ? "rgba(241,230,216,0.12)" : STONE_LIGHT }}>
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
  const [cachedImageUrls, setCachedImageUrls] = useState(() => readDreamShelfImageCache());
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [searching, setSearching]           = useState(false);
  const [searchError, setSearchError]       = useState("");
  const hasFetchedRef = useRef(false);
  const imageFetchedRef = useRef(new Set());
  const imageRequestsRef = useRef(new Map());
  const itemImagesRef = useRef({});
  const cachedImageUrlsRef = useRef(cachedImageUrls);
  const searchRequestIdRef = useRef(0);
  const categoryLoadIdRef = useRef(0);

  useEffect(() => {
    itemImagesRef.current = itemImages;
  }, [itemImages]);

  useEffect(() => {
    cachedImageUrlsRef.current = cachedImageUrls;
  }, [cachedImageUrls]);

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
      image: item.image || DREAMSHELF_IMAGES[item.id] || "",
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
        image: item.image || DREAMSHELF_IMAGES[item.id] || "",
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
    setItems(getAllCuratedItemsShuffled());
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

  const cacheDreamShelfImage = useCallback(async (imageUrl, name) => {
    if (!imageUrl || imageUrl.startsWith("data:") || isDreamShelfCachedImageUrl(imageUrl)) return imageUrl || "";
    if (cachedImageUrlsRef.current[imageUrl]) return cachedImageUrlsRef.current[imageUrl];
    try {
      const { data, error } = await supabase.functions.invoke("cache-product-image", {
        body: { imageUrl, name },
      });
      if (error) return imageUrl;
      const stableImageUrl = data?.imageUrl || imageUrl;
      if (stableImageUrl && stableImageUrl !== imageUrl && isDreamShelfCachedImageUrl(stableImageUrl)) {
        setCachedImageUrls(prev => {
          const next = { ...prev, [imageUrl]: stableImageUrl };
          cachedImageUrlsRef.current = next;
          writeDreamShelfImageCache(next);
          return next;
        });
      }
      return stableImageUrl;
    } catch {
      return imageUrl;
    }
  }, []);

  const fetchDreamShelfImage = useCallback(async (item) => {
    const key = getDreamShelfImageKey(item);
    const cachedImage = itemImagesRef.current[key] || (!item?.preferResolvedImage ? (item?.image || item?.product_image || "") : "");
    if (!key || cachedImage) return cachedImage;
    if (imageRequestsRef.current.has(key)) return imageRequestsRef.current.get(key);
    if (imageFetchedRef.current.has(key)) return "";

    const query = getDreamShelfImageQuery(item);
    if (!query) return "";

    const request = (async () => {
      let imageUrl = "";
      try {
        const productQuery = getDreamShelfProductSearchQuery(item) || query;
        const productResponse = await fetch(`/api/product-search?q=${encodeURIComponent(productQuery)}`);
        if (productResponse.ok) {
          const productData = await productResponse.json();
          const productItems = Array.isArray(productData)
            ? productData
            : (productData?.items || productData?.results || productData?.products || []);
          const productResult = productItems[0] || {};
          imageUrl = productResult.image || productResult.imageUrl || productResult.thumbnail || productResult.product_image || "";
        }

        if (!imageUrl) {
          const response = await fetch(`/api/google-image-search?query=${encodeURIComponent(query)}&num=1`);
          if (!response.ok) return "";
          const data = await response.json();
          const result = data?.results?.[0];
          imageUrl = result?.displayUrl || result?.thumbnail || result?.url || "";
        }

        if (!imageUrl) return "";

        imageUrl = await cacheDreamShelfImage(imageUrl, item?.name || item?.product_name || query);

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
  }, [cacheDreamShelfImage]);

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
        const productItems = Array.isArray(data)
          ? data
          : (data?.items || data?.results || data?.products || []);
        const results = normalizeSearchItems(productItems, query);
        if (results.length) {
          const cachedResults = await Promise.all(results.map(async item => ({
            ...item,
            image: await cacheDreamShelfImage(item.image, item.name),
          })));
          if (requestId !== searchRequestIdRef.current) return;
          setSearchResults(cachedResults);
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
  }, [buildManualSearchItem, cacheDreamShelfImage, normalizeSearchItems]);

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
    const visibleItems = items
      .filter(item => item?.image && !isDreamShelfCachedImageUrl(item.image) && !cachedImageUrlsRef.current[item.image])
      .slice(0, 8);
    if (!visibleItems.length) return undefined;

    let cancelled = false;
    Promise.all(
      visibleItems.map(item =>
        cacheDreamShelfImage(item.image, item.name).then(stableImageUrl => ({ item, stableImageUrl }))
      )
    ).then(results => {
      if (cancelled) return;
      const updates = {};
      for (const { item, stableImageUrl } of results) {
        if (stableImageUrl && stableImageUrl !== item.image) {
          updates[getDreamShelfImageKey(item)] = stableImageUrl;
        }
      }
      if (Object.keys(updates).length === 0) return;
      setItemImages(prev => {
        const next = { ...prev, ...updates };
        itemImagesRef.current = next;
        return next;
      });
    });

    return () => { cancelled = true; };
  }, [cacheDreamShelfImage, items]);

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

    return undefined;
  }, [searchQuery]);

  const handleCategoryClick = (cat) => {
    if (activeCategory?.id === cat.id) {
      setActiveCategory(null);
      setActiveSubFilter("all");
      if (activeWorld) {
        loadWorld(activeWorld);
      } else {
        categoryLoadIdRef.current += 1;
        setItems(getAllCuratedItemsShuffled());
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
      const imageUrl = itemImages[getDreamShelfImageKey(item)] || fallbackImage || "";
      const stableImageUrl = await cacheDreamShelfImage(imageUrl, item.name);
      onAddToSomeday?.({ title: item.name, imageUrl: stableImageUrl, emoji: item.emoji || "✨", type: "dreamshelf", categoryId: "buy", notes: `${item.brand} · ${item.priceRange || ""}` });
    }
  }, [cacheDreamShelfImage, itemImages, onAddToSomeday, savedIds]);

  const handleCommunitySomeday = useCallback(async (payload) => {
    const stableImageUrl = await cacheDreamShelfImage(payload?.imageUrl || "", payload?.title || "dream-item");
    onAddToSomeday?.({ ...payload, imageUrl: stableImageUrl });
  }, [cacheDreamShelfImage, onAddToSomeday]);

  const handleMilestone = useCallback((item) => {
    onAddEvent?.({ title: `🎯 Get my ${item.name}`, notes: `${item.brand} · ${item.priceRange || ""} · Someday milestone`, category: "milestone" });
  }, [onAddEvent]);

  const handleShareSubmit = async (draft) => {
    const stableImageUrl = await cacheDreamShelfImage(draft.image || "", draft.name || "dream-item");
    const payload = {
      user_id: currentUserId,
      product_name: draft.name.trim(),
      product_brand: draft.brand.trim() || null,
      product_image: stableImageUrl || null,
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

  const activeWorldCategories = useMemo(() => activeWorld
    ? CATEGORIES.filter(cat => activeWorld.categoryIds.includes(cat.id))
    : [],
  [activeWorld]);
  const subFilters = useMemo(() => SUB_FILTERS[activeCategory?.id] || [], [activeCategory?.id]);
  const featured = featuredPost;
  const featuredImage = featured
    ? (featured.product_image || itemImages[getDreamShelfImageKey(featured)] || "")
    : "";
  const featuredSaved = featured ? savedIds.has(featured.id) : false;
  const selectedItemWithImage = useMemo(() => selectedItem
    ? {
        ...selectedItem,
        image: selectedItem.preferResolvedImage
          ? (itemImages[getDreamShelfImageKey(selectedItem)] || cachedImageUrls[selectedItem.image] || (isDreamShelfWeakImageUrl(selectedItem.image) ? "" : selectedItem.image) || "")
          : (cachedImageUrls[selectedItem.image] || selectedItem.image || itemImages[getDreamShelfImageKey(selectedItem)] || "")
      }
    : null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [selectedItem, itemImages, cachedImageUrls]);

  const categoryItemsWithImages = useMemo(() => items.map(item => ({
    ...item,
    image: item.preferResolvedImage
      ? (itemImages[getDreamShelfImageKey(item)] || cachedImageUrls[item.image] || (isDreamShelfWeakImageUrl(item.image) ? "" : item.image) || "")
      : (cachedImageUrls[item.image] || item.image || itemImages[getDreamShelfImageKey(item)] || ""),
  })), [items, itemImages, cachedImageUrls]);

  const categoryItemPairs = useMemo(() => Array.from(
    { length: Math.ceil(categoryItemsWithImages.length / 2) },
    (_, index) => categoryItemsWithImages.slice(index * 2, index * 2 + 2)
  ), [categoryItemsWithImages]);

  const communityPostPairs = useMemo(() => Array.from(
    { length: Math.ceil(communityPosts.length / 2) },
    (_, index) => communityPosts.slice(index * 2, index * 2 + 2)
  ), [communityPosts]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-['DM_Sans']" style={{ background: dm ? NAVY_DEEP : OAT, color: dm ? LINEN : CHAR }}>
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
              Every life is built twice—first in thought.
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
            background: dm ? NAVY_SURFACE : LINEN,
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
              style={{ background: dm ? NAVY_DEEP : OAT, borderColor: dm ? "rgba(250,246,240,0.10)" : STONE_LIGHT, color: dm ? LINEN : CHAR }}
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
                    ? (itemImages[getDreamShelfImageKey(item)] || cachedImageUrls[item.image] || (isDreamShelfWeakImageUrl(item.image) ? "" : item.image) || "")
                    : (cachedImageUrls[item.image] || item.image || itemImages[getDreamShelfImageKey(item)] || "")
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
                  background: activeWorld?.id === world.id ? (dm ? NAVY_SURFACE : LINEN) : (dm ? "rgba(15,25,41,0.60)" : "rgba(250,246,240,0.72)"),
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
                    ? (dm ? NAVY_SURFACE : LINEN)
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
          background: dm ? NAVY_SURFACE : LINEN,
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
              <div key={i} className="h-80 animate-pulse border" style={{ borderRadius: '16px', background: dm ? NAVY_SURFACE : OAT, borderColor: dm ? "rgba(250,246,240,0.08)" : STONE_LIGHT }} />
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
                      style={{ background: dm ? NAVY_SURFACE : LINEN, borderColor: dm ? "rgba(250,246,240,0.09)" : STONE_LIGHT, borderRadius: '16px', boxShadow: dm ? '0 4px 20px rgba(0,0,0,0.16)' : '0 2px 12px rgba(42,36,32,0.06)' }}
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
                        <div className="h-52 flex items-center justify-center" style={{ background: dm ? NAVY_DEEP : OAT }}>
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
