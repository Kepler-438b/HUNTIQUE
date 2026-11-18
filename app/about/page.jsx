import { realRecords } from "@/lib/data/realRecords.js";
import Link from "next/link";

export default function AboutPage() {
  const sources = [...new Map(realRecords.map((r) => [r.source_url, r])).values()];

  return (
    <main className="page">
      <span className="section-kicker">Data Standards &amp; Methodology</span>
      <h1 style={{ margin: "4px 0 14px", fontSize: 30, fontWeight: 900, textTransform: "uppercase" }}>
        Market Intelligence Architecture &amp; Data Provenance
      </h1>
      <p style={{ fontSize: 15, color: "var(--ink-secondary)", lineHeight: 1.6, maxWidth: 900 }}>
        <strong>HUNTIQUE</strong> operates as an independent market intelligence system and transactional repository for fine antiques in the Czech Republic, specializing in antique furniture, historical glass, porcelain, and ceramics. The platform provides verifiable valuation baselines by systematically archiving realized transaction prices and matching counter-offers.
      </p>

      {/* Core Infrastructure Overview */}
      <div className="note" style={{ margin: "24px 0", borderLeftColor: "var(--black)", background: "var(--surface-subtle)" }}>
        <strong style={{ textTransform: "uppercase", fontSize: 12, letterSpacing: "0.5px" }}>
          Core Platform Modules:
        </strong>
        <ol style={{ margin: "8px 0 0 18px", padding: 0, lineHeight: 1.7 }}>
          <li>
            <strong>Historical Transactions Archive (<Link href="/historical">/historical</Link>):</strong> A granular database recording realized transactions—detailing lot specifications, sale dates, hammer prices, buyer premiums, and primary source links.
          </li>
          <li>
            <strong>Price Map &amp; Trend Analytics (<Link href="/analysis">/analysis</Link>):</strong> Geospatial mapping of historical sales with multi-year median price curves and maker-level trend regression.
          </li>
          <li>
            <strong>Marketplace (<Link href="/marketplace">/marketplace</Link>):</strong> Two-sided secondary market infrastructure connecting active listings (Offers) with capital-committed purchase requests (Ready Demand).
          </li>
        </ol>
      </div>

      <h2>Data Ingestion &amp; Reliability Standards</h2>
      <p style={{ lineHeight: 1.6 }}>
        Market records are classified under a strict tripartite hierarchy based on verification pedigree and source documentation:
      </p>
      <div style={{ display: "grid", gap: 14, margin: "16px 0 24px" }}>
        <div style={{ border: "1px solid var(--line)", padding: "14px 18px", borderRadius: 6, background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="badge-verification verified">[VERIFIED]</span>
            <strong style={{ fontSize: 14 }}>Commercial Gallery &amp; Retail Records</strong>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            Direct acquisitions and consignments documented by accredited antique galleries, licensed dealers, and certified retail invoices with formal certificates of authenticity.
          </p>
        </div>

        <div style={{ border: "1px solid var(--line)", padding: "14px 18px", borderRadius: 6, background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="badge-verification documented">[DOCUMENTED]</span>
            <strong style={{ fontSize: 14 }}>Public Auction Results</strong>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            Realized prices confirmed via post-sale protocols and official catalogues published by licensed Czech auction houses (including hammer price breakdowns and applicable buyer’s premiums).
          </p>
        </div>

        <div style={{ border: "1px solid var(--line)", padding: "14px 18px", borderRadius: 6, background: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="badge-verification rumor">[RUMOR]</span>
            <strong style={{ fontSize: 14 }}>Verified Industry Intelligence (Off-Market Trades)</strong>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            Direct reports from certified court appraisers, established restoration studios, and senior trade practitioners regarding off-market private transactions. While exact hammer figures may represent a narrow approximation (±5%), the provenance and insider intelligence are authenticated.
          </p>
        </div>
      </div>

      <h2>Primary Auction Sources ({realRecords.length} Documented Lots)</h2>
      <p style={{ lineHeight: 1.6 }}>
        Realized prices in the archive are referenced directly against primary publication records from verified auction institutions:
      </p>
      <ul style={{ lineHeight: 1.8 }}>
        {sources.map((s) => (
          <li key={s.source_url}>
            <a href={s.source_url} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
              {s.source_name} ↗
            </a>
          </li>
        ))}
      </ul>

      <h2>Price Classification &amp; Valuation Rules</h2>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          <strong>Hammer Price:</strong> The nominal winning bid struck at auction, excluding auction house commissions and VAT.
        </li>
        <li>
          <strong>Price with Premium:</strong> The total gross acquisition cost paid by the buyer (inclusive of standard 18%–24% auction house premiums).
        </li>
        <li>
          <strong>Agreed Marketplace Price:</strong> Final settled transaction price confirmed between counterparties on the secondary market.
        </li>
        <li>
          <strong>Asking Price / Ready Demand:</strong> Active listing quotes and buyer target budgets. <em>Methodological rule:</em> Asking prices and open demand quotes are strictly excluded from historical median calculations until a transaction is formally concluded.
        </li>
      </ul>

      <h2>Record Fingerprints</h2>
      <p style={{ lineHeight: 1.6 }}>
        Each archive record has a <strong>record fingerprint</strong> (format: <code>HTQ-VF-XXXX-XXXX-XXXX</code>): a SHA-256 hash of the lot ID, price, sale date, source and reliability level. It makes records easy to look up and shows if a stored record was changed. It is <em>not</em> a proof of authenticity or provenance; for that, follow the link to the original source.
      </p>

      <h2>Location Accuracy &amp; Privacy</h2>
      <p style={{ lineHeight: 1.6 }}>
        Livebid.cz and Aukro.cz do not publish where an item is located. Map positions are therefore <strong>approximate</strong>: each record is assigned to a Czech city algorithmically and scattered within a small radius so the points stay readable. Treat the map as a view of prices and categories, not of real locations. The prototype holds no personal data. Seller names are not shown, and the marketplace listings are labelled demo data.
      </p>
    </main>
  );
}
