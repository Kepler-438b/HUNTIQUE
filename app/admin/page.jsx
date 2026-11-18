"use client";
import { useState } from "react";
import { useStore, useAuth } from "@/lib/store";
import Link from "next/link";
import { formatCzk } from "@/lib/records";

export default function MasterPanelPage() {
  const { offers, requests, historical, addHistorical, deleteHistorical, deleteListing } = useStore();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("add-historical"); // "add-historical" | "manage-historical" | "manage-marketplace"
  const [msg, setMsg] = useState("");

  // Form state to add new transaction to map & archive
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("furniture");
  const [subcategory, setSubcategory] = useState("chair");
  const [maker, setMaker] = useState("");
  const [period, setPeriod] = useState("");
  const [priceCzk, setPriceCzk] = useState("");
  const [priceType, setPriceType] = useState("hammer");
  const [verificationLevel, setVerificationLevel] = useState("documented");
  const [city, setCity] = useState("Prague");
  const [lat, setLat] = useState("50.0755");
  const [lng, setLng] = useState("14.4378");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceName, setSourceName] = useState("Dorotheum Prague Post-Sale Protocol");
  const [sourceUrl, setSourceUrl] = useState("https://www.dorotheum.com");
  const [notes, setNotes] = useState("");

  const handleCityChange = (c) => {
    setCity(c);
    const coords = {
      Prague: { lat: 50.0755, lng: 14.4378 },
      Brno: { lat: 49.1951, lng: 16.6068 },
      Plzeň: { lat: 49.7384, lng: 13.3736 },
      "Karlovy Vary": { lat: 50.2319, lng: 12.8719 },
      Olomouc: { lat: 49.5938, lng: 17.2509 },
      Liberec: { lat: 50.7663, lng: 15.0543 },
    };
    if (coords[c]) {
      setLat(coords[c].lat.toString());
      setLng(coords[c].lng.toString());
    }
  };

  const handleAddHistorical = (e) => {
    e.preventDefault();
    if (!title || !priceCzk) return;

    addHistorical({
      title,
      category,
      subcategory,
      maker: maker || "Unknown (Bohemia)",
      period: period || "19th Century",
      price_czk: Number(priceCzk),
      hammer_price_czk: priceType === "hammer" ? Number(priceCzk) : null,
      price_type: priceType,
      verification_level: verificationLevel,
      city,
      lat: Number(lat) || 50.0755,
      lng: Number(lng) || 14.4378,
      location_precision: "city",
      sale_date: saleDate,
      source_name: sourceName,
      source_url: sourceUrl || null,
      note: notes || "Moderation verified entry.",
    });

    setMsg("Record successfully added to the Map and Historical Archive!");
    setTitle("");
    setPriceCzk("");
    setNotes("");
    setTimeout(() => setMsg(""), 4000);
  };

  if (!isAdmin) {
    return (
      <main className="page" style={{ maxWidth: 720, paddingBottom: 80 }}>
        <span className="section-kicker">Moderation</span>
        <h1 style={{ margin: "4px 0 10px", fontSize: 26, fontWeight: 900, textTransform: "uppercase" }}>Moderator access required</h1>
        <p className="muted">
          Sign in and choose <strong>Demo moderator</strong> to explore the moderation panel. In the public demo,
          changes stay only in your browser.
        </p>
      </main>
    );
  }

  return (
    <main className="page admin-panel-page" style={{ maxWidth: 1180, paddingBottom: 80 }}>
      <div className="admin-header">
        <div>
          <span className="section-kicker">Administrative &amp; Moderation Hub</span>
          <h1 style={{ margin: "4px 0 6px", fontSize: 28, fontWeight: 900, textTransform: "uppercase" }}>
            Master Moderation Panel
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            Curate the Historical Archive, add verified sales to the Price Map, and moderate Marketplace listings.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="badge-verification verified">
            {user?.demo ? "Demo moderator (browser only)" : "Moderator access"}
          </div>
          <Link href="/historical" className="btn btn-outline btn-small">
            View Live Archive
          </Link>
          <Link href="/analysis" className="btn btn-outline btn-small">
            View Price Map
          </Link>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-num">{historical.length}</div>
          <div className="muted small">Total Historical &amp; Map Records</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{offers.length}</div>
          <div className="muted small">Active Marketplace Offers</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{requests.length}</div>
          <div className="muted small">Active Buy Requests</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cabinet-tabs" style={{ marginTop: 24 }}>
        <button
          className={`cabinet-tab-btn ${activeTab === "add-historical" ? "active" : ""}`}
          onClick={() => setActiveTab("add-historical")}
        >
          Add Transaction to Map &amp; Archive
        </button>
        <button
          className={`cabinet-tab-btn ${activeTab === "manage-historical" ? "active" : ""}`}
          onClick={() => setActiveTab("manage-historical")}
        >
          Manage Archive / Map Records ({historical.length})
        </button>
        <button
          className={`cabinet-tab-btn ${activeTab === "manage-marketplace" ? "active" : ""}`}
          onClick={() => setActiveTab("manage-marketplace")}
        >
          Moderate Marketplace ({offers.length + requests.length})
        </button>
      </div>

      {msg && (
        <div className="note" style={{ background: "#f0fdf4", borderLeftColor: "#16a34a", padding: "12px 18px", margin: "18px 0" }}>
          <strong>Success:</strong> {msg}
        </div>
      )}

      {/* TAB 1: ADD TRANSACTION FORM */}
      {activeTab === "add-historical" && (
        <div className="cabinet-form-container">
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", margin: "0 0 4px" }}>
              Insert New Transaction into Map &amp; Archive
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Transactions added here immediately display on the interactive Leaflet Map (`/analysis`), calculate into price median curves, and show in the Historical Archive (`/historical`).
            </p>
          </div>

          <form onSubmit={handleAddHistorical}>
            <div className="form-group">
              <label>Item Title</label>
              <input
                placeholder="e.g. Set of 4 Thonet No. 14 bentwood chairs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="row2">
              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="furniture">Furniture</option>
                  <option value="tableware">Tableware &amp; Glass</option>
                </select>
              </div>
              <div className="form-group">
                <label>Subcategory</label>
                <input
                  placeholder="chair, table, glass, porcelain, silver..."
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="row2">
              <div className="form-group">
                <label>Maker / Workshop</label>
                <input
                  placeholder="Gebrüder Thonet, Moser, Meissen, Unknown..."
                  value={maker}
                  onChange={(e) => setMaker(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Period</label>
                <input
                  placeholder="Biedermeier, Art Nouveau, Functionalism..."
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="row2">
              <div className="form-group">
                <label>Realized Price (CZK)</label>
                <input
                  type="number"
                  placeholder="e.g. 85000"
                  value={priceCzk}
                  onChange={(e) => setPriceCzk(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Price Type</label>
                <select value={priceType} onChange={(e) => setPriceType(e.target.value)}>
                  <option value="hammer">Hammer Price (Aukce, bez provize)</option>
                  <option value="with_premium">Price with Buyer's Premium (Včetně provize)</option>
                  <option value="marketplace">Agreed Sale Price (Smluvní prodej)</option>
                </select>
              </div>
            </div>

            <div className="row2">
              <div className="form-group">
                <label>Verification Signature Level</label>
                <select value={verificationLevel} onChange={(e) => setVerificationLevel(e.target.value)}>
                  <option value="documented">Documented Auction Record (Public Catalogue)</option>
                  <option value="verified">Verified by Certified Shop / Gallery</option>
                  <option value="rumor">Rumor / Insider Tip (Less precise from trusted insider)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date of Sale</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="row2">
              <div className="form-group">
                <label>City in Czechia</label>
                <select value={city} onChange={(e) => handleCityChange(e.target.value)}>
                  <option value="Prague">Prague</option>
                  <option value="Brno">Brno</option>
                  <option value="Plzeň">Plzeň</option>
                  <option value="Karlovy Vary">Karlovy Vary</option>
                  <option value="Olomouc">Olomouc</option>
                  <option value="Liberec">Liberec</option>
                </select>
              </div>
              <div className="row2">
                <div className="form-group">
                  <label>Latitude (Map)</label>
                  <input value={lat} onChange={(e) => setLat(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Longitude (Map)</label>
                  <input value={lng} onChange={(e) => setLng(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="row2">
              <div className="form-group">
                <label>Source / Auction House Name</label>
                <input
                  placeholder="e.g. Arthouse Hejtmánek or Dorotheum"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Source URL (Link to catalogue / report)</label>
                <input
                  placeholder="https://..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Provenance &amp; Appraisal Notes</label>
              <textarea
                rows={3}
                placeholder="Document provenance, hallmark inspection, condition details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "12px 28px" }}>
                Publish to Map &amp; Historical Archive
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MANAGE HISTORICAL / MAP RECORDS */}
      {activeTab === "manage-historical" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, textTransform: "uppercase", margin: "0 0 4px" }}>
              All Map &amp; Historical Records ({historical.length})
            </h3>
            <p className="muted small" style={{ margin: 0 }}>
              Moderators can inspect and delete erroneous or outdated records from the database.
            </p>
          </div>

          <div className="table-wrap">
            <table className="historical-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title &amp; Category</th>
                  <th>Price</th>
                  <th>Location</th>
                  <th>Signature</th>
                  <th>Source</th>
                  <th style={{ textAlign: "right" }}>Moderation</th>
                </tr>
              </thead>
              <tbody>
                {historical.map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>{rec.sale_date}</td>
                    <td>
                      <strong>{rec.title}</strong>
                      <div className="muted small">{rec.category} · {rec.maker}</div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className="price-tag-big">{formatCzk(rec.price_czk)}</span>
                    </td>
                    <td>{rec.city}</td>
                    <td>
                      {rec.verification_level === "verified" && (
                        <span className="badge-verification verified">Shop Verified</span>
                      )}
                      {rec.verification_level === "documented" && (
                        <span className="badge-verification documented">Documented</span>
                      )}
                      {rec.verification_level === "rumor" && (
                        <span className="badge-verification rumor">Insider Rumor</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {rec.source_url ? (
                        <a href={rec.source_url} target="_blank" rel="noreferrer">
                          {rec.source_name} ↗
                        </a>
                      ) : (
                        rec.source_name
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => {
                          if (confirm(`Delete record "${rec.title}" from Map and Archive?`)) {
                            deleteHistorical(rec.id);
                          }
                        }}
                        className="btn btn-small"
                        style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #f87171" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MODERATE MARKETPLACE LISTINGS */}
      {activeTab === "manage-marketplace" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, textTransform: "uppercase", margin: "0 0 4px" }}>
              Active Marketplace Listings Moderation
            </h3>
            <p className="muted small" style={{ margin: 0 }}>
              Review offers and buy requests. Delete non-compliant or fraudulent postings immediately.
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h4 style={{ fontSize: 16, textTransform: "uppercase", marginBottom: 10 }}>
              Sell Offers ({offers.length})
            </h4>
            <div className="table-wrap">
              <table className="historical-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Seller</th>
                    <th>Price</th>
                    <th>City</th>
                    <th>Bids</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((lot) => (
                    <tr key={lot.id}>
                      <td>
                        <Link href={`/marketplace/${lot.id}`} style={{ fontWeight: 700 }}>
                          {lot.title}
                        </Link>
                        <div className="muted small">{lot.category} · {lot.year}</div>
                      </td>
                      <td>{lot.seller}</td>
                      <td><strong>{lot.currentBid?.toLocaleString("cs-CZ")} Kč</strong></td>
                      <td>{lot.city}</td>
                      <td>{lot.bidsCount || 0}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => {
                            if (confirm(`Remove listing "${lot.title}"?`)) {
                              deleteListing(lot.id);
                            }
                          }}
                          className="btn btn-small"
                          style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #f87171" }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 16, textTransform: "uppercase", marginBottom: 10 }}>
              Buy Requests ({requests.length})
            </h4>
            <div className="table-wrap">
              <table className="historical-table">
                <thead>
                  <tr>
                    <th>Requested Item</th>
                    <th>Buyer</th>
                    <th>Budget</th>
                    <th>City</th>
                    <th>Proposals</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <Link href={`/marketplace/${req.id}`} style={{ fontWeight: 700 }}>
                          {req.title}
                        </Link>
                        <div className="muted small">{req.category} · Target: {req.targetYears}</div>
                      </td>
                      <td>{req.buyer}</td>
                      <td><strong>{req.targetBudget}</strong></td>
                      <td>{req.city}</td>
                      <td>{req.responsesCount || 0}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => {
                            if (confirm(`Remove buy request "${req.title}"?`)) {
                              deleteListing(req.id);
                            }
                          }}
                          className="btn btn-small"
                          style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #f87171" }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
