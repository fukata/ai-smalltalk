# スキャフォールド: トークンサーバ（Express）

ローカル専用で動作する薄いトークンサーバを作成します。OpenAI の gpt-realtime 用のエフェメラルセッショントークン発行と、ペルソナ情報の提供を担います。

## 目的
- APIキーをクライアントへ配布せず、ローカルサーバ側に保持する。
- ブラウザからは `/session`（トークン発行）と `/personas`（ペルソナ取得）のみ叩けばよい構成にする。

## スコープ
- ディレクトリ: `server/`
- 使用: `express`, `cors`, （任意で）`dotenv`
- エンドポイント:
  - `GET /health` → `{ ok: true }`
  - `POST /session` → エフェメラルトークン/セッション情報を返却
- `.env` から `OPENAI_API_KEY`, `REALTIME_MODEL`, `VOICE_NAME` を読み込む

## 受け入れ基準
- [ ] `npm run server` で `http://localhost:8787` が起動する
- [ ] `GET /health` が 200 と `{ ok: true }` を返す
- [ ] SIGINT で安全に終了する

## 備考
- 本ツールはローカル実行のみを想定。公開サービス用途ではありません。

