import { getDiscordSession, calendarFeedSignature } from "../../../discord-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getDiscordSession(request);
  if (!session?.guildId) return Response.json({ error: "Discordサーバーメンバーの認証が必要です。" }, { status: 401 });
  const url = new URL(request.url);
  const signature = await calendarFeedSignature(session.guildId);
  return Response.json({ url: `${url.origin}/api/calendar/ical?guild=${encodeURIComponent(session.guildId)}&sig=${signature}`, guildName: session.guildName, readOnly: true });
}
