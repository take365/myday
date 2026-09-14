import { getDiscordSession, discordOwnerKey } from "./discord-auth";
export async function getCalendarUser(request?: Request) {
  const session = await getDiscordSession(request);
  return session ? { email: discordOwnerKey(session.id), displayName: session.username } : null;
}
