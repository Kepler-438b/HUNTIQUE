"use client";
import { useEffect, useState } from "react";
import { realRecords } from "./data/realRecords.js";

const STORAGE_KEY = "huntique_store_v3";
const AUTH_KEY = "huntique_auth_v3";
const EVENT = "huntique-store-event";
const AUTH_EVENT = "huntique-auth-event";

// Initial default offers
export const DEFAULT_OFFERS = [
  {
    id: "lot_1",
    type: "offer",
    title: "Thonet Armchair No. A811 (Design by Josef Hoffmann)",
    category: "furniture",
    subcategory: "armchair",
    seller: "Demo Shop 01",
    sellerType: "shop",
    userEmail: "demo-seller-1@example.com",
    city: "Prague",
    year: "ca. 1930",
    maker: "Gebrüder Thonet",
    currentBid: 18500,
    minNextBid: 19000,
    bidsCount: 6,
    endsIn: "2 days",
    tag: "Shop / Gallery",
    icon: "CHAIR",
    description: "Original bent solid beechwood, Viennese cane weave without damage. Factory stamp from Bystřice pod Hostýnem intact under the front seat rail.",
    condition: "Original finish with authentic patina, stable joints, no cracks in wood.",
    images: [
      "https://images.unsplash.com/photo-1580481077197-9b29a6d7d100?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1000&q=80",
    ],
    analytics: {
      marketMedian: "19,200 Kč",
      historicalSalesCount: 14,
      trend: "Illustrative value (demo listing)",
      sourceName: "Arthouse Hejtmánek & Sýpka Archives",
      sourceUrl: "https://www.arthousehejtmanek.cz",
    },
    bids: [
      { id: "b1", user: "Bidder A", amount: 16500, date: "2026-03-01" },
      { id: "b2", user: "Bidder B", amount: 18500, date: "2026-03-03" },
    ],
  },
  {
    id: "lot_2",
    type: "offer",
    title: "Moser Crystal Vase with Gold Acid-Etched Relief",
    category: "tableware",
    subcategory: "glass",
    seller: "Demo Collector 02",
    sellerType: "private",
    userEmail: "demo-seller-2@example.com",
    city: "Karlovy Vary",
    year: "1925",
    maker: "Moser Karlovy Vary",
    currentBid: 12000,
    minNextBid: 12500,
    bidsCount: 9,
    endsIn: "5 hours",
    tag: "Private Individual",
    icon: "VASE",
    description: "Deep faceted cut glass, 24-karat gold oroplastique frieze depicting mythological nymphs. Height 28 cm. Signed Moser Karlsbad on base.",
    condition: "Free of chips, fleabites, or cloudiness. Gold frieze 98% intact.",
    images: [
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80",
    ],
    analytics: {
      marketMedian: "13,800 Kč",
      historicalSalesCount: 22,
      trend: "Illustrative value (demo listing)",
      sourceName: "Dorotheum Prague Art Glass Catalog",
      sourceUrl: "https://www.dorotheum.com",
    },
    bids: [
      { id: "b3", user: "Bidder C", amount: 11000, date: "2026-03-02" },
      { id: "b4", user: "Bidder D", amount: 12000, date: "2026-03-03" },
    ],
  },
  {
    id: "lot_3",
    type: "offer",
    title: "Biedermeier Cherrywood Commode (Four Drawers)",
    category: "furniture",
    subcategory: "chest of drawers",
    seller: "Demo Shop 03",
    sellerType: "shop",
    userEmail: "demo-seller-3@example.com",
    city: "Brno",
    year: "ca. 1840",
    maker: "Moravian Cabinet Maker",
    currentBid: 42000,
    minNextBid: 43000,
    bidsCount: 4,
    endsIn: "1 day",
    tag: "Shop / Gallery",
    icon: "CHEST",
    description: "Four graduating drawers with original brass escutcheon plates and functioning master key. Hand-rubbed shellac French polish.",
    condition: "Expertly conserved in 2024, smooth drawer slides, original backboards.",
    images: [
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80",
    ],
    analytics: {
      marketMedian: "45,000 Kč",
      historicalSalesCount: 9,
      trend: "Illustrative value (demo listing)",
      sourceName: "Aukční dům Zezula, Brno",
      sourceUrl: "https://www.papilio.cz",
    },
    bids: [
      { id: "b5", user: "Bidder E", amount: 42000, date: "2026-03-02" },
    ],
  },
  {
    id: "lot_4",
    type: "offer",
    title: "Pirkenhammer Porcelain Tea Service (Březová)",
    category: "tableware",
    subcategory: "porcelain",
    seller: "Demo Collector 04",
    sellerType: "private",
    userEmail: "demo-seller-4@example.com",
    city: "Plzeň",
    year: "1910",
    maker: "Pirkenhammer",
    currentBid: 8500,
    minNextBid: 9000,
    bidsCount: 11,
    endsIn: "18 hours",
    tag: "Private Individual",
    icon: "TEA",
    description: "Complete 6-person service. Fine translucent bone china with hand-painted botanical motifs and gilded rims.",
    condition: "Museum condition, no hairline cracks, gilding fully preserved.",
    images: [
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=1000&q=80",
    ],
    analytics: {
      marketMedian: "9,000 Kč",
      historicalSalesCount: 18,
      trend: "Illustrative value (demo listing)",
      sourceName: "HUNTIQUE Historical Archive",
      sourceUrl: "/historical",
    },
    bids: [],
  },
  {
    id: "lot_5",
    type: "offer",
    title: "Art Deco Rosewood Veneer Executive Desk",
    category: "furniture",
    subcategory: "table",
    seller: "Demo Shop 05",
    sellerType: "shop",
    userEmail: "demo-seller-5@example.com",
    city: "Prague",
    year: "ca. 1928",
    maker: "UP Závody (attributed)",
    currentBid: 56000,
    minNextBid: 58000,
    bidsCount: 8,
    endsIn: "3 days",
    tag: "Shop / Gallery",
    icon: "DESK",
    description: "Streamlined geometric symmetry, nickel-plated pull handles, concealed document drawer. Exceptional condition.",
    condition: "High-gloss piano lacquer finish, all keys available.",
    images: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=80",
    ],
    analytics: {
      marketMedian: "58,000 Kč",
      historicalSalesCount: 7,
      trend: "Illustrative value (demo listing)",
      sourceName: "European Arts Auction Catalog",
      sourceUrl: "https://www.europeanarts.cz",
    },
    bids: [],
  },
  {
    id: "lot_6",
    type: "offer",
    title: "Set of Ruby Flashed Liqueur Glasses (Egermann)",
    category: "tableware",
    subcategory: "glass",
    maker: "Egermann Nový Bor",
    seller: "Demo Collector 06",
    sellerType: "private",
    userEmail: "demo-seller-6@example.com",
    city: "Liberec",
    year: "1890",
    currentBid: 6200,
    minNextBid: 6500,
    bidsCount: 5,
    endsIn: "1 day",
    tag: "Private Individual",
    icon: "GLASS",
    description: "Deep ruby stained Bohemian glass with wheel-engraved woodland and deer scenes. Flawless collector state.",
    condition: "Pristine condition, vivid staining without scratches.",
    images: [
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80",
    ],
    analytics: {
      marketMedian: "6,800 Kč",
      historicalSalesCount: 16,
      trend: "Illustrative value (demo listing)",
      sourceName: "HUNTIQUE Glass Archive",
      sourceUrl: "/historical",
    },
    bids: [],
  },
];

