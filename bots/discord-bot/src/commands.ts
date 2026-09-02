import { SlashCommandBuilder } from "discord.js";

const activityChoices = [
  { name: "Sala", value: "sala" },
  { name: "Compe", value: "compe" },
  { name: "Guerra", value: "guerra" },
  { name: "VV2", value: "vv2" },
  { name: "Honor", value: "honor" },
  { name: "Juego", value: "juego" },
] as const;

const playersOption = (option: any) =>
  option
    .setName("jugadores")
    .setDescription("Menciones o IDs separados por espacios o comas.")
    .setRequired(true)
    .setMaxLength(2000);

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Comprueba si el bot está disponible."),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra la ayuda del sistema."),
  new SlashCommandBuilder()
    .setName("ayuda")
    .setDescription("Muestra todos los comandos del ranking."),
  new SlashCommandBuilder()
    .setName("descargar")
    .setDescription("Envía la exportación de producción al administrador."),
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
        .setName("codigo")
        .setDescription("Identificador único de la sala.")
        .setRequired(true)
        .setMaxLength(100),
    )
    .addStringOption(playersOption)
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
    .setName("actividad")
    .setDescription("Registra una actividad válida de +20 puntos.")
    .addUserOption((option) =>
      option.setName("jugador").setDescription("Jugador que recibe la actividad.").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("tipo")
        .setDescription("Tipo de actividad.")
        .setRequired(true)
        .addChoices(...activityChoices),
    )
    .addStringOption((option) =>
      option
        .setName("referencia")
        .setDescription("Identificador único para evitar duplicados.")
        .setRequired(true)
        .setMaxLength(100),
    )
    .addStringOption((option) =>
      option.setName("nota").setDescription("Motivo o nota.").setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("compe")
    .setDescription("Registra una competencia y otorga +20 por participante.")
    .addStringOption((option) =>
      option.setName("nombre").setDescription("Nombre de la competencia.").setRequired(true).setMaxLength(100),
    )
    .addStringOption((option) =>
      option.setName("identificador").setDescription("Identificador único de la competencia.").setRequired(true).setMaxLength(100),
    )
    .addStringOption(playersOption)
    .addStringOption((option) =>
      option.setName("nota").setDescription("Nota opcional.").setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("guerra")
    .setDescription("Registra una guerra y otorga +20 por participante.")
    .addStringOption((option) =>
      option.setName("identificador").setDescription("Nombre o identificador único.").setRequired(true).setMaxLength(100),
    )
    .addStringOption(playersOption)
    .addStringOption((option) =>
      option.setName("nota").setDescription("Nota opcional.").setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("vv2")
    .setDescription("Registra un VV2 y otorga +20 por participante.")
    .addStringOption((option) =>
      option.setName("identificador").setDescription("Nombre o identificador único.").setRequired(true).setMaxLength(100),
    )
    .addStringOption(playersOption)
    .addStringOption((option) =>
      option.setName("nota").setDescription("Resultado o nota opcional.").setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("honor")
    .setDescription("Otorga +20 por honores a uno o varios jugadores.")
    .addStringOption((option) =>
      option.setName("identificador").setDescription("Identificador único del reconocimiento.").setRequired(true).setMaxLength(100),
    )
    .addStringOption(playersOption)
    .addStringOption((option) =>
      option.setName("motivo").setDescription("Motivo del honor.").setRequired(true).setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("juego")
    .setDescription("Registra actividad general dentro del juego.")
    .addStringOption((option) =>
      option.setName("identificador").setDescription("Identificador único de la actividad.").setRequired(true).setMaxLength(100),
    )
    .addStringOption(playersOption)
    .addStringOption((option) =>
      option.setName("motivo").setDescription("Motivo de la actividad.").setRequired(true).setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Muestra la clasificación competitiva.")
    .addStringOption((option) =>
      option
        .setName("tipo")
        .setDescription("Tipo de ranking.")
        .addChoices({ name: "General", value: "general" }),
    )
    .addIntegerOption((option) =>
      option.setName("pagina").setDescription("Página del ranking.").setMinValue(1).setMaxValue(1000),
    )
    .addIntegerOption((option) =>
      option.setName("limite").setDescription("Jugadores por página.").setMinValue(1).setMaxValue(10),
    ),
  new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Muestra los puntos y estadísticas de un jugador.")
    .addUserOption((option) =>
      option.setName("jugador").setDescription("Jugador que quieres consultar."),
    ),
  new SlashCommandBuilder()
    .setName("historial")
    .setDescription("Muestra el historial reciente de puntos.")
    .addUserOption((option) =>
      option.setName("jugador").setDescription("Jugador que quieres consultar."),
    ),
  new SlashCommandBuilder()
    .setName("puntos")
    .setDescription("Suma o resta puntos manualmente.")
    .addUserOption((option) =>
      option.setName("jugador").setDescription("Jugador que recibirá el ajuste.").setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("cantidad")
        .setDescription("Cantidad positiva o negativa.")
        .setRequired(true)
        .setMinValue(-100000)
        .setMaxValue(100000),
    )
    .addStringOption((option) =>
      option.setName("motivo").setDescription("Motivo del ajuste.").setRequired(true).setMaxLength(500),
    ),
  new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Cierra la temporada actual y abre una nueva sin borrar datos.")
    .addBooleanOption((option) =>
      option.setName("confirmar").setDescription("Confirma el reinicio de temporada.").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("temporada")
    .setDescription("Administra las temporadas del ranking.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("crear")
        .setDescription("Crea una temporada nueva.")
        .addStringOption((option) =>
          option.setName("nombre").setDescription("Nombre de la temporada.").setRequired(true).setMaxLength(100),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("cerrar").setDescription("Cierra la temporada actual y abre otra."),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("actual").setDescription("Muestra la temporada activa."),
    ),
].map((command) => command.toJSON());

export const commandHelp = {
  queries: [
    ["/ranking", "Clasificación general con paginación."],
    ["/perfil", "Puntos y estadísticas de un jugador."],
    ["/historial", "Movimientos recientes de puntos."],
    ["/ayuda", "Lista completa de comandos."],
  ],
  administration: [
    ["/sala", "Registra resultados y puntos de una sala."],
    ["/actividad", "Otorga +20 por una actividad válida."],
    ["/compe", "Registra una competencia."],
    ["/guerra", "Registra una guerra."],
    ["/vv2", "Registra un VV2."],
    ["/honor", "Otorga actividad por honores."],
    ["/juego", "Registra actividad general del juego."],
    ["/puntos", "Suma o resta puntos manualmente."],
    ["/temporada", "Crea, cierra o consulta temporadas."],
    ["/reset", "Reinicia la clasificación sin borrar datos."],
    ["/descargar", "Envía la exportación de producción al administrador autorizado."],
  ],
} as const;