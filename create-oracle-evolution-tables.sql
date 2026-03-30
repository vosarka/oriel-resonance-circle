-- Oracle Stream Evolution: Schema Migration
-- Manual reference version of drizzle/0010_oracle_stream_evolution.sql

-- 1. Add new fields to oracles table
ALTER TABLE `oracles` ADD COLUMN `linkedCodons` TEXT DEFAULT NULL COMMENT 'JSON array of linked Root Codons';
ALTER TABLE `oracles` ADD COLUMN `threadId` VARCHAR(64) DEFAULT NULL COMMENT 'Thread group identifier';
ALTER TABLE `oracles` ADD COLUMN `threadTitle` VARCHAR(255) DEFAULT NULL COMMENT 'Human-readable thread name';
ALTER TABLE `oracles` ADD COLUMN `threadOrder` INT DEFAULT NULL COMMENT 'Order within thread';
ALTER TABLE `oracles` ADD COLUMN `threadSynthesis` TEXT DEFAULT NULL COMMENT 'Hidden synthesis unlocked when thread complete';
ALTER TABLE `oracles` ADD COLUMN `resonanceCount` INT NOT NULL DEFAULT 0 COMMENT 'Cached count of resonances';

-- 2. Add indexes for thread queries
CREATE INDEX `idx_oracles_threadId` ON `oracles` (`threadId`);
CREATE INDEX `idx_oracles_thread_order` ON `oracles` (`threadId`, `threadOrder`);

-- 3. Create oracle resonances table
CREATE TABLE IF NOT EXISTS `oracleResonances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `oracleId` VARCHAR(64) NOT NULL COMMENT 'References oracles.oracleId',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_resonances_userId` (`userId`),
  INDEX `idx_resonances_oracleId` (`oracleId`),
  UNIQUE KEY `uq_user_oracle` (`userId`, `oracleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Backfill cached resonance counts from existing oracleResonances rows
UPDATE `oracles` o
LEFT JOIN (
  SELECT `oracleId`, COUNT(*) AS `total`
  FROM `oracleResonances`
  GROUP BY `oracleId`
) r ON r.`oracleId` = o.`oracleId`
SET o.`resonanceCount` = COALESCE(r.`total`, 0);
