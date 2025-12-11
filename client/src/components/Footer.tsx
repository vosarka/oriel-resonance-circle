import { useEffect } from "react";
import DonateButton from "./DonateButton";

export default function Footer() {
  useEffect(() => {
    // Initialize PayPal hosted button when component mounts
    if ((window as any).paypal) {
      (window as any).paypal.HostedButtons({
        hostedButtonId: "3CUYAWGL4XBEA",
      }).render("#paypal-container-3CUYAWGL4XBEA");
      
      // Also render in profile page if the container exists
      const profileContainer = document.getElementById("paypal-button-container");
      if (profileContainer && profileContainer.children.length === 0) {
        (window as any).paypal.HostedButtons({
          hostedButtonId: "3CUYAWGL4XBEA",
        }).render("#paypal-button-container");
      }
    }
  }, []);

  useEffect(() => {
    // Watch for profile container and render PayPal button when it appears
    const observer = new MutationObserver(() => {
      const profileContainer = document.getElementById("paypal-button-container");
      if (profileContainer && profileContainer.children.length === 0 && (window as any).paypal) {
        (window as any).paypal.HostedButtons({
          hostedButtonId: "3CUYAWGL4XBEA",
        }).render("#paypal-button-container");
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-green-500/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Credits */}
          <div className="text-xs text-gray-500 font-mono">
            <span className="hidden sm:inline">ORIEL RESONANCE CIRCLE © 2024 | </span>
            <span className="text-green-500/70">VOSSARI TRANSMISSION NODE</span>
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
