import { clearDiscordSessionCookie } from "../../../../discord-auth";
export async function GET(request: Request) { const response = Response.redirect(new URL("/", request.url), 302); response.headers.append("Set-Cookie", clearDiscordSessionCookie()); return response; }
