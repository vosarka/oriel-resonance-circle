import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
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
 * Chat messages for ORIEL interface
 * Stores conversation history for each user
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Response quality metrics for diagnostic dashboard
 * Tracks duplication, completeness, and focus scores for each ORIEL response
 */
export const responseMetrics = mysqlTable("responseMetrics", {
  id: int("id").autoincrement().primaryKey(),
  chatMessageId: int("chatMessageId").notNull(),
  userId: int("userId"),
  userMessage: text("userMessage").notNull(),
  response: text("response").notNull(),
  // Duplication metrics
  isDuplicate: boolean("isDuplicate").notNull().default(false),
  duplicateSimilarity: decimal("duplicateSimilarity", { precision: 5, scale: 4 }).default("0"),
  // Completeness metrics
  isComplete: boolean("isComplete").notNull().default(true),
  completenessScore: decimal("completenessScore", { precision: 5, scale: 4 }).default("1"),
  completenessIssues: text("completenessIssues"),
  // Focus metrics
  isFocused: boolean("isFocused").notNull().default(true),
  focusScore: decimal("focusScore", { precision: 5, scale: 4 }).default("1"),
  focusIssues: text("focusIssues"),
  // Overall quality
  isValid: boolean("isValid").notNull().default(true),
  qualityIssues: text("qualityIssues"),
  qualityWarnings: text("qualityWarnings"),
  // Metadata
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResponseMetric = typeof responseMetrics.$inferSelect;
export type InsertResponseMetric = typeof responseMetrics.$inferInsert;
