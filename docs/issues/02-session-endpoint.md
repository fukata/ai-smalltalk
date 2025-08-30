# エンドポイント: /session（gpt-realtime向けエフェメラルセッション）

ブラウザから呼び出す `/session` を実装し、gpt-realtime のエフェメラルセッション（短期トークン）を発行して返却します。

## 背景
- APIキーはブラウザに渡さず、サーバ側でエフェメラルセッションを作成してブラウザへ渡す。
- ブラウザは受け取ったトークンで WebRTC の SDP 交換を行う。

## スコープ
- `POST /session`
  - 入力: `{ model?, voice?, instructions? }`
  - 出力: `{ client_secret: { value, expires_at }, model, voice }` などセッション情報
- OpenAI Realtime セッション作成APIをサーバ側から呼び出す（`OPENAI_API_KEY` 使用）

## 受け入れ基準
- [ ] 正常系で 200 とセッション情報を返す
- [ ] 失敗時は 4xx/5xx とエラーメッセージ(JSON)
- [ ] `.env` による `REALTIME_MODEL`/`VOICE_NAME` 既定値が反映される

## 備考
- 本プロジェクトはローカル実行のみが前提。鍵の取り扱いはサーバ内に限定。

