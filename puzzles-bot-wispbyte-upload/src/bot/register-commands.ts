import { REST, Routes } from "discord.js";
import { commandDefinitions } from "./commands.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

if (!config.clientId) {
  throw new Error("DISCORD_CLIENT_ID es obligatorio para registrar comandos.");
}

const rest = new REST({ version: "10" }).setToken(config.token);
const route = config.guildId
  ? Routes.applicationGuildCommands(config.clientId, config.guildId)
  : Routes.applicationCommands(config.clientId);
const scope = config.guildId ? `el servidor ${config.guildId}` : "todos los servidores";

try {
  logger.info(`Registrando ${commandDefinitions.length} comandos en ${scope}...`);
  await rest.put(route, { body: commandDefinitions });
  logger.info("Comandos registrados correctamente.");
} catch (error) {
  logger.error("No se pudieron registrar los comandos.", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
}