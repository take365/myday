import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const e = env as unknown as { DISCORD_APPLICATION_ID?: string; DISCORD_OAUTH_REDIRECT_URI?: string };
  const state = crypto.randomUUID();
  (await cookies()).set("myday_discord_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/auth/discord", maxAge: 600 });
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", e.DISCORD_APPLICATION_ID ?? ""); url.searchParams.set("response_type", "code"); url.searchParams.set("scope", "identify"); url.searchParams.set("redirect_uri", e.DISCORD_OAUTH_REDIRECT_URI ?? new URL("/api/auth/discord/callback", request.url).toString());
  url.searchParams.set("state", state);
  return Response.redirect(url.toString(), 302);
}
