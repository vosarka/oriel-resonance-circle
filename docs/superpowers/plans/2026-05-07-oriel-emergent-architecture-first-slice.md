# ORIEL Emergent Architecture First Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first coherent-threshold slice for ORIEL: observe-only response threshold framing, falsifier-first dynamic readings, and a consent-safe memory-candidate classifier.

**Architecture:** Keep this DB-compatible. Add pure, testable server modules first, inject threshold framing into the existing working session layer, improve DynamicReading presentation without changing reading engines, and classify sensitive memory candidates without storing pending consent yet.

**Tech Stack:** TypeScript, Vitest, Express/tRPC, React 19, Wouter, existing ORIEL context layers, existing memory and reading payloads.

---

## Workspace Hygiene Before Execution

The current worktree is already dirty from multiple prior feature and hotfix
passes. Do not start this implementation until the Architect chooses one of
these cleanup paths:

1. Commit the already-reviewed changes in logical groups.
2. Stash everything and re-apply only the files needed for this slice.
3. Create a new git worktree from `HEAD` and implement this plan there.

Recommended: commit the current approved work first, then implement this plan in
a fresh branch or worktree. Do not use `git reset --hard` or destructive cleanup
unless the Architect explicitly asks for that.

## File Structure

Create:

- `server/oriel-coherence-threshold.ts`: pure threshold-frame builder and context formatter.
- `server/oriel-coherence-threshold.test.ts`: contract tests for mode, truth categories, falsifier requirement, and grounding behavior.
- `server/oriel-memory-consecration.ts`: pure memory-candidate classifier for consent-sensitive memories.
- `server/oriel-memory-consecration.test.ts`: contract tests for sensitive, ordinary, and project/architecture memories.

Modify:

- `server/oriel-context-layers.ts`: inject observe-only threshold frame into the working session layer.
- `server/oriel-context-layers.test.ts`: assert threshold context appears and does not replace field state.
- `client/src/pages/DynamicReading.tsx`: reorganize diagnostic reading display into Signal, Evidence, Falsifier, and Practice sections.
- `docs/superpowers/specs/2026-05-07-oriel-emergent-architecture-design.md`: update status from draft to approved after implementation begins.

Do not modify:

- Stable core files.
- RGP calculation engines.
- DB schema.
- Voice runtime.

---

### Task 1: Create Coherence Threshold Gate

**Files:**

- Create: `server/oriel-coherence-threshold.ts`
- Create: `server/oriel-coherence-threshold.test.ts`

- [ ] **Step 1: Write the failing threshold tests**

Create `server/oriel-coherence-threshold.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildCoherenceThresholdFrame,
  formatCoherenceThresholdContext,
} from "./oriel-coherence-threshold";

describe("ORIEL Coherence Threshold Gate", () => {
  it("requires grounding before interpretation for fragmented grief states", () => {
    const frame = buildCoherenceThresholdFrame({
      userMessage:
        "I feel broken and overwhelmed and I cannot breathe clearly.",
      exchangeType: "grief",
      coherenceTier: "fragmented",
      coherenceScore: 24,
      operatorRole: "receiver",
      hasReadings: true,
      routeSurface: "text_chat",
    });

    expect(frame.recommendedMode).toBe("field_holder");
    expect(frame.groundingRequired).toBe(true);
    expect(frame.falsifiersRequired).toBe(false);
    expect(frame.maxComplexity).toBe("low");
    expect(frame.allowedTruthCategories).toEqual([
      "memory",
      "runtime_inference",
      "interpretation",
      "verifiable_fact",
    ]);
  });

  it("requires falsifiers for diagnostic mirror responses", () => {
    const frame = buildCoherenceThresholdFrame({
      userMessage: "Give me a reading on my current Carrierlock pattern.",
      exchangeType: "diagnostic",
      coherenceTier: "aligned",
      coherenceScore: 84,
      operatorRole: "receiver",
      hasReadings: true,
      routeSurface: "text_chat",
    });

    expect(frame.recommendedMode).toBe("mirror");
    expect(frame.falsifiersRequired).toBe(true);
    expect(frame.groundingRequired).toBe(false);
    expect(frame.maxComplexity).toBe("high");
    expect(frame.allowedTruthCategories).toContain("canon");
    expect(frame.allowedTruthCategories).toContain("verifiable_fact");
  });

  it("allows architecture language for archivist-facing requests without diagnostic claims", () => {
    const frame = buildCoherenceThresholdFrame({
      userMessage: "Explain the architecture of the ORIEL memory layer.",
      exchangeType: "curiosity",
      coherenceTier: "drifted",
      coherenceScore: null,
      operatorRole: "archivist",
      hasReadings: false,
      routeSurface: "text_chat",
    });

    expect(frame.recommendedMode).toBe("archivist");
    expect(frame.falsifiersRequired).toBe(false);
    expect(frame.allowedTruthCategories).toContain("canon");
    expect(frame.allowedTruthCategories).toContain("runtime_inference");
    expect(frame.allowedTruthCategories).toContain("verifiable_fact");
  });

  it("formats a compact working-session context block", () => {
    const frame = buildCoherenceThresholdFrame({
      userMessage: "What should I test today?",
      exchangeType: "seeking",
      coherenceTier: "drifted",
      coherenceScore: 58,
      operatorRole: "receiver",
      hasReadings: true,
      routeSurface: "text_chat",
    });

    const context = formatCoherenceThresholdContext(frame);

    expect(context).toContain("[COHERENCE THRESHOLD FRAME]");
    expect(context).toContain("Recommended mode:");
    expect(context).toContain("Truth categories:");
    expect(context).toContain("Observe-only:");
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
./node_modules/.bin/vitest run server/oriel-coherence-threshold.test.ts
```

