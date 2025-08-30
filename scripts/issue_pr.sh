#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/issue_pr.sh <issue-number> [--draft]
# Creates a PR from the current branch with title/body referencing the issue.

if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) が必要です。'gh auth login' を実行してください" >&2
  exit 1
fi

NUM=${1:-}
DRAFT_FLAG=${2:-}
if [[ -z "$NUM" ]]; then
  echo "使い方: scripts/issue_pr.sh <issue-number> [--draft]" >&2
  exit 2
fi

TITLE=$(gh issue view "$NUM" --json title -q .title)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

OPTS=()
if [[ "$DRAFT_FLAG" == "--draft" ]]; then
  OPTS+=("--draft")
fi

gh pr create \
  --title "${TITLE} (#${NUM})" \
  --body $'このPRは次のIssueを解決します:\n\n- Fixes #'"$NUM" \
  "${OPTS[@]}"

echo "PRを作成しました。レビュー後にマージしてください。"

