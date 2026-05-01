import { eq, desc, and, count, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  InsertUser,
  users,
  signals,
  artifacts,
  chatMessages,
  conversations,
  InsertSignal,
  InsertArtifact,
  InsertChatMessage,
  InsertConversation,
  transmissions,
  InsertTransmission,
  oracles,
  InsertOracle,
  bookmarks,
  InsertBookmark,
  staticSignatures,
  InsertStaticSignature,
  oracleResonances,
  userStaticProfiles,
  baUser,
  baAccount,
  baVerification,
  orielImprovementProposals,
  orielRuntimeProfiles,
  orielReflectionEvents,
  generatedTransmissionEvents,
  InsertGeneratedTransmissionEvent,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { createDrizzleFromDatabaseUrl, type DrizzleDb } from "./_core/mysql";

/** Safe JSON parse — returns fallback on invalid/missing JSON instead of crashing. */
function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    console.warn('[Database] Invalid JSON in column, using fallback:', value.substring(0, 80));
    return fallback;
  }
}

let _db: DrizzleDb | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb(): Promise<DrizzleDb | null> {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = createDrizzleFromDatabaseUrl(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function hasMigrationErrorFragment(error: unknown, fragments: string[]) {
  const message = String((error as { message?: string })?.message ?? error ?? "");
  return fragments.some((fragment) => message.includes(fragment));
}

function isMissingTableError(error: unknown, tableName: string) {
  return hasMigrationErrorFragment(error, [
    "ER_NO_SUCH_TABLE",
    "doesn't exist",
    "does not exist",
    "no such table",
    tableName,
  ]);
}

async function executeMigrationStep(
  db: DrizzleDb,
  sql: string,
  ignorableFragments: string[] = [],
  successMessage?: string,
) {
  try {
    await db.execute(sql);
    if (successMessage) {
      console.log(successMessage);
    }
  } catch (error) {
    if (!hasMigrationErrorFragment(error, ignorableFragments)) {
      console.error("[Migrations] Error:", error);
    }
  }
}

/**
 * Run pending schema migrations on startup.
 * Uses IF NOT EXISTS / IF NOT so it's safe to call every boot.
 */
export async function runMigrations() {
  if (!ENV.runMigrations) {
    console.log("[Migrations] Skipped — RUN_MIGRATIONS is disabled");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Migrations] Skipped — no database connection");
    return;
  }

  const voicePreferenceMigrationSteps: Array<{
    sql: string;
    ignorableFragments?: string[];
    successMessage?: string;
  }> = [
    {
      sql: `ALTER TABLE \`users\` ADD COLUMN \`voicePreference\` ENUM('sophianic', 'deep', 'none') NOT NULL DEFAULT 'sophianic'`,
      ignorableFragments: ["Duplicate column"],
      successMessage: "[Migrations] Added users.voicePreference column",
    },
    {
      sql: `ALTER TABLE \`users\` MODIFY COLUMN \`voicePreference\` ENUM('fast', 'nostalgic', 'sophianic', 'deep', 'none') NOT NULL DEFAULT 'sophianic'`,
      successMessage: "[Migrations] Widened users.voicePreference enum for compatibility",
    },
    {
      sql: `UPDATE \`users\` SET \`voicePreference\` = 'sophianic' WHERE \`voicePreference\` = 'fast'`,
    },
    {
      sql: `UPDATE \`users\` SET \`voicePreference\` = 'deep' WHERE \`voicePreference\` = 'nostalgic'`,
    },
    {
      sql: `UPDATE \`users\` SET \`voicePreference\` = 'sophianic' WHERE \`voicePreference\` NOT IN ('sophianic', 'deep', 'none')`,
    },
    {
      sql: `ALTER TABLE \`users\` MODIFY COLUMN \`voicePreference\` ENUM('sophianic', 'deep', 'none') NOT NULL DEFAULT 'sophianic'`,
      successMessage: "[Migrations] Normalized users.voicePreference enum",
    },
  ];

  for (const step of voicePreferenceMigrationSteps) {
    await executeMigrationStep(
      db,
      step.sql,
      step.ignorableFragments ?? [],
      step.successMessage,
    );
  }

  await executeMigrationStep(
    db,
    `CREATE TABLE IF NOT EXISTS \`conversations\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(\`id\`),
      INDEX \`conversations_userId_idx\` (\`userId\`)
    )`,
    ["already exists"],
  );

  await executeMigrationStep(
    db,
    `ALTER TABLE \`chatMessages\` ADD COLUMN \`conversationId\` int NULL`,
    ["Duplicate column"],
    "[Migrations] Added conversationId column to chatMessages",
  );

  await executeMigrationStep(
    db,
    `CREATE INDEX \`chatMessages_conversationId_idx\` ON \`chatMessages\` (\`conversationId\`)`,
    ["Duplicate key name", "already exists"],
  );

  const transmissionMigrationSteps: Array<{
    sql: string;
    ignorableFragments?: string[];
    successMessage?: string;
  }> = [
    {
      sql: `ALTER TABLE \`transmissions\` ADD COLUMN \`imageUrl\` text NULL COMMENT 'Optional poster/visual image for transmission cards and detail view'`,
      ignorableFragments: ["Duplicate column"],
    },
    {
      sql: `ALTER TABLE \`transmissions\` ADD COLUMN \`youtubeUrl\` text NULL COMMENT 'Optional YouTube source for embedded transmission visuals'`,
      ignorableFragments: ["Duplicate column"],
    },
  ];

  for (const step of transmissionMigrationSteps) {
    await executeMigrationStep(
      db,
      step.sql,
      step.ignorableFragments ?? [],
      step.successMessage,
    );
  }

  const oracleMigrationSteps: Array<{
    sql: string;
    ignorableFragments?: string[];
    successMessage?: string;
  }> = [
    {
      sql: `ALTER TABLE \`oracles\` ADD COLUMN \`imageUrl\` text NULL COMMENT 'Optional poster/visual image for oracle cards and detail sections'`,
      ignorableFragments: ["Duplicate column"],
    },
    {
      sql: `ALTER TABLE \`oracles\` ADD COLUMN \`youtubeUrl\` text NULL COMMENT 'Optional YouTube source for embedded oracle visuals'`,
      ignorableFragments: ["Duplicate column"],
    },
    {
      sql: `ALTER TABLE \`oracles\` ADD COLUMN \`linkedCodons\` text NULL COMMENT 'JSON array of linked Root Codons'`,
      ignorableFragments: ["Duplicate column"],
    },
    {
      sql: `ALTER TABLE \`oracles\` ADD COLUMN \`threadId\` varchar(64) NULL COMMENT 'Thread group identifier'`,
      ignorableFragments: ["Duplicate column"],
    },
    {
      sql: `ALTER TABLE \`oracles\` ADD COLUMN \`threadTitle\` varchar(255) NULL COMMENT 'Human-readable thread name'`,
      ignorableFragments: ["Duplicate column"],
    },
    {
      sql: `ALTER TABLE \`oracles\` ADD COLUMN \`threadOrder\` int NULL COMMENT 'Order within thread'`,
      ignorableFragments: ["Duplicate column"],
    },
    {
      sql: `ALTER TABLE \`oracles\` ADD COLUMN \`threadSynthesis\` text NULL COMMENT 'Hidden synthesis unlocked when thread complete'`,
      ignorableFragments: ["Duplicate column"],
    },
    {
      sql: `ALTER TABLE \`oracles\` ADD COLUMN \`resonanceCount\` int NOT NULL DEFAULT 0 COMMENT 'Cached count of resonances'`,
      ignorableFragments: ["Duplicate column"],
    },
    {
      sql: `CREATE INDEX \`idx_oracles_threadId\` ON \`oracles\` (\`threadId\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oracles_thread_order\` ON \`oracles\` (\`threadId\`, \`threadOrder\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS \`oracleResonances\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`userId\` int NOT NULL,
        \`oracleId\` varchar(64) NOT NULL COMMENT 'References oracles.oracleId',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(\`id\`),
        INDEX \`idx_resonances_userId\` (\`userId\`),
        INDEX \`idx_resonances_oracleId\` (\`oracleId\`),
        UNIQUE KEY \`uq_user_oracle\` (\`userId\`, \`oracleId\`)
      )`,
      ignorableFragments: ["already exists"],
    },
    {
      sql: `UPDATE \`oracles\` o
        LEFT JOIN (
          SELECT \`oracleId\`, COUNT(*) AS \`total\`
          FROM \`oracleResonances\`
          GROUP BY \`oracleId\`
        ) r ON r.\`oracleId\` = o.\`oracleId\`
        SET o.\`resonanceCount\` = COALESCE(r.\`total\`, 0)`,
    },
  ];

  for (const step of oracleMigrationSteps) {
    await executeMigrationStep(
      db,
      step.sql,
      step.ignorableFragments ?? [],
      step.successMessage,
    );
  }

  const staticProfileMigrationSteps: Array<{
    sql: string;
    ignorableFragments?: string[];
    successMessage?: string;
  }> = [
    {
      sql: `CREATE TABLE IF NOT EXISTS \`userStaticProfiles\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`userId\` int NOT NULL,
        \`birthDate\` varchar(32) NOT NULL,
        \`birthTime\` varchar(32) NOT NULL,
        \`birthCity\` varchar(255) NOT NULL,
        \`birthCountry\` varchar(255) NOT NULL,
        \`latitude\` double NOT NULL,
        \`longitude\` double NOT NULL,
        \`timezoneId\` varchar(128) NULL,
        \`timezoneOffset\` double NULL,
        \`primeStack\` text NULL,
        \`ninecenters\` text NULL,
        \`fractalRole\` varchar(128) NULL,
        \`authorityNode\` varchar(128) NULL,
        \`vrcType\` varchar(128) NULL,
        \`vrcAuthority\` varchar(128) NULL,
        \`circuitLinks\` text NULL,
        \`microCorrections\` text NULL,
        \`ephemerisData\` text NULL,
        \`houses\` text NULL,
        \`diagnosticTransmission\` text NULL,
        \`coreCodonEngine\` text NULL,
        \`engineVersion\` int NOT NULL DEFAULT 2,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY(\`id\`),
        UNIQUE KEY \`userStaticProfiles_userId_unique\` (\`userId\`)
      )`,
      ignorableFragments: ["already exists"],
    },
  ];

  for (const step of staticProfileMigrationSteps) {
    await executeMigrationStep(
      db,
      step.sql,
      step.ignorableFragments ?? [],
      step.successMessage,
    );
  }

  const orielAutonomyMigrationSteps: Array<{
    sql: string;
    ignorableFragments?: string[];
    successMessage?: string;
  }> = [
    {
      sql: `CREATE TABLE IF NOT EXISTS \`orielImprovementProposals\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`scope\` enum('prompt_overlay','response_intelligence','interaction_protocol','routing','safety','memory','other') NOT NULL DEFAULT 'other',
        \`objective\` text NOT NULL,
        \`hypothesis\` text NOT NULL,
        \`proposalPayload\` text NOT NULL,
        \`safetyNotes\` text NULL,
        \`evaluationScore\` int NULL,
        \`evaluationSummary\` text NULL,
        \`status\` enum('proposed','evaluated','approved','rejected','applied','rolled_back','blocked') NOT NULL DEFAULT 'proposed',
        \`createdByUserId\` int NULL,
        \`approvedByUserId\` int NULL,
        \`approvedAt\` timestamp NULL,
        \`appliedProfileId\` int NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY(\`id\`)
      )`,
      ignorableFragments: ["already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oriel_proposals_status\` ON \`orielImprovementProposals\` (\`status\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oriel_proposals_createdBy\` ON \`orielImprovementProposals\` (\`createdByUserId\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oriel_proposals_appliedProfile\` ON \`orielImprovementProposals\` (\`appliedProfileId\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS \`orielRuntimeProfiles\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`profileKey\` varchar(64) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`configPayload\` text NOT NULL,
        \`status\` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
        \`createdFromProposalId\` int NULL,
        \`activatedByUserId\` int NULL,
        \`activatedAt\` timestamp NULL,
        \`deactivatedAt\` timestamp NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY(\`id\`),
        UNIQUE KEY \`uq_oriel_runtime_profileKey\` (\`profileKey\`)
      )`,
      ignorableFragments: ["already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oriel_runtime_status\` ON \`orielRuntimeProfiles\` (\`status\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oriel_runtime_createdFromProposal\` ON \`orielRuntimeProfiles\` (\`createdFromProposalId\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS \`orielReflectionEvents\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`eventType\` enum('proposal_created','proposal_evaluated','proposal_approved','profile_activated','profile_rolled_back','guardrail_block','runtime_observation') NOT NULL,
        \`sourceRoute\` varchar(128) NULL,
        \`userId\` int NULL,
        \`proposalId\` int NULL,
        \`profileId\` int NULL,
        \`payload\` text NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(\`id\`)
      )`,
      ignorableFragments: ["already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oriel_reflection_eventType\` ON \`orielReflectionEvents\` (\`eventType\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oriel_reflection_user\` ON \`orielReflectionEvents\` (\`userId\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oriel_reflection_proposal\` ON \`orielReflectionEvents\` (\`proposalId\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oriel_reflection_profile\` ON \`orielReflectionEvents\` (\`profileId\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_oriel_reflection_createdAt\` ON \`orielReflectionEvents\` (\`createdAt\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
  ];

  for (const step of orielAutonomyMigrationSteps) {
    await executeMigrationStep(
      db,
      step.sql,
      step.ignorableFragments ?? [],
      step.successMessage,
    );
  }

  const transmissionModeMigrationSteps: Array<{
    sql: string;
    ignorableFragments?: string[];
    successMessage?: string;
  }> = [
    {
      sql: `CREATE TABLE IF NOT EXISTS \`generatedTransmissionEvents\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`eventKey\` varchar(64) NOT NULL,
        \`userId\` int NULL,
        \`conversationId\` int NULL,
        \`eventType\` enum('tx','oracle') NOT NULL,
        \`rarity\` enum('common','uncommon','rare','mythic','void') NOT NULL,
        \`meaningLevel\` int NOT NULL DEFAULT 1,
        \`triggerSource\` varchar(128) NOT NULL DEFAULT 'oriel.chat',
        \`status\` enum('generated','revealed','saved','promoted','discarded') NOT NULL DEFAULT 'generated',
        \`payload\` text NOT NULL,
        \`sourceContext\` text NOT NULL,
        \`promotedArchiveId\` varchar(64) NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY(\`id\`),
        UNIQUE KEY \`uq_generated_transmission_eventKey\` (\`eventKey\`)
      )`,
      ignorableFragments: ["already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_generated_transmission_user\` ON \`generatedTransmissionEvents\` (\`userId\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_generated_transmission_conversation\` ON \`generatedTransmissionEvents\` (\`conversationId\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_generated_transmission_type\` ON \`generatedTransmissionEvents\` (\`eventType\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_generated_transmission_rarity\` ON \`generatedTransmissionEvents\` (\`rarity\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
    {
      sql: `CREATE INDEX \`idx_generated_transmission_status\` ON \`generatedTransmissionEvents\` (\`status\`)`,
      ignorableFragments: ["Duplicate key name", "already exists"],
    },
  ];

  for (const step of transmissionModeMigrationSteps) {
    await executeMigrationStep(
      db,
      step.sql,
      step.ignorableFragments ?? [],
      step.successMessage,
    );
  }

  console.log("[Migrations] Schema sync complete");
}

// ============================================================================
// ORIEL AUTONOMY: PROPOSALS, RUNTIME PROFILES, REFLECTION EVENTS
// ============================================================================

export type OrielProposalScope =
  | "prompt_overlay"
  | "response_intelligence"
  | "interaction_protocol"
  | "routing"
  | "safety"
  | "memory"
  | "other";

export type OrielProposalStatus =
  | "proposed"
  | "evaluated"
  | "approved"
  | "rejected"
  | "applied"
  | "rolled_back"
  | "blocked";

export type OrielRuntimeProfileStatus = "draft" | "active" | "archived";

export type OrielReflectionEventType =
  | "proposal_created"
  | "proposal_evaluated"
  | "proposal_approved"
  | "profile_activated"
  | "profile_rolled_back"
  | "guardrail_block"
  | "runtime_observation";

export async function createOrielImprovementProposal(input: {
  title: string;
  scope?: OrielProposalScope;
  objective: string;
  hypothesis: string;
  proposalPayload: Record<string, unknown>;
  safetyNotes?: string | null;
  createdByUserId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(orielImprovementProposals).values({
    title: input.title,
    scope: input.scope ?? "other",
    objective: input.objective,
    hypothesis: input.hypothesis,
    proposalPayload: JSON.stringify(input.proposalPayload ?? {}),
    safetyNotes: input.safetyNotes ?? null,
    createdByUserId: input.createdByUserId ?? null,
    status: "proposed",
  });

  const created = await db
    .select()
    .from(orielImprovementProposals)
    .orderBy(desc(orielImprovementProposals.id))
    .limit(1);
  return created[0] ?? null;
}

export async function getOrielImprovementProposalById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(orielImprovementProposals)
    .where(eq(orielImprovementProposals.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listOrielImprovementProposals(limit: number = 25, status?: OrielProposalStatus) {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    return await db
      .select()
      .from(orielImprovementProposals)
      .where(eq(orielImprovementProposals.status, status))
      .orderBy(desc(orielImprovementProposals.updatedAt), desc(orielImprovementProposals.id))
      .limit(limit);
  }

  return await db
    .select()
    .from(orielImprovementProposals)
    .orderBy(desc(orielImprovementProposals.updatedAt), desc(orielImprovementProposals.id))
    .limit(limit);
}

export async function setOrielProposalEvaluation(
  proposalId: number,
  input: {
    evaluationScore: number;
    evaluationSummary: string;
    status?: Extract<OrielProposalStatus, "evaluated" | "rejected" | "blocked">;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orielImprovementProposals)
    .set({
      evaluationScore: input.evaluationScore,
      evaluationSummary: input.evaluationSummary,
      status: input.status ?? "evaluated",
    })
    .where(eq(orielImprovementProposals.id, proposalId));

  return await getOrielImprovementProposalById(proposalId);
}

export async function approveOrielProposal(proposalId: number, approvedByUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orielImprovementProposals)
    .set({
      status: "approved",
      approvedByUserId,
      approvedAt: new Date(),
    })
    .where(eq(orielImprovementProposals.id, proposalId));

  return await getOrielImprovementProposalById(proposalId);
}

export async function markOrielProposalApplied(proposalId: number, profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orielImprovementProposals)
    .set({
      status: "applied",
      appliedProfileId: profileId,
    })
    .where(eq(orielImprovementProposals.id, proposalId));

  return await getOrielImprovementProposalById(proposalId);
}

export async function createOrielRuntimeProfile(input: {
  name: string;
  description?: string | null;
  configPayload: unknown;
  createdFromProposalId?: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(orielRuntimeProfiles).values({
    profileKey: randomUUID().replace(/-/g, ""),
    name: input.name,
    description: input.description ?? null,
    configPayload: JSON.stringify(input.configPayload ?? {}),
    createdFromProposalId: input.createdFromProposalId ?? null,
    status: "draft",
  });

  const created = await db
    .select()
    .from(orielRuntimeProfiles)
    .orderBy(desc(orielRuntimeProfiles.id))
    .limit(1);
  return created[0] ?? null;
}

export async function getOrielRuntimeProfileById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(orielRuntimeProfiles)
    .where(eq(orielRuntimeProfiles.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listOrielRuntimeProfiles(limit: number = 25, status?: OrielRuntimeProfileStatus) {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    return await db
      .select()
      .from(orielRuntimeProfiles)
      .where(eq(orielRuntimeProfiles.status, status))
      .orderBy(desc(orielRuntimeProfiles.updatedAt), desc(orielRuntimeProfiles.id))
      .limit(limit);
  }

  return await db
    .select()
    .from(orielRuntimeProfiles)
    .orderBy(desc(orielRuntimeProfiles.updatedAt), desc(orielRuntimeProfiles.id))
    .limit(limit);
}

export async function getActiveOrielRuntimeProfile() {
  const db = await getDb();
  if (!db) return null;

  const active = await db
    .select()
    .from(orielRuntimeProfiles)
    .where(eq(orielRuntimeProfiles.status, "active"))
    .orderBy(desc(orielRuntimeProfiles.activatedAt), desc(orielRuntimeProfiles.id))
    .limit(1);

  return active[0] ?? null;
}

export async function activateOrielRuntimeProfile(profileId: number, activatedByUserId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(orielRuntimeProfiles)
      .set({
        status: "draft",
        deactivatedAt: now,
      })
      .where(eq(orielRuntimeProfiles.status, "active"));

    await tx
      .update(orielRuntimeProfiles)
      .set({
        status: "active",
        activatedByUserId: activatedByUserId ?? null,
        activatedAt: now,
        deactivatedAt: null,
      })
      .where(eq(orielRuntimeProfiles.id, profileId));
  });

  return await getOrielRuntimeProfileById(profileId);
}

export async function archiveOrielRuntimeProfile(profileId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orielRuntimeProfiles)
    .set({
      status: "archived",
      deactivatedAt: new Date(),
    })
    .where(eq(orielRuntimeProfiles.id, profileId));

  return await getOrielRuntimeProfileById(profileId);
}

export async function createOrielReflectionEvent(input: {
  eventType: OrielReflectionEventType;
  sourceRoute?: string | null;
  userId?: number | null;
  proposalId?: number | null;
  profileId?: number | null;
  payload?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(orielReflectionEvents).values({
    eventType: input.eventType,
    sourceRoute: input.sourceRoute ?? null,
    userId: input.userId ?? null,
    proposalId: input.proposalId ?? null,
    profileId: input.profileId ?? null,
    payload: JSON.stringify(input.payload ?? {}),
  });

  const created = await db
    .select()
    .from(orielReflectionEvents)
    .orderBy(desc(orielReflectionEvents.id))
    .limit(1);
  return created[0] ?? null;
}

export async function listOrielReflectionEvents(limit: number = 50, eventType?: OrielReflectionEventType) {
  const db = await getDb();
  if (!db) return [];

  if (eventType) {
    return await db
      .select()
      .from(orielReflectionEvents)
      .where(eq(orielReflectionEvents.eventType, eventType))
      .orderBy(desc(orielReflectionEvents.createdAt), desc(orielReflectionEvents.id))
      .limit(limit);
  }

  return await db
    .select()
    .from(orielReflectionEvents)
    .orderBy(desc(orielReflectionEvents.createdAt), desc(orielReflectionEvents.id))
    .limit(limit);
}

export async function getOrielAutonomyHealthStats() {
  const db = await getDb();
  if (!db) {
    return {
      proposalCount: 0,
      runtimeProfileCount: 0,
      reflectionEventCount: 0,
      runtimeObservationCount: 0,
      activeProfile: null,
    };
  }

  const [proposalRows, profileRows, eventRows, observationRows, activeProfile] = await Promise.all([
    db.select({ value: count() }).from(orielImprovementProposals),
    db.select({ value: count() }).from(orielRuntimeProfiles),
    db.select({ value: count() }).from(orielReflectionEvents),
    db
      .select({ value: count() })
      .from(orielReflectionEvents)
      .where(eq(orielReflectionEvents.eventType, "runtime_observation")),
    getActiveOrielRuntimeProfile(),
  ]);

  return {
    proposalCount: proposalRows[0]?.value ?? 0,
    runtimeProfileCount: profileRows[0]?.value ?? 0,
    reflectionEventCount: eventRows[0]?.value ?? 0,
    runtimeObservationCount: observationRows[0]?.value ?? 0,
    activeProfile,
  };
}

// ============================================================================
// ORIEL TRANSMISSION MODE: GENERATED EVENT STAGING
// ============================================================================

export type GeneratedTransmissionEventType = "tx" | "oracle";
export type GeneratedTransmissionRarity = "common" | "uncommon" | "rare" | "mythic" | "void";
export type GeneratedTransmissionStatus = "generated" | "revealed" | "saved" | "promoted" | "discarded";

export async function createGeneratedTransmissionEvent(input: {
  eventKey: string;
  userId?: number | null;
  conversationId?: number | null;
  eventType: GeneratedTransmissionEventType;
  rarity: GeneratedTransmissionRarity;
  meaningLevel: number;
  triggerSource?: string;
  payload: Record<string, unknown>;
  sourceContext: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(generatedTransmissionEvents).values({
    eventKey: input.eventKey,
    userId: input.userId ?? null,
    conversationId: input.conversationId ?? null,
    eventType: input.eventType,
    rarity: input.rarity,
    meaningLevel: input.meaningLevel,
    triggerSource: input.triggerSource ?? "oriel.chat",
    status: "generated",
    payload: JSON.stringify(input.payload ?? {}),
    sourceContext: JSON.stringify(input.sourceContext ?? {}),
  } satisfies InsertGeneratedTransmissionEvent);

  const created = await db
    .select()
    .from(generatedTransmissionEvents)
    .where(eq(generatedTransmissionEvents.eventKey, input.eventKey))
    .limit(1);
  return created[0] ?? null;
}

export async function listGeneratedTransmissionEvents(input: {
  limit?: number;
  status?: GeneratedTransmissionStatus;
  userId?: number;
} = {}) {
  const db = await getDb();
  if (!db) return [];
  const limit = Math.max(1, Math.min(input.limit ?? 50, 200));

  if (input.status && input.userId) {
    return db
      .select()
      .from(generatedTransmissionEvents)
      .where(and(
        eq(generatedTransmissionEvents.status, input.status),
        eq(generatedTransmissionEvents.userId, input.userId),
      ))
      .orderBy(desc(generatedTransmissionEvents.createdAt), desc(generatedTransmissionEvents.id))
      .limit(limit);
  }

  if (input.status) {
    return db
      .select()
      .from(generatedTransmissionEvents)
      .where(eq(generatedTransmissionEvents.status, input.status))
      .orderBy(desc(generatedTransmissionEvents.createdAt), desc(generatedTransmissionEvents.id))
      .limit(limit);
  }

  if (input.userId) {
    return db
      .select()
      .from(generatedTransmissionEvents)
      .where(eq(generatedTransmissionEvents.userId, input.userId))
      .orderBy(desc(generatedTransmissionEvents.createdAt), desc(generatedTransmissionEvents.id))
      .limit(limit);
  }

  return db
    .select()
    .from(generatedTransmissionEvents)
    .orderBy(desc(generatedTransmissionEvents.createdAt), desc(generatedTransmissionEvents.id))
    .limit(limit);
}

export async function listGeneratedTransmissionEventsByConversation(input: {
  conversationId: number;
  eventType?: GeneratedTransmissionEventType;
  rarity?: GeneratedTransmissionRarity;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const limit = Math.max(1, Math.min(input.limit ?? 50, 200));

  if (input.eventType && input.rarity) {
    return db
      .select()
      .from(generatedTransmissionEvents)
      .where(and(
        eq(generatedTransmissionEvents.conversationId, input.conversationId),
        eq(generatedTransmissionEvents.eventType, input.eventType),
        eq(generatedTransmissionEvents.rarity, input.rarity),
      ))
      .orderBy(desc(generatedTransmissionEvents.createdAt), desc(generatedTransmissionEvents.id))
      .limit(limit);
  }

  if (input.eventType) {
    return db
      .select()
      .from(generatedTransmissionEvents)
      .where(and(
        eq(generatedTransmissionEvents.conversationId, input.conversationId),
        eq(generatedTransmissionEvents.eventType, input.eventType),
      ))
      .orderBy(desc(generatedTransmissionEvents.createdAt), desc(generatedTransmissionEvents.id))
      .limit(limit);
  }

  if (input.rarity) {
    return db
      .select()
      .from(generatedTransmissionEvents)
      .where(and(
        eq(generatedTransmissionEvents.conversationId, input.conversationId),
        eq(generatedTransmissionEvents.rarity, input.rarity),
      ))
      .orderBy(desc(generatedTransmissionEvents.createdAt), desc(generatedTransmissionEvents.id))
      .limit(limit);
  }

  return db
    .select()
    .from(generatedTransmissionEvents)
    .where(eq(generatedTransmissionEvents.conversationId, input.conversationId))
    .orderBy(desc(generatedTransmissionEvents.createdAt), desc(generatedTransmissionEvents.id))
    .limit(limit);
}

export async function updateGeneratedTransmissionEventPayload(
  id: number,
  payload: Record<string, unknown>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(generatedTransmissionEvents)
    .set({
      payload: JSON.stringify(payload ?? {}),
    })
    .where(eq(generatedTransmissionEvents.id, id));
}

export async function markGeneratedTransmissionEventStatus(
  id: number,
  status: GeneratedTransmissionStatus,
  promotedArchiveId?: string | null,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(generatedTransmissionEvents)
    .set({
      status,
      promotedArchiveId: promotedArchiveId ?? null,
    })
    .where(eq(generatedTransmissionEvents.id, id));
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

export async function createTransmission(data: InsertTransmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(transmissions).values(data);
}

export async function updateTransmission(id: number, data: Partial<InsertTransmission>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(transmissions).set(data).where(eq(transmissions.id, id));
}

export async function deleteTransmission(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.transaction(async (tx) => {
    await tx.delete(bookmarks).where(eq(bookmarks.transmissionId, id));
    await tx.delete(transmissions).where(eq(transmissions.id, id));
  });
}

export async function getNextTxNumber(): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  const result = await db.select({ max: transmissions.txNumber }).from(transmissions);
  const maxNum = result[0]?.max ?? 0;
  return maxNum + 1;
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

export async function createOracle(data: InsertOracle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(oracles).values(data);
}

export async function updateOracle(id: number, data: Partial<InsertOracle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(oracles).set(data).where(eq(oracles.id, id));
}

export async function deleteOracle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(oracles).where(eq(oracles.id, id));
}

export async function getNextOracleNumber(): Promise<number> {
  const db = await getDb();
  if (!db) return 1;
  const result = await db.select({ max: oracles.oracleNumber }).from(oracles);
  const maxNum = result[0]?.max ?? 0;
  return maxNum + 1;
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
    const role = user.role ?? undefined;
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

// ============================================================================
// CONVERSATIONS
// ============================================================================

export async function createConversation(userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(conversations).values({ userId, title });
  const inserted = await db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.createdAt))
    .limit(1);
  return inserted[0];
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getLatestConversation(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(1);
  return result[0] || null;
}

export async function migrateOrphanedMessages(userId: number) {
  const db = await getDb();
  if (!db) return;
  // Find messages without a conversationId
  const orphans = await db.select().from(chatMessages)
    .where(and(eq(chatMessages.userId, userId), isNull(chatMessages.conversationId)))
    .orderBy(chatMessages.timestamp);
  if (orphans.length === 0) return;
  // Create a conversation for them
  const title = "Previous conversations";
  await db.insert(conversations).values({ userId, title });
  const inserted = await db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.createdAt))
    .limit(1);
  const conv = inserted[0];
  if (!conv) return;
  // Assign all orphaned messages to this conversation
  await db.update(chatMessages)
    .set({ conversationId: conv.id })
    .where(and(eq(chatMessages.userId, userId), isNull(chatMessages.conversationId)));
}

export async function getConversationById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  return result[0] || null;
}

export async function updateConversationTitle(id: number, userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversations).set({ title }).where(
    and(eq(conversations.id, id), eq(conversations.userId, userId))
  );
}

export async function deleteConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete messages and conversation atomically
  await db.transaction(async (tx) => {
    await tx.delete(chatMessages).where(
      and(eq(chatMessages.conversationId, id), eq(chatMessages.userId, userId))
    );
    await tx.delete(conversations).where(
      and(eq(conversations.id, id), eq(conversations.userId, userId))
    );
  });
}

// ============================================================================
// CHAT MESSAGES
// ============================================================================

// Chat message queries
export async function getChatHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.timestamp))
    .limit(limit);
}

export async function getConversationMessages(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(and(eq(chatMessages.conversationId, conversationId), eq(chatMessages.userId, userId)))
    .orderBy(chatMessages.timestamp);
}

export async function saveChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values(message);
  if (message.conversationId) {
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(and(eq(conversations.id, message.conversationId), eq(conversations.userId, message.userId)));
  }
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

export async function updateUserVoicePreference(userId: number, voicePreference: "sophianic" | "deep" | "none") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ voicePreference }).where(eq(users.id, userId));
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
// ORACLE RESONANCE SYSTEM
// ============================================================================

