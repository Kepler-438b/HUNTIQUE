"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  baseRecords, filterRecords, computeTrend, formatCzk,
  PRICE_TYPE_LABEL, VERIFICATION_LABEL, VERIFICATION_COLOR, SUBCATEGORIES,
  STATUS_LABEL, STATUS_COLOR, CATEGORY_LABEL, statusOf,
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
  priceTypes: ["hammer", "with_premium", "marketplace", "asking", "starting", "current_bid"],
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
            {[["all", "All"], ["sold", "Sold"], ["active", "Current"], ["unsold", "Unsold"]].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`status-toggle-btn ${filters.status === value ? "active" : ""}`}
                onClick={() => set("status", value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <input placeholder="Search: Thonet, Moser, chair…" value={filters.q} onChange={(e) => set("q", e.target.value)} />

        <label>Category</label>
        <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, subcategory: "", maker: "" }))}>
          <option value="">All</option>
          {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <label>Type</label>
        <select value={filters.subcategory} onChange={(e) => setFilters((f) => ({ ...f, subcategory: e.target.value, maker: "" }))}>
          <option value="">All</option>
          {(filters.category ? SUBCATEGORIES[filters.category] : Object.values(SUBCATEGORIES).flat()).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label>Maker</label>
        <select value={filters.maker} onChange={(e) => set("maker", e.target.value)}>
          <option value="">All</option>
          {makers.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <label>Year of auction</label>
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
              {{ hammer: "Hammer", with_premium: "With premium", marketplace: "Agreed sale", asking: "Asking", starting: "Starting", current_bid: "Current bid" }[t]}
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
          {visible.length} lots match · {visible.filter((r) => r.lat != null).length} on the map
        </p>
        <button className="btn secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
      </aside>

      <section className="map-wrap">
        <MapView records={visible} selectedId={selected?.id} onSelect={setSelected} />
        <div className="legend">
          {Object.entries(STATUS_LABEL).map(([k, label]) => (
            <div key={k}><span className="dot" style={{ background: STATUS_COLOR[k] }} />{label}</div>
          ))}
          <div className="muted" style={{ marginTop: 4 }}>Real lots from Czech auction houses (Livebid.cz)</div>
        </div>
      </section>

      <aside className="detail">
        {!selected ? (
          <>
            <h2>Click a dot on the map</h2>
            <p className="muted">
              Each dot is a real lot from a Czech auction house: a completed sale, a lot that did not sell, or an auction that is
              still running. Click a dot to see the price, auction, date and a link to the original listing.
            </p>
            <div className="note">
              <strong>Location = auction house address.</strong> Each lot is placed at the address of the auction house that sold it
              (from the house's public address). Lots of the same house are fanned out around that point so they stay clickable;
              this is not the item's own location.
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
  const status = statusOf(r);
  const priceLabel = { sold: "Hammer price", active: "Current price", unsold: "Starting price" }[status];
  return (
    <>
      <div className="card">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span className="tag" style={{ background: STATUS_COLOR[status], color: "#fff", fontWeight: 700 }}>
            {STATUS_LABEL[status]}
          </span>
          <span className="tag" style={{ background: VERIFICATION_COLOR[r.verification_level] || "#2f62b5" }}>
            {VERIFICATION_LABEL[r.verification_level] || "Documented"}
          </span>
        </div>
        {r.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.image_url}
            alt={r.title}
            loading="lazy"
            style={{ width: "100%", maxHeight: 220, objectFit: "contain", background: "#f4f4f5", borderRadius: 6, marginTop: 10 }}
          />
        )}
        <h2 style={{ marginTop: 8 }}>{r.title}</h2>
        <div className="price">{formatCzk(r.price_czk)}</div>
        <div className="muted small">
          {priceLabel} · {PRICE_TYPE_LABEL[r.price_type] || r.price_type}
          {r.currency && r.currency !== "CZK" && r.original_amount ? ` · originally ${r.original_amount} ${r.currency}` : ""}
        </div>
        {r.description && <p className="small" style={{ lineHeight: 1.5 }}>{r.description}</p>}
        <dl className="kv">
          <dt>Category</dt><dd>{CATEGORY_LABEL[r.category] || r.category} · {r.subcategory}</dd>
          {r.source_category && (<><dt>Source category</dt><dd>{r.source_category}</dd></>)}
          <dt>Maker / author</dt><dd>{r.maker}</dd>
          <dt>Period</dt><dd>{r.period}</dd>
          {r.condition && (<><dt>Condition</dt><dd>{r.condition}</dd></>)}
          <dt>{status === "sold" ? "Sale date" : "Auction date"}</dt><dd>{r.sale_date || "Unknown"}</dd>
          {r.auction_name && (<><dt>Auction</dt><dd>{r.auction_name}</dd></>)}
          <dt>Auction house</dt>
          <dd>
            {r.source_url ? (
              <a href={r.source_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600 }}>{r.source_name} ↗</a>
            ) : (
              r.source_name
            )}
          </dd>
          <dt>Location</dt>
          <dd>{r.city || "Unknown"}{{ auction_house_address: " (auction house address)", auction_house_city: " (auction house city)" }[r.location_precision] || ""}</dd>
          {r.bids_count > 0 && (<><dt>Bids</dt><dd>{r.bids_count}</dd></>)}
          {r.verification_signature && (
            <>
              <dt>Record fingerprint</dt>
              <dd><code style={{ fontFamily: "monospace", fontWeight: 700 }}>{r.verification_signature}</code></dd>
            </>
          )}
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
