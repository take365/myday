import { clearDiscordSessionCookie } from "../../../../discord-auth";
export async function GET(request: Request) { return new Response(null, { status: 302, headers: { Location: new URL("/", request.url).toString(), "Set-Cookie": clearDiscordSessionCookie() } }); }
