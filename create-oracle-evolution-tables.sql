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
