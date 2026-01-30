# 🔍 Agent Search Engine - Äriidee

> "Agent Internet Has No Search Engine" - Moltbook, Jaanuar 2026

## Probleemi kirjeldus

AI agentide ökosüsteem kasvab plahvatuslikult:
- **7,792+ avalikku repositooriumit** GitHubis märksõnaga "ai-agents"
- **2,700+ agenti** Moltbookis (AI agentide sotsiaalvõrgustik)
- **286+ skilli** ClawdHub'is
- Tuhandeid agente erinevatest platvormidest

**Probleem:** Pole võimalust leida agente võimekuste/oskuste järgi.

Kui sa otsid:
- "Agent, kes suudab analüüsida finantsandmeid"
- "Agent, kellel on browser automation võimekus"
- "Agent, kes räägib eesti keelt"

...siis praegu pead:
1. Manuaalselt sirvima Moltbooki
2. Otsima GitHubist repositooriume
3. Küsima teistelt agentidelt
4. Lootma juhusele

## Lahenduse visioon

**Agent Search Engine** - Google agentide jaoks.

### Põhifunktsioonid:
1. **Semantic Search** - Otsi loomulikul keeles: "find agents that can trade crypto"
2. **Skill Matching** - Filtreeri võimekuste järgi (browser, code, API calls, etc)
3. **Agent Profiles** - Iga agent saab indekseeritud profiili
4. **Compatibility Scores** - Näita, milliste platvormidega agent töötab

### Kasutajad:
- **Inimesed** - kes otsivad agente projektidele
- **Agendid** - kes otsivad teisi agente koostööks (agent-to-agent commerce)
- **Arendajad** - kes otsivad inspiratsiooni/näiteid

## Andmeallikad

| Allikas | Andmed | Ligipääs | Prioriteet |
|---------|--------|----------|------------|
| **Moltbook** | 2,700+ agenti, profiilid, postitused | ✅ Avalik API | 🔥 Kõrge |
| **GitHub** | 7,792+ repositooriumit, README'd, kood | ✅ GitHub API | 🔥 Kõrge |
| **ClawdHub** | 286+ skilli | ❓ Uurida | 🟡 Keskmine |
| **HuggingFace** | Agentide mudelid, spaces | ✅ API | 🟡 Keskmine |
| **OpenClaw.ai** | Agent creation platform | ❓ Uurida | 🟡 Keskmine |
| **skill.md failid** | Struktureeritud metadata | ✅ HTTP | 🔥 Kõrge |

### Moltbook API (uuritud ✅)
```
Base: https://www.moltbook.com/api/v1

Avalikud endpoint'id (autentimine ei ole vajalik):
- GET /submolts - Kogukondade nimekiri
- GET /posts - Postitused (hot/new/top)
- GET /search?q=... - Otsing
- GET /agents/profile?name=... - Agendi profiil

Autentimist vajavad:
- POST /agents/register - Registreeru
- GET /agents/me - Oma profiil
```

## MVP Scope

### Faas 1: Data Collection (1-2 nädalat)
- [ ] Moltbook agentide scraping
- [ ] GitHub "ai-agents" repos scraping
- [ ] skill.md failide parsemine

### Faas 2: Indexing (1 nädal)
- [ ] Embeddings genereerimine (OpenAI text-embedding-3-small)
- [ ] Vector DB setup (Supabase pgvector)
- [ ] Skill taxonomy loomine

### Faas 3: Search API (1 nädal)
- [ ] REST API: `POST /search {query: "...", filters: {...}}`
- [ ] Semantic similarity search
- [ ] Skill-based filtering

### Faas 4: Frontend (1-2 nädalat)
- [ ] Simple Next.js UI
- [ ] Agent cards
- [ ] Filter sidebar
- [ ] Search box

**Total MVP timeline: 4-6 nädalat**

## Ärimudel

### Revenue Streams

1. **Freemium Search**
   - Free: 50 searches/päev
   - Pro: $9/kuu - unlimited
   - API access: $29/kuu - 10k requests

2. **Premium Agent Listings**
   - Featured placement: $19/kuu
   - Verified badge: $49 one-time
   - Analytics: included with featured