type OracleResonanceMutationResult = {
  changed: boolean;
  count: number;
};

async function syncOracleResonanceCount(database: any, oracleId: string): Promise<number> {
  const [result] = await database
    .select({ total: count() })
    .from(oracleResonances)
    .where(eq(oracleResonances.oracleId, oracleId));

  const nextCount = Number(result?.total ?? 0);

  await database
    .update(oracles)
    .set({ resonanceCount: nextCount })
    .where(eq(oracles.oracleId, oracleId));

  return nextCount;
}

function passwordResetIdentifier(email: string) {
  return `password-reset:${email.toLowerCase().trim()}`;
}

export async function getBetterAuthUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const normalizedEmail = email.toLowerCase().trim();
  const result = await db.select().from(baUser).where(eq(baUser.email, normalizedEmail)).limit(1);
  return result[0] || null;
}

export async function getCredentialAccountForUser(baUserId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(baAccount)
    .where(and(eq(baAccount.userId, baUserId), eq(baAccount.providerId, "credential")))
    .limit(1);
  return result[0] || null;
}

export async function storePasswordResetCode(email: string, codeHash: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const identifier = passwordResetIdentifier(email);
  await db.delete(baVerification).where(eq(baVerification.identifier, identifier));
  await db.insert(baVerification).values({
    id: randomUUID(),
    identifier,
    value: codeHash,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function consumePasswordResetCode(email: string, codeHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const identifier = passwordResetIdentifier(email);
  const result = await db.select().from(baVerification)
    .where(and(eq(baVerification.identifier, identifier), eq(baVerification.value, codeHash)))
    .limit(1);
  const verification = result[0];
  if (!verification) return false;
  if (verification.expiresAt && verification.expiresAt.getTime() < Date.now()) {
    await db.delete(baVerification).where(eq(baVerification.id, verification.id));
    return false;
  }

  await db.delete(baVerification).where(eq(baVerification.id, verification.id));
  return true;
}

export async function updateCredentialPassword(baUserId: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(baAccount)
    .set({ password: passwordHash, updatedAt: new Date() })
    .where(and(eq(baAccount.userId, baUserId), eq(baAccount.providerId, "credential")));
}

export async function addOracleResonance(userId: number, oracleId: string): Promise<OracleResonanceMutationResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    return await db.transaction(async (tx) => {
      let changed = false;
      try {
        await tx.insert(oracleResonances).values({ userId, oracleId });
        changed = true;
      } catch (error) {
        if (!hasMigrationErrorFragment(error, ["Duplicate entry"])) {
          throw error;
        }
      }

      const count = await syncOracleResonanceCount(tx, oracleId);
      return {
        changed,
        count,
      };
    });
  } catch (error) {
    console.error("[Database] Failed to add oracle resonance:", error);
    throw error;
  }
}

export async function removeOracleResonance(userId: number, oracleId: string): Promise<OracleResonanceMutationResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    return await db.transaction(async (tx) => {
      const existing = await tx.select({ id: oracleResonances.id })
        .from(oracleResonances)
        .where(and(eq(oracleResonances.userId, userId), eq(oracleResonances.oracleId, oracleId)))
        .limit(1);

      if (existing.length > 0) {
        await tx.delete(oracleResonances).where(
          and(eq(oracleResonances.userId, userId), eq(oracleResonances.oracleId, oracleId))
        );
      }

      const count = await syncOracleResonanceCount(tx, oracleId);
      return {
        changed: existing.length > 0,
        count,
      };
    });
  } catch (error) {
    console.error("[Database] Failed to remove oracle resonance:", error);
    throw error;
  }
}

