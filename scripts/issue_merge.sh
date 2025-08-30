#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/issue_merge.sh <issue-number> [--squash]
# Finds the PR for the issue (by branch naming or search) and merges it.

if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) が必要です。'gh auth login' を実行してください" >&2
  exit 1
fi

NUM=${1:-}
MODE=${2:-"--squash"}
if [[ -z "$NUM" ]]; then
  echo "使い方: scripts/issue_merge.sh <issue-number> [--squash|--merge|--rebase]" >&2
  exit 2
fi

# Try to infer PR by branch pattern issue/<num>-
PR_NUMBER=$(gh pr list --state open --json number,headRefName,title -q \
  '.[] | select((.headRefName|test("^issue/'"$NUM"'-")) or (.title|test("#'"$NUM"'"))) | .number' | head -n1)

if [[ -z "$PR_NUMBER" ]]; then
  echo "Issue #$NUM に紐づくオープンPRが見つかりませんでした" >&2
  exit 3
fi

echo "PR #$PR_NUMBER を ${MODE#--} でマージします..."
gh pr merge "$PR_NUMBER" "$MODE" --delete-branch --auto --admin || gh pr merge "$PR_NUMBER" "$MODE" --delete-branch

echo "マージ完了"

