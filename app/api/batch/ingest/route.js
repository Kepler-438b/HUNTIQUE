import { NextResponse } from "next/server";
import { batchIngestTransactions } from "@/lib/db/index.js";
import { denyIfReadOnly, hasValidBearer } from "@/lib/security.js";

// POST /api/batch/ingest
// Bulk ingestion endpoint for scrapers and parsers.
// Requires HUNTIQUE_ALLOW_WRITES=true and "Authorization: Bearer $HUNTIQUE_INGEST_TOKEN".
// Accepts: { source: "Scraper Name", records: [ { title, price_czk, ... }, ... ] }
export async function POST(request) {
  const denied = denyIfReadOnly();
  if (denied) return denied;
  if (!hasValidBearer(request, process.env.HUNTIQUE_INGEST_TOKEN)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const records = Array.isArray(body) ? body : (body.records || []);
    const sourceName = body.source || "Batch Scraper API";

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No records provided. Send JSON array or { records: [...] }",
      }, { status: 400 });
    }

    const result = batchIngestTransactions(records, sourceName);

    return NextResponse.json({
      success: true,
      message: `Successfully batch processed ${result.totalReceived} records.`,
      ...result,
    }, { status: 200 });
  } catch (error) {
    console.error("POST /api/batch/ingest error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
