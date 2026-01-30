#!/bin/bash
# Collect skills from ClawdHub
# Usage: ./scripts/collect-skills.sh

set -e
cd "$(dirname "$0")/.."

DATA_DIR="data"
OUTPUT="$DATA_DIR/skills.json"
TEMP="$DATA_DIR/skills-raw.json"

echo "📦 Collecting skills from ClawdHub..."

# Get skills sorted by downloads (most popular first)
echo "  Fetching popular skills (by downloads)..."
clawdhub explore --limit 50 --sort downloads --json > "$TEMP"

# Transform to unified format
echo "  Transforming data..."
jq '[.items[] | {
  id: .slug,
  type: "skill",
  name: (.displayName // .slug),
  slug: .slug,
  description: .summary,
  author: (.author // "unknown"),
  tags: (.tags | keys | map(select(. != "latest"))),
  stats: {
    downloads: .stats.downloads,
    installs: .stats.installsAllTime,
    stars: .stats.stars,
    versions: .stats.versions
  },
  createdAt: .createdAt,
  updatedAt: .updatedAt,
  latestVersion: .latestVersion.version
}]' "$TEMP" > "$OUTPUT"

SKILL_COUNT=$(jq 'length' "$OUTPUT")
echo "✅ Collected $SKILL_COUNT skills → $OUTPUT"

# Cleanup
rm -f "$TEMP"

# Show sample
echo ""
echo "📋 Sample skills:"
jq -r '.[0:5][] | "  - \(.name): \(.description[0:60])..."' "$OUTPUT"
