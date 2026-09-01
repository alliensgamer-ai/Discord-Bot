# Discord Bot

Bot de Discord con comandos slash construido con Node.js, TypeScript y discord.js.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/discord-bot run dev` — run the Discord bot
- `pnpm --filter @workspace/discord-bot run deploy-commands` — register commands manually
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Discord bot: discord.js 14, slash commands
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `bots/discord-bot/src/index.ts` — Discord client, event handling, and command behavior
- `bots/discord-bot/src/commands.ts` — slash-command definitions and help text
- `bots/discord-bot/src/register-commands.ts` — optional manual command registration
- `bots/discord-bot/README.md` — setup and invitation instructions

## Architecture decisions

- The bot requests only the `Guilds` gateway intent because all current features use slash commands.
- Commands register automatically after login; `DISCORD_GUILD_ID` can be used to target a development server.
- Secrets stay in Replit Secrets; the token is never stored in source files or `.env` files.

## Product

The bot responds to `/ping`, `/help`, `/echo`, and `/server`. It runs as a persistent console workflow and can be extended with additional slash commands.

## User preferences

The user requested Node.js and discord.js.

## Gotchas

- Global Discord commands can take time to propagate. Set `DISCORD_GUILD_ID` during development for immediate updates.
- The Discord bot workflow requires the `DISCORD_TOKEN` Secret.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
