import {
  EmbedBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type Client,
  type User,
} from "discord.js";
import { commandHelp } from "./commands.js";
import { config } from "./config.js";
import {
  ACTIVITY_POINTS,
  activityTypes,
  closeSeason,
  createSeason,
  getActivityHistory,
  getActiveSeason,
  getPlayerByDiscordId,
  getPlayerHistory,
  getPlayerPosition,
  getRanking,
  getSeasons,
  recordActivities,
  recordManualPoints,
  recordSala,
  type ActivityType,
  type SalaPlayerInput,
} from "./ranking-service.js";
import { placementLabels, type SalaPlacement } from "./ranking-rules.js";

const rankingCommands = new Set([
  "sala",
  "actividad",
  "compe",
  "guerra",
  "vv2",
  "honor",
  "juego",
  "ranking",
  "perfil",
  "historial",
  "puntos",
  "temporada",
  "reset",
  "ayuda",
  "help",
]);

export async function handleCommand(
  interaction: ChatInputCommandInteraction,
  client: Client,
) {
  if (rankingCommands.has(interaction.commandName) && !ensureRankingChannel(interaction)) {
    return;
  }

  switch (interaction.commandName) {
    case "ping":
      await interaction.reply(`Pong. Latencia: ${client.ws.ping} ms.`);
      return;
    case "help":
    case "ayuda":
      await interaction.reply({ embeds: [helpEmbed()] });
      return;
    case "echo":
      await interaction.reply(interaction.options.getString("mensaje", true));
      return;
    case "server":
      await handleServer(interaction);
      return;
    case "sala":
      await handleSala(interaction);
      return;
    case "actividad":
      await handleActivity(interaction);
      return;
    case "compe":
      await handleGroupActivity(interaction, "compe", "compePlayed");
      return;
    case "guerra":
      await handleGroupActivity(interaction, "guerra", "guerraPlayed");
      return;
    case "vv2":
      await handleGroupActivity(interaction, "vv2", "vv2Played");
      return;
    case "honor":
      await handleGroupActivity(interaction, "honor");
      return;
    case "juego":
      await handleGroupActivity(interaction, "juego");
      return;
    case "ranking":
      await handleRanking(interaction);
      return;
    case "perfil":
      await handleProfile(interaction);
      return;
    case "historial":
      await handleHistory(interaction);
      return;
    case "puntos":
      await handleManualPoints(interaction);
      return;
    case "temporada":
      await handleSeason(interaction);
      return;
    case "reset":
      await handleReset(interaction);
      return;
    default:
      await interaction.reply({
        content: "Ese comando todavía no está configurado.",
        ephemeral: true,
      });
  }
}

async function handleSala(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !(await requireRankingAdmin(interaction))) {
    return;
  }

  const code = interaction.options.getString("codigo", true).trim();
  const participantIds = parseUserIds(interaction.options.getString("jugadores", true));
  const placements = new Map<string, SalaPlacement>();
  const specialOptions: Array<[string, SalaPlacement]> = [
    ["mvp", "mvp"],
    ["segundo", "second"],
    ["tercero", "third"],
    ["ultimo", "last"],
  ];

  for (const [optionName, placement] of specialOptions) {
    const user = interaction.options.getUser(optionName);
    if (!user) {
      continue;
    }
    if (!participantIds.includes(user.id)) {
      throw new UserFacingError(`<@${user.id}> debe estar incluido en jugadores.`);
    }
    if (placements.has(user.id)) {
      throw new UserFacingError(`<@${user.id}> no puede ocupar dos posiciones en la misma sala.`);
    }
    placements.set(user.id, placement);
  }

  const players = await resolvePlayers(interaction, participantIds);
  const result = await runUserOperation(
    () =>
      recordSala({
        guildId: interaction.guild!.id,
        externalId: code,
        note: interaction.options.getString("nota") ?? undefined,
        admin: adminFromInteraction(interaction),
        players: players.map((player) => ({
          ...player,
          placement: placements.get(player.discordUserId) ?? "participant",
        })),
      }),
    interaction,
  );

  if (!result) {
    return;
  }

  const breakdown = result.players
    .map(
      (player) =>
        `<@${player.discordUserId}>: **+${player.points}** (${placementLabels[player.placement]})`,
    )
    .join("\n");

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`🎮 Sala registrada · ${result.season.name}`)
        .setDescription(`**${code}**\n\n${breakdown}`)
        .addFields(
          { name: "Jugadores", value: String(result.players.length), inline: true },
          { name: "Puntos repartidos", value: `+${result.totalPoints}`, inline: true },
        )
        .setColor(0x22c55e),
    ],
  });
}

