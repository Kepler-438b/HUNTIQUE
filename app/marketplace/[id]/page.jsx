"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useStore, useAuth } from "@/lib/store";
import AuthModal from "@/components/AuthModal";

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { offers, requests, addBid, addProposal } = useStore();
  const { user, isAuthenticated } = useAuth();

  // Find listing either in offers or requests
  const item = offers.find((o) => o.id === id) || requests.find((r) => r.id === id);

  // Carousel state
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Action modals
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [bidInput, setBidInput] = useState("");
  const [actionSuccess, setActionSuccess] = useState(false);

  if (!item) {
    return (
      <main className="page" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2>Listing Not Found</h2>
        <p className="muted">The requested antique listing could not be found or has been concluded.</p>
        <Link href="/marketplace" className="btn btn-primary" style={{ marginTop: 14 }}>
          ← Back to Marketplace
        </Link>
      </main>
    );
  }

  const isOffer = item.type === "offer" || !item.type;
  const images = item.images && item.images.length > 0 ? item.images : [
    "https://images.unsplash.com/photo-1580481077197-9b29a6d7d100?auto=format&fit=crop&w=1000&q=80"
  ];

  // Similar items (same category, different id)
  const similarItems = (isOffer ? offers : requests)
    .filter((x) => x.id !== item.id && (x.category === item.category || !x.category))
    .slice(0, 3);

  const handleActionClick = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setBidInput(isOffer ? (item.minNextBid || item.currentBid + 500) : item.targetBudget);
    setActionSuccess(false);
    setActionModalOpen(true);
  };

  const handleSubmitAction = (e) => {
    e.preventDefault();
    if (isOffer) {
      addBid(item.id, {
        user: user.name,
        amount: Number(bidInput) || item.minNextBid,
        date: new Date().toISOString().slice(0, 10),
      });
    } else {
      addProposal(item.id, {
        from: user.name,
        amount: bidInput,
        note: "Direct offer submitted via listing page.",
      });
    }
    setActionSuccess(true);
  };

  return (
    <main className="page listing-detail-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/">Home</Link> <span>/</span>
        <Link href="/marketplace">Marketplace</Link> <span>/</span>
        <span className="muted">{item.title}</span>
      </div>

      <div className="detail-layout">
        {/* Left Column: Photo Carousel */}
        <div className="detail-gallery-col">
          <div className="carousel-main-container">
            <img
              src={images[activeImgIndex]}
              alt={item.title}
              className="carousel-main-image"
            />
            {images.length > 1 && (
              <>
                <button
                  className="carousel-nav-btn prev"
                  onClick={() =>
                    setActiveImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                  }
                  title="Previous Photo"
                >
                  ‹
                </button>
                <button
                  className="carousel-nav-btn next"
                  onClick={() =>
                    setActiveImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                  }
                  title="Next Photo"
                >
                  ›
                </button>
              </>
            )}
            <div className="carousel-count-badge">
              {activeImgIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="carousel-thumbs">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`thumb-btn ${activeImgIndex === idx ? "active" : ""}`}
                  onClick={() => setActiveImgIndex(idx)}
                >
                  <img src={img} alt={`view ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Price Analytics Card */}
          <div className="analytics-box">
            <div className="analytics-header">
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, textTransform: "uppercase" }}>
                  Historical Price Analytics
                </h4>
                <div className="muted small">Benchmark based on authenticated transaction data</div>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-metric">
                <div className="muted small">Category Median</div>
                <div className="analytics-val">{item.analytics?.marketMedian || "18,500 Kč"}</div>
              </div>
              <div className="analytics-metric">
                <div className="muted small">Comparable Trades</div>
                <div className="analytics-val">{item.analytics?.historicalSalesCount || "12"} sales</div>
              </div>
              <div className="analytics-metric">
                <div className="muted small">Historical Trend</div>
                <div className="analytics-val" style={{ color: "var(--verified)" }}>
                  {item.analytics?.trend || "+7.2% / 3 yrs"}
                </div>
              </div>
            </div>

            <div className="analytics-footer">
              <span>Source Archive:</span>{" "}
              {item.analytics?.sourceUrl?.startsWith("http") ? (
                <a href={item.analytics.sourceUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
                  {item.analytics.sourceName} ↗
                </a>
              ) : (
                <Link href={item.analytics?.sourceUrl || "/historical"} style={{ fontWeight: 700 }}>
                  {item.analytics?.sourceName || "HUNTIQUE Historical Archive"} →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Key Info, Pricing, Action */}
        <div className="detail-info-col">
          <div className="detail-tags-row">
            <span className={`lot-badge ${item.sellerType || "shop"}`}>
              {isOffer ? item.tag || "Item For Sale" : "Ready Demand"}
            </span>
            <span className="muted small">
              {item.category?.toUpperCase()} {item.subcategory ? `· ${item.subcategory}` : ""}
            </span>
          </div>

          <h1 className="detail-title">{item.title}</h1>

          {/* Pricing Box */}
          <div className="detail-price-box">
            <div>
              <div className="detail-price-lbl">
                {isOffer ? "Current Leading Offer" : "Target Buyer Budget"}
              </div>
              <div className="detail-price-val">
                {isOffer ? `${item.currentBid?.toLocaleString("cs-CZ")} Kč` : item.targetBudget}
              </div>
              {isOffer && item.minNextBid && (
                <div className="muted small">
                  Minimum next bid increment: {item.minNextBid.toLocaleString("cs-CZ")} Kč
                </div>
              )}
            </div>

            <div style={{ textAlign: "right" }}>
              <div className="detail-time-tag">
                {isOffer ? `Ends in ${item.endsIn}` : "Active Ready Demand"}
              </div>
              <div className="muted small" style={{ marginTop: 4 }}>
                {isOffer ? `${item.bidsCount || 0} counter-offers placed` : `${item.responsesCount || 0} seller proposals`}
              </div>
            </div>
          </div>

          {/* Action Button & Auth Restriction Banner */}
          <div className="detail-action-card">
            {isAuthenticated ? (
              <div>
                <button
                  className={`btn ${isOffer ? "btn-primary" : "btn-dark"} btn-large`}
                  style={{ width: "100%", fontSize: 16 }}
                  onClick={handleActionClick}
                >
                  {isOffer ? "Place Counter-Offer / Bid" : "I Have This Item (Submit Proposal)"}
                </button>
                <div className="muted small" style={{ textAlign: "center", marginTop: 8 }}>
                  Logged in as <strong>{user.email}</strong>. Deal concluded upon mutual acceptance.
                </div>
              </div>
            ) : (
              <div>
                <button
                  className="btn btn-primary btn-large"
                  style={{ width: "100%", fontSize: 15 }}
                  onClick={() => setAuthModalOpen(true)}
                >
                  Sign In to {isOffer ? "Place a Bid" : "Contact Buyer"}
                </button>
                <div className="auth-notice-box">
                  <strong>Notice:</strong> To preserve antique provenance and prevent fraudulent bidding, placing counter-offers and contacting sellers/buyers is restricted to registered members.
                </div>
              </div>
            )}
          </div>

          {/* Provenance & Item Specs */}
          <div className="detail-specs-card">
            <h3 style={{ fontSize: 15, fontWeight: 800, textTransform: "uppercase", margin: "0 0 12px" }}>
              Item Provenance &amp; Specifications
            </h3>
            <dl className="kv">
              <dt>{isOffer ? "Seller" : "Buyer"}</dt>
              <dd><strong>{isOffer ? item.seller : item.buyer}</strong></dd>
              <dt>Location</dt>
              <dd>{item.city}, Czech Republic</dd>
              {item.maker && (
                <>
                  <dt>Maker / Studio</dt>
                  <dd>{item.maker}</dd>
                </>
              )}
              {item.year && (
                <>
                  <dt>Period</dt>
                  <dd>{item.year}</dd>
                </>
              )}
              {item.targetYears && (
                <>
                  <dt>Target Years</dt>
                  <dd>{item.targetYears}</dd>
                </>
              )}
              {item.condition && (
                <>
                  <dt>Condition</dt>
                  <dd>{item.condition}</dd>
                </>
              )}
            </dl>

            <div style={{ marginTop: 14 }}>
              <div className="muted small" style={{ fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                Description
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--ink)" }}>
                {item.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Items Section */}
      {similarItems.length > 0 && (
        <section className="similar-section">
          <div className="section-head">
            <span className="section-kicker">Market Comparables</span>
            <h3 style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", margin: "4px 0 0" }}>
              Similar Items in {item.category?.toUpperCase()}
            </h3>
          </div>

          <div className="auction-grid">
            {similarItems.map((sim) => (
              <div key={sim.id} className="lot-card">
                <Link href={`/marketplace/${sim.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="lot-img-placeholder">
                    {sim.images?.[0] ? (
                      <img src={sim.images[0]} alt={sim.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div className="lot-img-fallback">{sim.category?.toUpperCase()}</div>
                    )}
                    <span className={`lot-badge ${sim.sellerType || "shop"}`}>
                      {sim.type === "request" ? "Wanted" : "For Sale"}
                    </span>
                  </div>
                  <div className="lot-body">
                    <div className="lot-meta">{sim.city} · {sim.year || sim.targetYears}</div>
                    <h4 className="lot-title">{sim.title}</h4>
                    <div className="lot-pricing" style={{ marginTop: "auto", paddingTop: 10 }}>
                      <div className="lot-bid-val">
                        {sim.type === "request" ? sim.targetBudget : `${sim.currentBid?.toLocaleString("cs-CZ")} Kč`}
                      </div>
                      <span className="btn btn-outline btn-small">View →</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action Modal (Bid or Proposal) */}
      {actionModalOpen && (
        <div className="modal-overlay" onClick={() => setActionModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isOffer ? `Place Bid for ${item.title}` : `Propose Item to ${item.buyer}`}</h3>
              <button className="close-btn" onClick={() => setActionModalOpen(false)}>✕</button>
            </div>

            {actionSuccess ? (
              <div className="modal-body text-center" style={{ padding: "30px 20px" }}>
                <h4>{isOffer ? "Your Bid Has Been Placed!" : "Proposal Delivered to Buyer!"}</h4>
                <p className="muted">
                  {isOffer
                    ? `You offered ${Number(bidInput).toLocaleString("cs-CZ")} Kč. You are currently leading the bidding.`
                    : `Your offer has been communicated directly to ${item.buyer}.`}
                </p>
                <button className="btn btn-primary" onClick={() => setActionModalOpen(false)}>
                  Done
                </button>
              </div>
            ) : (
              <form className="modal-body" onSubmit={handleSubmitAction}>
                <div className="note" style={{ marginBottom: 14 }}>
                  <strong>{item.title}</strong>
                  <br />
                  {isOffer ? `Current bid: ${item.currentBid.toLocaleString("cs-CZ")} Kč` : `Buyer Budget: ${item.targetBudget}`}
                </div>

                <div className="form-group">
                  <label>{isOffer ? "Your Offer Amount (Kč)" : "Your Asking Price"}</label>
                  <input
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    required
                  />
                  {isOffer && (
                    <span className="muted small" style={{ display: "block", marginTop: 4 }}>
                      Minimum recommended bid: {item.minNextBid?.toLocaleString("cs-CZ")} Kč
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label>Message / Terms</label>
                  <textarea rows={2} defaultValue="Ready for transaction upon confirmation." />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setActionModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {isOffer ? "Confirm & Place Bid" : "Send Proposal"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode="signin" />
    </main>
  );
}
