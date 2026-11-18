// Real realised prices copied by hand from public auction result pages.
// Each record keeps its source URL. Lot photos are NOT copied (copyright) - we link to the source instead.

const HEJTMANEK = {
  source_id: "src_hejtmanek",
  source_name: "Arthouse Hejtmánek (online auction Glass and Porcelain)",
  source_type: "auction_house",
  city: "Praha 6",
  lat: 50.104469,
  lng: 14.407579,
  location_precision: "auction_house_address", // Goetheho 17/2, Praha 6 (OSM, reverse-verified)
  sale_date: "2025-09-24",
};

const HEJTMANEK_HIGHLIGHTS_URL =
  "https://www.arthousehejtmanek.cz/en/exhibitions-and-auctions/online-aukce-glas-und-porzellan-55";
const HEJTMANEK_LIST_URL =
  "https://www.arthousehejtmanek.cz/en/exhibitions-and-auctions/online-aukce-glass-and-porcelain-55/list-of-works-of-art/";

// Prices shown as "price with premium" on the auction highlights page
const withPremium = [
  { title: "Baroque Humpen", subcategory: "glass", maker: "Unknown (Bohemia)", period: "Baroque", price_czk: 248000, hammer_price_czk: 200000 },
  { title: "Goblet, Biedermeier period", subcategory: "glass", maker: "Unknown (Bohemia)", period: "Biedermeier", price_czk: 198400 },
  { title: "Mannerist shell cup", subcategory: "glass", maker: "Unknown", period: "Renaissance / Mannerism", price_czk: 198400, hammer_price_czk: 160000 },
  { title: "Baroque heraldic glass", subcategory: "glass", maker: "Unknown (Bohemia)", period: "Baroque", price_czk: 161200 },
  { title: "Biedermeier glass with a portrait", subcategory: "glass", maker: "Karl Pfohl", period: "Biedermeier", price_czk: 161200 },
  { title: "Biedermeier beaker with playing cards", subcategory: "glass", maker: "Anton Kothgasser", period: "Biedermeier", price_czk: 136400 },
  { title: "Pair of Biedermeier glasses", subcategory: "glass", maker: "Friedrich Egermann", period: "Biedermeier", price_czk: 136400 },
  { title: "Monkey with infants (porcelain figure)", subcategory: "porcelain", maker: "Meissen", period: "Baroque", price_czk: 124000, note: "Model by Johann Gottlieb Kirchner" },
  { title: "Centrepiece", subcategory: "porcelain", maker: "Meissen", period: "Unknown", price_czk: 99200 },
  { title: "Centrepiece", subcategory: "porcelain", maker: "Meissen", period: "Unknown", price_czk: 93000 },
].map((r, i) => ({
  ...HEJTMANEK,
  ...r,
  id: `real_hej_p${i + 1}`,
  category: "tableware",
  price_type: "with_premium",
  source_url: HEJTMANEK_HIGHLIGHTS_URL,
}));

// Prices from the list of works. The page does not say whether premium is included.
// The Humpen appears in both lists: 200,000 here vs 248,000 "with premium" -> these are hammer prices.
// Lots that already appear above (Humpen, shell cup) are left out to avoid duplicates.
const hammer = [
  { lot: 1, title: "Glass bowl", period: "Unknown", price_czk: 7000 },
  { lot: 2, title: "Bottle with a globular body", period: "Unknown", price_czk: 9000 },
  { lot: 3, title: "Wine goblet (Berkemeyer)", period: "Medieval", price_czk: 4500 },
  { lot: 4, title: "Wine goblet (Berkemeyer)", period: "Medieval", price_czk: 7500 },
  { lot: 5, title: "Wine goblet (Berkemeyer)", period: "Medieval", price_czk: 4000 },
  { lot: 6, title: "Stained glass medallion with a sacred motif", period: "Unknown", price_czk: 19000 },
  { lot: 8, title: "Painted glass plate", period: "Unknown", price_czk: 36000 },
  { lot: 10, title: "Baroque lidded goblet", period: "Baroque", price_czk: 14000 },
  { lot: 11, title: "Baroque glass with figural motifs", period: "Baroque", price_czk: 13000 },
  { lot: 12, title: "Baroque glass with a portrait of Leopold I", period: "Baroque", price_czk: 26000 },
].map((r) => ({
  ...HEJTMANEK,
  ...r,
  id: `real_hej_l${r.lot}`,
  category: "tableware",
  subcategory: "glass",
  maker: "Unknown",
  price_type: "hammer",
  note: "Premium not stated on page; treated as hammer price (same lot list shows Humpen at 200,000 vs 248,000 with premium).",
  source_url: HEJTMANEK_LIST_URL,
}));

const zezula = [
  {
    id: "real_zez_1",
    title: "Console table with mirror, Carlo Bugatti workshop",
    category: "furniture",
    subcategory: "table",
    maker: "Carlo Bugatti",
    period: "Art Nouveau",
    price_czk: 1000000,
    price_type: "hammer",
    note: "Buyer pays an extra 18 % premium (about 1,180,000 CZK in total). Date = date of the news report.",
    sale_date: "2016-04-09",
    source_id: "src_zezula",
    source_name: "Aukční dům Zezula, Brno (via ČT24 report)",
    source_type: "auction_house",
    source_url: "https://ct24.ceskatelevize.cz/clanek/kultura/stolek-za-milion-v-brne-vydrazili-exkluzivniho-bugattiho-116910",
    city: "Brno",
    lat: 49.193074,
    lng: 16.573457,
    location_precision: "auction_house_address", // Hlinky 59/142c, Brno (OSM, reverse-verified)
  },
];

function createSignature(id, price, date, source) {
  let hash = 0;
  const str = `HTQ_REAL_${id}_${price}_${date}_${source}`;
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  return `HTQ-VF-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(0, 4)}`;
}

export const realRecords = [...withPremium, ...hammer, ...zezula].map((r) => ({
  ...r,
  is_sample: false,
  verification_level: "documented",
  currency: "CZK",
  original_amount: r.price_czk,
  verification_signature: createSignature(r.id, r.price_czk, r.sale_date, r.source_name),
}));
