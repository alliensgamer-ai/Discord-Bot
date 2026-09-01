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
  new SlashCommandBuilder()
    .setName("sala")
    .setDescription("Registra los resultados de una sala competitiva.")
    .addStringOption((option) =>
      option
        .setName("jugadores")
        .setDescription("Menciones o IDs de los jugadores, separados por espacios o comas.")
        .setRequired(true)
        .setMaxLength(2000),
    )
    .addUserOption((option) =>
      option.setName("mvp").setDescription("Jugador que obtuvo el MVP."),
    )
    .addUserOption((option) =>
      option.setName("segundo").setDescription("Jugador que obtuvo el segundo lugar."),
    )
    .addUserOption((option) =>
      option.setName("tercero").setDescription("Jugador que obtuvo el tercer lugar."),
    )
    .addUserOption((option) =>
      option.setName("ultimo").setDescription("Jugador que obtuvo el último lugar."),
    )
    .addStringOption((option) =>
      option.setName("nota").setDescription("Nota opcional sobre la sala.").setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Muestra la clasificación competitiva.")
    .addIntegerOption((option) =>
      option
        .setName("limite")
        .setDescription("Cantidad de jugadores a mostrar.")
        .setMinValue(1)
        .setMaxValue(25),
    ),
  new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Muestra los puntos y estadísticas de un jugador.")
    .addUserOption((option) =>
      option.setName("jugador").setDescription("Jugador que quieres consultar."),
    ),
  new SlashCommandBuilder()
    .setName("actividad")
    .setDescription("Consulta el sistema de actividad y sus movimientos.")
    .addUserOption((option) =>
      option.setName("jugador").setDescription("Jugador que quieres consultar."),
    ),
].map((command) => command.toJSON());

export const commandHelp = [
  { name: "/ping", description: "Comprueba si el bot está disponible." },
  { name: "/help", description: "Muestra esta lista de comandos." },
  { name: "/echo", description: "Repite un mensaje de hasta 500 caracteres." },
  { name: "/server", description: "Muestra información del servidor actual." },
  { name: "/sala", description: "Registra resultados y asigna puntos automáticamente (admin)." },
  { name: "/ranking", description: "Muestra la clasificación de mayor a menor." },
  { name: "/perfil", description: "Muestra estadísticas, puntos e historial reciente." },
  { name: "/actividad", description: "Consulta la estructura del sistema de actividad." },
];