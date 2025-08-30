# ai-smalltalk

OpenAI gpt‑realtime API を用いて、音声入力/出力で雑談できるローカル実行ツールです。ブラウザで話しかけると、チャット欄にテキストが表示され、アシスタントの音声とテキストがリアルタイムに返ってきます。人物設定（ペルソナ）の切替に対応しています。

注意: 本ツールはローカル実行のみを想定しています（公開サービスとしての利用は対象外）。

---

## 特長
- ペルソナ切替: `personas/*.json` を切り替えて話し方や文体を変更
- チャット表示: ユーザ発話とアシスタント応答をテキストで可視化（localStorageに保存）
- 音声/テキスト同時: gpt‑realtime の音声応答に合わせてテキストもストリーミング表示
- PTT運用: 押して話す（Push‑To‑Talk）で誤認識やノイズを抑制
- ローカル専用: APIキーはローカルサーバ（Express）側でのみ保持

---

## アーキテクチャ
- フロントエンド（`web/`）
  - Vite + TypeScript
  - WebRTC で gpt‑realtime に接続
  - PTT ボタン・ペルソナ選択・チャット表示
- トークンサーバ（`server/`）
  - Express（ローカル専用）
  - `/session`: エフェメラルセッション発行（API キーはサーバにのみ保持）
  - `/personas`, `/personas/:id`: ペルソナ一覧・詳細の配布

---

## 必要要件
- Node.js 18 以上（LTS 推奨）
- 近代ブラウザ（Chrome/Edge/Safari/Firefox の最新）
- マイクとスピーカー

---

## セットアップ（最小）
1) APIキーの配置
- `server/.env` に OpenAI API キーを設定します。
```
OPENAI_API_KEY=sk-...
REALTIME_MODEL=gpt-realtime
VOICE_NAME=alloy
PORT=8787
# 任意: ペルソナディレクトリを変更したい場合
# PERSONAS_DIR=/absolute/or/relative/path
```

2) 依存インストールと起動（ワンコマンド）
```
# ルート（ワークスペース）で一度だけ
npm install

# サーバとフロントを同時起動
npm run dev
```
- フロント: http://localhost:5173
- サーバ: http://localhost:8787

3) 使い方
- 「接続」をクリック → ステータスが「接続完了」になればOK
- 「押して話す（PTT）」を押している間だけ録音／離すと送信確定
- 以降、アシスタントの音声とテキストがストリーミングで返ってきます
- ペルソナは画面上部のプルダウンから切替可能

---

## ディレクトリ構成（抜粋）
```
.
├─ server/                 # ローカル専用トークンサーバ（Express）
│  └─ src/index.js         # /session, /personas, /health
├─ web/                    # フロントエンド（Vite + TypeScript）
│  ├─ index.html           # 最小UI（PTT/接続/ログ）
│  └─ src/                 # main.ts, webrtc.ts など
├─ personas/               # ペルソナ定義（例: friendly_ja.json）
├─ AGENTS.md               # 機能詳細・設計メモ
├─ README.md               # このファイル
└─ scripts/                # 運用スクリプト（Issues/PRフロー 等）
```

---

## 開発メモ
- エラーハンドリング: 接続失敗・切断時に画面上部のバナーで再試行を案内
- ログ保存: 文字データのみを localStorage に保存（音声の生データは保持しない）
- ペルソナ: `personas/*.json` を追加すると一覧に反映。空の場合でも `friendly_ja` がデフォルトで表示されます

---

## Issue/PR の運用（任意）
以下のスクリプトで、Issue 単位のブランチ→PR→マージのフローを運用できます（GitHub CLI 必須）。
```
# ブランチ作成（issue/<番号>-<スラッグ>）
bash scripts/issue_start.sh <番号> [--push]

# PR 作成（タイトル/本文に Issue 番号を埋め込み）
bash scripts/issue_pr.sh <番号> [--draft]

# マージ（既定は --squash、ブランチ削除）
bash scripts/issue_merge.sh <番号> [--squash|--merge|--rebase]
```

---

## トラブルシューティング
- 音が出ない/小さい: 出力デバイス・音量・ミュート、ブラウザの自動再生ポリシーを確認
- マイク権限: 初回アクセス時に許可ダイアログが出ます。拒否した場合はサイト権限を再設定
- 接続できない: API キー設定、`/session` のレスポンス、ネットワーク（プロキシ）を確認
- 切断される: 画面上部のバナーから再接続。タブのバックグラウンド制限や回線状態も確認

---

## ライセンス
本リポジトリのライセンスは未定義です（必要に応じて追加してください）。

