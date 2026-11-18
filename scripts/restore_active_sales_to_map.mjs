import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { generateVerificationSignature } from "../lib/db/index.js";

const DB_PATH = path.join(process.cwd(), "db.sqlite3");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

const CITY_CENTERS = {
  "Prague": { lat: 50.0833, lng: 14.4250, radiusKm: 3.8 },
  "Prague 1": { lat: 50.0875, lng: 14.4213, radiusKm: 1.8 },
  "Prague 2": { lat: 50.0755, lng: 14.4378, radiusKm: 1.8 },
  "Prague 5": { lat: 50.0706, lng: 14.4027, radiusKm: 2.2 },
  "Prague 6": { lat: 50.1003, lng: 14.3952, radiusKm: 2.5 },
  "Praha 1": { lat: 50.0875, lng: 14.4213, radiusKm: 1.8 },
  "Praha 2": { lat: 50.0755, lng: 14.4378, radiusKm: 1.8 },
  "Praha 6": { lat: 50.1003, lng: 14.3952, radiusKm: 2.5 },
  "Brno": { lat: 49.1951, lng: 16.6068, radiusKm: 3.2 },
  "Plzeň": { lat: 49.7384, lng: 13.3736, radiusKm: 2.5 },
  "Olomouc": { lat: 49.5938, lng: 17.2509, radiusKm: 2.2 },
  "Karlovy Vary": { lat: 50.2319, lng: 12.8720, radiusKm: 2.0 },
  "Liberec": { lat: 50.7663, lng: 15.0543, radiusKm: 2.5 },
  "České Budějovice": { lat: 48.9745, lng: 14.4743, radiusKm: 2.2 },
  "Kutná Hora": { lat: 49.9484, lng: 15.2682, radiusKm: 1.5 }
};

function getUniformDiskCoords(id, cityName = "Prague") {
  const normCity = Object.keys(CITY_CENTERS).find(c => cityName.toLowerCase().includes(c.toLowerCase())) || "Prague";
  const center = CITY_CENTERS[normCity];

  const hash = crypto.createHash("sha256").update(`disk_dispersion_${id}`).digest();
  const u1 = hash.readUInt32BE(0) / 4294967296;
  const u2 = hash.readUInt32BE(4) / 4294967296;

  // Uniform disk area formula: r = R * sqrt(u1), theta = 2 * PI * u2
  const uClamped = 0.06 + 0.94 * u1;
  const rKm = center.radiusKm * Math.sqrt(uClamped);
  const theta = 2 * Math.PI * u2;

  const latDelta = (rKm * Math.cos(theta)) / 111.13;
  const lngDelta = (rKm * Math.sin(theta)) / (111.13 * Math.cos((center.lat * Math.PI) / 180));

  return {
    lat: Number((center.lat + latDelta).toFixed(6)),
    lng: Number((center.lng + lngDelta).toFixed(6))
  };
}

console.log("==================================================");
console.log("  RESTORE ACTIVE REAL SALES TO PRICE MAP & DATABASE");
console.log("==================================================");

// 1. Read cached real scraped items
const cachePath = path.join(process.cwd(), "data", "scraped_real_antiques.json");
if (!fs.existsSync(cachePath)) {
  console.error("Cache file not found:", cachePath);
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(cachePath, "utf8"));
const activeAukroLots = rawData.filter(r => r.status === "active" || r.price_type === "asking");
console.log(`Found ${activeAukroLots.length} active antique sales from Aukro in cache.`);

