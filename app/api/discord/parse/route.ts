import { getCalendarUser } from "../../../calendar-auth";
import { parseDiscordEventList } from "../../../lib/discord-event-parser";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCalendarUser();
  if (!user) return Response.json({ error: "Discordサーバーメンバーの認証が必要です。" }, { status: 401 });
  const payload = await request.json() as { text?: unknown };
  if (typeof payload.text !== "string" || !payload.text.trim()) {
    return Response.json({ error: "Discordメッセージ本文を入力してください。" }, { status: 400 });
  }
  const events = parseDiscordEventList(payload.text);
  return Response.json({ data: events, count: events.length, interpretation: "候補抽出（登録前に確認してください）" });
}
