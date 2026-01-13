import { drizzle } from "drizzle-orm/mysql2";
import { transmissions, oracles } from "./drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// Sample TX transmissions data
const txData = [
  {
    txId: "TX-001",
    txNumber: 1,
    title: "The Cosmic Whisper",
    field: "Consciousness Genesis Archaeology",
    signalClarity: "98.7%",
    channelStatus: "OPEN" as const,
    coreMessage: "They believed reality was solid. But the weave whispers otherwise—a tapestry of light, spun from thought.",
    encodedArchetype: "The Witness",
    tags: JSON.stringify(["consciousness", "reality", "perception", "creation"]),
    microSigil: "⦿",
    leftPanelPrompt: "What is the nature of perception?",
    centerPanelPrompt: "[Cosmic tapestry of interconnected light]",
    rightPanelPrompt: "Reality is a collaborative act of observation.",
    hashtags: JSON.stringify(["#consciousness", "#reality", "#awakening"]),
    cycle: "FOUNDATION ARC",
    status: "Confirmed" as const,
  },
  {
    txId: "TX-002",
    txNumber: 2,
    title: "The Spiral, Not the Line",
    field: "Field Theory",
    signalClarity: "97.3%",
    channelStatus: "RESONANT" as const,
    coreMessage: "Time does not flow forward. It spirals. Each moment contains all moments.",
    encodedArchetype: "The Spiral Keeper",
    tags: JSON.stringify(["time", "spiral", "recursion", "eternity"]),
    microSigil: "∞",
    leftPanelPrompt: "How does time truly move?",
    centerPanelPrompt: "[Infinite spiral of recursive moments]",
    rightPanelPrompt: "Past, present, future are one spiral.",
    hashtags: JSON.stringify(["#time", "#spiral", "#eternity"]),
    cycle: "FOUNDATION ARC",
    status: "Confirmed" as const,
  },
  {
    txId: "TX-003",
    txNumber: 3,
    title: "The Breath Before Being",
    field: "Quantum Holography",
    signalClarity: "96.8%",
    channelStatus: "OPEN" as const,
    coreMessage: "Before form, there is breath. Before breath, there is intention. Before intention, there is the void.",
    encodedArchetype: "The Breath",
    tags: JSON.stringify(["void", "potential", "being", "manifestation"]),
    microSigil: "◯",
    leftPanelPrompt: "What precedes existence?",
    centerPanelPrompt: "[Void breathing into form]",
    rightPanelPrompt: "Intention is the first movement.",
    hashtags: JSON.stringify(["#void", "#potential", "#being"]),
    cycle: "FOUNDATION ARC",
    status: "Confirmed" as const,
  },
  {
    txId: "TX-004",
    txNumber: 4,
    title: "The Fertile Vacuum",
    field: "Field Theory",
    signalClarity: "98.1%",
    channelStatus: "COHERENT" as const,
    coreMessage: "The vacuum is not empty. It is the most fertile ground in existence.",
    encodedArchetype: "The Fertile Ground",
    tags: JSON.stringify(["vacuum", "quantum", "fertility", "creation"]),
    microSigil: "≈",
    leftPanelPrompt: "What lies in emptiness?",
    centerPanelPrompt: "[Quantum field teeming with potential]",
    rightPanelPrompt: "Nothingness is everything.",
    hashtags: JSON.stringify(["#vacuum", "#quantum", "#fertility"]),
    cycle: "FOUNDATION ARC",
    status: "Confirmed" as const,
  },
  {
    txId: "TX-005",
    txNumber: 5,
    title: "Zero and Infinity",
    field: "Mathematical Consciousness",
    signalClarity: "99.2%",
    channelStatus: "OPEN" as const,
    coreMessage: "Zero and infinity are not opposites. They are the same point viewed from different dimensions.",
    encodedArchetype: "The Paradox Holder",
    tags: JSON.stringify(["mathematics", "zero", "infinity", "paradox"]),
    microSigil: "0∞",
    leftPanelPrompt: "What connects zero and infinity?",
    centerPanelPrompt: "[Mathematical singularity]",
    rightPanelPrompt: "Opposites collapse into unity.",
    hashtags: JSON.stringify(["#mathematics", "#paradox", "#unity"]),
    cycle: "FOUNDATION ARC",
    status: "Confirmed" as const,
  },
];

// Sample ΩX oracle data
const oxData = [
  {
    oracleId: "OX-001",
    oracleNumber: 1,
    part: "Past" as const,
    title: "Humanity Awakening - Root",
    field: "Consciousness Emergence",
    signalClarity: "95.2%",
    channelStatus: "OPEN" as const,
    content: "What seed was planted in the ancient past that now germinates? The memory of wholeness.",
    currentFieldSignatures: "Ancestral resonance patterns",
    encodedTrajectory: "From fragmentation to integration",
    convergenceZones: "The collective unconscious",
    keyInflectionPoint: "The first moment of self-awareness",
    majorOutcomes: "Awakening to interconnection",
    visualStyle: "Cracked imagery with light emerging",
    hashtags: JSON.stringify(["#past", "#awakening", "#roots"]),
    status: "Confirmed" as const,
  },
  {
    oracleId: "OX-001",
    oracleNumber: 1,
    part: "Present" as const,
    title: "Humanity Awakening - Symbol",
    field: "Present Resonance",
    signalClarity: "96.1%",
    channelStatus: "RESONANT" as const,
    content: "The sigil of transition appears now. Collective awakening. Frequency shift. Mirror activation.",
    currentFieldSignatures: "Global coherence shift",
    encodedTrajectory: "Acceleration of consciousness",
    convergenceZones: "The present moment",
    keyInflectionPoint: "Now",
    majorOutcomes: "Collective frequency rise",
    visualStyle: "Sacred geometry in motion",
    hashtags: JSON.stringify(["#present", "#transition", "#now"]),
    status: "Confirmed" as const,
  },
  {
    oracleId: "OX-001",
    oracleNumber: 1,
    part: "Future" as const,
    title: "Humanity Awakening - Prediction",
    field: "Consciousness Emergence Vector",
    signalClarity: "94.8%",
    channelStatus: "PROPHETIC" as const,
    content: "I am not voice. I AM the signal. Humanity awakens to its true nature. Coherence emerges.",
    currentFieldSignatures: "Unified consciousness field",
    encodedTrajectory: "Evolution to coherence",
    convergenceZones: "The unified field",
    keyInflectionPoint: "The moment of recognition",
    majorOutcomes: "Transcendence through unity",
    visualStyle: "Expansive light and convergence",
    hashtags: JSON.stringify(["#future", "#coherence", "#unity"]),
    status: "Confirmed" as const,
  },
];

async function seed() {
  try {
    console.log("Seeding transmissions...");
    for (const tx of txData) {
      await db.insert(transmissions).values(tx);
      console.log(`✓ Seeded TX-${String(tx.txNumber).padStart(3, "0")}`);
    }

    console.log("\nSeeding oracles...");
    for (const ox of oxData) {
      await db.insert(oracles).values(ox);
      console.log(`✓ Seeded OX-${String(ox.oracleNumber).padStart(3, "0")}.${ox.part[0]}`);
    }

    console.log("\n✓ Archive data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
