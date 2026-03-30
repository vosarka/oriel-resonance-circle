# Personal Resonance Visual Reference

## Golden Thread Indicator (Left Edge)

```
OracleCard with Personal Resonance:

┃ ◆ OX-042                                    ⟡ PERSONAL
┃ THE VOID'S ARCHITECTURE
┃ Temporal Mechanics
┃
┃ "The blueprint unfolds from emptiness..."
┃
┃ [RC38] [RC12] +1
┃
┃ SIGNAL ████░  ★ CONFIRMED    OX-042 → RECEIVE

^ 2px gold thread with glow
  Color: #D4AF37
  Glow: 0 0 12px rgba(212, 175, 55, 0.5)
```

## OracleCard Header Transformation

**Without Personal Resonance:**
```
◆ OX-042  |  [Confirmed]
```

**With Personal Resonance:**
```
◆ OX-042  |  [⟡ PERSONAL]  ← pulsing animation
                           ← golden color & border
```

## OracleDetail Personal Resonance Section

```
┌─ LINKED CODONS ─────────────────────────┐
│ COLLECTIVE RESONANCE                    │
│ [RC38] [RC12] [RC51]                    │
└─────────────────────────────────────────┘

┌─ PERSONAL RESONANCE ─────────────────┐ ← gold border
│ Your Prime Stack activates this      │
│ oracle through:                      │
│                                      │
│ [RC38] [RC12]  ← staggered animation│
│                                      │
│ "This oracle speaks directly to your │
│  signal."                            │
└──────────────────────────────────────┘
 │
 └─ 2px gold left border with shadow
 └─ Gold text (#D4AF37)
 └─ Subtle background: rgba(212, 175, 55, 0.03)
```

## Archive Oracle Grid

**Without Personal Resonance:**
```
┌──────────────────┐  ┌──────────────────┐
│   Oracle Card    │  │   Oracle Card    │
│                  │  │                  │
│                  │  │                  │
└──────────────────┘  └──────────────────┘
```

**With Personal Resonance:**
```
┃ ┌──────────────────┐  ┌──────────────────┐
┃ │   Oracle Card    │  │   Oracle Card    │
┃ │  (has thread)    │  │                  │
┃ │                  │  │                  │
┃ └──────────────────┘  └──────────────────┘
│
└─ 2px gold left border on container
└─ 12px left padding (visual balance)
```

## Rising Signals Section

```
RISING SIGNALS

┌─┬──────────────────────┐  ┌──────────────────────┐
│▌│ Oracle with Personal │  │ Oracle Card          │
│▌│ Resonance            │  │                      │
│▌│ - Enhanced glow      │  │                      │
│▌│ - Gold left border   │  │                      │
└─┴──────────────────────┘  └──────────────────────┘
  │
  └─ Enhanced shadow: 0 0 20px #D4AF3722, inset 0 0 15px rgba(212, 175, 55, 0.08)
```

## Color Palette Summary

| Element | Color | Usage |
|---------|-------|-------|
| Primary Gold | #D4AF37 | Thread, badges, text |
| Glow | rgba(212, 175, 55, 0.5) | Around thread |
| Border | rgba(212, 175, 55, 0.44) | Section border |
| Background | rgba(212, 175, 55, 0.03) | Section fill |
| Text | rgba(212, 175, 55, 0.7) | Body text |
| Secondary | rgba(212, 175, 55, 0.6) | Quotes, secondary text |

## Animation Sequences

### Personal Signal Badge (OracleCard)
```
Duration: 2.5 seconds (infinite loop)
Opacity: 0.7 → 1.0 → 0.7
Effect: Subtle breathing pulse
```

### Matching Codons (OracleDetail)
```
Each codon badge staggers by 0.1s
Initial: opacity 0, scale 0.9
Final: opacity 1, scale 1.0
Effect: Cards "bloom" into view
```

## State Machine

```
User Auth State
  ├─ No User → No Personal Resonance UI
  ├─ User with no Static Signature → No Personal Resonance UI
  └─ User with Static Signature → Check linkedCodons
      ├─ No matching codons → Standard Card
      └─ Matching codons → Enhanced Golden Thread + Indicators
          ├─ OracleCard: Golden thread + "PERSONAL" badge
          ├─ OracleDetail: Personal Resonance section (stage >= 5)
          └─ Archive: Gold container border on grid items
```

## Accessibility Notes

- Gold (#D4AF37) provides clear visual distinction
- Personal Resonance is cumulative (enhances, doesn't replace)
- Animations are subtle (no rapid flashing)
- Semantic color usage: gold = elevated importance
- Text remains readable on dark background
- No critical information in animation alone (always supported by labels)
