import { cookies } from "next/headers";
import { env } from "cloudflare:workers";

const COOKIE = "myday_discord_session";
const encoder = new TextEncoder();

type Session = { id: string; username: string; exp: number };

function secret() { return (env as unknown as { DISCORD_OAUTH_SESSION_SECRET?: string }).DISCORD_OAUTH_SESSION_SECRET ?? ""; }
async function sign(value: string) { return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", await key(), encoder.encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join(""); }
async function key() { return crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
async function verify(value: string, signature: string) { return crypto.subtle.verify("HMAC", await key(), Uint8Array.from(signature.match(/.{2}/g) ?? [], (x) => parseInt(x, 16)), encoder.encode(value)); }

export async function getDiscordSession(): Promise<Session | null> {
  if (!secret()) return null;
  const raw = (await cookies()).get(COOKIE)?.value ?? "";
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature || !(await verify(encoded, signature))) return null;
  try { const session = JSON.parse(atob(encoded)) as Session; return session.exp > Date.now() ? session : null; } catch { return null; }
}

export async function setDiscordSession(session: Session) {
  const encoded = btoa(JSON.stringify(session));
  (await cookies()).set(COOKIE, `${encoded}.${await sign(encoded)}`, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function clearDiscordSession() { (await cookies()).delete(COOKIE); }
export function discordOwnerKey(id: string) { return `discord:${id}`; }

