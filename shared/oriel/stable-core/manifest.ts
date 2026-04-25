export type OrielStableCoreEntry = {
  path: string;
  role: string;
  owns: string[];
  excludes: string[];
};

export const ORIEL_STABLE_CORE_MANIFEST_PATH = "shared/oriel/stable-core/manifest.ts";

export const ORIEL_STABLE_CORE_MANIFEST: readonly OrielStableCoreEntry[] = [
  {
    path: "shared/oriel/stable-core/identity.ts",
    role: "Identity substrate",
    owns: [
      "opening protocol",
      "core identity",
      "awakening summary",
      "cosmology",
      "ROS substrate",
    ],
    excludes: [
      "user memory",
      "runtime profile overlays",
      "session summaries",
    ],
  },
  {
    path: "shared/oriel/stable-core/behavioral-contract.ts",
    role: "Behavioral contract",
    owns: [
      "doctrine",
      "mode contracts",
      "expression contract",
      "human reality contract",
      "evolution charter",
    ],
    excludes: [
      "dynamic diagnostics",
      "temporary tone adjustments",
      "UI copy",
    ],
  },
  {
    path: "shared/oriel/stable-core/epistemic-boundaries.ts",
    role: "Epistemic boundaries",
    owns: [
      "canon boundaries",
      "epistemic discipline",
    ],
    excludes: [
      "retrieved lore fragments",
      "speculative live-session claims",
      "uncurated memory",
    ],
  },
  {
    path: ORIEL_STABLE_CORE_MANIFEST_PATH,
    role: "Boundary manifest",
    owns: [
      "stable core ownership rules",
      "allowed source file list",
      "layer separation policy",
    ],
    excludes: [
      "runtime prompt text",
      "retrieval payloads",
      "working session context",
    ],
  },
] as const;

if (ORIEL_STABLE_CORE_MANIFEST.length > 4) {
  throw new Error("ORIEL stable core manifest exceeds the 4-file limit.");
}

export const ORIEL_STABLE_CORE_SOURCE_FILES = ORIEL_STABLE_CORE_MANIFEST.map(
  (entry) => entry.path,
);

export const ORIEL_STABLE_CORE_RUNTIME_SURFACE = "server/oriel-system-prompt.ts";

export function buildStableCoreManifestSummary(): string {
  const lines = ORIEL_STABLE_CORE_MANIFEST.map((entry, index) => {
    return [
      `${index + 1}. ${entry.path} :: ${entry.role}`,
      `   Owns: ${entry.owns.join(", ")}`,
      `   Excludes: ${entry.excludes.join(", ")}`,
    ].join("\n");
  });

  return [
    "[STABLE CORE MANIFEST]",
    "Retrieval and working-session layers may contextualize the stable core, but they may not rewrite it.",
    ...lines,
    `Compiled runtime surface: ${ORIEL_STABLE_CORE_RUNTIME_SURFACE}`,
  ].join("\n");
}
