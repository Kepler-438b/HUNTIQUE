import fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";
import { getDb, batchIngestTransactions, createMarketplaceLot, generateVerificationSignature } from "../lib/db/index.js";

const CITY_CENTERS = {
  "Prague": { lat: 50.0833, lng: 14.4250, radiusKm: 3.8 },
  "Prague 1": { lat: 50.0875, lng: 14.4213, radiusKm: 1.8 },
  "Prague 2": { lat: 50.0755, lng: 14.4378, radiusKm: 1.8 },
  "Prague 6": { lat: 50.1003, lng: 14.3952, radiusKm: 2.5 },
  "Brno": { lat: 49.1951, lng: 16.6068, radiusKm: 3.2 },
  "Plzeň": { lat: 49.7384, lng: 13.3736, radiusKm: 2.5 },
  "Olomouc": { lat: 49.5938, lng: 17.2509, radiusKm: 2.2 },
  "Karlovy Vary": { lat: 50.2319, lng: 12.8720, radiusKm: 2.0 },
  "Liberec": { lat: 50.7663, lng: 15.0543, radiusKm: 2.5 },
  "České Budějovice": { lat: 48.9745, lng: 14.4743, radiusKm: 2.2 },
  "Kutná Hora": { lat: 49.9484, lng: 15.2682, radiusKm: 1.5 }
};

const CITIES = Object.keys(CITY_CENTERS);

// Honest client identification for a non-commercial student research prototype (no browser spoofing).
const EUR_CZK = 25.2; // fixed rate, documented as a limitation
const USER_AGENT = "HUNTIQUE-student-prototype/0.1 (non-commercial university CI project)";
const CLOCK_RE = /hodin|clock|watch/i;

// NOTE: the sources do not publish seller/item location. pickCity() assigns an
// APPROXIMATE, ALGORITHMIC city so that points can be drawn on the map. Records are
// stored with location_precision = "approximate" and the UI must say so.

function pickCity(seedStr = "") {
  let hashVal = 0;
  for (let i = 0; i < seedStr.length; i++) hashVal = (hashVal << 5) - hashVal + seedStr.charCodeAt(i);
  const cityName = CITIES[Math.abs(hashVal) % CITIES.length];
  const center = CITY_CENTERS[cityName];

  const hash = crypto.createHash("sha256").update(`disk_jitter_${seedStr}`).digest();
  const u1 = hash.readUInt32BE(0) / 4294967296;
  const u2 = hash.readUInt32BE(4) / 4294967296;

  // Uniform disk dispersion: r = R * sqrt(u), theta = 2 * PI * v
  const uClamped = 0.06 + 0.94 * u1;
  const rKm = center.radiusKm * Math.sqrt(uClamped);
  const theta = 2 * Math.PI * u2;

  const latDelta = (rKm * Math.cos(theta)) / 111.13;
  const lngDelta = (rKm * Math.sin(theta)) / (111.13 * Math.cos((center.lat * Math.PI) / 180));

  return {
    city: cityName,
    lat: Number((center.lat + latDelta).toFixed(6)),
    lng: Number((center.lng + lngDelta).toFixed(6))
  };
}

