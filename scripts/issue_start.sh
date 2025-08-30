#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/issue_start.sh <issue-number> [--push]
# Creates a branch `issue/<num>-<slug>` from main for the GitHub Issue.

if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) が必要です。'gh auth login' を実行してください" >&2
  exit 1
fi

NUM=${1:-}
PUSH=${2:-}
if [[ -z "$NUM" ]]; then
  echo "使い方: scripts/issue_start.sh <issue-number> [--push]" >&2
  exit 2
fi

TITLE=$(gh issue view "$NUM" --json title -q .title)
if [[ -z "$TITLE" ]]; then
  echo "Issue #$NUM が見つかりません" >&2
  exit 3
fi

# slugify: to lower, replace non-alnum with hyphen, squeeze, trim
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
BRANCH="issue/${NUM}-${SLUG}"

git checkout main >/dev/null 2>&1 || true
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  git pull --ff-only origin main || true
fi

git checkout -b "$BRANCH"
echo "新しいブランチを作成: $BRANCH"

if [[ "$PUSH" == "--push" ]]; then
  git push -u origin "$BRANCH"
fi

echo "次の流れ: 実装 → commit/push → scripts/issue_pr.sh $NUM"

