import { getDiscordSession, discordOwnerKey } from "./discord-auth";
import { env } from "cloudflare:workers";
export async function getCalendarUser(request?: Request) {
  const session = await getDiscordSession(request);
  if (!session) return null;
  const guildId = session.guildId || (env as unknown as { DISCORD_GUILD_ID?: string }).DISCORD_GUILD_ID || "";
  return { email: discordOwnerKey(guildId), legacyEmail: session.guildId ? undefined : "discord:guild:undefined", displayName: session.username };
}
