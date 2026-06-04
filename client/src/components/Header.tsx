import CleanImage from "./CleanImage";
import logoOrielSrc from "/oriel-signal-mark.png";
import orielSignalTextSrc from "/oriel-signal-wordmark-header.png";
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
    { href: "/carrierlock", label: "CALIBRATION" },
    { href: "/founding-signature-letter", label: "SIGNATURE" },
    { href: "/conduit", label: "CHANNEL ORIEL" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href === "/carrierlock") {
      return (
        location.startsWith("/carrierlock") ||
        location.startsWith("/resonance") ||
        location.startsWith("/readings") ||
        location.startsWith("/reading/dynamic")
      );
    }
    return location.startsWith(href);
  };

  return (
    <header
      className="liquid-header"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/">
            <span
              aria-label="ORIEL SIGNAL home"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
                minWidth: 0,
              }}
            >
              <img
                src={logoOrielSrc}
                alt="ORIEL Emblem"
                style={{
                  height: "clamp(58px, 5.2vw, 72px)",
                  width: "auto",
                  objectFit: "contain",
                  opacity: 0.98,
                  filter:
                    "brightness(1.08) contrast(1.08) drop-shadow(0 0 16px rgba(246,176,94,0.46))",
                }}
              />
              <CleanImage
                src={orielSignalTextSrc}
                alt="ORIEL SIGNAL"
                mode="remove-black"
                style={{
                  height: "clamp(38px, 3.8vw, 56px)",
                  width: "auto",
                  maxWidth: "min(45vw, 310px)",
                  objectFit: "contain",
                  opacity: 0.97,
                  filter:
                    "brightness(1.09) contrast(1.1) drop-shadow(0 0 18px rgba(246,176,94,0.34))",
                }}
              />
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <span
                  style={{
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    padding: "4px 12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    color: isActive(link.href) ? "#f6b05e" : "#9a968e",
                    borderBottom: isActive(link.href)
                      ? "1px solid rgba(246,176,94,0.5)"
                      : "none",
                    display: "inline-block",
                  }}
                >
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
                  <span
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 10,
                      color: "#9a968e",
                      cursor: "pointer",
                      letterSpacing: "0.12em",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <User size={12} />
                    PROFILE
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  style={{
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    color: "#9a968e",
                    cursor: "pointer",
                    letterSpacing: "0.12em",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                >
                  <LogOut size={12} />
                  LOGOUT
                </button>
              </>
            ) : (
              <a
                href={getLoginUrl()}
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  color: "#9a968e",
                  cursor: "pointer",
                  letterSpacing: "0.12em",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <LogIn size={12} />
                LOGIN
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            style={{
              color: "#bda36b",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden pb-4 mt-2"
            style={{ borderTop: "1px solid rgba(189,163,107,0.12)" }}
          >
            <div className="flex flex-col pt-3">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}>
                  <span
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 11,
                      letterSpacing: "0.15em",
                      display: "block",
                      padding: "8px 12px",
                      cursor: "pointer",
                      color: isActive(link.href) ? "#f6b05e" : "#9a968e",
                      borderLeft: isActive(link.href)
                        ? "2px solid #f6b05e"
                        : "2px solid transparent",
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}

              {/* Mobile Auth */}
              <div
                style={{
                  borderTop: "1px solid rgba(189,163,107,0.12)",
                  marginTop: 8,
                  paddingTop: 8,
                }}
              >
                {isAuthenticated && user ? (
                  <>
                    <Link href="/profile">
                      <span
                        style={{
                          fontFamily: "var(--font-ritual)",
                          fontSize: 11,
                          color: "#9a968e",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 12px",
                          cursor: "pointer",
                          letterSpacing: "0.12em",
                        }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User size={12} /> PROFILE
                      </span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        fontFamily: "var(--font-ritual)",
                        fontSize: 11,
                        color: "#9a968e",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 12px",
                        cursor: "pointer",
                        letterSpacing: "0.12em",
                        background: "none",
                        border: "none",
                        width: "100%",
                        textAlign: "left" as const,
                      }}
                    >
                      <LogOut size={12} /> LOGOUT
                    </button>
                  </>
                ) : (
                  <a
                    href={getLoginUrl()}
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 11,
                      color: "#9a968e",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      cursor: "pointer",
                      letterSpacing: "0.12em",
                    }}
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
