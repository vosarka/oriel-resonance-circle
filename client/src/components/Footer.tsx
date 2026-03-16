import { useEffect } from "react";
import DonateButton from "./DonateButton";

export default function Footer() {
  useEffect(() => {
    const paypal = (window as any).paypal;
    if (!paypal || typeof paypal.HostedButtons !== "function") return;
    const container = document.getElementById("paypal-container-3CUYAWGL4XBEA");
    if (!container || container.children.length > 0) return;
    try {
      paypal.HostedButtons({ hostedButtonId: "3CUYAWGL4XBEA" })
        .render("#paypal-container-3CUYAWGL4XBEA");
    } catch {
      // PayPal SDK not ready or container already rendered
    }
  }, []);

  return (
    <footer style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(10,10,14,0.95)",
      backdropFilter: "blur(8px)",
      borderTop: "1px solid rgba(189,163,107,0.12)",
    }}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Credits */}
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6a665e", display: "flex", alignItems: "center", gap: 12, letterSpacing: "0.1em" }}>
            <span className="hidden sm:inline">ORIEL RESONANCE CIRCLE © 2026 | </span>
            <span style={{ color: "rgba(189,163,107,0.4)" }}>VOSS ARKIVA TRANSMISSION NODE</span>
            <a href="/privacy" className="text-gray-600 hover:text-[#00F0FF]/60 transition-colors">PRIVACY</a>
            <a href="/terms" className="text-gray-600 hover:text-[#00F0FF]/60 transition-colors">TERMS</a>
          </div>

          {/* Donate Button */}
          <div className="flex items-center gap-4">
            <DonateButton />
            <div id="paypal-container-3CUYAWGL4XBEA"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
