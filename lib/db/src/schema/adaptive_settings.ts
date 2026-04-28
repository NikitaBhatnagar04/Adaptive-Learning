import { mysqlTable, int, varchar, boolean } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const adaptiveSettingsTable = mysqlTable("adaptive_settings", {
  id: int("id").primaryKey().autoincrement(),

  userId: int("user_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .unique(),

  taskDurationSeconds: int("task_duration_seconds")
    .notNull()
    .default(60),

  fontSize: varchar("font_size", { length: 50 })
    .notNull()
    .default("medium"),

  audioEnabled: boolean("audio_enabled")
    .notNull()
    .default(true),

  visualHighlights: boolean("visual_highlights")
    .notNull()
    .default(true),

  simplifiedUi: boolean("simplified_ui")
    .notNull()
    .default(false),

  breakFrequencyMinutes: int("break_frequency_minutes")
    .notNull()
    .default(20),

  colorTheme: varchar("color_theme", { length: 50 })
    .notNull()
    .default("default"),

  currentDifficulty: int("current_difficulty")
    .notNull()
    .default(2),
});

export const insertAdaptiveSettingsSchema = createInsertSchema(
  adaptiveSettingsTable
).omit({ id: true });

export type InsertAdaptiveSettings = z.infer<typeof insertAdaptiveSettingsSchema>;
export type AdaptiveSettings = typeof adaptiveSettingsTable.$inferSelect;