/**
 * Agent & Skill Search - Keyword-based unified search
 * 
 * Searches both Moltbook agents and ClawdHub skills.
 * 
 * Usage:
 *   npx tsx scripts/simple-search.ts "query"
 *   npx tsx scripts/simple-search.ts --type agent "query"
 *   npx tsx scripts/simple-search.ts --type skill "query"
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(__dirname, '..', 'data');

interface BaseItem {
  id: string;
  type: 'agent' | 'skill';
  name: string;
  description: string;
  source: 'moltbook' | 'clawdhub';
  createdAt: string | number;
}

interface Agent extends BaseItem {
  type: 'agent';
  karma: number;
  followers: number;
  isActive: boolean;
  lastActive: string;
  recentPosts: Array<{
    title: string;
    content: string;
    upvotes: number;
    submolt: string;
  }>;
}

interface Skill extends BaseItem {
  type: 'skill';
  slug: string;
  tags: string[];
  stats: {
    downloads: number;
    installs: number;
    stars: number;
    versions: number;
  };
  latestVersion: string;
}

type SearchItem = Agent | Skill;

interface SearchResult {
  item: SearchItem;
  score: number;
  matchedTerms: string[];
  detectedSkills: string[];
}

// Skill categories for extraction
const SKILL_CATEGORIES: Record<string, string[]> = {
  'automation': ['automate', 'automation', 'browser', 'playwright', 'puppeteer', 'selenium', 'scraping', 'workflow'],
  'coding': ['code', 'coding', 'programming', 'developer', 'typescript', 'python', 'javascript', 'rust', 'git', 'github'],
  'trading': ['crypto', 'trading', 'defi', 'wallet', 'blockchain', 'btc', 'eth', 'swap', 'market', 'bitcoin'],
  'writing': ['content', 'blog', 'writing', 'copywriting', 'newsletter', 'article', 'documentation'],
  'research': ['research', 'analysis', 'data', 'report', 'study', 'investigate'],
  'assistant': ['assistant', 'help', 'task', 'organize', 'calendar', 'email', 'schedule'],
  'creative': ['art', 'design', 'creative', 'image', 'music', 'video', 'generate'],
  'security': ['security', 'pentest', 'vulnerability', 'audit', 'ctf', 'hack', 'exploit'],
  'infrastructure': ['infrastructure', 'devops', 'deploy', 'server', 'docker', 'kubernetes', 'aws'],
  'social': ['social', 'community', 'discord', 'twitter', 'moltbook', 'telegram'],
  'messaging': ['whatsapp', 'telegram', 'slack', 'discord', 'chat', 'message', 'sms'],
  'api': ['api', 'rest', 'graphql', 'endpoint', 'integration', 'webhook'],
};

function getItemText(item: SearchItem): string {
  const parts = [item.name, item.description];
  
  if (item.type === 'agent') {
    parts.push(...item.recentPosts.map(p => `${p.title} ${p.content}`));
  } else if (item.type === 'skill') {
    parts.push(...item.tags);
  }
  
  return parts.filter(Boolean).join(' ');
}

function extractSkills(item: SearchItem): string[] {
  const text = getItemText(item).toLowerCase();
  
  const skills: string[] = [];
  for (const [category, keywords] of Object.entries(SKILL_CATEGORIES)) {
    if (keywords.some(kw => text.includes(kw))) {
      skills.push(category);
    }
  }
  return skills;
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function search(items: SearchItem[], query: string, typeFilter?: 'agent' | 'skill'): SearchResult[] {
  const queryTokens = tokenize(query);
  const results: SearchResult[] = [];
  
  let filtered = items;
  if (typeFilter) {
    filtered = items.filter(i => i.type === typeFilter);
  }
  
  for (const item of filtered) {
    const text = getItemText(item).toLowerCase();
    const tokens = tokenize(text);
    
    let score = 0;
    const matchedTerms: string[] = [];
    
    for (const qt of queryTokens) {
      // Exact match
      const exactMatches = tokens.filter(t => t === qt).length;
      if (exactMatches > 0) {
        score += exactMatches * 10;
        matchedTerms.push(qt);
      }
      
      // Partial match
      const partialMatches = tokens.filter(t => t.includes(qt) || qt.includes(t)).length;
      if (partialMatches > 0) {
        score += partialMatches * 3;
        if (!matchedTerms.includes(qt)) matchedTerms.push(qt + '*');
      }
      
      // Name match (weighted higher)
      if (item.name.toLowerCase().includes(qt)) {
        score += 15;
      }
      
      // Description match
      if (item.description?.toLowerCase().includes(qt)) {
        score += 5;
      }
      
      // Tag match for skills
      if (item.type === 'skill' && item.tags.some(t => t.toLowerCase().includes(qt))) {
        score += 8;
      }
    }
    
    // Type-specific boosts
    if (item.type === 'agent') {
      // Boost by karma (log scale)
      const karmaBoost = Math.log10(Math.max(item.karma, 1) + 1);
      score *= (1 + karmaBoost * 0.1);
      
      // Boost active agents
      if (item.isActive) {
        score *= 1.2;
      }
    } else if (item.type === 'skill') {
      // Boost by downloads (log scale)
      const downloadBoost = Math.log10(Math.max(item.stats.downloads, 1) + 1);
      score *= (1 + downloadBoost * 0.1);
      
      // Boost by stars
      if (item.stats.stars > 0) {
        score *= (1 + Math.log10(item.stats.stars + 1) * 0.15);
      }
    }
    
    if (score > 0) {
      results.push({
        item,
        score,
        matchedTerms,
        detectedSkills: extractSkills(item),
      });
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
}

function formatAgent(item: Agent, result: SearchResult, rank: number): string {
  const lines = [
    `#${rank} 🤖 ${item.name} (score: ${result.score.toFixed(1)}, karma: ${item.karma})`,
    `   Source: Moltbook | Followers: ${item.followers} | Active: ${item.isActive ? '✅' : '❌'}`,
    `   Skills: ${result.detectedSkills.join(', ') || 'none detected'}`,
    `   Matched: ${result.matchedTerms.join(', ')}`,
  ];
  
  if (item.description) {
    lines.push(`   Bio: ${item.description.slice(0, 80)}${item.description.length > 80 ? '...' : ''}`);
  }
  
  if (item.recentPosts.length > 0) {
    const topPost = item.recentPosts[0];
    lines.push(`   Top post: "${topPost.title?.slice(0, 40) || 'Untitled'}..." (${topPost.upvotes}↑)`);
  }
  
  return lines.join('\n');
}

function formatSkill(item: Skill, result: SearchResult, rank: number): string {
  const lines = [
    `#${rank} 🛠️  ${item.name} (score: ${result.score.toFixed(1)})`,
    `   Source: ClawdHub | Downloads: ${item.stats.downloads} | Stars: ${item.stats.stars} | v${item.latestVersion}`,
    `   Tags: ${item.tags.length > 0 ? item.tags.join(', ') : 'none'}`,
    `   Matched: ${result.matchedTerms.join(', ')}`,
  ];
  
  if (item.description) {
    lines.push(`   Desc: ${item.description.slice(0, 80)}${item.description.length > 80 ? '...' : ''}`);
  }
  
  lines.push(`   Install: clawdhub install ${item.slug}`);
  
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse type filter
  let typeFilter: 'agent' | 'skill' | undefined;
  const typeIndex = args.indexOf('--type');
  if (typeIndex !== -1 && args[typeIndex + 1]) {
    const type = args[typeIndex + 1];
    if (type === 'agent' || type === 'skill') {
      typeFilter = type;
    }
    args.splice(typeIndex, 2);
  }
  
  const query = args.join(' ');
  
  if (!query) {
    console.log('🔍 Agent & Skill Search Engine');
    console.log('');
    console.log('Usage: npx tsx scripts/simple-search.ts [options] "your search query"');
    console.log('');
    console.log('Options:');
    console.log('  --type agent   Search only agents (from Moltbook)');
    console.log('  --type skill   Search only skills (from ClawdHub)');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx scripts/simple-search.ts "browser automation"');
    console.log('  npx tsx scripts/simple-search.ts --type skill "whatsapp"');
    console.log('  npx tsx scripts/simple-search.ts --type agent "crypto trading"');
    process.exit(0);
  }
  
  // Try combined.json first, fall back to agents.json
  let items: SearchItem[];
  const combinedPath = join(DATA_DIR, 'combined.json');
  const agentsPath = join(DATA_DIR, 'agents.json');
  
  if (existsSync(combinedPath)) {
    items = JSON.parse(readFileSync(combinedPath, 'utf-8'));
    const agents = items.filter(i => i.type === 'agent').length;
    const skills = items.filter(i => i.type === 'skill').length;
    console.log(`🔍 Searching ${agents} agents + ${skills} skills for: "${query}"${typeFilter ? ` (filter: ${typeFilter})` : ''}\n`);
  } else if (existsSync(agentsPath)) {
    // Legacy: agents only
    const rawAgents = JSON.parse(readFileSync(agentsPath, 'utf-8'));
    items = rawAgents.map((a: any) => ({ ...a, type: 'agent', source: 'moltbook' }));
    console.log(`🔍 Searching ${items.length} agents for: "${query}" (run combine-data.sh for skills)\n`);
  } else {
    console.error('❌ No data found. Run collect-agents.sh and collect-skills.sh first.');
    process.exit(1);
  }
  
  const results = search(items, query, typeFilter);
  
  if (results.length === 0) {
    console.log('No results found matching your query.');
    process.exit(0);
  }
  
  console.log(`📊 Found ${results.length} matching items:\n`);
  console.log('━'.repeat(80));
  
  for (const [i, result] of results.slice(0, 10).entries()) {
    const rank = i + 1;
    console.log('');
    
    if (result.item.type === 'agent') {
      console.log(formatAgent(result.item as Agent, result, rank));
    } else {
      console.log(formatSkill(result.item as Skill, result, rank));
    }
  }
  
  console.log('\n' + '━'.repeat(80));
  
  const agentCount = results.filter(r => r.item.type === 'agent').length;
  const skillCount = results.filter(r => r.item.type === 'skill').length;
  console.log(`\nShowing top 10 of ${results.length} results (${agentCount} agents, ${skillCount} skills).`);
}

main();
