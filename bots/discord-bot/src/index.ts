import {
  Client,
  Events,
  GatewayIntentBits,
} from "discord.js";
import { commandDefinitions } from "./commands.js";
import { handleCommand, UserFacingError } from "./command-handler.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.on(Events.ShardDisconnect, (event, shardId) => {
  logger.warn("Discord Gateway disconnect.", {
    shardId,
    code: event.code,
    reason: event.reason,
    wasClean: event.wasClean,
  });
});

client.on(Events.ShardReconnecting, (shardId) => {
  logger.info("Discord Gateway reconnecting.", { shardId });
});

client.on(Events.ShardResume, (shardId, replayedEvents) => {
  logger.info("Discord Gateway reconnect.", {
    shardId,
    replayedEvents,
  });
});

client.on(Events.ShardReady, (shardId, unavailableGuilds) => {
  logger.info("Discord Gateway ready.", {
    shardId,
    unavailableGuilds: unavailableGuilds?.size ?? 0,
  });
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

  logger.info("Interacción recibida.", {
    command: interaction.commandName,
    user: interaction.user.tag,
    channel: interaction.channelId,
  });

  try {
    await handleCommand(interaction, client);
    logger.info("Interacción respondida.", {
      command: interaction.commandName,
      replied: interaction.replied,
      deferred: interaction.deferred,
    });
  } catch (error) {
    logger.error("Error procesando un comando.", {
      command: interaction.commandName,
      error: error instanceof Error ? error.message : String(error),
    });

    const reply = {
      content:
        error instanceof UserFacingError
          ? `❌ ${error.message}`
          : "Ocurrió un error al procesar el comando.",
      ephemeral: true,
    };

    try {
      if (interaction.deferred) {
        await interaction.editReply(reply);
      } else if (interaction.replied) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch (replyError) {
      logger.error("No se pudo enviar la respuesta de error.", {
        command: interaction.commandName,
        error: replyError instanceof Error ? replyError.message : String(replyError),
        alreadyReplied: interaction.replied,
        deferred: interaction.deferred,
      });
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