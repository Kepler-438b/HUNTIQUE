"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  baseRecords, filterRecords, computeTrend, formatCzk,
  PRICE_TYPE_LABEL, VERIFICATION_LABEL, VERIFICATION_COLOR, SUBCATEGORIES,
} from "@/lib/records";
import { useStore } from "@/lib/store";
import TrendChart from "@/components/TrendChart";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const DEFAULT_FILTERS = {
  status: "all",
  q: "",
  category: "",
  subcategory: "",
  maker: "",
  yearFrom: "",
  yearTo: "",
  priceMin: "",
  priceMax: "",
  priceTypes: ["hammer", "with_premium", "marketplace", "asking"],
  levels: ["verified", "documented", "reported"],
  dataset: "all",
};

function toggle(list, value) {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export default function PriceMapPage() {
  const { historical } = useStore();
  const allRecords = useMemo(() => {
    // Real market transactions (both closed historical deals and active sales)
    return historical.filter((r) => !r.is_sample);
  }, [historical]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selected, setSelected] = useState(null);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  const makers = useMemo(() => {
    const pool = allRecords.filter(
      (r) => (!filters.category || r.category === filters.category) && (!filters.subcategory || r.subcategory === filters.subcategory)
    );
    return [...new Set(pool.map((r) => r.maker))].sort();
  }, [allRecords, filters.category, filters.subcategory]);

  const visible = useMemo(
    () =>
      filterRecords(allRecords, {
        ...filters,
        yearFrom: Number(filters.yearFrom) || null,
        yearTo: Number(filters.yearTo) || null,
        priceMin: Number(filters.priceMin) || null,
        priceMax: Number(filters.priceMax) || null,
      }),
    [allRecords, filters]
  );

  const trend = useMemo(
    () => (selected ? computeTrend(allRecords, selected.subcategory, selected.maker) : null),
    [allRecords, selected]
  );


  return (
    <main className="map-page">
      <aside className="sidebar">
        <h2>Find past sales</h2>

        <div className="status-filter-box">
          <label className="filter-headline">Status / Availability</label>
          <div className="status-toggle-row">
            <button
              type="button"
              className={`status-toggle-btn ${filters.status === "all" ? "active" : ""}`}
              onClick={() => set("status", "all")}
            >
              All
            </button>
            <button
              type="button"
              className={`status-toggle-btn ${filters.status === "active" ? "active" : ""}`}
              onClick={() => set("status", "active")}
            >
              Active
            </button>
            <button
              type="button"
              className={`status-toggle-btn ${filters.status === "sold" ? "active" : ""}`}
              onClick={() => set("status", "sold")}
            >
              Sold
            </button>
          </div>
        </div>

        <input placeholder="Search: Thonet, Moser, chair…" value={filters.q} onChange={(e) => set("q", e.target.value)} />

        <label>Category</label>
        <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, subcategory: "", maker: "" }))}>
          <option value="">All</option>
          <option value="furniture">Furniture</option>
          <option value="tableware">Tableware</option>
        </select>

        <label>Type</label>
        <select value={filters.subcategory} onChange={(e) => setFilters((f) => ({ ...f, subcategory: e.target.value, maker: "" }))}>
          <option value="">All</option>
          {(filters.category ? SUBCATEGORIES[filters.category] : [...SUBCATEGORIES.furniture, ...SUBCATEGORIES.tableware]).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label>Maker</label>
        <select value={filters.maker} onChange={(e) => set("maker", e.target.value)}>
          <option value="">All</option>
          {makers.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <label>Year of sale</label>
        <div className="row2">
          <input placeholder="from" value={filters.yearFrom} onChange={(e) => set("yearFrom", e.target.value)} />
          <input placeholder="to" value={filters.yearTo} onChange={(e) => set("yearTo", e.target.value)} />
        </div>

        <label>Price (Kč)</label>
        <div className="row2">
          <input placeholder="min" value={filters.priceMin} onChange={(e) => set("priceMin", e.target.value)} />
          <input placeholder="max" value={filters.priceMax} onChange={(e) => set("priceMax", e.target.value)} />
        </div>

        <label>Price type</label>
        <div className="chips">
          {Object.keys(PRICE_TYPE_LABEL).map((t) => (
            <button key={t} className={`chip ${filters.priceTypes.includes(t) ? "on" : ""}`} onClick={() => set("priceTypes", toggle(filters.priceTypes, t))}>
              {{ hammer: "Hammer", with_premium: "With premium", marketplace: "Agreed sale", asking: "Asking" }[t]}
            </button>
          ))}
        </div>

        <label>Verification level</label>
        <div className="chips">
          {Object.keys(VERIFICATION_LABEL).map((l) => (
            <button key={l} className={`chip ${filters.levels.includes(l) ? "on" : ""}`} onClick={() => set("levels", toggle(filters.levels, l))}>
              <span className="dot" style={{ background: VERIFICATION_COLOR[l] }} />
              {VERIFICATION_LABEL[l]}
            </button>
          ))}
        </div>

        <p className="count">
          {visible.length} items shown across Czech Republic
        </p>
        <button className="btn secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
      </aside>

      <section className="map-wrap">
        <MapView records={visible} selectedId={selected?.id} onSelect={setSelected} />
        <div className="legend">
          <div><span className="dot" style={{ background: "#e5252a" }} />Active Listing (Asking Price)</div>
          <div><span className="dot" style={{ background: VERIFICATION_COLOR.verified }} />Verified Past Sale</div>
          <div><span className="dot" style={{ background: VERIFICATION_COLOR.documented }} />Documented Auction Sale</div>
          <div className="muted" style={{ marginTop: 4 }}>100% real Czech antique market data</div>
        </div>
      </section>

      <aside className="detail">
        {!selected ? (
          <>
            <h2>Click a dot on the map</h2>
            <p className="muted">
              Each dot represents an antique transaction or active offering. Click it to inspect item details, realized or asking price,
              source provenance, and record fingerprint.
            </p>
            <div className="note">
              <strong>Location is approximate.</strong> The sources do not publish where an item is located, so each record is assigned to a city algorithmically to make the map readable. Use the map to compare prices and categories, not exact geography.
            </div>
          </>
        ) : (
          <RecordDetail record={selected} trend={trend} />
        )}
      </aside>
    </main>
  );
}

