# HUNTIQUE – Compliance Audit against 4IT529 Team Project Requirements

Audit date: 18 Nov 2026 (submission deadline: **19 Nov 2026, 09:00** in Moodle)
Scope of evidence: the `antikmapa` folder (Next.js source, `db.sqlite3`, scripts, README), the parent Desktop folder and Downloads. **No report, presentation, KIT/KIQ sheet, PESTEL, Porter, competitor matrix, hosting URL, repository or team list was found.** Everything marked NEEDS VERIFICATION or MISSING needs evidence the auditor did not have.

## 1. Overall assessment

**Readiness: NOT ready for submission.** The prototype is substantial, but almost the whole analytical and documentation part of the assignment is not evidenced, and the prototype has critical security and data-integrity problems.

**Strengths**
- A real, non-trivial niche: price transparency for the Czech antique market (furniture, glass, porcelain).
- Real external data pipeline (`scripts/fetch_real_data.mjs`: Livebid.cz API, Aukro.cz sitemaps), 1,007 records, source URLs kept.
- A clear "reliability tiers" concept (verified / documented / reported / rumor), which is a good CI idea: source evaluation is part of the CI cycle.
- Coherent product: archive, price map, trend chart, two-sided marketplace.
- No API keys found in the code (none are used).

**Biggest weaknesses and risks**
1. Report (PDF), presentation, KIT/KIQ, PESTEL, Porter, competitor matrix and market gap: not found → 6 of 6 report sections not evidenced.
2. The prototype runs only on localhost (`start.bat`, SQLite file). No public URL. The SQLite and better-sqlite3 setup will not support writes on Vercel.
3. Security: plaintext passwords in the DB (`admin@huntique.cz` / `admin123`), unauthenticated DELETE and ingest endpoints, admin role granted to any email that contains "admin". Personal-looking demo data (names, emails such as `jan.novák`, `MUDr. Jiří K.`, `jana.v@seznam.cz`). `db.sqlite3` is not in `.gitignore`.
4. Data integrity (a CI credibility problem): **map locations are fabricated.** `pickCity()` assigns each lot to a city by hashing its URL and scatters it randomly, so the "geospatial price map" does not show real geography. Fallback prices (1000/1200 CZK), the starting price stored as "hammer price", 487 of 557 "sold" lots with hammer ≥ final price (probably unsold lots or lots without a result), "verified/rumor" records with invented sources ("Trusted Senior Appraiser & Collector Network"), clocks still in the data although the README says that category was removed, and 783 of 1,007 records with the placeholder maker "Bohemian Master / Workshop".
5. The README tells AI agents to hide "4IT529" and "localhost" so the platform looks "independent and institutional". Combined with the invented "verified" sources, this conflicts with the course's ethics clause and with an honest AI declaration.

## 2. Full requirements checklist

