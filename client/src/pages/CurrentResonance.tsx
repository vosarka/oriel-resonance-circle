import { Link } from "wouter";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RadioTower,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

import { useAuth } from "@/_core/hooks/useAuth";
import Layout from "@/components/Layout";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

type CurrentResonanceStatus =
  | "missing_static_profile"
  | "missing_carrierlock"
  | "missing_dynamic_reading"
  | "ready";

const C = {
  void: "#0a0a0e",
  deep: "#0f0f15",
  surface: "#14141c",
  border: "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.26)",
  gold: "#bda36b",
  goldL: "#d4c090",
  goldDim: "rgba(189,163,107,0.52)",
  goldGlow: "rgba(189,163,107,0.10)",
  amber: "#f6b05e",
  amberDim: "rgba(246,176,94,0.45)",
  amberGlow: "rgba(246,176,94,0.14)",
  txt: "#e8e4dc",
  txtS: "#9a968e",
  txtD: "#6a665e",
  red: "#c94444",
  redGlow: "rgba(201,68,68,0.10)",
};

const statusLabels: Record<CurrentResonanceStatus, string> = {
  missing_static_profile: "Static anchor missing",
  missing_carrierlock: "Carrierlock missing",
  missing_dynamic_reading: "Dynamic reading missing",
  ready: "Ready",
};

