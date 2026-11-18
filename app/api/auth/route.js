import { NextResponse } from "next/server";
import { getUserByEmail, createUser } from "@/lib/db/index.js";
import { denyIfReadOnly, hashPassword, verifyPassword, isAdminEmail } from "@/lib/security.js";

// POST /api/auth
// Handles { action: "login" | "register", email, password }
// Disabled on the public read-only demo (no credentials are stored there).
export async function POST(request) {
  const denied = denyIfReadOnly();
  if (denied) return denied;

  try {
    const body = await request.json();
    const { action, email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    if (action === "register") {
      if (getUserByEmail(cleanEmail)) {
        return NextResponse.json({ success: false, error: "User with this email already exists." }, { status: 409 });
      }
      const role = isAdminEmail(cleanEmail) ? "admin" : "user";
      const user = createUser(cleanEmail, hashPassword(password), role);
      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName },
      }, { status: 201 });
    }

    if (action === "login") {
      const user = getUserByEmail(cleanEmail);
      if (!user || !verifyPassword(password, user.password_hash)) {
        return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
      }
      return NextResponse.json({
        success: true,
        user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name },
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/auth error:", error);
    return NextResponse.json({ success: false, error: "Authentication failed." }, { status: 500 });
  }
}
