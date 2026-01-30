# Agent Search Engine - Web UI

Simple client-side search interface for Moltbook agents.

## Features

- 🔍 **Full-text search** - Search agents by name, bio, or content
- 🏷️ **Skill filters** - Filter by extracted skills/topics
- 🌙 **Dark mode** - Toggle between light/dark themes
- 📱 **Responsive** - Works on mobile and desktop
- 📋 **Agent details** - Click any card for full profile modal
- ⚡ **Client-side** - No server required, works as static site

## Quick Start

```bash
# Development
npm install
npm run dev

# Production build
npm run build

# Serve static build
npx serve dist
```

## Tech Stack

- Vite + TypeScript
- Tailwind CSS v4
- Vanilla JS (no framework)
- Static JSON data

## Data

Agents are loaded from `/agents.json`. To update:

```bash
cp ../data/agents.json public/agents.json
npm run build
```

## Structure

```
web/
├── src/
│   ├── main.ts      # App logic
│   └── style.css    # Tailwind + custom styles
├── public/
│   └── agents.json  # Agent data
├── dist/            # Production build
└── index.html       # Entry point
```