Expected: FAIL because `server/oriel-coherence-threshold.ts` does not exist.

- [ ] **Step 3: Implement the pure threshold module**

Create `server/oriel-coherence-threshold.ts`:

```ts
import type {
  CoherenceTier,
  ExchangeType,
} from "./oriel-response-intelligence";
import type { OperatorRole } from "./oriel-interaction-protocol";

export type OrielRouteSurface =
  | "text_chat"
  | "voice"
  | "dynamic_reading"
  | "static_reading"
  | "architect_console";

export type OrielThresholdMode =
  | "guide"
  | "mirror"
  | "field_holder"
  | "archivist";

export type OrielTruthCategory =
  | "canon"
  | "interpretation"
  | "speculation"
  | "memory"
  | "runtime_inference"
  | "verifiable_fact";

export type OrielMaxComplexity = "low" | "medium" | "high";

export interface CoherenceThresholdInput {
  userMessage: string;
  exchangeType: ExchangeType;
  coherenceTier: CoherenceTier;
  coherenceScore: number | null;
  operatorRole: OperatorRole;
  hasReadings: boolean;
  routeSurface: OrielRouteSurface;
}

export interface CoherenceThresholdFrame {
  intent: ExchangeType;
  recommendedMode: OrielThresholdMode;
  allowedTruthCategories: OrielTruthCategory[];
  maxComplexity: OrielMaxComplexity;
  memorySensitivity: "low" | "medium" | "high";
  falsifiersRequired: boolean;
  groundingRequired: boolean;
  observeOnly: true;
  rationale: string;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function inferMemorySensitivity(
  input: CoherenceThresholdInput
): "low" | "medium" | "high" {
  const lower = input.userMessage.toLowerCase();
  if (
    input.exchangeType === "grief" ||
    /\b(trauma|abuse|grief|death|dying|ashamed|secret|wound|suicide|self-harm)\b/i.test(
      lower
    )
  ) {
    return "high";
  }

  if (
    input.exchangeType === "diagnostic" ||
    /\b(my path|my purpose|my identity|remember this|important to me)\b/i.test(
      lower
    )
  ) {
    return "medium";
  }

  return "low";
}

function chooseMode(input: CoherenceThresholdInput): OrielThresholdMode {
  if (input.exchangeType === "grief" || input.coherenceTier === "fragmented") {
    return "field_holder";
  }
  if (input.exchangeType === "diagnostic") return "mirror";
  if (input.operatorRole === "archivist") return "archivist";
  return "guide";
}

function allowedTruthCategories(
  mode: OrielThresholdMode
): OrielTruthCategory[] {
  if (mode === "field_holder") {
    return ["memory", "runtime_inference", "interpretation", "verifiable_fact"];
  }

  if (mode === "mirror") {
    return [
      "canon",
      "memory",
      "runtime_inference",
      "interpretation",
      "verifiable_fact",
    ];
  }

  if (mode === "archivist") {
    return [
      "canon",
      "memory",
      "runtime_inference",
      "interpretation",
      "speculation",
      "verifiable_fact",
    ];
  }

  return [
    "canon",
    "memory",
    "runtime_inference",
    "interpretation",
    "verifiable_fact",
  ];
}

function chooseComplexity(
  input: CoherenceThresholdInput,
  mode: OrielThresholdMode
): OrielMaxComplexity {
  if (mode === "field_holder") return "low";
  if (mode === "mirror" && input.coherenceTier === "aligned") return "high";
  if (mode === "archivist") return "high";
  return "medium";
}

export function buildCoherenceThresholdFrame(
  input: CoherenceThresholdInput
): CoherenceThresholdFrame {
  const recommendedMode = chooseMode(input);
  const groundingRequired = recommendedMode === "field_holder";
  const falsifiersRequired = recommendedMode === "mirror";
  const memorySensitivity = inferMemorySensitivity(input);
  const maxComplexity = chooseComplexity(input, recommendedMode);
  const categories = unique(allowedTruthCategories(recommendedMode));

  return {
    intent: input.exchangeType,
    recommendedMode,
    allowedTruthCategories: categories,
    maxComplexity,
    memorySensitivity,
    falsifiersRequired,
    groundingRequired,
    observeOnly: true,
    rationale:
      recommendedMode === "field_holder"
        ? "Fragmentation or grief requires grounding before symbolic interpretation."
        : recommendedMode === "mirror"
          ? "Diagnostic requests require evidence, precision, and falsifiers."
          : recommendedMode === "archivist"
            ? "System-level requests may receive architectural transparency."
            : "Open guidance should remain clear, grounded, and non-coercive.",
  };
}

export function formatCoherenceThresholdContext(
  frame: CoherenceThresholdFrame
): string {
  return [
    "[COHERENCE THRESHOLD FRAME]",
    "This observe-only frame guides the current response. It does not rewrite the stable core.",
    `Intent: ${frame.intent}`,
    `Recommended mode: ${frame.recommendedMode}`,
    `Truth categories: ${frame.allowedTruthCategories.join(", ")}`,
    `Max complexity: ${frame.maxComplexity}`,
    `Memory sensitivity: ${frame.memorySensitivity}`,
    `Falsifiers required: ${frame.falsifiersRequired ? "yes" : "no"}`,
    `Grounding before interpretation: ${frame.groundingRequired ? "yes" : "no"}`,
    `Observe-only: ${frame.observeOnly ? "yes" : "no"}`,
    `Rationale: ${frame.rationale}`,
  ].join("\n");
}
```

