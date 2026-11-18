// Collects real Czech antique auction results and current lots from Livebid.cz.
//
// Source & permission: Livebid.cz is the main Czech online auction platform (160+ Czech
// auction houses). Its public JSON API (https://livebid.cz/apiv2) is the one its own website
// uses; robots.txt only disallows /admin, /auth/ and /profile. We request politely
// (1 request / 1.1 s, honest User-Agent, local cache so nothing is fetched twice).
// Aukro.cz is NOT used: its robots.txt disallows Anthropic's crawler (User-agent: ClaudeBot).
//
// Output: data/livebid_dataset.json (reproducible snapshot, committed) + data/collection_report.json
// Usage:  node scripts/collect_livebid.mjs [--sold 800] [--current 200] [--refresh]
//
// Rules (data authenticity):
//   - only Czech auction houses (client.address.country === "CZ")
//   - only antique categories (allowlist below); clocks/watches, coins, stamps, books, wine, weapons excluded
//   - status from the platform: sold = finished with finalPrice; unsold = finished without result;
//     active = not finished yet. No fallback prices, no invented dates, no random locations.
//   - EUR prices converted with the official Czech National Bank (ČNB) rate of the auction date;
//     the original amount and currency are kept.
//   - location = city of the auction house (geocoded once via OpenStreetMap Nominatim, cached)
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const argNum = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const TARGET_SOLD = argNum("--sold", 800);
const TARGET_CURRENT = argNum("--current", 200);
const REFRESH = args.includes("--refresh");
const MAX_SOLD_PER_AUCTION = argNum("--per-auction", 14);
const MAX_UNSOLD_PER_AUCTION = 4;
const MAX_AUCTIONS_PER_MONTH = 3; // spread completed sales over time instead of taking only the newest auctions
const MAX_CURRENT_PER_AUCTION = 40;
const MAX_PAGES_PER_AUCTION = 40; // 10 lots per page
const OLDEST_AUCTION = "2023-01-01";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const RAW = path.join(DATA, "raw", "livebid");
fs.mkdirSync(RAW, { recursive: true });

const UA = "HUNTIQUE-student-prototype/0.1 (non-commercial university CI project)";
const API = "https://livebid.cz/apiv2";
const NOW = new Date();
const DELAY_MS = 1100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let requests = 0;

