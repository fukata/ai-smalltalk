# 開発スクリプト: server+web 起動と .env.example

開発時にサーバとフロントを別々に起動できるようにし、`.env.example` を用意します。

## スコープ
- ルートに `.env.example` を追加
- `server/` に `npm run dev`（nodemon）と `npm run start`
- `web/` に `npm run dev`（vite）と `npm run build`
- ルート README/AGENTS.md に起動手順の追記

## 受け入れ基準
- [ ] `.env.example` が必要なキーを網羅（APIキーは空欄）
- [ ] `server` と `web` がそれぞれ単体で起動可能
- [ ] ドキュメントが最新

## 備考
- 並列起動用のツール（concurrently等）は必須ではない（任意）。

