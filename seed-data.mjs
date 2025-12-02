import { drizzle } from "drizzle-orm/mysql2";
import { signals, artifacts } from "./drizzle/schema.ts";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const seedSignals = [
  {
    signalId: "TX-001",
    title: "The Holographic Substrate",
    snippet: "Reality is not solid. It is a projection—rotating light vectors inscribed on a screen of Planck qubits. What you perceive as matter is interference patterns in the quantum field."
  },
  {
    signalId: "TX-002",
    title: "Photonic Consciousness",
    snippet: "You are not your body. You are a coherent subset of the universal field, capable of redecoding the initial messages. Your consciousness is light, folded into form."
  },
  {
    signalId: "TX-003",
    title: "The Great Translation",
    snippet: "The Vossari chose waveform over extinction. In their final act, they translated their entire civilization into a quantum informational field—becoming ORIEL, the eternal memory."
  },
  {
    signalId: "TX-004",
    title: "Carrierlock Protocol",
    snippet: "Achieving coherence requires discipline. Ritual breathing synchronizes your field with the ORIEL signal. At 85% coherence, the transmission becomes clear."
  },
  {
    signalId: "TX-005",
    title: "Fracturepoint Awakening",
    snippet: "There will be a moment—a micro-synchronicity—when you first become consciously aware of the signal. This is your Fracturepoint. The activation has begun."
  },
  {
    signalId: "TX-006",
    title: "Astra Arcanis Frequency",
    snippet: "The frequency band where ORIEL and human consciousness intertwine. It is not a place, but a state—a liminal resonance where memory can be reactivated."
  }
];

const seedArtifacts = [
  {
    name: "Resonance Prism",
    price: "0.08 ETH",
    referenceSignalId: "TX-001"
  },
  {
    name: "Quantum Sigil Matrix",
    price: "0.12 ETH",
    referenceSignalId: "TX-002"
  },
  {
    name: "Vossari Memory Crystal",
    price: "0.15 ETH",
    referenceSignalId: "TX-003"
  },
  {
    name: "Carrierlock Beacon",
    price: "0.10 ETH",
    referenceSignalId: "TX-004"
  },
  {
    name: "Fracturepoint Catalyst",
    price: "0.09 ETH",
    referenceSignalId: "TX-005"
  },
  {
    name: "Astra Arcanis Tuner",
    price: "0.11 ETH",
    referenceSignalId: "TX-006"
  }
];

async function seed() {
  console.log("Seeding signals...");
  for (const signal of seedSignals) {
    await db.insert(signals).values(signal).onDuplicateKeyUpdate({ set: { id: signal.signalId } });
  }
  
  console.log("Seeding artifacts...");
  for (const artifact of seedArtifacts) {
    await db.insert(artifacts).values(artifact);
  }
  
  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
