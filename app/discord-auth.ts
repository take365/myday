import { env } from "cloudflare:workers";
import { headers } from "next/headers";

const COOKIE = "myday_discord_session";
const encoder = new TextEncoder();

type Session = { id: string; username: string; guildName: string; exp: number };

function secret() { return (env as unknown as { DISCORD_OAUTH_SESSION_SECRET?: string }).DISCORD_OAUTH_SESSION_SECRET ?? ""; }
async function sign(value: string) { return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", await key(), encoder.encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join(""); }
async function key() { return crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }
async function verify(value: string, signature: string) { return crypto.subtle.verify("HMAC", await key(), Uint8Array.from(signature.match(/.{2}/g) ?? [], (x) => parseInt(x, 16)), encoder.encode(value)); }

export async function getDiscordSession(request?: Request): Promise<Session | null> {
  if (!secret()) return null;
  const raw = cookieValue(request?.headers.get("cookie") ?? (await headers()).get("cookie") ?? "", COOKIE);
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature || !(await verify(encoded, signature))) return null;
  try { const session = JSON.parse(decodeBase64(encoded)) as Session; return session.exp > Date.now() ? session : null; } catch { return null; }
}

export async function sessionCookie(session: Session) {
  const encoded = encodeBase64(JSON.stringify(session));
  return `${COOKIE}=${encoded}.${await sign(encoded)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; HttpOnly; Secure; SameSite=Lax`;
}
export async function setDiscordSession(session: Session) { const encoded = encodeBase64(JSON.stringify(session)); return `${COOKIE}=${encoded}.${await sign(encoded)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; HttpOnly; Secure; SameSite=Lax`; }
export function clearDiscordSessionCookie() { return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`; }
export function discordOwnerKey(id: string) { return `discord:${id}`; }
function cookieValue(header: string, name: string) { return header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? ""; }
function encodeBase64(value: string) { const bytes = new TextEncoder().encode(value); let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary); }
function decodeBase64(value: string) { const binary = atob(value); return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0))); }
