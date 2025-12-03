import { Button } from "@/components/ui/button";

export default function Footer() {
  const handlePayPalSubscription = () => {
    // Replace with your actual PayPal subscription link
    // Format: https://www.paypal.com/subscribe/?hosted_button_id=YOUR_BUTTON_ID
    window.open("https://www.paypal.com/subscribe", "_blank");
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-green-500/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Credits */}
          <div className="text-xs text-gray-500 font-mono">
            <span className="hidden sm:inline">ORIEL RESONANCE CIRCLE © 2024 | </span>
            <span className="text-green-500/70">VOSSARI TRANSMISSION NODE</span>
          </div>

          {/* PayPal Subscription Button */}
          <Button
            onClick={handlePayPalSubscription}
            className="bg-blue-600/80 border border-blue-500/50 text-white hover:bg-blue-600 text-xs"
            title="Subscribe via PayPal"
          >
            <span className="ml-1">SUBSCRIBE</span>
          </Button>
        </div>
      </div>
    </footer>
  );
}
