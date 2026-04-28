export const DESTINATION_IMAGE_OVERRIDES = {
  santorini: 'https://www.wendyperrin.com/wp-content/uploads/2018/03/Santorini-Greece-view-shutterstock_387166810.jpg',
  patagonia: 'https://www.travelandleisure.com/thmb/Q8I739ao927A5q5_tVwpfCPBwXU=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/paine-massif-patagonia-chile-PATAGONIA1216-31ef4c38977c4e71bb898476ecbb5180.jpg',
  iceland: 'https://images.travelandleisureasia.com/wp-content/uploads/sites/2/2024/02/15094131/kirkjufell-1.jpeg?tr=w-1366,f-jpg,pr-true',
  'anse-source-d-argent': 'https://worlds50beaches.com/assets/images/beaches-2026/242.webp',
  'amalfi-coast': 'https://www.royalcaribbean.com/media-assets/pmc/content/dam/shore-x/naples-nap/np07-sorrento-and-the-amalfi-drive/stock-photo-view-of-positano-village-along-amalfi-coast-in-italy-at-dusk-1157705677.jpg?w=1440',
  moab: 'https://lirp.cdn-website.com/8237dfbc/dms3rep/multi/opt/moab-delicate-arch-sunset-1920w.jpg',
  'the-amazon': 'https://onetreeplanted.org/cdn/shop/files/Amazon-Rainforests-Amazonia-South-America.jpg?v=1739422746',
  'costa-rica': 'https://www.thesmoothescape.com/wp-content/uploads/2020/11/Costa-Rica-featured-2a.jpg',
  'san-diego': 'https://cms.inspirato.com/ImageGen.ashx?image=%2fmedia%2f5684439%2fSanDiego_Dest_Calita_Beach.jpg&width=1052.9999256134033',
};

export const getDestinationImageOverride = (destination = {}) => {
  const id = String(destination?.id || '').trim();
  if (id && DESTINATION_IMAGE_OVERRIDES[id]) return String(DESTINATION_IMAGE_OVERRIDES[id]).trim();

  const nameKey = String(
    destination?.name
    || destination?.destination_name
    || destination?.cardTitle
    || destination?.title
    || ''
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (nameKey && DESTINATION_IMAGE_OVERRIDES[nameKey]) return String(DESTINATION_IMAGE_OVERRIDES[nameKey]).trim();
  return '';
};
