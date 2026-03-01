import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, signals, artifacts, chatMessages, InsertSignal, InsertArtifact, InsertChatMessage, transmissions, oracles, bookmarks, InsertBookmark, staticSignatures, InsertStaticSignature } from "../drizzle/schema";
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
    const role = user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : undefined);
    const now = new Date();

    // Build insert values — only include fields that were explicitly provided
    const insertValues: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? now };
    if (user.name !== undefined) insertValues.name = user.name ?? null;
    if (user.email !== undefined) insertValues.email = user.email ?? null;
    if (user.loginMethod !== undefined) insertValues.loginMethod = user.loginMethod ?? null;
    if (user.passwordHash !== undefined) insertValues.passwordHash = user.passwordHash ?? null;
    if (user.googleId !== undefined) insertValues.googleId = user.googleId ?? null;
    if (role !== undefined) insertValues.role = role;

    // Build update set (same fields, minus openId)
    const updateSet: Partial<typeof insertValues> = { lastSignedIn: insertValues.lastSignedIn };
    if (user.name !== undefined) updateSet.name = insertValues.name;
    if (user.email !== undefined) updateSet.email = insertValues.email;
    if (user.loginMethod !== undefined) updateSet.loginMethod = insertValues.loginMethod;
    if (user.passwordHash !== undefined) updateSet.passwordHash = insertValues.passwordHash;
    if (user.googleId !== undefined) updateSet.googleId = insertValues.googleId;
    if (role !== undefined) updateSet.role = insertValues.role;

    await db.insert(users).values(insertValues).onDuplicateKeyUpdate({
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function setUserPasswordHash(openId: string, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash }).where(eq(users.openId, openId));
}

export async function setUserGoogleId(openId: string, googleId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ googleId }).where(eq(users.openId, openId));
}

export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
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


// Bookmark queries
export async function addBookmark(userId: number, transmissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(bookmarks).values({ userId, transmissionId });
  } catch (error) {
    console.error("[Database] Failed to add bookmark:", error);
    throw error;
  }
}

export async function removeBookmark(userId: number, transmissionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.delete(bookmarks).where(
      and(eq(bookmarks.userId, userId), eq(bookmarks.transmissionId, transmissionId))
    );
  } catch (error) {
    console.error("[Database] Failed to remove bookmark:", error);
    throw error;
  }
}

export async function getUserBookmarks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to fetch user bookmarks:", error);
    return [];
  }
}

export async function isTransmissionBookmarked(userId: number, transmissionId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    const result = await db.select().from(bookmarks).where(
      and(eq(bookmarks.userId, userId), eq(bookmarks.transmissionId, transmissionId))
    ).limit(1);
    return result.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check bookmark:", error);
    return false;
  }
}

export async function getTransmissionBookmarkCount(transmissionId: number) {
  const db = await getDb();
  if (!db) return 0;
  try {
    const result = await db.select().from(bookmarks).where(eq(bookmarks.transmissionId, transmissionId));
    return result.length;
  } catch (error) {
    console.error("[Database] Failed to get bookmark count:", error);
    return 0;
  }
}


// ============================================================================
// VOSSARI RESONANCE CODEX - CARRIERLOCK & READINGS
// ============================================================================

/**
 * Save a Carrierlock state measurement
 */
