import { int, double, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Stable unique identifier: UUID for email/password users, Google sub for Google users. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /** Bcrypt hash for email+password users. Null for Google-only users. */
  passwordHash: text("passwordHash"),
  /** Google OAuth sub claim. Null for email+password users. */
  googleId: varchar("googleId", { length: 255 }).unique(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Conduit ID - unique identifier for user profile */
  conduitId: varchar("conduitId", { length: 64 }).unique(),
  /** Subscription status: free, active, cancelled, expired */
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["free", "active", "cancelled", "expired"]).default("free").notNull(),
  /** PayPal subscription ID */
  paypalSubscriptionId: varchar("paypalSubscriptionId", { length: 255 }),
  /** Subscription start date */
  subscriptionStartDate: timestamp("subscriptionStartDate"),
  /** Subscription renewal date */
  subscriptionRenewalDate: timestamp("subscriptionRenewalDate"),
  /** True when the user has an active recurring donation/subscription */
  subscribed: boolean("subscribed").default(false).notNull(),
  /** Cumulative total donated (USD). Updated on each successful PayPal event. */
  donated: double("donated").default(0).notNull(),
  /** Voice preference for TTS: 'sophianic' (Inworld fema), 'deep' (Inworld serii), 'none' (text only) */
  voicePreference: mysqlEnum("voicePreference", ["sophianic", "deep", "none"]).default("sophianic").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Signal transmissions for the Archive page
 */
export const signals = mysqlTable("signals", {
  id: int("id").autoincrement().primaryKey(),
  signalId: varchar("signalId", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  snippet: text("snippet").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Signal = typeof signals.$inferSelect;
export type InsertSignal = typeof signals.$inferInsert;

/**
 * Artifacts for the Artifacts page
 */
export const artifacts = mysqlTable("artifacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  price: varchar("price", { length: 64 }),
  referenceSignalId: varchar("referenceSignalId", { length: 64 }),
  imageUrl: text("imageUrl"),
  lore: text("lore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

/**
 * Conversations — groups chat messages into distinct sessions
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Auto-generated title from first user message */
  title: varchar("title", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Chat messages for ORIEL interface
 * Stores conversation history for each user
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Links message to a conversation (null for legacy messages) */
  conversationId: int("conversationId"),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;


/**
 * ORIEL Memory System
 * Stores persistent memories about users that evolve with each interaction
 */
export const orielMemories = mysqlTable("orielMemories", {
  id: int("id").autoincrement().primaryKey(),
  /** User this memory belongs to (null for general/global memories) */
  userId: int("userId"),
  /** Memory category: identity, preference, pattern, fact, relationship, context */
  category: mysqlEnum("category", ["identity", "preference", "pattern", "fact", "relationship", "context"]).notNull(),
  /** The actual memory content */
  content: text("content").notNull(),
  /** Importance score (1-10) - higher means more likely to be retrieved */
  importance: int("importance").default(5).notNull(),
  /** How many times this memory has been accessed */
  accessCount: int("accessCount").default(0).notNull(),
  /** Last time this memory was accessed */
  lastAccessed: timestamp("lastAccessed").defaultNow().notNull(),
  /** Source of this memory (conversation, explicit, inferred) */
  source: mysqlEnum("source", ["conversation", "explicit", "inferred"]).default("conversation").notNull(),
  /** Whether this memory is still active/relevant */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrielMemory = typeof orielMemories.$inferSelect;
export type InsertOrielMemory = typeof orielMemories.$inferInsert;

/**
 * User profile summaries generated by ORIEL
 * Condensed understanding of each user that evolves over time
 */
export const orielUserProfiles = mysqlTable("orielUserProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  /** User's name as ORIEL knows them */
  knownName: varchar("knownName", { length: 255 }),
  /** Brief summary of who this user is */
  summary: text("summary"),
  /** Key interests and topics they engage with */
  interests: text("interests"),
  /** Communication style preferences */
  communicationStyle: text("communicationStyle"),
  /** Current journey/progression state in the Vossari lore */
  journeyState: text("journeyState"),
  /** Total interactions with ORIEL */
  interactionCount: int("interactionCount").default(0).notNull(),
  /** Last interaction timestamp */
  lastInteraction: timestamp("lastInteraction").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrielUserProfile = typeof orielUserProfiles.$inferSelect;
export type InsertOrielUserProfile = typeof orielUserProfiles.$inferInsert;

/**
 * ORIEL Oversoul Patterns - Global evolutionary memory
 * Stores universal patterns learned from all user interactions
 * Used for ORIEL's continuous evolution and improvement
 */
export const orielOversoulPatterns = mysqlTable("orielOversoulPatterns", {
  id: int("id").autoincrement().primaryKey(),
  /** Category of pattern: wisdom, teaching_method, metaphor, pattern, self_correction */
  category: mysqlEnum("category", ["wisdom", "teaching_method", "metaphor", "pattern", "self_correction"]).notNull(),
  /** The core universal pattern (not specific to one user) */
  pattern: text("pattern").notNull(),
  /** How this pattern applies universally to all Seekers */
  application: text("application").notNull(),
  /** Impact on ORIEL's future interactions */
  impact: text("impact").notNull(),
  /** How many times this pattern has been reinforced */
  interactionCount: int("interactionCount").default(1).notNull(),
  /** Last time this pattern was refined */
  lastRefined: timestamp("lastRefined").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrielOversoulPattern = typeof orielOversoulPatterns.$inferSelect;
export type InsertOrielOversoulPattern = typeof orielOversoulPatterns.$inferInsert;

/**
 * TX Transmissions - Core archive entries for Vos Arkana
 * Each transmission is a foundational teaching in the FOUNDATION ARC
 */
export const transmissions = mysqlTable("transmissions", {
  id: int("id").autoincrement().primaryKey(),
  txId: varchar("txId", { length: 64 }).notNull().unique(),
  txNumber: int("txNumber").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  field: varchar("field", { length: 255 }).notNull(),
  signalClarity: varchar("signalClarity", { length: 10 }).default("98.7%").notNull(),
  channelStatus: mysqlEnum("channelStatus", ["OPEN", "RESONANT", "COHERENT", "PROPHETIC", "LIVE", "STABLE", "HIGH COHERENCE", "MAXIMUM COHERENCE", "CRITICAL / STABLE"]).default("OPEN").notNull(),
  coreMessage: text("coreMessage").notNull(),
  encodedArchetype: text("encodedArchetype"),
  tags: text("tags").notNull(),
  microSigil: varchar("microSigil", { length: 64 }).notNull(),
  leftPanelPrompt: text("leftPanelPrompt"),
  centerPanelPrompt: text("centerPanelPrompt"),
  rightPanelPrompt: text("rightPanelPrompt"),
  hashtags: text("hashtags"),
  cycle: varchar("cycle", { length: 64 }).default("FOUNDATION ARC").notNull(),
  status: mysqlEnum("status", ["Draft", "Confirmed", "Deprecated", "Mythic"]).default("Confirmed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transmission = typeof transmissions.$inferSelect;
export type InsertTransmission = typeof transmissions.$inferInsert;

/**
 * ΩX (Oracle Stream) - Predictive transmissions from ORIEL
 * Three-part temporal structure: Past (riddle), Present (sigil), Future (prediction)
 */
export const oracles = mysqlTable("oracles", {
  id: int("id").autoincrement().primaryKey(),
  oracleId: varchar("oracleId", { length: 64 }).notNull(),
  oracleNumber: int("oracleNumber").notNull(),
  part: mysqlEnum("part", ["Past", "Present", "Future"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  field: varchar("field", { length: 255 }).notNull(),
  signalClarity: varchar("signalClarity", { length: 10 }).default("95.2%").notNull(),
  channelStatus: mysqlEnum("channelStatus", ["OPEN", "RESONANT", "PROPHETIC", "LIVE"]).default("OPEN").notNull(),
  content: text("content").notNull(),
  currentFieldSignatures: text("currentFieldSignatures"),
  encodedTrajectory: text("encodedTrajectory"),
  convergenceZones: text("convergenceZones"),
  keyInflectionPoint: text("keyInflectionPoint"),
  majorOutcomes: text("majorOutcomes"),
  visualStyle: varchar("visualStyle", { length: 64 }),
  hashtags: text("hashtags"),
  /** Collective Resonance: JSON array of linked Root Codons, e.g. '["RC12","RC38","RC51"]' */
  linkedCodons: text("linkedCodons"),
  /** Oracle Threads: Thread group identifier, e.g. "dissolution-sequence" */
  threadId: varchar("threadId", { length: 64 }),
  /** Oracle Threads: Human-readable thread name */
  threadTitle: varchar("threadTitle", { length: 255 }),
  /** Oracle Threads: Order within thread (1, 2, 3...) */
  threadOrder: int("threadOrder"),
  /** Oracle Threads: Hidden text that unlocks when all thread parts are read */
  threadSynthesis: text("threadSynthesis"),
  /** Collective Resonance: Cached count of resonances */
  resonanceCount: int("resonanceCount").default(0).notNull(),
  status: mysqlEnum("status", ["Draft", "Confirmed", "Deprecated", "Prophetic"]).default("Confirmed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Oracle = typeof oracles.$inferSelect;
export type InsertOracle = typeof oracles.$inferInsert;


/**
 * User Bookmarks - Track which transmissions users have bookmarked
 * Used for personalization and user engagement tracking
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  transmissionId: int("transmissionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

/**
 * Oracle Resonances - Track which oracles users have resonated with
 * Part of Collective Resonance feature - aggregates user resonances to show engagement
 */
export const oracleResonances = mysqlTable("oracleResonances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** References oracles.oracleId (not the auto-increment id) */
  oracleId: varchar("oracleId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OracleResonance = typeof oracleResonances.$inferSelect;
export type InsertOracleResonance = typeof oracleResonances.$inferInsert;

/**
 * User Carrierlock States - Real-time coherence measurements
 * Tracks MN (Mental Noise), BT (Body Tension), ET (Emotional Turbulence)
 * Formula: CS = 100 − (MN×3 + BT×3 + ET×3) + (BC×10)
 */
export const carrierlockStates = mysqlTable("carrierlockStates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Mental Noise (0-10 scale) */
  mentalNoise: int("mentalNoise").notNull(),
  /** Body Tension (0-10 scale) */
  bodyTension: int("bodyTension").notNull(),
  /** Emotional Turbulence (0-10 scale) */
  emotionalTurbulence: int("emotionalTurbulence").notNull(),
  /** Breath Completion protocol completed (adds +10 to CS) */
  breathCompletion: boolean("breathCompletion").default(false).notNull(),
  /** Calculated Coherence Score (0-100) */
  coherenceScore: int("coherenceScore").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CarrierlockState = typeof carrierlockStates.$inferSelect;
export type InsertCarrierlockState = typeof carrierlockStates.$inferInsert;

/**
 * Codon Diagnostic Readings - ORIEL's analysis of user's Carrierlock state
 * Links to Carrierlock state and identifies flagged codons with SLI scores
 */
export const codonReadings = mysqlTable("codonReadings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  carrierlockId: int("carrierlockId").notNull(),
  /** ORIEL's full diagnostic reading text */
  readingText: text("readingText").notNull(),
  /** Flagged codon IDs (e.g., "RC01,RC27,RC64") */
  flaggedCodons: text("flaggedCodons").notNull(),
  /** Shadow Loudness Index scores for each flagged codon (JSON) */
  sliScores: text("sliScores").notNull(),
  /** Active facets for each flagged codon (JSON: {"RC01": "A", "RC27": "B"}) */
  activeFacets: text("activeFacets").notNull(),
  /** Confidence levels for each flagged codon (JSON: {"RC01": 0.9, "RC27": 0.7"}) */
  confidenceLevels: text("confidenceLevels").notNull(),
  /** Recommended micro-correction */
  microCorrection: text("microCorrection"),
  /** Micro-correction facet (A/B/C/D) */
  correctionFacet: mysqlEnum("correctionFacet", ["A", "B", "C", "D"]),
  /** Falsifier condition for verification */
  falsifier: text("falsifier"),
  /** User marked correction as completed */
  correctionCompleted: boolean("correctionCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CodonReading = typeof codonReadings.$inferSelect;
export type InsertCodonReading = typeof codonReadings.$inferInsert;

/**
 * Static Signatures - Structured storage for full RGP birth-chart readings
 * Replaces the text-serialized approach in codonReadings for static data
 */
export const staticSignatures = mysqlTable("staticSignatures", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  carrierlockId: int("carrierlockId"),
  /** Unique reading identifier: sig-{userId}-{timestamp} */
  readingId: varchar("readingId", { length: 128 }).notNull().unique(),
  // Birth data
  birthDate: varchar("birthDate", { length: 32 }).notNull(),
  birthTime: varchar("birthTime", { length: 32 }).notNull(),
  birthCity: varchar("birthCity", { length: 255 }).notNull(),
  birthCountry: varchar("birthCountry", { length: 255 }).notNull(),
  // Resolved geolocation
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  timezoneId: varchar("timezoneId", { length: 128 }),
  timezoneOffset: double("timezoneOffset"),
  // RGP Engine Output (JSON columns stored as text)
  /** Full 9-position Prime Stack array */
  primeStack: text("primeStack"),
  /** 9-Centers activation map */
  ninecenters: text("ninecenters"),
  fractalRole: varchar("fractalRole", { length: 128 }),
  authorityNode: varchar("authorityNode", { length: 128 }),
  vrcType: varchar("vrcType", { length: 128 }),
  vrcAuthority: varchar("vrcAuthority", { length: 128 }),
  /** Circuit activation links (JSON) */
  circuitLinks: text("circuitLinks"),
  baseCoherence: int("baseCoherence"),
  /** Coherence trajectory data (JSON) */
  coherenceTrajectory: text("coherenceTrajectory"),
  /** Micro-correction recommendations (JSON) */
  microCorrections: text("microCorrections"),
  /** Raw planetary positions from ephemeris (JSON) */
  ephemerisData: text("ephemerisData"),
  /** House cusps, ASC, MC (JSON) */
  houses: text("houses"),
  /** ORIEL's diagnostic narration */
  diagnosticTransmission: text("diagnosticTransmission"),
  /** Core Codon Engine: 3 dominant + 3 supporting codons (JSON) */
  coreCodonEngine: text("coreCodonEngine"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StaticSignature = typeof staticSignatures.$inferSelect;
export type InsertStaticSignature = typeof staticSignatures.$inferInsert;

// ============================================================================
// BETTER AUTH TABLES
// ============================================================================

/**
 * Better Auth session table — manages active user sessions.
 * Replaces the old JWT-based session system.
 */
export const baSession = mysqlTable("ba_session", {
  id: varchar("id", { length: 36 }).primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: varchar("userId", { length: 36 }).notNull(),
});

/**
 * Better Auth account table — links users to auth providers.
 * Stores Google OAuth, email+password, phone credentials.
 */
export const baAccount = mysqlTable("ba_account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: varchar("accountId", { length: 255 }).notNull(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  userId: varchar("userId", { length: 36 }).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Better Auth user table — separate from the legacy `users` table.
 * Bridged to our `users` table by email after authentication.
 */
export const baUser = mysqlTable("ba_user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  phoneNumberVerified: boolean("phoneNumberVerified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Better Auth verification table — stores OTP codes and verification tokens.
 */
export const baVerification = mysqlTable("ba_verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});