function RecordDetail({ record: r, trend }) {
  const isActive = r.status === "active" || r.price_type === "asking";
  return (
    <>
      <div className="card">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {isActive ? (
            <span className="tag" style={{ background: "#e5252a", color: "#fff", fontWeight: 700 }}>
              Active for Sale
            </span>
          ) : (
            <span className="tag real">Documented Past Sale</span>
          )}
          <span className="tag" style={{ background: VERIFICATION_COLOR[r.verification_level] || "#2f62b5" }}>
            {VERIFICATION_LABEL[r.verification_level] || "Verified"}
          </span>
          {r.verification_signature && (
            <code style={{
              fontSize: 10,
              fontWeight: 700,
              background: "#000",
              color: "#fff",
              padding: "2px 6px",
              borderRadius: 3,
              fontFamily: "monospace"
            }}>
              {r.verification_signature}
            </code>
          )}
        </div>
        <h2 style={{ marginTop: 8 }}>{r.title}</h2>
        <div className="price">{formatCzk(r.price_czk)}</div>
        <div className="muted small">{PRICE_TYPE_LABEL[r.price_type]}</div>
        {r.hammer_price_czk && <div className="muted small">Hammer price: {formatCzk(r.hammer_price_czk)}</div>}
        <dl className="kv">
          {r.verification_signature && (
            <>
              <dt>Verification Signature</dt>
              <dd>
                <code style={{ fontFamily: "monospace", fontWeight: 700 }}>
                  {r.verification_signature}
                </code>
              </dd>
            </>
          )}
          <dt>Category</dt><dd>{r.category} · {r.subcategory}</dd>
          <dt>Maker</dt><dd>{r.maker}</dd>
          <dt>Period</dt><dd>{r.period}</dd>
          {r.condition && (<><dt>Condition</dt><dd>{r.condition}</dd></>)}
          <dt>Sale date</dt><dd>{r.sale_date}</dd>
          <dt>Place</dt><dd>{r.city} {r.location_precision === "city" ? "(city level)" : ""}</dd>
          <dt>Source</dt>
          <dd>
            {r.source_url && !r.source_url.includes("huntique.local") && !r.source_url.includes(".local") ? (
              <a href={r.source_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>{r.source_name} ↗</a>
            ) : (
              r.source_name
            )}
          </dd>
        </dl>
        {r.note && <div className="note">{r.note}</div>}
      </div>

      <div className="card">
        <h2>Price trend: {r.subcategory}, {r.maker}</h2>
        <p className="muted small">
          Dots = individual sales, line = median per year. Asking prices and unverified (&quot;Reported&quot;) records
          are left out. Black dot = this record.
        </p>
        <TrendChart trend={trend} highlightId={r.id} />
        {trend.enough && (
          <p className="small">
            {trend.group.length} comparable sales. Latest year {trend.points.at(-1).year}: median{" "}
            {formatCzk(trend.points.at(-1).median)} ({trend.points.at(-1).count} sale
            {trend.points.at(-1).count === 1 ? "" : "s"}).
          </p>
        )}
      </div>
    </>
  );
}
