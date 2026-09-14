import { env } from "cloudflare:workers";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const e = env as unknown as { DISCORD_APPLICATION_ID?: string; DISCORD_OAUTH_REDIRECT_URI?: string };
  const state = crypto.randomUUID();
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", e.DISCORD_APPLICATION_ID ?? ""); url.searchParams.set("response_type", "code"); url.searchParams.set("scope", "identify"); url.searchParams.set("redirect_uri", e.DISCORD_OAUTH_REDIRECT_URI ?? new URL("/api/auth/discord/callback", request.url).toString());
  url.searchParams.set("state", state);
  return new Response(null, { status: 302, headers: { Location: url.toString(), "Set-Cookie": `myday_discord_oauth_state=${state}; Path=/api/auth/discord; Max-Age=600; HttpOnly; Secure; SameSite=Lax` } });
}
