import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { rankingPlayersTable } from "./players";
import { rankingSeasonsTable } from "./seasons";

export const salasTable = pgTable(
  "ranking_salas",
  {
    id: serial("id").primaryKey(),
    guildId: text("guild_id").notNull(),
    seasonId: integer("season_id").references(() => rankingSeasonsTable.id),
    externalId: text("external_id"),
    registeredById: text("registered_by_id").notNull(),
    registeredByName: text("registered_by_name").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueExternalId: uniqueIndex("ranking_salas_unique_external_id").on(
      table.guildId,
      table.seasonId,
      table.externalId,
    ),
  }),
);

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