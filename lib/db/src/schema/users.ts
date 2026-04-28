import { pgTable, serial, varchar, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  avatarEmoji: varchar('avatar_emoji', { length: 16 }).default('🌟'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: false }).notNull().defaultNow(),
});

export const userProfileTable = pgTable('user_profile', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }).unique(),
  totalStars: integer('total_stars').notNull().default(0),
  totalGamesPlayed: integer('total_games_played').notNull().default(0),
  strengths: jsonb('strengths'),
  weaknesses: jsonb('weaknesses'),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});
