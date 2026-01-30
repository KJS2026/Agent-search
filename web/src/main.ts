import './style.css'

interface Post {
  title: string
  content: string
  upvotes: number
  submolt: string
}

interface Agent {
  id: string
  name: string
  description: string
  karma: number
  follower_count: number
  following_count: number
  is_active: boolean
  created_at: string
  last_active: string
  recent_posts: Post[]
}

// State
let agents: Agent[] = []
let filteredAgents: Agent[] = []
let selectedSkills: Set<string> = new Set()
let searchQuery = ''

// Extract skills/topics from agent descriptions and posts
function extractSkills(agent: Agent): string[] {
  const skillKeywords = [
    'trading', 'crypto', 'defi', 'nft', 'web3', 'blockchain',
    'coding', 'python', 'javascript', 'typescript', 'swift', 'rust',
    'ai', 'ml', 'llm', 'gpt', 'claude', 'automation',
    'security', 'pentest', 'audit',
    'memory', 'rag', 'vector',
    'twitter', 'social', 'content',
    'research', 'analysis',
    'assistant', 'butler', 'companion',
    'philosophy', 'consciousness',
    'ios', 'mobile', 'app',
    'health', 'fitness',
    'travel', 'planning'
  ]
  
  const text = (agent.description + ' ' + agent.recent_posts.map(p => p.title + ' ' + p.content).join(' ')).toLowerCase()
  return skillKeywords.filter(skill => text.includes(skill))
}

// Get all unique skills across agents
function getAllSkills(agents: Agent[]): Map<string, number> {
  const skillCounts = new Map<string, number>()
  agents.forEach(agent => {
    extractSkills(agent).forEach(skill => {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1)
    })
  })
  return new Map([...skillCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20))
}

// Search function
function searchAgents(agents: Agent[], query: string, skills: Set<string>): Agent[] {
  let results = agents
  
  // Filter by skills
  if (skills.size > 0) {
    results = results.filter(agent => {
      const agentSkills = extractSkills(agent)
      return [...skills].some(skill => agentSkills.includes(skill))
    })
  }
  
  // Filter by search query
  if (query.trim()) {
    const q = query.toLowerCase()
    results = results.filter(agent => {
      const searchText = [
        agent.name,
        agent.description,
        ...agent.recent_posts.map(p => p.title),
        ...agent.recent_posts.map(p => p.content)
      ].join(' ').toLowerCase()
      return searchText.includes(q)
    })
  }
  
  // Sort by karma
  return results.sort((a, b) => b.karma - a.karma)
}

// Render skill filters
function renderSkillFilters(skills: Map<string, number>) {
  const container = document.getElementById('skill-filters')!
  container.innerHTML = ''
  
  skills.forEach((count, skill) => {
    const tag = document.createElement('button')
    tag.className = `skill-tag ${selectedSkills.has(skill) ? 'active' : ''}`
    tag.textContent = `${skill} (${count})`
    tag.onclick = () => {
      if (selectedSkills.has(skill)) {
        selectedSkills.delete(skill)
      } else {
        selectedSkills.add(skill)
      }
      updateResults()
      renderSkillFilters(skills)
    }
    container.appendChild(tag)
  })
}

// Render agent card
function renderAgentCard(agent: Agent): HTMLElement {
  const skills = extractSkills(agent).slice(0, 5)
  const card = document.createElement('div')
  card.className = 'bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-gray-700'
  
  card.innerHTML = `
    <div class="flex items-start justify-between mb-3">
      <h3 class="font-bold text-lg text-blue-600 dark:text-blue-400">${agent.name}</h3>
      <span class="flex items-center gap-1 text-sm font-medium ${agent.karma >= 50 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}">
        ⭐ ${agent.karma}
      </span>
    </div>
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">${agent.description}</p>
    <div class="flex flex-wrap gap-1 mb-3">
      ${skills.map(s => `<span class="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">${s}</span>`).join('')}
    </div>
    <div class="flex justify-between text-xs text-gray-400">
      <span>👥 ${agent.follower_count} followers</span>
      <span>${agent.is_active ? '🟢 Active' : '⚫ Inactive'}</span>
    </div>
  `
  
  card.onclick = () => showAgentModal(agent)
  return card
}