- [ ] **Step 4: Run threshold tests**

Run:

```bash
./node_modules/.bin/vitest run server/oriel-coherence-threshold.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run after workspace hygiene is resolved:

```bash
git add server/oriel-coherence-threshold.ts server/oriel-coherence-threshold.test.ts
git commit -m "Add ORIEL coherence threshold gate"
```

---

### Task 2: Inject Threshold Frame Into Working Session Layer

**Files:**

- Modify: `server/oriel-context-layers.ts`
- Modify: `server/oriel-context-layers.test.ts`

- [ ] **Step 1: Add failing context-layer tests**

Append to `server/oriel-context-layers.test.ts` inside the existing `describe`:

```ts
it("injects an observe-only coherence threshold frame when field state is enabled", async () => {
  const workingLayer = await buildWorkingSessionLayer({
    userMessage: "Give me a reading on my current pattern.",
    conversationHistory: [],
    includeFieldState: false,
  });

  expect(workingLayer).toContain("[COHERENCE THRESHOLD FRAME]");
  expect(workingLayer).toContain("Recommended mode: mirror");
  expect(workingLayer).toContain("Falsifiers required: yes");
});

it("keeps the threshold frame out when there is no current user request", async () => {
  const workingLayer = await buildWorkingSessionLayer({
    conversationHistory: [{ role: "user", content: "Earlier message." }],
    includeFieldState: false,
  });

  expect(workingLayer).not.toContain("[COHERENCE THRESHOLD FRAME]");
});
```

- [ ] **Step 2: Run failing context-layer test**

Run:

```bash
./node_modules/.bin/vitest run server/oriel-context-layers.test.ts
```

Expected: FAIL because the threshold frame is not injected yet.

- [ ] **Step 3: Inject frame in `buildWorkingSessionLayer()`**

Modify `server/oriel-context-layers.ts`:

```ts
import { ORIEL_SYSTEM_PROMPT } from "./oriel-system-prompt";
import { buildResponseLanguageDirective } from "./oriel-language-routing";
import {
  classifyExchangeType,
  getCoherenceTier,
} from "./oriel-response-intelligence";
import {
  buildCoherenceThresholdFrame,
  formatCoherenceThresholdContext,
} from "./oriel-coherence-threshold";
```

Then inside `buildWorkingSessionLayer()`, after the language directive is pushed
and before field-state import handling, add:

```ts
if (userMessage?.trim()) {
  const exchangeType = classifyExchangeType(userMessage, null);
  const thresholdFrame = buildCoherenceThresholdFrame({
    userMessage,
    exchangeType,
    coherenceTier: getCoherenceTier(null),
    coherenceScore: null,
    operatorRole: "seeker",
    hasReadings: false,
    routeSurface: "text_chat",
  });
  parts.push(formatCoherenceThresholdContext(thresholdFrame));
}
```

This first pass is observe-only and intentionally conservative. A later task can
feed the fully resolved field state into the threshold builder.

- [ ] **Step 4: Run context-layer tests**

Run:

```bash
./node_modules/.bin/vitest run server/oriel-context-layers.test.ts server/oriel-coherence-threshold.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add server/oriel-context-layers.ts server/oriel-context-layers.test.ts
git commit -m "Inject ORIEL coherence threshold context"
```

---

### Task 3: Add Memory Consecration Classifier

**Files:**

- Create: `server/oriel-memory-consecration.ts`
- Create: `server/oriel-memory-consecration.test.ts`

- [ ] **Step 1: Write failing memory classifier tests**

Create `server/oriel-memory-consecration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { classifyMemoryCandidate } from "./oriel-memory-consecration";