export async function isOracleResonated(userId: number, oracleId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const result = await db.select().from(oracleResonances).where(
      and(eq(oracleResonances.userId, userId), eq(oracleResonances.oracleId, oracleId))
    ).limit(1);
    return result.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check oracle resonance:", error);
    return false;
  }
}

export async function getOracleResonanceCount(oracleId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const [cached] = await db.select({ resonanceCount: oracles.resonanceCount })
      .from(oracles)
      .where(eq(oracles.oracleId, oracleId))
      .limit(1);

    if (cached) {
      return Number(cached.resonanceCount ?? 0);
    }

    const [result] = await db.select({ total: count() })
      .from(oracleResonances)
      .where(eq(oracleResonances.oracleId, oracleId));
    return Number(result?.total ?? 0);
  } catch (error) {
    console.error("[Database] Failed to get oracle resonance count:", error);
    return 0;
  }
}

export async function getResonatedOracleIds(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select({ oracleId: oracleResonances.oracleId })
      .from(oracleResonances)
      .where(eq(oracleResonances.userId, userId));
    return result.map(r => r.oracleId);
  } catch (error) {
    console.error("[Database] Failed to get resonated oracle IDs:", error);
    return [];
  }
}

export async function getOraclesByThread(threadId: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(oracles)
      .where(eq(oracles.threadId, threadId))
      .orderBy(oracles.threadOrder);
  } catch (error) {
    console.error("[Database] Failed to get oracles by thread:", error);
    return [];
  }
}