// Initial default requests (ready demand)
export const DEFAULT_REQUESTS = [
  {
    id: "req_1",
    type: "request",
    title: "Jindřich Halabala Armchair Model H-269 (Original Bentwood)",
    category: "furniture",
    subcategory: "armchair",
    buyer: "Demo Buyer 07",
    buyerType: "private",
    userEmail: "demo-buyer-7@example.com",
    city: "Prague",
    targetYears: "ca. 1935",
    targetBudget: "42,000 Kč",
    budgetNum: 42000,
    responsesCount: 3,
    tag: "Ready Buyer",
    icon: "CHAIR",
    description: "Looking for an authentic armchair H-269 designed by Jindřich Halabala for UP Závody. Original steam-bent beechwood loops in undamaged condition.",
    images: [
      "https://images.unsplash.com/photo-1580481077197-9b29a6d7d100?auto=format&fit=crop&w=1000&q=80",
    ],
    analytics: {
      marketMedian: "42,000 Kč",
      historicalSalesCount: 18,
      trend: "Illustrative value (demo listing)",
      sourceName: "Arthouse Hejtmánek & Sýpka Auction Archives",
      sourceUrl: "/historical",
    },
    proposals: [
      { id: "p1", from: "Demo Seller A", amount: "44,000 Kč", note: "Original unrestored piece with factory paper label." },
    ],
  },
  {
    id: "req_2",
    type: "request",
    title: "Set of 4 Thonet No. 14 Bentwood Dining Chairs in Dark Walnut / Beech",
    category: "furniture",
    subcategory: "chair",
    buyer: "Demo Buyer 08",
    buyerType: "shop",
    userEmail: "demo-buyer-8@example.com",
    city: "Brno",
    targetYears: "1900 – 1925",
    targetBudget: "16,000 Kč",
    budgetNum: 16000,
    responsesCount: 5,
    tag: "Ready Buyer",
    icon: "CHAIR",
    description: "Looking for an authentic matching set of four bentwood chairs with embossed seats or original wicker mesh. Minor surface patina acceptable, stable joints required.",
    images: [
      "https://images.unsplash.com/photo-1580481077197-9b29a6d7d100?auto=format&fit=crop&w=1000&q=80",
    ],
    analytics: {
      marketMedian: "15,500 Kč (set of 4)",
      historicalSalesCount: 42,
      trend: "Illustrative value (demo listing)",
      sourceName: "HUNTIQUE Historical Furniture Archive",
      sourceUrl: "/historical",
    },
    proposals: [],
  },
  {
    id: "req_3",
    type: "request",
    title: "Moser 'Splendid' Pattern Cut-Crystal Decanter with Intact 24k Gold",
    category: "tableware",
    subcategory: "glass",
    buyer: "Demo Buyer 09",
    buyerType: "shop",
    userEmail: "demo-buyer-9@example.com",
    city: "Karlovy Vary",
    targetYears: "1920 – 1938",
    targetBudget: "28,000 Kč",
    budgetNum: 28000,
    responsesCount: 2,
    tag: "Ready Buyer",
    icon: "VASE",
    description: "Required for an overseas client. Must have clean gilding on the oroplastique frieze and authentic etched base stamp. Immediate cash / wire transfer settlement.",
    images: [
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80",
    ],
    analytics: {
      marketMedian: "27,500 Kč",
      historicalSalesCount: 11,
      trend: "Illustrative value (demo listing)",
      sourceName: "Moser Historical Heritage Sales",
      sourceUrl: "https://www.moser.com",
    },
    proposals: [],
  },
  {
    id: "req_4",
    type: "request",
    title: "Biedermeier Walnut Cylinder Secretaire with Secret Drawers",
    category: "furniture",
    subcategory: "cabinet",
    buyer: "Demo Buyer 10",
    buyerType: "private",
    userEmail: "demo-buyer-10@example.com",
    city: "Plzeň",
    targetYears: "ca. 1825 – 1840",
    targetBudget: "65,000 Kč",
    budgetNum: 65000,
    responsesCount: 4,
    tag: "Ready Buyer",
    icon: "DESK",
    description: "Seeking a genuine Bohemian or Viennese cylinder roll-top desk in figured walnut or cherry veneer. All lock mechanisms and original keys must be operational.",
    images: [
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80",
    ],
    analytics: {
      marketMedian: "62,000 Kč",
      historicalSalesCount: 8,
      trend: "Illustrative value (demo listing)",
      sourceName: "Aukční dům Zezula Archive",
      sourceUrl: "https://www.papilio.cz",
    },
    proposals: [],
  },
];

