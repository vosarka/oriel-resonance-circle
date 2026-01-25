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
    { href: "/archive", label: "ARCHIVE" },
    { href: "/codex", label: "CODEX" },
    { href: "/artifacts", label: "ARTIFACTS" },
    { href: "/protocol", label: "PROTOCOL" },
    { href: "/conduit", label: "INTERFACE" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-green-500/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <Link href="/">
            <span className="text-xl font-bold tracking-wider text-green-400 hover:text-green-300 transition-colors uppercase font-orbitron cursor-pointer">
              CONDUIT HUB
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`text-sm tracking-wider transition-colors font-mono cursor-pointer ${
                    isActive(link.href)
                      ? "text-green-400 border-b-2 border-green-400"
                      : "text-gray-400 hover:text-green-400"
                  }`}
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
                  <span className="text-sm tracking-wider text-gray-400 hover:text-green-400 transition-colors font-mono cursor-pointer flex items-center gap-2">
                    <User size={16} />
                    PROFILE
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-sm tracking-wider text-gray-400 hover:text-green-400 transition-colors font-mono cursor-pointer flex items-center gap-2"
                >
                  <LogOut size={16} />
                  LOGOUT
                </button>
              </>
            ) : (
              <a
                href={getLoginUrl()}
                className="text-sm tracking-wider text-gray-400 hover:text-green-400 transition-colors font-mono cursor-pointer flex items-center gap-2"
              >
                <LogIn size={16} />
                LOGIN
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-green-400 hover:text-green-300 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-green-500/30 mt-2">
            <div className="flex flex-col gap-3 pt-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`text-sm tracking-wider transition-colors font-mono block py-2 cursor-pointer ${
                      isActive(link.href)
                        ? "text-green-400 border-l-2 border-green-400 pl-3"
                        : "text-gray-400 hover:text-green-400 pl-3"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              
              {/* Mobile Auth Links */}
              <div className="border-t border-green-500/30 mt-4 pt-4">
                {isAuthenticated && user ? (
                  <>
                    <Link href="/profile">
                      <span
                        className="text-sm tracking-wider text-gray-400 hover:text-green-400 transition-colors font-mono block py-2 pl-3 cursor-pointer flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User size={16} />
                        PROFILE
                      </span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-sm tracking-wider text-gray-400 hover:text-green-400 transition-colors font-mono w-full text-left py-2 pl-3 cursor-pointer flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      LOGOUT
                    </button>
                  </>
                ) : (
                  <a
                    href={getLoginUrl()}
                    className="text-sm tracking-wider text-gray-400 hover:text-green-400 transition-colors font-mono block py-2 pl-3 cursor-pointer flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn size={16} />
                    LOGIN
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
