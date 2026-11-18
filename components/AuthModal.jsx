"use client";
import { useState } from "react";
import { useAuth } from "@/lib/store";

export default function AuthModal({ isOpen, onClose, initialMode = "signin" }) {
  const { login, register, loginDemo } = useAuth();
  const [mode, setMode] = useState(initialMode); // "signin" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const result = mode === "register" ? await register(email, password) : await login(email, password);
    if (result.ok) {
      onClose();
    } else if (result.readOnly) {
      setError("Accounts are disabled in the public demo. Use a demo session below.");
    } else {
      setError(result.error);
    }
  };

  const enterDemo = (role) => {
    loginDemo(role);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
            {mode === "register" ? "Create an Account" : "Sign In to HUNTIQUE"}
          </h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <img src="/huntiqueLogo.png" alt="HUNTIQUE" style={{ width: 56, height: 56, objectFit: "contain" }} />
          </div>
          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", padding: "8px 12px", borderRadius: 4, marginBottom: 14, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="demo@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: 12 }}>
              {mode === "register" ? "Register & Enter Cabinet" : "Sign In"}
            </button>
          </div>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 10px", lineHeight: 1.5 }}>
              Student prototype: do not enter real personal data or passwords. Demo sessions store nothing on the server;
              your changes stay only in this browser.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-outline btn-small" style={{ flex: 1 }} onClick={() => enterDemo("user")}>
                Demo user
              </button>
              <button type="button" className="btn btn-outline btn-small" style={{ flex: 1 }} onClick={() => enterDemo("admin")}>
                Demo moderator
              </button>
            </div>
          </div>

          <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
            {mode === "register" ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, padding: 0 }}
                  onClick={() => setMode("signin")}
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account yet?{" "}
                <button
                  type="button"
                  style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, padding: 0 }}
                  onClick={() => setMode("register")}
                >
                  Register
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
