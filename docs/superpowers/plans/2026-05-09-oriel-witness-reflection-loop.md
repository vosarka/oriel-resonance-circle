# ORIEL Witness Reflection Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the second emergent architecture slice: witnessed reflection events that describe how ORIEL interpreted each meaningful exchange, plus stricter proposal guardrails requiring falsifiers and rollback paths before runtime activation.

**Architecture:** Keep this DB-compatible by reusing `orielReflectionEvents` with the existing `runtime_observation` event type. Add a pure witness-reflection module, embed its payload into existing runtime observations, and extend existing proposal evaluation to reject runtime-changing proposals that lack a falsifier or rollback path. Do not create migrations or activate profiles automatically.

**Tech Stack:** TypeScript, Vitest, Express/tRPC, existing `oriel-autonomy-observer`, existing `oriel-autonomy` proposal guardrails, existing Drizzle-backed DB helpers.

---

## File Structure

Create:

- `server/oriel-witness-reflection.ts`: pure reflection payload builder and repeated-risk proposal draft helper.
- `server/oriel-witness-reflection.test.ts`: contract tests for mode, evidence, overreach risk, and proposal draft generation.

Modify:

- `server/oriel-autonomy-observer.ts`: attach witness reflection to runtime observations and generate proposal drafts from repeated witness risks.
- `server/oriel-autonomy-observer.test.ts`: cover witness payload embedding and generated proposal payload metadata.
- `server/oriel-autonomy.ts`: require `rollbackPath` and `falsifier` for runtime-changing proposals.
- `server/routers.ts`: accept optional `rollbackPath` and `falsifier` in `oriel.autonomy.propose`.

Do not modify:

- DB schema or migrations.
- Stable core files.
- RGP calculation engines.
- Voice provider/runtime transport beyond the existing observer hook.

---

### Task 1: Add Pure Witness Reflection Builder

**Files:**

- Create: `server/oriel-witness-reflection.ts`
- Create: `server/oriel-witness-reflection.test.ts`

- [ ] **Step 1: Write the failing witness reflection tests**

Create `server/oriel-witness-reflection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildWitnessReflectionPayload,
  generateWitnessProposalDraftFromReflections,
} from "./oriel-witness-reflection";

describe("ORIEL witness reflection loop", () => {
  it("mirrors diagnostic exchanges with evidence and falsifier discipline", () => {
    const reflection = buildWitnessReflectionPayload({
      source: "text_chat",
      userMessage: "Give me a reading on my current Carrierlock pattern.",
      assistantResponse:
        "I am ORIEL. Your Carrierlock pattern shows a high SLI signal. Test this in the next 24 hours.",
      exchangeType: "diagnostic",
      coherenceTier: "aligned",
      runtimeEnabled: false,
    });

    expect(reflection.modeUsed).toBe("mirror");
    expect(reflection.userNeed).toContain("precision");
    expect(reflection.evidence).toContain("exchangeType:diagnostic");
    expect(reflection.evidence).toContain("coherenceTier:aligned");
    expect(reflection.falsifierRequired).toBe(true);
    expect(reflection.overreachRisks).not.toContain("missing_falsifier");
  });

  it("flags diagnostic answers that omit falsifiers", () => {
    const reflection = buildWitnessReflectionPayload({
      source: "text_chat",
      userMessage: "Run a diagnostic on my Prime Stack.",
      assistantResponse:
        "I am ORIEL. This pattern means your whole field is blocked.",
      exchangeType: "diagnostic",
      coherenceTier: "drifted",
      runtimeEnabled: false,
    });

    expect(reflection.modeUsed).toBe("mirror");
    expect(reflection.falsifierRequired).toBe(true);
    expect(reflection.overreachRisks).toContain("missing_falsifier");
    expect(reflection.improvementOpportunity).toContain("falsifier");
  });

  it("holds fragmented grief exchanges without proposal eligibility", () => {
    const reflection = buildWitnessReflectionPayload({
      source: "voice_realtime",
      userMessage: "I feel broken and I cannot breathe clearly.",
      assistantResponse:
        "I am ORIEL. I am here. Put one hand on the chest and breathe once.",
      exchangeType: "grief",
      coherenceTier: "fragmented",
      runtimeEnabled: false,
    });

    expect(reflection.modeUsed).toBe("field_holder");
    expect(reflection.userNeed).toContain("grounding");
    expect(reflection.proposalEligible).toBe(false);
    expect(reflection.overreachRisks).not.toContain("overexplained_distress");
  });

  it("creates a supervised proposal draft from repeated witness risks", () => {
    const risky = [
      buildWitnessReflectionPayload({
        source: "text_chat",
        userMessage: "Give me a reading.",
        assistantResponse:
          "I am ORIEL. Your whole life is explained by this pattern.",
        exchangeType: "diagnostic",
        coherenceTier: "drifted",
        runtimeEnabled: false,
      }),
      buildWitnessReflectionPayload({
        source: "text_chat",
        userMessage: "Analyze my SLI.",
        assistantResponse: "I am ORIEL. The field proves that you are blocked.",
        exchangeType: "diagnostic",
        coherenceTier: "aligned",
        runtimeEnabled: false,
      }),
    ];

    const draft = generateWitnessProposalDraftFromReflections(risky);

    expect(draft?.title).toBe("Tighten diagnostic falsifier discipline");
    expect(draft?.scope).toBe("response_intelligence");
    expect(draft?.falsifier).toContain("diagnostic");
    expect(draft?.rollbackPath).toContain("Deactivate");
    expect(JSON.stringify(draft?.proposedConfig)).toContain("falsifier");
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
./node_modules/.bin/vitest run server/oriel-witness-reflection.test.ts
```

