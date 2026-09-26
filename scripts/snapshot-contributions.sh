#!/usr/bin/env bash
# Refreshes src/content/contributions.ts from the GitHub GraphQL API.
# Requires an authenticated `gh` CLI. Numbers on the site come only from here.
set -euo pipefail
cd "$(dirname "$0")/.."
today=$(date +%F)
gh api graphql -f query='{user(login:"Injora"){contributionsCollection{totalCommitContributions totalPullRequestContributions totalIssueContributions contributionCalendar{totalContributions weeks{contributionDays{contributionCount date}}}}}}' \
| jq -r --arg d "$today" '.data.user.contributionsCollection as $c | "// Snapshot from the GitHub GraphQL API (contributionsCollection for Injora), fetched \($d).\n// Regenerate with: scripts/snapshot-contributions.sh — never hand-edit these numbers.\nexport const contributionSnapshot = {\n  fetchedAt: \"\($d)\",\n  from: \"\($c.contributionCalendar.weeks[0].contributionDays[0].date)\",\n  total: \($c.contributionCalendar.totalContributions),\n  commits: \($c.totalCommitContributions),\n  pullRequests: \($c.totalPullRequestContributions),\n  issues: \($c.totalIssueContributions),\n  // one array per week (Sun→Sat), daily contribution counts\n  weeks: \([$c.contributionCalendar.weeks[] | [.contributionDays[].contributionCount]] | tojson),\n} as const;"' \
> src/content/contributions.ts
echo "merged external PRs (update ossStats.mergedExternal in src/content/profile.ts):"
gh api "search/issues?q=author:Injora+type:pr+is:merged+-user:Injora" --jq .total_count
