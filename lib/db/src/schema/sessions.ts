import {
  mysqlTable,
  int,
  varchar,
  float,
  timestamp,
  json,
  index,
} from "drizzle-orm/mysql-core";
import { usersTable } from "./users";

export const sessionsTable = mysqlTable(
  "sessions",
  {
    id: int("id").primaryKey().autoincrement(),

    userId: int("user_id")
  .references(() => usersTable.id, { onDelete: "set null" }),

    gameType: varchar("game_type", { length: 255 }).notNull(),

    difficulty: int("difficulty").notNull().default(1),

    score: int("score"),

    accuracy: float("accuracy"),
    reactionTimeMs: float("reaction_time_ms"),
    attentionDuration: float("attention_duration"),

    wrongClicks: int("wrong_clicks"),
    missedSignals: int("missed_signals"),
    hesitationCount: int("hesitation_count"),

    adaptiveFlags: json("adaptive_flags"),

    startedAt: timestamp("started_at").notNull().defaultNow(),

    completedAt: timestamp("completed_at"),
  },
  (t) => ({
    byUser: index("sessions_user_idx").on(t.userId),
    byGame: index("sessions_game_idx").on(t.gameType),
  })
);