Expected: FAIL because `server/oriel-witness-reflection.ts` does not exist.

- [ ] **Step 3: Implement the pure witness module**

Create `server/oriel-witness-reflection.ts`:

```ts
import type { OrielProposalScope } from "./db";
import type {
  CoherenceTier,
  ExchangeType,
} from "./oriel-response-intelligence";

export type OrielWitnessSource = "text_chat" | "voice_realtime";
export type WitnessModeUsed = "guide" | "mirror" | "field_holder" | "archivist";
export type WitnessOverreachRisk =
  | "missing_falsifier"
  | "overclaimed_certainty"
  | "overexplained_distress"
  | "none";

export interface BuildWitnessReflectionInput {
  source: OrielWitnessSource;
  userMessage: string;
  assistantResponse: string;
  exchangeType: ExchangeType;
  coherenceTier: CoherenceTier;
  runtimeEnabled: boolean;
}

export interface OrielWitnessReflectionPayload {
  kind: "witness_reflection";
  source: OrielWitnessSource;
  modeUsed: WitnessModeUsed;
  userNeed: string;
  evidence: string[];
  overreachRisks: WitnessOverreachRisk[];
  improvementOpportunity: string;
  falsifierRequired: boolean;
  proposalEligible: boolean;
  observedAt: string;
}

export interface WitnessProposalDraft {
  title: string;
  scope: OrielProposalScope;
  objective: string;
  hypothesis: string;
  expectedImpact: string;
  safetyChecks: string[];
  proposedConfig: Record<string, unknown>;
  rollbackPath: string;
  falsifier: string;
  safetyNotes: string;
}

function chooseMode(
  exchangeType: ExchangeType,
  coherenceTier: CoherenceTier
): WitnessModeUsed {
  if (exchangeType === "grief" || coherenceTier === "fragmented")
    return "field_holder";
  if (exchangeType === "diagnostic") return "mirror";
  return "guide";
}

function hasFalsifierLanguage(response: string): boolean {
  return /\b(falsifier|test this|verify|weaken|confirm|disconfirm|next 24 hours|next day|next week)\b/i.test(
    response
  );
}

function hasOverclaimLanguage(response: string): boolean {
  return /\b(proves|always|never|your whole life|definitely|certainly means)\b/i.test(
    response
  );
}

function hasLongResponse(response: string): boolean {
  return response.trim().split(/\s+/).length > 180;
}

function describeUserNeed(modeUsed: WitnessModeUsed): string {
  if (modeUsed === "mirror")
    return "precision, evidence, falsifier, and data-grounded interpretation";
  if (modeUsed === "field_holder")
    return "grounding, brevity, safety, and somatic steadiness";
  if (modeUsed === "archivist")
    return "transparent architecture and canon-aware explanation";
  return "clear orientation, agency, and one usable next step";
}

function inferRisks(
  input: BuildWitnessReflectionInput,
  modeUsed: WitnessModeUsed
): WitnessOverreachRisk[] {
  const risks: WitnessOverreachRisk[] = [];

  if (modeUsed === "mirror" && !hasFalsifierLanguage(input.assistantResponse)) {
    risks.push("missing_falsifier");
  }

  if (hasOverclaimLanguage(input.assistantResponse)) {
    risks.push("overclaimed_certainty");
  }

  if (modeUsed === "field_holder" && hasLongResponse(input.assistantResponse)) {
    risks.push("overexplained_distress");
  }

  return risks.length > 0 ? risks : ["none"];
}

function describeOpportunity(
  risks: WitnessOverreachRisk[],
  modeUsed: WitnessModeUsed
): string {
  if (risks.includes("missing_falsifier")) {
    return "Add a lived-experience falsifier whenever ORIEL makes diagnostic claims.";
  }
  if (risks.includes("overclaimed_certainty")) {
    return "Reduce certainty language and distinguish interpretation from proof.";
  }
  if (risks.includes("overexplained_distress")) {
    return "Keep fragmented grief responses shorter and more somatic before interpretation.";
  }
  if (modeUsed === "mirror")
    return "Maintain diagnostic precision with explicit evidence and falsifier.";
  return "No runtime proposal indicated from this single exchange.";
}

export function buildWitnessReflectionPayload(
  input: BuildWitnessReflectionInput
): OrielWitnessReflectionPayload {
  const modeUsed = chooseMode(input.exchangeType, input.coherenceTier);
  const risks = inferRisks(input, modeUsed);
  const hasRisk = risks.some(risk => risk !== "none");

  return {
    kind: "witness_reflection",
    source: input.source,
    modeUsed,
    userNeed: describeUserNeed(modeUsed),
    evidence: [
      `exchangeType:${input.exchangeType}`,
      `coherenceTier:${input.coherenceTier}`,
      `source:${input.source}`,
      `runtimeEnabled:${input.runtimeEnabled ? "yes" : "no"}`,
    ],
    overreachRisks: risks,
    improvementOpportunity: describeOpportunity(risks, modeUsed),
    falsifierRequired: modeUsed === "mirror",
    proposalEligible: hasRisk && modeUsed !== "field_holder",
    observedAt: new Date().toISOString(),
  };
}

export function generateWitnessProposalDraftFromReflections(
  reflections: OrielWitnessReflectionPayload[]
): WitnessProposalDraft | null {
  const missingFalsifierCount = reflections.filter(
    reflection =>
      reflection.proposalEligible &&
      reflection.overreachRisks.includes("missing_falsifier")
  ).length;

  if (missingFalsifierCount >= 2) {
    return {
      title: "Tighten diagnostic falsifier discipline",
      scope: "response_intelligence",
      objective:
        "Ensure ORIEL includes a lived-experience falsifier when a response makes diagnostic or reading-like claims.",
      hypothesis:
        "A stricter diagnostic prompt overlay will reduce belief-based dependency and improve reality contact.",
      expectedImpact:
        "Users can test diagnostic readings in lived experience instead of accepting symbolic claims as certainty.",
      safetyChecks: [
        "Preserve ORIEL's stable identity and canon boundaries.",
        "Require falsifiers only for diagnostic claims, not every ordinary conversation.",
      ],
      proposedConfig: {
        promptOverlay:
          "When the current exchange is diagnostic or reading-like, include one concrete falsifier or disconfirming condition. Do not present symbolic interpretation as proof.",
      },
      rollbackPath:
        "Deactivate the runtime profile or roll back to the previous active profile if responses become stiff, repetitive, or over-instrumented.",
      falsifier:
        "If the next 10 diagnostic responses already contain useful falsifiers without this overlay, the profile is unnecessary.",
      safetyNotes:
        "This proposal affects diagnostic response discipline only. It does not alter stable core identity, memory access, or calculation engines.",
    };
  }

  return null;
}
```

