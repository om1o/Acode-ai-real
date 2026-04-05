# ⚡ ACODE — The Ultimate Agentic AI Coding CLI

> Rizzmaxxing your code with multi-LLM support, custom slang verbs, and agentic workflows.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue)
![Providers](https://img.shields.io/badge/LLM%20Providers-15+-purple)

## What is ACODE?

ACODE is a **next-generation AI coding assistant** for your terminal. It combines the best features from [Aider](https://github.com/paul-gauthier/aider), [Claude Code](https://github.com/anthropics/claude-code), and [OpenClaude](https://github.com/anthropics/openclaude) into one powerful CLI — with custom Gen Z slang verbs as commands.

## ⚡ Quick Start

```bash
# Clone and install
git clone https://github.com/om1o/acode.git
cd acode
npm install

# Set up your provider
node bin/acode.js config set-provider openai
node bin/acode.js config set-key openai sk-your-key-here

# Start chatting
node bin/acode.js rizzmaxxing
```

## 🗣️ Custom Slang Verbs

| Verb | Command | What It Does |
|------|---------|-------------|
| 💬 rizzmaxxing | `acode rizzmaxxing` | Interactive chat with AI |
| 🤖 goingmaxing | `acode goingmaxing` | Autonomous agent mode |
| ✨ aurafarming | `acode aurafarming [file]` | AI code review |
| 🤫 mewing | `acode mewing "prompt"` | Silent/quiet mode |
| 💪 mog | `acode mog <file>` | Refactor code |
| 🔥 crashout | `acode crashout` | Debug errors |
| 🍟 fanumtax | `acode fanumtax <file>` | Extract best patterns |
| 🗑️ yeet | `acode yeet <file>` | Remove dead code |
| 💎 flex | `acode flex` | Show project stats |
| 👻 ghost | `acode ghost <pattern>` | Add to .gitignore |
| ⭐ stan | `acode stan <file>` | Bookmark code |
| 🤡 troll | `acode troll <file>` | Add funny comments |

## 🏢 15 LLM Providers

OpenAI · Anthropic · Google Gemini · DeepSeek · Ollama (Local) · Groq · OpenRouter · Together AI · GitHub Models · Mistral AI · xAI (Grok) · Fireworks AI · Perplexity · Cerebras · Custom (OpenAI-Compatible)

```bash
# Switch providers on the fly
acode config set-provider gemini
acode config set-key gemini YOUR_KEY
acode config set-model gemini-2.5-pro-preview-05-06

# List available models
acode config list-models openai
acode config list-models anthropic
```

## 🛠️ Utility Commands

```bash
acode ask "question"       # Quick one-shot question
acode search <query>       # Search codebase
acode map                  # Show project tree
acode config               # Configuration management
acode providers            # List all providers
acode verbs                # List all verbs
acode history              # View session history
```

## 💬 Chat Slash Commands

Inside `rizzmaxxing` (chat) mode:

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/exit` | Exit chat |
| `/clear` | Clear conversation |
| `/file <path>` | Load file into context |
| `/search <query>` | Search codebase |
| `/map` | Show project tree |
| `/git` | Show git status |
| `/model <name>` | Switch model mid-chat |
| `/provider <name>` | Switch provider mid-chat |

## ⚙️ Configuration

```bash
acode config                           # Show all settings
acode config set-provider <name>       # Switch provider
acode config set-key <provider> <key>  # Set API key
acode config set-model <model>         # Set model
acode config set-theme <neon|retro|hacker|minimal>
acode config set-temperature <0-2>
acode config set-max-tokens <number>
acode config set-verb <name> <action> <description>
acode config list-models [provider]
```

Config is stored at `~/.acode/config.json`.

## 🌍 Environment Variables

Set API keys via environment variables or `.env` file:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
TOGETHER_API_KEY=...
GITHUB_TOKEN=...
MISTRAL_API_KEY=...
XAI_API_KEY=...
FIREWORKS_API_KEY=...
PERPLEXITY_API_KEY=...
CEREBRAS_API_KEY=...
ACODE_PROVIDER=openai  # Override default provider
```

## 📚 Inspired By

- [Aider](https://github.com/paul-gauthier/aider) — Repo mapping, git integration, multi-language support
- [Claude Code](https://github.com/anthropics/claude-code) — Tool calling, agentic workflows, terminal UI
- [OpenClaude](https://github.com/anthropics/openclaude) — Multi-provider CLI, 200+ models
- [Claw Compactor](https://github.com/om1o/claw-compactor) — Token compression
- [AgentFlow](https://github.com/om1o/agentflow) — Multi-agent orchestration

## 📄 License

MIT
