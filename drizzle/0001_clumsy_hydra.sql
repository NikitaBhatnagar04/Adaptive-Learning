ALTER TABLE `adaptive_settings` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `adaptive_settings` MODIFY COLUMN `font_size` varchar(50) NOT NULL DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `adaptive_settings` MODIFY COLUMN `color_theme` varchar(50) NOT NULL DEFAULT 'default';