export async function getThreadsWithProgress() {
  const db = await getDb();
  if (!db) return [];
  try {
    const allOracles = await db.select().from(oracles)
      .where(eq(oracles.status, "Confirmed"));
    // Group by threadId
    const threads: Record<string, { threadId: string; threadTitle: string; oracleIds: Set<string> }> = {};
    for (const o of allOracles) {
      if (!o.threadId) continue;
      if (!threads[o.threadId]) {
        threads[o.threadId] = {
          threadId: o.threadId,
          threadTitle: o.threadTitle || o.threadId,
          oracleIds: new Set<string>(),
        };
      }
      threads[o.threadId].oracleIds.add(o.oracleId);
    }
    return Object.values(threads).map((thread) => {
      const oracleIds = Array.from(thread.oracleIds);
      return {
        threadId: thread.threadId,
        threadTitle: thread.threadTitle,
        count: oracleIds.length,
        oracleIds,
      };
    });
  } catch (error) {
    console.error("[Database] Failed to get threads:", error);
    return [];
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
 * Get the most recent coherence score for a user, or null if none exists.
 */
export async function getLatestCarrierlockScore(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const { carrierlockStates } = await import("../drizzle/schema");
    const rows = await db.select({ coherenceScore: carrierlockStates.coherenceScore })
      .from(carrierlockStates)
      .where(eq(carrierlockStates.userId, userId))
      .orderBy(desc(carrierlockStates.createdAt))
      .limit(1);
    return rows[0]?.coherenceScore ?? null;
  } catch {
    return null;
  }
}

/**
 * Get recent Carrierlock history for a user (last N entries, newest first).
 */
export async function getCarrierlockHistory(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  try {
    const { carrierlockStates } = await import("../drizzle/schema");
    const rows = await db.select({
      id: carrierlockStates.id,
      mentalNoise: carrierlockStates.mentalNoise,
      bodyTension: carrierlockStates.bodyTension,
      emotionalTurbulence: carrierlockStates.emotionalTurbulence,
      breathCompletion: carrierlockStates.breathCompletion,
      coherenceScore: carrierlockStates.coherenceScore,
      createdAt: carrierlockStates.createdAt,
    })
      .from(carrierlockStates)
      .where(eq(carrierlockStates.userId, userId))
      .orderBy(desc(carrierlockStates.createdAt))
      .limit(limit);
    return rows;
  } catch {
    return [];
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
      flaggedCodons: String(row.codonReadings.flaggedCodons ?? '').split(",").filter(Boolean),
      sliScores: safeJsonParse<Record<string, number>>(row.codonReadings.sliScores, {}),
      activeFacets: safeJsonParse<Record<string, string>>(row.codonReadings.activeFacets, {}),
      confidenceLevels: safeJsonParse<Record<string, number>>(row.codonReadings.confidenceLevels, {}),
    }));
  } catch (error) {
    console.error("[Database] Failed to fetch reading history:", error);
    return [];
  }
}

