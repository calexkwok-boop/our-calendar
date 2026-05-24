const RAW_DESTINATION_IMAGE_OVERRIDES = {
  'amalfi-coast': 'https://www.royalcaribbean.com/media-assets/pmc/content/dam/shore-x/naples-nap/np07-sorrento-and-the-amalfi-drive/stock-photo-view-of-positano-village-along-amalfi-coast-in-italy-at-dusk-1157705677.jpg?w=1440',
  amsterdam: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/KeizersgrachtReguliersgrachtAmsterdam.jpg/1280px-KeizersgrachtReguliersgrachtAmsterdam.jpg',
  'anse-source-d': 'https://worlds50beaches.com/assets/images/beaches-2026/242.webp',
  'anse-source-d-argent': 'https://worlds50beaches.com/assets/images/beaches-2026/242.webp',
  'banff-national-park': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Moraine_Lake_17092005.jpg/960px-Moraine_Lake_17092005.jpg',
  'ba-na-hills': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Ba_Na_Hills_Golden_Bridge_Da_Nang_Vietnam.jpg/1280px-Ba_Na_Hills_Golden_Bridge_Da_Nang_Vietnam.jpg',
  'bana-hills': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Ba_Na_Hills_Golden_Bridge_Da_Nang_Vietnam.jpg/1280px-Ba_Na_Hills_Golden_Bridge_Da_Nang_Vietnam.jpg',
  bruges: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Br%C3%BCgge_Blick_vom_Belfried_4.jpg/960px-Br%C3%BCgge_Blick_vom_Belfried_4.jpg',
  'cape-town': 'https://s3.amazonaws.com/cdn.micato.com/wp-content/uploads/2018/09/07232001/cape-town-1-2-1110x700.jpg',
  'costa-rica': 'https://www.thesmoothescape.com/wp-content/uploads/2020/11/Costa-Rica-featured-2a.jpg',
  dolomites: 'https://cdn.britannica.com/00/188300-050-972ACBFB/Dolomites-Italian-Alps.jpg?w=300',
  'fly-geyser': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Fly_geyser.jpg/960px-Fly_geyser.jpg',
  'grand-canyon-south-rim': 'https://www.grandcanyon.net/images/uploads/ZH1K2WLE.jpg',
  'ha-long-bay': 'https://adventure.com/wp-content/uploads/2017/02/iStock-149483875-Photo-credit-Pirjek-iStock-1920x1080.jpg',
  iceland: 'https://images.travelandleisureasia.com/wp-content/uploads/sites/2/2024/02/15094131/kirkjufell-1.jpeg?tr=w-1366,f-jpg,pr-true',
  kilimanjaro: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Kilimanjaro_from_Amboseli.jpg/960px-Kilimanjaro_from_Amboseli.jpg',
  kyoto: 'https://cdn.britannica.com/43/20243-004-813A36D1/levels-pagoda-Yasaka-Shrine-Kyoto-skyline-Japan.jpg?w=300',
  'kyoto-in-april': 'https://cdn.britannica.com/43/20243-004-813A36D1/levels-pagoda-Yasaka-Shrine-Kyoto-skyline-Japan.jpg?w=300',
  'kyoto-in-cherry-blossom-season': 'https://cdn.britannica.com/43/20243-004-813A36D1/levels-pagoda-Yasaka-Shrine-Kyoto-skyline-Japan.jpg?w=300',
  'kowloon-bay': 'https://miro.medium.com/v2/resize:fit:4800/format:webp/0*CeLENn-Ie0--Sdwh',
  maldives: 'https://afar.brightspotcdn.com/dims4/default/0c01054/2147483647/strip/true/crop/3000x1592+0+323/resize/2880x1528!/format/webp/quality/90/?url=https%3A%2F%2Fk3-prod-afar-media.s3.us-west-2.amazonaws.com%2Fbrightspot%2Fb2%2Ff4%2F9a1ebe3f427f8e5eb937f8df8998%2Ftravelguides-maldives-videomediastudioeurope-shutterstock.jpg',
  'the-maldives': 'https://afar.brightspotcdn.com/dims4/default/0c01054/2147483647/strip/true/crop/3000x1592+0+323/resize/2880x1528!/format/webp/quality/90/?url=https%3A%2F%2Fk3-prod-afar-media.s3.us-west-2.amazonaws.com%2Fbrightspot%2Fb2%2Ff4%2F9a1ebe3f427f8e5eb937f8df8998%2Ftravelguides-maldives-videomediastudioeurope-shutterstock.jpg',
  moab: 'https://lirp.cdn-website.com/8237dfbc/dms3rep/multi/opt/moab-delicate-arch-sunset-1920w.jpg',
  orlando: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Orlando%2C_Florida_%28cropped%29.jpg/960px-Orlando%2C_Florida_%28cropped%29.jpg',
  'paro-taktsang': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Paro_Taktsang%2C_Bhutan_%28edited%29.jpg/1280px-Paro_Taktsang%2C_Bhutan_%28edited%29.jpg',
  paris: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/960px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg',
  patagonia: 'https://www.travelandleisure.com/thmb/Q8I739ao927A5q5_tVwpfCPBwXU=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/paine-massif-patagonia-chile-PATAGONIA1216-31ef4c38977c4e71bb898476ecbb5180.jpg',
  positano: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Positano_Sunset.JPG/500px-Positano_Sunset.JPG',
  prague: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Prague_%286365119737%29.jpg/960px-Prague_%286365119737%29.jpg',
  reykjavik: 'https://www.reykjavikrentacar.is/media/1/48-hours-reykjavik-1-1.png',
  'san-diego': 'https://cms.inspirato.com/ImageGen.ashx?image=%2fmedia%2f5684439%2fSanDiego_Dest_Calita_Beach.jpg&width=1052.9999256134033',
  santorini: 'https://www.wendyperrin.com/wp-content/uploads/2018/03/Santorini-Greece-view-shutterstock_387166810.jpg',
  'the-amazon': 'https://onetreeplanted.org/cdn/shop/files/Amazon-Rainforests-Amazonia-South-America.jpg?v=1739422746',
  'tokyo-disneyland': 'https://commons.wikimedia.org/wiki/Special:FilePath/File:Tokyo_Disneyland_Cinderella_Castle_2023-07-02.jpg',
  disneyland: 'https://commons.wikimedia.org/wiki/Special:FilePath/File:Disneyland%20park%20-%20Anaheim%20Los%20Angeles%20California%20USA%20%289894308516%29.jpg',
  'disneyland-park': 'https://commons.wikimedia.org/wiki/Special:FilePath/File:Disneyland%20park%20-%20Anaheim%20Los%20Angeles%20California%20USA%20%289894308516%29.jpg',
  'disneyland-anaheim-california': 'https://commons.wikimedia.org/wiki/Special:FilePath/File:Disneyland%20park%20-%20Anaheim%20Los%20Angeles%20California%20USA%20%289894308516%29.jpg',
  'anaheim-california': 'https://commons.wikimedia.org/wiki/Special:FilePath/File:Disneyland%20park%20-%20Anaheim%20Los%20Angeles%20California%20USA%20%289894308516%29.jpg',
  'marble-mountains': 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
  'the-marble-mountains': 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
  trolltunga: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Trolltunga_2017.jpg/960px-Trolltunga_2017.jpg',
  tuscany: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Barga_Alps.jpg/500px-Barga_Alps.jpg',
  'ubud-bali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Kings_Tombs%2C_Gunung_Kawi%2C_Bali_1631.jpg/500px-Kings_Tombs%2C_Gunung_Kawi%2C_Bali_1631.jpg',
  vancouver: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Vancouver_harbour_skyline_%2844723845851%29.jpg/960px-Vancouver_harbour_skyline_%2844723845851%29.jpg',
  venice: 'https://www.travelawaits.com/wp-content/uploads/2021/04/75e2e9ad784f285110dbf63c0970275e2e9-scaled.jpg?zoom=2&resize=800%2C800',
  'washington-d-c': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/12-07-13-washington-by-RalfR-08.jpg/330px-12-07-13-washington-by-RalfR-08.jpg',
  zhangjiajie: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Tianmen_38330-Zhangjiajie_%2849047525877%29.jpg/960px-Tianmen_38330-Zhangjiajie_%2849047525877%29.jpg',
  'new-york-city': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg/960px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg',
  tokyo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg/960px-Skyscrapers_of_Shinjuku_2009_January.jpg',
  london: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/London_Skyline_%28125508655%29.jpeg/960px-London_Skyline_%28125508655%29.jpeg',
  barcelona: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Barcelona%2C_Spain_%2851225532527%29.jpg/330px-Barcelona%2C_Spain_%2851225532527%29.jpg',
  'mexico-city': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/MX_MM_PANOR%C3%81MICAS_DESFILE_Z%C3%93CALO.jpg/330px-MX_MM_PANOR%C3%81MICAS_DESFILE_Z%C3%93CALO.jpg',
  copenhagen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Nyhavn%2C_Copenhagen%2C_20220616_1930_6610.jpg/330px-Nyhavn%2C_Copenhagen%2C_20220616_1930_6610.jpg',
  istanbul: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg/960px-Historical_peninsula_and_modern_skyline_of_Istanbul.jpg',
  nashville: 'https://images.trvl-media.com/place/6059741/cb3eb41f-8d23-4e52-a80b-420caa7bd8b0.jpg',
  'faroe-islands': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Faroe_Islands_%28Unsplash_eRwWGWkh0vU%29.jpg/960px-Faroe_Islands_%28Unsplash_eRwWGWkh0vU%29.jpg',
  socotra: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/%D0%92%D0%B5%D0%BB%D0%B8%D0%BA%D1%96_%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%B0_%D0%B7_%D0%90%D1%84%D1%80%D0%B8%D0%BA%D0%B8.jpg/960px-%D0%92%D0%B5%D0%BB%D0%B8%D0%BA%D1%96_%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%B0_%D0%B7_%D0%90%D1%84%D1%80%D0%B8%D0%BA%D0%B8.jpg',
  svalbard: 'https://eu-assets.simpleview-europe.com/svalbard/imageresizer/?image=%2Fdbimgs%2FGalleryimage%2810%29.jpg&action=MediaGallery',
  'lofoten-islands': 'https://www.dangerous-business.com/wp-content/uploads/2023/08/DJI_0262-1920x1438.jpg',
  cappadocia: 'https://www.thetimes.com/imageserver/image/f889eea4-2de8-423e-ac23-11132c1c5da6.jpg?strip=all&format=webp&crop=1600px%2C900px%2C0px%2C0px&resize=1328',
  bhutan: 'https://waitbutwhy.com/wp-content/uploads/2025/11/bhutan_FEATURE-1536x1152.jpeg',
  namibia: 'https://www.voyemo.com/wp-content/uploads/2020/05/Namibia-13-main.jpg',
  'raja-ampat': 'https://www.papuaexplorers.com/wp-content/uploads/2016/07/Wayag3.jpg',
  'pacific-coast-highway': 'https://media.timeout.com/images/105766941/1920/1440/image.webp',
  'route-66': 'https://roads.porsche.com/wp-content/uploads/2022/11/route-66-road-trip-straight-road-1920x1245.webp',
  'ring-road': 'https://theloverspassport.com/wp-content/uploads/2025/07/The-Ring-Road-in-Iceland.jpg',
  'the-garden-route': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Tsitsikamma_Park.JPG/500px-Tsitsikamma_Park.JPG',
  'amalfi-coast-drive': 'https://duespaghetti.com/wp-content/uploads/2023/07/1-1-1024x683.jpg',
  'the-icefields-parkway': 'https://www.travelandleisure.com/thmb/clAPBgePJldJA7iOgkI8fYFxdIA=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/TAL-icefields-parkway-canada-GLACIERHGWAY0225-f736d5daa8d64ac6abe49df5dc283823.jpg',
  'tuscany-road-trip': 'https://www.happy.rentals/admin/uploads/The-iconic-cypress-lined-road-in-Asciano-Province-of-Siena-Crete-Senesi-11041.jpg',
  'new-zealand-south-island': 'https://static.routesonline.com/images/cached/newsarticle-298184-scaled-620x0.jpg',
  'machu-picchu': 'https://lh3.googleusercontent.com/gps-cs-s/APNQkAGTEX0fTBAvsYUuqtBZQfQiab4l3IOmdNZXUnRlN3GyYkmpf_8WPNepzIBK_koBg2WcwHgxlW7kwZb_RpwePJg7pcpyIOC3Z5JIZ9xti2TylAiKXLV4aLN7ODPl5yFbRWE34_g=s1360-w1360-h1020-rw',
  'serengeti': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Serengeti_sunset-1001.jpg/500px-Serengeti_sunset-1001.jpg',
  'angkor-wat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Buddhist_monks_in_front_of_the_Angkor_Wat.jpg/500px-Buddhist_monks_in_front_of_the_Angkor_Wat.jpg',
  'bora-bora': 'https://digital.ihg.com/is/image/ihg/intercontinental-bora-bora-9636653008-2x1?size=700,0',
  'whitehaven-beach': 'https://hamiltonisland.imgix.net/hamiltonisland/media/originals/scenery-(gbr,-catseye,-whitehaven)/hill-inlet-aerial-with-whitehaven-beach.jpg?width=347&height=230&fit=crop&d=20191212112603',
  'tulum': 'https://cdn.sanity.io/images/atvntylo/production/c0ecfd1532bab076b06a10c654008364527b9d99-1080x720.webp?w=3840&q=65&fit=clip&auto=format',
  'cinque-terre': 'https://www.travelawaits.com/wp-content/uploads/2021/04/3826ad5ad0776fadbcc3d277752123826ad.jpg?w=2000',
  'kauai': 'https://www.gohawaii.com/sites/default/files/styles/curated__380x500/public/content-images/Kauai%20Region%20North%20Shore%20-%20Max%20Seigel.jpg.webp?itok=33FgXh0i',
  'phi-phi-islands': 'https://dynamic-media.tacdn.com/media/photo-o/2e/f4/54/21/caption.jpg?w=1100&h=800&s=1',
  'algarve': 'https://www.siestacampers.com/_next/image?url=https%3A%2F%2Fimages.prismic.io%2Fsiestacampers%2FaD2K0Lh8WN-LVeYu_things-to-do-in-algarve.webp%3Fauto%3Dformat%2Ccompress&w=1920&q=75',
  'queenstown': 'https://ik.imgkit.net/3vlqs5axxjf/TAW/ik-seo/uploadedImages/All_Gateways/ASPAC/Asia/Queenstown_Hero/5-Exceptional-Things-to-Do-in-Queenstown-New-Zeala.jpg?tr=w-1008%2Ch-567%2Cfo-auto',
  'everest-base-camp': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Mount_Everest_Base_Camp.jpg/960px-Mount_Everest_Base_Camp.jpg',
  'norwegian-fjords': 'https://nordicventures.com/wp-content/uploads/2019/02/The-Norwegian-Fjords.jpg',
  'the-galapagos-islands': 'https://commons.wikimedia.org/wiki/Special:FilePath/Lobo_marino_%28Zalophus_californianus_wollebaeki%29%2C_Punta_Pitt%2C_isla_de_San_Crist%C3%B3bal%2C_islas_Gal%C3%A1pagos%2C_Ecuador%2C_2015-07-24%2C_DD_11.JPG'
};

