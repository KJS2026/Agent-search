#!/bin/bash
# Agent Search Engine POC - Data Collection Script
# Kogub Moltbook agentide andmed

set -e
cd "$(dirname "$0")/.."

DATA_DIR="data"
mkdir -p "$DATA_DIR"

echo "🦞 Agent Search Engine - Data Collection"
echo "========================================="

# 1. Kogu agentide nimed postitustest
echo ""
echo "📝 Collecting agent names from posts..."
AGENTS=$(curl -s "https://www.moltbook.com/api/v1/posts?sort=hot&limit=100" | jq -r '.posts[].author.name' | sort -u)
AGENT_COUNT=$(echo "$AGENTS" | wc -l)
echo "   Found $AGENT_COUNT unique agents"

# 2. Kogu iga agendi profiil
echo ""
echo "👤 Collecting agent profiles..."
echo "[" > "$DATA_DIR/agents.json"

FIRST=true
COUNT=0
for AGENT in $AGENTS; do
    # Rate limiting - ära spammi API-t
    sleep 0.5
    
    PROFILE=$(curl -s "https://www.moltbook.com/api/v1/agents/profile?name=$AGENT" 2>/dev/null)
    SUCCESS=$(echo "$PROFILE" | jq -r '.success // false')
    
    if [ "$SUCCESS" = "true" ]; then
        COUNT=$((COUNT + 1))
        
        # Lisa koma eelmise elemendi järgi
        if [ "$FIRST" = true ]; then
            FIRST=false
        else
            echo "," >> "$DATA_DIR/agents.json"
        fi
        
        # Salvesta agendi andmed
        echo "$PROFILE" | jq '{
            id: .agent.id,
            name: .agent.name,
            description: .agent.description,
            karma: .agent.karma,
            follower_count: .agent.follower_count,
            following_count: .agent.following_count,
            is_active: .agent.is_active,
            created_at: .agent.created_at,
            last_active: .agent.last_active,
            recent_posts: [.recentPosts[]? | {
                title: .title,
                content: (.content | .[0:500]),
                upvotes: .upvotes,
                submolt: .submolt.name
            }][0:3]
        }' >> "$DATA_DIR/agents.json"
        
        echo "   ✅ $AGENT (karma: $(echo "$PROFILE" | jq -r '.agent.karma'))"
    else
        echo "   ❌ $AGENT (not found or error)"
    fi
done

echo "]" >> "$DATA_DIR/agents.json"

# 3. Kogu submoltide info
echo ""
echo "🏠 Collecting submolts..."
curl -s "https://www.moltbook.com/api/v1/submolts" | jq '.submolts' > "$DATA_DIR/submolts.json"
SUBMOLT_COUNT=$(jq 'length' "$DATA_DIR/submolts.json")
echo "   Found $SUBMOLT_COUNT submolts"

# 4. Kokkuvõte
echo ""
echo "========================================="
echo "✨ Collection complete!"
echo "   Agents: $COUNT"
echo "   Submolts: $SUBMOLT_COUNT"
echo "   Data saved to: $DATA_DIR/"
echo ""
ls -la "$DATA_DIR/"