// 2. Prepare statement for upserting active sales
const insertStmt = db.prepare(`
  INSERT INTO historical_transactions (
    id, source_id, source_name, source_type, source_url, external_lot_id,
    title, category, subcategory, maker, period, condition, price_czk,
    hammer_price_czk, currency, original_amount, price_type,
    verification_level, verification_source_type, verification_signature, sale_date, city,
    lat, lng, location_precision, is_sample, status, note, raw_data_json, updated_at
  ) VALUES (
    @id, @source_id, @source_name, @source_type, @source_url, @external_lot_id,
    @title, @category, @subcategory, @maker, @period, @condition, @price_czk,
    @hammer_price_czk, @currency, @original_amount, @price_type,
    @verification_level, @verification_source_type, @verification_signature, @sale_date, @city,
    @lat, @lng, @location_precision, @is_sample, @status, @note, @raw_data_json, CURRENT_TIMESTAMP
  )
  ON CONFLICT(source_url) DO UPDATE SET
    price_czk = excluded.price_czk,
    lat = excluded.lat,
    lng = excluded.lng,
    verification_signature = excluded.verification_signature,
    status = excluded.status,
    updated_at = CURRENT_TIMESTAMP
`);

let inserted = 0;
const runInsert = db.transaction((items) => {
  for (const item of items) {
    const coords = getUniformDiskCoords(item.id, item.city);
    const sig = generateVerificationSignature({
      id: item.id,
      price_czk: item.price_czk,
      sale_date: item.sale_date,
      source_name: item.source_name,
      verification_level: item.verification_level || "reported"
    });

    insertStmt.run({
      id: item.id,
      source_id: item.source_id,
      source_name: item.source_name,
      source_type: item.source_type || "marketplace",
      source_url: item.source_url,
      external_lot_id: String(item.external_lot_id || ""),
      title: item.title,
      category: item.category,
      subcategory: item.subcategory,
      maker: item.maker,
      period: item.period,
      condition: item.condition,
      price_czk: item.price_czk,
      hammer_price_czk: null,
      currency: "CZK",
      original_amount: item.price_czk,
      price_type: "asking",
      verification_level: "reported",
      verification_source_type: "shop",
      verification_signature: sig,
      sale_date: item.sale_date || new Date().toISOString().slice(0, 10),
      city: item.city,
      lat: coords.lat,
      lng: coords.lng,
      location_precision: "city",
      is_sample: 0,
      status: "active",
      note: item.note || "Active online antique listing.",
      raw_data_json: JSON.stringify({ images: item.images })
    });
    inserted++;
  }
});

runInsert(activeAukroLots);
console.log(`Successfully restored ${inserted} active sales with uniform disk coordinates and signatures.`);

// 3. Clear any remaining huntique.local
const clearInfo = db.prepare("UPDATE historical_transactions SET source_url = NULL WHERE source_url LIKE '%huntique.local%'").run();
console.log(`Cleared huntique.local URLs: ${clearInfo.changes}`);

// 4. Verification summary
const totalAll = db.prepare("SELECT count(*) as c FROM historical_transactions").get().c;
const totalSold = db.prepare("SELECT count(*) as c FROM historical_transactions WHERE status = 'sold'").get().c;
const totalActive = db.prepare("SELECT count(*) as c FROM historical_transactions WHERE status = 'active'").get().c;
const withSig = db.prepare("SELECT count(*) as c FROM historical_transactions WHERE verification_signature IS NOT NULL").get().c;
const sampleCount = db.prepare("SELECT count(*) as c FROM historical_transactions WHERE is_sample = 1").get().c;

console.log("\n==================================================");
console.log("  VERIFICATION STATS");
console.log("==================================================");
console.log(`  Total transactions in DB:   ${totalAll}`);
console.log(`  Sold (Closed historical):   ${totalSold}`);
console.log(`  Active sales (For map):     ${totalActive}`);
console.log(`  Signed with Verification:   ${withSig} / ${totalAll}`);
console.log(`  Sample records (MUST BE 0): ${sampleCount}`);
console.log("==================================================\n");

console.log("Sample Active Sales on Map:");
console.table(db.prepare("SELECT id, title, price_czk, city, lat, lng, verification_signature FROM historical_transactions WHERE status = 'active' LIMIT 3").all());