export const DESTINATION_IMAGE_OVERRIDES = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_DESTINATION_IMAGE_OVERRIDES).map(([key, value]) => [
      key,
      String(value || '').trim()
    ])
  )
);

const DESTINATION_IMAGE_KEY_ALIASES = Object.freeze({
  anaheim: 'anaheim-california',
  amazon: 'the-amazon',
  'disneyland-anaheim': 'disneyland-anaheim-california',
  'galapagos-islands': 'the-galapagos-islands',
  'icefields-parkway': 'the-icefields-parkway',
  'the-gal-pagos-islands': 'the-galapagos-islands',
  'garden-route': 'the-garden-route'
});

const resolvedDestinationImageKeyCache = new Map();

const normalizeDestinationImageKey = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const normalizeDestinationImageText = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/^(visit|see|go-to|go|stay-at|stay|explore)-+/g, '')
  .replace(/^-+|-+$/g, '');

const resolveDestinationImageKey = (value = '') => {
  const cacheKey = String(value || '');
  if (resolvedDestinationImageKeyCache.has(cacheKey)) {
    return resolvedDestinationImageKeyCache.get(cacheKey);
  }

  const key = normalizeDestinationImageKey(cacheKey);
  let resolvedKey = '';

  if (key && DESTINATION_IMAGE_OVERRIDES[key]) {
    resolvedKey = key;
  } else if (key && DESTINATION_IMAGE_KEY_ALIASES[key]) {
    resolvedKey = DESTINATION_IMAGE_KEY_ALIASES[key];
  } else if (key) {
    const articleVariant = key.startsWith('the-') ? key.slice(4) : `the-${key}`;
    if (DESTINATION_IMAGE_OVERRIDES[articleVariant]) resolvedKey = articleVariant;
  }

  resolvedDestinationImageKeyCache.set(cacheKey, resolvedKey);
  return resolvedKey;
};

