import { parseDiscordEventList } from "../../../lib/discord-event-parser";
import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

function hexBytes(value: string): Uint8Array {
  if (!/^[0-9a-f]{2,}$/i.test(value) || value.length % 2) return new Uint8Array();
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

async function verifyDiscordRequest(request: Request, body: string): Promise<boolean> {
  const publicKey = (env as unknown as { DISCORD_PUBLIC_KEY?: string }).DISCORD_PUBLIC_KEY;
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");
  if (!publicKey || !signature || !timestamp) return false;
  try {
    const key = await crypto.subtle.importKey("raw", hexBytes(publicKey), { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify("Ed25519", key, hexBytes(signature), new TextEncoder().encode(timestamp + body));
  } catch { return false; }
}

export async function POST(request: Request) {
  const body = await request.text();
  if (!(await verifyDiscordRequest(request, body))) return Response.json({ error: "Invalid Discord signature" }, { status: 401 });
  const payload = JSON.parse(body) as { type?: number; data?: { name?: string; resolved?: { messages?: Record<string, { content?: string }> } } };
  if (payload.type === 1) return Response.json({ type: 1 });
  const messages = payload.data?.resolved?.messages;
  const source = messages ? Object.values(messages)[0]?.content ?? "" : "";
  if (!source) return Response.json({ type: 4, data: { content: "対象メッセージの本文を取得できませんでした。", flags: 64 } });
  const candidates = parseDiscordEventList(source);
  const summary = candidates.length
    ? candidates.slice(0, 10).map((item) => `・${item.date} ${item.startTime || "時刻未定"} ${item.title}`).join("\n")
    : "日付を含むイベント候補を見つけられませんでした。My Dayの取込画面で確認してください。";
  return Response.json({ type: 4, data: { content: `イベント候補 ${candidates.length}件\n${summary}\n\n登録前にMy Dayで確認してください。`, flags: 64 } });
}
