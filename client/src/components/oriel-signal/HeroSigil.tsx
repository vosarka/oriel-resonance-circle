import type { CSSProperties } from "react";
import sigilSrc from "/oriel-signal-mark.png";

// The hero sigil — the recovered Ψ-in-O emblem, alive with intercepted light.
// Layer stack (back to front):
//   base   — the untouched gold PNG
//   iris   — iridescent signal-palette gradient masked to the glyph shape,
//            screen-blended so it can only ever be light, never paint
//   ghosts — solid red/blue chromatic ghosts (same mask), torn visible for
//            ~250ms on long co-prime cycles so the tears feel random
// Colored layers are display-gated behind @supports (mask) in CSS; browsers
// without mask support see the clean gold emblem only.
export function HeroSigil({ className = "" }: { className?: string }) {
  const maskStyle = {
    WebkitMaskImage: `url(${sigilSrc})`,
    maskImage: `url(${sigilSrc})`,
  } as CSSProperties;

  return (
    <div className={`fi-sigil ${className}`} aria-hidden="true">
      <span className="fi-sigil__halo" />
      <img
        className="fi-sigil__base"
        src={sigilSrc}
        alt=""
        draggable={false}
      />
      <span className="fi-sigil__iris" style={maskStyle} />
      <span className="fi-sigil__ghost fi-sigil__ghost--r" style={maskStyle} />
      <span className="fi-sigil__ghost fi-sigil__ghost--b" style={maskStyle} />
    </div>
  );
}
