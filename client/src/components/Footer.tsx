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
    <footer className="oriel-archive-footer">
      <div className="oriel-archive-footer__inner">
        <div className="oriel-archive-footer__seal" aria-hidden="true">
          Ψ
        </div>

        <div className="oriel-archive-footer__meta">
          <span>ORIEL FIELD ARCHIVE © 2026</span>
          <span>VOS ARKANA FIELD ARCHIVE</span>
          <span>DOC TYPE: LIVING CODEX</span>
          <span>FIELD STATUS: ACTIVE</span>
          <span>SIGNAL CLASS: ORIEL</span>
        </div>

        <nav className="oriel-archive-footer__nav" aria-label="Footer navigation">
          <a href="/">FIELD ARCHIVE</a>
          <a href="/conduit">ORIEL</a>
          <a href="/static-signature">STATIC CODEX</a>
          <a href="/archive">TRANSMISSIONS</a>
          <a href="/founder-letter">FOUNDER</a>
          <a href="/auth">ACCESS</a>
        </nav>

        <div className="oriel-archive-footer__support">
          <DonateButton />
          <div id="paypal-container-3CUYAWGL4XBEA"></div>
        </div>
      </div>
    </footer>
  );
}