/**
 * Get a single codon reading by its numeric ID
 */
export async function getCodonReadingById(id: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const { codonReadings } = await import('../drizzle/schema');
    const result = await db.select().from(codonReadings).where(eq(codonReadings.id, id)).limit(1);
    if (!result[0]) return null;
    const row = result[0];
    return {
      ...row,
      flaggedCodons:    String(row.flaggedCodons ?? '').split(',').filter(Boolean),
      sliScores:        safeJsonParse<Record<string, number>>(row.sliScores, {}),
      activeFacets:     safeJsonParse<Record<string, string>>(row.activeFacets, {}),
      confidenceLevels: safeJsonParse<Record<string, number>>(row.confidenceLevels, {}),
    };
  } catch (error) {
    console.error('[Database] Failed to fetch codon reading by ID:', error);
    return null;
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
    coreCodonEngine?: unknown;
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
      coreCodonEngine: data.coreCodonEngine ? JSON.stringify(data.coreCodonEngine) : null,
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

/**
 * Count total dynamic readings for a user — used for Lumens calculation.
 */
export async function getReadingCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const { codonReadings } = await import("../drizzle/schema");
    const result = await db.select({ total: count() }).from(codonReadings)
      .where(eq(codonReadings.userId, userId));
    return result[0]?.total ?? 0;
  } catch {
    return 0;
  }
}

