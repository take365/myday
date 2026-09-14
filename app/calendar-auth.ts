import { getDiscordSession, discordOwnerKey } from "./discord-auth";
export async function getCalendarUser() {
  const session = await getDiscordSession();
  return session ? { email: discordOwnerKey(session.id), displayName: session.username } : null;
}