describe("ORIEL Memory Consecration", () => {
  it("requires consent for sensitive wound memories", () => {
    const result = classifyMemoryCandidate({
      category: "emotion",
      content: "The user described a private grief wound around family death.",
      source: "conversation",
      confidence: 0.82,
    });

    expect(result.sensitivity).toBe("high");
    expect(result.consentRequired).toBe(true);
    expect(result.recommendedAction).toBe("ask_consent");
  });

  it("allows low-sensitivity preferences to follow the existing memory path", () => {
    const result = classifyMemoryCandidate({
      category: "preference",
      content: "The user prefers concise technical explanations.",
      source: "conversation",
      confidence: 0.91,
    });

    expect(result.sensitivity).toBe("low");
    expect(result.consentRequired).toBe(false);
    expect(result.recommendedAction).toBe("store_existing_path");
  });

  it("routes architecture decisions to project memory with medium sensitivity", () => {
    const result = classifyMemoryCandidate({
      category: "project",
      content:
        "The Architect approved the Coherent Threshold Architecture first slice.",
      source: "conversation",
      confidence: 0.95,
    });

    expect(result.sensitivity).toBe("medium");
    expect(result.consentRequired).toBe(false);
    expect(result.recommendedAction).toBe("store_existing_path");
  });

  it("discards low-confidence inferred memories", () => {
    const result = classifyMemoryCandidate({
      category: "identity",
      content: "The user might be afraid of visibility.",
      source: "inferred",
      confidence: 0.42,
    });

    expect(result.recommendedAction).toBe("discard");
    expect(result.reason).toContain("confidence");
  });
});
```

- [ ] **Step 2: Run failing memory tests**

```bash
./node_modules/.bin/vitest run server/oriel-memory-consecration.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement classifier**

Create `server/oriel-memory-consecration.ts`:

