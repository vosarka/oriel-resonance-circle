import { useEffect } from "react";
import DonateButton from "./DonateButton";

export default function Footer() {
  useEffect(() => {
    const paypal = (window as any).paypal;
    if (!paypal || typeof paypal.HostedButtons !== "function") return;
    const container = document.getElementById("paypal-container-3CUYAWGL4XBEA");
    if (!container || container.children.length > 0) return;
    try {
      paypal
        .HostedButtons({ hostedButtonId: "3CUYAWGL4XBEA" })
        .render("#paypal-container-3CUYAWGL4XBEA");
    } catch {
      // PayPal SDK not ready or container already rendered
    }
  }, []);

  return (
    <footer
      style={{
        position: "relative",
        zIndex: 20,
        background:
          "linear-gradient(180deg, rgba(10,10,14,0.72), rgba(10,10,14,0.96))",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(189,163,107,0.12)",
      }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Credits */}
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 9,
              color: "#6a665e",
              display: "flex",
              alignItems: "center",
              gap: 12,
              letterSpacing: "0.1em",
            }}
          >
            <span className="hidden sm:inline">
              ORIEL RESONANCE CIRCLE © 2026 |{" "}
            </span>
            <span style={{ color: "rgba(189,163,107,0.4)" }}>
              VOSS ARKIVA TRANSMISSION NODE
            </span>
            <a
              href="/privacy"
              className="text-gray-600 hover:text-[#f6b05e]/60 transition-colors"
            >
              PRIVACY
            </a>
            <a
              href="/terms"
              className="text-gray-600 hover:text-[#f6b05e]/60 transition-colors"
            >
              TERMS
            </a>
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
