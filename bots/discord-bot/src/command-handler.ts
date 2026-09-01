import {
  EmbedBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type Client,
  type User,
} from "discord.js";
import { config } from "./config.js";
import { commandHelp } from "./commands.js";
import {
  getActivityHistory,
  getPlayerByDiscordId,
  getPlayerHistory,
  getRanking,
  pointsForPlacement,
  recordSala,
  type SalaPlayerInput,
} from "./ranking-service.js";
import { placementLabels, type SalaPlacement } from "./ranking-rules.js";

export async function handleCommand(
  interaction: ChatInputCommandInteraction,
  client: Client,
) {
  switch (interaction.commandName) {
    case "ping":
      await interaction.reply(`Pong. Latencia: ${client.ws.ping} ms.`);
      return;
    case "help":
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
    case "ranking":
      await handleRanking(interaction);
      return;
    case "perfil":
      await handleProfile(interaction);
      return;
    case "actividad":
      await handleActivity(interaction);
      return;
    default:
      await interaction.reply({
        content: "Ese comando todavía no está configurado.",
        ephemeral: true,
      });
  }
}

async function handleSala(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Este comando solo funciona dentro de un servidor.",
      ephemeral: true,
    });
    return;
  }

  if (!isRankingAdmin(interaction)) {
    await interaction.reply({
      content: "Solo los administradores o el rol de ranking configurado pueden registrar salas.",
      ephemeral: true,
    });
    return;
  }

  const players = await parseSalaPlayers(interaction);
  const result = await recordSala({
    guildId: interaction.guild.id,
    note: interaction.options.getString("nota") ?? undefined,
    admin: {
      discordUserId: interaction.user.id,
      username: displayName(interaction.user),
    },
    players,
  });

  const breakdown = result.players
    .map((player) => `<@${player.discordUserId}>: **+${player.points}** (${placementLabels[player.placement]})`)
    .join("\n");

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`Sala #${result.salaId} registrada`)
        .setDescription(breakdown)
        .addFields(
          { name: "Jugadores", value: String(result.players.length), inline: true },
          { name: "Puntos asignados", value: `+${result.totalPoints}`, inline: true },
        )
        .setColor(0x22c55e),
    ],
  });
}

async function handleRanking(interaction: ChatInputCommandInteraction) {
  const limit = interaction.options.getInteger("limite") ?? 10;
  const ranking = await getRanking(limit);

  if (ranking.length === 0) {
    await interaction.reply("Todavía no hay jugadores registrados en el ranking.");
    return;
  }

  const description = ranking
    .map((player, index) => {
      const position = String(index + 1).padStart(2, "0");
      return `**${position}.** <@${player.discordUserId}> — **${player.points} pts** · ${player.salasPlayed} salas`;
    })
    .join("\n");

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("Ranking competitivo")
        .setDescription(description)
        .setFooter({ text: `Mostrando ${ranking.length} jugadores` })
        .setColor(0xf59e0b),
    ],
  });
}

async function handleProfile(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("jugador") ?? interaction.user;
  const player = await getPlayerByDiscordId(target.id);

  if (!player) {
    await interaction.reply({
      content: `<@${target.id}> todavía no tiene un perfil. Registra su primera sala con /sala.`,
      ephemeral: true,
    });
    return;
  }

  const history = await getPlayerHistory(player.id);
  const recentHistory = history.length
    ? history
        .slice(0, 5)
        .map((entry) => `• **+${entry.amount}** — ${entry.reason}`)
        .join("\n")
    : "Sin movimientos todavía.";

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`Perfil de ${player.username}`)
        .setDescription(`<@${player.discordUserId}>`)
        .addFields(
          { name: "Puntos", value: `**${player.points}**`, inline: true },
          { name: "Salas", value: String(player.salasPlayed), inline: true },
          { name: "MVP", value: String(player.mvpCount), inline: true },
          { name: "Segundo lugar", value: String(player.secondPlaceCount), inline: true },
          { name: "Tercer lugar", value: String(player.thirdPlaceCount), inline: true },
          { name: "Último lugar", value: String(player.lastPlaceCount), inline: true },
          { name: "Historial reciente", value: recentHistory },
        )
        .setColor(0x5865f2),
    ],
  });
}

async function handleActivity(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("jugador") ?? interaction.user;
  const player = await getPlayerByDiscordId(target.id);

  if (!player) {
    await interaction.reply({
      content: `<@${target.id}> todavía no tiene un perfil de ranking.`,
      ephemeral: true,
    });
    return;
  }

  const events = await getActivityHistory(player.id);
  const activityHistory = events.length
    ? events.map((event) => `• **+${event.pointsAwarded}** — ${event.activityType}`).join("\n")
    : "No hay actividades registradas todavía.";

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`Actividad de ${player.username}`)
        .setDescription("El sistema de actividad está preparado, pero sus actividades todavía están pendientes de definición.")
        .addFields(
          { name: "Puntos de actividad", value: `**${events.reduce((sum, event) => sum + event.pointsAwarded, 0)}**`, inline: true },
          { name: "Movimientos recientes", value: activityHistory },
        )
        .setColor(0x14b8a6),
    ],
  });
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
    .setTitle("Comandos disponibles")
    .setDescription("Ranking competitivo de Free Fire:")
    .addFields(commandHelp.map((command) => ({ name: command.name, value: command.description })))
    .setColor(0x5865f2);
}

function isRankingAdmin(interaction: ChatInputCommandInteraction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  if (!config.rankingAdminRoleId || !interaction.guild || !interaction.member) {
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

async function parseSalaPlayers(interaction: ChatInputCommandInteraction): Promise<SalaPlayerInput[]> {
  const rawPlayers = interaction.options.getString("jugadores", true);
  const ids: string[] = rawPlayers.match(/\d{17,20}/g) ?? [];
  const specialUsers = new Map<string, { user: User; placement: SalaPlacement }>();
  const specialOptions: Array<[string, SalaPlacement]> = [
    ["mvp", "mvp"],
    ["segundo", "second"],
    ["tercero", "third"],
    ["ultimo", "last"],
  ];

  for (const [optionName, placement] of specialOptions) {
    const user = interaction.options.getUser(optionName);
    if (user) {
      const previous = specialUsers.get(user.id);
      if (previous) {
        throw new Error(`<@${user.id}> no puede tener dos posiciones especiales en la misma sala.`);
      }
      specialUsers.set(user.id, { user, placement });
      ids.push(user.id);
    }
  }

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) {
    throw new Error("Añade al menos un jugador usando menciones o IDs de Discord.");
  }

  const users = new Map<string, User>();
  for (const [id, special] of specialUsers) {
    users.set(id, special.user);
  }

  for (const id of uniqueIds) {
    if (!users.has(id)) {
      users.set(id, await interaction.client.users.fetch(id));
    }
  }

  return uniqueIds.map((id) => {
    const special = specialUsers.get(id);
    const placement = special?.placement ?? "participant";
    return {
      discordUserId: id,
      username: displayName(users.get(id)!),
      placement,
    };
  });
}

function displayName(user: User) {
  return user.globalName ?? user.username;
}