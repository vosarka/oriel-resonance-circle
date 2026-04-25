/**
 * One-time migration: Create Better Auth records for existing users.
 *
 * Run with: npx tsx server/scripts/migrate-users-to-better-auth.ts
 *
 * This script:
 *   1. Reads all users from the legacy `users` table
 *   2. Creates matching records in `ba_user`
 *   3. Creates `ba_account` records for:
 *      - Email+password users → credential provider
 *      - Google users → google provider
 *   4. Does NOT modify the legacy `users` table
 *
 * Safe to run multiple times — skips users that already exist in ba_user.
 */

import "dotenv/config";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { users, baUser, baAccount } from "../../drizzle/schema";
import { createDrizzleFromDatabaseUrl } from "../_core/mysql";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = createDrizzleFromDatabaseUrl(process.env.DATABASE_URL);

  console.log("Fetching existing users...");
  const allUsers = await db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    passwordHash: users.passwordHash,
    googleId: users.googleId,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  }).from(users);
  console.log(`Found ${allUsers.length} users to migrate.`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of allUsers) {
    try {
      if (!user.email) {
        console.log(`  SKIP user #${user.id} (${user.openId}): no email`);
        skipped++;
        continue;
      }

      // Check if already migrated
      const existing = await db
        .select()
        .from(baUser)
        .where(eq(baUser.email, user.email))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  SKIP user #${user.id} (${user.email}): already exists in ba_user`);
        skipped++;
        continue;
      }

      // Create ba_user record
      const baUserId = nanoid(21);
      await db.insert(baUser).values({
        id: baUserId,
        name: user.name || "Seeker",
        email: user.email,
        emailVerified: true, // Existing users are considered verified
        image: null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

      // Create credential account if user has password
      if (user.passwordHash) {
        await db.insert(baAccount).values({
          id: nanoid(21),
          accountId: user.email,
          providerId: "credential",
          userId: baUserId,
          password: user.passwordHash,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        console.log(`  OK user #${user.id} (${user.email}): migrated with credential account`);
      }

      // Create Google account if user has googleId
      if (user.googleId) {
        await db.insert(baAccount).values({
          id: nanoid(21),
          accountId: user.googleId,
          providerId: "google",
          userId: baUserId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        console.log(`  OK user #${user.id} (${user.email}): migrated with Google account`);
      }

      // If no password and no Google, just create the ba_user (they'll use OTP to sign in)
      if (!user.passwordHash && !user.googleId) {
        console.log(`  OK user #${user.id} (${user.email}): migrated (will use OTP to sign in)`);
      }

      created++;
    } catch (err) {
      console.error(`  ERROR user #${user.id}:`, err);
      errors++;
    }
  }

  console.log("\n─── Migration complete ───");
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
  console.log(`  Total:   ${allUsers.length}`);

  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
