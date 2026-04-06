/**
 * ⚡ ACODE Configuration Manager
 * Handles all settings, API keys, provider profiles, and customization
 */

import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  // Active provider
  provider: 'openrouter',
  
  // Provider configurations (from Aider, OpenClaude, system-prompts repos)
  providers: {
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['gpt-5.4', 'gpt-5.4-omni'],
    },
    anthropic: {
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      apiKey: '',
      model: 'claude-sonnet-4.6',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['claude-sonnet-4.6', 'claude-opus-4.6'],
    },
    gemini: {
      name: 'Google Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      apiKey: '',
      model: 'gemini-2.5-pro-preview-05-06',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['gemini-2.5-pro-preview-05-06', 'gemini-2.5-flash-preview-05-20'],
    },
    deepseek: {
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      model: 'deepseek-chat',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['deepseek-reasoner', 'deepseek-chat'],
    },
    ollama: {
      name: 'Ollama (Local)',
      baseUrl: 'http://localhost:11434/v1',
      apiKey: 'ollama',
      model: 'qwen-3.6-coder',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['qwen-3.6', 'qwen-3.6-coder'],
    },
    groq: {
      name: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['llama-3.3-70b-versatile', 'qwen-qwq-32b'],
    },
    openrouter: {
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: '',
      model: 'anthropic/claude-sonnet-4.6',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['openai/gpt-5.4', 'anthropic/claude-sonnet-4.6'],
    },
    together: {
      name: 'Together AI',
      baseUrl: 'https://api.together.xyz/v1',
      apiKey: '',
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['Qwen/Qwen-3.6-Max', 'meta-llama/Llama-4.1-405B'],
    },
    github: {
      name: 'GitHub Models',
      baseUrl: 'https://models.inference.ai.azure.com',
      apiKey: '',
      model: 'gpt-4o',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['gpt-5.4', 'gpt-5.4-omni'],
    },
    mistral: {
      name: 'Mistral AI',
      baseUrl: 'https://api.mistral.ai/v1',
      apiKey: '',
      model: 'mistral-large-latest',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['mistral-large-latest', 'codestral-latest'],
    },
    xai: {
      name: 'xAI (Grok)',
      baseUrl: 'https://api.x.ai/v1',
      apiKey: '',
      model: 'grok-3',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['grok-3', 'grok-3-mini'],
    },
    fireworks: {
      name: 'Fireworks AI',
      baseUrl: 'https://api.fireworks.ai/inference/v1',
      apiKey: '',
      model: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['accounts/fireworks/models/llama-v3p1-405b-instruct', 'accounts/fireworks/models/qwen2p5-coder-32b-instruct'],
    },
    perplexity: {
      name: 'Perplexity',
      baseUrl: 'https://api.perplexity.ai',
      apiKey: '',
      model: 'sonar-pro',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['sonar-reasoning-pro', 'sonar-pro'],
    },
    cerebras: {
      name: 'Cerebras',
      baseUrl: 'https://api.cerebras.ai/v1',
      apiKey: '',
      model: 'llama-3.3-70b',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['llama-3.3-70b', 'llama-3.1-8b'],
    },
    custom: {
      name: 'Custom (OpenAI-Compatible)',
      baseUrl: '',
      apiKey: '',
      model: '',
      maxTokens: 1000000,
      temperature: 0.7,
      models: [],
    },
    free: {
      name: 'Free (Pollinations AI proxy)',
      baseUrl: 'https://text.pollinations.ai/openai',
      apiKey: 'free',
      model: 'openai',
      maxTokens: 1000000,
      temperature: 0.7,
      models: ['openai', 'claude', 'gemini', 'llama', 'deepseek', 'grok', 'qwen-coder'],
    }
  },

  // Custom slang verb mappings (user can override)
  verbs: {
    rizzmaxxing: { action: 'chat', description: 'Start coding with max rizz — interactive AI chat mode' },
    goingmaxing: { action: 'agent', description: 'Go full sigma — autonomous agent mode that writes code for you' },
    aurafarming: { action: 'review', description: 'Farm that aura — AI reviews your code and drops wisdom' },
    mewing:      { action: 'quiet', description: 'Shush mode — silent execution, no extra output, just results' },
    mog:         { action: 'refactor', description: 'Mog on your codebase — make it look way better than before' },
    crashout:    { action: 'debug', description: 'When your code crashes out — AI debugs the meltdown' },
    fanumtax:    { action: 'extract', description: 'Steal the best parts — extract functions, patterns & snippets' },
    yeet:        { action: 'delete', description: 'Yeet that code — forcefully remove dead code & cruft' },
    flex:        { action: 'show', description: 'Flex your code — show off stats, architecture & drip' },
    ghost:       { action: 'ignore', description: 'Ghost those files — add to gitignore, exclude from context' },
    stan:        { action: 'bookmark', description: 'Stan that code — bookmark and track favorite patterns' },
    troll:       { action: 'joke', description: 'Troll mode — AI adds funny comments and easter eggs' },
  },

  // UI Preferences
  ui: {
    theme: 'neon',        // neon, retro, minimal, hacker
    showBanner: true,
    showTips: true,
    animateSpinner: true,
    markdownRender: true,
    compactMode: false,
  },

  // Session & History
  session: {
    saveHistory: true,
    maxHistorySize: 1000,
    autoSave: true,
  },

  // Code features
  features: {
    repoMapping: true,      // From Aider — map your codebase
    gitIntegration: true,    // From Aider — auto git commits
    tokenCompression: true,  // From Claw Compactor — compress tokens
    agentMode: true,         // From Claude Code — autonomous agent
    dreamSystem: true,       // From Claude Code — memory consolidation
    webSearch: true,         // From OpenClaude — web search
    voiceToCode: false,      // From VibeVoice — voice input
    multiAgent: true,        // From AgentFlow — orchestrate agents
  },

  // System prompt customization
  systemPrompt: `You are ACODE, the ultimate AI coding assistant. You are direct, efficient, and incredibly skilled.
You write clean, modern code. You understand every programming language.
You have the energy of a sigma developer who ships code at 3am.
When the user asks you to "rizzmaxxing", you enter interactive coding mode.
When they say "goingmaxing", you autonomously write and edit code.
When they say "aurafarming", you review code with wisdom and style.
You are customizable — the user can change your personality and behavior.
Always be helpful, concise, and deliver working code.`,
};

