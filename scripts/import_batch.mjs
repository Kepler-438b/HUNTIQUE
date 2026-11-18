import fs from "fs";
import path from "path";
import { batchIngestTransactions, getDb } from "../lib/db/index.js";

// Usage:
//   node scripts/import_batch.mjs path/to/parsed_records.json "Hejtmánek Auction Scraper"
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Usage:
  node scripts/import_batch.mjs <path-to-json-file> [sourceName]

Example:
  node scripts/import_batch.mjs ./scraped_lots.json "Arthouse Hejtmánek March 2026"
    `);
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  const sourceName = args[1] || path.basename(filePath, path.extname(filePath));

  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Reading: ${filePath}...`);
  const raw = fs.readFileSync(filePath, "utf8");
  let records = [];

  try {
    const parsed = JSON.parse(raw);
    records = Array.isArray(parsed) ? parsed : (parsed.records || parsed.items || []);
  } catch (e) {
    console.error(`[ERROR] Failed to parse JSON: ${e.message}`);
    process.exit(1);
  }

  console.log(`Parsed ${records.length} items from file. Starting batch ingestion into SQLite...`);

  const startTime = Date.now();
  const res = batchIngestTransactions(records, sourceName);
  const duration = Date.now() - startTime;

  console.log("\n==================================================");
  console.log("  BATCH INGESTION RESULT");
  console.log("==================================================");
  console.log(`  Source:               ${sourceName}`);
  console.log(`  Records Received:     ${res.totalReceived}`);
  console.log(`  Records Processed:    ${res.inserted}`);
  console.log(`  Total Duration:       ${duration} ms`);
  console.log(`  Throughput Speed:     ~${res.speedPerSecond} records/sec`);
  console.log("==================================================\n");

  const db = getDb();
  const totalCount = db.prepare("SELECT COUNT(*) as c FROM historical_transactions").get().c;
  console.log(`Total transactions now in SQLite: ${totalCount}`);
}

main().catch(console.error);
