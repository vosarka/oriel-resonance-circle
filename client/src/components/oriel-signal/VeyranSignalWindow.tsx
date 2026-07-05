import { useEffect, useMemo, useRef, useState } from "react";

/**
 * VeyranSignalWindow — a Vossari/Veyran ritual countdown clock.
 *
 * This is NOT an Earth countdown. It measures a 3-hour Signal Window in the
 * Vossari time system:
 *
 *   1 Veyr      = 32 Earth hours = 8 Registers
 *   1 Register  = 4 Arcs
 *   1 Arc       = 1 Earth hour   = 64 Lines
 *   1 Line      = 64 Pulses
 *
 * So a 3-hour window is exactly 3 Arcs. The primary readout is ARC / LINE /
 * PULSE; the Earth mirror (HH:MM:SS) is only a faint secondary tag.
 *
 * The window's end time is stored in localStorage so a refresh does not reset
 * it. When the last pulse resolves the chamber closes until REOPEN SIGNAL.
 */

const ARC_MS = 60 * 60 * 1000; // 1 Arc = 1 Earth hour
const WINDOW_ARCS = 3;
const WINDOW_MS = WINDOW_ARCS * ARC_MS; // 3-Arc Signal Window

const LINES_PER_ARC = 64;
const PULSES_PER_LINE = 64;
const LINE_MS = ARC_MS / LINES_PER_ARC; // 56.25 s
const PULSE_MS = LINE_MS / PULSES_PER_LINE; // ~0.8789 s

const STORAGE_KEY = "veyran-signal-window-end-v1";
const ARC_ROMAN = ["Ø", "I", "II", "III"] as const;

interface VeyranReading {
  arc: number;
  line: number;
  pulse: number;
  fraction: number; // 1 → 0 across the window
  earth: string; // HH:MM:SS mirror
  closed: boolean;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function readEndTime(): number {
  if (typeof window === "undefined") return Date.now() + WINDOW_MS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed)) return parsed;
  const fresh = Date.now() + WINDOW_MS;
  window.localStorage.setItem(STORAGE_KEY, String(fresh));
  return fresh;
}

function decode(endTime: number, now: number): VeyranReading {
  const remaining = endTime - now;

  if (remaining <= 0) {
    return { arc: 0, line: 0, pulse: 0, fraction: 0, earth: "00:00:00", closed: true };
  }

  const totalSec = remaining / 1000;
  const arc = Math.floor(totalSec / 3600);
  const withinArc = totalSec - arc * 3600;
  const line = Math.floor(withinArc / (LINE_MS / 1000));
  const withinLine = withinArc - line * (LINE_MS / 1000);
  const pulse = Math.floor(withinLine / (PULSE_MS / 1000));

  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = Math.floor(totalSec % 60);

  return {
    arc: Math.min(arc, WINDOW_ARCS),
    line,
    pulse,
    fraction: Math.max(0, Math.min(1, remaining / WINDOW_MS)),
    earth: `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`,
    closed: false,
  };
}

// Outer tick ring — 64 marks, one per Line.
const TICK_RING = Array.from({ length: 64 }, (_, i) => i);

