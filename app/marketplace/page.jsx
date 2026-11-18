"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore, useAuth } from "@/lib/store";

export default function MarketplacePage() {
  const { offers, requests } = useStore();
  const { isAuthenticated } = useAuth();
  const [section, setSection] = useState("offers"); // "offers" | "requests"
  const [filterType, setFilterType] = useState("all");

  const filteredOffers =
    filterType === "all" ? offers : offers.filter((l) => l.sellerType === filterType);

  return (
    <main className="page marketplace-page">
      <div className="marketplace-header">
        <div>
          <span className="section-kicker">HUNTIQUE Trading Floor</span>
          <h1 style={{ margin: "4px 0 8px", fontSize: 28, fontWeight: 900, textTransform: "uppercase" }}>
            Marketplace &amp; Bidding
          </h1>
          <p className="muted" style={{ maxWidth: 740, fontSize: 14 }}>
            Trade authentic Czech antiques with price intelligence. Click any card to inspect full photo galleries, condition reports, historical price benchmarks, and participate in active bidding.
          </p>
        </div>
        <div>
          <Link href="/account" className="btn btn-secondary">
            {isAuthenticated ? "My Cabinet & Listings" : "Sign In to Publish Listings"}
          </Link>
        </div>
      </div>

      {/* Main Two Sections Navigation */}
      <div className="marketplace-main-tabs">
        <button
          className={`main-tab-pill ${section === "offers" ? "active" : ""}`}
          onClick={() => setSection("offers")}
        >
          1 · Offers / For Sale ({offers.length})
        </button>
        <button
          className={`main-tab-pill ${section === "requests" ? "active" : ""}`}
          onClick={() => setSection("requests")}
        >
          2 · Buy Requests / Ready Demand ({requests.length})
        </button>
      </div>

      {/* SECTION 1: OFFERS (Items for sale) */}
      {section === "offers" && (
        <div>
          <div className="marketplace-controls">
            <div className="filter-tabs">
              <button
                className={`tab-btn ${filterType === "all" ? "active" : ""}`}
                onClick={() => setFilterType("all")}
              >
                All Offers ({offers.length})
              </button>
              <button
                className={`tab-btn ${filterType === "private" ? "active" : ""}`}
                onClick={() => setFilterType("private")}
              >
                Private Individuals ({offers.filter((l) => l.sellerType === "private").length})
              </button>
              <button
                className={`tab-btn ${filterType === "shop" ? "active" : ""}`}
                onClick={() => setFilterType("shop")}
              >
                Antique Shops ({offers.filter((l) => l.sellerType === "shop").length})
              </button>
            </div>
            <div className="muted small">
              To list an antique for sale, open your{" "}
              <Link href="/account" style={{ textDecoration: "underline", fontWeight: 700 }}>
                Personal Cabinet
              </Link>
            </div>
          </div>

          <div className="auction-grid">
            {filteredOffers.map((lot) => (
              <div key={lot.id} className="lot-card">
                <Link href={`/marketplace/${lot.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="lot-img-placeholder">
                    {lot.images?.[0] ? (
                      <img
                        src={lot.images[0]}
                        alt={lot.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="lot-img-fallback">{lot.category?.toUpperCase()}</div>
                    )}
                    <span className={`lot-badge ${lot.sellerType}`}>{lot.tag || "For Sale"}</span>
                  </div>
                </Link>

                <div className="lot-body">
                  <div className="lot-meta">
                    <span>{lot.category?.toUpperCase()}</span> · <span>{lot.city}</span> · <span>{lot.year}</span>
                  </div>
                  <Link href={`/marketplace/${lot.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <h3 className="lot-title">{lot.title}</h3>
                  </Link>
                  <p className="lot-desc-text">{lot.description}</p>
                  <div className="lot-seller">
                    Seller: <strong>{lot.seller}</strong>
                  </div>
                  <div className="lot-pricing">
                    <div>
                      <div className="lot-bid-lbl">Leading Offer</div>
                      <div className="lot-bid-val">{lot.currentBid?.toLocaleString("cs-CZ")} Kč</div>
                    </div>
                    <div className="lot-time">
                      Ends in: {lot.endsIn} <br />
                      <span className="muted small">{lot.bidsCount || 0} bids placed</span>
                    </div>
                  </div>
                  <div className="lot-actions">
                    <Link href={`/marketplace/${lot.id}`} className="btn btn-primary btn-small">
                      Inspect &amp; Bid →
                    </Link>
                    <Link href="/historical" className="btn btn-outline btn-small">
                      Price Archive
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: REQUESTS (Ready Demand / Wanted Items) */}
      {section === "requests" && (
        <div>
          <div className="note" style={{ borderLeftColor: "var(--black)", marginBottom: 20 }}>
            <strong>Ready Demand Marketplace:</strong> Collectors and dealers actively seeking specific items with committed budgets. Click any request to view details, review target criteria, or submit an offer if you have the piece.
          </div>

          <div className="auction-grid">
            {requests.map((req) => (
              <div key={req.id} className="lot-card" style={{ borderColor: "#111" }}>
                <Link href={`/marketplace/${req.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="lot-img-placeholder" style={{ background: "#f3f4f6" }}>
                    {req.images?.[0] ? (
                      <img
                        src={req.images[0]}
                        alt={req.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="lot-img-fallback">{req.category?.toUpperCase()}</div>
                    )}
                    <span className="lot-badge request">Wanted Item</span>
                  </div>
                </Link>

                <div className="lot-body">
                  <div className="lot-meta">
                    <span>{req.category?.toUpperCase()}</span> · <span>{req.city}</span> · <span>{req.targetYears}</span>
                  </div>
                  <Link href={`/marketplace/${req.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <h3 className="lot-title">{req.title}</h3>
                  </Link>
                  <p className="lot-desc-text">{req.description}</p>
                  <div className="lot-seller">
                    Buyer: <strong>{req.buyer}</strong>
                  </div>
                  <div className="lot-pricing">
                    <div>
                      <div className="lot-bid-lbl">Target Budget</div>
                      <div className="lot-bid-val" style={{ color: "var(--black)" }}>
                        {req.targetBudget}
                      </div>
                    </div>
                    <div className="lot-time" style={{ color: "var(--verified)" }}>
                      <span className="ready-demand-badge">Committed Budget</span> <br />
                      <span className="muted small">{req.responsesCount || 0} offers received</span>
                    </div>
                  </div>
                  <div className="lot-actions">
                    <Link href={`/marketplace/${req.id}`} className="btn btn-dark btn-small">
                      I Have This Piece →
                    </Link>
                    <Link href="/historical" className="btn btn-outline btn-small">
                      Past Trades
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
