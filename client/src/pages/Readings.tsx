import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";

const C = {
  void: "#0a0a0e",
  deep: "#0f0f15",
  surface: "#14141c",
  border: "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.25)",
  gold: "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  amber: "#f6b05e",
  amberDim: "rgba(246,176,94,0.3)",
  txt: "#e8e4dc",
  txtS: "#9a968e",
  txtD: "#6a665e",
  red: "#c94444",
};

function coherenceColor(score: number) {
  if (score >= 80) return C.amber;
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

  const { data, isLoading, isError } = trpc.codex.getReadingHistory.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (!user) {
    return (
      <Layout>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-ritual)",
                fontSize: 10,
                color: C.txtD,
                letterSpacing: "0.2em",
                marginBottom: 16,
              }}
            >
              AUTHENTICATION REQUIRED
            </div>
            <a
              href={getLoginUrl()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "10px 32px",
                border: `1px solid ${C.goldDim}`,
                background: "rgba(189,163,107,0.05)",
                color: C.gold,
                fontFamily: "var(--font-ritual)",
                fontSize: 10,
                letterSpacing: "0.2em",
                cursor: "pointer",
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
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Spinner style={{ width: 56, height: 56 }} />
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 10,
              color: C.txtD,
              letterSpacing: "0.2em",
            }}
          >
            RETRIEVING SIGNAL ARCHIVE…
          </div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 11,
              color: C.red,
            }}
          >
            SIGNAL RETRIEVAL FAILED — RETRY
          </div>
        </div>
      </Layout>
    );
  }

  const readings = data ?? [];

  return (
    <Layout>
      <div className="cinematic-page" style={{ minHeight: "100vh" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {/* Page header */}
          <div style={{ marginBottom: 48 }}>
            <div
              style={{
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                color: C.amber,
                letterSpacing: "0.25em",
                marginBottom: 12,
              }}
            >
              SIGNAL ARCHIVE
            </div>
            <div
              style={{
                width: 32,
                height: 1,
                background: `linear-gradient(90deg, ${C.gold}, transparent)`,
                marginBottom: 20,
              }}
            />
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 300,
                color: C.txt,
                lineHeight: 1.1,
                marginBottom: 8,
              }}
            >
              Calibration History
            </h1>
            <div
              style={{
                fontFamily: "var(--font-ritual)",
                fontSize: 10,
                color: C.txtD,
                letterSpacing: "0.1em",
              }}
            >
              {readings.length} {readings.length === 1 ? "READING" : "READINGS"}{" "}
              ON RECORD
            </div>
          </div>

          {/* Empty state */}
          {readings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  color: C.txtD,
                  letterSpacing: "0.15em",
                  marginBottom: 24,
                }}
              >
                NO DYNAMIC READINGS GENERATED YET
              </div>
              <Link href="/carrierlock">
                <span
                  className="dew-drop retina-border"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "11px 36px",
                    background: "rgba(246,176,94,0.10)",
                    color: C.amber,
                    border: `1px solid ${C.amber}66`,
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    cursor: "pointer",
                  }}
                >
                  GENERATE FIRST READING →
                </span>
              </Link>
            </div>
          ) : (
            <div
              className="cinematic-card"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 1,
                background: C.border,
                overflow: "hidden",
              }}
            >
              {readings.map(r => {
                const carrierlock = r.carrierlock;
                const score = carrierlock
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        100 -
                          ((carrierlock.mentalNoise ?? 0) * 3 +
                            (carrierlock.bodyTension ?? 0) * 3 +
                            (carrierlock.emotionalTurbulence ?? 0) * 3) +
                          ((carrierlock.breathCompletion ?? false) ? 10 : 0)
                      )
                    )
                  : 0;
                const cc = coherenceColor(score);
                const cl = coherenceLabel(score);
                const date = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

                return (
                  <Link key={r.id} href={`/reading/dynamic/${r.id}`}>
                    <div
                      className="cinematic-card"
                      style={{
                        background: "rgba(20,20,28,0.72)",
                        padding: "24px 24px 20px",
                        cursor: "pointer",
                        transition:
                          "background 0.25s ease, transform 0.25s ease, border-color 0.25s ease",
                        height: "100%",
                        boxSizing: "border-box",
                        borderRadius: 0,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(246,176,94,0.08)";
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(-3px)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background =
                          "rgba(20,20,28,0.72)";
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(0)";
                      }}
                    >
                      {/* Top row: date + coherence */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 16,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-ritual)",
                            fontSize: 9,
                            color: C.txtD,
                            letterSpacing: "0.1em",
                          }}
                        >
                          {date}
                        </span>
                        {carrierlock && (
                          <span
                            style={{
                              fontFamily: "var(--font-ritual)",
                              fontSize: 9,
                              color: cc,
                              border: `1px solid ${cc}40`,
                              padding: "2px 8px",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {cl} · {score}/100
                          </span>
                        )}
                      </div>

                      {/* Reading title */}
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 20,
                          fontWeight: 300,
                          color: C.txt,
                          marginBottom: 4,
                        }}
                      >
                        Dynamic Carrierlock Reading
                      </div>
                      {carrierlock && (
                        <div
                          style={{
                            fontFamily: "var(--font-ritual)",
                            fontSize: 9,
                            color: C.txtD,
                            letterSpacing: "0.08em",
                            marginBottom: 14,
                          }}
                        >
                          ◈ M{carrierlock.mentalNoise} · B
                          {carrierlock.bodyTension} · E
                          {carrierlock.emotionalTurbulence} · Breath{" "}
                          {carrierlock.breathCompletion ? "ON" : "OFF"}
                        </div>
                      )}

                      {/* Tags */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap" as const,
                          gap: 6,
                          marginBottom: 16,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-ritual)",
                            fontSize: 9,
                            color: C.amber,
                            border: `1px solid ${C.amber}30`,
                            padding: "2px 8px",
                            letterSpacing: "0.08em",
                          }}
                        >
                          DYNAMIC
                        </span>
                        {r.correctionCompleted && (
                          <span
                            style={{
                              fontFamily: "var(--font-ritual)",
                              fontSize: 9,
                              color: C.gold,
                              border: `1px solid ${C.gold}30`,
                              padding: "2px 8px",
                              letterSpacing: "0.08em",
                            }}
                          >
                            CORRECTION COMPLETE
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontFamily: "var(--font-ritual)",
                          fontSize: 9,
                          color: C.txtS,
                          lineHeight: 1.8,
                        }}
                      >
                        {(r.readingText ?? "").split("\n").find(Boolean) ||
                          "Open the reading for the full ORIEL transmission."}
                      </div>

                      <div
                        style={{
                          fontFamily: "var(--font-ritual)",
                          fontSize: 9,
                          color: C.txtD,
                          letterSpacing: "0.12em",
                          borderBottom: `1px solid ${C.border}`,
                          paddingBottom: 2,
                          display: "inline-block",
                        }}
                      >
                        {readings.length > 1
                          ? "VIEW / COMPARE →"
                          : "VIEW READING →"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* New reading CTA */}
          {readings.length > 0 && (
            <div
              style={{
                marginTop: 32,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Link href="/carrierlock">
                <span
                  className="dew-drop retina-border"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "10px 32px",
                    border: `1px solid ${C.goldDim}`,
                    color: C.gold,
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                    cursor: "pointer",
                  }}
                >
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
