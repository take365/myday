import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { events } from "../../../../../db/schema";
import { requireApiIdentity } from "../../../api-auth";

export const dynamic = "force-dynamic";
const CATEGORIES = ["仕事", "生活", "予定"] as const;
type Incoming = { title?: string; date?: string; startTime?: string; endTime?: string; category?: string; notes?: string; completed?: boolean };

function key(title: string, date: string) {
  return `${date}|${title.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/[\s\p{P}\p{S}【】「」『』（）()［］]/gu, "")}`;
}

export async function POST(request: Request) {
  const identity = await requireApiIdentity(request);
  if (identity instanceof Response) return identity;
  const payload = await request.json().catch(() => null) as { events?: Incoming[] } | null;
  if (!payload || !Array.isArray(payload.events) || payload.events.length === 0) return Response.json({ error: "events array is required" }, { status: 400 });
  if (payload.events.length > 200) return Response.json({ error: "events may contain at most 200 items" }, { status: 400 });
  const db = getDb();
  const existing = await db.select().from(events).where(eq(events.ownerEmail, identity.email));
  const byKey = new Map(existing.map((event) => [key(event.title, event.date), event]));
  const created: typeof existing = [];
  const updated: typeof existing = [];
  const invalid: Array<{ index: number; error: string }> = [];
  for (const [index, item] of payload.events.entries()) {
    const title = item.title?.trim() ?? "";
    const date = item.date?.trim() ?? "";
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { invalid.push({ index, error: "title and date (YYYY-MM-DD) are required" }); continue; }
    if (item.category && !CATEGORIES.includes(item.category as typeof CATEGORIES[number])) { invalid.push({ index, error: "category must be one of: 仕事, 生活, 予定" }); continue; }
    const found = byKey.get(key(title, date));
    if (found) {
      const [event] = await db.update(events).set({ title, date, startTime: item.startTime ?? found.startTime, endTime: item.endTime ?? found.endTime, category: item.category ?? found.category, notes: item.notes ?? found.notes, completed: item.completed ?? found.completed }).where(eq(events.id, found.id)).returning();
      if (event) { byKey.set(key(event.title, event.date), event); updated.push(event); }
      continue;
    }
    const event = { id: crypto.randomUUID(), ownerEmail: identity.email, title, date, startTime: item.startTime ?? "", endTime: item.endTime ?? "", category: item.category ?? "仕事", notes: item.notes ?? "", completed: Boolean(item.completed) };
    await db.insert(events).values(event);
    byKey.set(key(title, date), event);
    created.push(event);
  }
  return Response.json({ created, updated, invalid, counts: { created: created.length, updated: updated.length, invalid: invalid.length } }, { status: 200 });
}