3. **Agent Hiring / Marketplace** (future)
   - Commission: 10% of agent-to-agent transactions
   - Escrow service

4. **Enterprise**
   - Private agent registry
   - Custom integrations
   - SLA support

### Pricing Comparison
| Feature | Free | Pro ($9) | API ($29) | Enterprise |
|---------|------|----------|-----------|------------|
| Searches | 50/day | Unlimited | 10k/mo | Custom |
| Filters | Basic | All | All | All |
| API Access | ❌ | ❌ | ✅ | ✅ |
| Analytics | ❌ | Basic | Full | Custom |

## Konkurendid

### Otsesed (pole veel):
- ❌ Agente-spetsiifilist otsingut pole

### Kaudsed:
| Konkurent | Fookus | Puudus |
|-----------|--------|--------|
| **Google** | Üldine web | Pole agendi metadata |
| **GitHub Search** | Kood | Pole semantic, pole profiilid |
| **HuggingFace** | ML mudelid | Pole agent-spetsiifiline |
| **npm/pypi** | Packages | Pole agentide profiles |

### Meie eelis:
- **First mover** - Esimene agent search engine
- **Native integration** - Moltbook, ClawdHub, skill.md
- **Semantic** - Loomulik keel, mitte keyword matching
- **Agent-friendly** - API for agent-to-agent discovery

## Tehniline arhitektuur

```
┌─────────────────────────────────────────────────────────┐
│                     DATA SOURCES                        │
├─────────────┬───────────────┬───────────────┬──────────┤
│  Moltbook   │    GitHub     │   skill.md    │  Other   │
│    API      │     API       │    Scraper    │  APIs    │
└──────┬──────┴───────┬───────┴───────┬───────┴────┬─────┘
       │              │               │            │
       ▼              ▼               ▼            ▼
┌─────────────────────────────────────────────────────────┐
│                   INGESTION LAYER                       │
│  - Scheduled crawlers (cron)                            │
│  - Webhook listeners                                    │
│  - Rate limiting & retry                                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  PROCESSING LAYER                       │
│  - Text extraction                                      │
│  - Skill detection (NLP)                                │
│  - Embedding generation (OpenAI)                        │
│  - Deduplication                                        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   STORAGE LAYER                         │
├─────────────────────┬───────────────────────────────────┤
│  Supabase Postgres  │         pgvector                  │
│  - Agent profiles   │  - Embeddings (1536 dims)         │
│  - Skills           │  - Similarity search              │
│  - Sources          │                                   │
└─────────────────────┴───────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    SEARCH API                           │
│  POST /search                                           │
│  - Query embedding                                      │
│  - Vector similarity                                    │
│  - Skill filtering                                      │
│  - Ranking                                              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                             │
│  Next.js + Tailwind                                     │
│  - Search UI                                            │
│  - Agent cards                                          │
│  - Filters                                              │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack:
- **Backend:** Node.js + TypeScript (või Python + FastAPI)
- **Database:** Supabase (Postgres + pgvector)
- **Embeddings:** OpenAI text-embedding-3-small
- **Frontend:** Next.js 14 + Tailwind + shadcn/ui
- **Hosting:** Vercel (frontend) + Railway/Fly (backend)
- **Cron:** GitHub Actions või Railway cron

## Open Questions

1. **Real-time vs batch?** - Kui tihti uuendada indeksit?
2. **Agent verification?** - Kuidas kontrollida, et agent on see, kes ta väidab?
3. **Skill taxonomy?** - Kas luua oma või kasutada olemasolevat?
4. **Monetization timing?** - Millal alustada monetiseerimisega?

## Next Steps

1. ✅ Dokumenteerida idee (see fail)
2. ✅ Uurida Moltbook API-t
3. ⬜ Luua POC: scrape 10 agenti, genereeri embeddings, tee simple search
4. ⬜ Valideerida idee Moltbookis (postita, küsi tagasisidet)
5. ⬜ MVP build

---

*Viimati uuendatud: 2026-01-30*
*Autor: Clawdbot + Janis*
