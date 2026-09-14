import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { setDiscordSession, discordOwnerKey } from "../../../../discord-auth";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const e = env as unknown as { DISCORD_APPLICATION_ID?: string; DISCORD_OAUTH_CLIENT_SECRET?: string; DISCORD_OAUTH_REDIRECT_URI?: string; DISCORD_BOT_TOKEN?: string; DISCORD_GUILD_ID?: string };
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = (await cookies()).get("myday_discord_oauth_state")?.value;
  (await cookies()).delete("myday_discord_oauth_state");
  if (!code) return Response.redirect(new URL("/?discord_error=missing_code", request.url), 302);
  if (!state || !expectedState || state !== expectedState) return Response.redirect(new URL("/?discord_error=invalid_state", request.url), 302);
  const redirectUri = e.DISCORD_OAUTH_REDIRECT_URI ?? new URL("/api/auth/discord/callback", request.url).toString();
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: e.DISCORD_APPLICATION_ID ?? "", client_secret: e.DISCORD_OAUTH_CLIENT_SECRET ?? "", grant_type: "authorization_code", code, redirect_uri: redirectUri }) });
  if (!tokenResponse.ok) return Response.redirect(new URL("/?discord_error=token", request.url), 302);
  const token = await tokenResponse.json() as { access_token?: string };
  const userResponse = await fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: `Bearer ${token.access_token}` } });
  const user = await userResponse.json() as { id?: string; username?: string };
  if (!user.id || !e.DISCORD_BOT_TOKEN || !e.DISCORD_GUILD_ID) return Response.redirect(new URL("/?discord_error=configuration", request.url), 302);
  const member = await fetch(`https://discord.com/api/v10/guilds/${e.DISCORD_GUILD_ID}/members/${user.id}`, { headers: { Authorization: `Bot ${e.DISCORD_BOT_TOKEN}` } });
  if (!member.ok) return Response.redirect(new URL("/?discord_error=not_member", request.url), 302);
  const memberInfo = await member.json() as { nick?: string | null };
  const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${e.DISCORD_GUILD_ID}`, { headers: { Authorization: `Bot ${e.DISCORD_BOT_TOKEN}` } });
  const guild = guildResponse.ok ? await guildResponse.json() as { name?: string } : {};
  await setDiscordSession({ id: user.id, username: memberInfo.nick?.trim() || user.username || user.id, guildName: guild.name ?? "Discordサーバー", exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  return Response.redirect(new URL("/", request.url), 302);
}
