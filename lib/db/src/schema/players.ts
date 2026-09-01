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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RankingPlayer = typeof rankingPlayersTable.$inferSelect;