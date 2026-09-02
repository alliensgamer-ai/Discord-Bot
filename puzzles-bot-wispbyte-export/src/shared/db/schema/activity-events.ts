import { integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { rankingPlayersTable } from "./players";
import { rankingSeasonsTable } from "./seasons";

export const activityEventsTable = pgTable(
  "ranking_activity_events",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => rankingPlayersTable.id, { onDelete: "cascade" }),
    seasonId: integer("season_id").references(() => rankingSeasonsTable.id),
    activityType: text("activity_type").notNull(),
    activityKey: text("activity_key"),
    pointsAwarded: integer("points_awarded").notNull(),
    details: text("details"),
    recordedById: text("recorded_by_id").notNull(),
    recordedByName: text("recorded_by_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueActivity: uniqueIndex("ranking_activity_unique_key").on(
      table.seasonId,
      table.playerId,
      table.activityType,
      table.activityKey,
    ),
  }),
);

export type ActivityEvent = typeof activityEventsTable.$inferSelect;