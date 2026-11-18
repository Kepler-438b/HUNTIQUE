// Prepares db.sqlite3 for public demo deployment.
// - backs up the current DB to backups/ (gitignored)
// - removes user accounts and realistic personal data
// - removes invented "verified"/"rumor" records with fictional sources
// - removes Livebid lots that ended without a bid (they were stored as "sold")
// - fixes hammer price mislabel (starting price was stored as hammer price)
// - removes clock/watch lots (out of project scope)
// - replaces placeholder maker with "Unattributed"
// - marks all coordinates as approximate (city assigned algorithmically)
// - checkpoints WAL so the single db.sqlite3 file can be deployed read-only
//
// Usage: node scripts/sanitize_for_demo.mjs
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const root = process.cwd();
const dbPath = path.join(root, "db.sqlite3");
const backupDir = path.join(root, "backups");
fs.mkdirSync(backupDir, { recursive: true });

const db = new Database(dbPath);
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = path.join(backupDir, `db-before-sanitize-${stamp}.sqlite3`);
await db.backup(backupPath);
console.log(`[backup] ${backupPath}`);

const count = (sql) => db.prepare(sql).get().c;
const report = {};

const CLOCK = `(upper(title) LIKE '%HODIN%' OR lower(title) LIKE '%clock%' OR lower(title) LIKE '%watch%')`;

db.transaction(() => {
  // 1. Accounts: no stored credentials in the public demo
  report.usersDeleted = db.prepare(`DELETE FROM users`).run().changes;
  report.interactionsDeleted = db.prepare(`DELETE FROM marketplace_interactions`).run().changes;

  // 2. Invented records with fictional sources
  report.inventedDeleted = db
    .prepare(`DELETE FROM historical_transactions WHERE id IN ('hist_shop_1','hist_shop_2','hist_rumor_1','hist_rumor_2')`)
    .run().changes;

  // 3. Livebid lots finished without any bid: price == starting price -> not a sale
  report.unsoldDeleted = db
    .prepare(`DELETE FROM historical_transactions WHERE id LIKE 'livebid%' AND status = 'sold' AND hammer_price_czk >= price_czk`)
    .run().changes;

  // 4. Remaining Livebid sales: price_czk is the winning bid; the stored "hammer" was the starting price
  report.hammerFixed = db
    .prepare(`UPDATE historical_transactions SET hammer_price_czk = price_czk, price_type = 'hammer',
              note = 'Winning bid from Livebid.cz (hammer price, buyer premium not included).'
              WHERE id LIKE 'livebid%' AND status = 'sold'`)
    .run().changes;

  // 5. Clocks/watches are out of scope (furniture + tableware only)
  report.clocksDeletedHistorical = db.prepare(`DELETE FROM historical_transactions WHERE ${CLOCK}`).run().changes;
  report.clocksDeletedMarketplace = db.prepare(`DELETE FROM marketplace_lots WHERE ${CLOCK}`).run().changes;

  // 6. Placeholder maker
  report.makerFixed = db
    .prepare(`UPDATE historical_transactions SET maker = 'Unattributed' WHERE maker = 'Bohemian Master / Workshop'`)
    .run().changes;

  // 7. Coordinates are algorithmic, not real seller locations
  report.locationsMarked = db
    .prepare(`UPDATE historical_transactions SET location_precision = 'approximate'`)
    .run().changes;

  // 8. Marketplace: neutral demo identities, no realistic names/emails
  const lots = db.prepare(`SELECT id, type, user_type, analytics_json FROM marketplace_lots`).all();
  const upd = db.prepare(`UPDATE marketplace_lots SET seller_or_buyer_name = ?, user_email = ?, analytics_json = ?, bids_or_responses_count = 0 WHERE id = ?`);
  let demoN = 0;
  for (const lot of lots) {
    let name;
    let analytics = lot.analytics_json;
    if (lot.id.startsWith("lot_aukro")) {
      name = "Aukro.cz listing (seller not shown)";
      try {
        const a = JSON.parse(lot.analytics_json || "{}");
        analytics = JSON.stringify({ ...a, historicalSalesCount: null, trend: "Asking price on Aukro.cz", sourceName: "Aukro.cz" });
      } catch {}
    } else {
      demoN += 1;
      const role = lot.type === "request" ? "Buyer" : lot.user_type === "shop" ? "Shop" : "Collector";
      name = `Demo ${role} ${String(demoN).padStart(2, "0")}`;
    }
    upd.run(name, `demo-${lot.type}-${lot.id}@example.com`, analytics, lot.id);
  }
  report.marketplaceAnonymized = lots.length;
})();

db.pragma("wal_checkpoint(TRUNCATE)");
db.pragma("journal_mode = DELETE");
db.exec("VACUUM");

report.remaining = {
  sold: count(`SELECT count(*) c FROM historical_transactions WHERE status='sold'`),
  active: count(`SELECT count(*) c FROM historical_transactions WHERE status='active'`),
  marketplace: count(`SELECT count(*) c FROM marketplace_lots`),
};
db.close();
console.log(JSON.stringify(report, null, 2));
