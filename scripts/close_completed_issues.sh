#!/usr/bin/env bash
set -euo pipefail

# 目的: 実装済みのIssueにコメントを付与してCloseします。
# 使い方:
#   REPO=fukata/ai-smalltalk bash scripts/close_completed_issues.sh
#   もしくは引数で指定: bash scripts/close_completed_issues.sh fukata/ai-smalltalk

REPO=${1:-${REPO:-}}
if [ -z "${REPO}" ]; then
  # git remote から推測
  if URL=$(git config --get remote.origin.url 2>/dev/null); then
    if [[ "$URL" =~ github.com[:/]+([^/]+)/([^/.]+) ]]; then
      REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
    fi
  fi
fi
if [ -z "${REPO}" ]; then
  echo "REPO を指定してください（例: REPO=fukata/ai-smalltalk）" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) が必要です。'gh auth login' を実行してください。" >&2
  exit 2
fi

# タイトル → コメント本文 の対応
declare -A BODY

BODY["スキャフォールド: トークンサーバ（Express）"]=$'実装が完了しました。\n- 実装: 9112003 feat(server)\n- エンドポイント: /health, /personas, /personas/:id, /session\n- 備考: ローカル専用・APIキーは server/.env で保持'

BODY["エンドポイント: /session（gpt-realtime向けエフェメラルセッション）"]=$'実装が完了しました。\n- 実装: 9112003 feat(server)\n- 挙動: OpenAI-Beta: realtime=v1 でセッション発行し JSON を返却'

BODY["エンドポイント: /personas ＋ サンプルファイル"]=$'実装が完了しました。\n- 実装: 9112003 feat(server), cf6c12a personas 追加\n- 備考: personas が空でも friendly_ja をフォールバック'

BODY["フロント: Vite アプリ雛形（PTT UI）"]=$'実装が完了しました。\n- 実装: 4ab5a85 feat(web)\n- 要素: 接続/切断, ペルソナ選択, PTT, ログ表示'

BODY["Realtime: WebRTC ハンドシェイク＋リモート音声再生"]=$'実装が完了しました。\n- 実装: 4ab5a85 feat(web)\n- 挙動: /api/session → offer/answer → `<audio>` で再生'

BODY["PTTフロー: マイク制御と応答要求"]=$'実装が完了しました。\n- 実装: 4ab5a85 feat(web)\n- 詳細: 押下で録音ON、解放で input_audio_buffer.commit → response.create'

BODY["チャットログ: 表示＋localStorage保存"]=$'実装が完了しました。\n- 実装: 4ab5a85 feat(web)\n- 仕様: localStorage キー `ai-smalltalk:logs`'

BODY["ペルソナ選択: UIと session.update 連携"]=$'実装が完了しました。\n- 実装: 4ab5a85 feat(web)\n- 仕様: `<select>` 変更時に session.update で instructions 更新'

BODY["開発スクリプト: server+web 起動と .env.example"]=$'実装が完了しました。\n- 実装: bfe39f7 chore(workspaces), 4c66d54 docs\n- ルート: npm workspaces + concurrently で `npm run dev`'

# 対象タイトル一覧（Issue 10 は除外）
read -r -d '' TITLES <<'EOS' || true
スキャフォールド: トークンサーバ（Express）
エンドポイント: /session（gpt-realtime向けエフェメラルセッション）
エンドポイント: /personas ＋ サンプルファイル
フロント: Vite アプリ雛形（PTT UI）
Realtime: WebRTC ハンドシェイク＋リモート音声再生
PTTフロー: マイク制御と応答要求
チャットログ: 表示＋localStorage保存
ペルソナ選択: UIと session.update 連携
開発スクリプト: server+web 起動と .env.example
EOS

echo "${REPO} の完了IssueをCloseします..."

OPEN=$(gh issue list --repo "$REPO" --state open --limit 200 --json number,title)

while IFS= read -r TITLE; do
  [ -z "$TITLE" ] && continue
  NUM=$(jq -r --arg t "$TITLE" '.[] | select(.title==$t) | .number' <<<"$OPEN" | head -n1)
  if [ -z "$NUM" ]; then
    echo "スキップ: 見つからない → $TITLE"
    continue
  fi
  echo "Close: #$NUM $TITLE"
  gh issue comment "$NUM" --repo "$REPO" --body "${BODY[$TITLE]}" >/dev/null
  gh issue close "$NUM" --repo "$REPO" --comment "実装が main に反映されたため Close します。" >/dev/null
done <<< "$TITLES"

echo "完了"
