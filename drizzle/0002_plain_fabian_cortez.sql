ALTER TABLE `users` ADD `conduitId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('free','active','cancelled','expired') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `paypalSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionRenewalDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_conduitId_unique` UNIQUE(`conduitId`);