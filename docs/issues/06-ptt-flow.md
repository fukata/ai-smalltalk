# PTTフロー: マイク制御と応答要求

押して話す（Push-To-Talk, PTT）操作で、発話中のみマイクを有効化し、話し終わりでモデルに応答生成を要求します。

## スコープ
- UIのPTTボタン押下で `MediaStreamTrack.enabled` を切り替え
- 話し終わり（ボタン解放）で DataChannel から `response.create` を送信
- （将来）VAD対応の余地を残す（現時点はPTTのみ）

## 受け入れ基準
- [ ] PTT押下で録音が開始される（UIステータス表示）
- [ ] 解放時に応答が生成・再生される
- [ ] 連続会話でも安定して動作

## 備考
- `session.update` で turn detection を `none` にする実装も検討（サーバVADは無効化）。