function detectCategoryAndSub(title = "", rawCat = "") {
  const t = (title + " " + rawCat).toLowerCase();

  // Furniture
  if (t.includes("židle") || t.includes("zidle") || t.includes("chair") || t.includes("stolička")) {
    return { category: "furniture", subcategory: "chair" };
  }
  if (t.includes("křeslo") || t.includes("kreslo") || t.includes("armchair") || t.includes("ušák")) {
    return { category: "furniture", subcategory: "armchair" };
  }
  if (t.includes("stůl") || t.includes("stul") || t.includes("table") || t.includes("stolek") || t.includes("psací")) {
    return { category: "furniture", subcategory: "table" };
  }
  if (t.includes("komoda") || t.includes("prádelník") || t.includes("chest")) {
    return { category: "furniture", subcategory: "chest of drawers" };
  }
  if (t.includes("skříň") || t.includes("skrin") || t.includes("vitrína") || t.includes("sekretář") || t.includes("cabinet")) {
    return { category: "furniture", subcategory: "cabinet" };
  }
  if (t.includes("nábytek") || t.includes("nabytek") || t.includes("postel") || t.includes("lavice") || t.includes("zrcadlo")) {
    return { category: "furniture", subcategory: "furniture_other" };
  }

  // Tableware / Glass / Porcelain
  if (t.includes("sklo") || t.includes("váza") || t.includes("vaza") || t.includes("pohár") || t.includes("glass") || t.includes("karafa")) {
    return { category: "tableware", subcategory: "glass" };
  }
  if (t.includes("porcelán") || t.includes("porcelan") || t.includes("talíř") || t.includes("šálek") || t.includes("servis") || t.includes("konvice")) {
    return { category: "tableware", subcategory: "porcelain" };
  }
  if (t.includes("stříbro") || t.includes("stribro") || t.includes("silver") || t.includes("příbor") || t.includes("tác")) {
    return { category: "tableware", subcategory: "silver" };
  }
  if (t.includes("keramika") || t.includes("majolika") || t.includes("kamenina")) {
    return { category: "tableware", subcategory: "ceramics" };
  }

  return { category: "tableware", subcategory: "decorative_art" };
}

function detectMaker(title = "", authorObj = null) {
  if (authorObj && authorObj.lastName) {
    return `${authorObj.firstName || ""} ${authorObj.lastName}`.trim();
  }
  const t = title.toLowerCase();
  if (t.includes("thonet")) return "Gebrüder Thonet";
  if (t.includes("kohn")) return "J. & J. Kohn";
  if (t.includes("halabala") || t.includes("up závody") || t.includes("up zavody")) return "Jindřich Halabala (UP Závody)";
  if (t.includes("moser")) return "Moser Karlovy Vary";
  if (t.includes("pirkenhammer") || t.includes("březová")) return "Pirkenhammer (Březová)";
  if (t.includes("thun") || t.includes("klášterec")) return "Thun (Klášterec)";
  if (t.includes("egermann") || t.includes("nový bor")) return "Friedrich Egermann (Nový Bor)";
  if (t.includes("loetz") || t.includes("klostermühle")) return "Loetz Witwe (Klášterský Mlýn)";
  if (t.includes("meissen") || t.includes("míšeň")) return "Meissen Porcelain";
  if (t.includes("hoffmann")) return "Josef Hoffmann (Wiener Werkstätte)";
  if (t.includes("roubíček") || t.includes("roubicek")) return "René Roubíček";
  if (t.includes("hůrka") || t.includes("hurka")) return "Miloslav Hůrka";
  if (t.includes("hospodka")) return "Josef Hospodka (Chřibská)";
  if (t.includes("slavíček") || t.includes("slavicek")) return "Antonín Slavíček";
  return "Bohemian Master / Workshop";
}

function detectPeriod(title = "") {
  const t = title.toLowerCase();
  if (t.includes("barok") || t.includes("baroque")) return "Baroque";
  if (t.includes("rokoko") || t.includes("rococo")) return "Rococo";
  if (t.includes("klasic") || t.includes("empire") || t.includes("empír")) return "Classicism / Empire";
  if (t.includes("biedermeier") || t.includes("184") || t.includes("183")) return "Biedermeier";
  if (t.includes("historism") || t.includes("novorenesan") || t.includes("novogotik")) return "Historicism";
  if (t.includes("seces") || t.includes("jugendstil") || t.includes("art nouveau") || t.includes("190") || t.includes("191")) return "Art Nouveau / Secession";
  if (t.includes("art deco") || t.includes("art-deco") || t.includes("192") || t.includes("193")) return "Art Deco";
  if (t.includes("funkcional") || t.includes("bruselsk") || t.includes("brusel") || t.includes("mid-century") || t.includes("195") || t.includes("196")) return "Mid-Century / Modernism";
  return "Historical (19th-20th c.)";
}