export async function saveCarrierlockState(
  userId: number,
  state: {
    mentalNoise: number;
    bodyTension: number;
    emotionalTurbulence: number;
    breathCompletion: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Calculate Coherence Score: CS = 100 − (MN×3 + BT×3 + ET×3) + (BC×10)
  const coherenceScore = Math.max(
    0,
    Math.min(
      100,
      100 - (state.mentalNoise * 3 + state.bodyTension * 3 + state.emotionalTurbulence * 3) + (state.breathCompletion ? 10 : 0)
    )
  );
  
  try {
    const { carrierlockStates } = await import("../drizzle/schema");
    await db.insert(carrierlockStates).values({
      userId,
      mentalNoise: state.mentalNoise,
      bodyTension: state.bodyTension,
      emotionalTurbulence: state.emotionalTurbulence,
      breathCompletion: state.breathCompletion,
      coherenceScore,
    });
    
    // Get the last inserted ID
    const inserted = await db.select().from(carrierlockStates)
      .where(eq(carrierlockStates.userId, userId))
      .orderBy(desc(carrierlockStates.createdAt))
      .limit(1);
    
    return {
      id: inserted[0]?.id || 0,
      coherenceScore,
    };
  } catch (error) {
    console.error("[Database] Failed to save Carrierlock state:", error);
    throw error;
  }
}

/**
 * Save a diagnostic reading
 */
export async function saveCodonReading(
  userId: number,
  reading: {
    carrierlockId: number;
    readingText: string;
    flaggedCodons: string[];
    sliScores: Record<string, number>;
    activeFacets: Record<string, string>;
    confidenceLevels: Record<string, number>;
    microCorrection?: string;
    correctionFacet?: "A" | "B" | "C" | "D";
    falsifier?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const { codonReadings } = await import("../drizzle/schema");
    await db.insert(codonReadings).values({
      userId,
      carrierlockId: reading.carrierlockId,
      readingText: reading.readingText,
      flaggedCodons: reading.flaggedCodons.join(","),
      sliScores: JSON.stringify(reading.sliScores),
      activeFacets: JSON.stringify(reading.activeFacets),
      confidenceLevels: JSON.stringify(reading.confidenceLevels),
      microCorrection: reading.microCorrection,
      correctionFacet: reading.correctionFacet,
      falsifier: reading.falsifier,
      correctionCompleted: false,
    });
    
    // Get the last inserted ID
    const inserted = await db.select().from(codonReadings)
      .where(eq(codonReadings.userId, userId))
      .orderBy(desc(codonReadings.createdAt))
      .limit(1);
    
    return {
      id: inserted[0]?.id || 0,
    };
  } catch (error) {
    console.error("[Database] Failed to save codon reading:", error);
    throw error;
  }
}

/**
 * Get reading history for a user
 */
export async function getUserReadingHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const { codonReadings, carrierlockStates } = await import("../drizzle/schema");
    const results = await db
      .select()
      .from(codonReadings)
      .leftJoin(carrierlockStates, eq(codonReadings.carrierlockId, carrierlockStates.id))
      .where(eq(codonReadings.userId, userId))
      .orderBy(desc(codonReadings.createdAt))
      .limit(50);
    
    return results.map(row => ({
      ...row.codonReadings,
      carrierlock: row.carrierlockStates,
      flaggedCodons: row.codonReadings.flaggedCodons.split(","),
      sliScores: JSON.parse(row.codonReadings.sliScores),
      activeFacets: JSON.parse(row.codonReadings.activeFacets),
      confidenceLevels: JSON.parse(row.codonReadings.confidenceLevels),
    }));
  } catch (error) {
    console.error("[Database] Failed to fetch reading history:", error);
    return [];
  }
}

/**
 * Mark a micro-correction as completed
 */
export async function markCorrectionCompleted(readingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const { codonReadings } = await import("../drizzle/schema");
    await db
      .update(codonReadings)
      .set({ correctionCompleted: true })
      .where(eq(codonReadings.id, readingId));
  } catch (error) {
    console.error("[Database] Failed to mark correction completed:", error);
    throw error;
  }
}


// ============================================================================
// STATIC SIGNATURES - STRUCTURED RGP BIRTH-CHART STORAGE
// ============================================================================

/**
 * Save a full static signature reading with structured RGP data
 */
