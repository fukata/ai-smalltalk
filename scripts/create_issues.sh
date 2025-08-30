#!/usr/bin/env bash
set -euo pipefail

# Create GitHub issues for this project using GitHub CLI (gh).
# Usage:
#   scripts/create_issues.sh <owner/repo>
#   or set REPO env: REPO=owner/repo scripts/create_issues.sh

REPO=${1:-${REPO:-}}
if [ -z "${REPO}" ]; then
  # Try to infer from git remote
  if URL=$(git config --get remote.origin.url 2>/dev/null); then
    # support git@github.com:owner/repo.git and https://github.com/owner/repo.git
    if [[ "$URL" =~ github.com[:/]+([^/]+)/([^/.]+) ]]; then
      REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
    fi
  fi
fi

if [ -z "${REPO}" ]; then
  echo "Usage: scripts/create_issues.sh <owner/repo>  (or set REPO env)" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install and authenticate with 'gh auth login'." >&2
  exit 2
fi

echo "${REPO} に日本語のIssueを作成します..."

# 必要ラベルを事前に作成（存在していてもエラーは無視）
REQ_LABELS=("backend" "frontend" "feature" "tooling" "enhancement" "priority:high")
for L in "${REQ_LABELS[@]}"; do
  gh label create "$L" --repo "$REPO" --color BFDADC --description "auto" >/dev/null 2>&1 || true
done

gh issue create --repo "$REPO" --title "スキャフォールド: トークンサーバ（Express）" --body-file docs/issues/01-token-server.md --label backend --label feature --label "priority:high" >/dev/null
gh issue create --repo "$REPO" --title "エンドポイント: /session（gpt-realtime向けエフェメラルセッション）" --body-file docs/issues/02-session-endpoint.md --label backend --label feature --label "priority:high" >/dev/null
gh issue create --repo "$REPO" --title "エンドポイント: /personas ＋ サンプルファイル" --body-file docs/issues/03-personas-endpoints.md --label backend --label feature >/dev/null
gh issue create --repo "$REPO" --title "フロント: Vite アプリ雛形（PTT UI）" --body-file docs/issues/04-frontend-skeleton.md --label frontend --label feature --label "priority:high" >/dev/null
gh issue create --repo "$REPO" --title "Realtime: WebRTC ハンドシェイク＋リモート音声再生" --body-file docs/issues/05-realtime-handshake.md --label frontend --label feature --label "priority:high" >/dev/null
gh issue create --repo "$REPO" --title "PTTフロー: マイク制御と応答要求" --body-file docs/issues/06-ptt-flow.md --label frontend --label feature >/dev/null
gh issue create --repo "$REPO" --title "チャットログ: 表示＋localStorage保存" --body-file docs/issues/07-chat-log.md --label frontend --label feature >/dev/null
gh issue create --repo "$REPO" --title "ペルソナ選択: UIと session.update 連携" --body-file docs/issues/08-persona-selection.md --label frontend --label feature >/dev/null
gh issue create --repo "$REPO" --title "開発スクリプト: server+web 起動と .env.example" --body-file docs/issues/09-dev-scripts.md --label tooling >/dev/null
gh issue create --repo "$REPO" --title "エラーハンドリング: ステータス表示と再試行" --body-file docs/issues/10-error-handling.md --label frontend --label backend --label enhancement >/dev/null

echo "作成完了。"