// ----------------------------------------------------
// 1. LIVEBID.CZ SCRAPER (REST API, 500-600 records)
// ----------------------------------------------------
async function scrapeLivebid(targetCount = 550) {
  console.log("\n[1/3] Scraping Livebid.cz auction houses & archives...");
  const records = [];
  let page = 1;

  while (records.length < targetCount && page <= 25) {
    const url = `https://livebid.cz/apiv2/items?page=${page}&count=50`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "application/json"
        }
      });
      if (!res.ok) {
        console.warn(`  Livebid page ${page} returned ${res.status}. Retrying in 1s...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      const json = await res.json();
      const items = json.data?.items || [];
      if (items.length === 0) break;

      for (const item of items) {
        // Only lots with a recorded result are sales. Lots that ended without bids
        // (finalPrice/actualPrice null, counterLimits 0) are skipped. No fallback prices.
        const resultPrice = Number(item.finalPrice || item.actualPrice) || 0;
        const isSold = item.isFinished && resultPrice > 0 && Number(item.counterLimits) > 0;
        const isOpen = !item.isFinished && Number(item.startingPrice) > 0;
        if ((!isSold && !isOpen) || CLOCK_RE.test(item.itemName || "")) continue;
        const toCzk = (v) => (item.currency === "EUR" ? Math.round(v * EUR_CZK) : Math.round(v));
        const price = toCzk(isSold ? resultPrice : Number(item.startingPrice));

        const { category, subcategory } = detectCategoryAndSub(item.itemName, item.categoryName);
        const maker = detectMaker(item.itemName, item.author);
        const period = detectPeriod(item.itemName);
        const cityData = pickCity(item.clientName || item.auctionLink || item.itemName);

        const imgUrl = item.images && item.images.length
          ? (item.images[0].name.startsWith("http") ? item.images[0].name : `https://livebid.cz/${item.images[0].name}`)
          : `https://livebid.cz/imgs/${item.auctionId}/${item.lotn}.jpg`;

        const lotRecord = {
          id: `livebid_${item.itemId || item.auctionId + "_" + item.lotn}`,
          source_id: `src_livebid_${item.clientId || "auction"}`,
          source_name: `${item.clientName || "Livebid Partner Gallery"} (${item.auctionLink})`,
          source_type: "auction_house",
          source_url: `https://livebid.cz/auction/${item.auctionLink}/detail/${item.lotn || item.itemIndex || 1}`,
          external_lot_id: String(item.lotn || item.itemIndex || ""),
          title: (item.itemName || item.productName || "Antikvární položka").trim(),
          category,
          subcategory,
          maker,
          period,
          condition: item.shortDescription || item.description || "Archived auction lot with verified cataloguing.",
          price_czk: price,
          hammer_price_czk: isSold ? price : null,
          currency: "CZK",
          original_amount: price,
          price_type: isSold ? "hammer" : "asking",
          verification_level: "documented",
          verification_source_type: "auction",
          sale_date: (item.limitingEnd || item.limitingStart || "").slice(0, 10) || null,
          city: cityData.city,
          lat: cityData.lat,
          lng: cityData.lng,
          location_precision: "approximate",
          is_sample: 0,
          status: isSold ? "sold" : "active",
          note: `Hammer price (buyer premium not included). Catalogued lot #${item.lotn}. EUR converted at ${EUR_CZK} CZK.`,
          images: [imgUrl]
        };

        records.push(lotRecord);
        if (records.length >= targetCount) break;
      }

      console.log(`  Livebid: fetched page ${page} (total gathered: ${records.length}/${targetCount})`);
      page++;
      await new Promise(r => setTimeout(r, 200)); // gentle jitter
    } catch (e) {
      console.warn(`  Livebid error on page ${page}: ${e.message}. Retrying...`);
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`[SUCCESS] Livebid scraped: ${records.length} real auction records.`);
  return records;
}

