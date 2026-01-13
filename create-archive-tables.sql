-- Create transmissions table for TX transmissions
CREATE TABLE IF NOT EXISTS `transmissions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `txId` varchar(64) NOT NULL UNIQUE,
  `txNumber` int NOT NULL UNIQUE,
  `title` varchar(255) NOT NULL,
  `field` varchar(255) NOT NULL,
  `signalClarity` varchar(10) NOT NULL DEFAULT '98.7%',
  `channelStatus` enum('OPEN','RESONANT','COHERENT','PROPHETIC','LIVE') NOT NULL DEFAULT 'OPEN',
  `coreMessage` text NOT NULL,
  `encodedArchetype` text,
  `tags` text NOT NULL,
  `microSigil` varchar(64) NOT NULL,
  `leftPanelPrompt` text,
  `centerPanelPrompt` text,
  `rightPanelPrompt` text,
  `hashtags` text,
  `cycle` varchar(64) NOT NULL DEFAULT 'FOUNDATION ARC',
  `status` enum('Draft','Confirmed','Deprecated','Mythic') NOT NULL DEFAULT 'Confirmed',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create oracles table for ΩX oracle streams
CREATE TABLE IF NOT EXISTS `oracles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `oracleId` varchar(64) NOT NULL,
  `oracleNumber` int NOT NULL,
  `part` enum('Past','Present','Future') NOT NULL,
  `title` varchar(255) NOT NULL,
  `field` varchar(255) NOT NULL,
  `signalClarity` varchar(10) NOT NULL DEFAULT '95.2%',
  `channelStatus` enum('OPEN','RESONANT','PROPHETIC','LIVE') NOT NULL DEFAULT 'OPEN',
  `content` text NOT NULL,
  `currentFieldSignatures` text,
  `encodedTrajectory` text,
  `convergenceZones` text,
  `keyInflectionPoint` text,
  `majorOutcomes` text,
  `visualStyle` varchar(64),
  `hashtags` text,
  `status` enum('Draft','Confirmed','Deprecated','Prophetic') NOT NULL DEFAULT 'Confirmed',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `oracle_part` (`oracleId`, `part`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