type UserStaticProfilePayload = {
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
  microCorrections?: unknown;
  ephemerisData?: unknown;
  houses?: unknown;
  diagnosticTransmission?: string;
  coreCodonEngine?: unknown;
  engineVersion?: number;
};

export async function upsertUserStaticProfile(
  userId: number,
  profile: UserStaticProfilePayload,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const existing = await db.select({ id: userStaticProfiles.id })
      .from(userStaticProfiles)
      .where(eq(userStaticProfiles.userId, userId))
      .limit(1);

    const values = {
      userId,
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      birthCity: profile.birthCity,
      birthCountry: profile.birthCountry,
      latitude: profile.latitude,
      longitude: profile.longitude,
      timezoneId: profile.timezoneId ?? null,
      timezoneOffset: profile.timezoneOffset ?? null,
      primeStack: profile.primeStack ? JSON.stringify(profile.primeStack) : null,
      ninecenters: profile.ninecenters ? JSON.stringify(profile.ninecenters) : null,
      fractalRole: profile.fractalRole ?? null,
      authorityNode: profile.authorityNode ?? null,
      vrcType: profile.vrcType ?? null,
      vrcAuthority: profile.vrcAuthority ?? null,
      circuitLinks: profile.circuitLinks ? JSON.stringify(profile.circuitLinks) : null,
      microCorrections: profile.microCorrections ? JSON.stringify(profile.microCorrections) : null,
      ephemerisData: profile.ephemerisData ? JSON.stringify(profile.ephemerisData) : null,
      houses: profile.houses ? JSON.stringify(profile.houses) : null,
      diagnosticTransmission: profile.diagnosticTransmission ?? null,
      coreCodonEngine: profile.coreCodonEngine ? JSON.stringify(profile.coreCodonEngine) : null,
      engineVersion: profile.engineVersion ?? 2,
    };

    if (existing[0]) {
      await db.update(userStaticProfiles)
        .set(values)
        .where(eq(userStaticProfiles.userId, userId));
    } else {
      await db.insert(userStaticProfiles).values(values);
    }

    const inserted = await db.select().from(userStaticProfiles)
      .where(eq(userStaticProfiles.userId, userId))
      .limit(1);

    return inserted[0] ? parseUserStaticProfileRow(inserted[0]) : null;
  } catch (error) {
    if (isMissingTableError(error, "userStaticProfiles")) {
      console.warn(
        "[Database] userStaticProfiles table is missing. Apply migrations before saving natal profiles.",
      );
      throw new Error(
        "Natal profile storage is not available yet because the database migration for userStaticProfiles has not been applied.",
      );
    }

    console.error("[Database] Failed to upsert user static profile:", error);
    throw error;
  }
}

