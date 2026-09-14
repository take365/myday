const applicationId = process.env.DISCORD_APPLICATION_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!applicationId || !botToken) {
  console.error("DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN are required.");
  process.exit(1);
}

const scope = guildId ? `guilds/${guildId}` : "";
const url = `https://discord.com/api/v10/applications/${applicationId}/${scope ? `${scope}/` : ""}commands`;
const response = await fetch(url, {
  method: "PUT",
  headers: { Authorization: `Bot ${botToken}`, "Content-Type": "application/json" },
  body: JSON.stringify([{ name: "イベントとして読み取る", type: 3 }]),
});
if (!response.ok) {
  console.error(`Discord command registration failed (HTTP ${response.status}).`);
  process.exit(1);
}
console.log(guildId ? "Guild message command registered." : "Global message command registered.");
