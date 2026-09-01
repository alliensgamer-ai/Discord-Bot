import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { rankingPlayersTable } from "./players";

export const pointHistoryTable = pgTable("ranking_point_history", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => rankingPlayersTable.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  adminDiscordUserId: text("admin_discord_user_id").notNull(),
  adminUsername: text("admin_username").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: integer("source_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PointHistoryEntry = typeof pointHistoryTable.$inferSelect;