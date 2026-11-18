# Data Sources, Collection Method & Limitations

This document describes the data behind the **Historical Archive** (`/historical`) and the **Price Map** (`/analysis`).
Snapshot collected on **18 November 2026**. All numbers below come from `data/collection_report.json`.

## 1. Summary

| | Records |
|---|---|
| **Sold** — completed auctions with a published hammer price | **803** (800 Livebid.cz + 3 manually verified) |
| **Current** — auctions still running or scheduled (current bid or starting price) | **200** |
| **Unsold** — lots that ended without a sale (starting price) | **199** |
| **Total** | **1,202** |

- **33 Czech auction houses** with sales in the dataset; current lots come from auctions held between 3 Dec 2026 and 1 Jan 2027.
- **Sales span January 2023 – November 2026** (39 different months): 2023: 238 · 2024: 277 · 2025: 145 · 2026: 140.
- Sold prices range from 100 CZK to 1,800,000 CZK (median 5,000 CZK).
- Every record links to its original listing (`source_url`), so any price can be checked by opening the lot page.
- Nothing in the archive or on the map is synthetic: no generated prices, dates or locations.

### By category (Livebid records)

| Category | Subcategory | Records |
|---|---|---|
| Paintings, graphics & sculpture | painting | 528 |
| | drawing & graphics | 320 |
| | sculpture | 46 |
| Porcelain, glass, ceramics & silver | porcelain | 68 |
| | glass | 52 |
| | glass & ceramics (combined category used by some houses) | 38 |
| | ceramics | 25 |
| | silver | 8 |
| Decorative & applied art | decorative art | 108 |
| Furniture & carpets | furniture | 6 |

Fine art dominates because that is what Czech auction houses mostly sell online; furniture rarely appears on Livebid.cz.

## 2. Sources

| Source | Used for | Access method | Permission basis |
|---|---|---|---|
| **Livebid.cz** — Czech online auction platform used by 160+ Czech auction houses | All sold, unsold and current lots | Public JSON API used by the Livebid website itself (`https://livebid.cz/apiv2/auctions`, `/auctions/{link}/categories`, `/items?filters=auctionLink_{link}`) | `robots.txt` disallows only `/admin`, `/auth/`, `/profile`. Requests were rate-limited (1 request per 1.1 s, 414 requests in total) and sent with an honest User-Agent. Data is used for non-commercial academic purposes. |
| **Arthouse Hejtmánek, Aukční dům Zezula** | 3 manually verified sales (`real_*`) | Read by hand from the published results / ČT24 report | Public pages, linked in each record |
| **Czech National Bank (ČNB)** | EUR → CZK conversion | Official yearly exchange-rate file (`year.txt`) | Public data |
| **OpenStreetMap Nominatim** | Coordinates of the auction houses' street addresses | Search + reverse API, ~1 request/s, results stored in `data/house_locations.json` | OSM usage policy (low volume, cached, identified User-Agent) |

### Sources considered but not used
- **Aukro.cz** — its `robots.txt` contains `User-agent: ClaudeBot / Disallow: /`, so it was not collected by this pipeline. The Aukro listings collected earlier were removed from the archive and the map. (The marketplace page still contains Aukro listings from the earlier collection.)
- **Individual auction-house websites** (Dorotheum Praha, European Arts, Adolf Loos Apartment and Gallery, …) — formats differ per house; most of these houses publish their results on Livebid.cz anyway.

## 3. Collection & processing pipeline

```bash
node scripts/collect_livebid.mjs --sold 800 --current 200   # -> data/livebid_dataset.json, data/collection_report.json
node scripts/import_livebid.mjs                             # backs up and loads into db.sqlite3
```

1. **Auctions** — list all auctions on Livebid.cz; keep only those whose organising house has a **Czech address** (`client.address.country = "CZ"`); drop charity auctions.
2. **Relevance** — for each auction, one request reads its category list; auctions with fewer than 10 antique lots are skipped.
3. **Time spread** — completed auctions are taken round-robin by month (up to 3 auctions per month, max 14 sold + 4 unsold lots per auction), so sales cover 2023–2026 and not just the latest weeks.
4. **Category allowlist** — furniture & carpets, porcelain, glass, ceramics, silver, paintings, drawings & graphics, sculpture, applied/decorative art. Excluded: clocks & watches, coins, stamps, banknotes, books, wine, weapons & militaria, jewellery, photography, toys, posters.
5. **Status** (from the platform, never inferred):
   - `sold` — `isFinished` and `finalPrice > 0` → price = hammer price (`finalPrice`, buyer's premium not included);
   - `unsold` — `isFinished` without `finalPrice` → price = starting price;
   - `active` — not finished → price = current highest bid if there are bids, otherwise starting price.
   Withdrawn lots are skipped.
6. **Normalisation**
   - Currency: CZK kept as is; EUR converted with the ČNB rate of the auction date (previous published day for weekends); original amount, rate and rate date are stored. (In this snapshot all selected lots were priced in CZK.)
   - Dates: auction date (`YYYY-MM-DD`).
   - Maker: the author published by the house; otherwise `Unattributed`.
   - Period: century or year mentioned in the lot text, or the author's life dates; otherwise `Unknown`.
   - Description: the house's short description, shortened to 300 characters; image: Livebid thumbnail URL (linked, not copied).
7. **Location** — the auction house's published street address, geocoded with OpenStreetMap and then **reverse-geocoded to confirm** that the point lies on the same street and in the same municipality (`scripts/geocode_houses.mjs`, results in `data/house_locations.json`). All 35 houses passed this check (`location_precision = auction_house_address`). Four houses published malformed address fields; their address was copied from their own text into the right field: Einszwei Gallery (street in the postcode field), Artkunst (street in the city field), Starožitnosti pod Kinskou ("Vítězná 11 / 530" → Vítězná 530/11) and Graciano (two addresses listed; the first, Veselá 39, Brno, is used). Three houses publish a postcode that differs from OSM (WEINBERG lists 10000 for Gogolova 228/8, which is 118 00 Praha 1 – Malá Strana; Antik Mašek and Avion differ only in the delivery postcode); the street address was used.
8. **Import** — the database is backed up, scraped records are replaced by the snapshot, and each record gets a record fingerprint (SHA-256 of key fields).

Raw API responses are cached in `data/raw/` (not committed), so the run can be repeated without fetching anything again; `--refresh` forces new downloads.

## 4. Limitations

- **Location is the auction house's address, not the item's.** Lots of one house are fanned out around that point on screen only (up to about 1 km for the largest houses); the stored coordinates are unchanged. Most houses are in Prague, so Prague dominates the map. Graciano also lists a Prague address; its lots are shown at the Brno address listed first.
- **Hammer prices exclude the buyer's premium** (typically 18–25 % in Czech auctions). Premiums differ per house and are not included.
- **Sample, not census.** Livebid.cz lists ~240,000 lots; this snapshot is a capped, time-spread sample of antique lots from Czech houses. Houses that do not publish on Livebid.cz (for example Dorotheum) are missing.
- **Categories follow the houses' own categories**, mapped to our four groups; some houses use broad categories (e.g. "Glass and ceramics").
- **Makers** are only as complete as the houses' cataloguing; many decorative lots are `Unattributed`, so per-maker trends need enough records.
- **Unsold lots** show the starting price, which is not a market value; they are kept to show which lots failed to sell.
- **Current lots** change daily; their prices are as of the collection date.
- Descriptions are in Czech, as published by the houses.
