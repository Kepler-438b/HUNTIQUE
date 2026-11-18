import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

// Path to SQLite database file in project root
const DB_PATH = path.join(process.cwd(), "db.sqlite3");

let dbInstance = null;

// Deterministic institutional cryptographic verification signature generator
export function generateVerificationSignature(tx = {}) {
  const payload = [
    tx.id || "",
    Math.round(Number(tx.price_czk) || 0),
    tx.sale_date || "",
    tx.source_name || "",
    tx.verification_level || "documented",
    "HUNTIQUE_AUDIT_KEY_2026"
  ].join("::");
  const hash = crypto.createHash("sha256").update(payload).digest("hex").toUpperCase();
  return `HTQ-VF-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

export function getDb() {
  if (!dbInstance) {
    // Public demo (HUNTIQUE_ALLOW_WRITES unset): open the bundled file read-only.
    // Serverless hosts such as Vercel have a read-only filesystem, and the demo must not persist user input.
    if (process.env.HUNTIQUE_ALLOW_WRITES !== "true") {
      dbInstance = new Database(DB_PATH, { readonly: true, fileMustExist: true });
      dbInstance.pragma("query_only = ON");
      return dbInstance;
    }

    dbInstance = new Database(DB_PATH);

    // ==========================================
    // High-Performance Engine Tuning for Real-time & Batch Ingestion
    // ==========================================
    // 1. WAL Mode: Write-Ahead Logging allows concurrent readers & writers without blocking
    dbInstance.pragma("journal_mode = WAL");
    // 2. SYNCHRONOUS = NORMAL: 10x-50x faster writes while remaining crash-safe in WAL mode
    dbInstance.pragma("synchronous = NORMAL");
    // 3. CACHE_SIZE = -64000: Allocates ~64MB memory for query index caching
    dbInstance.pragma("cache_size = -64000");
    // 4. TEMP_STORE = MEMORY: Materializes temp tables & sorts entirely in RAM
    dbInstance.pragma("temp_store = MEMORY");
    // 5. BUSY_TIMEOUT = 5000: Auto-wait up to 5s if another transaction is writing
    dbInstance.pragma("busy_timeout = 5000");
    // 6. Foreign Keys enforcement
    dbInstance.pragma("foreign_keys = ON");

    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db) {
  // 1. Historical Transactions Table (optimized for real-time lookups & bulk scraped feeds)
  db.exec(`
    CREATE TABLE IF NOT EXISTS historical_transactions (
      id TEXT PRIMARY KEY,
      source_id TEXT,
      source_name TEXT,
      source_type TEXT,
      source_url TEXT UNIQUE,
      external_lot_id TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      maker TEXT,
      period TEXT,
      condition TEXT,
      price_czk REAL NOT NULL,
      hammer_price_czk REAL,
      currency TEXT DEFAULT 'CZK',
      original_amount REAL,
      price_type TEXT NOT NULL DEFAULT 'marketplace',
      verification_level TEXT NOT NULL DEFAULT 'documented',
      verification_source_type TEXT DEFAULT 'auction',
      sale_date TEXT NOT NULL,
      city TEXT,
      lat REAL,
      lng REAL,
      location_precision TEXT DEFAULT 'city',
      is_sample INTEGER DEFAULT 0,
      status TEXT DEFAULT 'sold',
      verification_signature TEXT,
      note TEXT,
      raw_data_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Composite & Specialized B-Tree Indexes for Sub-millisecond Queries
    CREATE INDEX IF NOT EXISTS idx_hist_cat_sub ON historical_transactions(category, subcategory);
    CREATE INDEX IF NOT EXISTS idx_hist_maker ON historical_transactions(maker);
    CREATE INDEX IF NOT EXISTS idx_hist_sale_date ON historical_transactions(sale_date DESC);
    CREATE INDEX IF NOT EXISTS idx_hist_price ON historical_transactions(price_czk);
    CREATE INDEX IF NOT EXISTS idx_hist_status ON historical_transactions(status);
    CREATE INDEX IF NOT EXISTS idx_hist_verif ON historical_transactions(verification_level);
    CREATE INDEX IF NOT EXISTS idx_hist_sig ON historical_transactions(verification_signature);
    CREATE INDEX IF NOT EXISTS idx_hist_source_url ON historical_transactions(source_url);
    CREATE INDEX IF NOT EXISTS idx_hist_geo ON historical_transactions(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_hist_sample ON historical_transactions(is_sample);
  `);

  try {
    db.exec("ALTER TABLE historical_transactions ADD COLUMN verification_signature TEXT;");
  } catch {}

  // 2. Marketplace Listings Table (Offers and Requests with real-time bidding)
  db.exec(`
    CREATE TABLE IF NOT EXISTS marketplace_lots (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL, -- 'offer' (seller listing) or 'request' (buyer ready demand)
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      maker TEXT,
      year TEXT,
      period TEXT,
      city TEXT,
      seller_or_buyer_name TEXT,
      user_type TEXT DEFAULT 'private', -- 'private' or 'shop'
      user_email TEXT NOT NULL,
      current_bid_or_budget REAL NOT NULL,
      min_next_bid REAL,
      bids_or_responses_count INTEGER DEFAULT 0,
      ends_in TEXT,
      tag TEXT,
      icon TEXT,
      description TEXT,
      condition TEXT,
      status TEXT DEFAULT 'active', -- 'active', 'concluded', 'withdrawn'
      images_json TEXT, -- JSON array of image URLs
      analytics_json TEXT, -- JSON valuation & archive references
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_lots_type_status ON marketplace_lots(type, status);
    CREATE INDEX IF NOT EXISTS idx_lots_category ON marketplace_lots(category, subcategory);
    CREATE INDEX IF NOT EXISTS idx_lots_user_email ON marketplace_lots(user_email);
    CREATE INDEX IF NOT EXISTS idx_lots_created ON marketplace_lots(created_at DESC);
  `);

  // 3. Marketplace Interactions (Bids, Counter-Offers, Seller Proposals)
  db.exec(`
    CREATE TABLE IF NOT EXISTS marketplace_interactions (
      id TEXT PRIMARY KEY,
      lot_id TEXT NOT NULL REFERENCES marketplace_lots(id) ON DELETE CASCADE,
      user_name TEXT,
      user_email TEXT NOT NULL,
      interaction_type TEXT NOT NULL, -- 'bid', 'counter_offer', 'proposal', 'message'
      amount REAL,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_interact_lot_id ON marketplace_interactions(lot_id);
    CREATE INDEX IF NOT EXISTS idx_interact_user ON marketplace_interactions(user_email);
  `);

  // 4. User Accounts Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'user', -- 'user', 'moderator', 'admin'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // 5. Batch Scraper Ingestion Job Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS batch_ingest_logs (
      id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      records_received INTEGER NOT NULL,
      records_inserted INTEGER NOT NULL,
      records_updated INTEGER NOT NULL,
      execution_time_ms REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ==========================================
// Batch Ingestion Operations (Engineered for Scrapers & Parsers)
// ==========================================
export function batchIngestTransactions(records, sourceName = "Batch Ingest") {
  const db = getDb();
  const startTime = Date.now();

  const upsertStmt = db.prepare(`
    INSERT INTO historical_transactions (
      id, source_id, source_name, source_type, source_url, external_lot_id,
      title, category, subcategory, maker, period, condition, price_czk,
      hammer_price_czk, currency, original_amount, price_type,
      verification_level, verification_source_type, verification_signature, sale_date, city,
      lat, lng, location_precision, is_sample, status, note, raw_data_json, updated_at
    ) VALUES (
      @id, @source_id, @source_name, @source_type, @source_url, @external_lot_id,
      @title, @category, @subcategory, @maker, @period, @condition, @price_czk,
      @hammer_price_czk, @currency, @original_amount, @price_type,
      @verification_level, @verification_source_type, @verification_signature, @sale_date, @city,
      @lat, @lng, @location_precision, @is_sample, @status, @note, @raw_data_json, CURRENT_TIMESTAMP
    )
    ON CONFLICT(source_url) DO UPDATE SET
      price_czk = excluded.price_czk,
      hammer_price_czk = excluded.hammer_price_czk,
      condition = excluded.condition,
      status = excluded.status,
      verification_signature = excluded.verification_signature,
      note = excluded.note,
      updated_at = CURRENT_TIMESTAMP
  `);

  let inserted = 0;
  let updated = 0;

  const executeBatch = db.transaction((rows) => {
    for (const r of rows) {
      const sanitized = {
        id: r.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        source_id: r.source_id || "scraped_feed",
        source_name: r.source_name || sourceName,
        source_type: r.source_type || "auction_house",
        source_url: r.source_url && !r.source_url.includes("huntique.local") ? r.source_url : null,
        external_lot_id: r.external_lot_id ? String(r.external_lot_id) : (r.lot ? String(r.lot) : null),
        title: r.title || "Untitled Lot",
        category: r.category || "furniture",
        subcategory: r.subcategory || "other",
        maker: r.maker || "Unknown",
        period: r.period || "Unknown",
        condition: r.condition || r.note || null,
        price_czk: Number(r.price_czk) || 0,
        hammer_price_czk: r.hammer_price_czk ? Number(r.hammer_price_czk) : null,
        currency: r.currency || "CZK",
        original_amount: r.original_amount ? Number(r.original_amount) : Number(r.price_czk) || 0,
        price_type: r.price_type || "marketplace",
        verification_level: r.verification_level || "documented",
        verification_source_type: r.verification_source_type || "auction",
        verification_signature: r.verification_signature || generateVerificationSignature(r),
        sale_date: r.sale_date || new Date().toISOString().slice(0, 10),
        city: r.city || "Prague",
        lat: r.lat ? Number(r.lat) : 50.087,
        lng: r.lng ? Number(r.lng) : 14.421,
        location_precision: r.location_precision || "city",
        is_sample: r.is_sample ? 1 : 0,
        status: r.status || (r.price_type === "asking" ? "active" : "sold"),
        note: r.note || null,
        raw_data_json: r.raw_data_json ? JSON.stringify(r.raw_data_json) : null,
      };

      const info = upsertStmt.run(sanitized);
      if (info.changes > 0) {
        inserted++;
      }
    }
  });

  executeBatch(records);

  const durationMs = Date.now() - startTime;

  // Log batch execution
  const logStmt = db.prepare(`
    INSERT INTO batch_ingest_logs (id, source_name, records_received, records_inserted, records_updated, execution_time_ms)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  logStmt.run(
    `log_${Date.now()}`,
    sourceName,
    records.length,
    inserted,
    updated,
    durationMs
  );

  return {
    success: true,
    totalReceived: records.length,
    inserted,
    durationMs,
    speedPerSecond: Math.round((records.length / (durationMs || 1)) * 1000),
  };
}

// ==========================================
// Historical Transactions Query Engine
// ==========================================
export function getHistoricalTransactions(filters = {}) {
  const db = getDb();
  let sql = `SELECT * FROM historical_transactions WHERE 1=1`;
  const params = [];

  if (filters.status === "active") {
    sql += ` AND (status = 'active' OR price_type = 'asking')`;
  } else if (filters.status === "sold") {
    sql += ` AND status = 'sold' AND price_type != 'asking'`;
  }

  if (filters.category) {
    sql += ` AND category = ?`;
    params.push(filters.category);
  }

  if (filters.subcategory) {
    sql += ` AND subcategory = ?`;
    params.push(filters.subcategory);
  }

  if (filters.maker) {
    sql += ` AND maker = ?`;
    params.push(filters.maker);
  }

  if (filters.yearFrom) {
    sql += ` AND CAST(SUBSTR(sale_date, 1, 4) AS INTEGER) >= ?`;
    params.push(Number(filters.yearFrom));
  }

  if (filters.yearTo) {
    sql += ` AND CAST(SUBSTR(sale_date, 1, 4) AS INTEGER) <= ?`;
    params.push(Number(filters.yearTo));
  }

  if (filters.priceMin) {
    sql += ` AND price_czk >= ?`;
    params.push(Number(filters.priceMin));
  }

  if (filters.priceMax) {
    sql += ` AND price_czk <= ?`;
    params.push(Number(filters.priceMax));
  }

  if (filters.dataset === "real") {
    sql += ` AND is_sample = 0`;
  } else if (filters.dataset === "sample") {
    sql += ` AND is_sample = 1`;
  }

  if (filters.levels && Array.isArray(filters.levels) && filters.levels.length > 0) {
    const placeholders = filters.levels.map(() => "?").join(",");
    sql += ` AND verification_level IN (${placeholders})`;
    params.push(...filters.levels);
  }

  if (filters.priceTypes && Array.isArray(filters.priceTypes) && filters.priceTypes.length > 0) {
    const placeholders = filters.priceTypes.map(() => "?").join(",");
    sql += ` AND price_type IN (${placeholders})`;
    params.push(...filters.priceTypes);
  }

  if (filters.q) {
    const term = `%${filters.q.trim()}%`;
    sql += ` AND (title LIKE ? OR maker LIKE ? OR city LIKE ? OR period LIKE ? OR verification_signature LIKE ?)`;
    params.push(term, term, term, term, term);
  }

  sql += ` ORDER BY sale_date DESC`;

  if (filters.limit) {
    sql += ` LIMIT ?`;
    params.push(Number(filters.limit));
    if (filters.offset) {
      sql += ` OFFSET ?`;
      params.push(Number(filters.offset));
    }
  }

  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

// Compute trend points grouped by year in 1 fast SQL query
export function computeTrendStats(subcategory, maker) {
  const db = getDb();
  const sql = `
    SELECT
      CAST(SUBSTR(sale_date, 1, 4) AS INTEGER) as year,
      COUNT(*) as count,
      MIN(price_czk) as min,
      MAX(price_czk) as max,
      AVG(price_czk) as avg
    FROM historical_transactions
    WHERE subcategory = ?
      AND maker = ?
      AND price_type != 'asking'
      AND verification_level != 'reported'
    GROUP BY year
    ORDER BY year ASC
  `;
  const points = db.prepare(sql).all(subcategory, maker);

  // Calculate median for each year group
  for (const p of points) {
    const prices = db.prepare(`
      SELECT price_czk FROM historical_transactions
      WHERE subcategory = ? AND maker = ? AND CAST(SUBSTR(sale_date, 1, 4) AS INTEGER) = ?
        AND price_type != 'asking' AND verification_level != 'reported'
      ORDER BY price_czk ASC
    `).all(subcategory, maker, p.year).map((r) => r.price_czk);

    const m = Math.floor(prices.length / 2);
    p.median = prices.length % 2 ? prices[m] : Math.round((prices[m - 1] + prices[m]) / 2);
  }

  const totalCount = points.reduce((acc, p) => acc + p.count, 0);
  return { points, enough: totalCount >= 5, totalCount };
}

// ==========================================
// Marketplace Listings Engine
// ==========================================
export function getMarketplaceLots(filters = {}) {
  const db = getDb();
  let sql = `SELECT * FROM marketplace_lots WHERE 1=1`;
  const params = [];

  if (filters.type && filters.type !== "all") {
    sql += ` AND type = ?`;
    params.push(filters.type);
  }

  if (filters.category && filters.category !== "all") {
    sql += ` AND category = ?`;
    params.push(filters.category);
  }

  if (filters.status && filters.status !== "all") {
    sql += ` AND status = ?`;
    params.push(filters.status);
  } else {
    sql += ` AND status = 'active'`;
  }

  if (filters.userEmail) {
    sql += ` AND user_email = ?`;
    params.push(filters.userEmail);
  }

  if (filters.q) {
    const term = `%${filters.q.trim()}%`;
    sql += ` AND (title LIKE ? OR maker LIKE ? OR city LIKE ? OR description LIKE ?)`;
    params.push(term, term, term, term);
  }

  sql += ` ORDER BY created_at DESC`;

  const rows = db.prepare(sql).all(...params);
  return rows.map(formatLot);
}

export function getMarketplaceLotById(id) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM marketplace_lots WHERE id = ?`).get(id);
  if (!row) return null;

  const lot = formatLot(row);

  // Attach interactions (bids/counter-offers)
  const interactions = db.prepare(`
    SELECT * FROM marketplace_interactions
    WHERE lot_id = ?
    ORDER BY created_at DESC
  `).all(id);

  if (lot.type === "offer") {
    lot.bids = interactions.map((i) => ({
      id: i.id,
      user: i.user_name || "Anonymous bidder",
      amount: i.amount,
      date: i.created_at.slice(0, 10),
      note: i.note,
    }));
  } else {
    lot.proposals = interactions.map((i) => ({
      id: i.id,
      from: i.user_name || "Anonymous seller",
      amount: i.amount ? `${i.amount.toLocaleString("cs-CZ")} Kč` : "Proposal",
      note: i.note,
      date: i.created_at.slice(0, 10),
    }));
  }

  return lot;
}

export function createMarketplaceLot(lot) {
  const db = getDb();
  const id = lot.id || `lot_${Date.now()}`;

  const currentBid = Number(lot.currentBid || lot.budgetNum || 1000);
  const minNextBid = lot.type === "offer" ? currentBid + 500 : currentBid;

  const stmt = db.prepare(`
    INSERT INTO marketplace_lots (
      id, type, title, category, subcategory, maker, year, period,
      city, seller_or_buyer_name, user_type, user_email,
      current_bid_or_budget, min_next_bid, bids_or_responses_count,
      ends_in, tag, icon, description, condition, status,
      images_json, analytics_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?, 'active',
      ?, ?
    )
  `);

  stmt.run(
    id,
    lot.type || "offer",
    lot.title,
    lot.category || "furniture",
    lot.subcategory || "other",
    lot.maker || "Unknown",
    lot.year || lot.targetYears || "Unknown",
    lot.period || null,
    lot.city || "Prague",
    lot.seller || lot.buyer || lot.seller_or_buyer_name || "User",
    lot.sellerType || lot.buyerType || lot.user_type || "private",
    lot.userEmail || "user@huntique.cz",
    currentBid,
    minNextBid,
    0,
    lot.endsIn || "7 days",
    lot.tag || (lot.type === "offer" ? "For Sale" : "Ready Buyer"),
    lot.icon || "ITEM",
    lot.description || "",
    lot.condition || "",
    JSON.stringify(lot.images || []),
    JSON.stringify(lot.analytics || {})
  );

  return getMarketplaceLotById(id);
}

export function deleteMarketplaceLot(id) {
  const db = getDb();
  const res = db.prepare(`DELETE FROM marketplace_lots WHERE id = ?`).run(id);
  return res.changes > 0;
}

export function addInteraction(lotId, { userEmail, userName, interactionType, amount, note }) {
  const db = getDb();

  const id = `interact_${Date.now()}`;
  const addStmt = db.prepare(`
    INSERT INTO marketplace_interactions (id, lot_id, user_name, user_email, interaction_type, amount, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    addStmt.run(id, lotId, userName, userEmail, interactionType, amount, note);

    // If it's a higher bid on an offer, update the leading offer in real-time
    if (interactionType === "bid" && amount) {
      db.prepare(`
        UPDATE marketplace_lots
        SET current_bid_or_budget = ?,
            min_next_bid = ? + 500,
            bids_or_responses_count = bids_or_responses_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND (? > current_bid_or_budget)
      `).run(amount, amount, lotId, amount);
    } else {
      db.prepare(`
        UPDATE marketplace_lots
        SET bids_or_responses_count = bids_or_responses_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(lotId);
    }
  });

  tx();
  return getMarketplaceLotById(lotId);
}

// User Authentication Queries
export function getUserByEmail(email) {
  const db = getDb();
  return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase().trim());
}

export function createUser(email, passwordHash, role = "user", displayName = null) {
  const db = getDb();
  const id = `usr_${Date.now()}`;
  const cleanEmail = email.toLowerCase().trim();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, cleanEmail, passwordHash, displayName || cleanEmail.split("@")[0], role);

  return { id, email: cleanEmail, role, displayName: displayName || cleanEmail.split("@")[0] };
}

function formatLot(row) {
  let images = [];
  let analytics = {};
  try {
    images = JSON.parse(row.images_json || "[]");
  } catch {}
  try {
    analytics = JSON.parse(row.analytics_json || "{}");
  } catch {}

  const isOffer = row.type === "offer";

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    category: row.category,
    subcategory: row.subcategory,
    maker: row.maker,
    year: row.year,
    targetYears: row.year,
    period: row.period,
    city: row.city,
    seller: isOffer ? row.seller_or_buyer_name : undefined,
    buyer: !isOffer ? row.seller_or_buyer_name : undefined,
    sellerType: row.user_type,
    buyerType: row.user_type,
    // user_email is intentionally not exposed through the public API
    currentBid: isOffer ? row.current_bid_or_budget : undefined,
    budgetNum: !isOffer ? row.current_bid_or_budget : undefined,
    targetBudget: !isOffer ? `${row.current_bid_or_budget.toLocaleString("cs-CZ")} Kč` : undefined,
    minNextBid: row.min_next_bid,
    bidsCount: isOffer ? row.bids_or_responses_count : undefined,
    responsesCount: !isOffer ? row.bids_or_responses_count : undefined,
    endsIn: row.ends_in,
    tag: row.tag,
    icon: row.icon,
    description: row.description,
    condition: row.condition,
    status: row.status,
    images: images.length ? images : ["https://images.unsplash.com/photo-1580481077197-9b29a6d7d100?auto=format&fit=crop&w=1000&q=80"],
    analytics,
    created_at: row.created_at,
  };
}
