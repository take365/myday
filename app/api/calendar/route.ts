import { desc, eq, or } from "drizzle-orm";
import { getCalendarUser } from "../../calendar-auth";
import { getDb } from "../../../db";
import { attachments, events } from "../../../db/schema";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ error: "ChatGPT sign-in is required." }, { status: 401 });
}

export async function GET() {
  const user = await getCalendarUser();
  if (!user) return Response.json({ error: "Discordサーバーメンバーの認証が必要です。" }, { status: 401 });
  const db = getDb();
  const ownerFilter = user.legacyEmail ? or(eq(events.ownerEmail, user.email), eq(events.ownerEmail, user.legacyEmail)) : eq(events.ownerEmail, user.email);
  const rows = await db.select().from(events).where(ownerFilter).orderBy(desc(events.date), desc(events.startTime));
  const files = await db.select().from(attachments).where(user.legacyEmail ? or(eq(attachments.ownerEmail, user.email), eq(attachments.ownerEmail, user.legacyEmail)) : eq(attachments.ownerEmail, user.email));
  const fileMap = new Map<string, typeof files>();
  for (const file of files) fileMap.set(file.eventId, [...(fileMap.get(file.eventId) ?? []), file]);
  const usedBytes = files.reduce((total, file) => total + file.size, 0);
  return Response.json({ email: user.email, usedBytes, events: rows.map((event) => ({ ...event, attachments: fileMap.get(event.id) ?? [] })) });
}

export async function POST(request: Request) {
  const user = await getCalendarUser();
  if (!user) return Response.json({ error: "Discordサーバーメンバーの認証が必要です。" }, { status: 401 });
  const payload = await request.json() as Partial<typeof events.$inferInsert>;
  const title = payload.title?.trim() ?? "";
  const date = payload.date?.trim() ?? "";
  if (!title || !date) return Response.json({ error: "title and date are required" }, { status: 400 });

  const event = {
    id: crypto.randomUUID(),
    ownerEmail: user.email,
    title,
    date,
    startTime: payload.startTime ?? "",
    endTime: payload.endTime ?? "",
    category: payload.category ?? "仕事",
    notes: payload.notes ?? "",
    completed: false,
  };
  const db = getDb();
  await db.insert(events).values(event);
  return Response.json({ event: { ...event, attachments: [] } }, { status: 201 });
}
