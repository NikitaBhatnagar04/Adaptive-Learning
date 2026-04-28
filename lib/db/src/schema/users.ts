import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  json,
} from "drizzle-orm/mysql-core";

export const usersTable = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),

  name: varchar("name", { length: 100 }).notNull().unique(),

  avatarEmoji: varchar("avatar_emoji", { length: 16 }).default("🌟"),

  createdAt: timestamp("created_at").notNull().defaultNow(),

  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
});

export const userProfileTable = mysqlTable("user_profile", {
  id: int("id").primaryKey().autoincrement(),

  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .unique(),

  totalStars: int("total_stars").notNull().default(0),

  totalGamesPlayed: int("total_games_played").notNull().default(0),

  strengths: json("strengths"),

  weaknesses: json("weaknesses"),

  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});