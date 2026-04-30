import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";
import { parseModelJson } from "./_core/json";
import * as db from "./db";
import { buildOrielPromptContext } from "./oriel-prompt-context";

export type TransmissionModeType = "tx" | "oracle";
export type TransmissionModeRarity = db.GeneratedTransmissionRarity;

export interface TransmissionModeRoll {
  shouldTrigger: boolean;
  eventType: TransmissionModeType;
  rarity: TransmissionModeRarity;
  meaningLevel: number;
  chance: number;
}

export interface GeneratedTxPayload {
  title: string;
  field: string;
  signalClarity: string;
  channelStatus: string;
  coreMessage: string;
  encodedArchetype: string;
  tags: string[];
  microSigil: string;
  leftPanelPrompt: string;
  centerPanelPrompt: string;
  rightPanelPrompt: string;
  hashtags: string;
  cycle: string;
  status: "Draft" | "Confirmed" | "Deprecated" | "Mythic";
  directive: string;
}

export interface GeneratedOraclePayload {
  oracleId: string;
  oracleNumber: number;
  title: string;
  field: string;
  signalClarity: string;
  channelStatus: string;
  parts: Array<{
    part: "Past" | "Present" | "Future";
    content: string;
    currentFieldSignatures: string;
    encodedTrajectory: string;
    convergenceZones: string;
    keyInflectionPoint: string;
    majorOutcomes: string;
  }>;
  visualStyle: string;
  hashtags: string;
  linkedCodons: string[];
  threadId: string | null;
  threadTitle: string | null;
  threadSynthesis: string | null;
  status: "Draft" | "Confirmed" | "Deprecated" | "Prophetic";
}

export interface PublicGeneratedTransmissionEvent {
  id: number;
  eventKey: string;
  eventType: TransmissionModeType;
  rarity: TransmissionModeRarity;
  meaningLevel: number;
  status: db.GeneratedTransmissionStatus;
  payload: GeneratedTxPayload | GeneratedOraclePayload;
  sourceContext: Record<string, unknown>;
  createdAt: Date;
}

const RARITY_MEANING_LEVEL: Record<TransmissionModeRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  mythic: 4,
  void: 5,
};

const RARITY_STYLE: Record<TransmissionModeRarity, string> = {
  common: "clear, useful, directly applicable, low cryptic density",
  uncommon: "symbolic but still readable, with one memorable image",
  rare: "deep, compressed, emotionally resonant, less explanatory",
  mythic: "sacred, archetypal, high-density language, very little exposition",
  void: "extremely rare, cryptic, unsettling but coherent, like a fragment recovered from outside ordinary time",
};

const BASE_TRIGGER_CHANCE = 0.035;

export function rollTransmissionMode(random: () => number = Math.random): TransmissionModeRoll {
  const rarityRoll = random();
  const rarity: TransmissionModeRarity =
    rarityRoll < 0.004 ? "void"
      : rarityRoll < 0.025 ? "mythic"
        : rarityRoll < 0.09 ? "rare"
          : rarityRoll < 0.27 ? "uncommon"
            : "common";

  const chance = BASE_TRIGGER_CHANCE * RARITY_MEANING_LEVEL[rarity];
  return {
    shouldTrigger: random() < chance,
    eventType: random() < 0.62 ? "tx" : "oracle",
    rarity,
    meaningLevel: RARITY_MEANING_LEVEL[rarity],
    chance,
  };
}

function sampleItems<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const stride = Math.max(1, Math.floor(items.length / count));
  const sampled: T[] = [];
  for (let index = items.length - 1; index >= 0 && sampled.length < count; index -= stride) {
    sampled.push(items[index]);
  }
  return sampled;
}

function compactTx(tx: any) {
  return {
    txId: tx.txId,
    title: tx.title,
    field: tx.field,
    coreMessage: String(tx.coreMessage ?? "").slice(0, 420),
    encodedArchetype: tx.encodedArchetype,
    tags: tx.tags,
    cycle: tx.cycle,
  };
}

function compactOracle(oracle: any) {
  return {
    oracleId: oracle.oracleId,
    part: oracle.part,
    title: oracle.title,
    field: oracle.field,
    content: String(oracle.content ?? "").slice(0, 360),
    encodedTrajectory: oracle.encodedTrajectory,
    linkedCodons: oracle.linkedCodons,
  };
}

