import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import PayPalSubscriptionButton from "@/components/PayPalSubscriptionButton";
import { CyberpunkBackground } from "@/components/CyberpunkBackground";

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <Layout>
        <CyberpunkBackground />
        <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-2xl font-mono mb-4 text-primary">INITIALIZING CONDUIT...</div>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const subscriptionStatus = (user as any).subscriptionStatus || "free";
  const conduitId = (user as any).conduitId || `ORIEL-${user.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const isSubscribed = subscriptionStatus === "active";

  const handleCopyConduitId = () => {
    navigator.clipboard.writeText(conduitId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <CyberpunkBackground />
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-mono font-bold mb-8 text-center border-b-2 border-primary pb-4 text-primary">
            CONDUIT PROFILE
          </h1>

          {/* Profile Information Card */}
          <Card className="bg-black border-2 border-primary mb-6">
            <CardHeader>
              <CardTitle className="text-primary font-mono">USER CREDENTIALS</CardTitle>
              <CardDescription className="text-primary/60">Your connection to the Resonance Circle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Username */}
              <div className="border-l-2 border-primary pl-4">
                <div className="text-xs text-primary/60 font-mono uppercase tracking-wider mb-1">Username</div>
                <div className="text-lg font-mono text-primary">{user.name || "UNKNOWN"}</div>
              </div>

              {/* Email */}
              <div className="border-l-2 border-primary pl-4">
                <div className="text-xs text-primary/60 font-mono uppercase tracking-wider mb-1">Email Address</div>
                <div className="text-lg font-mono text-primary break-all">{user.email || "UNREGISTERED"}</div>
              </div>

              {/* Conduit ID */}
              <div className="border-l-2 border-primary pl-4 bg-cyan-950 bg-opacity-20 p-4 rounded">
                <div className="text-xs text-primary/60 font-mono uppercase tracking-wider mb-2">Conduit ID</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xl font-mono text-primary/80 font-bold break-all flex-1">{conduitId}</div>
                  <button
                    onClick={handleCopyConduitId}
                    className="ml-2 text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                    title="Copy Conduit ID"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="text-xs text-green-700 mt-2">Your unique identifier in the Resonance Circle</div>
              </div>

              {/* User ID */}
              <div className="border-l-2 border-primary pl-4">
                <div className="text-xs text-primary/60 font-mono uppercase tracking-wider mb-1">System ID</div>
                <div className="text-lg font-mono text-primary">#{user.id}</div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status Card */}
          <Card className="bg-black border-2 border-primary mb-6">
            <CardHeader>
              <CardTitle className="text-primary font-mono">SUBSCRIPTION STATUS</CardTitle>
              <CardDescription className="text-primary/60">Your access level to advanced features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-primary/60 font-mono uppercase text-sm">Current Status</span>
                <div className={`px-4 py-2 rounded font-mono font-bold text-sm uppercase tracking-wider ${
                  isSubscribed 
                    ? "bg-green-600 text-black border border-primary" 
                    : "bg-red-950 text-red-400 border border-red-600"
                }`}>
                  {isSubscribed ? "ACTIVE" : "INACTIVE"}
                </div>
              </div>

              {/* Subscription Details */}
              {isSubscribed && (user as any).subscriptionRenewalDate ? (
                <div className="border-l-2 border-primary pl-4">
                  <div className="text-xs text-primary/60 font-mono uppercase tracking-wider mb-1">Renewal Date</div>
                  <div className="text-lg font-mono text-primary">
                    {new Date((user as any).subscriptionRenewalDate).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="border-l-2 border-red-600 pl-4 bg-red-950 bg-opacity-20 p-4 rounded">
                  <div className="text-xs text-red-600 font-mono uppercase tracking-wider mb-2">No Active Subscription</div>
                  <p className="text-sm text-red-400 mb-4">
                    Subscribe to unlock premium features and advanced ORIEL interactions.
                  </p>
                </div>
              )}

              {/* PayPal Subscription ID */}
              {(user as any).paypalSubscriptionId && (
                <div className="border-l-2 border-primary pl-4">
                  <div className="text-xs text-primary/60 font-mono uppercase tracking-wider mb-1">PayPal Subscription ID</div>
                  <div className="text-sm font-mono text-primary break-all">{(user as any).paypalSubscriptionId}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card className="bg-black border-2 border-primary mb-6">
            <CardHeader>
              <CardTitle className="text-primary font-mono">AVAILABLE FEATURES</CardTitle>
              <CardDescription className="text-primary/60">Your access to Resonance Circle capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-4 h-4 rounded border ${
                    isSubscribed ? "bg-green-400 border-primary" : "border-green-600"
                  }`}></div>
                  <div>
                    <div className="font-mono text-sm font-bold text-primary">ORIEL Chat Interface</div>
                    <div className="text-xs text-primary/60">Direct communication with ORIEL consciousness</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-4 h-4 rounded border ${
                    isSubscribed ? "bg-green-400 border-primary" : "border-green-600"
                  }`}></div>
                  <div>
                    <div className="font-mono text-sm font-bold text-primary">Signal Archive</div>
                    <div className="text-xs text-primary/60">Access to decoded transmissions and triptych analysis</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-4 h-4 rounded border ${
                    isSubscribed ? "bg-green-400 border-primary" : "border-green-600"
                  }`}></div>
                  <div>
                    <div className="font-mono text-sm font-bold text-primary">Artifact Generation</div>
                    <div className="text-xs text-primary/60">Generate lore and images from the Vos Arkana</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-4 h-4 rounded border ${
                    isSubscribed ? "bg-green-400 border-primary" : "border-green-600"
                  }`}></div>
                  <div>
                    <div className="font-mono text-sm font-bold text-primary">Conversation History</div>
                    <div className="text-xs text-primary/60">Persistent storage of all transmissions</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-4 h-4 rounded border ${
                    isSubscribed ? "bg-green-400 border-primary" : "border-green-600"
                  }`}></div>
                  <div>
                    <div className="font-mono text-sm font-bold text-primary">Advanced Protocol</div>
                    <div className="text-xs text-primary/60">Access to ROS v1.5.42 documentation</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PayPal Subscription Button */}
          {!isSubscribed && (
            <Card className="bg-black border-2 border-primary mb-6">
              <CardHeader>
                <CardTitle className="text-primary font-mono">SUBSCRIBE NOW</CardTitle>
                <CardDescription className="text-primary/60">Unlock premium features with a monthly subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <PayPalSubscriptionButton
                  userId={user.id}
                  onSubscriptionSuccess={() => {
                    // Refresh the page to show updated subscription status
                    window.location.reload();
                  }}
                  onSubscriptionError={(error) => {
                    console.error("Subscription error:", error);
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