// ----------------------------------------------------
// 2. AUKRO.CZ SCRAPER (Sitemaps + OG Metadata, 450-500 records)
// ----------------------------------------------------
async function scrapeAukro(targetCount = 450) {
  console.log("\n[2/3] Scraping Aukro.cz active antique listings...");
  const sitemapUrl = "https://cdn.aukro.cz/sitemaps/cs-cz/sitemap-items-starozitnosti-a-umeni-1-498432.xml.gz";

  console.log("  Downloading and decompressing Aukro sitemap index...");
  const smRes = await fetch(sitemapUrl);
  const buffer = Buffer.from(await smRes.arrayBuffer());
  const unzipped = zlib.gunzipSync(buffer).toString("utf8");
  const allUrls = [...unzipped.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

  console.log(`  Found ${allUrls.length} total URLs in sitemap. Filtering for antique terms...`);

  const antiqueKeywords = [
    "stul", "stolek", "zidle", "kreslo", "komoda", "skrin", "nabytek", "postel",
    "sklo", "vaza", "porcelan", "salek", "servis", "hodiny", "starozitn",
    "thonet", "halabala", "moser", "pirkenhammer", "thun", "egermann", "seces"
  ];

  const candidateUrls = allUrls.filter(u => antiqueKeywords.some(kw => u.toLowerCase().includes(kw)));
  console.log(`  Filtered down to ${candidateUrls.length} relevant antique candidates.`);

  const records = [];
  const batchSize = 10;
  const urlsToFetch = candidateUrls.slice(0, targetCount + 100);

  for (let i = 0; i < urlsToFetch.length; i += batchSize) {
    if (records.length >= targetCount) break;

    const slice = urlsToFetch.slice(i, i + batchSize);
    const promises = slice.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": USER_AGENT
          }
        });
        if (!res.ok) return null;
        const html = await res.text();

        const getMeta = (prop) => {
          const m = html.match(new RegExp(`<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["']([^"']*)["']`, "i"));
          return m ? m[1] : null;
        };

        const title = getMeta("og:title")?.replace(/\s*\|\s*Aukro\.cz\s*$/i, "")?.trim();
        if (!title) return null;

        const image = getMeta("og:image");
        const desc = getMeta("og:description") || "";
        const priceMatch = desc.match(/(?:Aukce od|Kup teď za|Cena:?)\s*(\d[\d\s]*)\s*Kč/i) || html.match(/(\d[\d\s]*)\s*Kč/);
        const price = priceMatch ? Number(priceMatch[1].replace(/\s+/g, "")) : null;
        if (!price || CLOCK_RE.test(title || "")) return null; // no fallback prices; clocks are out of scope

        const idMatch = url.match(/-(\d{9,12})$/);
        const itemId = idMatch ? idMatch[1] : `auk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        const { category, subcategory } = detectCategoryAndSub(title);
        const maker = detectMaker(title);
        const period = detectPeriod(title);
        const cityData = pickCity(url);

        return {
          id: `aukro_${itemId}`,
          source_id: `src_aukro_${itemId}`,
          source_name: "Aukro.cz (Starožitnosti a Umění)",
          source_type: "marketplace",
          source_url: url,
          external_lot_id: itemId,
          title,
          category,
          subcategory,
          maker,
          period,
          condition: desc.slice(0, 300) || "Original active listing on Aukro marketplace.",
          price_czk: price,
          hammer_price_czk: null,
          currency: "CZK",
          original_amount: price,
          price_type: "asking",
          verification_level: "reported",
          verification_source_type: "shop",
          sale_date: new Date().toISOString().slice(0, 10),
          city: cityData.city,
          lat: cityData.lat,
          lng: cityData.lng,
          location_precision: "approximate",
          is_sample: 0,
          status: "active",
          note: `Active online listing. Primary photo and verification URL linked.`,
          images: image ? [image] : ["https://images.unsplash.com/photo-1580481077197-9b29a6d7d100?auto=format&fit=crop&w=1000&q=80"]
        };
      } catch {
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    for (const item of batchResults) {
      if (item) records.push(item);
    }

    console.log(`  Aukro: fetched batch ${Math.floor(i / batchSize) + 1} (total gathered: ${records.length}/${targetCount})`);
    await new Promise(r => setTimeout(r, 180)); // polite jitter
  }

  console.log(`[SUCCESS] Aukro scraped: ${records.length} active antique listings.`);
  return records;
}

// ----------------------------------------------------
// 3. MAIN RUNNER & INGESTION INTO SQLITE
// ----------------------------------------------------
async function main() {
  console.log("==================================================");
  console.log("  HUNTIQUE REAL-DATA SCRAPER: Livebid + Aukro");
  console.log("==================================================");
  const startTime = Date.now();

  // 1. Collect
  const livebidRecords = await scrapeLivebid(550);
  const aukroRecords = await scrapeAukro(450);

  const allRecords = [...livebidRecords, ...aukroRecords];
  console.log(`\n[TOTAL GATHERED] ${allRecords.length} real records.`);

  // 2. Cache checkpoint to disk
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const cachePath = path.join(dataDir, "scraped_real_antiques.json");
  fs.writeFileSync(cachePath, JSON.stringify(allRecords, null, 2), "utf8");
  console.log(`Saved backup cache to ${cachePath}`);

  // 3. Ingest closed historical auction archive into SQLite
  console.log("\n[3/3] Ingesting Livebid closed auction records into SQLite (db.sqlite3)...");
  const ingestRes = batchIngestTransactions(livebidRecords, "Livebid Archival Feed");

  // 4. Also publish Aukro active listings to Marketplace lots
  console.log("Publishing Aukro active items to Marketplace vitrine...");
  let marketLotsCount = 0;
  for (const item of aukroRecords) {
    try {
      createMarketplaceLot({
        id: `lot_${item.id}`,
        type: "offer",
        title: item.title,
        category: item.category,
        subcategory: item.subcategory,
        maker: item.maker,
        year: item.period,
        city: item.city,
        seller: "Aukro.cz listing (seller not shown)",
        sellerType: "shop",
        userEmail: "collector@prague.cz",
        currentBid: item.price_czk,
        endsIn: "5 days",
        tag: "Active Auction",
        description: item.condition,
        images: item.images,
        analytics: {
          marketMedian: `${item.price_czk.toLocaleString("cs-CZ")} Kč`,
          historicalSalesCount: null,
          trend: "Real-time Aukro lot",
          sourceName: "Aukro Marketplace Feed",
          sourceUrl: item.source_url
        }
      });
      marketLotsCount++;
    } catch {}
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const db = getDb();
  const totalTx = db.prepare("SELECT count(*) as c FROM historical_transactions").get().c;
  const totalLots = db.prepare("SELECT count(*) as c FROM marketplace_lots").get().c;
  const totalSources = db.prepare("SELECT count(DISTINCT source_name) as c FROM historical_transactions").get().c;

  console.log("\n==================================================");
  console.log("  PARSING & INGESTION COMPLETE!");
  console.log("==================================================");
  console.log(`  Total time elapsed:       ${durationSec} seconds`);
  console.log(`  Livebid archive records:  ${livebidRecords.length}`);
  console.log(`  Aukro active listings:    ${aukroRecords.length}`);
  console.log(`  Total Ingested to SQLite: ${ingestRes.inserted}`);
  console.log(`  Marketplace Lots active:  ${totalLots}`);
  console.log(`  Total Transactions in DB: ${totalTx}`);
  console.log(`  Unique Tracked Platforms: ${totalSources}`);
  console.log("==================================================\n");
}

main().catch(err => {
  console.error("Scraper encountered an error:", err);
  process.exit(1);
});
