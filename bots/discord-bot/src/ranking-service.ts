import { db } from "@workspace/db";
import {
  activityEventsTable,
  pointHistoryTable,
  rankingPlayersTable,
  salaResultsTable,
  salasTable,
} from "@workspace/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import type { SalaPlacement } from "./ranking-rules.js";

export type SalaPlayerInput = {
  discordUserId: string;
  username: string;
  placement: SalaPlacement;
};

type RankingAdmin = {
  discordUserId: string;
  username: string;
};

export async function recordSala(input: {
  guildId: string;
  note?: string;
  admin: RankingAdmin;
  players: SalaPlayerInput[];
}) {
  return db.transaction(async (tx) => {
    const [sala] = await tx
      .insert(salasTable)
      .values({
        guildId: input.guildId,
        registeredById: input.admin.discordUserId,
        registeredByName: input.admin.username,
        note: input.note ?? null,
      })
      .returning({ id: salasTable.id });

    const recordedPlayers = [];

    for (const playerInput of input.players) {
      const points = pointsForPlacement(playerInput.placement);
      const [player] = await tx
        .insert(rankingPlayersTable)
        .values({
          discordUserId: playerInput.discordUserId,
          username: playerInput.username,
        })
        .onConflictDoUpdate({
          target: rankingPlayersTable.discordUserId,
          set: {
            username: playerInput.username,
            updatedAt: new Date(),
          },
        })
        .returning();

      await tx
        .update(rankingPlayersTable)
        .set({
          points: sql`${rankingPlayersTable.points} + ${points}`,
          salasPlayed: sql`${rankingPlayersTable.salasPlayed} + 1`,
          mvpCount: sql`${rankingPlayersTable.mvpCount} + ${playerInput.placement === "mvp" ? 1 : 0}`,
          secondPlaceCount: sql`${rankingPlayersTable.secondPlaceCount} + ${playerInput.placement === "second" ? 1 : 0}`,
          thirdPlaceCount: sql`${rankingPlayersTable.thirdPlaceCount} + ${playerInput.placement === "third" ? 1 : 0}`,
          lastPlaceCount: sql`${rankingPlayersTable.lastPlaceCount} + ${playerInput.placement === "last" ? 1 : 0}`,
          updatedAt: new Date(),
        })
        .where(eq(rankingPlayersTable.id, player.id));

      await tx.insert(salaResultsTable).values({
        salaId: sala.id,
        playerId: player.id,
        placement: playerInput.placement,
        pointsAwarded: points,
      });

      await tx.insert(pointHistoryTable).values({
        playerId: player.id,
        amount: points,
        reason: `Sala #${sala.id} — ${labelForPlacement(playerInput.placement)}`,
        adminDiscordUserId: input.admin.discordUserId,
        adminUsername: input.admin.username,
        sourceType: "sala",
        sourceId: sala.id,
      });

      recordedPlayers.push({
        ...playerInput,
        points,
      });
    }

    return {
      salaId: sala.id,
      players: recordedPlayers,
      totalPoints: recordedPlayers.reduce((sum, player) => sum + player.points, 0),
    };
  });
}

export async function getRanking(limit: number) {
  return db
    .select()
    .from(rankingPlayersTable)
    .orderBy(desc(rankingPlayersTable.points), asc(rankingPlayersTable.username))
    .limit(limit);
}

export async function getPlayerByDiscordId(discordUserId: string) {
  const [player] = await db
    .select()
    .from(rankingPlayersTable)
    .where(eq(rankingPlayersTable.discordUserId, discordUserId))
    .limit(1);

  return player ?? null;
}

export async function getPlayerHistory(playerId: number) {
  return db
    .select()
    .from(pointHistoryTable)
    .where(eq(pointHistoryTable.playerId, playerId))
    .orderBy(desc(pointHistoryTable.createdAt))
    .limit(10);
}

export async function getActivityHistory(playerId: number) {
  return db
    .select()
    .from(activityEventsTable)
    .where(eq(activityEventsTable.playerId, playerId))
    .orderBy(desc(activityEventsTable.createdAt))
    .limit(10);
}

export function pointsForPlacement(placement: SalaPlacement) {
  return {
    participant: 2,
    mvp: 10,
    second: 5,
    third: 3,
    last: 2,
  }[placement];
}

function labelForPlacement(placement: SalaPlacement) {
  return {
    participant: "Participación",
    mvp: "MVP",
    second: "Segundo lugar",
    third: "Tercer lugar",
    last: "Último lugar",
  }[placement];
}