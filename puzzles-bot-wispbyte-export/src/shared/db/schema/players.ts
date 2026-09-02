import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const rankingPlayersTable = pgTable("ranking_players", {
  id: serial("id").primaryKey(),
  discordUserId: text("discord_user_id").notNull().unique(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RankingPlayer = typeof rankingPlayersTable.$inferSelect;