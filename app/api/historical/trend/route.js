import { NextResponse } from "next/server";
import { computeTrendStats } from "@/lib/db/index.js";

// GET /api/historical/trend?subcategory=chair&maker=Thonet
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subcategory = searchParams.get("subcategory");
    const maker = searchParams.get("maker");

    if (!subcategory || !maker) {
      return NextResponse.json({ success: false, error: "Missing subcategory or maker" }, { status: 400 });
    }

    const stats = computeTrendStats(subcategory, maker);
    return NextResponse.json({ success: true, ...stats });
  } catch (error) {
    console.error("GET /api/historical/trend error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
