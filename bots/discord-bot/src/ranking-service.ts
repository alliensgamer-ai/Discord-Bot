import { db } from "@workspace/db";
import {
  activityEventsTable,
  pointHistoryTable,
  rankingPlayersTable,
  rankingSeasonPlayersTable,
  rankingSeasonsTable,
  salaResultsTable,
  salasTable,
} from "@workspace/db/schema";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import type { SalaPlacement } from "./ranking-rules.js";

export const ACTIVITY_POINTS = 20;

export const activityTypes = [
  "sala",
  "compe",
  "guerra",
  "vv2",
  "honor",
  "juego",
] as const;

export type ActivityType = (typeof activityTypes)[number];

export type SalaPlayerInput = {
  discordUserId: string;
  username: string;
  placement: SalaPlacement;
};

type RankingAdmin = {
  discordUserId: string;
  username: string;
};

type ActivityPlayerInput = {
  discordUserId: string;
  username: string;
};

export async function getOrCreateActiveSeason(guildId: string) {
  const active = await getActiveSeason(guildId);
  if (active) {
    return active;
  }

  const [season] = await db
    .insert(rankingSeasonsTable)
    .values({ guildId, name: "Temporada 1" })
    .returning();

  return season;
}

export async function getActiveSeason(guildId: string) {
  const [season] = await db
    .select()
    .from(rankingSeasonsTable)
    .where(and(eq(rankingSeasonsTable.guildId, guildId), eq(rankingSeasonsTable.isActive, true)))
    .orderBy(desc(rankingSeasonsTable.startedAt))
    .limit(1);

  return season ?? null;
}

export async function createSeason(guildId: string, name: string) {
  const active = await getActiveSeason(guildId);
  if (active) {
    throw new Error(`Ya existe una temporada activa: ${active.name}. Ciérrala antes de crear otra.`);
  }

  const [season] = await db
    .insert(rankingSeasonsTable)
    .values({ guildId, name, isActive: true })
    .returning();

  return season;
}

export async function closeSeason(guildId: string) {
  return db.transaction(async (tx) => {
    const [season] = await tx
      .select()
      .from(rankingSeasonsTable)
      .where(and(eq(rankingSeasonsTable.guildId, guildId), eq(rankingSeasonsTable.isActive, true)))
      .orderBy(desc(rankingSeasonsTable.startedAt))
      .limit(1);

    if (!season) {
      throw new Error("No hay una temporada activa para cerrar.");
    }

    const players = await tx.select().from(rankingPlayersTable);
    const archivedAt = new Date();

    for (const player of players) {
      await tx.insert(rankingSeasonPlayersTable).values({
        seasonId: season.id,
        playerId: player.id,
        username: player.username,
        points: player.points,
        salasPlayed: player.salasPlayed,
        mvpCount: player.mvpCount,
        secondPlaceCount: player.secondPlaceCount,
        thirdPlaceCount: player.thirdPlaceCount,
        lastPlaceCount: player.lastPlaceCount,
        compePlayed: player.compePlayed,
        guerraPlayed: player.guerraPlayed,
        vv2Played: player.vv2Played,
        activityCount: player.activityCount,
        activityPoints: player.activityPoints,
        lastActivityAt: player.lastActivityAt,
        archivedAt,
      });
    }

    await tx
      .update(rankingSeasonsTable)
      .set({ isActive: false, closedAt: archivedAt })
      .where(eq(rankingSeasonsTable.id, season.id));

    const [nextSeason] = await tx
      .insert(rankingSeasonsTable)
      .values({
        guildId,
        name: `Temporada ${season.id + 1}`,
        isActive: true,
      })
      .returning();

    await tx
      .update(rankingPlayersTable)
      .set({
        points: 0,
        salasPlayed: 0,
        mvpCount: 0,
        secondPlaceCount: 0,
        thirdPlaceCount: 0,
        lastPlaceCount: 0,
        compePlayed: 0,
        guerraPlayed: 0,
        vv2Played: 0,
        activityCount: 0,
        activityPoints: 0,
        lastActivityAt: null,
        updatedAt: archivedAt,
      });

    return { closedSeason: season, nextSeason, archivedPlayers: players.length };
  });
}

