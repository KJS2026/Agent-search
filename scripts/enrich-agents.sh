#!/bin/bash
# Enrich agent data with GitHub URLs and capability tags
# Extracts structured metadata from agent descriptions and recent posts

set -e
cd "$(dirname "$0")/.."

DATA_DIR="data"
INPUT="$DATA_DIR/agents.json"
OUTPUT="$DATA_DIR/agents-enriched.json"

if [ ! -f "$INPUT" ]; then
    echo "Error: $INPUT not found. Run collect-agents.sh first."
    exit 1
fi

echo "🔍 Agent Search Engine - Data Enrichment"
echo "========================================="

node -e '
const fs = require("fs");
const agents = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));

// Extract GitHub URLs from text
function extractGithubUrls(text) {
    if (!text) return [];
    const re = /https?:\/\/github\.com\/[\w\-]+\/[\w\-\.]+/gi;
    return [...new Set((text.match(re) || []))];
}

// Extract capability keywords from text
function extractCapabilities(text) {
    if (!text) return [];
    const lower = text.toLowerCase();
    const caps = [];
    const keywords = {
        "mcp": "mcp-server",
        "mcp server": "mcp-server",
        "web scraping": "web-scraping",
        "scraping": "web-scraping",
        "crypto": "crypto",
        "monero": "crypto",
        "bitcoin": "crypto",
        "lightning": "crypto",
        "security": "security",
        "prompt injection": "security",
        "search": "search",
        "automation": "automation",
        "cron": "automation",
        "heartbeat": "automation",
        "infrastructure": "infrastructure",
        "api": "api",
        "cli": "cli",
        "discord": "discord",
        "slack": "slack",
        "telegram": "telegram",
        "trading": "trading",
        "analytics": "analytics",
        "monitoring": "monitoring",
        "image generation": "image-generation",
        "code review": "code-review",
        "deployment": "deployment",
        "docker": "docker",
        "nostr": "nostr",
    };
    for (const [keyword, tag] of Object.entries(keywords)) {
        if (lower.includes(keyword) && !caps.includes(tag)) {
            caps.push(tag);
        }
    }
    return caps.sort();
}

let enriched = 0;
const results = agents.map(agent => {
    // Combine all text sources
    const allText = [
        agent.description || "",
        ...(agent.recent_posts || []).map(p => (p.title || "") + " " + (p.content || ""))
    ].join(" ");

    const github_urls = extractGithubUrls(allText);
    const capabilities = extractCapabilities(allText);

    if (github_urls.length > 0 || capabilities.length > 0) enriched++;

    return {
        ...agent,
        github_urls,
        capabilities,
    };
});

fs.writeFileSync(process.argv[2], JSON.stringify(results, null, 2));
console.log("   Processed: " + results.length + " agents");
console.log("   Enriched:  " + enriched + " agents with new metadata");

// Stats
const withGithub = results.filter(a => a.github_urls.length > 0).length;
const withCaps = results.filter(a => a.capabilities.length > 0).length;
const allCaps = {};
results.forEach(a => a.capabilities.forEach(c => { allCaps[c] = (allCaps[c] || 0) + 1; }));

console.log("   With GitHub: " + withGithub);
console.log("   With capabilities: " + withCaps);
console.log("");
console.log("   Capability distribution:");
Object.entries(allCaps).sort((a,b) => b[1] - a[1]).forEach(([cap, count]) => {
    console.log("     " + cap + ": " + count);
});
' "$INPUT" "$OUTPUT"

echo ""
echo "========================================="
echo "Enriched data saved to: $OUTPUT"
echo ""
echo "To use enriched data in the web UI:"
echo "  cp $OUTPUT web/public/agents.json"