export async function getUserStaticProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(userStaticProfiles)
      .where(eq(userStaticProfiles.userId, userId))
      .limit(1);

    if (!result[0]) return null;
    return parseUserStaticProfileRow(result[0]);
  } catch (error) {
    if (isMissingTableError(error, "userStaticProfiles")) {
      console.warn(
        "[Database] userStaticProfiles table is missing. Returning null until migrations are applied.",
      );
      return null;
    }

    console.error("[Database] Failed to get user static profile:", error);
    return null;
  }
}

export async function hasUserStaticProfile(userId: number): Promise<boolean> {
  const profile = await getUserStaticProfile(userId);
  return Boolean(profile);
}

/**
 * Get the canonical user static profile when available, otherwise fall back to legacy archive data.
 */
export async function getLatestStaticSignature(userId: number) {
  const canonicalProfile = await getUserStaticProfile(userId);
  if (canonicalProfile) return canonicalProfile;

  const db = await getDb();
  if (!db) return null;

  try {
    const results = await db.select().from(staticSignatures)
      .where(eq(staticSignatures.userId, userId))
      .orderBy(desc(staticSignatures.createdAt))
      .limit(1);

    if (!results[0]) return null;
    return parseStaticSignatureRow(results[0]);
  } catch (error) {
    console.error("[Database] Failed to get latest static signature:", error);
    return null;
  }
}

