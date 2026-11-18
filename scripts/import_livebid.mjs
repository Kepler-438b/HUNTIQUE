// Loads data/livebid_dataset.json (made by scripts/collect_livebid.mjs) into db.sqlite3.
// - backs up the DB to backups/
// - adds the extra columns used by the real dataset (idempotent)
// - replaces all scraped records in historical_transactions with the new snapshot;
//   the 3 manually verified records (real_*: Hejtmánek, Zezula) are kept
// - merges the WAL so the single db.sqlite3 file can be deployed read-only
// Usage: node scripts/import_livebid.mjs
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const root = process.cwd();
const dataset = JSON.parse(fs.readFileSync(path.join(root, "data", "livebid_dataset.json"), "utf8"));
const db = new Database(path.join(root, "db.sqlite3"));

fs.mkdirSync(path.join(root, "backups"), { recursive: true });
const backup = path.join(root, "backups", `db-before-livebid-import-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite3`);
await db.backup(backup);
console.log(`[backup] ${backup}`);

// Same algorithm as lib/db/index.js generateVerificationSignature (record fingerprint)
function fingerprint(tx) {
  const payload = [tx.id || "", Math.round(Number(tx.price_czk) || 0), tx.sale_date || "", tx.source_name || "", tx.verification_level || "documented", "HUNTIQUE_AUDIT_KEY_2026"].join("::");
  const h = crypto.createHash("sha256").update(payload).digest("hex").toUpperCase();
  return `HTQ-VF-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`;
}

const extraColumns = {
  description: "TEXT",
  auction_name: "TEXT",
  platform: "TEXT",
  image_url: "TEXT",
  source_category: "TEXT",
  fx_rate: "REAL",
  fx_rate_date: "TEXT",
  bids_count: "INTEGER",
  collected_at: "TEXT",
};
const existing = new Set(db.prepare(`PRAGMA table_info(historical_transactions)`).all().map((c) => c.name));
for (const [name, type] of Object.entries(extraColumns)) {
  if (!existing.has(name)) db.exec(`ALTER TABLE historical_transactions ADD COLUMN ${name} ${type}`);
}

const cols = [
  "id", "source_id", "source_name", "source_type", "source_url", "external_lot_id", "title", "category", "subcategory",
  "maker", "period", "condition", "price_czk", "hammer_price_czk", "currency", "original_amount", "price_type",
  "verification_level", "verification_source_type", "verification_signature", "sale_date", "city", "lat", "lng",
  "location_precision", "is_sample", "status", "note", "description", "auction_name", "platform", "image_url",
  "source_category", "fx_rate", "fx_rate_date", "bids_count", "collected_at",
];
const insert = db.prepare(`INSERT INTO historical_transactions (${cols.join(",")}) VALUES (${cols.map((c) => "@" + c).join(",")})`);

const result = db.transaction(() => {
  const removed = db.prepare(`DELETE FROM historical_transactions WHERE id NOT LIKE 'real_%'`).run().changes;
  let inserted = 0;
  const seenUrls = new Set();
  for (const r of dataset) {
    if (seenUrls.has(r.source_url)) continue;
    seenUrls.add(r.source_url);
    const fxNote = r.currency === "EUR" ? ` Converted from ${r.original_amount} EUR at the ČNB rate of ${r.fx_rate_date} (${r.fx_rate} CZK/EUR).` : "";
    const statusNote = {
      sold: "Hammer price published by the auction house on Livebid.cz (buyer's premium not included).",
      unsold: "Lot ended without a sale; the price shown is the starting price.",
      active: r.price_type === "current_bid" ? "Auction still running; the price shown is the current highest bid." : "Auction still running; no bids yet, the price shown is the starting price.",
    }[r.status];
    insert.run({
      ...r,
      condition: null,
      is_sample: 0,
      note: `${statusNote}${fxNote}`,
      verification_signature: fingerprint(r),
    });
    inserted++;
  }
  // Manually verified records: mark their location honestly
  db.prepare(`UPDATE historical_transactions SET location_precision = 'auction_house_city' WHERE id LIKE 'real_%'`).run();
  return { removed, inserted };
})();

db.pragma("wal_checkpoint(TRUNCATE)");
db.pragma("journal_mode = DELETE");
db.exec("VACUUM");
const summary = db.prepare(`SELECT status, count(*) n FROM historical_transactions GROUP BY status`).all();
db.close();
console.log(JSON.stringify({ ...result, byStatus: summary }));
