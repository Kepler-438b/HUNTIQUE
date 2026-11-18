import { realRecords } from "./data/realRecords.js";
import { sampleRecords } from "./data/sampleRecords.js";

export const baseRecords = realRecords;

export const PRICE_TYPE_LABEL = {
  hammer: "Auction, hammer price (no premium)",
  with_premium: "Auction, incl. buyer's premium",
  marketplace: "Agreed sale price",
  asking: "Asking price (not a sale)",
  starting: "Starting price (no sale / no bid yet)",
  current_bid: "Current highest bid (auction running)",
};

export const STATUS_LABEL = {
  sold: "Sold",
  active: "Current auction",
  unsold: "Unsold",
};

export const STATUS_COLOR = {
  sold: "#2f62b5",
  active: "#e5252a",
  unsold: "#9a9a9a",
};

export const CATEGORY_LABEL = {
  furniture: "Furniture & carpets",
  tableware: "Porcelain, glass, ceramics & silver",
  fine_art: "Paintings, graphics & sculpture",
  decorative: "Decorative & applied art",
};

export const VERIFICATION_LABEL = {
  verified: "Verified",
  documented: "Documented",
  reported: "Reported",
};

export const VERIFICATION_COLOR = {
  verified: "#1f7a4d",
  documented: "#2f62b5",
  reported: "#9a9a9a",
};

export const SUBCATEGORIES = {
  furniture: ["furniture", "carpet", "chair", "armchair", "table", "chest of drawers", "cabinet"],
  tableware: ["porcelain", "glass", "glass & ceramics", "ceramics", "silver"],
  fine_art: ["painting", "drawing & graphics", "sculpture"],
  decorative: ["decorative art"],
};

// Status of a record: "sold" | "active" | "unsold"
export function statusOf(r) {
  if (r.status === "active" || r.price_type === "asking") return "active";
  if (r.status === "unsold") return "unsold";
  return "sold";
}

const yearOf = (r) => (r.sale_date ? Number(String(r.sale_date).slice(0, 4)) : null);

export function formatCzk(n) {
  return new Intl.NumberFormat("cs-CZ").format(Math.round(n)) + " Kč";
}

export function filterRecords(records, f) {
  return records.filter((r) => {
    if (f.status && f.status !== "all" && statusOf(r) !== f.status) return false;
    if (f.category && r.category !== f.category) return false;
    if (f.subcategory && r.subcategory !== f.subcategory) return false;
    if (f.maker && r.maker !== f.maker) return false;
    if (f.yearFrom && !(yearOf(r) >= f.yearFrom)) return false;
    if (f.yearTo && !(yearOf(r) <= f.yearTo)) return false;
    if (f.priceMin && r.price_czk < f.priceMin) return false;
    if (f.priceMax && r.price_czk > f.priceMax) return false;
    if (f.priceTypes && !f.priceTypes.includes(r.price_type)) return false;
    if (f.levels && !f.levels.includes(r.verification_level)) return false;
    if (f.dataset === "real" && r.is_sample) return false;
    if (f.dataset === "sample" && !r.is_sample) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      const hay = `${r.title} ${r.maker} ${r.period} ${r.city} ${r.subcategory} ${r.source_name || ""} ${r.description || ""} ${r.verification_signature || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export const MIN_RECORDS_FOR_TREND = 5;

// Trend for a group of similar items (same subcategory + maker).
// Only real sales count: asking/starting prices, current bids, unsold lots and "reported" records are left out.
export function computeTrend(records, subcategory, maker) {
  const group = records.filter(
    (r) =>
      r.subcategory === subcategory &&
      r.maker === maker &&
      statusOf(r) === "sold" &&
      r.sale_date &&
      !["asking", "starting", "current_bid"].includes(r.price_type) &&
      r.verification_level !== "reported"
  );
  const byYear = {};
  for (const r of group) {
    const y = Number(r.sale_date.slice(0, 4));
    (byYear[y] ||= []).push(r.price_czk);
  }
  const years = Object.keys(byYear).map(Number).sort();
  const points = years.map((y) => ({
    year: y,
    median: Math.round(median(byYear[y])),
    min: Math.min(...byYear[y]),
    max: Math.max(...byYear[y]),
    count: byYear[y].length,
  }));
  return { group, points, enough: group.length >= MIN_RECORDS_FOR_TREND };
}
