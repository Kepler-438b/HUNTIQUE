import { NextResponse } from "next/server";
import { getMarketplaceLotById, deleteMarketplaceLot, addInteraction } from "@/lib/db/index.js";
import { denyIfReadOnly } from "@/lib/security.js";

// GET /api/marketplace/:id - fetch single lot with real-time bids/proposals
export async function GET(request, context) {
  try {
    const { id } = await context.params;
    const lot = getMarketplaceLotById(id);
    if (!lot) {
      return NextResponse.json({ success: false, error: "Lot not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, lot });
  } catch (error) {
    console.error("GET /api/marketplace/:id error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/marketplace/:id - submit real-time bid, counter-offer, or proposal
export async function POST(request, context) {
  const denied = denyIfReadOnly();
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body.userEmail) {
      return NextResponse.json({ success: false, error: "userEmail is required" }, { status: 400 });
    }

    const updatedLot = addInteraction(id, {
      userEmail: body.userEmail,
      userName: body.userName || body.userEmail.split("@")[0],
      interactionType: body.interactionType || "bid",
      amount: Number(body.amount) || null,
      note: body.note || null,
    });

    return NextResponse.json({ success: true, lot: updatedLot });
  } catch (error) {
    console.error("POST /api/marketplace/:id error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/marketplace/:id - delete lot
export async function DELETE(request, context) {
  const denied = denyIfReadOnly();
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const deleted = deleteMarketplaceLot(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("DELETE /api/marketplace/:id error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
