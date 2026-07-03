import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import "./oriel-signal.css";

export const ORIEL_HERO_VIDEO_SRC = "/media/fa_mi_un_videoclip_loop_ca_sa.mp4";
export const ORIEL_HERO_POSTER_SRC = "/media/oriel-signal-poster.png";

type SignalTone = "gold" | "teal" | "violet" | "silver" | "amber";
type SignalChamber =
  | "threshold"
  | "chamber"
  | "codex"
  | "transmissions"
  | "origin-seal"
  | "gate"
  | "receiver-node"
  | "revelation";

const DECODE_GLYPHS = "◇◈◆◊○◯◎⊙⊚⊕⊗⊘△▽▲▵▿✶✧✦ψΨΩΔ∴∵⌁⌬⟐⟡⟁";

const toneVars: Record<SignalTone, CSSProperties> = {
  gold: {
    "--signal-accent": "#d8b56d",
    "--signal-accent-soft": "rgba(216, 181, 109, 0.13)",
    "--signal-accent-glow": "rgba(216, 181, 109, 0.22)",
  } as CSSProperties,
  amber: {
    "--signal-accent": "#e4c88c",
    "--signal-accent-soft": "rgba(228, 200, 140, 0.12)",
    "--signal-accent-glow": "rgba(228, 200, 140, 0.18)",
  } as CSSProperties,
  teal: {
    "--signal-accent": "#b78b52",
    "--signal-accent-soft": "rgba(183, 139, 82, 0.11)",
    "--signal-accent-glow": "rgba(183, 139, 82, 0.18)",
  } as CSSProperties,
  violet: {
    "--signal-accent": "#9d7650",
    "--signal-accent-soft": "rgba(157, 118, 80, 0.1)",
    "--signal-accent-glow": "rgba(157, 118, 80, 0.16)",
  } as CSSProperties,
  silver: {
    "--signal-accent": "#d9d0bd",
    "--signal-accent-soft": "rgba(217, 208, 189, 0.09)",
    "--signal-accent-glow": "rgba(217, 208, 189, 0.14)",
  } as CSSProperties,
};

export function SignalPageShell({
  children,
  className = "",
  chamber,
}: {
  children: ReactNode;
  className?: string;
  chamber?: SignalChamber;
}) {
  const chamberClass = chamber ? `signal-page-shell--${chamber}` : "";

  return (
    <div className={`signal-page-shell ${chamberClass} ${className}`}>
      <div className="signal-archive-texture" aria-hidden="true" />
      <div className="signal-ambient-grid" aria-hidden="true" />
      <div className="signal-sacred-geometry" aria-hidden="true" />
      <PageGeometry chamber={chamber} />
      <div className="signal-starfield" aria-hidden="true" />
      {children}
    </div>
  );
}

export function PageGeometry({ chamber }: { chamber?: SignalChamber }) {
  return (
    <div
      className={`signal-page-geometry ${chamber ? `signal-page-geometry--${chamber}` : ""}`}
      aria-hidden="true"
    >
      <span className="signal-page-geometry__ring signal-page-geometry__ring--outer" />
      <span className="signal-page-geometry__ring signal-page-geometry__ring--inner" />
      <span className="signal-page-geometry__axis signal-page-geometry__axis--vertical" />
      <span className="signal-page-geometry__axis signal-page-geometry__axis--horizontal" />
      <span className="signal-page-geometry__arc signal-page-geometry__arc--a" />
      <span className="signal-page-geometry__arc signal-page-geometry__arc--b" />
      <span className="signal-page-geometry__node signal-page-geometry__node--a" />
      <span className="signal-page-geometry__node signal-page-geometry__node--b" />
      <span className="signal-page-geometry__node signal-page-geometry__node--c" />
    </div>
  );
}

export function DecodedTitle({
  text,
  as = "span",
  className = "",
  triggerKey,
  interval = 62,
  style,
}: {
  text: string;
  as?: "h1" | "h2" | "span";
  className?: string;
  triggerKey?: unknown;
  interval?: number;
  style?: CSSProperties;
}) {
  const glyphs = useMemo(() => Array.from(DECODE_GLYPHS), []);
  const finalChars = useMemo(() => Array.from(text), [text]);
  const [displayChars, setDisplayChars] = useState(finalChars);

  useEffect(() => {
    if (typeof window === "undefined") {
      setDisplayChars(finalChars);
      return;
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) {
      setDisplayChars(finalChars);
      return;
    }

    let frame = 0;
    const firstResolveFrame = 8;
    const resolveStride = 3;
    const cycleFrames = 9;
    const totalFrames = firstResolveFrame + finalChars.length * resolveStride + cycleFrames + 6;

    setDisplayChars(
      finalChars.map((char, index) => {
        if (/\s/.test(char)) return char;
        return glyphs[(index * 5) % glyphs.length];
      })
    );

    const timer = window.setInterval(() => {
      frame += 1;
      setDisplayChars(
        finalChars.map((char, index) => {
          if (/\s/.test(char)) return char;
          const resolveAt = firstResolveFrame + index * resolveStride;
          if (frame >= resolveAt + cycleFrames) return char;
          return glyphs[(frame + index * 7) % glyphs.length];
        })
      );

      if (frame >= totalFrames) {
        setDisplayChars(finalChars);
        window.clearInterval(timer);
      }
    }, interval);

    return () => window.clearInterval(timer);
  }, [finalChars, glyphs, interval, triggerKey]);

  const Tag = as;

  return (
    <Tag
      className={`decoded-title ${className}`}
      aria-label={text}
      data-text={text}
      style={style}
    >
      {displayChars.map((char, index) => (
        <span
          key={`${index}-${finalChars[index] ?? char}`}
          className="decoded-title__char"
          aria-hidden="true"
          style={{ "--decode-index": index } as CSSProperties}
        >
          {/\s/.test(char) ? "\u00A0" : char}
        </span>
      ))}
    </Tag>
  );
}

