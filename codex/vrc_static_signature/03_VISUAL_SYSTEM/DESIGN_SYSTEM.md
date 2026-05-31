# VRC Design System: Visual Identity & Tokens

This specification defines the CSS custom properties, typography scale, 12-column grid system, and print media rules for the VRC Static Signature Codex.

---

## 1. COLOR TOKENS (CSS VARIABLES)
To ensure consistent branding and visual theme across Web and PDF targets, the following colors must be declared as root variables:

```css
:root {
  /* Field (Backgrounds) */
  --vrc-color-obsidian: #000000;
  --vrc-color-space: #0D0E10;
  --vrc-color-slate: #15171C;

  /* Accents */
  --vrc-color-gold: #D4AF37;         /* Coherence, Defined, Authority */
  --vrc-color-gold-glow: #FFD700;
  --vrc-color-cyan: #00F0FF;         /* Active Signal, Conscious */
  --vrc-color-cyan-glow: #00E8C6;

  /* Neutral / Text */
  --vrc-color-ivory: #F5F2EB;        /* Primary Typography, Grid Borders */
  --vrc-color-gray-dormant: #2C2E35; /* Off-states, Dormant links */
  --vrc-color-gray-muted: #3E414A;   /* Secondary typography, Grid lines */

  /* Translucency values for charts */
  --vrc-opacity-active: 0.2;
  --vrc-opacity-dormant: 0.05;
}
```

---

## 2. TYPOGRAPHY & MATHEMATICAL SCALE
The type system utilizes **Outfit** (for headers and geometric badges) and **Inter** (for body copy). The scale is built on a major third interval ($1.250$ ratio) using a baseline of $16\text{px}$ ($1\text{rem}$):

```css
:root {
  --vrc-font-header: 'Outfit', sans-serif;
  --vrc-font-body: 'Inter', sans-serif;
  --vrc-font-mono: 'JetBrains Mono', monospace;

  /* Typographic rhythm scale */
  --vrc-text-xs: 0.8rem;    /* 12.8px (Mono logs, footer rails) */
  --vrc-text-sm: 0.9rem;    /* 14.4px (Table headers, card details) */
  --vrc-text-base: 1.0rem;  /* 16px (Body text, general description) */
  --vrc-text-md: 1.25rem;   /* 20px (Section subheads, menu links) */
  --vrc-text-lg: 1.56rem;   /* 25px (H2 page subheadings) */
  --vrc-text-xl: 1.95rem;   /* 31.2px (H1 page titles) */
  --vrc-text-xxl: 2.44rem;  /* 39px (Hero badges, cover page title) */
}
```

---

## 3. PAGE GRID & MARGIN COMPOSITION
For printable and exportable templates, page layout is built on a 12-column flexbox or CSS Grid:

```css
.vrc-page-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2.25rem (36px); /* Generous padding to prevent clipping */
  box-sizing: border-box;
}

/* 12-column grid layout */
.vrc-grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 1.5rem (24px);
  row-gap: 1.5rem (24px);
}
```

---

## 4. PRINT MEDIA RULES (PDF STYLING)
To enforce the 15-page strict target and prevent page-break overflow, the print stylesheet must enforce the following rules:

```css
@media print {
  @page {
    size: letter portrait;
    margin: 0.75in;
  }

  body {
    background-color: var(--vrc-color-obsidian) !important;
    color: var(--vrc-color-ivory) !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .vrc-report-page {
    page-break-after: always;
    page-break-inside: avoid;
    height: 100%;
    max-height: 100vh;
    overflow: hidden;
    position: relative;
    box-sizing: border-box;
  }

  /* Prevent split text on headers/tables */
  h1, h2, h3, tr, img, svg {
    page-break-inside: avoid;
  }
}
```

---

## 5. REUSABLE SACRED-TECH UI PATTERNS
- **OBSIDIAN CARD**: A content box with a very thin ivory border and subtle corners:
  ```css
  .vrc-card {
    background-color: var(--vrc-color-slate);
    border: 1px solid var(--vrc-color-gray-muted);
    border-radius: 2px;
    padding: 1.25rem;
  }
  ```
- **DOUBLE BORDER STRIP**: A traditional Vossari line grouping used to separate header rails:
  ```css
  .vrc-double-divider {
    border-top: 1px solid var(--vrc-color-gold);
    border-bottom: 1px solid var(--vrc-color-gold);
    height: 3px;
    margin: 1.5rem 0;
  }
  ```
- **GLOW EFFECT**: A soft CSS glow used for active elements (defined centers/authority):
  ```css
  .vrc-glow-active-gold {
    filter: drop-shadow(0px 0px 8px var(--vrc-color-gold-glow));
  }
  .vrc-glow-active-cyan {
    filter: drop-shadow(0px 0px 8px var(--vrc-color-cyan-glow));
  }
  ```