// Initial historical transactions
export const DEFAULT_HISTORICAL = [
  ...realRecords.map((r) => ({
    ...r,
    verification_source_type: "auction",
    condition: r.note || "Catalogued in public auction.",
  })),
];

// Helper to read localStorage safely
function getStoredData() {
  if (typeof window === "undefined") {
    return {
      offers: DEFAULT_OFFERS,
      requests: DEFAULT_REQUESTS,
      historical: DEFAULT_HISTORICAL,
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = {
        offers: DEFAULT_OFFERS,
        requests: DEFAULT_REQUESTS,
        historical: DEFAULT_HISTORICAL,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {
      offers: DEFAULT_OFFERS,
      requests: DEFAULT_REQUESTS,
      historical: DEFAULT_HISTORICAL,
    };
  }
}

function saveStoredData(data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(EVENT));
  } catch (e) {
    console.error("Storage error:", e);
  }
}

// Global Store Hook for Marketplace Listings and Historical Transactions with SQLite Sync
export function useStore() {
  const [data, setData] = useState({
    offers: DEFAULT_OFFERS,
    requests: DEFAULT_REQUESTS,
    historical: DEFAULT_HISTORICAL,
  });

  useEffect(() => {
    // 1. Initial instant load from cache
    const sync = () => setData(getStoredData());
    sync();

    // 2. Fetch fresh real-time data from SQLite Backend
    const fetchFromSqlite = async () => {
      try {
        const [marketRes, histRes] = await Promise.all([
          fetch("/api/marketplace?status=all"),
          fetch("/api/historical?limit=5000"),
        ]);

        if (marketRes.ok && histRes.ok) {
          const marketData = await marketRes.json();
          const histData = await histRes.json();

          if (marketData.success && histData.success) {
            const allLots = marketData.lots || [];
            const offers = allLots.filter((l) => l.type === "offer");
            const requests = allLots.filter((l) => l.type === "request");
            const historical = histData.records || [];

            // Keep items the visitor created in this browser (the public demo does not persist them on the server)
            const cached = getStoredData();
            const localOnly = (list = []) => list.filter((x) => x.localOnly);
            const synced = {
              offers: [...localOnly(cached.offers), ...(offers.length ? offers : DEFAULT_OFFERS)],
              requests: [...localOnly(cached.requests), ...(requests.length ? requests : DEFAULT_REQUESTS)],
              historical: [...localOnly(cached.historical), ...(historical.length ? historical : DEFAULT_HISTORICAL)],
            };

            setData(synced);
            saveStoredData(synced);
          }
        }
      } catch (err) {
        // Fallback gracefully to stored data if offline
        console.warn("SQLite API fetch warning (using cached data):", err.message);
      }
    };

    fetchFromSqlite();

    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addOffer = async (offer) => {
    const current = getStoredData();
    const newOffer = {
      ...offer,
      localOnly: true,
      id: `lot_${Date.now()}`,
      type: "offer",
      currentBid: Number(offer.currentBid) || 1000,
      minNextBid: (Number(offer.currentBid) || 1000) + 500,
      bidsCount: 0,
      endsIn: "7 days",
      bids: [],
      images: offer.images?.length
        ? offer.images
        : ["https://images.unsplash.com/photo-1580481077197-9b29a6d7d100?auto=format&fit=crop&w=1000&q=80"],
      analytics: {
        marketMedian: `${(Number(offer.currentBid) || 1000).toLocaleString("cs-CZ")} Kč`,
        historicalSalesCount: null,
        trend: "New listing (demo, not verified)",
        sourceName: "HUNTIQUE Archive",
        sourceUrl: "/historical",
      },
    };

    // Optimistic UI update
    const updated = { ...current, offers: [newOffer, ...current.offers] };
    saveStoredData(updated);

    // Sync with SQLite in background
    try {
      await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffer),
      });
    } catch (e) {
      console.error("Failed to sync offer with SQLite:", e);
    }

    return newOffer;
  };

  const addRequest = async (req) => {
    const current = getStoredData();
    const newReq = {
      ...req,
      localOnly: true,
      id: `req_${Date.now()}`,
      type: "request",
      responsesCount: 0,
      proposals: [],
      tag: "Ready Buyer",
      images: req.images?.length
        ? req.images
        : ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80"],
      analytics: {
        marketMedian: req.targetBudget,
        historicalSalesCount: null,
        trend: "New buy request (demo)",
        sourceName: "HUNTIQUE Market Demand Index",
        sourceUrl: "/marketplace",
      },
    };

    const updated = { ...current, requests: [newReq, ...current.requests] };
    saveStoredData(updated);

    // Sync with SQLite
    try {
      await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReq),
      });
    } catch (e) {
      console.error("Failed to sync request with SQLite:", e);
    }

    return newReq;
  };

  const deleteListing = async (id) => {
    const current = getStoredData();
    const updated = {
      ...current,
      offers: current.offers.filter((o) => o.id !== id),
      requests: current.requests.filter((r) => r.id !== id),
    };
    saveStoredData(updated);

    try {
      await fetch(`/api/marketplace/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete from SQLite:", e);
    }
  };

  const addHistorical = async (record) => {
    const current = getStoredData();
    const newRec = {
      ...record,
      localOnly: true,
      id: `hist_mod_${Date.now()}`,
      price_czk: Number(record.price_czk) || 0,
      lat: Number(record.lat) || 50.0755,
      lng: Number(record.lng) || 14.4378,
    };
    const updated = { ...current, historical: [newRec, ...current.historical] };
    saveStoredData(updated);

    try {
      await fetch("/api/historical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRec),
      });
    } catch (e) {
      console.error("Failed to insert historical to SQLite:", e);
    }

    return newRec;
  };

  const deleteHistorical = async (id) => {
    const current = getStoredData();
    const updated = {
      ...current,
      historical: current.historical.filter((h) => h.id !== id),
    };
    saveStoredData(updated);

    try {
      await fetch(`/api/historical?id=${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete historical from SQLite:", e);
    }
  };

  const addBid = async (lotId, bid) => {
    const current = getStoredData();
    const updatedOffers = current.offers.map((lot) => {
      if (lot.id === lotId) {
        const amount = Number(bid.amount);
        return {
          ...lot,
          currentBid: Math.max(lot.currentBid, amount),
          minNextBid: Math.max(lot.currentBid, amount) + 500,
          bidsCount: lot.bidsCount + 1,
          bids: [{ ...bid, id: `b_${Date.now()}` }, ...(lot.bids || [])],
        };
      }
      return lot;
    });
    saveStoredData({ ...current, offers: updatedOffers });

    try {
      await fetch(`/api/marketplace/${lotId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: bid.user || "bidder@example.com",
          userName: bid.user,
          interactionType: "bid",
          amount: Number(bid.amount),
        }),
      });
    } catch (e) {
      console.error("Failed to record bid in SQLite:", e);
    }
  };

  const addProposal = async (reqId, proposal) => {
    const current = getStoredData();
    const updatedRequests = current.requests.map((req) => {
      if (req.id === reqId) {
        return {
          ...req,
          responsesCount: req.responsesCount + 1,
          proposals: [{ ...proposal, id: `p_${Date.now()}` }, ...(req.proposals || [])],
        };
      }
      return req;
    });
    saveStoredData({ ...current, requests: updatedRequests });

    try {
      await fetch(`/api/marketplace/${reqId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: proposal.from || "seller@example.com",
          userName: proposal.from,
          interactionType: "proposal",
          note: proposal.note || proposal.amount,
        }),
      });
    } catch (e) {
      console.error("Failed to record proposal in SQLite:", e);
    }
  };

  return {
    offers: data.offers,
    requests: data.requests,
    historical: data.historical,
    addOffer,
    addRequest,
    deleteListing,
    addHistorical,
    deleteHistorical,
    addBid,
    addProposal,
  };
}

