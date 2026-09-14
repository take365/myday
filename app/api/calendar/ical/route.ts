import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { apiTokens, events } from "../../../../db/schema";
import { hashApiToken } from "../../api-auth";

export const dynamic = "force-dynamic";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function compactDate(value: string) { return value.replace(/-/g, ""); }
function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}
function eventDateTime(date: string, time: string) { return `${compactDate(date)}T${time.replace(":", "")}00`; }

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawToken = url.searchParams.get("token")?.trim() ?? "";
  if (!rawToken) return new Response("Calendar subscription token is required.", { status: 401 });
  const tokenHash = await hashApiToken(rawToken);
  const db = getDb();
  const [token] = await db.select().from(apiTokens).where(eq(apiTokens.tokenHash, tokenHash)).limit(1);
  if (!token) return new Response("Invalid calendar subscription token.", { status: 401 });
  await db.update(apiTokens).set({ lastUsedAt: new Date().toISOString() }).where(eq(apiTokens.id, token.id));
  const rows = await db.select().from(events).where(eq(events.ownerEmail, token.ownerEmail));
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//My Day//Discord Event Calendar//JA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:きたろうのサーバー イベント",
    "X-WR-TIMEZONE:Asia/Tokyo",
    ...rows.flatMap((event) => {
      const summary = `SUMMARY:${escapeIcs(event.title)}`;
      const description = event.notes ? `DESCRIPTION:${escapeIcs(event.notes)}` : "";
      const dates = event.startTime
        ? [`DTSTART;TZID=Asia/Tokyo:${eventDateTime(event.date, event.startTime)}`, event.endTime ? `DTEND;TZID=Asia/Tokyo:${eventDateTime(event.date, event.endTime)}` : ""]
        : [`DTSTART;VALUE=DATE:${compactDate(event.date)}`, `DTEND;VALUE=DATE:${nextDate(event.date)}`];
      return ["BEGIN:VEVENT", `UID:${event.id}@calendar.chita256.chatgpt.site`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`, ...dates, summary, description, "END:VEVENT"].filter(Boolean);
    }),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "inline; filename=calendar.ics", "Cache-Control": "private, max-age=300" } });
}
