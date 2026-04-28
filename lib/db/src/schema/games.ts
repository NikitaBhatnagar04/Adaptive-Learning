import { pgTable, serial, varchar, text, integer } from 'drizzle-orm/pg-core';

export const gameCategoriesTable = pgTable('game_categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  label: varchar('label', { length: 128 }).notNull(),
  description: text('description'),
  colorHex: varchar('color_hex', { length: 16 }).default('#7c3aed'),
});

export const gamesTable = pgTable('games', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  title: varchar('title', { length: 128 }).notNull(),
  description: text('description'),
  skill: varchar('skill', { length: 64 }),
  iconKey: varchar('icon_key', { length: 64 }),
  colorClass: varchar('color_class', { length: 64 }),
  categoryId: integer('category_id').references(() => gameCategoriesTable.id, { onDelete: 'set null' }),
  thumbnailEmoji: varchar('thumbnail_emoji', { length: 16 }),
  sortOrder: integer('sort_order').notNull().default(0),
});
