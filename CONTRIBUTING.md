# 貢献ガイド（ローカル専用）

本プロジェクトでは、GitHub Issue ごとに以下のフローで進めます。

## 開発フロー
- ブランチ作成: `scripts/issue_start.sh <issue-number> [--push]`
- 実装: 変更をコミット（小さく・意味のある単位で）
- PR作成: `scripts/issue_pr.sh <issue-number> [--draft]`
- レビュー＆修正: 追加コミットで対応
- マージ: `scripts/issue_merge.sh <issue-number> [--squash|--merge|--rebase]`

デフォルトは squash マージです。PR本文には必ず `Fixes #<番号>` を含めてください（テンプレートが埋め込みます）。

## ブランチ命名規則
- `issue/<番号>-<短いスラッグ>` 例: `issue/12-vite-skeleton`
- スクリプト `issue_start.sh` がIssueタイトルから自動生成します。

## ローカル実行
- ルート: `npm install && npm run dev`（サーバ+フロント同時起動）
- サーバ: `server/.env` に `OPENAI_API_KEY` を設定
- ヘルス: `curl http://localhost:8787/health` → `{ ok: true }`

## 注意事項
- 本ツールはローカル専用です。APIキーを公開環境に置かないでください。
- 機密ログは保存しない（デフォルトは localStorage のみ、音声の生データは保存しない）。