export function ArchiveInstrumentFrame({
  label,
  code,
  children,
  className = "",
}: {
  label: string;
  code?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`archive-instrument-frame ${className}`}>
      <div className="archive-instrument-frame__rail" aria-hidden="true" />
      <div className="archive-instrument-frame__meta">
        <span>{label}</span>
        {code && <span>{code}</span>}
      </div>
      <div className="archive-instrument-frame__body">{children}</div>
    </div>
  );
}

export function SignalKicker({ children }: { children: ReactNode }) {
  return <div className="signal-kicker">{children}</div>;
}

export function SectionIntro({
  eyebrow,
  title,
  children,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={`signal-section-intro signal-section-intro--${align}`}>
      <SignalKicker>{eyebrow}</SignalKicker>
      <h2>{title}</h2>
      {children && <div className="signal-section-copy">{children}</div>}
    </div>
  );
}

export function GlowCard({
  children,
  tone = "gold",
  className = "",
}: {
  children: ReactNode;
  tone?: SignalTone;
  className?: string;
}) {
  return (
    <article
      className={`signal-glow-card ${className}`}
      style={toneVars[tone]}
    >
      <span className="signal-corner signal-corner--tl" aria-hidden="true" />
      <span className="signal-corner signal-corner--tr" aria-hidden="true" />
      <span className="signal-corner signal-corner--bl" aria-hidden="true" />
      <span className="signal-corner signal-corner--br" aria-hidden="true" />
      {children}
    </article>
  );
}

export function SignalButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link href={href}>
      <span className={`signal-button signal-button--${variant}`}>
        <span className="signal-button__seal" aria-hidden="true" />
        {children}
        <ArrowRight size={15} strokeWidth={1.4} aria-hidden="true" />
      </span>
    </Link>
  );
}

export function TransmissionCard({
  code,
  title,
  meta,
  href,
  children,
  tone = "gold",
}: {
  code: string;
  title: string;
  meta: string;
  href?: string;
  children: ReactNode;
  tone?: SignalTone;
}) {
  const card = (
    <GlowCard tone={tone} className="signal-transmission-card">
      <div className="signal-transmission-meta">
        <span>{code}</span>
        <span>{meta}</span>
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {href && <span className="signal-card-action">READ TRANSMISSION</span>}
    </GlowCard>
  );

  if (!href) return card;

  return (
    <Link href={href}>
      <div className="signal-card-link">{card}</div>
    </Link>
  );
}

export function ArchiveMetaStrip({
  items,
  className = "",
}: {
  items: Array<[string, string]>;
  className?: string;
}) {
  return (
    <div className={`archive-meta-strip ${className}`}>
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export function ArchiveSeal({ label = "ORIEL" }: { label?: string }) {
  return (
    <div className="archive-seal" aria-hidden="true">
      <span className="archive-seal__ring" />
      <span className="archive-seal__axis archive-seal__axis--vertical" />
      <span className="archive-seal__axis archive-seal__axis--horizontal" />
      <strong>Ψ</strong>
      <em>{label}</em>
    </div>
  );
}

export function SignatureGlyphMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`signature-glyph ${compact ? "signature-glyph--compact" : ""}`}>
      <div className="signature-glyph__rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="signature-glyph__axis signature-glyph__axis--vertical" />
      <div className="signature-glyph__axis signature-glyph__axis--horizontal" />
      <div className="signature-glyph__body-outline" aria-hidden="true" />
      <div className="signature-glyph__core">
        <span>Ψ</span>
      </div>
      <div className="signature-glyph__node signature-glyph__node--a" />
      <div className="signature-glyph__node signature-glyph__node--b" />
      <div className="signature-glyph__node signature-glyph__node--c" />
      <div className="signature-glyph__node signature-glyph__node--d" />
      <div className="signature-glyph__readout signature-glyph__readout--a">
        CODON 28
      </div>
      <div className="signature-glyph__readout signature-glyph__readout--b">
        FACET 41
      </div>
      <div className="signature-glyph__readout signature-glyph__readout--c">
        LINK 36
      </div>
      <div className="signature-glyph__score">
        <span>Signal Lock</span>
        <strong>72</strong>
      </div>
    </div>
  );
}