function formatNumber(value: number | null | undefined, fallback = "—") {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : fallback;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function cleanTransmission(text: string | null | undefined) {
  const trimmed = text?.trim();
  if (!trimmed) return null;
  return (
    trimmed.replace(/^ORIEL Dynamic Reading[^\n]*(\n|$)/i, "").trim() || trimmed
  );
}

function Panel({
  eyebrow,
  title,
  children,
  accent = false,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: accent ? "rgba(246,176,94,0.06)" : C.deep,
        border: `1px solid ${accent ? C.amberDim : C.border}`,
        boxShadow: accent ? `0 0 34px ${C.amberGlow}` : "none",
      }}
    >
      <div
        style={{ padding: "16px 22px", borderBottom: `1px solid ${C.border}` }}
      >
        {eyebrow && (
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 9,
              color: C.amber,
              letterSpacing: "0.2em",
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            color: C.txt,
            fontWeight: 300,
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  );
}

function DataPill({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        padding: "13px 15px",
        border: `1px solid ${accent ? C.goldDim : C.border}`,
        background: accent ? C.goldGlow : "rgba(255,255,255,0.02)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 8,
          color: C.txtD,
          letterSpacing: "0.16em",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 13,
          color: accent ? C.goldL : C.txt,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ActionLink({
  href,
  label,
  primary = false,
  icon,
}: {
  href: string;
  label: string;
  primary?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 16px",
          border: `1px solid ${primary ? C.goldDim : C.borderH}`,
          background: primary ? C.goldGlow : "rgba(255,255,255,0.015)",
          color: primary ? C.goldL : C.txtS,
          fontFamily: "var(--font-ritual)",
          fontSize: 10,
          letterSpacing: "0.14em",
          cursor: "pointer",
          textTransform: "uppercase",
        }}
      >
        {label}
        {icon}
      </span>
    </Link>
  );
}

function CoherenceBar({ value }: { value: number }) {
  const bounded = Math.max(0, Math.min(100, value));

  return (
    <div style={{ height: 5, background: C.border, overflow: "hidden" }}>
      <div
        style={{
          width: `${bounded}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${C.red}, ${C.gold}, ${C.amber})`,
          boxShadow: `0 0 18px ${C.amberGlow}`,
        }}
      />
    </div>
  );
}

function MissingState({
  status,
  nextAction,
}: {
  status: CurrentResonanceStatus;
  nextAction: string;
}) {
  const links =
    status === "missing_static_profile"
      ? [{ href: "/complete-profile", label: "Complete profile" }]
      : [{ href: "/carrierlock", label: "Run calibration" }];

  return (
    <div
      style={{
        border: `1px solid ${C.goldDim}`,
        background: C.goldGlow,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: 720 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: C.goldL,
              marginBottom: 8,
            }}
          >
            <AlertTriangle size={16} />
            <div
              style={{
                fontFamily: "var(--font-ritual)",
                fontSize: 10,
                letterSpacing: "0.2em",
              }}
            >
              {statusLabels[status].toUpperCase()}
            </div>
          </div>
          <p
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 11,
              color: C.txtS,
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            {nextAction}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {links.map(link => (
            <ActionLink
              key={link.href}
              href={link.href}
              label={link.label}
              primary
              icon={<ArrowRight size={14} />}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CurrentResonance() {
  const { user } = useAuth();
  const { data, isLoading, error } = trpc.profile.getCurrentResonance.useQuery(
    undefined,
    {
      enabled: Boolean(user),
    }
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
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 520,
              width: "100%",
              background: C.deep,
              border: `1px solid ${C.border}`,
              padding: "28px 24px",
              textAlign: "center",
            }}
          >
            <RadioTower
              size={34}
              color={C.amber}
              style={{ margin: "0 auto 14px" }}
            />
            <div
              style={{
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                color: C.amber,
                letterSpacing: "0.2em",
                marginBottom: 12,
              }}
            >
              CURRENT RESONANCE
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 34,
                color: C.txt,
                fontWeight: 300,
                margin: "0 0 10px",
              }}
            >
              Sign in to load your field state
            </h1>
            <p
              style={{
                fontFamily: "var(--font-ritual)",
                fontSize: 10,
                color: C.txtD,
                lineHeight: 1.8,
                marginBottom: 22,
              }}
            >
              Current Resonance needs your Static Signature, latest Carrierlock,
              and stored dynamic reading to resolve the active pattern.
            </p>
            <a href={getLoginUrl()} style={{ textDecoration: "none" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  border: `1px solid ${C.goldDim}`,
                  color: C.gold,
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  letterSpacing: "0.16em",
                }}
              >
                SIGN IN
              </span>
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
          <Spinner size={24} label="Resolving current resonance" />
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 10,
              color: C.txtD,
              letterSpacing: "0.2em",
            }}
          >
            RESOLVING CURRENT RESONANCE…
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 680,
              width: "100%",
              border: `1px solid rgba(201,68,68,0.35)`,
              background: C.redGlow,
              padding: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: C.red,
                marginBottom: 10,
              }}
            >
              <AlertTriangle size={16} />
              <div
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                }}
              >
                RESONANCE UNAVAILABLE
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-ritual)",
                fontSize: 11,
                color: C.txtS,
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              {error?.message ??
                "The current resonance route returned no data."}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const coherence = data.carrierlock?.coherenceScore ?? 0;
  const activeLabel = data.activePattern
    ? `${data.activePattern.codon256Id} · SLI ${data.activePattern.sli}`
    : "No active pattern";
  const status = data.status as CurrentResonanceStatus;
  const transmission = cleanTransmission(data.dynamicReading?.readingText);
  const readingDate = formatDate(data.dynamicReading?.createdAt);

  return (
    <Layout>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes resonancePulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.018); }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          padding: "72px 24px 120px",
          background:
            "radial-gradient(circle at top left, rgba(246,176,94,0.08), transparent 30%), radial-gradient(circle at top right, rgba(189,163,107,0.08), transparent 34%), linear-gradient(180deg, #09090d 0%, #0f0f15 44%, #09090d 100%)",
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 18,
              marginBottom: 26,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 9,
                  color: C.amber,
                  letterSpacing: "0.24em",
                  marginBottom: 12,
                }}
              >
                CALIBRATION RESULT · ONE CURRENT VIEW
              </div>
              <div
                style={{
                  width: 36,
                  height: 1,
                  background: `linear-gradient(90deg, ${C.gold}, transparent)`,
                  marginBottom: 18,
                }}
              />
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(34px, 5vw, 56px)",
                  color: C.txt,
                  fontWeight: 300,
                  lineHeight: 1,
                  margin: "0 0 10px",
                }}
              >
                Current Resonance
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 11,
                  color: C.txtS,
                  lineHeight: 1.9,
                  maxWidth: 720,
                  margin: 0,
                }}
              >
                This is the single result page after calibration: ORIEL's
                reading first, then the field numbers underneath. To update it,
                run one new calibration.
              </p>
            </div>

            <ActionLink
              href="/carrierlock"
              label="New calibration"
              primary
              icon={<Activity size={14} />}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <DataPill
              label="STATUS"
              value={statusLabels[status] ?? "Unknown"}
              accent={status === "ready"}
            />
            <DataPill label="LATEST CALIBRATION" value={readingDate} />
            <DataPill
              label="COHERENCE"
              value={formatNumber(data.carrierlock?.coherenceScore)}
              accent
            />
          </div>

          {status !== "ready" && (
            <div style={{ marginBottom: 18 }}>
              <MissingState status={status} nextAction={data.nextAction} />
            </div>
          )}

          {status === "ready" && (
            <div style={{ marginBottom: 18 }}>
              <Panel
                eyebrow="ORIEL TRANSMISSION"
                title="Read This First"
                accent
              >
                <p
                  style={{
                    fontFamily: "var(--font-ritual)",
                    fontSize: 12,
                    color: C.txt,
                    lineHeight: 1.9,
                    margin: 0,
                    whiteSpace: "pre-line",
                  }}
                >
                  {transmission ??
                    "No ORIEL transmission was stored for this calibration."}
                </p>
              </Panel>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <Panel eyebrow="FIELD NOW" title="Coherence Snapshot">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 54,
                    color: C.amber,
                    fontWeight: 300,
                    lineHeight: 1,
                  }}
                >
                  {formatNumber(data.carrierlock?.coherenceScore)}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    color: C.txtD,
                    letterSpacing: "0.18em",
                  }}
                >
                  COHERENCE SCORE
                </div>
              </div>
              <CoherenceBar value={coherence} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <DataPill
                  label="MENTAL"
                  value={formatNumber(data.carrierlock?.mentalNoise)}
                />
                <DataPill
                  label="BODY"
                  value={formatNumber(data.carrierlock?.bodyTension)}
                />
                <DataPill
                  label="EMOTION"
                  value={formatNumber(data.carrierlock?.emotionalTurbulence)}
                />
              </div>
            </Panel>

            <Panel
              eyebrow="WHAT IS BEING FILTERED"
              title="Stable Static Signature"
            >
              <div style={{ display: "grid", gap: 10 }}>
                <DataPill
                  label="TYPE"
                  value={data.staticAnchor?.vrcType ?? "—"}
                  accent
                />
                <DataPill
                  label="AUTHORITY"
                  value={data.staticAnchor?.vrcAuthority ?? "—"}
                />
                <DataPill
                  label="ROLE"
                  value={data.staticAnchor?.fractalRole ?? "—"}
                />
              </div>
              <p
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  color: C.txtD,
                  lineHeight: 1.8,
                  margin: "14px 0 0",
                }}
              >
                Your Static Signature is not another task. It is already loaded
                behind the reading.
              </p>
            </Panel>

            <Panel eyebrow="ACTIVE THEME" title="Loudest Pattern" accent>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: C.amber,
                  marginBottom: 14,
                }}
              >
                <CheckCircle2 size={16} />
                <div
                  style={{
                    fontFamily: "var(--font-ritual)",
                    fontSize: 18,
                    color: C.amber,
                  }}
                >
                  {activeLabel}
                </div>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 11,
                  color: C.txtS,
                  lineHeight: 1.8,
                  margin: "0 0 12px",
                }}
              >
                {data.primeStackPosition?.label ??
                  "Static Signature position unresolved"}
                {data.primeStackPosition?.center
                  ? ` · ${data.primeStackPosition.center}`
                  : ""}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  color: C.txtD,
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                This is the pattern ORIEL treats as loudest right now, not a
                separate page to interpret.
              </p>
            </Panel>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 18,
            }}
          >
            <Panel eyebrow="NEXT ACTION" title="One Small Adjustment">
              <p
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 12,
                  color: C.txt,
                  lineHeight: 1.9,
                  margin: 0,
                }}
              >
                {data.microCorrection ?? data.nextAction}
              </p>
              <div
                style={{ height: 1, background: C.border, margin: "18px 0" }}
              />
              <div
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 9,
                  color: C.txtD,
                  letterSpacing: "0.18em",
                  marginBottom: 8,
                }}
              >
                CHECKPOINT
              </div>
              <p
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 11,
                  color: C.txtS,
                  lineHeight: 1.8,
                  margin: 0,
                }}
              >
                {data.falsifier ??
                  "After applying the correction, recalibrate and compare how the field changes."}
              </p>
            </Panel>

            <Panel eyebrow="TECHNICAL TRAIL" title="What Was Used">
              <details>
                <summary
                  style={{
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    color: C.goldL,
                    letterSpacing: "0.14em",
                    cursor: "pointer",
                  }}
                >
                  SHOW CALCULATION NOTES
                </summary>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  {data.evidence.map((item: string) => (
                    <div
                      key={item}
                      style={{
                        borderLeft: `1px solid ${C.amberDim}`,
                        paddingLeft: 12,
                        fontFamily: "var(--font-ritual)",
                        fontSize: 11,
                        color: C.txtS,
                        lineHeight: 1.8,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </details>
              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Link href="/readings">
                  <span
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 9,
                      color: C.txtD,
                      letterSpacing: "0.14em",
                      cursor: "pointer",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    ARCHIVE / OLDER READINGS
                  </span>
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Layout>
  );
}
