<<<<<<< HEAD
<<<<<<< HEAD
=======
-- Oracle Stream Evolution: Schema Migration
-- Adds Collective Resonance, Codex-Oracle Bridge, and Oracle Threads

-- 1. Add new fields to oracles table
ALTER TABLE oracles ADD COLUMN linkedCodons TEXT DEFAULT NULL COMMENT 'JSON array of linked Root Codons';
ALTER TABLE oracles ADD COLUMN threadId VARCHAR(64) DEFAULT NULL COMMENT 'Thread group identifier';
ALTER TABLE oracles ADD COLUMN threadTitle VARCHAR(255) DEFAULT NULL COMMENT 'Human-readable thread name';
ALTER TABLE oracles ADD COLUMN threadOrder INT DEFAULT NULL COMMENT 'Order within thread';
ALTER TABLE oracles ADD COLUMN threadSynthesis TEXT DEFAULT NULL COMMENT 'Hidden synthesis unlocked when thread complete';
ALTER TABLE oracles ADD COLUMN resonanceCount INT NOT NULL DEFAULT 0 COMMENT 'Cached count of resonances';

-- 2. Add indexes for thread queries
ALTER TABLE oracles ADD INDEX idx_oracles_threadId (threadId);
ALTER TABLE oracles ADD INDEX idx_oracles_thread_order (threadId, threadOrder);

-- 3. Create oracle resonances table
CREATE TABLE IF NOT EXISTS oracleResonances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  oracleId VARCHAR(64) NOT NULL COMMENT 'References oracles.oracleId',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resonances_userId (userId),
  INDEX idx_resonances_oracleId (oracleId),
  UNIQUE KEY uq_user_oracle (userId, oracleId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
=======
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
-- Oracle Stream Evolution Migration
-- Adds Collective Resonance, Oracle Threads, and Codex-Oracle Bridge features

-- Add new columns to oracles table for Oracle Stream Evolution
ALTER TABLE `oracles` ADD COLUMN `linkedCodons` text COMMENT 'JSON array of linked Root Codons, e.g. ["RC12","RC38","RC51"]' AFTER `hashtags`;
ALTER TABLE `oracles` ADD COLUMN `threadId` varchar(64) COMMENT 'Thread group identifier, e.g. "dissolution-sequence"' AFTER `linkedCodons`;
ALTER TABLE `oracles` ADD COLUMN `threadTitle` varchar(255) COMMENT 'Human-readable thread name' AFTER `threadId`;
ALTER TABLE `oracles` ADD COLUMN `threadOrder` int COMMENT 'Order within thread (1, 2, 3...)' AFTER `threadTitle`;
ALTER TABLE `oracles` ADD COLUMN `threadSynthesis` text COMMENT 'Hidden text that unlocks when all thread parts are read' AFTER `threadOrder`;
ALTER TABLE `oracles` ADD COLUMN `resonanceCount` int NOT NULL DEFAULT 0 COMMENT 'Cached count of resonances' AFTER `threadSynthesis`;

-- Create indexes for oracle threads and queries
CREATE INDEX IF NOT EXISTS `oracles_threadId_threadOrder_idx` ON `oracles` (`threadId`, `threadOrder`);
CREATE INDEX IF NOT EXISTS `oracles_oracleId_idx` ON `oracles` (`oracleId`);

-- Create oracleResonances table for Collective Resonance tracking
CREATE TABLE IF NOT EXISTS `oracleResonances` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `oracleId` varchar(64) NOT NULL COMMENT 'References oracles.oracleId (not the auto-increment id)',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_oracle_resonance` (`userId`, `oracleId`),
  INDEX `oracleResonances_oracleId_idx` (`oracleId`),
  INDEX `oracleResonances_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks which oracles users have resonated with for Collective Resonance';
<<<<<<< HEAD
=======
-- Oracle Stream Evolution: Schema Migration
-- Adds Collective Resonance, Codex-Oracle Bridge, and Oracle Threads

-- 1. Add new fields to oracles table
ALTER TABLE oracles ADD COLUMN linkedCodons TEXT DEFAULT NULL COMMENT 'JSON array of linked Root Codons';
ALTER TABLE oracles ADD COLUMN threadId VARCHAR(64) DEFAULT NULL COMMENT 'Thread group identifier';
ALTER TABLE oracles ADD COLUMN threadTitle VARCHAR(255) DEFAULT NULL COMMENT 'Human-readable thread name';
ALTER TABLE oracles ADD COLUMN threadOrder INT DEFAULT NULL COMMENT 'Order within thread';
ALTER TABLE oracles ADD COLUMN threadSynthesis TEXT DEFAULT NULL COMMENT 'Hidden synthesis unlocked when thread complete';
ALTER TABLE oracles ADD COLUMN resonanceCount INT NOT NULL DEFAULT 0 COMMENT 'Cached count of resonances';

-- 2. Add indexes for thread queries
ALTER TABLE oracles ADD INDEX idx_oracles_threadId (threadId);
ALTER TABLE oracles ADD INDEX idx_oracles_thread_order (threadId, threadOrder);

-- 3. Create oracle resonances table
CREATE TABLE IF NOT EXISTS oracleResonances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  oracleId VARCHAR(64) NOT NULL COMMENT 'References oracles.oracleId',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resonances_userId (userId),
  INDEX idx_resonances_oracleId (oracleId),
  UNIQUE KEY uq_user_oracle (userId, oracleId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
>>>>>>> bc215e8 (feat: Oracle Stream Evolution — Collective Resonance, Codex-Oracle Bridge, Oracle Threads, Visual Separation)
=======
>>>>>>> 343a1891232be1a4a6519ba1a61f5b7baa3b62db
>>>>>>> 367d7bf325c161580135a2385d3ff80d2b173a0d