| # | Requirement | Status | Evidence / current implementation | What needs to be done |
|---|---|---|---|---|
| A1 | 5 team members | NEEDS VERIFICATION | No team list anywhere in the project | Confirm 5 names; list them in report §5 |
| A2 | Registered in 4IT529_CI_ZS2026 Excel, list "Týmy", by 6 Nov | NEEDS VERIFICATION | Not accessible | Screenshot the row (team number, project name, variant) |
| A3 | Project name + variant stated in the sheet | NEEDS VERIFICATION | Name "HUNTIQUE" in code; variant not declared anywhere | State "Variant 1: Competitive application" in the sheet and the report |
| A4 | Private channel TEAMx + project name | NEEDS VERIFICATION | – | Check the exact name, e.g. `TEAM7 HUNTIQUE` |
| A5 | Instructor invited to the channel | NEEDS VERIFICATION | – | Check the member list |
| A6 | One variant chosen | PARTIALLY COMPLETED | The code is clearly Variant 1 (application); no agents, so not MAS | Declare it explicitly. Do not describe it as MAS |
| A7 | Brainstorming done | NEEDS VERIFICATION | – | Optional: one paragraph in the report |
| B1 | KIT defined | MISSING | Not found in code, README or files | Write the KIT (proposal in §5) |
| B2 | 3–5 KIQs | MISSING | – | Write 4 KIQs, each mapped to a feature |
| B3 | KIT/KIQ in team list (T1, T2…) | NEEDS VERIFICATION | – | Fill in the team list |
| B4 | Target audience | PARTIALLY COMPLETED | Implied in UI ("collectors, restorers, antique dealers") | Name primary and secondary personas in the report |
| B5 | Supported managerial decisions | MISSING | – | E.g. dealer pricing and buying, which categories to stock, which channel to sell through |
| B6 | KIT/KIQ ↔ analysis ↔ prototype alignment | MISSING | Cannot be checked without a KIT | Add a KIQ → feature → data source table |
| C1 | PESTEL, all 6 dimensions | MISSING | – | Write it (½–1 page), tied to the antique market in Czechia |
| C2 | Porter, all 5 forces | MISSING | – | Write it (½ page); rate each force low/med/high |
| C3 | Competitor analysis ≥ 5 solutions | MISSING | – | Candidates to verify: Livebid.cz, Aukro.cz, Artprice/Artnet price DB, LiveAuctioneers / Invaluable, Barnebys, MutualArt, Bazoš/Sbazar, Czech auction houses' archives (Dorotheum Praha, Zezula, Hejtmánek) |
| C4 | Matrix: functions, price, target group, weaknesses | MISSING | – | One table, 5+ rows, all 4 columns + "Czech data? / realized prices? / map?" |
| C5 | Market gap named | MISSING (implicit only) | README implies "realized prices + map + demand marketplace for CZ" | State it in 1–2 sentences |
| C6 | Novelty proven by competitor analysis | MISSING | – | Derive the gap from empty cells in the matrix; avoid "first/only" without proof |
| D1 | Prototype publicly online | MISSING / NEEDS VERIFICATION | Only localhost scripts; no Vercel config/URL found. SQLite writes cannot persist on Vercel | Deploy (see §5, option A or B) and test in an incognito window |
| D2 | URL in team list and documentation | MISSING | – | Add it to the sheet, report §4 and the title slide |
| D3 | Functionality matches KIT/KIQs | NEEDS VERIFICATION | The features exist, but there is no KIT. Map and trend outputs are distorted by synthetic data | Fix the data issues (below) and map each KIQ to a screen |
| D4 | Tools & technologies documented | PARTIALLY COMPLETED | README (Russian): Next.js 16, React 19, SQLite, Leaflet | Move to report §4 in the report language; add the AI tools used |
| D5 | External data sources documented | PARTIALLY COMPLETED | README names Livebid.cz, Aukro.cz; DB also has Hejtmánek and ČT24 | List them with the access method and date, and note the ToS/robots status |
| D6 | MAS architecture doc | N/A | Variant 1 | Short architecture diagram is still required by report §4 |
| D7 | No personal data | PARTIALLY COMPLETED / AT RISK | Fictional but realistic names and emails in `marketplace_lots`, `users`. Registration collects real emails. Scraped seller names possible | Use clearly fake data (`seller-01@example.com`, "Demo Collector A"). Disable or label registration as demo, with no real emails |
| D8 | API keys not in repo / browser | COMPLETED (limited) | No keys or secrets found; `.env*` ignored | Keep it that way. **But** add `db.sqlite3*` to `.gitignore` |
| D9 | Basic app security | MISSING | Plaintext passwords (`lib/db/index.js` createUser, `app/api/auth/route.js`). Auto-register on login. Admin if email contains "admin" (`lib/store.js:771`). Unauthenticated DELETE `/api/marketplace/[id]` and POST `/api/batch/ingest` | Before going public: make the deployment read-only or protect write routes with a server-side secret; remove admin-by-email |
| E0 | Report ≤ 8 standard pages (NS = 1,800 chars) | MISSING | No report found | Write ~12–14k characters max |
| E1 | §1 KIT, KIQ, audience, decisions | MISSING | – | – |
| E2 | §2 PESTEL + Porter | MISSING | – | – |
| E3 | §3 Matrix + gap | MISSING | – | – |
| E4 | §4 Prototype: functions, architecture, tools, data sources, URL | PARTIALLY COMPLETED (material in README only) | README covers functions, stack, DB schema | Condense it into 1–1.5 pages + 1 diagram |
| E5 | §5 Who did what | MISSING | – | Table: member × tasks |
| E6 | §6 AI declaration (mandatory) | MISSING | The code was clearly AI-assisted (README "rules for AI agents") | Name the tools (e.g. Claude Code, ChatGPT), the parts they were used for, and how outputs were checked |
| F1 | Report PDF | MISSING | – | Export to PDF |
| F2 | Presentation | MISSING | – | 8–12 slides that follow the report structure |
| F3 | Prototype URL | MISSING | – | – |
| F4 | Repository URL (optional) | MISSING | Folder is not a git repo | Optional: private or public GitHub without the DB, users or secrets |
| F5 | One member submits in Moodle by 19 Nov 09:00 | NEEDS VERIFICATION | – | Agree who submits; upload by the evening of 18 Nov |
| G1 | Ethical information gathering | AT RISK | The scraper spoofs a Chrome User-Agent (`fetch_real_data.mjs:136`). Invented "insider/rumor" records are presented as authenticated | Use an honest UA and rate limits, and check the sites' ToS and robots. Label or remove invented records |

