import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2, Copy, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import PayPalSubscriptionButton from "@/components/PayPalSubscriptionButton";

const C = {
  void:    "#0a0a0e",
  deep:    "#0f0f15",
  surface: "#14141c",
  border:  "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.25)",
  gold:    "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  teal:    "#5ba4a4",
  txt:     "#e8e4dc",
  txtS:    "#9a968e",
  txtD:    "#6a665e",
  red:     "#c94444",
  green:   "#44a866",
};

function Field({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ paddingLeft: 16, borderLeft: `2px solid ${accent ? C.teal : C.border}`, marginBottom: 20 }}>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontSize: 13, color: accent ? C.teal : C.txt, wordBreak: "break-all" as const }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.deep, marginBottom: 2 }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.2em" }}>{title}</span>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/");
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <Layout>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <Loader2 style={{ color: C.teal, animation: "spin 1s linear infinite" }} size={24} />
          <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, letterSpacing: "0.2em" }}>INITIALIZING CONDUIT…</div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) return null;

  const subscriptionStatus = (user as any).subscriptionStatus || "free";
  const conduitId = (user as any).conduitId || `ORIEL-${user.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const isSubscribed = subscriptionStatus === "active";

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(conduitId).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const FEATURES = [
    ["ORIEL Chat Interface",   "Direct communication with ORIEL consciousness"],
    ["Signal Archive",         "Access to decoded transmissions and triptych analysis"],
    ["Artifact Generation",    "Generate lore and images from the Vossari field"],
    ["Conversation History",   "Persistent storage of all transmissions"],
    ["Advanced Protocol",      "Access to ROS v1.5.42 documentation"],
  ];

  return (
    <Layout>
      <div style={{ minHeight: "100vh", padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Page header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.25em", marginBottom: 12 }}>
              CONDUIT PROFILE
            </div>
            <div style={{ width: 32, height: 1, background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
          </div>

          {/* Sections */}
          <div style={{ background: C.border, display: "flex", flexDirection: "column", gap: 1 }}>

            <Section title="USER CREDENTIALS">
              <Field label="USERNAME" value={user.name || "UNKNOWN"} accent />
              <Field label="EMAIL ADDRESS" value={user.email || "UNREGISTERED"} />
              {/* Conduit ID with copy */}
              <div style={{ paddingLeft: 16, borderLeft: `2px solid ${C.gold}40`, marginBottom: 8 }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em", marginBottom: 6 }}>CONDUIT ID</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: C.gold, wordBreak: "break-all" as const, flex: 1 }}>{conduitId}</span>
                  <button
                    onClick={handleCopy}
                    style={{ background: "none", border: "none", cursor: "pointer", color: copied ? C.green : C.txtD, flexShrink: 0 }}
                  >
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginTop: 4 }}>
                  Your unique identifier in the Resonance Circle
                </div>
              </div>
              <Field label="SYSTEM ID" value={`#${user.id}`} />
            </Section>

            <Section title="SUBSCRIPTION STATUS">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em" }}>CURRENT STATUS</span>
                <span style={{
                  fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
                  padding: "4px 16px",
                  border: `1px solid ${isSubscribed ? C.teal : C.red}60`,
                  color: isSubscribed ? C.teal : C.red,
                }}>
                  {isSubscribed ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              {isSubscribed && (user as any).subscriptionRenewalDate ? (
                <Field label="RENEWAL DATE" value={new Date((user as any).subscriptionRenewalDate).toLocaleDateString()} />
              ) : (
                <div style={{ paddingLeft: 16, borderLeft: `2px solid ${C.red}40`, marginBottom: 12 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: C.red, letterSpacing: "0.12em", marginBottom: 4 }}>NO ACTIVE SUBSCRIPTION</div>
                  <p style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS }}>
                    Subscribe to unlock premium features and advanced ORIEL interactions.
                  </p>
                </div>
              )}
              {(user as any).paypalSubscriptionId && (
                <Field label="PAYPAL SUBSCRIPTION ID" value={(user as any).paypalSubscriptionId} />
              )}
            </Section>

            <Section title="AVAILABLE FEATURES">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {FEATURES.map(([title, desc]) => (
                  <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      marginTop: 2, width: 12, height: 12, flexShrink: 0,
                      border: `1px solid ${isSubscribed ? C.teal : C.border}`,
                      background: isSubscribed ? C.teal : "transparent",
                    }} />
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: isSubscribed ? C.teal : C.txtS, letterSpacing: "0.08em", marginBottom: 2 }}>
                        {title}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {!isSubscribed && (
              <Section title="SUBSCRIBE NOW">
                <p style={{ fontFamily: "monospace", fontSize: 10, color: C.txtS, lineHeight: 1.8, marginBottom: 16 }}>
                  Unlock premium features with a monthly subscription.
                </p>
                <PayPalSubscriptionButton
                  userId={user.id}
                  onSubscriptionSuccess={() => window.location.reload()}
                  onSubscriptionError={(error) => console.error("Subscription error:", error)}
                />
              </Section>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}
