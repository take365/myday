import { getDiscordSession } from "../../../../discord-auth";
export const dynamic = "force-dynamic";
export async function GET() { const session = await getDiscordSession(); return session ? Response.json({ authenticated: true, username: session.username }) : Response.json({ authenticated: false }, { status: 401 }); }

