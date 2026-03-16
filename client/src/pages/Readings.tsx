import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";

const C = {
  void:    "#0a0a0e",
  deep:    "#0f0f15",
  surface: "#14141c",
  border:  "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.25)",
  gold:    "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  teal:    "#5ba4a4",
  tealDim: "rgba(91,164,164,0.3)",
  txt:     "#e8e4dc",
  txtS:    "#9a968e",
  txtD:    "#6a665e",
  red:     "#c94444",
};

function coherenceColor(score: number) {
  if (score >= 80) return C.teal;
  if (score >= 40) return C.gold;
  return C.red;
}

function coherenceLabel(score: number) {
  if (score >= 80) return "RESONANCE";
  if (score >= 40) return "FLUX";
  return "ENTROPY";
}

export default function Readings() {
  const { user } = useAuth();

  const { data, isLoading, isError } = trpc.codex.getStaticReadings.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (!user) {
    return (
      <Layout>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, letterSpacing: "0.2em", marginBottom: 16 }}>
              AUTHENTICATION REQUIRED
            </div>
            <a
              href={getLoginUrl()}
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "10px 32px",
                border: `1px solid ${C.goldDim}`,
                background: "rgba(189,163,107,0.05)",
                color: C.gold,
                fontFamily: "monospace", fontSize: 10,
                letterSpacing: "0.2em", cursor: "pointer",
                textDecoration: "none",
              }}
            >
              ESTABLISH CONNECTION →
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <Loader2 style={{ color: C.teal, animation: "spin 1s linear infinite" }} size={24} />
          <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, letterSpacing: "0.2em" }}>RETRIEVING SIGNAL ARCHIVE…</div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: C.red }}>SIGNAL RETRIEVAL FAILED — RETRY</div>
        </div>
      </Layout>
    );
  }

  const readings = data ?? [];

  return (
    <Layout>
      <div style={{ minHeight: "100vh", padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Page header */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: C.teal, letterSpacing: "0.25em", marginBottom: 12 }}>
              SIGNAL ARCHIVE
            </div>
            <div style={{ width: 32, height: 1, background: `linear-gradient(90deg, ${C.gold}, transparent)`, marginBottom: 20 }} />
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 300,
              color: C.txt,
              lineHeight: 1.1,
              marginBottom: 8,
            }}>
              Calibration History
            </h1>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, letterSpacing: "0.1em" }}>
              {readings.length} {readings.length === 1 ? "READING" : "READINGS"} ON RECORD
            </div>
          </div>

          {/* Empty state */}
          {readings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: C.txtD, letterSpacing: "0.15em", marginBottom: 24 }}>
                NO STATIC CALIBRATIONS GENERATED YET
              </div>
              <Link href="/carrierlock">
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "11px 36px",
                  background: C.gold,
                  color: C.void,
                  fontFamily: "monospace", fontSize: 10,
                  fontWeight: 700, letterSpacing: "0.2em", cursor: "pointer",
                }}>
                  GENERATE FIRST READING →
                </span>
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 1, background: C.border }}>
              {readings.map((r) => {
                const score = r.baseCoherence ?? 0;
                const cc = coherenceColor(score);
                const cl = coherenceLabel(score);
                const date = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : "—";

                return (
                  <Link key={r.readingId} href={`/reading/static/${r.readingId}`}>
                    <div
                      style={{
                        background: C.deep,
                        padding: "24px 24px 20px",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                        height: "100%",
                        boxSizing: "border-box",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.surface; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.deep; }}
                    >
                      {/* Top row: date + coherence */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.1em" }}>
                          {date}
                        </span>
                        {r.baseCoherence != null && (
                          <span style={{
                            fontFamily: "monospace", fontSize: 9,
                            color: cc,
                            border: `1px solid ${cc}40`,
                            padding: "2px 8px",
                            letterSpacing: "0.1em",
                          }}>
                            {cl} · {score}/100
                          </span>
                        )}
                      </div>

                      {/* Birth date */}
                      <div style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 20, fontWeight: 300,
                        color: C.txt, marginBottom: 4,
                      }}>
                        {r.birthDate}
                      </div>
                      {r.birthCity && (
                        <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.08em", marginBottom: 14 }}>
                          ◈ {r.birthCity}
                        </div>
                      )}

                      {/* Role + Authority tags */}
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 16 }}>
                        {r.fractalRole && (
                          <span style={{
                            fontFamily: "monospace", fontSize: 9,
                            color: C.teal,
                            border: `1px solid ${C.teal}30`,
                            padding: "2px 8px",
                            letterSpacing: "0.08em",
                          }}>
                            {r.fractalRole}
                          </span>
                        )}
                        {r.authorityNode && (
                          <span style={{
                            fontFamily: "monospace", fontSize: 9,
                            color: C.gold,
                            border: `1px solid ${C.gold}30`,
                            padding: "2px 8px",
                            letterSpacing: "0.08em",
                          }}>
                            {r.authorityNode}
                          </span>
                        )}
                      </div>

                      <div style={{ fontFamily: "monospace", fontSize: 9, color: C.txtD, letterSpacing: "0.12em", borderBottom: `1px solid ${C.border}`, paddingBottom: 2, display: "inline-block" }}>
                        VIEW READING →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* New reading CTA */}
          {readings.length > 0 && (
            <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
              <Link href="/carrierlock">
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "10px 32px",
                  border: `1px solid ${C.goldDim}`,
                  color: C.gold,
                  fontFamily: "monospace", fontSize: 10,
                  letterSpacing: "0.2em", cursor: "pointer",
                }}>
                  GENERATE NEW READING →
                </span>
              </Link>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