async function getJson(url, { cacheKey, retries = 3 } = {}) {
  const cacheFile = cacheKey ? path.join(RAW, cacheKey.replace(/[^a-z0-9_.-]/gi, "_") + ".json") : null;
  if (cacheFile && !REFRESH && fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, "utf8"));
  for (let attempt = 1; attempt <= retries; attempt++) {
    await sleep(DELAY_MS);
    requests++;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (cacheFile) fs.writeFileSync(cacheFile, JSON.stringify(json));
      return json;
    } catch (e) {
      console.warn(`  retry ${attempt}/${retries} ${url}: ${e.message}`);
      await sleep(DELAY_MS * attempt * 3);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Category allowlist (matched on Livebid category id + name, diacritics removed)
// ---------------------------------------------------------------------------
const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const EXCLUDE = /hodin|clock|watch|numism|minc|coin|filatel|znamk|bankov|knih|book|antikvar|vino|wine|zbran|weapon|militar|zbroj|armor|sperk|jewel|bizut|foto|photo|hrack|toy|mapy|map |plakat|poster|pohled|postcard|komiks|lp |desk|vinyl|charit|sberatel/;
const RULES = [
  [/nabyt|furniture|koberc|carpet/, "furniture", (t) => (/koberc|carpet/.test(t) ? "carpet" : "furniture")],
  [/(sklo|glass).*(keramik|ceramic)|(keramik|ceramic).*(sklo|glass)/, "tableware", () => "glass & ceramics"],
  [/porcelan|porcelain/, "tableware", () => "porcelain"],
  [/sklo|glass/, "tableware", () => "glass"],
  [/keramik|ceramic|fajans|majolik/, "tableware", () => "ceramics"],
  [/stribr|silver/, "tableware", () => "silver"],
  [/obraz|malb|malir|painting|olej/, "fine_art", () => "painting"],
  [/grafik|kresb|drawing|graphic|akvarel/, "fine_art", () => "drawing & graphics"],
  [/plastik|socha|sochy|sculpt|skulpt|bronz/, "fine_art", () => "sculpture"],
  [/uzit|applied|dekor|starozit|antique|design|orient|asij|asia|ikon|lustr|svitid|cin|mosaz|kov|textil|devotional|sakral|lidov|folk/, "decorative", () => "decorative art"],
];
function classify(item) {
  const t = norm(`${item.categoryId || ""} ${item.categoryName || ""}`);
  if (EXCLUDE.test(t) || /hodin|hodink|clock|watch/i.test(norm(item.itemName || ""))) return null;
  for (const [re, category, sub] of RULES) if (re.test(t)) return { category, subcategory: sub(t) };
  return null;
}

// ---------------------------------------------------------------------------
// ČNB exchange rates (official daily fixing), cached per year
// ---------------------------------------------------------------------------
const rateCache = {};
async function eurRates(year) {
  if (rateCache[year]) return rateCache[year];
  const file = path.join(DATA, "raw", `cnb_${year}.txt`);
  let txt;
  if (fs.existsSync(file) && !REFRESH) txt = fs.readFileSync(file, "utf8");
  else {
    await sleep(500);
    const res = await fetch(
      `https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/year.txt?year=${year}`,
      { headers: { "User-Agent": UA } }
    );
    txt = await res.text();
    fs.writeFileSync(file, txt);
  }
  const lines = txt.trim().split("\n");
  const header = lines[0].split("|");
  const col = header.findIndex((h) => h.trim() === "1 EUR");
  const map = {};
  for (const l of lines.slice(1)) {
    const parts = l.split("|");
    const [d, m, y] = parts[0].split(".");
    map[`${y}-${m}-${d}`] = Number(parts[col]);
  }
  return (rateCache[year] = map);
}
async function eurToCzk(dateIso) {
  const d = new Date(dateIso + "T12:00:00Z");
  for (let i = 0; i < 10; i++) {
    const key = d.toISOString().slice(0, 10);
    const map = await eurRates(d.getUTCFullYear());
    if (map[key]) return { rate: map[key], rateDate: key };
    d.setUTCDate(d.getUTCDate() - 1); // weekends/holidays: last published rate
  }
  return null;
}

// ---------------------------------------------------------------------------
// Geocoding of auction-house cities (OpenStreetMap Nominatim, 1 req/s, cached)
// ---------------------------------------------------------------------------
const GEO_FILE = path.join(DATA, "geocode_cache.json");
// Street-address locations verified by scripts/geocode_houses.mjs (preferred over city geocoding)
const HOUSE_FILE = path.join(DATA, "house_locations.json");
const HOUSE_LOCATIONS = fs.existsSync(HOUSE_FILE) ? JSON.parse(fs.readFileSync(HOUSE_FILE, "utf8")) : {};
const geoCache = fs.existsSync(GEO_FILE) ? JSON.parse(fs.readFileSync(GEO_FILE, "utf8")) : {};
function cleanCity(city = "") {
  let c = city.trim();
  if (c.includes(",")) c = c.split(",").pop().trim(); // "Betlémské nám. 8, Praha 1" -> "Praha 1"
  c = c.replace(/^okres\s+/i, "");
  return c;
}
async function geocode(address) {
  const city = cleanCity(address?.city || "");
  const postcode = (String(address?.postcode || "").replace(/\s+/g, "").match(/\d{5}/) || [""])[0];
  if (!city && !postcode) return null;
  const key = `${postcode}|${city}`;
  if (key in geoCache) return geoCache[key];
  const cityOnly = city.replace(/\s*-\s*.*$/, "");
  const queries = [[postcode, cityOnly, "Czechia"], [cityOnly, "Czechia"], [postcode, "Czechia"]]
    .map((parts) => parts.filter(Boolean).join(" "))
    .filter((q, i, all) => q !== "Czechia" && all.indexOf(q) === i);
  let result = null;
  for (const q of queries) {
    await sleep(1100);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cz&q=${encodeURIComponent(q)}`, {
        headers: { "User-Agent": UA },
      });
      const arr = await res.json();
      if (arr[0]) {
        result = { lat: Number(arr[0].lat), lng: Number(arr[0].lon), label: cityOnly || arr[0].display_name.split(",")[0], query: q };
        break;
      }
    } catch (e) {
      console.warn(`  geocode failed for ${q}: ${e.message}`);
    }
  }
  geoCache[key] = result;
  fs.writeFileSync(GEO_FILE, JSON.stringify(geoCache, null, 2));
  return result;
}

// ---------------------------------------------------------------------------
// Helpers for record fields
// ---------------------------------------------------------------------------
function makerOf(item) {
  const a = item.author;
  if (!a) return "Unattributed";
  const name = a.pseudonym && a.isPseudonymMain ? a.pseudonym : [a.firstName, a.lastName].filter(Boolean).join(" ");
  return name || "Unattributed";
}
function periodOf(item) {
  const text = `${item.itemName || ""} ${item.shortDescription || ""}`;
  const m = text.match(/(\d{1,2})\.\s?(?:pol\.\s?)?(?:stol\.|století)/i);
  if (m) return `${m[1]}th century`;
  const a = item.author;
  if (a?.birthYear) return `${a.birthYear}–${a.deathYear || ""}`.replace(/–$/, "–");
  const y = text.match(/\b(1[5-9]\d\d)\b/);
  return y ? `c. ${y[1]}` : "Unknown";
}
const trim = (s, n) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s || null);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function listAuctions() {
  const all = [];
  for (let page = 1; page < 200; page++) {
    const j = await getJson(`${API}/auctions?page=${page}&count=50`, { cacheKey: `auctions_p${page}` });
    const list = j?.data?.auctions || [];
    all.push(...list);
    const oldest = list.at(-1)?.auctionDate || "";
    if (!list.length || j.meta?.isLast || oldest < OLDEST_AUCTION) break;
  }
  return all;
}

// One cheap request: how many lots of an auction fall into the antique allowlist?
async function relevantLotCount(auction) {
  const cats = await getJson(`${API}/auctions/${encodeURIComponent(auction.link)}/categories`, { cacheKey: `cats_${auction.link}` });
  if (!Array.isArray(cats)) return 0;
  return cats.reduce((n, c) => n + (classify({ categoryId: c.id, categoryName: c.name, itemName: "" }) ? Number(c.itemsCount) || 0 : 0), 0);
}

async function auctionItems(auction, stopWhen) {
  const items = [];
  for (let page = 1; page <= MAX_PAGES_PER_AUCTION; page++) {
    const j = await getJson(`${API}/items?page=${page}&count=10&filters=auctionLink_${encodeURIComponent(auction.link)}`, {
      cacheKey: `items_${auction.link}_p${page}`,
    });
    const list = j?.data?.items || [];
    items.push(...list);
    if (!list.length || j.meta?.isLast || stopWhen(items)) break;
  }
  return items;
}

async function toRecord(item, auction, status, cls) {
  const currency = item.currency || auction.currency || "CZK";
  const saleDate = (auction.auctionDate || item.limitingEnd || item.limitingStart || "").slice(0, 10) || null;
  let amount;
  let priceType;
  if (status === "sold") {
    amount = Number(item.finalPrice);
    priceType = "hammer";
  } else if (status === "active") {
    const hasBid = Number(item.counterLimits) > 0 && Number(item.actualPrice) > 0;
    amount = hasBid ? Number(item.actualPrice) : Number(item.startingPrice);
    priceType = hasBid ? "current_bid" : "starting";
  } else {
    amount = Number(item.startingPrice);
    priceType = "starting";
  }
  if (!amount || amount <= 0) return null;

  let priceCzk = amount;
  let fx = null;
  if (currency === "EUR") {
    fx = await eurToCzk(saleDate && new Date(saleDate) < NOW ? saleDate : NOW.toISOString().slice(0, 10));
    if (!fx) return null;
    priceCzk = Math.round(amount * fx.rate);
  } else if (currency !== "CZK") {
    return null;
  }

  const houseLoc = HOUSE_LOCATIONS[`livebid_client_${auction.client?.clientId}`];
  const geo = houseLoc?.verified
    ? { lat: houseLoc.lat, lng: houseLoc.lng, label: cleanCity(auction.client?.address?.city || "") || houseLoc.address_used?.city, precise: true }
    : await geocode(auction.client?.address);
  return {
    id: `livebid_${item.itemId}`,
    source_id: `livebid_client_${auction.client?.clientId}`,
    source_name: auction.client?.name || item.clientName || "Livebid.cz auction house",
    source_type: "auction_house",
    source_url: `https://livebid.cz/auction/${auction.link}/detail/${item.lotn}`,
    external_lot_id: String(item.lotn),
    auction_name: auction.name || null,
    platform: "Livebid.cz",
    title: (item.itemName || "").trim(),
    description: trim((item.shortDescription || "").replace(/\s+/g, " ").trim(), 300),
    category: cls.category,
    subcategory: cls.subcategory,
    source_category: item.categoryName || item.categoryId || null,
    maker: makerOf(item),
    period: periodOf(item),
    price_czk: priceCzk,
    hammer_price_czk: status === "sold" ? priceCzk : null,
    currency,
    original_amount: amount,
    fx_rate: fx ? fx.rate : null,
    fx_rate_date: fx ? fx.rateDate : null,
    price_type: priceType,
    status,
    verification_level: "documented",
    verification_source_type: "auction",
    sale_date: saleDate,
    city: geo?.label || cleanCity(auction.client?.address?.city || "") || null,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    location_precision: geo ? (geo.precise ? "auction_house_address" : "auction_house_city") : "unknown",
    image_url: item.imageVersion != null ? `https://cdn.livebid.cz/imgs/${item.auctionId}/tn/${item.lotn}.jpg?v=${item.imageVersion}` : null,
    bids_count: Number(item.counterLimits) || 0,
    collected_at: NOW.toISOString(),
  };
}

async function main() {
  console.log(`Collecting from Livebid.cz: target ${TARGET_SOLD} sold, ${TARGET_CURRENT} current`);
  const auctions = (await listAuctions()).filter(
    (a) => a.link && a.client?.address?.country === "CZ" && a.auctionMode !== "gallery" && !/charit/i.test(`${a.link} ${a.name}`)
  );
  const horizon = new Date(NOW.getTime() + 60 * 864e5).toISOString();
  const pastAll = auctions.filter((a) => a.isDone && a.auctionDate && a.auctionDate >= OLDEST_AUCTION && a.auctionDate < NOW.toISOString());
  // Round-robin over months (newest month first): 1st auction of every month, then the 2nd, ...
  const byMonth = new Map();
  for (const a of pastAll) {
    const m = a.auctionDate.slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m).push(a);
  }
  const past = [];
  for (let round = 0; round < MAX_AUCTIONS_PER_MONTH * 4; round++) {
    for (const list of byMonth.values()) if (list[round]) past.push(list[round]);
  }
  const monthTaken = new Map();
  const upcoming = auctions.filter((a) => !a.isDone && a.auctionDate && a.auctionDate <= horizon);
  console.log(`Czech auctions: ${auctions.length} (past since ${OLDEST_AUCTION}: ${past.length}, current/upcoming ≤60 days: ${upcoming.length})`);

  const records = [];
  const stats = { auctionsScanned: 0, lotsSeen: 0, excludedCategory: 0, withdrawn: 0, perHouse: {}, unconvertible: 0 };
  let sold = 0;
  let current = 0;

  // 1) Current lots
  for (const a of upcoming) {
    if (current >= TARGET_CURRENT) break;
    let taken = 0;
    if ((await relevantLotCount(a)) < 5) continue;
    const items = await auctionItems(a, () => current + taken >= TARGET_CURRENT || taken >= MAX_CURRENT_PER_AUCTION);
    stats.auctionsScanned++;
    for (const it of items) {
      stats.lotsSeen++;
      if (it.isFinished || it.withdrawn) continue;
      const cls = classify(it);
      if (!cls) { stats.excludedCategory++; continue; }
      if (taken >= MAX_CURRENT_PER_AUCTION || current >= TARGET_CURRENT) break;
      const rec = await toRecord(it, a, "active", cls);
      if (!rec) { stats.unconvertible++; continue; }
      records.push(rec); taken++; current++;
    }
    console.log(`  [current] ${a.link}: +${taken} (total ${current})`);
  }

  // 2) Completed auctions, newest first
  for (const a of past) {
    if (sold >= TARGET_SOLD) break;
    let s = 0;
    let u = 0;
    const month = a.auctionDate.slice(0, 7);
    if ((monthTaken.get(month) || 0) >= MAX_AUCTIONS_PER_MONTH) continue;
    if ((await relevantLotCount(a)) < 10) continue;
    const countSold = (items) => items.filter((i) => i.finalPrice > 0 && classify(i)).length;
    const items = await auctionItems(a, (its) => countSold(its) >= MAX_SOLD_PER_AUCTION || sold + countSold(its) >= TARGET_SOLD);
    stats.auctionsScanned++;
    for (const it of items) {
      stats.lotsSeen++;
      if (it.withdrawn) { stats.withdrawn++; continue; }
      if (!it.isFinished) continue;
      const cls = classify(it);
      if (!cls) { stats.excludedCategory++; continue; }
      const isSold = Number(it.finalPrice) > 0;
      if (isSold && (s >= MAX_SOLD_PER_AUCTION || sold >= TARGET_SOLD)) continue;
      if (!isSold && u >= MAX_UNSOLD_PER_AUCTION) continue;
      const rec = await toRecord(it, a, isSold ? "sold" : "unsold", cls);
      if (!rec) { stats.unconvertible++; continue; }
      records.push(rec);
      if (isSold) { s++; sold++; } else u++;
    }
    if (s) monthTaken.set(month, (monthTaken.get(month) || 0) + 1);
    if (s || u) stats.perHouse[a.client.name] = (stats.perHouse[a.client.name] || 0) + s;
    console.log(`  [past] ${a.auctionDate.slice(0, 10)} ${a.link}: +${s} sold, +${u} unsold (total sold ${sold})`);
  }

  const byStatus = records.reduce((acc, r) => ((acc[r.status] = (acc[r.status] || 0) + 1), acc), {});
  const byCategory = records.reduce((acc, r) => ((acc[r.subcategory] = (acc[r.subcategory] || 0) + 1), acc), {});
  const report = {
    collected_at: NOW.toISOString(),
    source: "Livebid.cz public API (https://livebid.cz/apiv2)",
    http_requests: requests,
    totals: { records: records.length, ...byStatus },
    by_subcategory: byCategory,
    sold_by_auction_house: stats.perHouse,
    without_location: records.filter((r) => r.lat == null).length,
    eur_converted: records.filter((r) => r.currency === "EUR").length,
    stats,
  };
  fs.writeFileSync(path.join(DATA, "livebid_dataset.json"), JSON.stringify(records, null, 1));
  fs.writeFileSync(path.join(DATA, "collection_report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.totals), `requests=${requests}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
