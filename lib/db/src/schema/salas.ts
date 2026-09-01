import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { rankingPlayersTable } from "./players";

export const salasTable = pgTable("ranking_salas", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  registeredById: text("registered_by_id").notNull(),
  registeredByName: text("registered_by_name").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const salaResultsTable = pgTable("ranking_sala_results", {
  id: serial("id").primaryKey(),
  salaId: integer("sala_id")
    .notNull()
    .references(() => salasTable.id, { onDelete: "cascade" }),
  playerId: integer("player_id")
    .notNull()
    .references(() => rankingPlayersTable.id, { onDelete: "cascade" }),
  placement: text("placement").notNull(),
  pointsAwarded: integer("points_awarded").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Sala = typeof salasTable.$inferSelect;
export type SalaResult = typeof salaResultsTable.$inferSelect;