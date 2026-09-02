# Puzzles Bot — exportación standalone para Wispbyte

Esta carpeta contiene una copia standalone de producción para subir manualmente a Wispbyte. Replit sigue siendo el proyecto principal. La exportación no depende de GitHub ni de otros artifacts del monorepo.

## Requisitos

- Node.js 20 o superior.
- PostgreSQL accesible desde Wispbyte.
- Las variables de entorno configuradas en el panel de Wispbyte.

## Variables de entorno

Configura estas variables en Wispbyte. No subas un archivo `.env` con valores reales:

- `DISCORD_TOKEN` — obligatoria.
- `DATABASE_URL` — obligatoria; debe apuntar a la base de datos PostgreSQL existente.
- `DISCORD_CLIENT_ID` — opcional.
- `DISCORD_GUILD_ID` — opcional.
- `RANKING_ADMIN_ROLE_ID` — opcional.
- `RANKING_CHANNEL_ID` — opcional.

`.env.example` solo contiene nombres de variables y valores vacíos.

## Comandos de Wispbyte

Ejecuta desde la carpeta raíz de esta exportación:

```bash
npm ci
npm run build
npm start
```

El proceso de producción termina ejecutando:

```bash
node dist/index.mjs
```

Si Wispbyte separa los campos de instalación, build y arranque, usa respectivamente:

- Install: `npm ci`
- Build: `npm run build`
- Start: `npm start`

## Estructura incluida

- `src/bot/` — código del bot.
- `src/shared/db/` — código compartido de PostgreSQL/Drizzle requerido por el bot.
- `package.json` y `package-lock.json` — dependencias standalone reproducibles.
- `build.mjs` — bundle de producción con esbuild.
- `.env.example` — nombres de variables sin secretos.

## Importante

- No ejecutes esta copia y el workflow de desarrollo de Replit con el mismo token al mismo tiempo.
- No ejecutes migraciones ni operaciones de modificación de esquema desde esta exportación.
- La carpeta no incluye `node_modules`, `dist`, secretos, archivos `.env` reales ni otros artifacts del proyecto.
