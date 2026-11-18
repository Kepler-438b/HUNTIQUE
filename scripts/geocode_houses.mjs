// Geocodes each auction house at its published street address and verifies the result.
//
// Input:  auction-house addresses from the cached Livebid API responses (data/raw/livebid/auctions_p*.json)
// Output: data/house_locations.json  (one entry per house, with the OSM match and a reverse-geocode check)
// Usage:  node scripts/geocode_houses.mjs [--refresh]
//
// Method (OpenStreetMap Nominatim, 1 request/s, identified User-Agent):
//   1. forward search on "street, city" (several house-number spellings, Czech "591/47" style);
//   2. reverse geocoding of the found point; the entry is "verified" only if the reverse result
//      lies on the same street and in the same municipality;
//   3. if no street match is found, the postcode/city centroid is used and marked as such.
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw", "livebid");
const OUT = path.join(ROOT, "data", "house_locations.json");
const UA = "HUNTIQUE-student-prototype/0.1 (non-commercial university CI project)";
const REFRESH = process.argv.includes("--refresh");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

// Houses whose published address fields are swapped or combined. Values are copied from the
// house's own published address text (shown in the comment), only moved into the right field.
const OVERRIDES = {
  "Einszwei Gallery": { street: "U Klikovky 118/4", postcode: "15000", city: "Praha 5" }, // postcode field: "U Klikovky 118/4, 150 00"
  Artkunst: { street: "Betlémské náměstí 8", postcode: "11000", city: "Praha 1" }, // city field: "Betlémské nám. 8, Praha 1"
  Graciano: { street: "Veselá 39", postcode: "60200", city: "Brno" }, // street field: "Veselá 39 , Brno  Opletalova 59, Praha 1" (first listed address used)
  "Starožitnosti pod Kinskou s. r. o": { street: "Vítězná 530/11", postcode: "15000", city: "Praha 5" }, // street field: "Vítězná 11 / 530"
};

function houses() {
  const out = {};
  for (const f of fs.readdirSync(RAW).filter((f) => f.startsWith("auctions_p"))) {
    for (const a of JSON.parse(fs.readFileSync(path.join(RAW, f), "utf8")).data.auctions) {
      const c = a.client;
      if (!c || c.address?.country !== "CZ") continue;
      const id = `livebid_client_${c.clientId}`;
      if (!out[id]) out[id] = { id, name: c.name, published: c.address };
    }
  }
  return out;
}

function cleanAddress(h) {
  const o = OVERRIDES[h.name];
  if (o) return { ...o, overridden: true };
  const p = h.published;
  return {
    street: String(p.street || "").replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ").trim(),
    postcode: (String(p.postcode || "").replace(/\s+/g, "").match(/\d{5}/) || [""])[0],
    city: String(p.city || "").trim(),
  };
}

const municipality = (city) => city.replace(/\s*[-–].*$/, "").replace(/\s+\d+$/, "").trim(); // "Praha 6 - Bubeneč" -> "Praha"

function streetVariants(street) {
  const m = street.match(/^(.*?)\s+(\d+[a-z]?)(?:\/(\d+[a-z]?))?$/i);
  if (!m) return [street];
  const [, name, a, b] = m;
  return [...new Set([b ? `${name} ${a}/${b}` : null, b ? `${name} ${b}` : null, `${name} ${a}`, name].filter(Boolean))];
}

async function nominatim(url) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    await sleep(1100 * attempt * attempt); // back off if the service asks us to slow down
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "cs" } });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.warn(`  Nominatim returned HTTP ${res.status} (not JSON), retry ${attempt}/4`);
    }
  }
  throw new Error("Nominatim unavailable");
}

async function locate(h) {
  const addr = cleanAddress(h);
  const town = municipality(addr.city);
  const streetName = addr.street.replace(/\s+\d.*$/, "");
  for (const street of streetVariants(addr.street)) {
    const q = new URLSearchParams({ format: "jsonv2", addressdetails: "1", limit: "1", countrycodes: "cz", street, city: town });
    const [hit] = await nominatim(`https://nominatim.openstreetmap.org/search?${q}`);
    if (!hit) continue;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    const rev = await nominatim(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`);
    const ra = rev.address || {};
    const revTown = ra.city || ra.town || ra.village || ra.municipality || "";
    const sameStreet = norm(ra.road || "").includes(norm(streetName)) || norm(streetName).includes(norm(ra.road || "~"));
    const sameTown = norm(revTown).includes(norm(town)) || norm(town).includes(norm(revTown || "~"));
    return {
      ...h,
      address_used: addr,
      lat,
      lng,
      precision: street === streetName ? "street" : "address",
      matched: hit.display_name,
      reverse: { road: ra.road || null, house_number: ra.house_number || null, suburb: ra.suburb || ra.city_district || null, town: revTown, postcode: ra.postcode || null },
      verified: sameStreet && sameTown,
      checks: { sameStreet, sameTown, postcodeMatches: addr.postcode ? (ra.postcode || "").replace(/\s/g, "") === addr.postcode : null },
    };
  }
  // fallback: postcode / city centroid
  const q = [addr.postcode, town, "Czechia"].filter(Boolean).join(" ");
  const [hit] = await nominatim(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=cz&q=${encodeURIComponent(q)}`);
  return {
    ...h,
    address_used: addr,
    lat: hit ? Number(hit.lat) : null,
    lng: hit ? Number(hit.lon) : null,
    precision: hit ? "city" : "unknown",
    matched: hit?.display_name || null,
    verified: false,
    checks: { sameStreet: false },
  };
}

const cache = fs.existsSync(OUT) && !REFRESH ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const all = houses();
const needed = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, "data", "livebid_dataset.json"), "utf8")).map((r) => r.source_id));
for (const h of Object.values(all)) {
  if (!needed.has(h.id) || cache[h.id]) continue;
  cache[h.id] = await locate(h);
  const c = cache[h.id];
  console.log(`${c.verified ? "OK " : "?? "} ${c.name} -> ${c.lat?.toFixed(5)},${c.lng?.toFixed(5)} [${c.precision}] ${c.reverse ? `${c.reverse.road} ${c.reverse.house_number || ""}, ${c.reverse.suburb || ""}, ${c.reverse.town}` : c.matched}`);
  fs.writeFileSync(OUT, JSON.stringify(cache, null, 1));
}
const list = Object.values(cache);
console.log(JSON.stringify({ houses: list.length, verified: list.filter((x) => x.verified).length, street_or_address: list.filter((x) => x.precision !== "city").length }));
