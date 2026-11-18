"use client";
import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [sellerType, setSellerType] = useState("private");
  const [submitted, setSubmitted] = useState(false);

  // Demo cosmetic listings for preview
  const demoLots = [
    {
      id: 1,
      title: "Thonet Armchair No. A811 (Design by Josef Hoffmann)",
      category: "Furniture",
      seller: "Starožitnosti u Karlova mostu",
      sellerType: "shop",
      city: "Prague",
      year: "ca. 1930",
      currentBid: 18500,
      bidsCount: 6,
      endsIn: "2 days",
      tag: "Shop / Gallery",
      image: "CHAIR",
    },
    {
      id: 2,
      title: "Moser Crystal Vase with Gold Acid-Etched Relief",
      category: "Tableware",
      seller: "Martin K. (Collector)",
      sellerType: "private",
      city: "Karlovy Vary",
      year: "1925",
      currentBid: 12000,
      bidsCount: 9,
      endsIn: "5 hours",
      tag: "Private Individual",
      image: "VASE",
    },
    {
      id: 3,
      title: "Jindřich Halabala Armchair Model H-269 (UP Závody)",
      category: "Furniture",
      seller: "Private Buyer (Ready Demand)",
      sellerType: "request",
      city: "Prague",
      year: "ca. 1935",
      currentBid: 42000,
      bidsCount: 5,
      endsIn: "Active Request",
      tag: "Ready Demand",
      image: "CHAIR",
    },
    {
      id: 4,
      title: "Pirkenhammer Porcelain Tea Set (Březová)",
      category: "Tableware",
      seller: "Jana V.",
      sellerType: "private",
      city: "Plzeň",
      year: "1910",
      currentBid: 8500,
      bidsCount: 11,
      endsIn: "18 hours",
      tag: "Private Individual",
      image: "TEA",
    },
  ];

  const filteredLots = activeTab === "all" ? demoLots : demoLots.filter(l => l.sellerType === activeTab);

  return (
    <div className="landing">
      {/* Hero Section with mainImg.jpg */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-logo-wrap" style={{ marginBottom: 18 }}>
            <img
              src="/huntiqueLogo.png"
              alt="HUNTIQUE"
              style={{ width: 100, height: 100, objectFit: "contain", borderRadius: 8 }}
            />
          </div>
          <div className="hero-badge">Czech Antique Trade Ecosystem</div>
          <h1 className="hero-title">
            <span className="brand-accent">HUNTIQUE</span> — an intelligence platform for antiques, Historical Archives and Auctions
          </h1>
          <p className="hero-subtitle">
            Intelligence platform for collectors, restorers, and antique dealers. View verified transactions and detailed transaction histories, and conduct transactions on our platform with 0% commission.
          </p>

          <div className="hero-actions">
            <Link href="/historical" className="btn btn-primary btn-large">
              Historical Transactions
            </Link>
            <Link href="/analysis" className="btn btn-secondary btn-large">
              Price Map Analytics
            </Link>
            <Link href="/marketplace" className="btn btn-dark btn-large">
              Marketplace &amp; Requests
            </Link>
          </div>
        </div>
      </section>

      {/* Main Pillars Section */}
      <section className="features-section">
        <div className="section-head text-center">
          <span className="section-kicker">Core Pillars of HUNTIQUE</span>
          <h2>A Complete Infrastructure for the Antique Market</h2>
          <p className="section-desc">
            Bridging documented auction archives with an active two-way marketplace for offers and ready buyer demand.
          </p>
        </div>

        <div className="feature-grid">
          {/* Pillar 1: Historical Archive & Price Map */}
          <div className="feature-card highlighted">
            <div className="feature-pill">Pillar 1 · Intelligence</div>
            <div className="feature-icon">[ARCHIVE]</div>
            <h3>Historical Transactions Archive &amp; Map</h3>
            <p className="feature-text">
              Detailed transaction dossiers tracking what, where, when, and for how much items were traded in the Czech Republic (Prague, Brno, Plzeň, Karlovy Vary, and more).
            </p>
            <ul className="feature-list">
              <li>
                <strong>Detailed transaction reports</strong>—information on lots, sale dates, hammer prices, and buyer’s premiums.
              </li>
              <li>
                <strong>Direct links to information providers</strong>, verified data from Arthouse Hejtmánek, Aukční dům Zezula, Sýpka, and partner galleries.
              </li>
              <li>
                <strong>Collection of information with varying levels of reliability</strong> to provide a comprehensive picture of the antiques market.
              </li>
              <li>
                <strong>Geospatial price map</strong>—a visual map showing price trends.
              </li>
            </ul>
            <div className="feature-footer">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/historical" className="btn btn-primary">
                  View Historical Archive →
                </Link>
                <Link href="/analysis" className="btn btn-secondary">
                  Open Price Map →
                </Link>
              </div>
            </div>
          </div>

          {/* Pillar 2: Marketplace (Offers & Requests) */}
          <div className="feature-card">
            <div className="feature-pill">Pillar 2 · Marketplace</div>
            <div className="feature-icon">[MARKET]</div>
            <h3>Marketplace: Offers &amp; Ready Demand</h3>
            <p className="feature-text">
              A dynamic two-sided marketplace connecting sellers with available items and buyers with committed budgets.
            </p>
            <ul className="feature-list">
              <li>
                <strong>1 — Listings:</strong> Antique items listed by private collectors and licensed antique dealers, with the option to submit counteroffers.
              </li>
              <li>
                <strong>2 — Requests:</strong> Buyers post specific items they are looking for, indicating their target budget.
              </li>
              <li>
                <strong>Direct negotiations:</strong> Sellers can fulfill active purchase requests with a single click, and buyers can make counteroffers on listed items.
              </li>
            </ul>
            <div className="feature-footer">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/marketplace" className="btn btn-dark">
                  Explore Marketplace →
                </Link>
                <button onClick={() => setShowModal(true)} className="btn btn-outline">
                  + Create Listing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Focus: Furniture & Tableware */}
      <section className="categories-strip">
        <div className="strip-container">
          <div className="strip-header">
            <h3>HUNTIQUE Specialization</h3>
            <p>Focused on fine antiques and collectible artifacts in the Czech Republic:</p>
          </div>
          <div className="cat-cards">
            <div className="cat-card">
              <div className="cat-badge">Category I</div>
              <h4>Antique Furniture</h4>
              <p>
                Bentwood classics by Thonet and J. &amp; J. Kohn, Biedermeier cherrywood elegance, Czech Secession,
                Art Deco, and functionalist masterworks. Viennese chairs, secretaires, commodes, and glass vitrines.
              </p>
            </div>
            <div className="cat-card">
              <div className="cat-badge">Category II</div>
              <h4>Historical Tableware, Glass &amp; Porcelain</h4>
              <p>
                Bohemian crystal and cut glass by Moser, porcelain by Pirkenhammer, Thun, Haas &amp; Czjzek,
                hallmarked silverware, and fine decorative collector artifacts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Auction Preview Section */}
      <section className="preview-auction-section">
        <div className="section-head">
          <div className="flex-between">
            <div>
              <span className="section-kicker">Marketplace Activity</span>
              <h2>Featured Offers &amp; Ready Demand</h2>
              <p className="section-desc">Active items for sale and high-priority buy requests from verified collectors.</p>
            </div>
            <div className="filter-tabs">
              <button className={`tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>All Items</button>
              <button className={`tab-btn ${activeTab === "shop" ? "active" : ""}`} onClick={() => setActiveTab("shop")}>Antique Shops</button>
              <button className={`tab-btn ${activeTab === "private" ? "active" : ""}`} onClick={() => setActiveTab("private")}>Private Sellers</button>
              <button className={`tab-btn ${activeTab === "request" ? "active" : ""}`} onClick={() => setActiveTab("request")}>Ready Demand</button>
            </div>
          </div>
        </div>

        <div className="auction-grid">
          {filteredLots.map((lot) => (
            <div key={lot.id} className="lot-card">
              <div className="lot-img-placeholder">
                <span className="lot-emoji">{lot.image}</span>
                <span className={`lot-badge ${lot.sellerType}`}>{lot.tag}</span>
              </div>
              <div className="lot-body">
                <div className="lot-meta">
                  <span>{lot.category}</span> · <span>{lot.city}</span> · <span>{lot.year}</span>
                </div>
                <h4 className="lot-title">{lot.title}</h4>
                <div className="lot-seller">
                  Party: <strong>{lot.seller}</strong>
                </div>
                <div className="lot-pricing">
                  <div>
                    <div className="lot-bid-lbl">
                      {lot.sellerType === "request" ? "Target Budget" : "Current Offer"}
                    </div>
                    <div className="lot-bid-val">{lot.currentBid.toLocaleString("cs-CZ")} Kč</div>
                  </div>
                  <div className="lot-time">
                    Ends in: {lot.endsIn} ({lot.bidsCount} interactions)
                  </div>
                </div>
                <div className="lot-actions">
                  <Link href="/marketplace" className="btn btn-small btn-primary">
                    View in Marketplace
                  </Link>
                  <Link href="/historical" className="btn btn-small btn-outline">
                    Check Historical
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps-section">
        <div className="section-head text-center">
          <span className="section-kicker">Simple &amp; Direct</span>
          <h2>How HUNTIQUE Works</h2>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <h4>List an Item or Post a Request</h4>
            <p>Publish an item for sale (Offer) or specify a coveted antique with your target budget (Buy Request).</p>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <h4>Direct Counter-Offers</h4>
            <p>Buyers submit price proposals or owners fulfill active requests. Counter-negotiate until terms align.</p>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <h4>Enrich the Historical Archive</h4>
            <p>Confirmed sales become part of the historical intelligence archive, increasing market clarity across Czechia.</p>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="trust-inner">
          <h3>Documented Trade Sources</h3>
          <p className="muted">
            The HUNTIQUE historical transaction archive integrates records from leading Czech auction institutions and certified dealers:
          </p>
          <div className="sources-pills">
            <span className="source-pill">Arthouse Hejtmánek</span>
            <span className="source-pill">Aukční dům Zezula</span>
            <span className="source-pill">Dorotheum Prague</span>
            <span className="source-pill">Aukční dům Sýpka</span>
            <span className="source-pill">European Arts</span>
            <span className="source-pill">Starožitnosti u Karlova mostu</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <img src="/huntiqueLogo.png" alt="HUNTIQUE" style={{ width: 44, height: 44, objectFit: "contain" }} />
              <div className="brand" style={{ fontSize: 24, color: "#fff" }}>HUNTIQUE</div>
            </div>
            <p className="muted small" style={{ maxWidth: 360, color: "#a1a1aa" }}>
              The independent intelligence platform for antique transactions, price mapping, and counter-offer marketplaces in the Czech Republic.
            </p>
          </div>
          <div className="footer-links">
            <div>
              <strong>Platform Sections</strong>
              <ul>
                <li><Link href="/historical">Historical Transactions Archive</Link></li>
                <li><Link href="/analysis">Price Map &amp; Analytics</Link></li>
                <li><Link href="/marketplace">Marketplace (Offers &amp; Requests)</Link></li>
                <li><Link href="/about">About Data &amp; Sources</Link></li>
              </ul>
            </div>
            <div>
              <strong>Categories</strong>
              <ul>
                <li>Antique Furniture</li>
                <li>Historical Glass &amp; Porcelain</li>
                <li>Ceramics &amp; Art Glass</li>
                <li>Thonet &amp; Biedermeier</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026-2027 HUNTIQUE · Market Intelligence &amp; Antique Transactions</span>
        </div>
      </footer>

      {/* Quick Modal: Create Listing */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Listing on HUNTIQUE</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {submitted ? (
              <div className="modal-body text-center" style={{ padding: "40px 20px" }}>
                <h4>Listing Created Successfully (Demo Mode)!</h4>
                <p className="muted">The lot is saved and published to the marketplace.</p>
                <button className="btn btn-primary" onClick={() => { setSubmitted(false); setShowModal(false); }}>
                  Close
                </button>
              </div>
            ) : (
              <form
                className="modal-body"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
              >
                <div className="form-group">
                  <label>Publish as:</label>
                  <div className="radio-toggle">
                    <button
                      type="button"
                      className={`toggle-option ${sellerType === "private" ? "active" : ""}`}
                      onClick={() => setSellerType("private")}
                    >
                      Private Individual
                    </button>
                    <button
                      type="button"
                      className={`toggle-option ${sellerType === "shop" ? "active" : ""}`}
                      onClick={() => setSellerType("shop")}
                    >
                      Antique Shop / Gallery
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Item Title</label>
                  <input placeholder="e.g. Viennese Bentwood Chair Thonet No. 14, walnut" required defaultValue="Viennese Bentwood Chair Thonet No. 14" />
                </div>

                <div className="row2">
                  <div className="form-group">
                    <label>Category</label>
                    <select defaultValue="furniture">
                      <option value="furniture">Furniture</option>
                      <option value="tableware">Tableware / Glass</option>
                      <option value="horology">Horology / Watches</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>City in Czechia</label>
                    <input placeholder="Prague, Brno, Plzeň..." defaultValue="Prague" required />
                  </div>
                </div>

                <div className="row2">
                  <div className="form-group">
                    <label>Maker / Manufacturer</label>
                    <input defaultValue="Gebrüder Thonet" />
                  </div>
                  <div className="form-group">
                    <label>Target Price (Kč)</label>
                    <input type="number" defaultValue="14500" required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description &amp; Condition Details</label>
                  <textarea
                    rows={3}
                    defaultValue="Original paper label under the rim. Solid stable condition, original patina."
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Publish Listing
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
