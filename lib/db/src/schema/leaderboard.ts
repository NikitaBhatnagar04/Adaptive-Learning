import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";
import { usersTable } from "./users";

export const leaderboardTable = mysqlTable(
  "leaderboard_entries",
  {
    id: int("id").primaryKey().autoincrement(),

    userId: int("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    gameType: varchar("game_type", { length: 64 }).notNull(),

    score: int("score").notNull(),

    accuracy: int("accuracy").notNull().default(0),

    difficulty: int("difficulty").notNull().default(1),

    achievedAt: timestamp("achieved_at")
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    byGameScore: index("lb_game_score_idx").on(t.gameType, t.score),
    byUser: index("lb_user_idx").on(t.userId),
  })
);