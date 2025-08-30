# Realtime: WebRTC ハンドシェイク＋リモート音声再生

gpt-realtime との WebRTC 接続を確立し、リモート音声トラックを再生できるようにします。

## スコープ
- `web/src/webrtc.ts`（または同等）を作成
- フロー:
  1. `POST /api/session` でエフェメラルトークン取得
  2. `RTCPeerConnection` 生成、`DataChannel`（`oai-events`）作成
  3. ローカルマイクトラック追加
  4. `createOffer`→SDPを OpenAI Realtime へPOST→`answer`を `setRemoteDescription`
  5. `ontrack` でリモート音声を `<audio>` に接続

## 受け入れ基準
- [ ] 接続成功時にステータス表示が更新される
- [ ] リモート音声がブラウザで再生できる
- [ ] 失敗時にユーザー向けエラーメッセージ表示

## 備考
- HTTPS/localhost 前提。ブラウザのマイク許可が必要。

