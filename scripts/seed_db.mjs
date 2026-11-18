import { getDb, batchIngestTransactions, createMarketplaceLot, createUser, getUserByEmail } from "../lib/db/index.js";
import { realRecords } from "../lib/data/realRecords.js";
import { sampleRecords } from "../lib/data/sampleRecords.js";
import { DEFAULT_OFFERS, DEFAULT_REQUESTS, DEFAULT_HISTORICAL } from "../lib/store.js";

async function runSeed() {
  console.log("==================================================");
  console.log("  HUNTIQUE SQLite Database Migration & Seeding");
  console.log("==================================================");

  const db = getDb();
  console.log("[1/4] SQLite connection initialized with WAL mode and performance tuning.");

  // 1. Prepare all historical transactions
  console.log("[2/4] Aggregating historical datasets for batch ingestion...");
  const combinedHistorical = [
    ...realRecords.map((r) => ({
      ...r,
      verification_source_type: "auction",
      condition: r.note || "Catalogued in public auction.",
      is_sample: 0,
      status: "sold",
    })),
    ...sampleRecords.map((r) => ({
      ...r,
      is_sample: 1,
      status: r.price_type === "asking" ? "active" : "sold",
    })),
    ...DEFAULT_HISTORICAL.filter(
      (h) => !realRecords.some((r) => r.id === h.id)
    ),
  ];

  console.log(`Total transactions to ingest: ${combinedHistorical.length}`);

  const startTime = Date.now();
  const ingestResult = batchIngestTransactions(combinedHistorical, "Initial Database Seed");
  const duration = Date.now() - startTime;

  console.log(`[SUCCESS] Ingested ${ingestResult.inserted} transactions into SQLite in ${duration}ms!`);
  console.log(`Ingestion throughput: ~${ingestResult.speedPerSecond} records/sec`);

  // 2. Seed Marketplace Listings (Offers & Requests)
  console.log("[3/4] Seeding Marketplace listings (Offers and Requests)...");
  let lotsCount = 0;
  for (const offer of DEFAULT_OFFERS) {
    createMarketplaceLot(offer);
    lotsCount++;
  }
  for (const req of DEFAULT_REQUESTS) {
    createMarketplaceLot(req);
    lotsCount++;
  }
  console.log(`[SUCCESS] Seeded ${lotsCount} active marketplace lots.`);

  // 3. No default accounts are seeded (no credentials in the repository).
  // Locally, set HUNTIQUE_ALLOW_WRITES=true and register via the UI; admin role comes from HUNTIQUE_ADMIN_EMAILS.
  console.log("[4/4] Skipping default accounts (register locally if needed).");

  // Summary counts
  const totalTx = db.prepare("SELECT COUNT(*) as count FROM historical_transactions").get().count;
  const totalLots = db.prepare("SELECT COUNT(*) as count FROM marketplace_lots").get().count;
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;

  console.log("\n==================================================");
  console.log("  MIGRATION SUMMARY:");
  console.log(`  - Historical Transactions in SQLite: ${totalTx}`);
  console.log(`  - Active Marketplace Lots:          ${totalLots}`);
  console.log(`  - Registered Users:                  ${totalUsers}`);
  console.log(`  - SQLite Journal Mode:               ${db.pragma("journal_mode", { simple: true })}`);
  console.log("==================================================");
}

runSeed().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
