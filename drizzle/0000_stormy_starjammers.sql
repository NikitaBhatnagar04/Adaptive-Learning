CREATE TABLE `adaptive_settings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`task_duration_seconds` int NOT NULL DEFAULT 60,
	`font_size` text NOT NULL DEFAULT ('medium'),
	`audio_enabled` boolean NOT NULL DEFAULT true,
	`visual_highlights` boolean NOT NULL DEFAULT true,
	`simplified_ui` boolean NOT NULL DEFAULT false,
	`break_frequency_minutes` int NOT NULL DEFAULT 20,
	`color_theme` text NOT NULL DEFAULT ('default'),
	`current_difficulty` int NOT NULL DEFAULT 2,
	CONSTRAINT `adaptive_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`game_type` varchar(255) NOT NULL,
	`difficulty` int NOT NULL DEFAULT 1,
	`score` int,
	`accuracy` float,
	`reaction_time_ms` float,
	`wrong_clicks` int,
	`missed_signals` int,
	`attention_duration` float,
	`hesitation_count` int,
	`adaptive_flags` json,
	`started_at` timestamp DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