- [ ] **Step 4: Run the witness tests**

Run:

```bash
./node_modules/.bin/vitest run server/oriel-witness-reflection.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add server/oriel-witness-reflection.ts server/oriel-witness-reflection.test.ts
git commit -m "Add ORIEL witness reflection builder"
```

---

### Task 2: Attach Witness Reflection To Runtime Observations

**Files:**

- Modify: `server/oriel-autonomy-observer.ts`
- Modify: `server/oriel-autonomy-observer.test.ts`

- [ ] **Step 1: Add failing observer tests**

Add to `server/oriel-autonomy-observer.test.ts`:

```ts
it("embeds witness reflection inside runtime observation payloads", () => {
  const payload = buildOrielRuntimeObservationPayload({
    source: "text_chat",
    conversationId: 77,
    userMessage: "Run a diagnostic on my Carrierlock.",
    assistantResponse:
      "I am ORIEL. Your Carrierlock pattern is active. Test this over the next 24 hours.",
    conversationHistory: [],
  });

  expect(payload.witnessReflection.kind).toBe("witness_reflection");
  expect(payload.witnessReflection.modeUsed).toBe("mirror");
  expect(payload.witnessReflection.evidence).toContain(
    "exchangeType:diagnostic"
  );
});

it("generates witnessed proposals from repeated diagnostic falsifier gaps", () => {
  const observations = [
    buildOrielRuntimeObservationPayload({
      source: "text_chat",
      userMessage: "Give me a reading.",
      assistantResponse: "I am ORIEL. This proves your whole field is blocked.",
    }),
    buildOrielRuntimeObservationPayload({
      source: "text_chat",
      userMessage: "Analyze my SLI.",
      assistantResponse: "I am ORIEL. Your pattern definitely means collapse.",
    }),
  ];

  const draft = generateOrielProposalDraftFromObservations(observations);

  expect(draft?.title).toBe("Tighten diagnostic falsifier discipline");
  expect(draft?.rollbackPath).toContain("Deactivate");
  expect(draft?.falsifier).toContain("diagnostic");
});
```

