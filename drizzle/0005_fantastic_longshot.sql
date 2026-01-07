CREATE TABLE `orielMemories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`category` enum('identity','preference','pattern','fact','relationship','context') NOT NULL,
	`content` text NOT NULL,
	`importance` int NOT NULL DEFAULT 5,
	`accessCount` int NOT NULL DEFAULT 0,
	`lastAccessed` timestamp NOT NULL DEFAULT (now()),
	`source` enum('conversation','explicit','inferred') NOT NULL DEFAULT 'conversation',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orielMemories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orielUserProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`knownName` varchar(255),
	`summary` text,
	`interests` text,
	`communicationStyle` text,
	`journeyState` text,
	`interactionCount` int NOT NULL DEFAULT 0,
	`lastInteraction` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orielUserProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `orielUserProfiles_userId_unique` UNIQUE(`userId`)
);
