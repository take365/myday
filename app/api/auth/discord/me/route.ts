import { getDiscordSession } from "../../../../discord-auth";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const session = await getDiscordSession(request); return session ? Response.json({ authenticated: true, username: session.username, guildName: session.guildName }) : Response.json({ authenticated: false }, { status: 401 }); }
