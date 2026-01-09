import { drizzle } from "drizzle-orm/mysql2/promise";
import mysql from "mysql2/promise";
import { transmissions } from "./drizzle/schema.ts";
import fs from "fs";

const transmissionData = JSON.parse(fs.readFileSync("./server/transmissions-seed.json", "utf-8"));

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "vos_arkana",
});

const db = drizzle(connection);

async function seedTransmissions() {
  console.log("Seeding 42 TX transmissions...");

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
        status: tx.status,
      });
      console.log(`✓ Seeded ${tx.id} - ${tx.title}`);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        console.log(`⊘ ${tx.id} already exists, skipping`);
      } else {
        console.error(`✗ Error seeding ${tx.id}:`, error.message);
      }
    }
  }

  console.log("✓ Transmission seeding complete!");
  await connection.end();
}

seedTransmissions().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
