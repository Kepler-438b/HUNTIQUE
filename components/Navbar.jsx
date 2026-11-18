"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/store";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin");

  const openAuth = (mode = "signin") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand" title="HUNTIQUE Home">
          <img
            src="/huntiqueLogo.png"
            alt="HUNTIQUE"
            className="brand-logo-img"
          />
        </Link>
        <nav className="nav-menu">
          <Link href="/historical" className="nav-pill-btn">Historical</Link>
          <Link href="/analysis" className="nav-pill-btn">Price Map</Link>
          <Link href="/marketplace" className="nav-pill-btn">Marketplace</Link>
          <Link href="/about" className="nav-pill-btn">About Data</Link>
          <Link href="/admin" className="nav-pill-btn nav-admin-link">
            Master Panel
          </Link>
        </nav>

        <div className="topbar-right">
          {isAuthenticated ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/account" className="user-cabinet-btn" title="Open Personal Cabinet">
                <span className="user-status-dot"></span>
                <span className="user-email-text">{user.email}</span>
                <span className="cabinet-pill">Cabinet</span>
              </Link>
              <button
                onClick={logout}
                className="btn btn-outline btn-small nav-pill-btn"
                style={{ padding: "6px 14px", fontSize: 12 }}
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => openAuth("signin")}
                className="btn btn-secondary btn-small nav-pill-btn"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth("register")}
                className="btn btn-primary btn-small nav-pill-btn"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
