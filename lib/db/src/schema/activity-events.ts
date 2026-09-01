import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { rankingPlayersTable } from "./players";

export const activityEventsTable = pgTable("ranking_activity_events", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => rankingPlayersTable.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(),
  pointsAwarded: integer("points_awarded").notNull(),
  details: text("details"),
  recordedById: text("recorded_by_id").notNull(),
  recordedByName: text("recorded_by_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ActivityEvent = typeof activityEventsTable.$inferSelect;