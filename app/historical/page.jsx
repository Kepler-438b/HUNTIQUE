"use client";
import { useState, useMemo } from "react";
import { formatCzk } from "@/lib/records";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function HistoricalPage() {
  const { historical } = useStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState(null);

  // Historical Archive displays strictly closed / concluded transactions
  const closedHistorical = useMemo(() => {
    return historical.filter((tx) => tx.status === "sold" && tx.price_type !== "asking");
  }, [historical]);

  // Marketing metrics calculation on closed transactions
  const totalVolume = useMemo(() => {
    return closedHistorical.reduce((acc, tx) => acc + (Number(tx.price_czk) || 0), 0);
  }, [closedHistorical]);

  const uniqueSourcesCount = useMemo(() => {
    const s = new Set(closedHistorical.map((tx) => tx.source_name || "Direct Trade"));
    return s.size;
  }, [closedHistorical]);

  const filtered = useMemo(() => {
    return closedHistorical.filter((tx) => {
      if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;
      if (levelFilter !== "all" && tx.verification_level !== levelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${tx.title} ${tx.maker} ${tx.city} ${tx.source_name} ${tx.period} ${tx.verification_signature || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [closedHistorical, search, categoryFilter, levelFilter]);

  return (
    <main className="historical-page">
      <div className="historical-hero">
        <span className="section-kicker">Archival Trade Intelligence</span>
        <h1 style={{ margin: "6px 0 10px", fontSize: 32, fontWeight: 900, textTransform: "uppercase" }}>
          Historical Transactions Archive
        </h1>
        <p className="muted" style={{ maxWidth: 840, fontSize: 15 }}>
          A granular record of historical sales, auction results, and verified trades of antique furniture and tableware across the Czech Republic.
          Each entry details <strong>what, where, when, and for how much</strong> it was traded, accompanied by auction house links and reliability signatures.
        </p>
      </div>

      {/* Marketing Metrics Bar */}
      <div className="historical-marketing-bar">
        <div className="hist-metric-card">
          <div className="hist-metric-num">{closedHistorical.length}</div>
          <div className="hist-metric-title">Closed Transactions in Archive</div>
          <div className="hist-metric-desc">Verified auction sales, gallery acquisitions &amp; registered trades</div>
        </div>
        <div className="hist-metric-card highlighted">
          <div className="hist-metric-num">{formatCzk(totalVolume)}</div>
          <div className="hist-metric-title">Total Traded Volume</div>
          <div className="hist-metric-desc">Gross cumulative transaction turnover calculated in Czech Koruna (CZK)</div>
        </div>
        <div className="hist-metric-card">
          <div className="hist-metric-num">{uniqueSourcesCount} Platforms</div>
          <div className="hist-metric-title">Tracked Market Sources</div>
          <div className="hist-metric-desc">Auction houses and public sources in the archive</div>
        </div>
      </div>

      {/* Explainer Banner for Verification Levels & Rumor */}
      <div className="rumor-explainer-banner">
        <strong>Transparency &amp; Reliability Signatures:</strong>
        <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          <div>
            <span className="badge-verification verified">[VERIFIED] Shop / Partner</span>
            <div style={{ fontSize: 12, marginTop: 4, color: "#111" }}>
              Commercial deal verified by a certified antique store, gallery invoice, or accredited partner feed.
            </div>
          </div>
          <div>
            <span className="badge-verification documented">[DOCUMENTED] Auction</span>
            <div style={{ fontSize: 12, marginTop: 4, color: "#111" }}>
              Public hammer result published in an official auction house post-sale report with verified link.
            </div>
          </div>
          <div>
            <span className="badge-verification rumor">[RUMOR] Insider Tip</span>
            <div style={{ fontSize: 12, marginTop: 4, color: "#111" }}>
              <strong>Less precise data from a more trusted insider</strong> — off-market trades reported directly by reputable veteran dealers or appraisers.
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="historical-controls">
        <div style={{ flex: "1 1 240px" }}>
          <input
            placeholder="Search items, makers, cities (e.g. Thonet, Moser, Prague)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="furniture">Furniture</option>
            <option value="tableware">Tableware &amp; Glass</option>
          </select>
        </div>
        <div>
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="all">All Verification Levels</option>
            <option value="verified">Verified by Shop / Partner</option>
            <option value="documented">Documented Auction Record</option>
            <option value="rumor">Rumor / Insider Tip</option>
          </select>
        </div>
        <div className="muted small" style={{ marginLeft: "auto", fontWeight: 600 }}>
          Showing {filtered.length} of {closedHistorical.length} closed transactions
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-wrap">
        <table className="historical-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Item &amp; Category</th>
              <th>Maker / Period</th>
              <th>Location</th>
              <th>Realized Price</th>
              <th>Record Fingerprint</th>
              <th>Source &amp; Links</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id} style={{ cursor: "pointer" }} onClick={() => setSelectedTx(tx)}>
                <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{tx.sale_date}</td>
                <td>
                  <strong style={{ fontSize: 14 }}>{tx.title}</strong>
                  <div className="muted small">
                    {tx.category.toUpperCase()} · {tx.subcategory}
                  </div>
                </td>
                <td>
                  <div>{tx.maker}</div>
                  <div className="muted small">{tx.period}</div>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <strong>{tx.city}</strong>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <div className="price-tag-big">{formatCzk(tx.price_czk)}</div>
                  {tx.hammer_price_czk && (
                    <div className="muted small">Hammer: {formatCzk(tx.hammer_price_czk)}</div>
                  )}
                  <div className="muted small" style={{ textTransform: "capitalize" }}>
                    {tx.price_type.replace("_", " ")}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div>
                      {tx.verification_level === "verified" && (
                        <span className="badge-verification verified">[VERIFIED] Shop</span>
                      )}
                      {tx.verification_level === "documented" && (
                        <span className="badge-verification documented">[DOCUMENTED] Auction</span>
                      )}
                      {tx.verification_level === "rumor" && (
                        <span className="badge-verification rumor" title="Less precise info from a more trusted insider">
                          [RUMOR] Insider Tip
                        </span>
                      )}
                    </div>
                    {tx.verification_signature && (
                      <div>
                        <code style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: "#f4f4f5",
                          border: "1px solid #e4e4e7",
                          padding: "1px 5px",
                          borderRadius: 3,
                          color: "#18181b",
                          letterSpacing: "0.4px",
                          fontFamily: "monospace"
                        }}>
                          {tx.verification_signature}
                        </code>
                      </div>
                    )}
                  </div>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ maxWidth: 220, fontSize: 12 }}>
                    {tx.source_url && !tx.source_url.includes("huntique.local") && !tx.source_url.includes(".local") ? (
                      <a href={tx.source_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>
                        {tx.source_name} ↗
                      </a>
                    ) : (
                      <span className="muted">{tx.source_name}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="modal-window" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transaction Dossier #{selectedTx.id}</h3>
              <button className="close-btn" onClick={() => setSelectedTx(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div className="muted small">{selectedTx.category.toUpperCase()} · {selectedTx.subcategory}</div>
                  <h2 style={{ margin: "4px 0 8px", fontSize: 20, fontWeight: 900 }}>{selectedTx.title}</h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="price-tag-big" style={{ fontSize: 24 }}>{formatCzk(selectedTx.price_czk)}</div>
                  <div className="muted small">{selectedTx.price_type.replace("_", " ")}</div>
                </div>
              </div>

              <div style={{ margin: "14px 0" }}>
                {selectedTx.verification_level === "verified" && (
                  <div className="note" style={{ borderLeftColor: "var(--verified)" }}>
                    <strong>[VERIFIED] Certified Shop / Gallery:</strong> This transaction was confirmed with commercial store documentation or checked invoices.
                  </div>
                )}
                {selectedTx.verification_level === "documented" && (
                  <div className="note" style={{ borderLeftColor: "var(--documented)" }}>
                    <strong>[DOCUMENTED] Public Auction Record:</strong> Published in official post-sale auction catalogue records with open source references.
                  </div>
                )}
                {selectedTx.verification_level === "rumor" && (
                  <div className="note" style={{ borderLeftColor: "var(--rumor)", background: "#fff5f5" }}>
                    <strong>[RUMOR] Insider Tip:</strong> Less precise transaction figures communicated directly by a trusted, reputable trade insider (senior appraiser or collector network).
                  </div>
                )}
              </div>

              <dl className="kv" style={{ fontSize: 13, marginTop: 14 }}>
                <dt>Record Fingerprint</dt>
                <dd>
                  <code style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    background: "#000",
                    color: "#fff",
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    letterSpacing: "0.5px"
                  }}>
                    {selectedTx.verification_signature || "HTQ-VF-PENDING"}
                  </code>
                  <span style={{ fontSize: 11, color: "#71717a", marginLeft: 8 }}>
                    SHA-256 of record fields (integrity ID, not proof of authenticity)
                  </span>
                </dd>
                <dt>Sale Date</dt>
                <dd><strong>{selectedTx.sale_date}</strong></dd>
                <dt>Location</dt>
                <dd>{selectedTx.city}</dd>
                <dt>Maker / Workshop</dt>
                <dd>{selectedTx.maker}</dd>
                <dt>Period</dt>
                <dd>{selectedTx.period}</dd>
                {selectedTx.hammer_price_czk && (
                  <>
                    <dt>Hammer Price</dt>
                    <dd>{formatCzk(selectedTx.hammer_price_czk)} (excl. buyer&apos;s premium)</dd>
                  </>
                )}
                <dt>Source / House</dt>
                <dd>
                  {selectedTx.source_url && !selectedTx.source_url.includes("huntique.local") && !selectedTx.source_url.includes(".local") ? (
                    <a href={selectedTx.source_url} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
                      {selectedTx.source_name} ↗
                    </a>
                  ) : (
                    selectedTx.source_name
                  )}
                </dd>
                <dt>Condition &amp; Notes</dt>
                <dd>{selectedTx.condition || selectedTx.note}</dd>
              </dl>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <Link href="/analysis" className="btn btn-outline btn-small" onClick={() => setSelectedTx(null)}>
                  Compare on Price Map
                </Link>
                <button className="btn btn-dark btn-small" onClick={() => setSelectedTx(null)}>
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