## 3. Missing and incomplete requirements (prioritized)

### Critical (must fix to satisfy the assignment)
1. **Report PDF with all 6 sections** (≤ 8 NS). Nothing exists → write it now (outline in §5).
2. **KIT + 3–5 KIQs** with audience and decisions. Also put them in the team sheet.
3. **PESTEL (6/6) and Porter (5/5)**.
4. **Competitor matrix ≥ 5** with functions, price, target group and weaknesses, plus a **market gap derived from the matrix**.
5. **Public prototype URL**. Deploy and put the URL in the sheet and the report.
6. **AI declaration**.
7. **Team task split** (5 names).
8. **Presentation**.
9. **Security before going public**: hash or remove passwords, remove `admin123`, remove admin-by-email, block unauthenticated DELETE/ingest (or make the deployed version read-only). Remove realistic personal data.

### High
10. **Fabricated geography.** Either take the real location of the auction house or seller, or label the map as "illustrative distribution by auction-house city". Never present the random scatter as real.
11. **Remove or clearly mark invented records** (the 2 "verified" + 2 "rumor" records with fictional sources, `realRecords` without real URLs) and the price fallbacks (1000/1200 CZK). Do not call starting prices "hammer prices". Exclude lots without a confirmed result from "sold".
12. **Trend chart validity**: 550 of 557 sold records are from 2024, so "multi-year trends" are not supported by the data. Either collect more years or describe it as a snapshot.
13. **Category hygiene**: 64 clock records remain (README says clocks were removed). 643 "decorative_art" records include prints and graphics by Trnka, Preissig and Reynek, which do not fit "furniture/tableware". 783 records have the placeholder maker.
14. **Remove the README instruction to hide the course context.** Be transparent that this is a student prototype with demo data.

### Medium
15. Translate the README or architecture into the report language (CZ/EN). Add an architecture diagram (scraper → SQLite → Next.js API → UI).
16. Show the CI cycle (planning → collection → analysis → dissemination → feedback) mapped to features. This is good for the CI evaluation even in Variant 1.
17. KIQ → feature → data source → example answer table (with a screenshot) as evidence of alignment.
18. Document data limits: sample size, date range, Livebid/Aukro coverage, EUR→CZK rate 25.2 fixed.

### Low
19. A GitHub repo with a clean history (without the DB).
20. Rate limiting and an honest User-Agent in the scraper. Cache the data instead of live scraping.
21. Move `huntiqueLogo.png`/`mainImg*.jpg` duplicates from the project root (the `start.bat` copy step).

## 4. Consistency review

| Check | Finding |
|---|---|
| KIT/KIQ vs solution | Cannot be assessed: there is no KIT. Risk: the app has three products (archive, map, marketplace). The KIT must justify all three or the scope should be narrowed. |
| Market analysis vs gap | No market analysis exists, so the gap is only claimed (README, landing page). |
| Competitors vs novelty | Claims such as "independent analytical platform", "complete infrastructure" and "verified signatures" are not backed by any comparison. Livebid and Aukro, the platforms you scrape, are themselves direct competitors and substitutes, and must be in the matrix. |
| Prototype vs objectives | The "price map" claims real geography, but locations are random by hash. The "cryptographic verification signature" is a SHA-256 over your own fields with a hard-coded key, and it proves nothing about authenticity. Present it as an internal record ID, not as verification. |
| Data labels vs reality | "Sold" includes lots where hammer ≥ final price (487 of 557), and the starting price is stored as the hammer price. "Verified" and "rumor" sources are fictional. |
| README vs data | README: "clocks fully removed", "450 Aukro active / 557 sold" → the DB still has 64 clock records; the counts match. README: "furniture + tableware" → in practice it is 973 tableware/decorative vs 34 furniture. The landing page leads with furniture. |
| Report vs presentation | Neither exists, so this cannot be checked. Write the report first and derive the slides from it. |
| Architecture vs implementation | The README describes "connection pool", "sub-ms queries" and "high-throughput ingest". For one SQLite file this is overstated. Keep the report factual. |
| Duplicates / noise | Root-level image duplicates; `sampleRecords.js` stub; `proxy.js` subdomain rewrite for `analysis.localhost` (dev only). |

