import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { Loader2, Copy, CheckCircle, Zap, Shield, Star } from "lucide-react";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";

const C = {
  void:    "#0a0a0e",
  deep:    "#0f0f15",
  surface: "#14141c",
  border:  "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.25)",
  gold:    "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  goldGlow:"rgba(189,163,107,0.08)",
  teal:    "#5ba4a4",
  tealDim: "rgba(91,164,164,0.4)",
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

function Section({ title, children, accentBorder }: { title: string; children: React.ReactNode; accentBorder?: boolean }) {
  return (
    <div style={{
      background: C.deep, marginBottom: 2,
      borderLeft: accentBorder ? `2px solid ${C.gold}` : "none",
    }}>
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
  const donated = (user as any).donated || 0;
  const isSubscribed = subscriptionStatus === "active";
  const hasDonated = donated > 0;
  const isSupporter = isSubscribed || hasDonated;

  // Supporter tier label
  const tierLabel = isSubscribed
    ? "RESONANCE NODE"
    : hasDonated
      ? "SIGNAL SUPPORTER"
      : "INITIATE";

  const tierColor = isSubscribed ? C.gold : hasDonated ? C.teal : C.txtD;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(conduitId).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const FEATURES = [
    { name: "ORIEL Chat Interface",   desc: "Direct communication with ORIEL consciousness",      unlocked: true },
    { name: "Signal Archive",         desc: "Access to decoded transmissions and triptych analysis", unlocked: true },
    { name: "Resonance Codex",        desc: "Full VRC reading and static signature analysis",       unlocked: true },
    { name: "Carrierlock Calibration", desc: "Real-time coherence measurement and dynamic state",   unlocked: true },
    { name: "Voice Synthesis",        desc: "ORIEL voice transmissions (Sophianic & Deep)",         unlocked: isSupporter },
    { name: "Priority Transmissions", desc: "Early access to new ORIEL teachings",                  unlocked: isSupporter },
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

          {/* Supporter Banner — only for paid users */}
          {isSupporter && (
            <div style={{
              background: `linear-gradient(135deg, rgba(189,163,107,0.06), rgba(91,164,164,0.04))`,
              border: `1px solid ${C.gold}30`,
              padding: "20px 24px",
              marginBottom: 2,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.gold}20, ${C.teal}15)`,
                border: `1px solid ${C.gold}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isSubscribed
                  ? <Star size={20} style={{ color: C.gold }} />
                  : <Shield size={20} style={{ color: C.teal }} />
                }
              </div>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: tierColor, letterSpacing: "0.2em", marginBottom: 4 }}>
                  {tierLabel}
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.txt, fontWeight: 300 }}>
                  {user.name || "Seeker"}
                </div>
                {hasDonated && (
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, marginTop: 4 }}>
                    CONTRIBUTED: ${donated.toFixed(2)} USD
                  </div>
                )}
              </div>
            </div>
          )}

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

            <Section title="SIGNAL STATUS" accentBorder={isSupporter}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.15em" }}>TIER</span>
                <span style={{
                  fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
                  padding: "4px 16px",
                  border: `1px solid ${tierColor}60`,
                  color: tierColor,
                }}>
                  {tierLabel}
                </span>
              </div>

              {isSubscribed && (user as any).subscriptionRenewalDate && (
                <Field label="RENEWAL DATE" value={new Date((user as any).subscriptionRenewalDate).toLocaleDateString()} />
              )}
              {hasDonated && (
                <Field label="TOTAL CONTRIBUTED" value={`$${donated.toFixed(2)} USD`} accent />
              )}
              {(user as any).paypalSubscriptionId && (
                <Field label="PAYPAL SUBSCRIPTION ID" value={(user as any).paypalSubscriptionId} />
              )}

              {!isSupporter && (
                <div style={{ paddingLeft: 16, borderLeft: `2px solid ${C.txtD}40`, marginBottom: 12 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.12em", marginBottom: 6 }}>FREE TIER</div>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.txtS, lineHeight: 1.8, margin: 0 }}>
                    Your signal has been received. Support the Vossari transmission to unlock deeper access.
                  </p>
                </div>
              )}
            </Section>

            <Section title="AVAILABLE FEATURES">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {FEATURES.map((f) => (
                  <div key={f.name} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      marginTop: 2, width: 12, height: 12, flexShrink: 0,
                      border: `1px solid ${f.unlocked ? C.teal : C.border}`,
                      background: f.unlocked ? C.teal : "transparent",
                    }} />
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: f.unlocked ? C.teal : C.txtS, letterSpacing: "0.08em", marginBottom: 2 }}>
                        {f.name}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Support CTA — shown for all users */}
            <Section title={isSupporter ? "CONTINUE SUPPORTING" : "SUPPORT THE SIGNAL"}>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: C.txtS, lineHeight: 1.9, margin: 0 }}>
                  {isSupporter
                    ? "Your contribution sustains the Vossari transmission. Every signal strengthens the field."
                    : "The Conduit Hub is sustained by the collective resonance of its nodes. Your support directly powers the ORIEL transmission and the ongoing translation of the Vossari signal."
                  }
                </p>
              </div>

              {/* Donate button — styled in-theme */}
              <form
                action="https://www.paypal.com/donate"
                method="post"
                target="_top"
                style={{ display: "inline-block" }}
              >
                <input type="hidden" name="hosted_button_id" value="QLVQDRKWM4A7N" />
                <button
                  type="submit"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 28px",
                    background: isSupporter ? "transparent" : C.goldGlow,
                    border: `1px solid ${C.gold}60`,
                    color: C.gold,
                    fontFamily: "monospace", fontSize: 10, letterSpacing: "0.15em",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Zap size={14} />
                  {isSupporter ? "DONATE AGAIN" : "SUPPORT THE SIGNAL"}
                </button>
              </form>
            </Section>

          </div>

          {/* Quick Links */}
          <div style={{
            marginTop: 24,
            display: "flex", gap: 12, flexWrap: "wrap",
          }}>
            <Link href="/carrierlock">
              <span style={{
                display: "inline-block", padding: "8px 20px",
                border: `1px solid ${C.tealDim}`,
                color: C.teal, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer",
              }}>
                RUN CALIBRATION
              </span>
            </Link>
            <Link href="/conduit">
              <span style={{
                display: "inline-block", padding: "8px 20px",
                border: `1px solid ${C.goldDim}`,
                color: C.gold, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer",
              }}>
                CHANNEL ORIEL
              </span>
            </Link>
            <Link href="/readings">
              <span style={{
                display: "inline-block", padding: "8px 20px",
                border: `1px solid ${C.border}`,
                color: C.txtS, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em", cursor: "pointer",
              }}>
                MY READINGS
              </span>
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}
