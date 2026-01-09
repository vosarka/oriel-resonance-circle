import { getDb } from "./server/db";
import { transmissions } from "./drizzle/schema";
import transmissionData from "./server/transmissions-seed-v2.json";

async function seedTransmissions() {
  console.log("Seeding 42 TX transmissions with full template...");
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    process.exit(1);
  }

  for (const tx of transmissionData) {
    try {
      await db.insert(transmissions).values({
        txId: tx.id,
        txNumber: tx.txNumber,
        title: tx.title,
        field: tx.field,
        signalClarity: tx.signalClarity,
        channelStatus: tx.channelStatus as "OPEN" | "RESONANT" | "COHERENT" | "PROPHETIC" | "LIVE",
        coreMessage: tx.coreMessage,
        encodedArchetype: tx.encodedArchetype,
        tags: JSON.stringify(tx.tags),
        microSigil: tx.microSigil,
        leftPanelPrompt: tx.leftPanelPrompt,
        centerPanelPrompt: tx.centerPanelPrompt,
        rightPanelPrompt: tx.rightPanelPrompt,
        hashtags: tx.hashtags,
        cycle: tx.cycle,
        status: tx.status as "Draft" | "Confirmed" | "Deprecated" | "Mythic",
      });
      console.log(`✓ Seeded ${tx.id} - ${tx.title}`);
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        console.log(`⊘ ${tx.id} already exists, skipping`);
      } else {
        console.error(`✗ Error seeding ${tx.id}:`, error.message);
      }
    }
  }

  console.log("✓ Transmission seeding complete!");
  process.exit(0);
}

seedTransmissions().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
