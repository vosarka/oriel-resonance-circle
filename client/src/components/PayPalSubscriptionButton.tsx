import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

interface PayPalSubscriptionButtonProps {
  userId: number;
  onSubscriptionSuccess?: () => void;
  onSubscriptionError?: (error: string) => void;
}

declare global {
  interface Window {
    paypal?: {
      HostedButtons?: {
        render: (config: unknown) => Promise<void>;
      };
    };
  }
}

export default function PayPalSubscriptionButton({
  userId,
  onSubscriptionSuccess,
  onSubscriptionError,
}: PayPalSubscriptionButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const updateSubscriptionMutation = trpc.profile.updateSubscriptionStatus.useMutation();

  useEffect(() => {
    // Load PayPal SDK dynamically only when this component mounts
    const loadPayPalSDK = async () => {
      try {
        // Check if PayPal SDK is already loaded
        if (window.paypal?.HostedButtons) {
          setIsLoading(false);
          return;
        }

        // Create and append the PayPal script
        const script = document.createElement("script");
        script.src =
          "https://www.paypal.com/sdk/js?client-id=BAAc4RYATPcNXw5s6BKWABNgg5138NFy6Eyi7RJNC2ydWz2uDTWRjPT6KeI95NPVTn4OgzXIPaH8aMnCuk&components=hosted-buttons&disable-funding=venmo&currency=EUR";
        script.async = true;
        script.onload = () => {
          setIsLoading(false);
        };
        script.onerror = () => {
          setError("Failed to load PayPal SDK");
          setIsLoading(false);
          onSubscriptionError?.("Failed to load PayPal SDK");
        };

        document.body.appendChild(script);

        return () => {
          // Cleanup: remove script when component unmounts
          if (document.body.contains(script)) {
            document.body.removeChild(script);
          }
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        setIsLoading(false);
        onSubscriptionError?.(errorMessage);
      }
    };

    loadPayPalSDK();
  }, [onSubscriptionError]);

  useEffect(() => {
    // Render PayPal hosted button once SDK is loaded
    if (!isLoading && containerRef.current && window.paypal?.HostedButtons) {
      const renderButton = async () => {
        try {
          // Hosted button ID for monthly subscription
          const hostedButtonId = "3CUYAWGL4XBEA";

          await window.paypal!.HostedButtons!.render(`#${containerRef.current!.id}`);

          // Listen for subscription events
          if (window.paypal) {
            // Store reference to handle subscription completion
            (window as any).onPayPalSubscriptionSuccess = async (subscriptionId: string) => {
              try {
                // Update user subscription in database
                await updateSubscriptionMutation.mutateAsync({
                  subscriptionStatus: "active",
                  paypalSubscriptionId: subscriptionId,
                  subscriptionStartDate: new Date(),
                  subscriptionRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                });

                onSubscriptionSuccess?.();
              } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to update subscription";
                setError(errorMessage);
                onSubscriptionError?.(errorMessage);
              }
            };
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to render PayPal button";
          setError(errorMessage);
          onSubscriptionError?.(errorMessage);
        }
      };

      renderButton();
    }
  }, [isLoading, updateSubscriptionMutation, onSubscriptionSuccess, onSubscriptionError]);

  if (error) {
    return (
      <div className="bg-red-950 border border-red-600 rounded p-4 text-red-400 font-mono text-sm">
        <div className="font-bold mb-2">PayPal Error</div>
        <div>{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-green-400 font-mono">LOADING PAYMENT GATEWAY...</div>
      </div>
    );
  }

  return (
    <div
      id={`paypal-button-container-${userId}`}
      ref={containerRef}
      className="flex justify-center py-4"
    />
  );
}
