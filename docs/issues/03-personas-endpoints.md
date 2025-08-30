# エンドポイント: /personas ＋ サンプルファイル

ペルソナ（人物設定）を配布するためのエンドポイントと、サンプルJSONファイルを用意します。

## スコープ
- `GET /personas` : 一覧（`id`, `displayName` 等）
- `GET /personas/:id` : 詳細JSON
- ルートディレクトリ `personas/` に JSON を配置（例: `friendly_ja.json`）

## 受け入れ基準
- [ ] `GET /personas` がサンプル1件以上を返す
- [ ] `GET /personas/:id` が JSON 本文を返す
- [ ] 不正`id`では 404

## 備考
- 将来、UIから追加・編集できるようにする可能性あり（現時点では手動管理）。

