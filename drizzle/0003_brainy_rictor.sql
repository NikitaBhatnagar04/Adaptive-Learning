ALTER TABLE `sessions` MODIFY COLUMN `started_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `completed_at` timestamp;