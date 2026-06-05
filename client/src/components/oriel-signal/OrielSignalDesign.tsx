import { type CSSProperties, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import "./oriel-signal.css";

export const ORIEL_HERO_VIDEO_SRC = "/media/fa_mi_un_videoclip_loop_ca_sa.mp4";
export const ORIEL_HERO_POSTER_SRC = "/media/oriel-signal-poster.png";

type SignalTone = "gold" | "teal" | "violet" | "silver" | "amber";

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
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`signal-page-shell ${className}`}>
      <div className="signal-archive-texture" aria-hidden="true" />
      <div className="signal-ambient-grid" aria-hidden="true" />
      <div className="signal-sacred-geometry" aria-hidden="true" />
      <div className="signal-starfield" aria-hidden="true" />
      {children}
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