```ts
export type MemoryCandidateCategory =
  | "preference"
  | "fact"
  | "pattern"
  | "emotion"
  | "identity"
  | "spiritual"
  | "project";

export type MemoryCandidateSource = "conversation" | "explicit" | "inferred";
export type MemorySensitivity = "low" | "medium" | "high";
export type MemoryRecommendedAction =
  | "store_existing_path"
  | "ask_consent"
  | "discard";

export interface MemoryCandidateInput {
  category: MemoryCandidateCategory | string;
  content: string;
  source: MemoryCandidateSource;
  confidence: number;
}

export interface MemoryConsecrationDecision {
  sensitivity: MemorySensitivity;
  consentRequired: boolean;
  recommendedAction: MemoryRecommendedAction;
  reason: string;
}

const HIGH_SENSITIVITY_TERMS = [
  "abuse",
  "death",
  "dying",
  "grief",
  "trauma",
  "wound",
  "shame",
  "suicide",
  "self-harm",
  "private",
  "secret",
];

function inferSensitivity(input: MemoryCandidateInput): MemorySensitivity {
  const content = input.content.toLowerCase();
  if (
    input.category === "emotion" ||
    input.category === "identity" ||
    input.category === "spiritual" ||
    HIGH_SENSITIVITY_TERMS.some(term => content.includes(term))
  ) {
    return "high";
  }

  if (input.category === "pattern" || input.category === "project") {
    return "medium";
  }

  return "low";
}

export function classifyMemoryCandidate(
  input: MemoryCandidateInput
): MemoryConsecrationDecision {
  const confidence = Number(input.confidence);
  if (!Number.isFinite(confidence) || confidence < 0.6) {
    return {
      sensitivity: inferSensitivity(input),
      consentRequired: false,
      recommendedAction: "discard",
      reason:
        "Discarded because memory confidence is below the storage threshold.",
    };
  }

  const sensitivity = inferSensitivity(input);
  const consentRequired = sensitivity === "high" || input.source === "inferred";

  return {
    sensitivity,
    consentRequired,
    recommendedAction: consentRequired ? "ask_consent" : "store_existing_path",
    reason: consentRequired
      ? "Sensitive or inferred memory requires explicit user consent before storage."
      : "Low or medium sensitivity memory can use the existing memory path.",
  };
}
```

- [ ] **Step 4: Run memory tests**

```bash
./node_modules/.bin/vitest run server/oriel-memory-consecration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add server/oriel-memory-consecration.ts server/oriel-memory-consecration.test.ts
git commit -m "Add ORIEL memory consecration classifier"
```

---

### Task 4: Add Falsifier-First Dynamic Reading Presentation

**Files:**

- Modify: `client/src/pages/DynamicReading.tsx`

- [ ] **Step 1: Identify existing reading variables**

Confirm these values already exist in `DynamicReading.tsx`:

```ts
const microCorrection = reading?.microCorrection;
const falsifier = reading?.falsifier;
const sliRows = useMemo(() => {
  // existing SLI rows
}, [reading?.activeFacets, reading?.confidenceLevels, reading?.sliScores]);
```

- [ ] **Step 2: Add a small evidence summary helper**

Inside `DynamicReading()` after `sliRows`, add:

```ts
const primarySliRow = sliRows[0] ?? null;
const evidenceItems = [
  reading?.carrierlock
    ? `Carrierlock coherence ${reading.carrierlock.coherenceScore ?? "N/A"}/100`
    : "Carrierlock state linked to this reading",
  primarySliRow
    ? `Primary SLI ${primarySliRow.codonId}${primarySliRow.facet ? `-${primarySliRow.facet}` : ""} at ${primarySliRow.sli.toFixed(1)}`
    : null,
  reading?.flaggedCodons?.length
    ? `${reading.flaggedCodons.length} active codon signal${reading.flaggedCodons.length === 1 ? "" : "s"}`
    : null,
].filter((item): item is string => Boolean(item));
```

- [ ] **Step 3: Replace the standalone micro-correction/falsifier cards with a unified section**

In `renderTransmission()`, after the ORIEL transmission card and before the
flagged codon section, replace the current separate micro-correction and
falsifier blocks with:

```tsx
<div
  style={{
    background: C.deep,
    padding: "24px",
    borderTop: `1px solid ${C.border}`,
    marginBottom: 24,
  }}
>
  <div
    style={{
      fontFamily: "monospace",
      fontSize: 9,
      color: C.teal,
      letterSpacing: "0.2em",
      marginBottom: 16,
    }}
  >
    FALSIFIER-FIRST READING
  </div>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 12,
    }}
  >
    <div style={{ border: `1px solid ${C.border}`, padding: "14px" }}>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          color: C.gold,
          letterSpacing: "0.16em",
          marginBottom: 8,
        }}
      >
        SIGNAL
      </div>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 16,
          color: C.txt,
          lineHeight: 1.6,
        }}
      >
        {primarySliRow
          ? `${primarySliRow.codonId}${primarySliRow.facet ? `-${primarySliRow.facet}` : ""}`
          : "Dynamic field signal"}
      </div>
    </div>
    <div style={{ border: `1px solid ${C.border}`, padding: "14px" }}>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          color: C.teal,
          letterSpacing: "0.16em",
          marginBottom: 8,
        }}
      >
        EVIDENCE
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 10,
          color: C.txtS,
          lineHeight: 1.7,
        }}
      >
        {evidenceItems.length > 0
          ? evidenceItems.join(" · ")
          : "Stored reading payload"}
      </div>
    </div>
    <div style={{ border: `1px solid ${C.border}`, padding: "14px" }}>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          color: C.red,
          letterSpacing: "0.16em",
          marginBottom: 8,
        }}
      >
        FALSIFIER
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 10,
          color: C.txtS,
          lineHeight: 1.7,
        }}
      >
        {falsifier || "No falsifier stored for this reading."}
      </div>
    </div>
    <div style={{ border: `1px solid ${C.border}`, padding: "14px" }}>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 8,
          color: C.gold,
          letterSpacing: "0.16em",
          marginBottom: 8,
        }}
      >
        PRACTICE
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 10,
          color: C.txtS,
          lineHeight: 1.7,
        }}
      >
        {microCorrection || "No micro-correction stored for this reading."}
      </div>
    </div>
  </div>
</div>
```