export const getDestinationImageOverride = (destination = {}) => {
  const idKey = resolveDestinationImageKey(destination?.id);
  if (idKey) return DESTINATION_IMAGE_OVERRIDES[idKey];

  const nameKey = resolveDestinationImageKey(
    destination?.name
    || destination?.destination_name
    || destination?.cardTitle
    || destination?.title
    || ''
  );

  if (nameKey) return DESTINATION_IMAGE_OVERRIDES[nameKey];

  const rawName = [
    destination?.name,
    destination?.destination_name,
    destination?.cardTitle,
    destination?.title,
    destination?.text,
    destination?.label,
  ].find(Boolean) || '';
  const normalizedName = normalizeDestinationImageText(normalizeDestinationImageKey(rawName));
  if (!normalizedName) return '';

  const normalizedTokens = normalizedName.split('-').filter(Boolean);
  let bestMatch = '';
  let bestScore = 0;

  for (const [key, value] of Object.entries(DESTINATION_IMAGE_OVERRIDES)) {
    const normalizedKey = normalizeDestinationImageText(key);
    if (!normalizedKey) continue;
    if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
      const score = Math.max(normalizedKey.length, normalizedName.length) + 100;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = value;
      }
      continue;
    }

    const keyTokens = normalizedKey.split('-').filter(Boolean);
    const sharedTokenCount = normalizedTokens.filter((token) => keyTokens.includes(token)).length;
    if (sharedTokenCount >= 2) {
      const score = sharedTokenCount * 10 + keyTokens.join('-').length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = value;
      }
    }
  }

  if (bestMatch) return bestMatch;
  return '';
};