export async function recordSala(input: {
  guildId: string;
  externalId: string;
  note?: string;
  admin: RankingAdmin;
  players: SalaPlayerInput[];
}) {
  const season = await getOrCreateActiveSeason(input.guildId);

  return db.transaction(async (tx) => {
    const [duplicate] = await tx
      .select({ id: salasTable.id })
      .from(salasTable)
      .where(
        and(
          eq(salasTable.guildId, input.guildId),
          eq(salasTable.seasonId, season.id),
          eq(salasTable.externalId, input.externalId),
        ),
      )
      .limit(1);

    if (duplicate) {
      throw new Error(`La sala "${input.externalId}" ya fue registrada en esta temporada.`);
    }

    const [sala] = await tx
      .insert(salasTable)
      .values({
        guildId: input.guildId,
        seasonId: season.id,
        externalId: input.externalId,
        registeredById: input.admin.discordUserId,
        registeredByName: input.admin.username,
        note: input.note ?? null,
      })
      .returning({ id: salasTable.id });

    const recordedPlayers = [];

    for (const playerInput of input.players) {
      const points = pointsForPlacement(playerInput.placement);
      const [player] = await upsertPlayer(tx, playerInput);

      await addCurrentPlayerStats(tx, player.id, {
        points,
        salasPlayed: 1,
        mvpCount: playerInput.placement === "mvp" ? 1 : 0,
        secondPlaceCount: playerInput.placement === "second" ? 1 : 0,
        thirdPlaceCount: playerInput.placement === "third" ? 1 : 0,
        lastPlaceCount: playerInput.placement === "last" ? 1 : 0,
      });

      await tx.insert(salaResultsTable).values({
        salaId: sala.id,
        playerId: player.id,
        placement: playerInput.placement,
        pointsAwarded: points,
      });

      await tx.insert(pointHistoryTable).values({
        playerId: player.id,
        seasonId: season.id,
        amount: points,
        reason: `Sala ${input.externalId} — ${labelForPlacement(playerInput.placement)}`,
        adminDiscordUserId: input.admin.discordUserId,
        adminUsername: input.admin.username,
        sourceType: "sala",
        sourceId: sala.id,
      });

      recordedPlayers.push({ ...playerInput, points });
    }

    return {
      salaId: sala.id,
      season,
      players: recordedPlayers,
      totalPoints: recordedPlayers.reduce((sum, player) => sum + player.points, 0),
    };
  });
}

export async function recordActivities(input: {
  guildId: string;
  activityType: ActivityType;
  activityKey: string;
  details?: string;
  admin: RankingAdmin;
  players: ActivityPlayerInput[];
  statField?: "compePlayed" | "guerraPlayed" | "vv2Played";
}) {
  const season = await getOrCreateActiveSeason(input.guildId);

  return db.transaction(async (tx) => {
    const recordedPlayers = [];

    for (const playerInput of input.players) {
      const [duplicate] = await tx
        .select({ id: activityEventsTable.id })
        .from(activityEventsTable)
        .where(
          and(
            eq(activityEventsTable.seasonId, season.id),
            eq(activityEventsTable.playerId, await playerIdFor(tx, playerInput)),
            eq(activityEventsTable.activityType, input.activityType),
            eq(activityEventsTable.activityKey, input.activityKey),
          ),
        )
        .limit(1);

      if (duplicate) {
        throw new Error(
          `La actividad "${input.activityKey}" ya fue registrada para ${playerInput.username}. No se hicieron cambios.`,
        );
      }
    }

    for (const playerInput of input.players) {
      const [player] = await upsertPlayer(tx, playerInput);
      const statIncrement = input.statField
        ? { [input.statField]: sql`${rankingPlayersTable[input.statField]} + 1` }
        : {};

      await tx
        .update(rankingPlayersTable)
        .set({
          points: sql`${rankingPlayersTable.points} + ${ACTIVITY_POINTS}`,
          activityCount: sql`${rankingPlayersTable.activityCount} + 1`,
          activityPoints: sql`${rankingPlayersTable.activityPoints} + ${ACTIVITY_POINTS}`,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
          ...statIncrement,
        })
        .where(eq(rankingPlayersTable.id, player.id));

      await tx.insert(activityEventsTable).values({
        playerId: player.id,
        seasonId: season.id,
        activityType: input.activityType,
        activityKey: input.activityKey,
        pointsAwarded: ACTIVITY_POINTS,
        details: input.details ?? null,
        recordedById: input.admin.discordUserId,
        recordedByName: input.admin.username,
      });

      await tx.insert(pointHistoryTable).values({
        playerId: player.id,
        seasonId: season.id,
        amount: ACTIVITY_POINTS,
        reason: `Actividad ${input.activityType} — ${input.activityKey}${input.details ? ` — ${input.details}` : ""}`,
        adminDiscordUserId: input.admin.discordUserId,
        adminUsername: input.admin.username,
        sourceType: "actividad",
        sourceId: null,
      });

      recordedPlayers.push({ ...playerInput, points: ACTIVITY_POINTS });
    }

    return { season, players: recordedPlayers, totalPoints: recordedPlayers.length * ACTIVITY_POINTS };
  });
}