async function handleActivity(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !(await requireRankingAdmin(interaction))) {
    return;
  }

  const player = interaction.options.getUser("jugador", true);
  const activityType = parseActivityType(interaction.options.getString("tipo", true));
  const result = await runUserOperation(
    () =>
      recordActivities({
        guildId: interaction.guild!.id,
        activityType,
        activityKey: interaction.options.getString("referencia", true).trim(),
        details: interaction.options.getString("nota") ?? undefined,
        admin: adminFromInteraction(interaction),
        players: [{ discordUserId: player.id, username: displayName(player) }],
      }),
    interaction,
  );

  if (!result) {
    return;
  }

  await interaction.reply({
    content: `✅ Actividad **${activityType}** registrada para <@${player.id}>: **+${ACTIVITY_POINTS} puntos**.`,
    ephemeral: true,
  });
}

async function handleGroupActivity(
  interaction: ChatInputCommandInteraction,
  activityType: ActivityType,
  statField?: "compePlayed" | "guerraPlayed" | "vv2Played",
) {
  if (!interaction.guild || !(await requireRankingAdmin(interaction))) {
    return;
  }

  const ids = parseUserIds(interaction.options.getString("jugadores", true));
  const players = await resolvePlayers(interaction, ids);
  const identifier =
    interaction.options.getString("identificador", true).trim();
  const note =
    interaction.options.getString("nota") ??
    interaction.options.getString("motivo") ??
    undefined;
  const result = await runUserOperation(
    () =>
      recordActivities({
        guildId: interaction.guild!.id,
        activityType,
        activityKey: identifier,
        details: note,
        admin: adminFromInteraction(interaction),
        players,
        statField,
      }),
    interaction,
  );

  if (!result) {
    return;
  }

  await interaction.reply({
    content: `✅ ${activityTypeLabel(activityType)} registrada para ${result.players.length} jugador(es). Cada participante recibió **+${ACTIVITY_POINTS} puntos**.`,
    ephemeral: true,
  });
}

async function handleRanking(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const page = interaction.options.getInteger("pagina") ?? 1;
  const limit = interaction.options.getInteger("limite") ?? 10;
  const { season, players, total } = await getRanking(interaction.guild.id, limit, page);

  if (total === 0) {
    await interaction.reply("Todavía no hay jugadores registrados en el ranking.");
    return;
  }

  const description = players
    .map((player, index) => {
      const position = (page - 1) * limit + index + 1;
      return `${rankIcon(position)} **${position}.** <@${player.discordUserId}> — **${player.points} pts**`;
    })
    .join("\n");

  const totalPages = Math.max(1, Math.ceil(total / limit));
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`🏆 Ranking general · ${season.name}`)
        .setDescription(description)
        .setFooter({ text: `Página ${page}/${totalPages} · ${total} jugadores` })
        .setColor(0xf59e0b),
    ],
  });
}

