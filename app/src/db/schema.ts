import { date, integer, pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const createdByEnum = pgEnum('created_by', ['joe', 'lydia']);

export const fridgeItems = pgTable('fridge_items', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar().notNull(),
    expiryDate: date().notNull(),
    createdAt: timestamp().notNull(),
    updatedAt: timestamp().notNull(),
    createdBy: createdByEnum().notNull(),
});

export type InsertFridgeItem = typeof fridgeItems.$inferInsert;
export type SelectFridgeItem = typeof fridgeItems.$inferSelect;