import {
  Client,
  Events,
  GatewayIntentBits,
} from "discord.js";
import { commandDefinitions } from "./commands.js";
import { handleCommand } from "./command-handler.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, async (readyClient) => {
  logger.info("Bot conectado a Discord.", {
    tag: readyClient.user.tag,
    guilds: readyClient.guilds.cache.size,
  });

  try {
    if (config.guildId) {
      await readyClient.application.commands.set(commandDefinitions, config.guildId);
    } else {
      await readyClient.application.commands.set(commandDefinitions);
    }
    logger.info(
      config.guildId
        ? `Comandos registrados en el servidor ${config.guildId}.`
        : "Comandos registrados globalmente.",
    );
  } catch (error) {
    logger.error("No se pudieron registrar los comandos al iniciar.", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  try {
    await handleCommand(interaction, client);
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