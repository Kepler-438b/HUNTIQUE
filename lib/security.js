import crypto from "crypto";
import { NextResponse } from "next/server";

// Server-only security helpers. Nothing here is imported by client components.
//
// Environment variables (set in .env.local locally, or in the hosting dashboard):
//   HUNTIQUE_ALLOW_WRITES=true      enable POST/DELETE API routes (default: off = public read-only demo)
//   HUNTIQUE_INGEST_TOKEN=<secret>  required as "Authorization: Bearer <secret>" for /api/batch/ingest
//   HUNTIQUE_ADMIN_EMAILS=a@x,b@y   accounts that receive the admin role on registration

export function writesEnabled() {
  return process.env.HUNTIQUE_ALLOW_WRITES === "true";
}

// Returns a 403 response when the deployment is read-only, otherwise null.
export function denyIfReadOnly() {
  if (writesEnabled()) return null;
  return NextResponse.json(
    { success: false, readOnly: true, error: "Public demo is read-only. Changes are kept only in your browser." },
    { status: 403 }
  );
}

// Constant-time bearer token check for machine-to-machine endpoints.
export function hasValidBearer(request, expected) {
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isAdminEmail(email) {
  const list = (process.env.HUNTIQUE_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(String(email || "").toLowerCase().trim());
}

// scrypt password hashing: "scrypt$<salt hex>$<hash hex>"
export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(String(password), Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}
