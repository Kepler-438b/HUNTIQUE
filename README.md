# HUNTIQUE — Antique Intelligence, Historical Archives & Marketplace

**HUNTIQUE** is an independent analytics platform and transaction infrastructure for the antiques market in the Czech Republic. It combines an archive of completed sales, a geospatial price map, and a two-sided marketplace that connects sell offers with committed buyer demand.

**Live prototype:** https://antikmapa.vercel.app · **Repository:** https://github.com/Kepler-438b/HUNTIQUE

---

## Key Features

### 1. Historical Transactions Archive (`/historical`)
A register of completed antique sales in the Czech Republic.
- **Closed sales only:** The archive lists only transactions that actually took place (auction hammer prices, gallery sales). Active listings are never included.
- **Detailed records:** Each sale records the item, category, subcategory, maker or workshop, historical period, city/location, final price in CZK (split into hammer price and buyer's premium), sale date, and a link to the original source.
- **Turnover metrics:** Total trading volume (in Czech koruna) and the number of tracked auction houses and platforms are calculated automatically.
- **Transaction dossier (modal):** Clicking a row opens a card with the item's full metadata, its condition, the record fingerprint, and a direct link to the auction catalogue.

### 2. Price Map & Analytics (`/analysis`)
An interactive Leaflet map of the Czech Republic showing where sales and prices are distributed.
- **View modes:**
  - **All:** Shows both closed archive sales and active listings.
  - **Active:** 413 current Aukro listings shown as red markers (`#e5252a`), with asking prices and links to each listing.
  - **Sold:** 63 closed auction sales with a recorded result (Livebid.cz plus Hejtmánek and Zezula). Lots that received no bids are not counted as sales.
- **Approximate location (2D disk dispersion):** The sources do not publish where an item is located, so each record is assigned a city algorithmically (`location_precision = approximate`), and the interface says so. Points are spread across Prague (Prague 1, 2, 5, 6, Vinohrady, Smíchov), Brno, Plzeň, Karlovy Vary, Liberec and Olomouc without overlaps, lines or clustered bands, so markers stay easy to read and click.
- **Price trend chart:** An interactive curve of median prices by year for a given maker and item type (for example, Thonet chairs or Moser glass).

### 3. Offers & Buy Requests Marketplace (`/marketplace`)
A two-sided showcase for collectors, restorers and antique dealers.
- **1 — Sell offers:** Items listed for sale by shops and private owners, with support for counter-offers.
- **2 — Buy requests (ready demand):** Public requests from buyers with a fixed budget. A seller with a matching item can close the deal in one click.
- **Lot page (`/marketplace/[id]`):** Full-size photo gallery, condition report, market median, counter-offer history, and a price-offer form.

### 4. Record Fingerprints
Every record in the archive carries a unique fingerprint in the format:
$$\text{HTQ-VF-XXXX-XXXX-XXXX}$$
- The fingerprint is derived deterministically from a SHA-256 hash of the key fields: lot ID, price, sale date, auction house name and reliability level. It identifies a record and shows whether it has been altered; it is not proof of authenticity.
- Any sale can be looked up by its fingerprint through the global search or the API (`/api/historical?q=HTQ-VF-...`).

### 5. Automated Data Collection (`scripts/fetch_real_data.mjs`)
A fault-tolerant batch pipeline that collects 1,000+ real antique lots:
- **Livebid.cz:** Official catalogue numbers, hammer prices and auction house commissions (*Antikvity Praha*, *Graciano*, *OriginalArte*, *Art Invest Group* and others).
- **Aukro.cz:** Streams active antique listings from gzip sitemaps and extracts OpenGraph metadata, prices and photos.

---

## Architecture & Tech Stack

- **Framework:** Next.js 16.4 (App Router, Turbopack).
- **UI:** React 19, responsive CSS, Google Font **Montserrat**.
- **Database:** SQLite 3 (`db.sqlite3`) via the `better-sqlite3` library.
- **SQLite performance settings:**
  - `PRAGMA journal_mode = WAL` (write-ahead logging: concurrent reads and writes without locking).
  - `PRAGMA synchronous = NORMAL` (10–50× faster transactions).
  - `PRAGMA cache_size = -64000` (about 64 MB of memory for index caching).
  - `PRAGMA temp_store = MEMORY` (sorting and temporary tables kept in RAM).
  - Composite B-tree indexes on `(category, subcategory)`, `maker`, `sale_date DESC`, `price_czk`, `verification_signature` and `status`.
- **Response time:** A filtered query over 1,000+ records completes in **about 25–36 ms**.

---

## Database Schema (`db.sqlite3`)

### Main tables
1. **`historical_transactions`** — archive of past sales and active listings:
   - `id`, `source_id`, `source_name`, `source_type`, `source_url`
   - `title`, `category`, `subcategory`, `maker`, `period`, `condition`
   - `price_czk`, `hammer_price_czk`, `price_type` (`hammer`, `with_premium`, `marketplace`, `asking`)
   - `verification_level` (`verified`, `documented`, `reported`)
   - `verification_signature` (record fingerprint, `HTQ-VF-XXXX-XXXX-XXXX`)
   - `sale_date`, `city`, `lat`, `lng`, `is_sample` (always `0`), `status` (`sold`, `active`)
2. **`marketplace_lots`** — marketplace listings (sell offers and buy requests):
   - `id`, `type` (`offer` / `request`), `title`, `category`, `subcategory`, `maker`, `year`, `city`
   - `seller_or_buyer_name`, `user_type`, `user_email`, `current_bid_or_budget`
   - `ends_in`, `tag`, `description`, `images_json`, `analytics_json`
3. **`marketplace_interactions`** — history of bids and counter-offers.
4. **`users`** — user accounts (passwords hashed with scrypt; the table is empty in the public database).
5. **`batch_ingest_logs`** — log of scraper runs.

---

## Project Structure

```
antikmapa/
├── app/
│   ├── layout.jsx                  # Root layout (Montserrat font, global styles)
│   ├── page.jsx                    # Landing page (hero, key pillars, specialisation)
│   ├── historical/page.jsx         # Archive table of closed sales and dossiers
│   ├── analysis/page.jsx           # Leaflet price map, filters and trends
│   ├── marketplace/page.jsx        # Marketplace of offers and buy requests
│   ├── marketplace/[id]/page.jsx   # Lot page with photo carousel and bids
│   ├── about/page.jsx              # Methodology, data provenance and fingerprints
│   ├── account/page.jsx            # User account (publishing offers and requests)
│   ├── admin/page.jsx              # Moderator panel
│   └── api/
│       ├── historical/route.js     # API for querying and adding sales
│       ├── historical/trend/route.js # Fast SQL trend calculation
│       ├── marketplace/route.js    # Marketplace API
│       ├── marketplace/[id]/route.js # Bids API for a single lot
│       └── batch/ingest/route.js   # High-throughput batch ingestion
├── components/
│   ├── Navbar.jsx                  # Navigation bar
│   ├── MapView.jsx                 # Leaflet map with custom markers and tooltips
│   └── TrendChart.jsx              # Price trend chart (SVG)
├── lib/
│   ├── db/index.js                 # SQLite engine, connection handling, SQL queries, fingerprint generator
│   ├── security.js                 # Read-only guard, password hashing, token checks (server only)
│   ├── store.js                    # React hook (useStore) synced with SQLite
│   ├── records.js                  # Filters, price formatting, category constants
│   └── data/
│       ├── realRecords.js          # Reference archive records (Hejtmánek, Zezula)
│       └── sampleRecords.js        # Placeholder (sample data disabled)
├── scripts/
│   ├── fetch_real_data.mjs         # Livebid.cz + Aukro.cz scraper
│   ├── sanitize_for_demo.mjs       # Prepares the database for public deployment
│   ├── clean_and_enhance_db.mjs    # Database cleanup, dispersion and fingerprints
│   └── seed_db.mjs                 # Initial database setup
├── public/
│   ├── mainImg.jpg                 # Hero image for the landing page (91 KB)
│   └── huntiqueLogo.png            # HUNTIQUE logo
├── data/
│   └── scraped_real_antiques.json  # Local JSON cache of scraped lots (not in the repository)
├── start.bat                       # Quick start for Next.js on Windows
├── stop.bat                        # Quick stop (frees port 3000)
├── manage.bat                      # Interactive server management menu
└── db.sqlite3                      # Main SQLite database
```

---

## Guidelines for Future AI Agents (Strict Rules)

If you are an AI assistant continuing work on this project, **FOLLOW THESE RULES STRICTLY**:

1. **No emojis:**
   - Not in the interface, buttons, badges or logs.
   - Use plain text labels instead: `[VERIFIED]`, `[DOCUMENTED]`, `[RUMOR]`, `[ARCHIVE]`, `[MARKET]`.

2. **One font — Montserrat:**
   - The whole site uses **Montserrat** (`next/font/google`).
   - Do not add or reintroduce serif or Times fonts.

3. **HUNTIQUE colour palette:**
   - Accent red: `#e5252a`.
   - Deep black: `#000000` / `#18181b`.
   - Pure white: `#ffffff`.
   - Neutral greys: `#71717a`, `#f4f4f5`.

4. **Transparency:**
   - This is a student prototype (course 4IT529, Competitive Intelligence). Do not hide this, and do not present demo data as verified.
   - Do not invent sources, prices, sales or "verified" records. If a value is missing, store `null` rather than a default.
   - Do not use real personal data. For demo content, use `example.com` addresses and anonymised names.

5. **Scope — furniture and tableware (glass, porcelain) only:**
   - The clocks and watches category (`horology`, `Rolex`) has been **removed entirely** at the client's explicit request.
   - Allowed categories:
     - `furniture` (armchairs, Thonet/Kohn chairs, chests of drawers, tables, cabinets, Halabala modernism, Biedermeier).
     - `tableware` (Bohemian Moser glass, Pirkenhammer/Thun/Meissen porcelain, silver, ceramics).

6. **Keep the archive and the marketplace separate:**
   - The `/historical` page shows **ONLY closed sales** (`status = 'sold'`). Active listings must never appear in the archive.
   - Active listings appear in the marketplace (`/marketplace`) and on the price map (`/analysis`) when the `Active` or `All` filter is selected.

7. **Geographic distribution (2D disk dispersion):**
   - Map points **must not line up** or stack on a single spot.
   - Use uniform disk sampling ($r = R \sqrt{u}, \theta = 2\pi v$) around the city centres (Prague, Brno, Plzeň, Karlovy Vary, Liberec, Olomouc).

8. **Clean source URLs:**
   - Never generate links to non-existent domains such as `https://huntique.local/...`.
   - If there is no external link (for example, a private off-market sale), set `source_url` to `null` and show the source name as plain text, without an `<a>` tag.

---

## Demo Mode & Security

- **The public deployment is read-only.** Unless `HUNTIQUE_ALLOW_WRITES` is set to `true`, the database is opened read-only and every POST/DELETE route (`/api/auth`, `/api/historical`, `/api/marketplace`, `/api/batch/ingest`) returns 403. Visitor changes (new listings, bids, moderation) are saved only in their browser's localStorage.
- **Sign-in:** The "Demo user" and "Demo moderator" buttons create a session in the browser only, and no passwords are sent anywhere. Locally (with `HUNTIQUE_ALLOW_WRITES=true`), real accounts work: passwords are hashed with scrypt, there is no automatic registration, and the admin role is granted only to addresses listed in `HUNTIQUE_ADMIN_EMAILS`.
- **Batch import** via `/api/batch/ingest` requires the header `Authorization: Bearer $HUNTIQUE_INGEST_TOKEN`.
- **No API keys are used.** Secrets belong only in `.env.local` (ignored by git) or in the hosting settings. See `.env.example` for a template.
- **Preparing the database for publication:** `node scripts/sanitize_for_demo.mjs`. The script backs up the database to `backups/`, removes accounts, invented records, lots without bids and clocks, anonymises the marketplace, and merges the WAL into a single `db.sqlite3` file.

### Deploying to Vercel
1. Run `node scripts/sanitize_for_demo.mjs`, then `npm run build` as a check.
2. Push the project to GitHub (`db.sqlite3` is included; `backups/`, `.env*` and WAL files are not) and import it into Vercel, or deploy from this folder with `npx.cmd vercel deploy --prod`.
3. Do **not** set `HUNTIQUE_ALLOW_WRITES` on Vercel. `db.sqlite3` is bundled with the server functions via `outputFileTracingIncludes` in `next.config.mjs`.

## Known Data Limitations
- 63 confirmed sales, almost all from 2024, so the year-by-year trend is illustrative only.
- Locations are approximate (see above). The EUR→CZK rate is fixed at 25.2.
- 415 records have no identified maker (`Unattributed`). Some Livebid lots are prints and paintings rather than furniture or tableware.
- The 10 demo marketplace listings and their analytics are illustrative data.

## Running & Managing the App

### Windows scripts
- **`start.bat`** — starts the Next.js server and opens the browser.
- **`stop.bat`** — stops the Node.js process and frees port 3000.
- **`manage.bat`** — interactive console menu (Start / Stop / Restart / Status).

### From the terminal
```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Stop the server on port 3000
npm run stop

# Run the real-data scraper
node scripts/fetch_real_data.mjs

# Run the database cleanup and fingerprint update script
node scripts/clean_and_enhance_db.mjs
```
