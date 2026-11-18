import Database from "better-sqlite3";
import path from "path";
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
console.log("  HUNTIQUE DATABASE PURGE & ENHANCEMENT SCRIPT");
console.log("==================================================");

// 1. Ensure verification_signature column and index exist
try {
  db.exec("ALTER TABLE historical_transactions ADD COLUMN verification_signature TEXT;");
  console.log("[1/6] Added verification_signature column to historical_transactions.");
} catch {
  console.log("[1/6] verification_signature column already exists.");
}
db.exec("CREATE INDEX IF NOT EXISTS idx_hist_sig ON historical_transactions(verification_signature);");

// 2. Delete all sample records
const delSample = db.prepare("DELETE FROM historical_transactions WHERE is_sample = 1").run();
console.log(`[2/6] Purged non-real sample data: deleted ${delSample.changes} sample records.`);

// 3. Remove all active / asking price listings from historical archive (closed deals only)
const delActive = db.prepare("DELETE FROM historical_transactions WHERE status = 'active' OR price_type = 'asking'").run();
console.log(`[3/6] Purged active listings from archive: deleted ${delActive.changes} active records.`);

// 4. Update coordinates with uniform 2D disk dispersion and assign verification signatures
const records = db.prepare("SELECT id, title, price_czk, sale_date, source_name, verification_level, city FROM historical_transactions").all();
console.log(`[4/6] Processing ${records.length} closed transactions for coordinate dispersion & signatures...`);

const updateStmt = db.prepare(`
  UPDATE historical_transactions
  SET lat = @lat,
      lng = @lng,
      verification_signature = @verification_signature,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = @id
`);

const processAll = db.transaction((rows) => {
  for (const r of rows) {
    const coords = getUniformDiskCoords(r.id, r.city);
    const sig = generateVerificationSignature(r);
    updateStmt.run({
      id: r.id,
      lat: coords.lat,
      lng: coords.lng,
      verification_signature: sig
    });
  }
});

processAll(records);
console.log(`      Updated coordinates and assigned signatures to all ${records.length} records.`);

// 5. Clean marketplace_lots: replace req_1 Rolex with an authentic antique item
const req1 = db.prepare("SELECT * FROM marketplace_lots WHERE id = 'req_1'").get();
if (req1) {
  db.prepare(`
    UPDATE marketplace_lots
    SET title = 'Jindřich Halabala Armchair Model H-269 (Original Bentwood)',
        category = 'furniture',
        subcategory = 'armchair',
        maker = 'Jindřich Halabala (UP Závody)',
        year = 'ca. 1935',
        current_bid_or_budget = 42000,
        tag = 'Ready Demand (42 000 Kč)',
        description = 'Looking for an authentic pair or single armchair H-269 by Jindřich Halabala in restored or original condition with intact bentwood loops.',
        images_json = '["https://images.unsplash.com/photo-1580481077197-9b29a6d7d100?auto=format&fit=crop&w=1000&q=80"]'
    WHERE id = 'req_1'
  `).run();
  console.log("[5/6] Cleaned marketplace_lots: replaced sample Rolex request with Halabala H-269 armchair.");
}

// 6. Summary verification
const remainingTx = db.prepare("SELECT count(*) as c FROM historical_transactions").get().c;
const remainingSamples = db.prepare("SELECT count(*) as c FROM historical_transactions WHERE is_sample = 1").get().c;
const remainingActiveInHist = db.prepare("SELECT count(*) as c FROM historical_transactions WHERE status = 'active' OR price_type = 'asking'").get().c;
const withSignature = db.prepare("SELECT count(*) as c FROM historical_transactions WHERE verification_signature IS NOT NULL").get().c;
const totalMarketLots = db.prepare("SELECT count(*) as c FROM marketplace_lots").get().c;
const uniqueSources = db.prepare("SELECT count(DISTINCT source_name) as c FROM historical_transactions").get().c;

console.log("\n==================================================");
console.log("  DATABASE STATUS AFTER PURGE & ENHANCEMENT");
console.log("==================================================");
console.log(`  Historical closed deals:       ${remainingTx}`);
console.log(`  Sample records remaining:      ${remainingSamples} (MUST BE 0)`);
console.log(`  Active listings in archive:    ${remainingActiveInHist} (MUST BE 0)`);
console.log(`  Signed with Verification Sig:  ${withSignature} / ${remainingTx}`);
console.log(`  Marketplace active lots:       ${totalMarketLots}`);
console.log(`  Tracked verified platforms:    ${uniqueSources}`);
console.log("==================================================\n");

console.log("Sample signed records:");
console.table(db.prepare("SELECT id, title, price_czk, city, lat, lng, verification_signature FROM historical_transactions LIMIT 5").all());
