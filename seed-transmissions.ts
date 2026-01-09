import { getDb } from "./server/db";
import { transmissions } from "./drizzle/schema";
import transmissionData from "./server/transmissions-seed.json";

async function seedTransmissions() {
  console.log("Seeding 42 TX transmissions...");
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
        tags: JSON.stringify(tx.tags),
        microSigil: tx.microSigil,
        centerPrompt: tx.centerPrompt,
        excerpt: tx.excerpt,
        directive: tx.directive,
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
