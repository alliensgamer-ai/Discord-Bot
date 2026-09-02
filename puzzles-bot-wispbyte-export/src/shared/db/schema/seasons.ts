import { boolean, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { rankingPlayersTable } from "./players";

export const rankingSeasonsTable = pgTable("ranking_seasons", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const rankingSeasonPlayersTable = pgTable("ranking_season_players", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id")
    .notNull()
    .references(() => rankingSeasonsTable.id, { onDelete: "cascade" }),
  playerId: integer("player_id")
    .notNull()
    .references(() => rankingPlayersTable.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  points: integer("points").notNull().default(0),
  salasPlayed: integer("salas_played").notNull().default(0),
  mvpCount: integer("mvp_count").notNull().default(0),
  secondPlaceCount: integer("second_place_count").notNull().default(0),
  thirdPlaceCount: integer("third_place_count").notNull().default(0),
  lastPlaceCount: integer("last_place_count").notNull().default(0),
  compePlayed: integer("compe_played").notNull().default(0),
  guerraPlayed: integer("guerra_played").notNull().default(0),
  vv2Played: integer("vv2_played").notNull().default(0),
  activityCount: integer("activity_count").notNull().default(0),
  activityPoints: integer("activity_points").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueSeasonPlayer: uniqueIndex("ranking_season_players_unique_player").on(
    table.seasonId,
    table.playerId,
  ),
}));