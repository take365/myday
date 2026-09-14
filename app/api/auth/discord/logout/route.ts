import { redirect } from "next/navigation";
import { clearDiscordSession } from "../../../../discord-auth";
export async function GET() { await clearDiscordSession(); redirect("/"); }