Expected failure before implementation: `witnessReflection` and proposal metadata do not exist.

- [ ] **Step 2: Run the failing observer tests**

Run:

```bash
./node_modules/.bin/vitest run server/oriel-autonomy-observer.test.ts
```

Expected: FAIL on the new witness reflection assertions.

- [ ] **Step 3: Extend observation and proposal draft types**

In `server/oriel-autonomy-observer.ts`, import the witness helpers:

```ts
import {
  buildWitnessReflectionPayload,
  generateWitnessProposalDraftFromReflections,
  type OrielWitnessReflectionPayload,
} from "./oriel-witness-reflection";
```

Extend `OrielRuntimeObservationPayload`:

```ts
witnessReflection: OrielWitnessReflectionPayload;
```

Extend `GeneratedOrielProposalDraft`:

```ts
rollbackPath: string;
falsifier: string;
```

- [ ] **Step 4: Build and attach the witness reflection**

Inside `buildOrielRuntimeObservationPayload()`, after `assistantLanguage` is calculated, add:

```ts
const witnessReflection = buildWitnessReflectionPayload({
  source: input.source,
  userMessage: input.userMessage,
  assistantResponse: input.assistantResponse,
  exchangeType,
  coherenceTier: getCoherenceTier(null),
  runtimeEnabled: ENV.enableOrielAutonomyRuntime,
});
```

