import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const connectedAccountsTable = pgTable("connected_accounts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(),
  emailAddress: text("email_address").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("CONNECTED"),
  encryptedTokens: text("encrypted_tokens"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InsertAccount = typeof connectedAccountsTable.$inferInsert;
export type ConnectedAccount = typeof connectedAccountsTable.$inferSelect;