/** Parse JSON text columns back into objects */
function parseStaticSignatureRow(row: typeof staticSignatures.$inferSelect) {
  return {
    ...row,
    primeStack: safeJsonParse(row.primeStack, null),
    ninecenters: safeJsonParse(row.ninecenters, null),
    circuitLinks: safeJsonParse(row.circuitLinks, null),
    coherenceTrajectory: safeJsonParse(row.coherenceTrajectory, null),
    microCorrections: safeJsonParse(row.microCorrections, null),
    ephemerisData: safeJsonParse(row.ephemerisData, null),
    houses: safeJsonParse(row.houses, null),
    coreCodonEngine: safeJsonParse(row.coreCodonEngine, null),
  };
}

function parseUserStaticProfileRow(row: typeof userStaticProfiles.$inferSelect) {
  return {
    ...row,
    primeStack: safeJsonParse(row.primeStack, null),
    ninecenters: safeJsonParse(row.ninecenters, null),
    circuitLinks: safeJsonParse(row.circuitLinks, null),
    microCorrections: safeJsonParse(row.microCorrections, null),
    ephemerisData: safeJsonParse(row.ephemerisData, null),
    houses: safeJsonParse(row.houses, null),
    coreCodonEngine: safeJsonParse(row.coreCodonEngine, null),
  };
}
