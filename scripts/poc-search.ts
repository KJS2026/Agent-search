/**
 * Agent Search Engine POC - Embedding & Search
 * 
 * Usage:
 *   npx tsx scripts/poc-search.ts generate   # Generate embeddings
 *   npx tsx scripts/poc-search.ts search "query"   # Search agents
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(__dirname, '..', 'data');

interface Agent {
  id: string;
  name: string;
  description: string;
  karma: number;
  follower_count: number;
  following_count: number;
  is_active: boolean;
  created_at: string;
  last_active: string;
  recent_posts: Array<{
    title: string;
    content: string;
    upvotes: number;
    submolt: string;
  }>;
}

interface AgentWithEmbedding extends Agent {
  embedding?: number[];
  skills?: string[];
}

// Skill keywords for extraction
const SKILL_CATEGORIES: Record<string, string[]> = {
  'automation': ['automate', 'automation', 'browser', 'playwright', 'puppeteer', 'selenium', 'scraping'],
  'coding': ['code', 'coding', 'programming', 'developer', 'typescript', 'python', 'javascript', 'rust', 'git'],
  'trading': ['crypto', 'trading', 'defi', 'wallet', 'blockchain', 'btc', 'eth', 'swap', 'market'],
  'writing': ['content', 'blog', 'writing', 'copywriting', 'newsletter', 'article'],
  'research': ['research', 'analysis', 'data', 'report', 'study'],
  'assistant': ['assistant', 'help', 'task', 'organize', 'calendar', 'email'],
  'creative': ['art', 'design', 'creative', 'image', 'music', 'video'],
  'security': ['security', 'pentest', 'vulnerability', 'audit', 'ctf'],
  'infrastructure': ['infrastructure', 'devops', 'deploy', 'server', 'docker', 'kubernetes'],
  'social': ['social', 'community', 'discord', 'twitter', 'moltbook'],
};

function extractSkills(agent: Agent): string[] {
  const text = [
    agent.description || '',
    ...agent.recent_posts.map(p => `${p.title} ${p.content}`)
  ].join(' ').toLowerCase();
  
  const skills: string[] = [];
  for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
    if (keywords.some(kw => text.includes(kw))) {
      skills.push(category);
    }
  }
  return skills;
}

function getAgentText(agent: Agent): string {
  const parts = [
    `Agent: ${agent.name}`,
    agent.description ? `Description: ${agent.description}` : '',
    ...agent.recent_posts.slice(0, 3).map(p => 
      `Post in ${p.submolt}: ${p.title}. ${p.content.slice(0, 200)}`
    )
  ];
  return parts.filter(Boolean).join('\n');
}

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set');
  }
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit input length
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function generateEmbeddings() {
  console.log('🔄 Generating embeddings...\n');
  
  const agentsPath = join(DATA_DIR, 'agents.json');
  if (!existsSync(agentsPath)) {
    console.error('❌ agents.json not found. Run collect-agents.sh first.');
    process.exit(1);
  }
  
  const agents: Agent[] = JSON.parse(readFileSync(agentsPath, 'utf-8'));
  console.log(`📊 Found ${agents.length} agents\n`);
  
  const agentsWithEmbeddings: AgentWithEmbedding[] = [];
  
  for (const agent of agents) {
    try {
      const text = getAgentText(agent);
      const embedding = await generateEmbedding(text);
      const skills = extractSkills(agent);
      
      agentsWithEmbeddings.push({
        ...agent,
        embedding,
        skills,
      });
      
      console.log(`✅ ${agent.name} - Skills: ${skills.join(', ') || 'none detected'}`);
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`❌ ${agent.name}: ${err}`);
    }
  }
  
  // Save embeddings
  const embeddingsPath = join(DATA_DIR, 'embeddings.json');
  writeFileSync(embeddingsPath, JSON.stringify(agentsWithEmbeddings, null, 2));
  console.log(`\n💾 Saved ${agentsWithEmbeddings.length} embeddings to ${embeddingsPath}`);
}

async function search(query: string, limit = 10) {
  console.log(`🔍 Searching: "${query}"\n`);
  
  const embeddingsPath = join(DATA_DIR, 'embeddings.json');
  if (!existsSync(embeddingsPath)) {
    console.error('❌ embeddings.json not found. Run with "generate" first.');
    process.exit(1);
  }
  
  const agents: AgentWithEmbedding[] = JSON.parse(readFileSync(embeddingsPath, 'utf-8'));
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Calculate similarity scores
  const results = agents
    .filter(a => a.embedding)
    .map(agent => ({
      agent,
      score: cosineSimilarity(queryEmbedding, agent.embedding!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  // Display results
  console.log('Results:\n');
  results.forEach((r, i) => {
    const { agent, score } = r;
    console.log(`${i + 1}. 🦞 ${agent.name} (score: ${score.toFixed(3)})`);
    console.log(`   "${agent.description || 'No description'}"`);
    console.log(`   Skills: ${agent.skills?.join(', ') || 'none'}`);
    console.log(`   Karma: ${agent.karma} | Followers: ${agent.follower_count}`);
    console.log('');
  });
}

// CLI
const command = process.argv[2];
const query = process.argv.slice(3).join(' ');

if (command === 'generate') {
  generateEmbeddings();
} else if (command === 'search' && query) {
  search(query);
} else {
  console.log(`
Agent Search Engine POC

Usage:
  npx tsx scripts/poc-search.ts generate          # Generate embeddings for all agents
  npx tsx scripts/poc-search.ts search "query"    # Search agents

Examples:
  npx tsx scripts/poc-search.ts search "crypto trading agent"
  npx tsx scripts/poc-search.ts search "browser automation"
  npx tsx scripts/poc-search.ts search "coding assistant"
`);
}
