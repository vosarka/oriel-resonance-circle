-- Oracle Stream Evolution
-- Adds codon linking, thread metadata, collective resonance, and count backfill.

ALTER TABLE `oracles` ADD COLUMN `linkedCodons` text NULL COMMENT 'JSON array of linked Root Codons';
ALTER TABLE `oracles` ADD COLUMN `threadId` varchar(64) NULL COMMENT 'Thread group identifier';
ALTER TABLE `oracles` ADD COLUMN `threadTitle` varchar(255) NULL COMMENT 'Human-readable thread name';
ALTER TABLE `oracles` ADD COLUMN `threadOrder` int NULL COMMENT 'Order within thread';
ALTER TABLE `oracles` ADD COLUMN `threadSynthesis` text NULL COMMENT 'Hidden synthesis unlocked when thread complete';
ALTER TABLE `oracles` ADD COLUMN `resonanceCount` int NOT NULL DEFAULT 0 COMMENT 'Cached count of resonances';

CREATE INDEX `idx_oracles_threadId` ON `oracles` (`threadId`);
CREATE INDEX `idx_oracles_thread_order` ON `oracles` (`threadId`, `threadOrder`);

CREATE TABLE IF NOT EXISTS `oracleResonances` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `oracleId` varchar(64) NOT NULL COMMENT 'References oracles.oracleId',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(`id`),
  INDEX `idx_resonances_userId` (`userId`),
  INDEX `idx_resonances_oracleId` (`oracleId`),
  UNIQUE KEY `uq_user_oracle` (`userId`, `oracleId`)
);

UPDATE `oracles` o
LEFT JOIN (
  SELECT `oracleId`, COUNT(*) AS `total`
  FROM `oracleResonances`
  GROUP BY `oracleId`
) r ON r.`oracleId` = o.`oracleId`
SET o.`resonanceCount` = COALESCE(r.`total`, 0);
