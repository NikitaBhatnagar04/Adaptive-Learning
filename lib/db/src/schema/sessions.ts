import {
  pgTable,
  serial,
  varchar,
  integer,
  real,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { usersTable } from './users';

export const sessionsTable = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),

    userId: integer('user_id').references(() => usersTable.id, { onDelete: 'set null' }),

    gameType: varchar('game_type', { length: 255 }).notNull(),

    difficulty: integer('difficulty').notNull().default(1),

    score: integer('score'),
    accuracy: real('accuracy'),
    reactionTimeMs: real('reaction_time_ms'),
    wrongClicks: integer('wrong_clicks'),
    missedSignals: integer('missed_signals'),
    attentionDuration: real('attention_duration'),
    hesitationCount: integer('hesitation_count'),

    adaptiveFlags: jsonb('adaptive_flags'),

    startedAt: timestamp('started_at', { withTimezone: false }).notNull().defaultNow(),

    completedAt: timestamp('completed_at', { withTimezone: false }),
  },
  (t) => ({
    byUser: index('sessions_user_idx').on(t.userId),
    byGame: index('sessions_game_idx').on(t.gameType),
  })
);