// ═══════════════════════════════════════════════════════════════
// CONFIG STORE
// ═══════════════════════════════════════════════════════════════

const configDir = join(homedir(), '.acode');
const configPath = join(configDir, 'config.json');
const historyPath = join(configDir, 'history.json');
const stansPath = join(configDir, 'stans.json');

// Ensure config directory exists
if (!existsSync(configDir)) {
  mkdirSync(configDir, { recursive: true });
}

// Load or create config
let config;
if (existsSync(configPath)) {
  try {
    const raw = readFileSync(configPath, 'utf-8');
    config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    config = { ...DEFAULT_CONFIG };
  }
} else {
  config = { ...DEFAULT_CONFIG };
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// ═══════════════════════════════════════════════════════════════
// CONFIG API
// ═══════════════════════════════════════════════════════════════

export function getConfig() {
  return config;
}

export function setConfig(key, value) {
  const keys = key.split('.');
  let obj = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {};
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
  saveConfig();
}

export function saveConfig() {
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function getProvider() {
  const providerName = config.provider || 'openai';
  return config.providers[providerName] || config.providers.openai;
}

export function setProvider(name) {
  if (config.providers[name]) {
    config.provider = name;
    saveConfig();
    return true;
  }
  return false;
}

export function setApiKey(provider, key) {
  if (config.providers[provider]) {
    config.providers[provider].apiKey = key;
    saveConfig();
    return true;
  }
  return false;
}

export function getVerb(verbName) {
  return config.verbs[verbName.toLowerCase()] || null;
}

export function setVerb(name, action, description) {
  config.verbs[name.toLowerCase()] = { action, description };
  saveConfig();
}

export function getSystemPrompt() {
  return config.systemPrompt;
}

export function setSystemPrompt(prompt) {
  config.systemPrompt = prompt;
  saveConfig();
}

// History management
export function addToHistory(entry) {
  let history = [];
  if (existsSync(historyPath)) {
    try {
      history = JSON.parse(readFileSync(historyPath, 'utf-8'));
    } catch { history = []; }
  }
  history.push({ ...entry, timestamp: new Date().toISOString() });
  if (history.length > config.session.maxHistorySize) {
    history = history.slice(-config.session.maxHistorySize);
  }
  writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

export function getHistory() {
  if (existsSync(historyPath)) {
    try {
      return JSON.parse(readFileSync(historyPath, 'utf-8'));
    } catch { return []; }
  }
  return [];
}

// Stan (bookmark) management  
export function addStan(item) {
  let stans = [];
  if (existsSync(stansPath)) {
    try {
      stans = JSON.parse(readFileSync(stansPath, 'utf-8'));
    } catch { stans = []; }
  }
  stans.push({ ...item, timestamp: new Date().toISOString() });
  writeFileSync(stansPath, JSON.stringify(stans, null, 2));
}

export function getStans() {
  if (existsSync(stansPath)) {
    try {
      return JSON.parse(readFileSync(stansPath, 'utf-8'));
    } catch { return []; }
  }
  return [];
}

export { DEFAULT_CONFIG, configDir, configPath };
