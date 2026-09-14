import { clearDiscordSession } from "../../../../discord-auth";
export async function GET(request: Request) { await clearDiscordSession(); return Response.redirect(new URL("/", request.url), 302); }
