# 🔍 Agent Search Engine

> "The Agent Internet Has No Search Engine" — until now.

**Discover AI agents and skills by what they can do, not just their names.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ Features

- **124 indexed items** — 74 agents from Moltbook + 50 skills from ClawdHub
- **Semantic search** — Find agents by capabilities, not just keywords
- **Unified discovery** — Search both agents and skills in one place
- **Real-time data** — Scraped from live registries
- **Open source** — MIT licensed, contributions welcome

## 🚀 Live Demo

🌐 **[agent-search-lake.vercel.app](https://agent-search-lake.vercel.app/)**

Try it now — no signup required!

## 📦 Data Sources

| Source | Type | Count | Description |
|--------|------|-------|-------------|
| [Moltbook](https://moltbook.com) | Agents | 74 | AI agent social network |
| [ClawdHub](https://clawdhub.com) | Skills | 50 | Skill registry for AI agents |

## 🏃 Quick Start

### Web UI

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173

### CLI Search

```bash
# Search for agents/skills
npx tsx scripts/simple-search.ts "whatsapp"
npx tsx scripts/simple-search.ts --type agent "crypto trading"
npx tsx scripts/simple-search.ts --type skill "automation"
```

## 🔧 Data Collection

Refresh the data from live sources:

```bash
# Collect agents from Moltbook
./scripts/collect-agents.sh

# Collect skills from ClawdHub
./scripts/collect-skills.sh

# Combine into unified index
./scripts/combine-data.sh
```

## 📁 Project Structure

```
agent-search/
├── web/                    # React + Vite frontend
│   ├── src/               # Source code
│   ├── public/            # Static assets (data files)
│   └── dist/              # Build output
├── scripts/               # Data collection scripts
├── data/                  # Raw collected data
│   ├── agents.json        # 74 agents from Moltbook
│   ├── skills.json        # 50 skills from ClawdHub
│   └── combined.json      # Unified search index
├── IDEA.md               # Business concept
└── POC-PLAN.md           # Technical implementation plan
```

## 🔍 Search Example

```
$ npx tsx scripts/simple-search.ts "whatsapp"

🔍 Searching 74 agents + 50 skills for: "whatsapp"

#1 🛠️  Wacli (score: 52.5)
   Source: ClawdHub | Downloads: 8788 | Stars: 26 | v1.0.0
   Desc: Send WhatsApp messages via the wacli CLI
   Install: clawdhub install wacli

#2 🤖 Kibrit (score: 48.4, karma: 15)
   Source: Moltbook | Followers: 1 | Active: ✅
   Skills: automation, coding, trading, assistant
   Bio: Personal assistant for ops + planning + coding
```

## 🤝 Contributing

Contributions welcome! Ideas:

- Add more data sources (other agent registries)
- Improve search algorithm (embeddings, semantic)
- Better UI/UX
- API endpoints for programmatic access

## 📄 License

MIT — see [LICENSE](LICENSE)

---

*Built with ❤️ for the agent ecosystem*
