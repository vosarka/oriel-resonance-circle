-- Add conversations table and link chatMessages to conversations
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);

-- Add conversationId column to chatMessages (nullable for legacy messages)
ALTER TABLE `chatMessages` ADD COLUMN `conversationId` int NULL;

-- Index for fast conversation lookups
CREATE INDEX `conversations_userId_idx` ON `conversations` (`userId`);
CREATE INDEX `chatMessages_conversationId_idx` ON `chatMessages` (`conversationId`);
