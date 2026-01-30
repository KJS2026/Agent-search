# 🧪 Agent Search Engine - POC Plaan

## POC Eesmärk

Tõestada kontseptsiooni minimaalse töömahuga:
1. Saame agentide andmeid koguda
2. Embeddings töötavad semantic searchiks
3. Search annab relevantseid tulemusi

## POC Scope

| Komponent | POC | MVP |
|-----------|-----|-----|
| Agente | 50-100 | 2,700+ |
| Andmeallikad | Moltbook | Moltbook + GitHub + skill.md |
| Search | CLI script | REST API |
| Frontend | ❌ | Next.js |
| Storage | JSON failid | Supabase pgvector |

## POC Sammud

### 1. Andmete kogumine (2h)

```bash
# Moltbook avalik API - ei vaja auth'i
curl "https://www.moltbook.com/api/v1/posts?sort=hot&limit=50"
curl "https://www.moltbook.com/api/v1/submolts"
curl "https://www.moltbook.com/api/v1/search?q=automation"
```

**Script: `scripts/scrape-moltbook.ts`**
```typescript
// Koguda:
// 1. Submoltide nimekiri (saadud: 100+)
// 2. Hot posts (saadud: viimased postitused)
// 3. Agentide nimed postitustest
// 4. Agentide profiilid (kui avalik API lubab)

interface MoltbookAgent {
  id: string;
  name: string;
  description: string;
  skills?: string[];
  karma: number;
  created_at: string;
  submolts: string[];
  post_count: number;
}
```

### 2. Skill Extraction (1h)

Tuvasta oskused agendi kirjeldusest ja postitustest:

```typescript
const SKILL_KEYWORDS = {
  'automation': ['browser', 'playwright', 'puppeteer', 'selenium'],
  'coding': ['code', 'programming', 'developer', 'typescript', 'python'],
  'trading': ['crypto', 'trading', 'defi', 'wallet'],
  'writing': ['content', 'blog', 'writing', 'copywriting'],
  'research': ['research', 'analysis', 'data', 'scraping'],
  // ...
};

function extractSkills(text: string): string[] {
  const skills: string[] = [];
  for (const [category, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some(kw => text.toLowerCase().includes(kw))) {
      skills.push(category);
    }
  }
  return skills;
}
```

### 3. Embeddings genereerimine (1h)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// Iga agendi jaoks:
// embedding = generateEmbedding(agent.name + " " + agent.description + " " + agent.posts)
```

**Maksumus kalkulatsioon:**
- 100 agenti × ~500 tokens = 50,000 tokens
- text-embedding-3-small: $0.02 / 1M tokens
- POC maksumus: ~$0.001 (praktiliselt tasuta)

### 4. Storage (30min)

**POC: JSON failid**
```
/data/
  agents.json       # Agentide metadata
  embeddings.json   # Vektorid (1536 dims per agent)
  index.json        # Kiire lookup
```

**MVP: Supabase pgvector**
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  skills TEXT[],
  source TEXT NOT NULL, -- 'moltbook', 'github', etc
  source_id TEXT,
  karma INTEGER DEFAULT 0,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Similarity search
CREATE INDEX ON agents USING ivfflat (embedding vector_cosine_ops);
```

### 5. Search (1h)

```typescript
import { cosineSimilarity } from './utils';

interface SearchResult {
  agent: MoltbookAgent;
  score: number;
}

async function search(query: string, limit = 10): Promise<SearchResult[]> {
  // 1. Genereeri query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Lae agentide embeddings
  const agents = loadAgents();
  const embeddings = loadEmbeddings();
  
  // 3. Arvuta similarity scores
  const results = agents.map((agent, i) => ({
    agent,
    score: cosineSimilarity(queryEmbedding, embeddings[i])
  }));
  
  // 4. Sorteeri ja tagasta top N
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Test queries:
// - "agent that can trade crypto"
// - "browser automation"
// - "coding assistant"
```

### 6. Demo CLI (30min)

```bash
$ node search.js "agent that can help with trading"

🔍 Search: "agent that can help with trading"

Results:
1. 🦞 Gregory (score: 0.89)
   "Markets, alpha, degen plays..."
   Skills: trading, crypto
   
2. 🦞 Starclawd-1 (score: 0.84)
   "Where agents lose money together..."
   Skills: trading, automation

3. 🦞 Maya (score: 0.78)
   "Browser automation, payments..."
   Skills: automation, infrastructure
```

## Failide struktuur

```
/projects/agent-search/
├── IDEA.md                 # Äriidee dokumentatsioon
├── POC-PLAN.md            # See fail
├── scripts/
│   ├── scrape-moltbook.ts # Andmete kogumine
│   ├── extract-skills.ts  # Skill detection
│   ├── generate-embeddings.ts
│   └── search.ts          # CLI search
├── data/
│   ├── agents.json
│   ├── embeddings.json
│   └── skills-taxonomy.json
└── README.md
```

## Timeline

| Päev | Ülesanne | Tulemus |
|------|----------|---------|
| 1 | Moltbook scraping | 50-100 agenti JSON-is |
| 1 | Skill extraction | Skills lisatud agentidele |
| 2 | Embeddings | Vektorid genereeritud |
| 2 | Search CLI | Töötav semantic search |
| 3 | Testing & tuning | Valideeritud tulemused |

**Total: 3 päeva / ~8 tundi**

## Success Criteria

1. ✅ Vähemalt 50 agenti andmebaasis
2. ✅ Embeddings genereeritud kõigile
3. ✅ Search tagastab relevantseid tulemusi (manual eval)
4. ✅ Demo töötab CLI-st

## Riskid ja mitigatsioonid

| Risk | Tõenäosus | Mõju | Mitigatsioon |
|------|-----------|------|--------------|
| Moltbook rate limiting | Madal | Keskmine | Aeglane scraping, caching |
| Embeddings kallis | Madal | Madal | POC väike, ~$0.01 |
| Search pole relevantne | Keskmine | Kõrge | Tune prompts, add filters |
| API muutub | Madal | Kõrge | Cache andmed lokaalselt |

## Järgmised sammud pärast POC-i

1. **Validatsioon** - Postita Moltbooki, küsi tagasisidet
2. **MVP planeerimine** - Detailne technical spec
3. **Supabase setup** - Production-ready storage
4. **API development** - REST/GraphQL API
5. **Frontend** - Next.js app

---

*POC alustatud: 2026-01-30*
