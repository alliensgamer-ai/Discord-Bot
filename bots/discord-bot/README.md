# Free Fire Competitive Ranking Bot

Sistema de ranking competitivo para Free Fire construido con Node.js, TypeScript, PostgreSQL, Drizzle ORM y `discord.js`.

## Comandos incluidos

- `/ping` — comprueba la conexión y muestra la latencia.
- `/help` — muestra los comandos disponibles.
- `/echo mensaje:` — repite un mensaje de hasta 500 caracteres.
- `/server` — muestra información del servidor actual.
- `/ayuda` — lista los comandos de consulta y administración.
- `/sala codigo: jugadores:` — registra resultados y asigna puntos de forma transaccional.
- `/actividad jugador: tipo: referencia:` — registra una actividad válida de `+20`.
- `/compe`, `/guerra`, `/vv2` — registran actividades grupales de `+20`.
- `/honor`, `/juego` — registran actividades administrativas de `+20`.
- `/ranking` — muestra la clasificación general paginada.
- `/perfil jugador:` — muestra puntos, posición y estadísticas de forma privada.
- `/historial jugador:` — muestra movimientos recientes de forma privada.
- `/puntos jugador: cantidad: motivo:` — ajusta puntos manualmente.
- `/temporada crear|cerrar|actual` — administra temporadas sin borrar datos.
- `/reset confirmar:true` — archiva la temporada y abre otra sin borrar datos.

### Registrar una sala

`/sala` requiere permisos de administrador. `codigo` identifica la sala y evita registrarla dos veces. En `jugadores` escribe las menciones de todos los participantes separadas por espacios o comas. Después puedes asignar opcionalmente `mvp`, `segundo`, `tercero` y `ultimo`; esas posiciones deben pertenecer a la lista de participantes.

La posición especial reemplaza los 2 puntos de participación:

- Participación: `+2`
- MVP: `+10`
- Segundo lugar: `+5`
- Tercer lugar: `+3`
- Último lugar: `+2`

Cada resultado crea un movimiento en el historial con el jugador, puntos, motivo, administrador, fecha y sala de origen.

### Actividades

Cada actividad válida otorga `+20` puntos. La opción `referencia` funciona como clave de idempotencia: la misma actividad no puede registrarse dos veces para el mismo jugador dentro de una temporada.

Los comandos administrativos aceptan el ID de la actividad y una lista de menciones. `/compe`, `/guerra` y `/vv2` también actualizan sus contadores específicos en el perfil.

## Configuración

1. Crea una aplicación en el [Discord Developer Portal](https://discord.com/developers/applications).
2. Crea un bot dentro de la aplicación y copia su token.
3. Añade `DISCORD_TOKEN` como Secret del proyecto.
4. Opcionalmente, añade `DISCORD_GUILD_ID` como variable de entorno durante desarrollo. Así los comandos se actualizan al instante en ese servidor.
5. Opcionalmente, añade `RANKING_ADMIN_ROLE_ID` con el ID del rol que también podrá registrar salas.
6. Opcionalmente, añade `RANKING_CHANNEL_ID` con el ID del canal oficial del sistema.
7. Invita el bot con los scopes `bot` y `applications.commands`.
8. Inicia el bot:

   ```bash
   pnpm --filter @workspace/discord-bot run dev
   ```

El bot registra sus comandos automáticamente al conectarse. Si prefieres registrar los comandos manualmente, añade también `DISCORD_CLIENT_ID` y ejecuta:

   ```bash
   pnpm --filter @workspace/discord-bot run deploy-commands
   ```

Si `DISCORD_GUILD_ID` no está definido, los comandos se registran globalmente y Discord puede tardar en propagarlos.

El canal oficial solo restringe dónde se ejecutan los comandos del ranking; no exige el permiso normal de `Enviar mensajes`, por lo que los slash commands siguen funcionando en canales de solo lectura.