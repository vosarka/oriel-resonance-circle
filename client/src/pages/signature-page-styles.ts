export const signaturePageStyles = `
  .signature-page {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    padding: clamp(6.5rem, 10vw, 8.5rem) 1.25rem 6.5rem;
    background:
      radial-gradient(circle at 78% 10%, rgba(var(--oriel-amber-rgb), 0.13), transparent 28rem),
      radial-gradient(circle at 16% 14%, rgba(var(--oriel-gold-rgb), 0.10), transparent 26rem),
      linear-gradient(145deg, rgba(10,10,14,0.99), rgba(15,15,21,0.97) 48%, rgba(6,6,10,1));
    color: var(--oriel-ivory);
    isolation: isolate;
  }

  .signature-page::before,
  .signature-page::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: -1;
  }

  .signature-page::before {
    background:
      linear-gradient(rgba(var(--oriel-amber-rgb), 0.048) 1px, transparent 1px),
      linear-gradient(90deg, rgba(var(--oriel-gold-rgb), 0.038) 1px, transparent 1px);
    background-size: 78px 78px;
    mask-image: radial-gradient(circle at 64% 18%, black 0%, transparent 68%);
    opacity: 0.54;
  }

  .signature-page::after {
    background:
      repeating-linear-gradient(
        to bottom,
        rgba(255,255,255,0.022) 0,
        rgba(255,255,255,0.022) 1px,
        transparent 1px,
        transparent 5px
      ),
      radial-gradient(circle at 50% 0%, rgba(var(--oriel-amber-rgb), 0.08), transparent 34rem);
    mix-blend-mode: screen;
    opacity: 0.28;
  }

  .signature-container {
    position: relative;
    z-index: 1;
    width: min(100%, 72rem);
    margin: 0 auto;
  }

  .signature-container--wide {
    width: min(100%, 78rem);
  }

  .signature-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.18);
    border-radius: 999px;
    background: rgba(var(--oriel-gold-rgb), 0.045);
    padding: 0.58rem 0.9rem;
    color: rgba(232,228,220,0.62);
    font-family: var(--font-ritual);
    font-size: 0.62rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .signature-title {
    margin: 0;
    max-width: 11.5ch;
    color: #fff8ec;
    font-family: var(--font-display);
    font-size: clamp(4rem, 8.4vw, 8.1rem);
    font-weight: 300;
    letter-spacing: -0.055em;
    line-height: 0.86;
    text-shadow: 0 0 54px rgba(var(--oriel-amber-rgb), 0.18);
    text-wrap: balance;
  }

  .signature-title em {
    font-style: italic;
    color: var(--oriel-amber);
    text-shadow:
      0 0 45px rgba(var(--oriel-amber-rgb), 0.26),
      0 0 15px rgba(var(--oriel-gold-rgb), 0.12);
  }

  .signature-lede {
    max-width: 42rem;
    color: rgba(232,228,220,0.70);
    font-family: var(--font-body);
    font-size: clamp(1rem, 1.35vw, 1.18rem);
    font-weight: 300;
    line-height: 1.9;
  }

  .signature-panel {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.16);
    border-radius: 1.25rem;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.036), rgba(255,255,255,0.012)),
      rgba(var(--oriel-surface-rgb), 0.76);
    box-shadow:
      inset 0 0 0 0.5px rgba(255,255,255,0.035),
      0 24px 70px rgba(0,0,0,0.30);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
  }

  .signature-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 18% 0%, rgba(var(--oriel-amber-rgb), 0.08), transparent 34%);
    opacity: 0.72;
  }

  .signature-panel > * {
    position: relative;
    z-index: 1;
  }

  .signature-hero-grid {
    display: grid;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: end;
  }

  .signature-product-grid {
    display: grid;
    gap: 1.25rem;
  }

  .signature-product-card {
    transition:
      transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
      border-color 0.45s ease,
      box-shadow 0.45s ease;
  }

  .signature-product-card:hover {
    transform: translateY(-6px);
    border-color: rgba(var(--oriel-amber-rgb), 0.42);
    box-shadow:
      inset 0 0 0 0.5px rgba(var(--oriel-amber-rgb), 0.22),
      0 30px 86px rgba(var(--oriel-amber-rgb), 0.08),
      0 24px 70px rgba(0,0,0,0.30);
  }

  .signature-cover-shell {
    position: relative;
    overflow: hidden;
    border-radius: 1.1rem;
    background:
      radial-gradient(circle at 50% 20%, rgba(var(--oriel-amber-rgb), 0.10), transparent 55%),
      rgba(0,0,0,0.48);
  }

  .signature-cover-shell img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.82) contrast(1.08) brightness(0.92) sepia(0.18);
  }

  .signature-cover-shell::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 20%, rgba(var(--oriel-amber-rgb), 0.10), transparent 58%),
      linear-gradient(to top, rgba(10,10,14,0.68), transparent 48%);
    mix-blend-mode: screen;
    pointer-events: none;
  }

  .signature-kicker,
  .signature-meta,
  .signature-button,
  .signature-field-label,
  .signature-status {
    font-family: var(--font-ritual);
    text-transform: uppercase;
  }

  .signature-kicker {
    color: rgba(154,150,142,0.76);
    font-size: 0.6rem;
    letter-spacing: 0.24em;
  }

  .signature-heading {
    color: #fff8ec;
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 3.4rem);
    font-weight: 300;
    letter-spacing: -0.035em;
    line-height: 0.98;
  }

  .signature-subheading {
    color: #fff8ec;
    font-family: var(--font-display);
    font-size: clamp(1.7rem, 2.6vw, 2.5rem);
    font-weight: 300;
    letter-spacing: -0.025em;
    line-height: 1.05;
  }

  .signature-body {
    color: rgba(232,228,220,0.66);
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 300;
    line-height: 1.85;
  }

  .signature-price {
    color: var(--oriel-amber);
    font-family: var(--font-display);
    font-size: clamp(2.4rem, 4vw, 4rem);
    font-weight: 300;
    letter-spacing: -0.04em;
    line-height: 0.9;
    text-shadow: 0 0 30px rgba(var(--oriel-amber-rgb), 0.18);
  }

  .signature-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.18);
    border-radius: 999px;
    background: rgba(var(--oriel-gold-rgb), 0.045);
    color: rgba(232,228,220,0.88);
    padding: 0.95rem 1.25rem;
    font-size: 0.68rem;
    letter-spacing: 0.2em;
    transition:
      transform 0.35s ease,
      border-color 0.35s ease,
      background 0.35s ease,
      box-shadow 0.35s ease;
  }

  .signature-button:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: rgba(var(--oriel-amber-rgb), 0.48);
    background: rgba(var(--oriel-amber-rgb), 0.08);
    box-shadow: 0 18px 44px rgba(var(--oriel-amber-rgb), 0.12);
  }

  .signature-button--primary {
    border-color: rgba(var(--oriel-amber-rgb), 0.38);
    color: var(--oriel-amber);
    background: rgba(var(--oriel-amber-rgb), 0.085);
  }

  .signature-list {
    display: grid;
    gap: 0.9rem;
    color: rgba(232,228,220,0.64);
    font-size: 0.92rem;
    font-weight: 300;
    line-height: 1.75;
  }

  .signature-icon {
    color: var(--oriel-amber);
    filter: drop-shadow(0 0 12px rgba(var(--oriel-amber-rgb), 0.22));
  }

  .signature-step-index {
    min-width: 1.8rem;
    color: var(--oriel-amber);
    font-family: var(--font-display);
    font-size: 1.65rem;
    line-height: 1;
  }

  .signature-form-grid {
    display: grid;
    gap: 1rem;
  }

  .signature-field {
    display: block;
  }

  .signature-field-label {
    display: block;
    margin-bottom: 0.55rem;
    color: rgba(var(--oriel-amber-rgb), 0.82);
    font-size: 0.62rem;
    letter-spacing: 0.18em;
  }

  .signature-input,
  .signature-select,
  .signature-textarea {
    width: 100%;
    border: 1px solid rgba(var(--oriel-gold-rgb), 0.18);
    border-radius: 0.85rem;
    background: rgba(10,10,14,0.52);
    color: var(--oriel-ivory);
    font-family: var(--font-body);
    font-size: 0.9rem;
    outline: none;
    transition:
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      background 0.25s ease;
  }

  .signature-input,
  .signature-select {
    height: 3rem;
    padding: 0 0.95rem;
  }

  .signature-textarea {
    min-height: 8rem;
    padding: 0.95rem;
    line-height: 1.7;
  }

  .signature-input:focus,
  .signature-select:focus,
  .signature-textarea:focus {
    border-color: rgba(var(--oriel-amber-rgb), 0.52);
    background: rgba(10,10,14,0.72);
    box-shadow: 0 0 0 3px rgba(var(--oriel-amber-rgb), 0.08);
  }

  .signature-consent {
    color: rgba(232,228,220,0.62);
    font-size: 0.9rem;
    line-height: 1.7;
  }

  .signature-error {
    border: 1px solid rgba(201,68,68,0.45);
    border-radius: 1rem;
    background: rgba(201,68,68,0.08);
    color: #f1b5a8;
    padding: 1rem;
    font-size: 0.9rem;
  }

  @media (min-width: 768px) {
    .signature-form-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1024px) {
    .signature-hero-grid {
      grid-template-columns: 0.92fr 1.08fr;
    }

    .signature-product-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
`;
