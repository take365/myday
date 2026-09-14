# FIREテラス イベントカレンダー

Discordサーバー「きたろうのサーバー」で共有されているイベントを、見やすい月間カレンダーとして参照するためのWebアプリです。Discordアカウントでログインしたサーバーメンバーだけがカレンダーを閲覧できます。

## 公開サイト

<https://calendar.chita256.chatgpt.site>

## 現在の主な機能

- Discord OAuthによるサーバーメンバー認証
- サーバー単位で共有するイベントカレンダー
- 月間カレンダー表示、日付・日時予定の表示
- 関東・関西・中部・オンラインの地域フィルター
- イベント詳細ポップアップと元Discordメッセージへのリンク
- Googleカレンダーなどへ登録できる読み取り専用ICS購読URL
- `/calendar-guide` のカレンダー連携方法ページ
- 管理者・AIエージェント向けの認証付きイベント登録API

## カレンダー連携

Discordログイン後、サイト上部の「カレンダー連携方法」から購読URLを表示・コピーできます。Googleカレンダーの「他のカレンダー → URLで追加」に貼り付けて利用します。購読は読み取り専用です。

## イベント登録API

管理用APIキーをBearerトークンとして使用します。イベントの一括登録・更新は次のエンドポイントです。

```text
POST   /api/v1/events/import
GET    /api/v1/tasks
GET    /api/v1/tasks/:id
POST   /api/v1/tasks
PATCH  /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
```

詳しい項目、認証方法、レスポンス、エラー、curl例は<https://calendar.chita256.chatgpt.site/api-guide>を参照してください。APIキーは画面のAPIガイドから発行できます。キー本体は保存せず、ハッシュ化して管理します。

## 個人用カレンダーとしての旧来機能

このアプリはもともと「My Day」という個人用カレンダー・タスク管理アプリとして作成していました。個人用として利用する場合は、次の機能が残っています。

- 個人単位の予定・タスク保存
- 予定の追加、編集、詳細表示、完了、削除
- 月間カレンダーと日別アジェンダ
- 画像、PDF、Officeファイルなどの添付（R2保存）
- 添付画像のブラウザ側軽量化
- ChatGPTログインによる個人データ分離

現在の公開画面はDiscordイベントの参照を主目的としており、個人用の予定追加UIは前面に出していません。既存APIやデータモデルは個人用の用途にも対応しています。

## 技術構成

- Next.js / React / vinext
- Cloudflare Workers
- Cloudflare D1（イベント、予定、APIキー）
- Cloudflare R2（添付ファイル）
- Drizzle ORM
- Sites（公開・ホスティング）

## ローカル開発

必要環境：Node.js 22.13以上

```bash
npm install
npm run dev
```

ビルド確認：

```bash
npm run build
```

## Discord連携の補足

Discordの自動巡回・自動取込は現在の主経路ではありません。イベント本文の解釈と登録は、管理者またはAIエージェントが画面確認/API経由で行う想定です。Discord Bot用のInteractions APIなど、過去の試作コードは互換性のため一部残しています。

## データベース

D1のスキーマは `db/schema.ts`、マイグレーションは `drizzle/` にあります。

```bash
npm run db:generate
```

## 補足

`docs/`、`assets/`、`screenshots/` などの資料類はアプリ本体と分離して管理します。
