import { NextResponse } from "next/server";
import { getMarketplaceLots, createMarketplaceLot } from "@/lib/db/index.js";
import { denyIfReadOnly } from "@/lib/security.js";

// GET /api/marketplace - query listings & requests with real-time filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      type: searchParams.get("type") || "all",
      category: searchParams.get("category") || "all",
      status: searchParams.get("status") || "active",
      userEmail: searchParams.get("userEmail") || null,
      q: searchParams.get("q") || "",
    };

    const lots = getMarketplaceLots(filters);
    return NextResponse.json({ success: true, count: lots.length, lots });
  } catch (error) {
    console.error("GET /api/marketplace error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/marketplace - create new offer or request in real-time
export async function POST(request) {
  const denied = denyIfReadOnly();
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const lot = createMarketplaceLot(body);
    return NextResponse.json({ success: true, lot }, { status: 201 });
  } catch (error) {
    console.error("POST /api/marketplace error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
