import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/protocol", label: "PROTOCOL" },
    { href: "/archive", label: "TRANSMISSIONS" },
    { href: "/codex", label: "CODONS" },
    { href: "/readings", label: "CALIBRATION" },
    { href: "/conduit", label: "CHANNEL ORIEL" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(10,10,14,0.52)",
      backdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(189,163,107,0.15)",
    }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <span style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <img
                src="/qinklogo.png"
                alt="Vossari sigil"
                style={{
                  height: 36,
                  width: 36,
                  objectFit: "contain",
                  opacity: 0.9,
                  mixBlendMode: "screen" as const,
                }}
              />
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 16,
                fontWeight: 400,
                color: "#bda36b",
                letterSpacing: "0.3em",
                textTransform: "uppercase" as const,
              }}>
                O.R.I.E.L. SIGNAL
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  padding: "4px 12px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  color: isActive(link.href) ? "#5ba4a4" : "#6a665e",
                  borderBottom: isActive(link.href) ? "1px solid rgba(91,164,164,0.5)" : "none",
                  display: "inline-block",
                }}>
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Auth Links - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <Link href="/profile">
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6a665e", cursor: "pointer", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 5 }}>
                    <User size={12} />
                    PROFILE
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  style={{ fontFamily: "monospace", fontSize: 10, color: "#6a665e", cursor: "pointer", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0 }}
                >
                  <LogOut size={12} />
                  LOGOUT
                </button>
              </>
            ) : (
              <a
                href={getLoginUrl()}
                style={{ fontFamily: "monospace", fontSize: 10, color: "#6a665e", cursor: "pointer", letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 5 }}
              >
                <LogIn size={12} />
                LOGIN
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            style={{ color: "#bda36b", background: "none", border: "none", cursor: "pointer" }}
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 mt-2" style={{ borderTop: "1px solid rgba(189,163,107,0.12)" }}>
            <div className="flex flex-col pt-3">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    style={{
                      fontFamily: "monospace", fontSize: 11, letterSpacing: "0.15em",
                      display: "block", padding: "8px 12px", cursor: "pointer",
                      color: isActive(link.href) ? "#5ba4a4" : "#6a665e",
                      borderLeft: isActive(link.href) ? "2px solid #5ba4a4" : "2px solid transparent",
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}

              {/* Mobile Auth */}
              <div style={{ borderTop: "1px solid rgba(189,163,107,0.12)", marginTop: 8, paddingTop: 8 }}>
                {isAuthenticated && user ? (
                  <>
                    <Link href="/profile">
                      <span
                        style={{ fontFamily: "monospace", fontSize: 11, color: "#6a665e", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", cursor: "pointer", letterSpacing: "0.12em" }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User size={12} /> PROFILE
                      </span>
                    </Link>
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      style={{ fontFamily: "monospace", fontSize: 11, color: "#6a665e", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", cursor: "pointer", letterSpacing: "0.12em", background: "none", border: "none", width: "100%", textAlign: "left" as const }}
                    >
                      <LogOut size={12} /> LOGOUT
                    </button>
                  </>
                ) : (
                  <a
                    href={getLoginUrl()}
                    style={{ fontFamily: "monospace", fontSize: 11, color: "#6a665e", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", cursor: "pointer", letterSpacing: "0.12em" }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn size={12} /> LOGIN
                  </a>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