// Authentication Store & Hook
export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem(AUTH_KEY);
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    };
    checkAuth();
    window.addEventListener(AUTH_EVENT, checkAuth);
    return () => window.removeEventListener(AUTH_EVENT, checkAuth);
  }, []);

  const saveSession = (userData) => {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    setUser(userData);
    window.dispatchEvent(new Event(AUTH_EVENT));
  };

  // Server login/registration. Works only when the server has writes enabled (local development).
  // Returns { ok: true } or { ok: false, error, readOnly }.
  const authRequest = async (action, email, password) => {
    if (!email || !password) return { ok: false, error: "Please fill in both email and password." };
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: email.toLowerCase().trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) return { ok: false, error: json.error || "Sign-in failed.", readOnly: !!json.readOnly };
      saveSession({
        email: json.user.email,
        name: json.user.displayName || json.user.email.split("@")[0],
        role: json.user.role === "admin" ? "admin" : "user",
        joinedAt: new Date().toISOString().slice(0, 10),
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "Server not reachable." };
    }
  };

  const login = (email, password) => authRequest("login", email, password);
  const register = (email, password) => authRequest("register", email, password);

  // Demo session for the public prototype: no credentials, nothing sent to the server.
  // The moderator role only unlocks UI in this browser; the server API stays read-only.
  const loginDemo = (role = "user") => {
    saveSession({
      email: role === "admin" ? "demo-moderator@example.com" : "demo-user@example.com",
      name: role === "admin" ? "Demo Moderator" : "Demo User",
      role: role === "admin" ? "admin" : "user",
      demo: true,
      joinedAt: new Date().toISOString().slice(0, 10),
    });
    return { ok: true };
  };

  const logout = () => {
    window.localStorage.removeItem(AUTH_KEY);
    setUser(null);
    window.dispatchEvent(new Event(AUTH_EVENT));
  };

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    register,
    loginDemo,
    logout,
  };
}