async function handleProfile(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const target = interaction.options.getUser("jugador") ?? interaction.user;
  const player = await getPlayerByDiscordId(target.id);
  if (!player) {
    await interaction.reply({
      content: `<@${target.id}> todavía no tiene un perfil. Registra su primera sala con /sala.`,
      ephemeral: true,
    });
    return;
  }

  const [position, history] = await Promise.all([
    getPlayerPosition(interaction.guild.id, player.id),
    getPlayerHistory(player.id),
  ]);
  const recentHistory = history.length
    ? history
        .slice(0, 5)
        .map((entry) => `${signedPoints(entry.amount)} — ${entry.reason}`)
        .join("\n")
    : "Sin movimientos todavía.";

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`👤 Perfil de ${player.username}`)
        .setDescription(`<@${player.discordUserId}>`)
        .addFields(
          { name: "🏆 Puntos actuales", value: `**${player.points}**`, inline: true },
          { name: "📊 Posición", value: position ? `#${position}` : "—", inline: true },
          { name: "🎮 Salas", value: String(player.salasPlayed), inline: true },
          { name: "👑 MVP", value: String(player.mvpCount), inline: true },
          { name: "🥈 Segundo", value: String(player.secondPlaceCount), inline: true },
          { name: "🥉 Tercero", value: String(player.thirdPlaceCount), inline: true },
          { name: "⬇️ Último", value: String(player.lastPlaceCount), inline: true },
          { name: "⚔️ Compes", value: String(player.compePlayed), inline: true },
          { name: "🛡️ Guerras", value: String(player.guerraPlayed), inline: true },
          { name: "🔁 VV2", value: String(player.vv2Played), inline: true },
          { name: "🔥 Actividades", value: String(player.activityCount), inline: true },
          { name: "✨ Puntos de actividad", value: String(player.activityPoints), inline: true },
          {
            name: "📅 Última actividad",
            value: player.lastActivityAt ? `<t:${Math.floor(player.lastActivityAt.getTime() / 1000)}:R>` : "—",
            inline: true,
          },
          { name: "📜 Historial reciente", value: recentHistory },
        )
        .setColor(0x5865f2),
    ],
    ephemeral: true,
  });
}

async function handleHistory(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("jugador") ?? interaction.user;
  if (target.id !== interaction.user.id && !(await requireRankingAdmin(interaction))) {
    return;
  }

  const player = await getPlayerByDiscordId(target.id);
  if (!player) {
    await interaction.reply({
      content: `<@${target.id}> todavía no tiene movimientos registrados.`,
      ephemeral: true,
    });
    return;
  }

  const history = await getPlayerHistory(player.id);
  const description = history.length
    ? history
        .map(
          (entry) =>
            `<t:${Math.floor(entry.createdAt.getTime() / 1000)}:d> ${signedPoints(entry.amount)} — ${entry.reason}\n` +
            `Tipo: ${entry.sourceType} · Admin: ${entry.adminUsername}`,
        )
        .join("\n\n")
    : "Sin movimientos todavía.";

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`📜 Historial de ${player.username}`)
        .setDescription(description)
        .setColor(0x8b5cf6),
    ],
    ephemeral: true,
  });
}

async function handleManualPoints(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !(await requireRankingAdmin(interaction))) {
    return;
  }

  const player = interaction.options.getUser("jugador", true);
  const amount = interaction.options.getInteger("cantidad", true);
  if (amount === 0) {
    throw new UserFacingError("La cantidad no puede ser cero.");
  }

  const result = await runUserOperation(
    () =>
      recordManualPoints({
        guildId: interaction.guild!.id,
        player: { discordUserId: player.id, username: displayName(player) },
        amount,
        reason: interaction.options.getString("motivo", true).trim(),
        admin: adminFromInteraction(interaction),
      }),
    interaction,
  );

  if (!result) {
    return;
  }

  await interaction.reply({
    content: `✅ Ajuste registrado para <@${player.id}>: **${signedPoints(amount)} puntos**.`,
    ephemeral: true,
  });
}

async function handleSeason(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: "Este comando solo funciona en un servidor.", ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();
  if (subcommand === "actual") {
    const season = await getActiveSeason(interaction.guild.id);
    const seasons = await getSeasons(interaction.guild.id);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📅 Temporada actual")
          .setDescription(season ? `**${season.name}**` : "No hay una temporada activa.")
          .addFields({ name: "Temporadas registradas", value: String(seasons.length), inline: true })
          .setColor(0x0ea5e9),
      ],
    });
    return;
  }

  if (!(await requireRankingAdmin(interaction))) {
    return;
  }

  if (subcommand === "crear") {
    const result = await runUserOperation(
      () => createSeason(interaction.guild!.id, interaction.options.getString("nombre", true).trim()),
      interaction,
    );
    if (!result) {
      return;
    }
    await interaction.reply({
      content: `✅ Temporada **${result.name}** creada.`,
      ephemeral: true,
    });
    return;
  }

  const result = await runUserOperation(() => closeSeason(interaction.guild!.id), interaction);
  if (!result) {
    return;
  }
  await interaction.reply({
    content: `✅ **${result.closedSeason.name}** cerrada. Se archivaron ${result.archivedPlayers} jugadores y comenzó **${result.nextSeason.name}** con puntos en cero.`,
    ephemeral: true,
  });
}

