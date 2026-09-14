"use client";

import { useState } from "react";

type Candidate = { title: string; date: string; startTime: string; endTime: string; category: string; notes: string; confidence: string };

export default function DiscordImportPage() {
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function parse() {
    setBusy(true); setMessage(null);
    const response = await fetch("/api/discord/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    const result = await response.json() as { data?: Candidate[]; error?: string };
    setCandidates(result.data ?? []);
    setMessage(result.error ?? `${result.data?.length ?? 0}件を候補として抽出しました。`);
    setBusy(false);
  }

  async function register(candidate: Candidate, index: number) {
    const response = await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(candidate) });
    if (response.ok) { setCandidates((items) => items.filter((_, itemIndex) => itemIndex !== index)); setMessage("My Dayへ登録しました。日時・タイトルを確認してください。"); }
    else setMessage("登録できませんでした。ChatGPTでログインしているか確認してください。");
  }

  return <main className="shell"><header className="topbar"><div className="brand"><span className="brand-mark">◒</span><span>My Day</span><span className="brand-pill">DISCORD IMPORT</span></div><div className="top-actions"><a className="ghost-button" href="/">カレンダーへ戻る</a></div></header><section className="intro"><div><p className="eyebrow">DISCORD EVENT IMPORT</p><h1>一覧を、<br /><em>予定の候補に。</em></h1><p className="subcopy">Discordのイベント一覧を貼り付けると、日付・時刻・タイトルを候補として抽出します。登録前に必ず内容を確認してください。</p></div></section><section className="import-panel"><label className="import-label">Discordメッセージ本文<textarea value={text} onChange={(event) => setText(event.target.value)} rows={14} placeholder={"例：\n2026年10月\n【東京】\n⭐ 10/14(水) 12:00〜 FIREテラス1周年イベント"} /></label><div className="import-actions"><button className="primary-button" onClick={() => void parse()} disabled={busy || !text.trim()}>{busy ? "解析中…" : "候補を抽出"}</button>{message && <span className="import-message" role="status">{message}</span>}</div></section>{candidates.length > 0 && <section className="candidate-list"><div className="section-heading"><div><p className="eyebrow">REVIEW BEFORE SAVE</p><h2>登録候補 {candidates.length}件</h2></div></div>{candidates.map((candidate, index) => <article className="candidate-card" key={`${candidate.date}-${candidate.title}-${index}`}><div><h3>{candidate.title}</h3><p>{candidate.date} {candidate.startTime || "時刻未定"}{candidate.endTime ? ` — ${candidate.endTime}` : ""}　<span className="category">{candidate.category}</span></p><small>判定: {candidate.confidence === "high" ? "日時あり" : "日時を要確認"}</small></div><button className="primary-button" onClick={() => void register(candidate, index)}>My Dayへ登録</button></article>)}</section>}</main>;
}
