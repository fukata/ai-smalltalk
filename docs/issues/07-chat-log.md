# チャットログ: 表示＋localStorage保存

会話（ユーザ発話・アシスタント応答）を画面に表示し、ブラウザの localStorage に保存します。

## スコープ
- 型: `{ id, role, content, timestamp, personaId? }`
- UI: 最新が下に積まれるチャットビュー
- 保存/復元: localStorage キー `ai-smalltalk:logs`

## 受け入れ基準
- [ ] 発話・応答が逐次表示される
- [ ] リロード後も直前のログが復元される
- [ ] クリア操作が可能

## 備考
- 音声の生データは保存しない（テキストのみ）。