async function handleReset(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !(await requireRankingAdmin(interaction))) {
    return;
  }
  if (!interaction.options.getBoolean("confirmar", true)) {
    await interaction.reply({
      content: "Reinicio cancelado. Usa `confirmar: true` para cerrar la temporada sin borrar datos.",
      ephemeral: true,
    });
    return;
  }

  const result = await runUserOperation(() => closeSeason(interaction.guild!.id), interaction);
  if (!result) {
    return;
  }

  await interaction.reply({
    content: `✅ Reinicio completado sin borrar datos. **${result.closedSeason.name}** fue archivada y comenzó **${result.nextSeason.name}**.`,
    ephemeral: true,
  });
}

async function requireRankingAdmin(interaction: ChatInputCommandInteraction) {
  if (isRankingAdmin(interaction)) {
    return true;
  }
  await interaction.reply({
    content: "Solo los administradores o el rol de ranking configurado pueden usar este comando.",
    ephemeral: true,
  });
  return false;
}

function isRankingAdmin(interaction: ChatInputCommandInteraction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }
  if (!config.rankingAdminRoleId || !interaction.member) {
    return false;
  }
  if (!("roles" in interaction.member)) {
    return false;
  }
  const roles = interaction.member.roles;
  return Array.isArray(roles)
    ? roles.includes(config.rankingAdminRoleId)
    : roles.cache.has(config.rankingAdminRoleId);
}

function ensureRankingChannel(interaction: ChatInputCommandInteraction) {
  if (!config.rankingChannelId || interaction.channelId === config.rankingChannelId) {
    return true;
  }
  interaction
    .reply({
      content: `Este comando debe utilizarse en <#${config.rankingChannelId}>.`,
      ephemeral: true,
    })
    .catch(() => undefined);
  return false;
}

function parseUserIds(raw: string) {
  const ids: string[] = raw.match(/\d{17,20}/g) ?? [];
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) {
    throw new UserFacingError("Añade al menos un jugador usando menciones o IDs de Discord.");
  }
  return uniqueIds;
}

async function resolvePlayers(interaction: ChatInputCommandInteraction, ids: string[]) {
  const players: Array<{ discordUserId: string; username: string }> = [];
  for (const id of ids) {
    const user = await interaction.client.users.fetch(id);
    players.push({ discordUserId: id, username: displayName(user) });
  }
  return players;
}

function parseActivityType(value: string): ActivityType {
  if (!activityTypes.includes(value as ActivityType)) {
    throw new UserFacingError("Tipo de actividad no válido.");
  }
  return value as ActivityType;
}

function adminFromInteraction(interaction: ChatInputCommandInteraction) {
  return {
    discordUserId: interaction.user.id,
    username: displayName(interaction.user),
  };
}

async function runUserOperation<T>(
  operation: () => Promise<T>,
  interaction: ChatInputCommandInteraction,
) {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo completar la operación.";
    await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    return null;
  }
}

async function handleServer(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Este comando solo funciona dentro de un servidor.",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply(
    `Servidor: **${interaction.guild.name}**\n` +
      `Miembros: **${interaction.guild.memberCount}**\n` +
      `Creado: <t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:D>`,
  );
}

function helpEmbed() {
  return new EmbedBuilder()
    .setTitle("📚 Ayuda del ranking")
    .addFields(
      { name: "CONSULTAS", value: commandHelp.queries.map(([name, description]) => `**${name}** — ${description}`).join("\n") },
      { name: "ADMINISTRACIÓN", value: commandHelp.administration.map(([name, description]) => `**${name}** — ${description}`).join("\n") },
    )
    .setColor(0x5865f2);
}

function activityTypeLabel(type: ActivityType) {
  return { sala: "Actividad de sala", compe: "Compe", guerra: "Guerra", vv2: "VV2", honor: "Honor", juego: "Actividad de juego" }[type];
}

function rankIcon(position: number) {
  return position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : "🏅";
}

function signedPoints(amount: number) {
  return `${amount >= 0 ? "+" : ""}${amount} pts`;
}

function displayName(user: User) {
  return user.globalName ?? user.username;
}

export class UserFacingError extends Error {}