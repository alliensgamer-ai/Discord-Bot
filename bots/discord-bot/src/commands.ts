import { SlashCommandBuilder } from "discord.js";

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Comprueba si el bot está disponible."),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra los comandos disponibles."),
  new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Repite un mensaje.")
    .addStringOption((option) =>
      option
        .setName("mensaje")
        .setDescription("El mensaje que quieres repetir.")
        .setRequired(true)
        .setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("server")
    .setDescription("Muestra información del servidor actual."),
].map((command) => command.toJSON());

export const commandHelp = [
  { name: "/ping", description: "Comprueba si el bot está disponible." },
  { name: "/help", description: "Muestra esta lista de comandos." },
  { name: "/echo", description: "Repite un mensaje de hasta 500 caracteres." },
  { name: "/server", description: "Muestra información del servidor actual." },
];