ALTER TABLE `sessions` MODIFY COLUMN `started_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `completed_at` datetime;