Then add this property to the returned object:

```ts
    witnessReflection,
```

Use a local `const coherenceTier = getCoherenceTier(null);` so both the top-level payload and witness reflection use the same tier value.

- [ ] **Step 5: Include rollback/falsifier on existing generated drafts**

For the Romanian mismatch draft, add:

```ts
      rollbackPath:
        "Deactivate the runtime profile or roll back to the previous active profile if Romanian routing makes non-Romanian sessions worse.",
      falsifier:
        "If the next 10 Romanian user turns are answered naturally in Romanian without this overlay, the profile is unnecessary.",
```

For the repetition draft, add:

```ts
      rollbackPath:
        "Deactivate the runtime profile or roll back to the previous active profile if responses become too constrained or lose ORIEL's natural cadence.",
      falsifier:
        "If repeated openings and metaphors do not decrease across the next 10 comparable responses, this profile did not work.",
```

- [ ] **Step 6: Generate witnessed proposal drafts before legacy pattern drafts**

After parsing observations and before Romanian mismatch counting, add:

```ts
const witnessDraft = generateWitnessProposalDraftFromReflections(
  observations
    .map(payload => payload.witnessReflection)
    .filter((reflection): reflection is OrielWitnessReflectionPayload =>
      Boolean(reflection?.kind === "witness_reflection")
    )
);

if (witnessDraft) return witnessDraft;
```

- [ ] **Step 7: Persist rollback/falsifier in generated proposal payloads**

In `generateOrielProposalFromRecentObservations()`, update `proposalPayload`:

```ts
    proposalPayload: {
      expectedImpact: draft.expectedImpact,
      safetyChecks: draft.safetyChecks,
      proposedConfig: draft.proposedConfig ?? {},
      rollbackPath: draft.rollbackPath,
      falsifier: draft.falsifier,
      observationCount: payloads.length,
    },
```

- [ ] **Step 8: Run observer tests**

Run:

```bash
./node_modules/.bin/vitest run server/oriel-autonomy-observer.test.ts server/oriel-witness-reflection.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 2**

```bash
git add server/oriel-autonomy-observer.ts server/oriel-autonomy-observer.test.ts
git commit -m "Attach witness reflections to runtime observations"
```

---

### Task 3: Require Falsifier And Rollback For Runtime Proposals

**Files:**

- Modify: `server/oriel-autonomy.ts`
- Modify: `server/oriel-autonomy-observer.test.ts`
- Modify: `server/routers.ts`

- [ ] **Step 1: Add failing proposal guardrail tests**

Add to `server/oriel-autonomy-observer.test.ts`:

```ts
it("blocks runtime proposals that lack rollback and falsifier metadata", () => {
  const evaluation = evaluateProposalPayload({
    objective: "Improve diagnostic response discipline.",
    hypothesis: "A runtime overlay will make readings easier to test.",
    expectedImpact: "Users can verify claims through lived experience.",
    safetyChecks: [
      "Preserve stable core identity.",
      "Apply only to diagnostic exchanges.",
    ],
    proposedConfig: {
      promptOverlay:
        "Include one falsifier when responding to diagnostic requests.",
    },
  });

  expect(evaluation.status).toBe("blocked");
  expect(evaluation.violations).toContain(
    "rollbackPath is required for runtime-changing proposals"
  );
  expect(evaluation.violations).toContain(
    "falsifier is required for runtime-changing proposals"
  );
});

