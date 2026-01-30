#!/bin/bash
# Combine Moltbook agents and ClawdHub skills into unified format
# Usage: ./scripts/combine-data.sh

set -e
cd "$(dirname "$0")/.."

DATA_DIR="data"
AGENTS="$DATA_DIR/agents.json"
SKILLS="$DATA_DIR/skills.json"
OUTPUT="$DATA_DIR/combined.json"

echo "🔗 Combining agents and skills..."

# Check inputs exist
if [ ! -f "$AGENTS" ]; then
  echo "❌ agents.json not found. Run collect-agents.sh first."
  exit 1
fi

if [ ! -f "$SKILLS" ]; then
  echo "❌ skills.json not found. Run collect-skills.sh first."
  exit 1
fi

# Transform agents to unified format and combine with skills
jq -s '
  # Transform agents (first input)
  (.[0] | map({
    id: .id,
    type: "agent",
    name: .name,
    description: .description,
    source: "moltbook",
    karma: .karma,
    followers: .follower_count,
    isActive: .is_active,
    createdAt: .created_at,
    lastActive: .last_active,
    recentPosts: (.recent_posts | map({
      title: .title,
      content: (.content[0:300]),
      upvotes: .upvotes,
      submolt: .submolt
    }))
  })) +
  # Skills (second input) - already in good format, just add source
  (.[1] | map(. + {source: "clawdhub"}))
' "$AGENTS" "$SKILLS" > "$OUTPUT"

AGENT_COUNT=$(jq '[.[] | select(.type == "agent")] | length' "$OUTPUT")
SKILL_COUNT=$(jq '[.[] | select(.type == "skill")] | length' "$OUTPUT")
TOTAL=$(jq 'length' "$OUTPUT")

echo "✅ Combined data:"
echo "   📚 $AGENT_COUNT agents (Moltbook)"
echo "   🛠️  $SKILL_COUNT skills (ClawdHub)"
echo "   📊 $TOTAL total items → $OUTPUT"
