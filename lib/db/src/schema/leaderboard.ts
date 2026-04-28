import { pgTable, serial, integer, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { usersTable } from './users';

export const leaderboardTable = pgTable(
  'leaderboard_entries',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    gameType: varchar('game_type', { length: 64 }).notNull(),
    score: integer('score').notNull(),
    accuracy: integer('accuracy').notNull().default(0),
    difficulty: integer('difficulty').notNull().default(1),
    achievedAt: timestamp('achieved_at', { withTimezone: false }).notNull().defaultNow(),
  },
  (t) => ({
    byGameScore: index('lb_game_score_idx').on(t.gameType, t.score),
    byUser: index('lb_user_idx').on(t.userId),
  })
);