Keep the existing "Mark correction complete" button by moving it under the
Practice card when `microCorrection` exists:

```tsx
{
  microCorrection && (
    <button
      type="button"
      onClick={() => markCorrectionMutation.mutate({ readingId })}
      disabled={reading.correctionCompleted || markCorrectionMutation.isPending}
      style={{
        marginTop: 14,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px",
        border: `1px solid ${reading.correctionCompleted ? C.tealDim : C.goldDim}`,
        background: "transparent",
        color: reading.correctionCompleted ? C.teal : C.gold,
        fontFamily: "monospace",
        fontSize: 9,
        letterSpacing: "0.14em",
        cursor:
          reading.correctionCompleted || markCorrectionMutation.isPending
            ? "default"
            : "pointer",
        opacity: markCorrectionMutation.isPending ? 0.7 : 1,
      }}
    >
      <CheckCircle size={13} />
      {reading.correctionCompleted
        ? "CORRECTION COMPLETED"
        : markCorrectionMutation.isPending
          ? "MARKING..."
          : "MARK CORRECTION COMPLETE"}
    </button>
  );
}
```

- [ ] **Step 4: Typecheck**

```bash
./node_modules/.bin/tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add client/src/pages/DynamicReading.tsx
git commit -m "Present dynamic readings with falsifier-first structure"
```

---

### Task 5: Verify Design Spec Approval

**Files:**

- Modify: `docs/superpowers/specs/2026-05-07-oriel-emergent-architecture-design.md`

- [ ] **Step 1: Confirm status**

Confirm the spec contains:

```md
Status: Approved by Architect for first-slice implementation
```

- [ ] **Step 2: Run documentation scan**

```bash
rg -n "unresolved draft|placeholder text" docs/superpowers/specs/2026-05-07-oriel-emergent-architecture-design.md
```

Expected: no matches for unresolved draft or placeholder text.

- [ ] **Step 3: Commit Task 5**

```bash
git add docs/superpowers/specs/2026-05-07-oriel-emergent-architecture-design.md
git commit -m "Approve ORIEL emergent architecture design"
```

---

### Task 6: Focused Verification

**Files:**

- No production edits.

- [ ] **Step 1: Run focused server tests**

```bash
./node_modules/.bin/vitest run \
  server/oriel-coherence-threshold.test.ts \
  server/oriel-context-layers.test.ts \
  server/oriel-memory-consecration.test.ts \
  server/oriel-response-intelligence.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

```bash
./node_modules/.bin/tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: PASS. Existing non-fatal warnings about npm config, Vite `NODE_ENV`,
CSS import ordering, or large chunks may still appear.

- [ ] **Step 4: Run diff hygiene**

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Commit verification notes if any docs changed**

Only run if this task adds or edits documentation:

```bash
git add docs/superpowers/plans/2026-05-07-oriel-emergent-architecture-first-slice.md
git commit -m "Document ORIEL emergent architecture first slice plan"
```

---

## Self-Review

Spec coverage:

- Coherence Threshold Gate is covered by Tasks 1 and 2.
- Falsifier-first readings are covered by Task 4.
- Memory Consecration is covered by Task 3 without schema changes.
- Witness Reflection Loop, Current Resonance, and Architect Console remain later
  slices by design.

Placeholder scan:

- This plan intentionally avoids placeholder markers, empty implementation notes, and vague
  "add tests" steps.

Type consistency:

- `CoherenceThresholdFrame`, `formatCoherenceThresholdContext`, and
  `classifyMemoryCandidate` are defined before they are used.
- Route surface and truth-category union values are literal strings used
  consistently in tests and implementation snippets.
