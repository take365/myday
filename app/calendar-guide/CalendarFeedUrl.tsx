"use client";

import { useEffect, useState } from "react";

type FeedResponse = { url?: string; guildName?: string; error?: string };

export default function CalendarFeedUrl() {
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/calendar/ical-url", { credentials: "include" })
      .then(async (response) => {
        const data = (await response.json()) as FeedResponse;
        if (!response.ok) throw new Error(data.error || "購読URLを取得できませんでした。");
        setFeed(data);
      })
      .catch((error: Error) => setFeed({ error: error.message }));
  }, []);

  const copyUrl = async () => {
    if (!feed?.url) return;
    try {
      await navigator.clipboard.writeText(feed.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFeed({ ...feed, error: "コピーできませんでした。URLを選択して手動でコピーしてください。" });
    }
  };

  return (
    <div className="feed-url-box" aria-live="polite">
      <div className="feed-url-heading"><strong>あなたの購読URL</strong><span>読み取り専用</span></div>
      {feed?.url ? (
        <>
          <div className="feed-url-row">
            <input aria-label="カレンダー購読URL" value={feed.url} readOnly onFocus={(event) => event.currentTarget.select()} />
            <button type="button" className="primary-button feed-copy-button" onClick={copyUrl}>{copied ? "コピーしました" : "URLをコピー"}</button>
          </div>
          <p className="feed-url-help">{feed.guildName ? `${feed.guildName}のイベント` : "サーバーイベント"}を購読します。URLをGoogleカレンダーの「URLで追加」に貼り付けてください。</p>
        </>
      ) : feed?.error ? (
        <p className="feed-url-error">{feed.error} <a href="/api/auth/discord/login?return_to=/calendar-guide">Discordでログイン</a></p>
      ) : <p className="feed-url-loading">購読URLを取得しています…</p>}
    </div>
  );
}