export function VeyranSignalWindow() {
  const [endTime, setEndTime] = useState<number>(() => readEndTime());
  const [now, setNow] = useState<number>(() => Date.now());
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // ~4 ticks/sec keeps the Pulse digit (≈1.14 Hz) fluid without churn.
    const id = window.setInterval(() => setNow(Date.now()), 240);
    return () => window.clearInterval(id);
  }, []);

  const reading = useMemo(() => decode(endTime, now), [endTime, now]);

  function reopen() {
    const fresh = Date.now() + WINDOW_MS;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(fresh));
    }
    setEndTime(fresh);
    setNow(Date.now());
  }

  // Progress arc geometry (depletes clockwise from the top).
  const R = 148;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - reading.fraction);

  return (
    <section className="veyr" aria-label="Veyran Signal Window countdown">
      <div className="veyr__frame">
        {/* Ritual ring geometry */}
        <svg className="veyr__geo" viewBox="0 0 360 360" aria-hidden="true">
          <defs>
            <radialGradient id="veyr-bloom" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(214,179,107,0.12)" />
              <stop offset="55%" stopColor="rgba(214,179,107,0.03)" />
              <stop offset="100%" stopColor="rgba(214,179,107,0)" />
            </radialGradient>
          </defs>

          <circle cx="180" cy="180" r="176" fill="url(#veyr-bloom)" />

          {/* Static concentric guides */}
          <circle className="veyr__ring" cx="180" cy="180" r="168" />
          <circle className="veyr__ring veyr__ring--faint" cx="180" cy="180" r="118" />
          <circle className="veyr__ring veyr__ring--faint" cx="180" cy="180" r="86" />

          {/* Slowly rotating hairline ring */}
          <g className="veyr__spin" style={{ transformOrigin: "180px 180px" }}>
            <circle
              className="veyr__ring--dashed"
              cx="180"
              cy="180"
              r="158"
              strokeDasharray="1.5 13"
            />
          </g>

          {/* 64 Line ticks */}
          <g className="veyr__ticks">
            {TICK_RING.map((i) => {
              const a = (i / 64) * Math.PI * 2 - Math.PI / 2;
              const isMajor = i % 16 === 0;
              const r0 = isMajor ? 130 : 136;
              const r1 = 144;
              return (
                <line
                  key={i}
                  x1={180 + Math.cos(a) * r0}
                  y1={180 + Math.sin(a) * r0}
                  x2={180 + Math.cos(a) * r1}
                  y2={180 + Math.sin(a) * r1}
                  className={isMajor ? "veyr__tick veyr__tick--major" : "veyr__tick"}
                />
              );
            })}
          </g>

          {/* Depleting progress arc */}
          {!reading.closed && (
            <circle
              className="veyr__progress"
              cx="180"
              cy="180"
              r={R}
              transform="rotate(-90 180 180)"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
            />
          )}
        </svg>

        {/* Per-second pulse dot */}
        <span className={`veyr__pulse ${reading.closed ? "is-still" : ""}`} aria-hidden="true" />

        <div className="veyr__inner">
          <p className="veyr__eyebrow">VEYRAN SIGNAL WINDOW</p>
          <p className="veyr__sub">{reading.closed ? "Transmission Register Sealed" : "Transmission Register Open"}</p>

          {reading.closed ? (
            <>
              <p className="veyr__closed">SIGNAL WINDOW CLOSED</p>
              <div className="veyr__readout" role="timer" aria-label="Signal window closed">
                <VeyrUnit label="ARC" value="Ø" />
                <span className="veyr__slash">/</span>
                <VeyrUnit label="LINE" value="00" />
                <span className="veyr__slash">/</span>
                <VeyrUnit label="PULSE" value="00" />
              </div>
              <button type="button" className="veyr__reopen" onClick={reopen}>
                REOPEN SIGNAL
              </button>
            </>
          ) : (
            <>
              <div className="veyr__readout" role="timer" aria-label="Veyran countdown">
                <VeyrUnit label="ARC" value={ARC_ROMAN[reading.arc] ?? "Ø"} />
                <span className="veyr__slash">/</span>
                <VeyrUnit label="LINE" value={pad2(reading.line)} />
                <span className="veyr__slash">/</span>
                <VeyrUnit label="PULSE" value={pad2(reading.pulse)} />
              </div>

              <p className="veyr__desc">
                The archive remains open for three arcs.
                <br />
                When the final pulse resolves, the chamber resets.
              </p>

              <p className="veyr__mirror">EARTH MIRROR: {reading.earth}</p>
            </>
          )}
        </div>
      </div>

      <style>{`
        .veyr {
          position: relative;
          display: flex;
          justify-content: center;
          padding: clamp(2rem, 6vw, 4rem) 1.25rem;
        }

        .veyr__frame {
          position: relative;
          width: min(560px, 100%);
          aspect-ratio: 1;
          max-height: 560px;
          display: grid;
          place-items: center;
          border-radius: 50%;
        }

        .veyr__geo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .veyr__ring {
          fill: none;
          stroke: rgba(214, 179, 107, 0.28);
          stroke-width: 0.8;
        }
        .veyr__ring--faint {
          stroke: rgba(214, 179, 107, 0.12);
        }
        .veyr__ring--dashed {
          fill: none;
          stroke: rgba(214, 179, 107, 0.22);
          stroke-width: 0.8;
        }

        .veyr__tick {
          stroke: rgba(214, 179, 107, 0.22);
          stroke-width: 1;
        }
        .veyr__tick--major {
          stroke: rgba(232, 196, 119, 0.6);
          stroke-width: 1.4;
        }

        .veyr__progress {
          fill: none;
          stroke: #e8c477;
          stroke-width: 1.6;
          stroke-linecap: round;
          filter: drop-shadow(0 0 6px rgba(232, 196, 119, 0.55));
          transition: stroke-dashoffset 0.24s linear;
        }

        .veyr__spin {
          animation: veyrSpin 140s linear infinite;
        }

        .veyr__pulse {
          position: absolute;
          top: calc(50% - 148px);
          left: 50%;
          width: 9px;
          height: 9px;
          margin-left: -4.5px;
          margin-top: -4.5px;
          border-radius: 50%;
          background: #f2ead7;
          box-shadow: 0 0 10px 2px rgba(232, 196, 119, 0.7);
          animation: veyrBeat 1s ease-in-out infinite;
        }
        .veyr__pulse.is-still {
          animation: none;
          opacity: 0.35;
          box-shadow: 0 0 6px rgba(214, 179, 107, 0.4);
        }

        .veyr__inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.55rem;
          padding: 0 2rem;
          max-width: 90%;
        }

        .veyr__eyebrow {
          margin: 0;
          font-family: var(--font-display, "Cinzel", Georgia, serif);
          font-size: clamp(0.85rem, 1.6vw, 1.05rem);
          letter-spacing: 0.42em;
          text-indent: 0.42em;
          color: #e8dcc0;
        }

        .veyr__sub {
          margin: 0;
          font-family: var(--font-voice, "Cormorant Garamond", Georgia, serif);
          font-style: italic;
          font-size: clamp(0.82rem, 1.3vw, 0.98rem);
          letter-spacing: 0.08em;
          color: #9d8f74;
        }

        .veyr__readout {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: clamp(0.6rem, 2vw, 1.15rem);
          margin: 0.5rem 0 0.35rem;
        }

        .veyr__unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: clamp(52px, 9vw, 74px);
        }

        .veyr__unit-label {
          font-family: var(--font-ritual, "Red Hat Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.3em;
          text-indent: 0.3em;
          color: #8a7f6b;
        }

        .veyr__unit-value {
          font-family: var(--font-ritual, "Red Hat Mono", monospace);
          font-size: clamp(2.1rem, 6vw, 3.1rem);
          line-height: 1;
          font-weight: 500;
          color: #f2ead7;
          text-shadow: 0 0 18px rgba(232, 196, 119, 0.35);
          font-variant-numeric: tabular-nums;
        }

        .veyr__slash {
          font-family: var(--font-ritual, "Red Hat Mono", monospace);
          font-size: clamp(1.6rem, 4.5vw, 2.4rem);
          line-height: 1.4;
          color: rgba(214, 179, 107, 0.4);
          align-self: center;
          margin-top: 10px;
        }

        .veyr__desc {
          margin: 0.4rem 0 0;
          font-family: var(--font-voice, "Cormorant Garamond", Georgia, serif);
          font-style: italic;
          font-size: clamp(0.9rem, 1.5vw, 1.05rem);
          line-height: 1.5;
          color: #b8ac93;
        }

        .veyr__mirror {
          margin: 0.7rem 0 0;
          font-family: var(--font-ritual, "Red Hat Mono", monospace);
          font-size: 9.5px;
          letter-spacing: 0.24em;
          text-indent: 0.24em;
          color: #6f6551;
        }

        .veyr__closed {
          margin: 0.6rem 0 0.2rem;
          font-family: var(--font-display, "Cinzel", Georgia, serif);
          font-size: clamp(1rem, 2.2vw, 1.35rem);
          letter-spacing: 0.24em;
          text-indent: 0.24em;
          color: #d8b56d;
        }

        .veyr__reopen {
          margin-top: 1.2rem;
          padding: 11px 26px;
          border: 1px solid rgba(214, 179, 107, 0.5);
          background: transparent;
          color: #e8dcc0;
          font-family: var(--font-ritual, "Red Hat Mono", monospace);
          font-size: 10px;
          letter-spacing: 0.28em;
          text-indent: 0.28em;
          cursor: pointer;
          transition: border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
        }
        .veyr__reopen:hover {
          border-color: #e8c477;
          background: rgba(214, 179, 107, 0.07);
          box-shadow: 0 0 22px rgba(214, 179, 107, 0.18);
        }

        @keyframes veyrBeat {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          12% { transform: scale(1.7); opacity: 1; }
          40% { transform: scale(1); opacity: 0.55; }
        }
        @keyframes veyrSpin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .veyr__pulse { animation: none; opacity: 0.7; }
          .veyr__spin { animation: none; }
          .veyr__progress { transition: none; }
        }
      `}</style>
    </section>
  );
}

function VeyrUnit({ label, value }: { label: string; value: string }) {
  return (
    <span className="veyr__unit">
      <span className="veyr__unit-value">{value}</span>
      <span className="veyr__unit-label">{label}</span>
    </span>
  );
}
