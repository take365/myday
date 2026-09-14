import Link from "next/link";
import { headers } from "next/headers";
import { calendarFeedSignature, getDiscordSession } from "../discord-auth";
import CalendarFeedUrl from "./CalendarFeedUrl";

export const dynamic = "force-dynamic";

export default async function CalendarGuidePage() {
  const session = await getDiscordSession();
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const initialFeed = session?.guildId && host ? { url: `${protocol}://${host}/api/calendar/ical?guild=${encodeURIComponent(session.guildId)}&sig=${await calendarFeedSignature(session.guildId)}`, guildName: session.guildName, readOnly: true } : null;
  return <main className="guide-shell"><header className="guide-header"><Link href="/" className="guide-back">← カレンダー</Link><p className="eyebrow">CALENDAR SUBSCRIPTION</p><h1>カレンダー連携方法</h1><p>FIREテラスのイベントを、Googleカレンダーなどで読み取り専用表示する方法です。</p></header><section className="guide-grid"><article className="guide-card guide-main"><p className="eyebrow">GOOGLE CALENDAR</p><h2>Googleカレンダーに登録</h2><CalendarFeedUrl initialFeed={initialFeed} /><ol className="guide-steps"><li>上の「URLをコピー」を押す</li><li>GoogleカレンダーをPCで開く</li><li>左側「他のカレンダー」の <strong>＋</strong> を押す</li><li>「URLで追加」を選び、URLを貼り付ける</li><li>「カレンダーを追加」を押す</li></ol><div className="guide-note"><strong>参照専用です</strong><p>登録したカレンダーから予定を編集することはできません。サイト側のイベントを更新すると、Google側は次回同期時に反映されます。</p></div><p className="eyebrow section-label">NAME</p><h2>カレンダー名について</h2><p>配信データには「FIREテラス」という名前を設定しています。ただしGoogleカレンダーは、購読URLや提供元の情報を名前として表示する場合があります。</p><p>URLが名前になった場合は、Googleカレンダーの設定で対象カレンダーを開き、「名前」を <strong>FIREテラス</strong> に変更してください。</p><div className="guide-warning"><strong>URLの取り扱い</strong><p>購読URLを知っている人はイベントを閲覧できます。公開チャットやSNSには貼らず、必要なメンバーだけに共有してください。</p></div></article><aside className="guide-card guide-side"><p className="eyebrow">OTHER CALENDARS</p><h2>対応アプリ</h2><p>iCalendar（ICS）購読に対応したアプリで利用できます。Appleカレンダーなどでも、カレンダーの追加画面から購読URLを登録してください。</p><h2>編集・更新</h2><p>イベントの追加・修正はMy Day APIから行います。参照ユーザーに編集権限はありません。</p><Link href="/api-guide" className="guide-back guide-home-link">APIガイドを見る →</Link></aside></section></main>;
}
