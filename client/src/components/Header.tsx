import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/archive", label: "ARCHIVE" },
    { href: "/artifacts", label: "ARTIFACTS" },
    { href: "/tiers", label: "TIERS" },
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
            <a className="text-xl font-bold tracking-wider text-green-400 hover:text-green-300 transition-colors uppercase font-orbitron">
              CONDUIT HUB
            </a>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={`text-sm tracking-wider transition-colors font-mono ${
                    isActive(link.href)
                      ? "text-green-400 border-b-2 border-green-400"
                      : "text-gray-400 hover:text-green-400"
                  }`}
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </nav>

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
                  <a
                    className={`text-sm tracking-wider transition-colors font-mono block py-2 ${
                      isActive(link.href)
                        ? "text-green-400 border-l-2 border-green-400 pl-3"
                        : "text-gray-400 hover:text-green-400 pl-3"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