export async function recordManualPoints(input: {
  guildId: string;
  player: ActivityPlayerInput;
  amount: number;
  reason: string;
  admin: RankingAdmin;
}) {
  const season = await getOrCreateActiveSeason(input.guildId);

  return db.transaction(async (tx) => {
    const [player] = await upsertPlayer(tx, input.player);

    await tx
      .update(rankingPlayersTable)
      .set({
        points: sql`${rankingPlayersTable.points} + ${input.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(rankingPlayersTable.id, player.id));

    await tx.insert(pointHistoryTable).values({
      playerId: player.id,
      seasonId: season.id,
      amount: input.amount,
      reason: input.reason,
      adminDiscordUserId: input.admin.discordUserId,
      adminUsername: input.admin.username,
      sourceType: "manual",
      sourceId: null,
    });

    return { season, player, amount: input.amount };
  });
}

export async function getRanking(guildId: string, limit: number, page = 1) {
  const season = await getOrCreateActiveSeason(guildId);
  const players = await db
    .select()
    .from(rankingPlayersTable)
    .orderBy(desc(rankingPlayersTable.points), asc(rankingPlayersTable.username))
    .limit(limit)
    .offset((page - 1) * limit);
  const [{ total }] = await db.select({ total: count() }).from(rankingPlayersTable);

  return { season, players, total: Number(total) };
}

export async function getPlayerByDiscordId(discordUserId: string) {
  const [player] = await db
    .select()
    .from(rankingPlayersTable)
    .where(eq(rankingPlayersTable.discordUserId, discordUserId))
    .limit(1);

  return player ?? null;
}

export async function getPlayerPosition(guildId: string, playerId: number) {
  const { players } = await getRanking(guildId, 100000, 1);
  const position = players.findIndex((player) => player.id === playerId);
  return position === -1 ? null : position + 1;
}

export async function getPlayerHistory(playerId: number) {
  return db
    .select()
    .from(pointHistoryTable)
    .where(eq(pointHistoryTable.playerId, playerId))
    .orderBy(desc(pointHistoryTable.createdAt))
    .limit(15);
}

export async function getActivityHistory(playerId: number) {
  return db
    .select()
    .from(activityEventsTable)
    .where(eq(activityEventsTable.playerId, playerId))
    .orderBy(desc(activityEventsTable.createdAt))
    .limit(15);
}

export async function getSeasons(guildId: string) {
  return db
    .select()
    .from(rankingSeasonsTable)
    .where(eq(rankingSeasonsTable.guildId, guildId))
    .orderBy(desc(rankingSeasonsTable.startedAt));
}

function pointsForPlacement(placement: SalaPlacement) {
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

async function upsertPlayer(tx: any, player: ActivityPlayerInput) {
  return tx
    .insert(rankingPlayersTable)
    .values({
      discordUserId: player.discordUserId,
      username: player.username,
    })
    .onConflictDoUpdate({
      target: rankingPlayersTable.discordUserId,
      set: { username: player.username, updatedAt: new Date() },
    })
    .returning();
}

async function playerIdFor(tx: any, player: ActivityPlayerInput) {
  const [existing] = await tx
    .select({ id: rankingPlayersTable.id })
    .from(rankingPlayersTable)
    .where(eq(rankingPlayersTable.discordUserId, player.discordUserId))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const [created] = await upsertPlayer(tx, player);
  return created.id;
}

async function addCurrentPlayerStats(tx: any, playerId: number, increments: Record<string, number>) {
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  for (const [field, amount] of Object.entries(increments)) {
    const column = rankingPlayersTable[field as keyof typeof rankingPlayersTable];
    if (column) {
      updates[field] = sql`${column} + ${amount}`;
    }
  }

  await tx.update(rankingPlayersTable).set(updates).where(eq(rankingPlayersTable.id, playerId));
}