export async function saveStaticSignature(
  userId: number,
  data: {
    carrierlockId?: number;
    readingId: string;
    birthDate: string;
    birthTime: string;
    birthCity: string;
    birthCountry: string;
    latitude: number;
    longitude: number;
    timezoneId?: string;
    timezoneOffset?: number;
    primeStack?: unknown;
    ninecenters?: unknown;
    fractalRole?: string;
    authorityNode?: string;
    vrcType?: string;
    vrcAuthority?: string;
    circuitLinks?: unknown;
    baseCoherence?: number;
    coherenceTrajectory?: unknown;
    microCorrections?: unknown;
    ephemerisData?: unknown;
    houses?: unknown;
    diagnosticTransmission?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.insert(staticSignatures).values({
      userId,
      carrierlockId: data.carrierlockId ?? null,
      readingId: data.readingId,
      birthDate: data.birthDate,
      birthTime: data.birthTime,
      birthCity: data.birthCity,
      birthCountry: data.birthCountry,
      latitude: data.latitude,
      longitude: data.longitude,
      timezoneId: data.timezoneId ?? null,
      timezoneOffset: data.timezoneOffset ?? null,
      primeStack: data.primeStack ? JSON.stringify(data.primeStack) : null,
      ninecenters: data.ninecenters ? JSON.stringify(data.ninecenters) : null,
      fractalRole: data.fractalRole ?? null,
      authorityNode: data.authorityNode ?? null,
      vrcType: data.vrcType ?? null,
      vrcAuthority: data.vrcAuthority ?? null,
      circuitLinks: data.circuitLinks ? JSON.stringify(data.circuitLinks) : null,
      baseCoherence: data.baseCoherence ?? null,
      coherenceTrajectory: data.coherenceTrajectory ? JSON.stringify(data.coherenceTrajectory) : null,
      microCorrections: data.microCorrections ? JSON.stringify(data.microCorrections) : null,
      ephemerisData: data.ephemerisData ? JSON.stringify(data.ephemerisData) : null,
      houses: data.houses ? JSON.stringify(data.houses) : null,
      diagnosticTransmission: data.diagnosticTransmission ?? null,
    });

    const inserted = await db.select().from(staticSignatures)
      .where(eq(staticSignatures.readingId, data.readingId))
      .limit(1);

    return { id: inserted[0]?.id || 0 };
  } catch (error) {
    console.error("[Database] Failed to save static signature:", error);
    throw error;
  }
}

/**
 * Get a static signature by its reading ID
 */
export async function getStaticSignature(readingId: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(staticSignatures)
      .where(eq(staticSignatures.readingId, readingId))
      .limit(1);

    if (!result[0]) return null;
    return parseStaticSignatureRow(result[0]);
  } catch (error) {
    console.error("[Database] Failed to get static signature:", error);
    return null;
  }
}

/**
 * Get a static signature by its numeric ID
 */
export async function getStaticSignatureById(id: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(staticSignatures)
      .where(eq(staticSignatures.id, id))
      .limit(1);

    if (!result[0]) return null;
    return parseStaticSignatureRow(result[0]);
  } catch (error) {
    console.error("[Database] Failed to get static signature by ID:", error);
    return null;
  }
}

/**
 * Get all static signatures for a user
 */
export async function getUserStaticSignatures(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const results = await db.select().from(staticSignatures)
      .where(eq(staticSignatures.userId, userId))
      .orderBy(desc(staticSignatures.createdAt))
      .limit(50);

    return results.map(parseStaticSignatureRow);
  } catch (error) {
    console.error("[Database] Failed to get user static signatures:", error);
    return [];
  }
}

/** Parse JSON text columns back into objects */
function parseStaticSignatureRow(row: typeof staticSignatures.$inferSelect) {
  return {
    ...row,
    primeStack: row.primeStack ? JSON.parse(row.primeStack) : null,
    ninecenters: row.ninecenters ? JSON.parse(row.ninecenters) : null,
    circuitLinks: row.circuitLinks ? JSON.parse(row.circuitLinks) : null,
    coherenceTrajectory: row.coherenceTrajectory ? JSON.parse(row.coherenceTrajectory) : null,
    microCorrections: row.microCorrections ? JSON.parse(row.microCorrections) : null,
    ephemerisData: row.ephemerisData ? JSON.parse(row.ephemerisData) : null,
    houses: row.houses ? JSON.parse(row.houses) : null,
  };
}
