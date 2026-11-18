"use client";
import { useState } from "react";
import { useAuth, useStore } from "@/lib/store";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { offers, requests, addOffer, addRequest, deleteListing } = useStore();
  const [activeTab, setActiveTab] = useState("my-listings"); // "my-listings" | "new-offer" | "new-request"
  const [authOpen, setAuthOpen] = useState(false);

  // Form states for Sell Offer
  const [offerTitle, setOfferTitle] = useState("");
  const [offerCategory, setOfferCategory] = useState("furniture");
  const [offerSubcategory, setOfferSubcategory] = useState("chair");
  const [offerMaker, setOfferMaker] = useState("");
  const [offerPeriod, setOfferPeriod] = useState("");
  const [offerCity, setOfferCity] = useState("Prague");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerDesc, setOfferDesc] = useState("");
  const [offerCondition, setOfferCondition] = useState("");
  const [offerSellerType, setOfferSellerType] = useState("private");
  const [offerSuccess, setOfferSuccess] = useState(false);

  // Form states for Buy Request
  const [reqTitle, setReqTitle] = useState("");
  const [reqCategory, setReqCategory] = useState("furniture");
  const [reqCity, setReqCity] = useState("Prague");
  const [reqBudget, setReqBudget] = useState("");
  const [reqTargetYears, setReqTargetYears] = useState("");
  const [reqDesc, setReqDesc] = useState("");
  const [reqSuccess, setReqSuccess] = useState(false);

  if (!isAuthenticated) {
    return (
      <main className="page" style={{ maxWidth: 640, textAlign: "center", padding: "80px 20px" }}>
        <h1 style={{ textTransform: "uppercase", fontWeight: 900 }}>Personal Cabinet</h1>
        <p className="muted" style={{ fontSize: 16, marginBottom: 28 }}>
          Please sign in or create an account to publish antique listings (Offers &amp; Buy Requests) and manage your active trade proposals.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <button className="btn btn-primary" onClick={() => setAuthOpen(true)}>
            Sign In / Register
          </button>
          <Link href="/" className="btn btn-outline">
            Back to Home
          </Link>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </main>
    );
  }

  // Filter listings published by the current user
  const myOffers = offers.filter(
    (o) => o.userEmail === user.email || o.seller?.includes(user.name)
  );
  const myRequests = requests.filter(
    (r) => r.userEmail === user.email || r.buyer?.includes(user.name)
  );

  const handleCreateOffer = (e) => {
    e.preventDefault();
    if (!offerTitle || !offerPrice) return;
    addOffer({
      title: offerTitle,
      category: offerCategory,
      subcategory: offerSubcategory,
      maker: offerMaker || "Czech Workshop",
      period: offerPeriod || "Antique",
      city: offerCity,
      currentBid: Number(offerPrice),
      description: offerDesc || "Authentic collector item in verified condition.",
      condition: offerCondition || "Stable preserved state.",
      seller: `${user.name} (${offerSellerType === "shop" ? "Licensed Dealer" : "Private Collector"})`,
      sellerType: offerSellerType,
      userEmail: user.email,
      icon: offerCategory.toUpperCase(),
    });
    setOfferSuccess(true);
    setTimeout(() => {
      setOfferSuccess(false);
      setActiveTab("my-listings");
      // reset
      setOfferTitle("");
      setOfferPrice("");
      setOfferDesc("");
    }, 1200);
  };

  const handleCreateRequest = (e) => {
    e.preventDefault();
    if (!reqTitle || !reqBudget) return;
    addRequest({
      title: reqTitle,
      category: reqCategory,
      city: reqCity,
      targetBudget: reqBudget,
      targetYears: reqTargetYears || "Any vintage period",
      description: reqDesc || "Actively seeking this item with ready payment.",
      buyer: `${user.name} (Ready Buyer)`,
      buyerType: "private",
      userEmail: user.email,
      icon: reqCategory.toUpperCase(),
    });
    setReqSuccess(true);
    setTimeout(() => {
      setReqSuccess(false);
      setActiveTab("my-listings");
      // reset
      setReqTitle("");
      setReqBudget("");
      setReqDesc("");
    }, 1200);
  };

  return (
    <main className="page" style={{ maxWidth: 1140, paddingBottom: 80 }}>
      {/* Profile Header */}
      <div className="cabinet-header">
        <div>
          <span className="section-kicker">User Dashboard</span>
          <h1 style={{ margin: "4px 0 6px", fontSize: 28, fontWeight: 900, textTransform: "uppercase" }}>
            Personal Cabinet
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Logged in as <strong>{user.email}</strong> · Member since {user.joinedAt || "2026"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin" className="btn btn-outline btn-small">
            Master Moderation Panel
          </Link>
          <button onClick={logout} className="btn btn-secondary btn-small">
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="cabinet-tabs">
        <button
          className={`cabinet-tab-btn ${activeTab === "my-listings" ? "active" : ""}`}
          onClick={() => setActiveTab("my-listings")}
        >
          My Listings ({myOffers.length + myRequests.length})
        </button>
        <button
          className={`cabinet-tab-btn ${activeTab === "new-offer" ? "active" : ""}`}
          onClick={() => setActiveTab("new-offer")}
        >
          Post Item for Sale (Sell Offer)
        </button>
        <button
          className={`cabinet-tab-btn ${activeTab === "new-request" ? "active" : ""}`}
          onClick={() => setActiveTab("new-request")}
        >
          Post Buy Request (Ready Demand)
        </button>
      </div>

      {/* TAB 1: MY LISTINGS */}
      {activeTab === "my-listings" && (
        <div>
          {myOffers.length === 0 && myRequests.length === 0 ? (
            <div className="empty-cabinet-box">
              <h3>You have not published any listings yet</h3>
              <p className="muted" style={{ maxWidth: 500, margin: "0 auto 20px" }}>
                Use the buttons above to post an antique item for sale (Sell Offer) or publish a buy request with your target budget (Buy Request).
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button className="btn btn-primary" onClick={() => setActiveTab("new-offer")}>
                  Post Item for Sale
                </button>
                <button className="btn btn-dark" onClick={() => setActiveTab("new-request")}>
                  Post Buy Request
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* My Offers */}
              {myOffers.length > 0 && (
                <div style={{ marginBottom: 36 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, textTransform: "uppercase", marginBottom: 14 }}>
                    Items for Sale ({myOffers.length})
                  </h3>
                  <div className="cabinet-listings-grid">
                    {myOffers.map((lot) => (
                      <div key={lot.id} className="cabinet-item-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <span className="badge-verification verified">FOR SALE</span>
                          <span className="muted small">Ends in {lot.endsIn}</span>
                        </div>
                        <h4 style={{ margin: "0 0 6px", fontSize: 16 }}>{lot.title}</h4>
                        <div className="muted small" style={{ marginBottom: 10 }}>
                          {lot.category.toUpperCase()} · {lot.city} · {lot.maker}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "auto", borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                          <div>
                            <div className="muted small">Current Leading Bid</div>
                            <div className="price-tag-big">{lot.currentBid.toLocaleString("cs-CZ")} Kč</div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Link href={`/marketplace/${lot.id}`} className="btn btn-outline btn-small">
                              View Page
                            </Link>
                            <button
                              onClick={() => deleteListing(lot.id)}
                              className="btn btn-small"
                              style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}
                              title="Delete Listing"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* My Requests */}
              {myRequests.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, textTransform: "uppercase", marginBottom: 14 }}>
                    Buy Requests &amp; Ready Demand ({myRequests.length})
                  </h3>
                  <div className="cabinet-listings-grid">
                    {myRequests.map((req) => (
                      <div key={req.id} className="cabinet-item-card" style={{ borderLeft: "4px solid var(--black)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <span className="ready-demand-badge">BUY REQUEST</span>
                          <span className="muted small">{req.responsesCount || 0} Proposals</span>
                        </div>
                        <h4 style={{ margin: "0 0 6px", fontSize: 16 }}>{req.title}</h4>
                        <div className="muted small" style={{ marginBottom: 10 }}>
                          {req.category.toUpperCase()} · {req.city} · Target: {req.targetYears}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "auto", borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                          <div>
                            <div className="muted small">Target Budget</div>
                            <div style={{ fontSize: 17, fontWeight: 800 }}>{req.targetBudget}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Link href={`/marketplace/${req.id}`} className="btn btn-outline btn-small">
                              View Page
                            </Link>
                            <button
                              onClick={() => deleteListing(req.id)}
                              className="btn btn-small"
                              style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}
                              title="Delete Request"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POST ITEM FOR SALE (SELL OFFER) */}
      {activeTab === "new-offer" && (
        <div className="cabinet-form-container">
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, textTransform: "uppercase", margin: "0 0 4px" }}>
              Publish an Antique Item for Sale
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Your item will appear on the Marketplace under Offers, where collectors and dealers can submit bids and counter-offers.
            </p>
          </div>

          {offerSuccess ? (
            <div className="note" style={{ background: "#f0fdf4", borderLeftColor: "#16a34a", padding: "20px", textAlign: "center" }}>
              <h4 style={{ margin: "8px 0" }}>Listing successfully created!</h4>
              <p className="muted">Redirecting to your listings...</p>
            </div>
          ) : (
            <form onSubmit={handleCreateOffer}>
              <div className="form-group">
                <label>Seller Type</label>
                <div className="radio-toggle">
                  <button
                    type="button"
                    className={`toggle-option ${offerSellerType === "private" ? "active" : ""}`}
                    onClick={() => setOfferSellerType("private")}
                  >
                    Private Individual
                  </button>
                  <button
                    type="button"
                    className={`toggle-option ${offerSellerType === "shop" ? "active" : ""}`}
                    onClick={() => setOfferSellerType("shop")}
                  >
                    Antique Shop / Gallery
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Item Title</label>
                <input
                  placeholder="e.g. Biedermeier Cherrywood Console Table or Thonet Chair No. 14"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  required
                />
              </div>

              <div className="row2">
                <div className="form-group">
                  <label>Category</label>
                  <select value={offerCategory} onChange={(e) => setOfferCategory(e.target.value)}>
                    <option value="furniture">Furniture</option>
                    <option value="tableware">Tableware &amp; Glass</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Subcategory</label>
                  <input
                    placeholder="chair, vase, table, decanter..."
                    value={offerSubcategory}
                    onChange={(e) => setOfferSubcategory(e.target.value)}
                  />
                </div>
              </div>

              <div className="row2">
                <div className="form-group">
                  <label>Maker / Workshop</label>
                  <input
                    placeholder="e.g. Gebrüder Thonet, Moser, Pirkenhammer..."
                    value={offerMaker}
                    onChange={(e) => setOfferMaker(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Period / Year</label>
                  <input
                    placeholder="e.g. ca. 1840 or Art Deco (1925)"
                    value={offerPeriod}
                    onChange={(e) => setOfferPeriod(e.target.value)}
                  />
                </div>
              </div>

              <div className="row2">
                <div className="form-group">
                  <label>City in Czechia</label>
                  <input
                    placeholder="Prague, Brno, Plzeň..."
                    value={offerCity}
                    onChange={(e) => setOfferCity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Starting / Desired Price (Kč)</label>
                  <input
                    type="number"
                    placeholder="e.g. 24000"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description &amp; Provenance</label>
                <textarea
                  rows={3}
                  placeholder="Detail marks, stamps, labels, history, or previous ownership..."
                  value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Preservation State &amp; Condition</label>
                <input
                  placeholder="e.g. Original lacquer, no chips, solid wood joints..."
                  value={offerCondition}
                  onChange={(e) => setOfferCondition(e.target.value)}
                />
              </div>

              <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px" }}>
                  Publish Item to Marketplace
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab("my-listings")}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: POST BUY REQUEST (READY DEMAND) */}
      {activeTab === "new-request" && (
        <div className="cabinet-form-container">
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, textTransform: "uppercase", margin: "0 0 4px" }}>
              Publish a Buy Request (Ready Demand)
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Specify the antique piece you want to purchase and your committed budget. Sellers and dealers with matching items will reach out with proposals.
            </p>
          </div>

          {reqSuccess ? (
            <div className="note" style={{ background: "#f0fdf4", borderLeftColor: "#16a34a", padding: "20px", textAlign: "center" }}>
              <h4 style={{ margin: "8px 0" }}>Buy Request successfully posted!</h4>
              <p className="muted">Redirecting to your listings...</p>
            </div>
          ) : (
            <form onSubmit={handleCreateRequest}>
              <div className="form-group">
                <label>Wanted Item Title &amp; Specification</label>
                <input
                  placeholder="e.g. Jindřich Halabala Armchair H-269 or Set of 4 Thonet No. 14 chairs"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  required
                />
              </div>

              <div className="row2">
                <div className="form-group">
                  <label>Category</label>
                  <select value={reqCategory} onChange={(e) => setReqCategory(e.target.value)}>
                    <option value="furniture">Antique Furniture</option>
                    <option value="tableware">Historical Tableware &amp; Glass</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Budget (CZK)</label>
                  <input
                    placeholder="e.g. 45,000 Kč"
                    value={reqBudget}
                    onChange={(e) => setReqBudget(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row2">
                <div className="form-group">
                  <label>Target Era / Production Years</label>
                  <input
                    placeholder="e.g. 1998–2002 or ca. 1840"
                    value={reqTargetYears}
                    onChange={(e) => setReqTargetYears(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Your City in Czechia</label>
                  <input
                    placeholder="Prague, Brno, Plzeň..."
                    value={reqCity}
                    onChange={(e) => setReqCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Requirements &amp; Preferred Criteria</label>
                <textarea
                  rows={3}
                  placeholder="Specify desired condition, box/papers, hallmarks, matching grain..."
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                />
              </div>

              <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                <button type="submit" className="btn btn-dark" style={{ padding: "12px 24px" }}>
                  Publish Buy Request
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveTab("my-listings")}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </main>
  );
}
