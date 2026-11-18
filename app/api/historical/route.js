import { NextResponse } from "next/server";
import { getHistoricalTransactions, getDb, generateVerificationSignature } from "@/lib/db/index.js";
import { denyIfReadOnly } from "@/lib/security.js";

// GET /api/historical - query transactions with high-speed indexed filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const levels = searchParams.get("levels") ? searchParams.get("levels").split(",") : [];
    const priceTypes = searchParams.get("priceTypes") ? searchParams.get("priceTypes").split(",") : [];

    const filters = {
      q: searchParams.get("q") || "",
      category: searchParams.get("category") || "",
      subcategory: searchParams.get("subcategory") || "",
      maker: searchParams.get("maker") || "",
      yearFrom: searchParams.get("yearFrom") || "",
      yearTo: searchParams.get("yearTo") || "",
      priceMin: searchParams.get("priceMin") || "",
      priceMax: searchParams.get("priceMax") || "",
      status: searchParams.get("status") || "all",
      dataset: searchParams.get("dataset") || "all",
      levels,
      priceTypes,
      limit: searchParams.get("limit") || null,
      offset: searchParams.get("offset") || null,
    };

    const records = getHistoricalTransactions(filters);
    return NextResponse.json({ success: true, count: records.length, records });
  } catch (error) {
    console.error("GET /api/historical error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/historical - real-time transaction insertion (e.g. from Master Panel)
export async function POST(request) {
  const denied = denyIfReadOnly();
  if (denied) return denied;

  try {
    const body = await request.json();
    const db = getDb();

    const id = body.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const stmt = db.prepare(`
      INSERT INTO historical_transactions (
        id, source_id, source_name, source_type, source_url, title,
        category, subcategory, maker, period, condition, price_czk,
        hammer_price_czk, currency, original_amount, price_type,
        verification_level, verification_source_type, verification_signature, sale_date, city,
        lat, lng, location_precision, is_sample, status, note
      ) VALUES (
        @id, @source_id, @source_name, @source_type, @source_url, @title,
        @category, @subcategory, @maker, @period, @condition, @price_czk,
        @hammer_price_czk, @currency, @original_amount, @price_type,
        @verification_level, @verification_source_type, @verification_signature, @sale_date, @city,
        @lat, @lng, @location_precision, @is_sample, @status, @note
      )
    `);

    const sanitized = {
      id,
      source_id: body.source_id || "manual_entry",
      source_name: body.source_name || "HUNTIQUE Direct Entry",
      source_type: body.source_type || "shop",
      source_url: body.source_url && !body.source_url.includes("huntique.local") ? body.source_url : null,
      title: body.title || "Untitled Transaction",
      category: body.category || "furniture",
      subcategory: body.subcategory || "other",
      maker: body.maker || "Unknown",
      period: body.period || "Unknown",
      condition: body.condition || body.note || null,
      price_czk: Number(body.price_czk) || 0,
      hammer_price_czk: body.hammer_price_czk ? Number(body.hammer_price_czk) : null,
      currency: body.currency || "CZK",
      original_amount: Number(body.price_czk) || 0,
      price_type: body.price_type || "marketplace",
      verification_level: body.verification_level || "verified",
      verification_source_type: body.verification_source_type || "shop",
      verification_signature: body.verification_signature || generateVerificationSignature({ id, ...body }),
      sale_date: body.sale_date || new Date().toISOString().slice(0, 10),
      city: body.city || "Prague",
      lat: body.lat ? Number(body.lat) : 50.087,
      lng: body.lng ? Number(body.lng) : 14.421,
      location_precision: body.location_precision || "city",
      is_sample: body.is_sample ? 1 : 0,
      status: body.status || "sold",
      note: body.note || null,
    };

    stmt.run(sanitized);

    const inserted = db.prepare(`SELECT * FROM historical_transactions WHERE id = ?`).get(id);
    return NextResponse.json({ success: true, record: inserted }, { status: 201 });
  } catch (error) {
    console.error("POST /api/historical error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/historical - real-time transaction deletion (Master Panel)
export async function DELETE(request) {
  const denied = denyIfReadOnly();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id parameter" }, { status: 400 });
    }

    const db = getDb();
    const res = db.prepare(`DELETE FROM historical_transactions WHERE id = ?`).run(id);

    return NextResponse.json({ success: true, deleted: res.changes > 0 });
  } catch (error) {
    console.error("DELETE /api/historical error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
