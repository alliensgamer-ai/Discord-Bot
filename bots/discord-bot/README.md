# Discord Bot

Bot base de Discord construido con Node.js, TypeScript y `discord.js`.

## Comandos incluidos

- `/ping` — comprueba la conexión y muestra la latencia.
- `/help` — muestra los comandos disponibles.
- `/echo mensaje:` — repite un mensaje de hasta 500 caracteres.
- `/server` — muestra información del servidor actual.

## Configuración

1. Crea una aplicación en el [Discord Developer Portal](https://discord.com/developers/applications).
2. Crea un bot dentro de la aplicación y copia su token.
3. Añade `DISCORD_TOKEN` como Secret del proyecto.
4. Opcionalmente, añade `DISCORD_GUILD_ID` como variable de entorno durante desarrollo. Así los comandos se actualizan al instante en ese servidor.
5. Invita el bot con los scopes `bot` y `applications.commands`.
6. Inicia el bot:

   ```bash
   pnpm --filter @workspace/discord-bot run dev
   ```

El bot registra sus comandos automáticamente al conectarse. Si prefieres registrar los comandos manualmente, añade también `DISCORD_CLIENT_ID` y ejecuta:

   ```bash
   pnpm --filter @workspace/discord-bot run deploy-commands
   ```

Si `DISCORD_GUILD_ID` no está definido, los comandos se registran globalmente y Discord puede tardar en propagarlos.