## 5. Final action plan (deadline 19 Nov 09:00)

### Mandatory (in this order)
1. **(30 min) Team admin.** Confirm 5 members, the team number, the Teams channel name, and that the instructor is invited. Check the sheet row: name, variant, KIT/KIQ, URL.
2. **(45 min) KIT/KIQ.** Draft proposal, to adapt:
   - *KIT:* Price transparency and demand signals in the Czech secondary market for antique furniture, glass and porcelain. Audience: small antique dealers and shops, plus advanced collectors.
   - *KIQ1:* What are realized auction prices (hammer vs. with premium) for a given category or maker in Czechia, and how far are they from asking prices on Aukro?
   - *KIQ2:* Which auction houses and channels dominate supply in each category, and where is it concentrated?
   - *KIQ3:* Which categories or makers show unmet demand (buy requests vs. offers)?
   - *KIQ4:* How reliable is each price signal (source tier)?
   - *Decisions supported:* purchase price limits, listing price, choice of sales channel, stock/category focus.
3. **(1.5 h) PESTEL + Porter + matrix + gap.** Verify each competitor's price and features from their real websites. Cite your sources.
4. **(1–2 h) Prototype fixes, minimum set.** Make the public build read-only (disable register, offer and bid, DELETE and ingest, or protect them with a server-side env secret). Delete the `users` rows and fake personal emails, or replace them with `example.com` placeholders. Label the map as an approximate city distribution, or use real auction-house cities. Remove or label the 4 invented records. Add a "Student prototype – demo data" note.
5. **(1 h) Deploy.** Option A (fastest): Vercel with the DB used read-only (include `db.sqlite3` in the output and open it with `{readonly:true}`). Option B: export the data to static JSON. Check `npm run build` locally first. Test the URL in an incognito window.
6. **(2 h) Report ≤ 8 NS**, sections 1–6 exactly as in the assignment, plus the URL. Declare the limitations honestly. Add the AI declaration and the task table. Export it to PDF.
7. **(1 h) Presentation**: problem, KIT/KIQ, PESTEL/Porter (1 slide each), matrix + gap, demo screenshots + URL, architecture, team, AI.
8. **Submit** the PDF, slides and URL(s) in Moodle (one member), ideally tonight.

### Optional
- GitHub repo without the DB. Fix the trend data (multi-year) and the categories. Use an honest scraper User-Agent and rate limits. Add a CI-cycle diagram.

## 6. Prototype fixes applied (18 Nov 2026)

