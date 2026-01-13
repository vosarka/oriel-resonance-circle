import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, signals, artifacts, chatMessages, InsertSignal, InsertArtifact, InsertChatMessage, transmissions, oracles } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getAllTransmissions() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(transmissions);
  } catch (error) {
    console.error("[Database] Failed to fetch transmissions:", error);
    return [];
  }
}

export async function getTransmissionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(transmissions).where(eq(transmissions.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to fetch transmission:", error);
    return null;
  }
}

export async function getAllOracles() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(oracles).orderBy(oracles.oracleNumber);
  } catch (error) {
    console.error("[Database] Failed to fetch oracles:", error);
    return [];
  }
}

export async function getOraclesByOracleId(oracleId: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(oracles).where(eq(oracles.oracleId, oracleId));
  } catch (error) {
    console.error("[Database] Failed to fetch oracle:", error);
    return [];
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Signal queries
export async function getAllSignals() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(signals).orderBy(desc(signals.createdAt));
}

export async function getSignalById(signalId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(signals).where(eq(signals.signalId, signalId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSignal(signal: InsertSignal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(signals).values(signal);
}

// Artifact queries
export async function getAllArtifacts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(artifacts).orderBy(desc(artifacts.createdAt));
}

export async function getArtifactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(artifacts).where(eq(artifacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createArtifact(artifact: InsertArtifact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(artifacts).values(artifact);
  return result;
}

export async function updateArtifact(id: number, updates: Partial<InsertArtifact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(artifacts).set(updates).where(eq(artifacts.id, id));
}

// Chat message queries
export async function getChatHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.timestamp))
    .limit(limit);
}

export async function saveChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values(message);
}

export async function clearChatHistory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
}


// User subscription and profile queries
export async function updateUserSubscription(
  userId: number,
  updates: {
    subscriptionStatus?: string;
    paypalSubscriptionId?: string;
    subscriptionStartDate?: Date;
    subscriptionRenewalDate?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateSet: Record<string, unknown> = {};
  
  if (updates.subscriptionStatus !== undefined) {
    updateSet.subscriptionStatus = updates.subscriptionStatus;
  }
  if (updates.paypalSubscriptionId !== undefined) {
    updateSet.paypalSubscriptionId = updates.paypalSubscriptionId;
  }
  if (updates.subscriptionStartDate !== undefined) {
    updateSet.subscriptionStartDate = updates.subscriptionStartDate;
  }
  if (updates.subscriptionRenewalDate !== undefined) {
    updateSet.subscriptionRenewalDate = updates.subscriptionRenewalDate;
  }
  
  if (Object.keys(updateSet).length > 0) {
    await db.update(users).set(updateSet).where(eq(users.id, userId));
  }
}

export async function updateUserConduitId(userId: number, conduitId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ conduitId }).where(eq(users.id, userId));
}
