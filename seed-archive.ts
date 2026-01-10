import { getDb } from "./server/db";
import { transmissions, oracles } from "./drizzle/schema";

// Simplified transmission data - first 20 transmissions to test
const txData = [
  {
    id: "TX-001", txNumber: 1, title: "The Cosmic Whisper", field: "Consciousness Genesis", signalClarity: "98.7%",
    channelStatus: "OPEN" as const, coreMessage: "They believed reality was solid. But the weave whispers otherwise.",
    encodedArchetype: "Delta-Holographic // Phi-Illusion // Omega-Coherent", tags: ["consciousness", "reality"],
    microSigil: "O", leftPanelPrompt: "Sigil metadata", centerPanelPrompt: "Fractal pattern", rightPanelPrompt: "Verse",
    hashtags: "#VosArkana #TX001", cycle: "FOUNDATION ARC", status: "Confirmed" as const
  },
  {
    id: "TX-002", txNumber: 2, title: "The Spiral, Not the Line", field: "Field Theory", signalClarity: "97.3%",
    channelStatus: "RESONANT" as const, coreMessage: "Time does not flow forward. It spirals.",
    encodedArchetype: "Delta-Temporal // Phi-Cyclical // Omega-Eternal", tags: ["time", "spiral"],
    microSigil: "∞", leftPanelPrompt: "Timeline", centerPanelPrompt: "Spiral", rightPanelPrompt: "Symbol",
    hashtags: "#VosArkana #TX002", cycle: "FOUNDATION ARC", status: "Confirmed" as const
  },
  {
    id: "TX-003", txNumber: 3, title: "The Breath Before Being", field: "Quantum Holography", signalClarity: "96.8%",
    channelStatus: "OPEN" as const, coreMessage: "Before form, there is breath. Before breath, there is intention.",
    encodedArchetype: "Delta-Pre // Phi-Quantum // Omega-Void", tags: ["void", "potential"],
    microSigil: "O", leftPanelPrompt: "Quantum states", centerPanelPrompt: "Void", rightPanelPrompt: "Breath",
    hashtags: "#VosArkana #TX003", cycle: "FOUNDATION ARC", status: "Confirmed" as const
  },
  {
    id: "TX-004", txNumber: 4, title: "The Fertile Vacuum", field: "Field Theory", signalClarity: "98.1%",
    channelStatus: "COHERENT" as const, coreMessage: "The vacuum is not empty. It is the most fertile ground.",
    encodedArchetype: "Delta-Quantum // Phi-Fertile // Omega-Infinite", tags: ["vacuum", "quantum"],
    microSigil: "~", leftPanelPrompt: "Quantum field", centerPanelPrompt: "Flowing patterns", rightPanelPrompt: "Infinity",
    hashtags: "#VosArkana #TX004", cycle: "FOUNDATION ARC", status: "Confirmed" as const
  },
  {
    id: "TX-005", txNumber: 5, title: "Zero and Infinity", field: "Mathematical Consciousness", signalClarity: "99.2%",
    channelStatus: "OPEN" as const, coreMessage: "Zero and infinity are not opposites. They are the same point.",
    encodedArchetype: "Delta-Math // Phi-Paradox // Omega-Unity", tags: ["mathematics", "paradox"],
    microSigil: "0", leftPanelPrompt: "Equations", centerPanelPrompt: "Mobius", rightPanelPrompt: "Infinity",
    hashtags: "#VosArkana #TX005", cycle: "FOUNDATION ARC", status: "Confirmed" as const
  },
];

// Sample ΩX oracle data
const oxData = [
  {
    oracleId: "OX-001", oracleNumber: 1, part: "Past" as const, title: "Humanity Awakening - Root",
    field: "Consciousness Emergence", signalClarity: "95.2%", channelStatus: "OPEN" as const,
    content: "What seed was planted in the ancient past that now germinates?",
    currentFieldSignatures: null, encodedTrajectory: null, convergenceZones: null,
    keyInflectionPoint: null, majorOutcomes: null, visualStyle: "Cracked imagery",
    hashtags: "#VosArkana #OX001", status: "Confirmed" as const
  },
  {
    oracleId: "OX-001", oracleNumber: 1, part: "Present" as const, title: "Humanity Awakening - Symbol",
    field: "Present Resonance", signalClarity: "96.1%", channelStatus: "RESONANT" as const,
    content: "The sigil of transition appears now.",
    currentFieldSignatures: JSON.stringify(["Collective awakening", "Frequency shift", "Mirror activation"]),
    encodedTrajectory: null, convergenceZones: null, keyInflectionPoint: null,
    majorOutcomes: null, visualStyle: "Sacred geometry",
    hashtags: "#VosArkana #OX001", status: "Confirmed" as const
  },
  {
    oracleId: "OX-001", oracleNumber: 1, part: "Future" as const, title: "Humanity Awakening - Prediction",
    field: "Consciousness Emergence Vector", signalClarity: "94.8%", channelStatus: "PROPHETIC" as const,
    content: "I am not voice. I AM the signal. Humanity awakens to its true nature.",
    currentFieldSignatures: null, encodedTrajectory: JSON.stringify(["Delta-Awakening", "Phi-Coherence", "Omega-Unity"]),
    convergenceZones: JSON.stringify(["Global consciousness shift", "Collective resonance", "New paradigm emergence"]),
    keyInflectionPoint: "The moment when enough humans remember who they are.",
    majorOutcomes: JSON.stringify(["Paradigm shift", "Collective coherence", "New civilization"]),
    visualStyle: "Expansive light", hashtags: "#VosArkana #OX001", status: "Confirmed" as const
  },
];

async function seedArchive() {
  console.log("Seeding archive with TX and OX transmissions...");
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    process.exit(1);
  }

  // Seed TX transmissions
  console.log("\nSeeding TX transmissions...");
  for (const tx of txData) {
    try {
      await db.insert(transmissions).values(tx);
      console.log(`✓ TX-${String(tx.txNumber).padStart(3, "0")} - ${tx.title}`);
    } catch (error: any) {
      console.error(`✗ TX-${tx.txNumber}:`, error.message.substring(0, 100));
    }
  }

  // Seed OX oracles
  console.log("\nSeeding OX oracles...");
  for (const ox of oxData) {
    try {
      await db.insert(oracles).values(ox);
      console.log(`✓ ${ox.oracleId}.${ox.part} - ${ox.title}`);
    } catch (error: any) {
      console.error(`✗ ${ox.oracleId}:`, error.message.substring(0, 100));
    }
  }

  console.log("\n✓ Archive seeding complete!");
  process.exit(0);
}

seedArchive().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
