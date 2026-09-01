import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { commandHelp } from "./commands.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
  logger.info("Bot conectado a Discord.", {
    tag: readyClient.user.tag,
    guilds: readyClient.guilds.cache.size,
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  try {
    await handleCommand(interaction);
  } catch (error) {
    logger.error("Error procesando un comando.", {
      command: interaction.commandName,
      error: error instanceof Error ? error.message : String(error),
    });

    const reply = {
      content: "Ocurrió un error al procesar el comando.",
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

async function handleCommand(interaction: ChatInputCommandInteraction) {
  switch (interaction.commandName) {
    case "ping": {
      await interaction.reply(`Pong. Latencia: ${client.ws.ping} ms.`);
      return;
    }
    case "help": {
      const embed = new EmbedBuilder()
        .setTitle("Comandos disponibles")
        .setDescription("Usa cualquiera de estos comandos slash:")
        .addFields(commandHelp.map((command) => ({ name: command.name, value: command.description })))
        .setColor(0x5865f2);

      await interaction.reply({ embeds: [embed] });
      return;
    }
    case "echo": {
      const message = interaction.options.getString("mensaje", true);
      await interaction.reply(message);
      return;
    }
    case "server": {
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
      return;
    }
    default:
      await interaction.reply({
        content: "Ese comando todavía no está configurado.",
        ephemeral: true,
      });
  }
}

client.on(Events.Error, (error) => {
  logger.error("Discord reportó un error.", {
    error: error.message,
  });
});

process.on("SIGINT", () => {
  logger.info("Cerrando el bot...");
  client.destroy();
});

process.on("SIGTERM", () => {
  logger.info("Cerrando el bot...");
  client.destroy();
});

await client.login(config.token);