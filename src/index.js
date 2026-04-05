/**
 * ⚡ ACODE — The Ultimate Agentic AI Coding CLI
 * 
 * Sources & Inspiration:
 * ───────────────────────
 * • Aider (om1o/aider) — AI pair programming, repo mapping, git integration
 * • Claude Code (om1o/claude-code) — Tool calling, agentic workflows, 40+ tools
 * • OpenClaude (om1o/openclaude) — Multi-provider CLI, 200+ models, agent routing
 * • Claw Compactor (om1o/claw-compactor) — Token compression, fusion pipeline
 * • AgentFlow (om1o/agentflow) — Multi-agent orchestration
 * • System Prompts (om1o/system-prompts-and-models-of-ai-tools) — AI prompts collection
 * • VibeVoice (om1o/VibeVoice) — Voice AI
 * • Claude Howto (om1o/claude-howto) — Best practices
 * • Leaked Claude Code (om1o/leaked-claude-code) — Architecture insights
 * • Awesome OpenSource AI (om1o/awesome-opensource-ai) — Curated AI projects
 * • Nibzard Web (om1o/nibzard-web) — AI blog
 * 
 * Custom Verbs:
 * ─────────────
 * rizzmaxxing → Interactive chat    goingmaxing → Agent mode
 * aurafarming → Code review         mewing      → Silent mode
 * mog         → Refactor            crashout    → Debug
 * fanumtax    → Extract             yeet        → Clean
 * flex        → Stats               ghost       → Ignore
 * stan        → Bookmark            troll       → Fun mode
 */

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import {
  getConfig, setApiKey, setProvider, saveConfig,
} from './config.js';
import { showBanner, info, tip, heading, randomWelcome } from './ui.js';
import { registerCommands } from './commands.js';

// Load .env if present
dotenv.config();

// ═══════════════════════════════════════════════════════════════
// ENV OVERRIDES (apply before CLI parses)
// ═══════════════════════════════════════════════════════════════

function applyEnvOverrides() {
  const config = getConfig();

  if (process.env.OPENAI_API_KEY) setApiKey('openai', process.env.OPENAI_API_KEY);
  if (process.env.OPENAI_MODEL) { config.providers.openai.model = process.env.OPENAI_MODEL; saveConfig(); }
  if (process.env.ANTHROPIC_API_KEY) setApiKey('anthropic', process.env.ANTHROPIC_API_KEY);
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) setApiKey('gemini', process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  if (process.env.DEEPSEEK_API_KEY) setApiKey('deepseek', process.env.DEEPSEEK_API_KEY);
  if (process.env.GROQ_API_KEY) setApiKey('groq', process.env.GROQ_API_KEY);
  if (process.env.OPENROUTER_API_KEY) setApiKey('openrouter', process.env.OPENROUTER_API_KEY);
  if (process.env.TOGETHER_API_KEY) setApiKey('together', process.env.TOGETHER_API_KEY);
  if (process.env.GITHUB_TOKEN) setApiKey('github', process.env.GITHUB_TOKEN);
  if (process.env.MISTRAL_API_KEY) setApiKey('mistral', process.env.MISTRAL_API_KEY);
  if (process.env.XAI_API_KEY) setApiKey('xai', process.env.XAI_API_KEY);
  if (process.env.FIREWORKS_API_KEY) setApiKey('fireworks', process.env.FIREWORKS_API_KEY);
  if (process.env.PERPLEXITY_API_KEY) setApiKey('perplexity', process.env.PERPLEXITY_API_KEY);
  if (process.env.CEREBRAS_API_KEY) setApiKey('cerebras', process.env.CEREBRAS_API_KEY);
  if (process.env.ACODE_PROVIDER) setProvider(process.env.ACODE_PROVIDER);
}

applyEnvOverrides();

// ═══════════════════════════════════════════════════════════════
// CLI PROGRAM
// ═══════════════════════════════════════════════════════════════

const program = new Command();

program
  .name('acode')
  .description('⚡ ACODE — The Ultimate Agentic AI Coding CLI\n   Rizzmaxxing your code with multi-LLM support & custom slang verbs')
  .version('1.0.0', '-v, --version');

// Register all commands
registerCommands(program);

// ═══════════════════════════════════════════════════════════════
// DEFAULT ACTION (no subcommand → show help + banner)
// ═══════════════════════════════════════════════════════════════

if (process.argv.length <= 2) {
  showBanner();
  info(randomWelcome());
  console.log('');

  heading('Quick Start');
  const commands = [
    ['acode rizzmaxxing',       '💬 Interactive chat with AI'],
    ['acode goingmaxing',       '🤖 Autonomous agent mode'],
    ['acode aurafarming [file]','✨ AI code review'],
    ['acode mewing "prompt"',   '🤫 Silent quick query'],
    ['acode mog <file>',        '💪 Refactor code'],
    ['acode crashout',          '🔥 Debug errors'],
    ['acode fanumtax <file>',   '🍟 Extract best parts'],
    ['acode yeet <file>',       '🗑️  Remove dead code'],
    ['acode flex',              '💎 Show project stats'],
    ['acode ghost <pattern>',   '👻 Add to .gitignore'],
    ['acode stan <file>',       '⭐ Bookmark code'],
    ['acode troll <file>',      '🤡 Add funny comments'],
    ['acode ask "question"',    '❓ Quick question'],
    ['acode search <query>',    '🔍 Search codebase'],
    ['acode map',               '🗺️  Show project tree'],
    ['acode config',            '⚙️  Configuration'],
    ['acode providers',         '🏢 List LLM providers'],
    ['acode verbs',             '🗣️  List custom verbs'],
    ['acode history',           '📜 View history'],
  ];

  commands.forEach(([cmd, desc]) => {
    console.log(`  ${chalk.cyan(cmd.padEnd(30))} ${chalk.gray(desc)}`);
  });

  console.log('');
  heading('Setup');
  console.log(`  ${chalk.gray('1.')} Set your provider:   ${chalk.cyan('acode config set-provider openai')}`);
  console.log(`  ${chalk.gray('2.')} Set your API key:     ${chalk.cyan('acode config set-key openai sk-...')}`);
  console.log(`  ${chalk.gray('3.')} Start chatting:       ${chalk.cyan('acode rizzmaxxing')}`);
  console.log('');

  tip('Supports: OpenAI, Anthropic, Gemini, DeepSeek, Groq, Ollama, OpenRouter, Together, GitHub, Mistral, xAI, Fireworks, Perplexity, Cerebras');
  tip('Customize verbs: acode config set-verb <name> <action> <description>');
  console.log('');
} else {
  try {
    program.parse(process.argv);
  } catch (err) {
    console.error(chalk.red(`\n  ✗ ${err.message}\n`));
    process.exit(1);
  }
}
