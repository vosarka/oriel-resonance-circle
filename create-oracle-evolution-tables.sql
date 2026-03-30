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