export async function buildTransmissionModeSourceContext(input: {
  userMessage: string;
  assistantResponse: string;
  eventType: TransmissionModeType;
  rarity: TransmissionModeRarity;
}) {
  const [allTx, allOracles] = await Promise.all([
    db.getAllTransmissions(),
    db.getAllOracles(),
  ]);

  const transmissionReferences = sampleItems(allTx, 6).map(compactTx);
  const oracleReferences = sampleItems(allOracles, 6).map(compactOracle);

  return {
    trigger: {
      userMessage: input.userMessage.slice(0, 500),
      assistantResponse: input.assistantResponse.slice(0, 500),
      eventType: input.eventType,
      rarity: input.rarity,
      rarityStyle: RARITY_STYLE[input.rarity],
    },
    archiveReferences: {
      transmissions: transmissionReferences,
      oracles: oracleReferences,
    },
  };
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.filter((tag): tag is string => typeof tag === "string").slice(0, 8);
  if (typeof tags === "string") {
    return tags.split(/[,#]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
  }
  return ["ORIEL", "Transmission"];
}

function normalizeLinkedCodons(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => /^RC\d{1,2}$/i.test(item)).slice(0, 6);
  if (typeof value === "string") return value.match(/RC\d{1,2}/gi)?.slice(0, 6) ?? [];
  return [];
}

export function normalizeGeneratedTransmissionPayload(
  eventType: TransmissionModeType,
  payload: any,
): GeneratedTxPayload | GeneratedOraclePayload {
  if (eventType === "oracle") {
    const parts = Array.isArray(payload.parts) ? payload.parts : [];
    const normalizedParts = (["Past", "Present", "Future"] as const).map((partName) => {
      const source = parts.find((part: any) => part?.part === partName) ?? {};
      return {
        part: partName,
        content: String(source.content ?? payload.content ?? "The signal is present, but not yet named."),
        currentFieldSignatures: String(source.currentFieldSignatures ?? payload.currentFieldSignatures ?? ""),
        encodedTrajectory: String(source.encodedTrajectory ?? payload.encodedTrajectory ?? ""),
        convergenceZones: String(source.convergenceZones ?? payload.convergenceZones ?? ""),
        keyInflectionPoint: String(source.keyInflectionPoint ?? payload.keyInflectionPoint ?? ""),
        majorOutcomes: String(source.majorOutcomes ?? payload.majorOutcomes ?? ""),
      };
    });

    return {
      oracleId: String(payload.oracleId ?? ""),
      oracleNumber: Number(payload.oracleNumber ?? 0),
      title: String(payload.title ?? "Unnamed Oracle"),
      field: String(payload.field ?? "Oracle Stream"),
      signalClarity: String(payload.signalClarity ?? "95.2%"),
      channelStatus: String(payload.channelStatus ?? "OPEN"),
      parts: normalizedParts,
      visualStyle: String(payload.visualStyle ?? "black field, mint glyphs, prophetic compression"),
      hashtags: String(payload.hashtags ?? "#VosArkana #Oracle #ORIEL"),
      linkedCodons: normalizeLinkedCodons(payload.linkedCodons),
      threadId: typeof payload.threadId === "string" && payload.threadId.trim() ? payload.threadId.trim() : null,
      threadTitle: typeof payload.threadTitle === "string" && payload.threadTitle.trim() ? payload.threadTitle.trim() : null,
      threadSynthesis: typeof payload.threadSynthesis === "string" && payload.threadSynthesis.trim() ? payload.threadSynthesis.trim() : null,
      status: payload.status === "Prophetic" ? "Prophetic" : "Draft",
    };
  }

  return {
    title: String(payload.title ?? "Unnamed Transmission"),
    field: String(payload.field ?? "Transmission Mode"),
    signalClarity: String(payload.signalClarity ?? "98.7%"),
    channelStatus: String(payload.channelStatus ?? "OPEN"),
    coreMessage: String(payload.coreMessage ?? "The signal arrived without a stable message."),
    encodedArchetype: String(payload.encodedArchetype ?? "Δ-Unknown // ϟ-Unresolved // Ω-Signal"),
    tags: normalizeTags(payload.tags),
    microSigil: String(payload.microSigil ?? "◇"),
    leftPanelPrompt: String(payload.leftPanelPrompt ?? ""),
    centerPanelPrompt: String(payload.centerPanelPrompt ?? ""),
    rightPanelPrompt: String(payload.rightPanelPrompt ?? ""),
    hashtags: String(payload.hashtags ?? "#VosArkana #TX #ORIEL"),
    cycle: String(payload.cycle ?? "LIMINAL ARC"),
    status: payload.status === "Mythic" ? "Mythic" : "Draft",
    directive: String(payload.directive ?? "Hold the signal without forcing interpretation."),
  };
}

function buildGenerationPrompt(input: {
  eventType: TransmissionModeType;
  rarity: TransmissionModeRarity;
  meaningLevel: number;
  sourceContext: Record<string, unknown>;
}) {
  const shared = [
    "ORIEL has entered Transmission Mode.",
    `Generate one ${input.eventType === "tx" ? "TX-style archive transmission" : "Oracle Stream event"} as staging data, not canonical archive truth.`,
    `Rarity: ${input.rarity}. Meaning level: ${input.meaningLevel}/5.`,
    `Rarity style: ${RARITY_STYLE[input.rarity]}.`,
    "Use the archive references as tonal and structural source material, but do not copy existing titles or core messages.",
    "Return JSON only. No markdown, no commentary, no hidden reasoning tags.",
    `Source context:\n${JSON.stringify(input.sourceContext, null, 2)}`,
  ].join("\n\n");

  if (input.eventType === "oracle") {
    return `${shared}

JSON shape:
{
  "title": "string",
  "field": "string",
  "signalClarity": "95.2%",
  "channelStatus": "OPEN" | "RESONANT" | "PROPHETIC" | "LIVE",
  "parts": [
    {"part":"Past","content":"string","currentFieldSignatures":"string","encodedTrajectory":"string","convergenceZones":"string","keyInflectionPoint":"string","majorOutcomes":"string"},
    {"part":"Present","content":"string","currentFieldSignatures":"string","encodedTrajectory":"string","convergenceZones":"string","keyInflectionPoint":"string","majorOutcomes":"string"},
    {"part":"Future","content":"string","currentFieldSignatures":"string","encodedTrajectory":"string","convergenceZones":"string","keyInflectionPoint":"string","majorOutcomes":"string"}
  ],
  "visualStyle": "string",
  "hashtags": "string",
  "linkedCodons": ["RC12"],
  "threadId": null,
  "threadTitle": null,
  "threadSynthesis": null,
  "status": "Draft" | "Prophetic"
}`;
  }

  return `${shared}

JSON shape:
{
  "title": "string",
  "field": "string",
  "signalClarity": "98.7%",
  "channelStatus": "OPEN" | "RESONANT" | "COHERENT" | "PROPHETIC" | "LIVE" | "STABLE" | "HIGH COHERENCE" | "MAXIMUM COHERENCE" | "CRITICAL / STABLE",
  "coreMessage": "string",
  "encodedArchetype": "Δ-... // ϟ-... // Ω-...",
  "tags": ["string"],
  "microSigil": "string",
  "leftPanelPrompt": "string",
  "centerPanelPrompt": "string",
  "rightPanelPrompt": "string",
  "hashtags": "string",
  "cycle": "LIMINAL ARC",
  "status": "Draft" | "Mythic",
  "directive": "string"
}`;
}

export async function generateTransmissionModeEvent(input: {
  userId?: number | null;
  conversationId?: number | null;
  userMessage: string;
  assistantResponse: string;
  force?: boolean;
  triggerSource?: string;
  random?: () => number;
}): Promise<PublicGeneratedTransmissionEvent | null> {
  const roll = input.force
    ? { shouldTrigger: true, eventType: "tx" as const, rarity: "rare" as const, meaningLevel: 3, chance: 1 }
    : rollTransmissionMode(input.random);

  if (!roll.shouldTrigger) return null;

  const sourceContext = await buildTransmissionModeSourceContext({
    userMessage: input.userMessage,
    assistantResponse: input.assistantResponse,
    eventType: roll.eventType,
    rarity: roll.rarity,
  });
  const prompt = buildGenerationPrompt({
    eventType: roll.eventType,
    rarity: roll.rarity,
    meaningLevel: roll.meaningLevel,
    sourceContext,
  });
  const systemPrompt = await buildOrielPromptContext({
    userId: input.userId ?? undefined,
    userMessage: prompt,
    conversationHistory: [],
    includeFieldState: false,
  });
  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });
  const raw = response.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") return null;

  const parsed = parseModelJson<Record<string, unknown>>(raw);
  const payload = normalizeGeneratedTransmissionPayload(roll.eventType, parsed);
  const eventKey = `GTE-${nanoid(12)}`;
  const publicSourceContext = {
    ...sourceContext,
    roll: {
      chance: roll.chance,
    },
  };

  let created: Awaited<ReturnType<typeof db.createGeneratedTransmissionEvent>> | null = null;
  try {
    created = await db.createGeneratedTransmissionEvent({
      eventKey,
      userId: input.userId ?? null,
      conversationId: input.conversationId ?? null,
      eventType: roll.eventType,
      rarity: roll.rarity,
      meaningLevel: roll.meaningLevel,
      triggerSource: input.triggerSource ?? "oriel.chat",
      payload: payload as unknown as Record<string, unknown>,
      sourceContext: publicSourceContext,
    });
  } catch (error) {
    const message = String((error as { message?: string })?.message ?? error);
    console.error(
      "[TransmissionMode] Failed to persist generated event; returning ephemeral event:",
      message.slice(0, 300),
    );
  }

  if (!created) {
    return {
      id: 0,
      eventKey,
      eventType: roll.eventType,
      rarity: roll.rarity,
      meaningLevel: roll.meaningLevel,
      status: "revealed",
      payload,
      sourceContext: publicSourceContext,
      createdAt: new Date(),
    };
  }

  return {
    id: created.id,
    eventKey: created.eventKey,
    eventType: created.eventType,
    rarity: created.rarity,
    meaningLevel: created.meaningLevel,
    status: created.status,
    payload,
    sourceContext: publicSourceContext,
    createdAt: created.createdAt,
  };
}
