CREATE TABLE `transmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`txId` varchar(64) NOT NULL,
	`txNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`tags` text NOT NULL,
	`microSigil` varchar(64) NOT NULL,
	`centerPrompt` text NOT NULL,
	`excerpt` text NOT NULL,
	`directive` text NOT NULL,
	`cycle` varchar(64) NOT NULL DEFAULT 'FOUNDATION ARC',
	`status` enum('Draft','Confirmed','Deprecated','Mythic') NOT NULL DEFAULT 'Confirmed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transmissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transmissions_txId_unique` UNIQUE(`txId`),
	CONSTRAINT `transmissions_txNumber_unique` UNIQUE(`txNumber`)
);