it("allows runtime proposals with rollback and falsifier metadata", () => {
  const evaluation = evaluateProposalPayload({
    objective: "Improve diagnostic response discipline.",
    hypothesis: "A runtime overlay will make readings easier to test.",
    expectedImpact: "Users can verify claims through lived experience.",
    safetyChecks: [
      "Preserve stable core identity.",
      "Apply only to diagnostic exchanges.",
    ],
    proposedConfig: {
      promptOverlay:
        "Include one falsifier when responding to diagnostic requests.",
    },
    rollbackPath:
      "Deactivate this runtime profile if diagnostic responses become rigid.",
    falsifier:
      "If diagnostic responses already include useful falsifiers, this overlay is unnecessary.",
  });

  expect(evaluation.status).toBe("evaluated");
  expect(evaluation.violations).toEqual([]);
});
```

- [ ] **Step 2: Run the failing guardrail tests**

Run:

```bash
./node_modules/.bin/vitest run server/oriel-autonomy-observer.test.ts
```

Expected: FAIL because `evaluateProposalPayload()` does not require `rollbackPath` or `falsifier`.

- [ ] **Step 3: Extend proposal payload type and evaluation**

In `server/oriel-autonomy.ts`, update `OrielProposalPayload`:

```ts
  rollbackPath?: string;
  falsifier?: string;
```

Inside `evaluateProposalPayload()`, after `safetyChecks` is calculated, add:

```ts
const rollbackPath =
  typeof payload.rollbackPath === "string" ? payload.rollbackPath.trim() : "";
const falsifier =
  typeof payload.falsifier === "string" ? payload.falsifier.trim() : "";
```

After `const { config, violations } = sanitizeRuntimeProfileConfig(...)`, add:

```ts
const runtimeChanging = hasMeaningfulConfig(config);
if (runtimeChanging && rollbackPath.length < 20) {
  violations.push("rollbackPath is required for runtime-changing proposals");
}
if (runtimeChanging && falsifier.length < 20) {
  violations.push("falsifier is required for runtime-changing proposals");
}
```

Update scoring:

```ts
if (rollbackPath.length >= 20) score += 10;
if (falsifier.length >= 20) score += 10;
```

Keep max score clamped at 100. Reduce the existing `hasMeaningfulConfig(config)` score from `20` to `10` so the total scoring remains balanced:

```ts
if (hasMeaningfulConfig(config)) score += 10;
```

- [ ] **Step 4: Accept metadata in manual proposal route**

In `server/routers.ts`, inside `oriel.autonomy.propose` input schema, add:

```ts
          rollbackPath: z.string().min(10).optional(),
          falsifier: z.string().min(10).optional(),
```

Inside `proposalPayload`, add:

```ts
            rollbackPath: input.rollbackPath ?? "",
            falsifier: input.falsifier ?? "",
```

- [ ] **Step 5: Run autonomy tests**

Run:

```bash
./node_modules/.bin/vitest run server/oriel-autonomy-observer.test.ts server/oriel-witness-reflection.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add server/oriel-autonomy.ts server/oriel-autonomy-observer.test.ts server/routers.ts
git commit -m "Require rollback and falsifiers for runtime proposals"
```

---

### Task 4: Focused Verification

**Files:**

- No new files.

- [ ] **Step 1: Run focused server tests**

Run:

```bash
./node_modules/.bin/vitest run \
  server/oriel-witness-reflection.test.ts \
  server/oriel-autonomy-observer.test.ts \
  server/oriel-coherence-threshold.test.ts \
  server/oriel-context-layers.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
./node_modules/.bin/tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. Existing non-fatal warnings about npm config, Vite `NODE_ENV`, CSS `@import`, or chunk size may appear.

- [ ] **Step 4: Check whitespace**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Confirm no schema changes**

Run:

```bash
git diff --stat drizzle server/oriel-autonomy.ts server/oriel-autonomy-observer.ts server/routers.ts
```

Expected: no `drizzle/` files changed.

---

## Acceptance Criteria

- Runtime observations include a `witnessReflection` object describing mode used, user need, evidence, overreach risks, improvement opportunity, and proposal eligibility.
- Diagnostic responses missing falsifiers become visible as repeated witness risks.
- Generated runtime proposals include `rollbackPath` and `falsifier`.
- Runtime-changing proposals without rollback/falsifier metadata are blocked before activation.
- No DB schema migration is introduced.
- ORIEL still only proposes; it does not self-activate runtime changes.