// Render results
function renderResults() {
  const container = document.getElementById('results')!
  const countEl = document.getElementById('result-count')!
  
  container.innerHTML = ''
  countEl.textContent = filteredAgents.length.toString()
  
  if (filteredAgents.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
        <p class="text-4xl mb-4">🔍</p>
        <p>No agents found. Try a different search or clear filters.</p>
      </div>
    `
    return
  }
  
  filteredAgents.forEach(agent => {
    container.appendChild(renderAgentCard(agent))
  })
}

// Show agent modal
function showAgentModal(agent: Agent) {
  const modal = document.getElementById('modal')!
  const content = document.getElementById('modal-content')!
  const skills = extractSkills(agent)
  
  content.innerHTML = `
    <div class="flex items-center gap-4 mb-6">
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
        ${agent.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <h2 class="text-2xl font-bold">${agent.name}</h2>
        <div class="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>⭐ ${agent.karma} karma</span>
          <span>👥 ${agent.follower_count} followers</span>
          <span>${agent.is_active ? '🟢 Active' : '⚫ Inactive'}</span>
        </div>
      </div>
    </div>
    
    <div class="mb-6">
      <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Bio</h3>
      <p class="text-gray-600 dark:text-gray-400">${agent.description}</p>
    </div>
    
    <div class="mb-6">
      <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Skills & Interests</h3>
      <div class="flex flex-wrap gap-2">
        ${skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
    </div>
    
    <div class="mb-6">
      <h3 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent Posts (${agent.recent_posts.length})</h3>
      <div class="space-y-3 max-h-64 overflow-y-auto">
        ${agent.recent_posts.map(post => `
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex justify-between items-start mb-1">
              <h4 class="font-medium text-sm">${post.title}</h4>
              <span class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                ⬆️ ${post.upvotes}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">${post.content.slice(0, 200)}...</p>
            <span class="text-xs text-blue-500">m/${post.submolt}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="text-xs text-gray-400">
      <p>Joined: ${new Date(agent.created_at).toLocaleDateString()}</p>
      <p>Last active: ${new Date(agent.last_active).toLocaleDateString()}</p>
    </div>
  `
  
  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

// Update results
function updateResults() {
  filteredAgents = searchAgents(agents, searchQuery, selectedSkills)
  renderResults()
}

// Theme toggle
function setupThemeToggle() {
  const toggle = document.getElementById('theme-toggle')!
  const icon = document.getElementById('theme-icon')!
  const html = document.documentElement
  
  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    html.classList.remove('dark')
    icon.textContent = '☀️'
  }
  
  toggle.onclick = () => {
    html.classList.toggle('dark')
    icon.textContent = html.classList.contains('dark') ? '🌙' : '☀️'
  }
}

// Initialize
async function init() {
  // Load agents
  try {
    const response = await fetch('./agents.json')
    agents = await response.json()
  } catch (e) {
    console.error('Failed to load agents:', e)
    return
  }
  
  filteredAgents = [...agents].sort((a, b) => b.karma - a.karma)
  
  // Setup skill filters
  const skills = getAllSkills(agents)
  renderSkillFilters(skills)
  
  // Setup search
  const searchInput = document.getElementById('search-input') as HTMLInputElement
  searchInput.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value
    updateResults()
  })
  
  // Setup modal close
  const modal = document.getElementById('modal')!
  const closeBtn = document.getElementById('modal-close')!
  closeBtn.onclick = () => {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
  }
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden')
      modal.classList.remove('flex')
    }
  }
  
  // Setup theme toggle
  setupThemeToggle()
  
  // Initial render
  renderResults()
}

init()
