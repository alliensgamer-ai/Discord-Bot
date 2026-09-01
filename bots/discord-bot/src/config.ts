function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }

  return value;
}

export const config = {
  token: requiredEnv("DISCORD_TOKEN"),
  clientId: process.env.DISCORD_CLIENT_ID?.trim(),
  guildId: process.env.DISCORD_GUILD_ID?.trim(),
  rankingAdminRoleId: process.env.RANKING_ADMIN_ROLE_ID?.trim(),
};