| Issue (from §3) | Fix | Where |
|---|---|---|
| Plaintext passwords, `admin123`, auto-register, admin-by-email | scrypt hashing, no auto-register, admin only via `HUNTIQUE_ADMIN_EMAILS`; `users` table emptied | `lib/security.js`, `app/api/auth/route.js` |
| Unauthenticated write/delete/ingest | All POST/DELETE routes return 403 unless `HUNTIQUE_ALLOW_WRITES=true`; ingest also needs a bearer token; DB opened read-only otherwise | `app/api/**`, `lib/db/index.js` |
| Fake client login | "Demo user / Demo moderator" sessions in the browser only; no passwords sent; `/admin` needs the moderator role | `lib/store.js`, `components/AuthModal.jsx`, `app/admin/page.jsx` |
| Personal-looking data | Marketplace names and emails → `Demo Shop 01`, `demo-…@example.com`; Aukro sellers hidden; emails removed from the API output | `scripts/sanitize_for_demo.mjs`, `lib/store.js` |
| Unsold lots counted as sold | 487 Livebid lots without bids removed; hammer price fixed for the 63 real sales | DB + `scripts/fetch_real_data.mjs` |
| Invented "verified/rumor" records | 4 removed (DB + client seed) | DB, `lib/store.js` |
| Fabricated geography | Stored as `approximate`; the map, the About page and the site notice say so | `app/analysis`, `app/about`, `app/layout.jsx` |
| Overstated "cryptographic seal" | Renamed to "record fingerprint (not proof of authenticity)" | `app/historical`, `app/about` |
| Clocks still present | 40 archive + 37 marketplace records removed; the scraper filters them | DB, scraper |
| Placeholder maker | `Bohemian Master / Workshop` → `Unattributed` | DB |
| Scraper fallbacks and spoofed User-Agent | No fallback prices or dates; honest UA | `scripts/fetch_real_data.mjs` |
| Hidden course context | README rule replaced with a transparency rule; site-wide "student prototype" notice | `README.md`, `app/layout.jsx` |
| Not deployable | DB included in the server trace, WAL merged, `.gitignore` and `.env.example` added; `next build` passes | `next.config.mjs` |
| Marketplace showed seed data only (`status=all` bug) | Fixed; 413 Aukro + 10 demo listings now load | `lib/db/index.js` |

Backup of the original DB: `backups/db-before-sanitize-*.sqlite3` (gitignored).
**Deployed (18 Nov 2026): https://antikmapa.vercel.app** (read-only; all write endpoints return 403). D1 is done; D2 is still open: add the URL to the team sheet and the report. Remaining data limits: 63 sales, mostly from 2024, and some out-of-scope Livebid items (prints, paintings, documents).

## 7. Status update (18 Nov 2026, evening)

Searched: this repository, the Desktop folder and Downloads. No report, presentation, KIT/KIQ, PESTEL, Porter or competitor-matrix document exists. The only XML file in Downloads is a game save, not project material.

### Done (verified)
| Requirement | Evidence |
|---|---|
| D1 Prototype public | https://antikmapa.vercel.app (read-only demo; writes return 403) |
| F4 Repository | https://github.com/Kepler-438b/HUNTIQUE (public, no secrets/backups) |
| D4/D5 Tools & data sources documented | README.md, docs/DATA_SOURCES.md |
| D7/D8/D9 Security, personal data | Hashed passwords, no accounts, demo identities, no API keys |
| D3 Real data behind the CI questions | 1,202 real Czech auction lots (800 sold 2023–2026, 33 houses, 200 current, 199 unsold); verified house addresses |

### Still missing (all mandatory, deadline 19 Nov 2026 09:00)
1. **Report PDF ≤ 8 NS (~14,400 characters)** with exactly these sections: (1) KIT & KIQ, audience, decisions; (2) PESTEL & Porter; (3) competitor matrix & market gap; (4) prototype: functions, architecture, tools, external data, URL; (5) who did what; (6) AI declaration.
2. **KIT + 3–5 KIQs** — must also be entered in the team sheet in MS Teams.
3. **PESTEL** (6 factors) and **Porter's Five Forces** (5 forces).
4. **Competitor matrix ≥ 5 solutions** (functions, price, target group, weaknesses) + **market gap derived from it**. Candidates: Livebid.cz, Aukro.cz, Artprice / Artnet price databases, Barnebys, Invaluable / LiveAuctioneers, MutualArt, individual Czech auction-house archives.
5. **Team task split** (5 names) and **AI declaration**.
6. **Presentation**.
7. **MS Teams admin** (cannot be verified from here): team registered in the 4IT529_CI_ZS2026 sheet, private channel "TEAMx + name", instructor invited, prototype URL + KIT/KIQ in the team sheet.
8. **Moodle submission** by one member: PDF + presentation + prototype URL + repository URL.

### Open decisions / consistency points for the report
- The marketplace still shows 413 Aukro listings from the earlier collection (Aukro's robots.txt disallows Anthropic's crawler; the team should decide whether to keep them).
- The landing page still advertises "verified collectors" and "ready demand"; the marketplace offers and requests are demo data — describe them as a concept/demo in the report.
- The site notice says lots are placed at the auction house's *city*; they are now at the house's *address* (still true, less precise).
- Report figures must match docs/DATA_SOURCES.md (803 sold incl. 3 manual, 200 current, 199 unsold, 33 houses).
