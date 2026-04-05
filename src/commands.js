/**
 * ⚡ ACODE Commands Module
 * All CLI commands including custom slang verbs
 * Sources: Aider, Claude Code, OpenClaude, AgentFlow, Claw Compactor,
 *          system-prompts-and-models-of-ai-tools, VibeVoice, claude-howto
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import {
  getConfig, setConfig, saveConfig, getProvider, setProvider, setApiKey,
  getVerb, setVerb, getSystemPrompt, setSystemPrompt,
  addStan, getStans, getHistory, configPath,
} from './config.js';
import engine from './engine.js';
import tools from './tools.js';
import {
  showBanner, success, error, warn, info, tip, divider, heading, subheading,
  box, errorBox, successBox, createTable, randomWelcome, getVerbEmoji,
  showKeyValue, streamChar, streamDone, THEME,
} from './ui.js';

// ═══════════════════════════════════════════════════════════════
// REGISTER ALL COMMANDS
// ═══════════════════════════════════════════════════════════════

export function registerCommands(program) {
  // ─────────────────────────────────────────────────────────────
  // RIZZMAXXING — Interactive Chat Mode 💬
  // ─────────────────────────────────────────────────────────────
  program
    .command('rizzmaxxing')
    .alias('rizz')
    .alias('chat')
    .description('💬 Start coding with max rizz — interactive AI chat mode')
    .option('-m, --model <model>', 'Override model for this session')
    .option('-p, --provider <provider>', 'Override provider for this session')
    .option('--no-stream', 'Disable streaming')
    .action(async (opts) => {
      showBanner();
      info(`${getVerbEmoji('rizzmaxxing')} Rizzmaxxing mode activated — ${randomWelcome()}`);
      divider();

      if (opts.provider) setProvider(opts.provider);
      const config = getConfig();
      const provider = getProvider();

      info(`Provider: ${chalk.cyan(provider.name)} | Model: ${chalk.yellow(opts.model || provider.model)}`);
      tip('Type /help for commands, /exit to quit');
      console.log('');

      // Chat loop
      while (true) {
        let answer;
        try {
          answer = await inquirer.prompt([{
            type: 'input',
            name: 'message',
            message: chalk.magenta('you ›'),
            prefix: '',
          }]);
        } catch {
          break; // Handle ctrl+c
        }

        const msg = answer.message.trim();
        if (!msg) continue;

        // Slash commands inside chat
        if (msg.startsWith('/')) {
          const handled = await handleSlashCommand(msg);
          if (handled === 'exit') break;
          continue;
        }

        // Send to LLM 
        const spinner = ora({ text: chalk.gray('thinking...'), spinner: 'dots12' }).start();

        try {
          spinner.stop();
          console.log('');
          process.stdout.write(chalk.cyan('  acode › '));

          if (opts.stream !== false) {
            await engine.stream(msg, { model: opts.model });
          } else {
            const response = await engine.chat(msg, { model: opts.model });
            console.log(chalk.white(response.content));
          }
          console.log('');
        } catch (err) {
          spinner.stop();
          error(err.message);
          console.log('');
        }
      }
    });

  // ─────────────────────────────────────────────────────────────
  // GOINGMAXING — Agent Mode 🤖
  // ─────────────────────────────────────────────────────────────
  program
    .command('goingmaxing')
    .alias('agent')
    .alias('auto')
    .description('🤖 Go full sigma — autonomous agent mode that writes code')
    .argument('[task]', 'Task description for the agent')
    .option('-m, --model <model>', 'Override model')
    .action(async (task, opts) => {
      showBanner();
      info(`${getVerbEmoji('goingmaxing')} Going maxing — Agent mode activated 🤖`);
      divider();

      if (!task) {
        const answer = await inquirer.prompt([{
          type: 'input',
          name: 'task',
          message: 'What should the agent do?',
        }]);
        task = answer.task;
      }

      // Build context with repo info
      const spinner = ora({ text: chalk.gray('scanning project...'), spinner: 'dots12' }).start();

      let context = '';
      try {
        const projectStats = tools.analyzeProject('.');
        const repoMap = tools.generateRepoMap('.');
        context = `\n\n## Current Project Structure:\n${repoMap}\n\n## Project Stats:\n- Files: ${projectStats.totalFiles}\n- Lines: ${projectStats.totalLines}\n- Languages: ${Object.keys(projectStats.languages).join(', ')}\n`;
      } catch {
        context = '\n\n(Could not scan project directory)\n';
      }

      spinner.text = chalk.gray('agent is thinking...');

      const agentPrompt = `You are ACODE in AGENT MODE. You are autonomous and proactive.
The user wants you to complete a task. Analyze the project structure, understand the codebase, and provide a complete solution.
If you need to create or modify files, output the complete file contents with clear file path markers.
Format file outputs as:
--- FILE: path/to/file.ext ---
(file content here)
--- END FILE ---

Be thorough and implement the full solution.${context}

TASK: ${task}`;

      try {
        spinner.stop();
        console.log('');
        heading('Agent Output');
        process.stdout.write(chalk.cyan('  '));

        await engine.stream(task, {
          model: opts.model,
          systemPrompt: agentPrompt,
        });

        console.log('');
        successBox('Agent task completed! Review the output above.');
      } catch (err) {
        spinner.stop();
        error(err.message);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // AURAFARMING — Code Review Mode ✨
  // ─────────────────────────────────────────────────────────────
  program
    .command('aurafarming')
    .alias('review')
    .alias('aura')
    .description('✨ Farm that aura — AI reviews your code and drops wisdom')
    .argument('[file]', 'File to review')
    .option('-m, --model <model>', 'Override model')
    .action(async (file, opts) => {
      showBanner();
      info(`${getVerbEmoji('aurafarming')} Aura farming mode — let's review your code ✨`);
      divider();

      let codeContent = '';
      let targetFile = file;

      if (!file) {
        // Try to get git diff
        const diff = tools.gitDiff();
        if (diff.success && diff.output) {
          codeContent = diff.output;
          info('Reviewing unstaged changes...');
        } else {
          const answer = await inquirer.prompt([{
            type: 'input',
            name: 'file',
            message: 'Which file to review?',
          }]);
          targetFile = answer.file;
        }
      }

      if (targetFile && !codeContent) {
        try {
          codeContent = tools.readFile(targetFile);
          info(`Reviewing: ${chalk.cyan(targetFile)}`);
        } catch (err) {
          error(err.message);
          return;
        }
      }

      if (!codeContent) {
        error('No code to review!');
        return;
      }

      const reviewPrompt = `You are ACODE in REVIEW MODE. You are a senior developer dropping wisdom.
Review the following code and provide:
1. 🎯 **Overall Assessment** — Quick verdict
2. 🔥 **What's Fire** — What's good about this code  
3. ⚠️ **Issues Found** — Bugs, anti-patterns, security issues
4. 💡 **Suggestions** — How to improve it
5. 📊 **Aura Score** — Rate the code 1-100

Be specific, reference line numbers, and give actionable feedback.`;

      const spinner = ora({ text: chalk.gray('analyzing your code...'), spinner: 'dots12' }).start();

      try {
        spinner.stop();
        console.log('');
        process.stdout.write(chalk.cyan('  acode › '));

        await engine.stream(`Review this code:\n\n\`\`\`\n${codeContent}\n\`\`\``, {
          model: opts.model,
          systemPrompt: reviewPrompt,
        });

        console.log('');
      } catch (err) {
        spinner.stop();
        error(err.message);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // MEWING — Silent/Quiet Mode 🤫
  // ─────────────────────────────────────────────────────────────
  program
    .command('mewing')
    .alias('quiet')
    .alias('mew')
    .description('🤫 Shush mode — silent execution, minimal output')
    .argument('<prompt>', 'Your question or task')
    .option('-m, --model <model>', 'Override model')
    .action(async (prompt, opts) => {
      try {
        const response = await engine.chat(prompt, { model: opts.model });
        console.log(response.content);
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // MOG — Refactor Mode 💪
  // ─────────────────────────────────────────────────────────────
  program
    .command('mog')
    .alias('refactor')
    .description('💪 Mog on your codebase — refactor and dominate')
    .argument('<file>', 'File to refactor')
    .option('-m, --model <model>', 'Override model')
    .action(async (file, opts) => {
      showBanner();
      info(`${getVerbEmoji('mog')} Mogging mode — about to dominate this code 💪`);
      divider();

      let code;
      try {
        code = tools.readFile(file);
      } catch (err) {
        error(err.message);
        return;
      }

      info(`Refactoring: ${chalk.cyan(file)} (${tools.estimateTokens(code)} tokens)`);
      console.log('');

      const refactorPrompt = `You are ACODE in REFACTOR MODE. You completely dominate (mog) code by making it better.
Refactor the given code to:
1. Improve readability and structure
2. Follow best practices and modern patterns
3. Optimize performance where possible
4. Add proper error handling
5. Use descriptive naming

Output the COMPLETE refactored file. Do not truncate or skip any part.`;

      try {
        process.stdout.write(chalk.cyan('  acode › '));
        await engine.stream(`Refactor this code:\n\n\`\`\`\n${code}\n\`\`\``, {
          model: opts.model,
          systemPrompt: refactorPrompt,
        });
        console.log('');
      } catch (err) {
        error(err.message);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // CRASHOUT — Debug Mode 🔥
  // ─────────────────────────────────────────────────────────────
  program
    .command('crashout')
    .alias('debug')
    .description('🔥 When your code crashes out — AI debugs the meltdown')
    .argument('[file]', 'File with the bug')
    .option('-e, --error <error>', 'Error message to debug')
    .option('-m, --model <model>', 'Override model')
    .action(async (file, opts) => {
      showBanner();
      info(`${getVerbEmoji('crashout')} Crash out detected — debugging the meltdown 🔥`);
      divider();

      let context = '';
      if (file) {
        try {
          context += `\nFile: ${file}\n\`\`\`\n${tools.readFile(file)}\n\`\`\`\n`;
        } catch (err) {
          warn(`Could not read file: ${err.message}`);
        }
      }

      if (opts.error) {
        context += `\nError message:\n\`\`\`\n${opts.error}\n\`\`\`\n`;
      }

      if (!context) {
        const answer = await inquirer.prompt([{
          type: 'input',
          name: 'errorMsg',
          message: 'Paste the error message:',
        }]);
        context = `\nError:\n\`\`\`\n${answer.errorMsg}\n\`\`\`\n`;
      }

      const debugPrompt = `You are ACODE in DEBUG MODE. The user's code is crashing out.
Analyze the error and code to:
1. 🔍 Identify the root cause
2. 💡 Explain WHY it's happening 
3. 🛠️ Provide the EXACT fix with code
4. 🛡️ Suggest how to prevent this in the future

Be direct and provide working solutions.`;

      try {
        console.log('');
        process.stdout.write(chalk.cyan('  acode › '));
        await engine.stream(`Debug this:\n${context}`, {
          model: opts.model,
          systemPrompt: debugPrompt,
        });
        console.log('');
      } catch (err) {
        error(err.message);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // FANUMTAX — Extract Mode 🍟
  // ─────────────────────────────────────────────────────────────
  program
    .command('fanumtax')
    .alias('extract')
    .alias('fanum')
    .description('🍟 Fanum tax — extract the best parts from code')
    .argument('<file>', 'File to extract from')
    .option('-m, --model <model>', 'Override model')
    .action(async (file, opts) => {
      showBanner();
      info(`${getVerbEmoji('fanumtax')} Fanum taxing — stealing the best parts 🍟`);
      divider();

      let code;
      try {
        code = tools.readFile(file);
      } catch (err) {
        error(err.message);
        return;
      }

      const extractPrompt = `You are ACODE in EXTRACT MODE. You "fanum tax" code — extracting the most valuable, reusable parts.
From the given code, extract:
1. 🎯 Key functions and utilities that are reusable
2. 📦 Patterns that could be turned into modules
3. 🔧 Configuration that should be externalized
4. 💎 The best-written parts worth saving as templates

For each extraction, provide the code snippet and explain why it's worth keeping.`;

      try {
        console.log('');
        process.stdout.write(chalk.cyan('  acode › '));
        await engine.stream(`Extract the best parts from:\n\n\`\`\`\n${code}\n\`\`\``, {
          model: opts.model,
          systemPrompt: extractPrompt,
        });
        console.log('');
      } catch (err) {
        error(err.message);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // YEET — Delete/Clean Mode 🗑️
  // ─────────────────────────────────────────────────────────────
  program
    .command('yeet')
    .alias('clean')
    .alias('delete')
    .description('🗑️ Yeet that code — find and remove dead code & cruft')
    .argument('[file]', 'File to clean')
    .option('-m, --model <model>', 'Override model')
    .action(async (file, opts) => {
      showBanner();
      info(`${getVerbEmoji('yeet')} Yeet mode — throwing out dead code 🗑️`);
      divider();

      let code;
      if (file) {
        try {
          code = tools.readFile(file);
        } catch (err) {
          error(err.message);
          return;
        }
      } else {
        error('Specify a file to yeet code from!');
        return;
      }

      const yeetPrompt = `You are ACODE in YEET MODE. You forcefully remove unnecessary code.
Analyze the code and identify:
1. 🗑️ Dead code that's never called
2. 🧹 Unused imports and variables
3. 📉 Redundant logic and duplicate code
4. 💨 Unnecessary comments and console.logs
5. 🏗️ Code that should be simplified

Output the CLEANED version of the file with all cruft yeeted.`;

      try {
        console.log('');
        process.stdout.write(chalk.cyan('  acode › '));
        await engine.stream(`Clean this code (yeet the dead code):\n\n\`\`\`\n${code}\n\`\`\``, {
          model: opts.model,
          systemPrompt: yeetPrompt,
        });
        console.log('');
      } catch (err) {
        error(err.message);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // FLEX — Show Off Mode 💎
  // ─────────────────────────────────────────────────────────────
  program
    .command('flex')
    .alias('stats')
    .alias('show')
    .description('💎 Flex your code — show off project stats & architecture')
    .argument('[dir]', 'Directory to analyze', '.')
    .action(async (dir) => {
      showBanner();
      info(`${getVerbEmoji('flex')} Flex mode — showing off the drip 💎`);
      divider();

      const spinner = ora({ text: chalk.gray('analyzing project...'), spinner: 'dots12' }).start();

      try {
        const stats = tools.analyzeProject(dir);
        spinner.stop();
        tools.displayProjectStats(stats);

        // Show repo map
        console.log('');
        heading('Project Tree');
        console.log(tools.generateRepoMap(dir));

        // Git info
        if (tools.isGitRepo()) {
          console.log('');
          heading('Git Status');
          const branch = tools.gitBranch();
          if (branch.success) info(`Branch: ${chalk.cyan(branch.output)}`);
          const status = tools.gitStatus();
          if (status.success && status.output) {
            console.log(chalk.gray('  ' + status.output.split('\n').join('\n  ')));
          } else {
            success('Working tree clean — no cap 🧊');
          }
        }
      } catch (err) {
        spinner.stop();
        error(err.message);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // GHOST — Ignore/Exclude Mode 👻
  // ─────────────────────────────────────────────────────────────
  program
    .command('ghost')
    .alias('ignore')
    .description('👻 Ghost those files — add to .gitignore')
    .argument('<pattern>', 'Pattern to add to .gitignore')
    .action(async (pattern) => {
      info(`${getVerbEmoji('ghost')} Ghosting pattern: ${chalk.yellow(pattern)}`);

      try {
        const gitignorePath = '.gitignore';
        let existing = '';
        if (tools.readFile) {
          try { existing = tools.readFile(gitignorePath); } catch { existing = ''; }
        }

        if (existing.includes(pattern)) {
          warn(`Pattern "${pattern}" is already ghosted in .gitignore`);
          return;
        }

        tools.appendToFile(gitignorePath, `\n# Ghosted by ACODE 👻\n${pattern}\n`);
        success(`Ghosted "${pattern}" — it's dead to us now 👻`);
      } catch (err) {
        error(err.message);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // STAN — Bookmark Mode ⭐
  // ─────────────────────────────────────────────────────────────
  program
    .command('stan')
    .alias('bookmark')
    .alias('save')
    .description('⭐ Stan that code — bookmark patterns and snippets')
    .argument('[file]', 'File to stan')
    .option('-n, --note <note>', 'Add a note to the bookmark')
    .option('-l, --list', 'List all stanned items')
    .action(async (file, opts) => {
      if (opts.list) {
        heading('Stanned Items ⭐');
        const stans = getStans();
        if (stans.length === 0) {
          info('No stanned items yet. Start stanning with: acode stan <file>');
          return;
        }
        const rows = stans.map(s => [
          s.file || 'N/A',
          s.note || '',
          new Date(s.timestamp).toLocaleDateString(),
        ]);
        createTable(['File', 'Note', 'Date'], rows);
        return;
      }

      if (!file) {
        error('Specify a file to stan!');
        return;
      }

      addStan({ file, note: opts.note || '' });
      success(`Now stanning ${chalk.cyan(file)} — absolutely obsessed ⭐`);
    });

  // ─────────────────────────────────────────────────────────────
  // TROLL — Fun Mode 🤡
  // ─────────────────────────────────────────────────────────────
  program
    .command('troll')
    .alias('joke')
    .alias('fun')
    .description('🤡 Troll mode — AI adds funny comments and easter eggs')
    .argument('<file>', 'File to troll')
    .option('-m, --model <model>', 'Override model')
    .action(async (file, opts) => {
      showBanner();
      info(`${getVerbEmoji('troll')} Troll mode activated — trolling the code 🤡`);
      divider();

      let code;
      try {
        code = tools.readFile(file);
      } catch (err) {
        error(err.message);
        return;
      }

      const trollPrompt = `You are ACODE in TROLL MODE. Your job is to add hilarious, clever, and witty comments throughout the code.
Rules:
1. Add funny inline comments at unexpected places
2. Add humorous function descriptions
3. Add meme references and Gen Z slang in comments
4. Add self-deprecating programmer humor
5. Reference famous bugs and coding disasters
6. Keep the code FUNCTIONAL — only add/change comments, don't break anything

Output the COMPLETE file with all trolling comments added.`;

      try {
        console.log('');
        process.stdout.write(chalk.cyan('  acode › '));
        await engine.stream(`Add funny troll comments to this code:\n\n\`\`\`\n${code}\n\`\`\``, {
          model: opts.model,
          systemPrompt: trollPrompt,
        });
        console.log('');
      } catch (err) {
        error(err.message);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // CONFIG — Configuration Management
  // ─────────────────────────────────────────────────────────────
  program
    .command('config')
    .description('⚙️  Manage ACODE configuration')
    .argument('[action]', 'Action: show, set-key, set-provider, set-model, set-theme, set-verb, edit')
    .argument('[args...]', 'Arguments for the action')
    .action(async (action, args) => {
      if (!action || action === 'show') {
        const config = getConfig();
        heading('ACODE Configuration ⚙️');
        showKeyValue([
          ['Provider', config.provider],
          ['Model', config.providers[config.provider]?.model || 'not set'],
          ['API Key', config.providers[config.provider]?.apiKey ? '••••••' + config.providers[config.provider].apiKey.slice(-4) : 'not set'],
          ['Theme', config.ui.theme],
          ['Config File', configPath],
        ]);

        console.log('');
        heading('Available Providers');
        const providerRows = Object.entries(config.providers).map(([key, p]) => [
          key === config.provider ? chalk.green(`► ${key}`) : `  ${key}`,
          p.name,
          p.model,
          p.apiKey ? '✓' : '✗',
        ]);
        createTable(['ID', 'Name', 'Model', 'Key?'], providerRows);

        console.log('');
        heading('Custom Verbs');
        const verbRows = Object.entries(config.verbs).map(([verb, info]) => [
          verb,
          info.action,
          info.description,
        ]);
        createTable(['Verb', 'Action', 'Description'], verbRows);
        return;
      }

      switch (action) {
        case 'set-key': {
          const [provider, ...keyParts] = args;
          const key = keyParts.join(' ');
          if (!provider || !key) {
            error('Usage: acode config set-key <provider> <api-key>');
            return;
          }
          if (setApiKey(provider, key)) {
            success(`API key set for ${provider}`);
          } else {
            error(`Unknown provider: ${provider}`);
          }
          break;
        }

        case 'set-provider': {
          const [providerName] = args;
          if (!providerName) {
            error('Usage: acode config set-provider <provider-name>');
            return;
          }
          if (setProvider(providerName)) {
            success(`Active provider set to: ${providerName}`);
          } else {
            error(`Unknown provider: ${providerName}. Run 'acode config' to see available providers.`);
          }
          break;
        }

        case 'set-model': {
          const [model] = args;
          if (!model) {
            error('Usage: acode config set-model <model-name>');
            return;
          }
          const config = getConfig();
          config.providers[config.provider].model = model;
          saveConfig();
          success(`Model set to: ${model}`);
          break;
        }

        case 'set-theme': {
          const [theme] = args;
          const themes = ['neon', 'retro', 'hacker', 'minimal'];
          if (!theme || !themes.includes(theme)) {
            error(`Usage: acode config set-theme <${themes.join('|')}>`);
            return;
          }
          setConfig('ui.theme', theme);
          success(`Theme set to: ${theme}`);
          break;
        }

        case 'set-verb': {
          const [verb, verbAction, ...descParts] = args;
          if (!verb || !verbAction) {
            error('Usage: acode config set-verb <verb-name> <action> [description]');
            return;
          }
          setVerb(verb, verbAction, descParts.join(' ') || `Custom verb: ${verb}`);
          success(`Verb "${verb}" mapped to action "${verbAction}"`);
          break;
        }

        case 'set-prompt': {
          const answer = await inquirer.prompt([{
            type: 'editor',
            name: 'prompt',
            message: 'Edit system prompt:',
            default: getSystemPrompt(),
          }]);
          setSystemPrompt(answer.prompt);
          success('System prompt updated!');
          break;
        }

        case 'edit':
          info(`Config file: ${chalk.cyan(configPath)}`);
          tip('Edit it with any text editor to customize ACODE');
          break;

        case 'list-models': {
          const [providerArg] = args;
          const config = getConfig();
          const targetProvider = providerArg || config.provider;
          const p = config.providers[targetProvider];
          if (!p) {
            error(`Unknown provider: ${targetProvider}`);
            return;
          }
          heading(`Available Models — ${p.name}`);
          if (p.models && p.models.length > 0) {
            p.models.forEach(m => {
              const active = m === p.model ? chalk.green(' ◄ active') : '';
              console.log(`  ${chalk.cyan('•')} ${chalk.white(m)}${active}`);
            });
          } else {
            info('No predefined models. Set any model with: acode config set-model <name>');
          }
          console.log('');
          tip(`Switch model: acode config set-model <model-name>`);
          break;
        }

        case 'set-base-url': {
          const [providerArg2, ...urlParts] = args;
          const url = urlParts.join(' ');
          if (!providerArg2 || !url) {
            error('Usage: acode config set-base-url <provider> <url>');
            return;
          }
          const config = getConfig();
          if (config.providers[providerArg2]) {
            config.providers[providerArg2].baseUrl = url;
            saveConfig();
            success(`Base URL for ${providerArg2} set to: ${url}`);
          } else {
            error(`Unknown provider: ${providerArg2}`);
          }
          break;
        }

        case 'set-max-tokens': {
          const [tokensStr] = args;
          const tokens = parseInt(tokensStr);
          if (!tokens || tokens < 1) {
            error('Usage: acode config set-max-tokens <number>');
            return;
          }
          const config = getConfig();
          config.providers[config.provider].maxTokens = tokens;
          saveConfig();
          success(`Max tokens set to: ${tokens}`);
          break;
        }

        case 'set-temperature': {
          const [tempStr] = args;
          const temp = parseFloat(tempStr);
          if (isNaN(temp) || temp < 0 || temp > 2) {
            error('Usage: acode config set-temperature <0.0-2.0>');
            return;
          }
          const config = getConfig();
          config.providers[config.provider].temperature = temp;
          saveConfig();
          success(`Temperature set to: ${temp}`);
          break;
        }

        default:
          error(`Unknown action: ${action}`);
          tip('Available: show, set-key, set-provider, set-model, set-theme, set-verb, set-prompt, set-base-url, set-max-tokens, set-temperature, list-models, edit');
      }
    });

  // ─────────────────────────────────────────────────────────────
  // SEARCH — Search codebase
  // ─────────────────────────────────────────────────────────────
  program
    .command('search')
    .alias('grep')
    .alias('find')
    .description('🔍 Search your codebase for patterns')
    .argument('<query>', 'Search query')
    .option('-d, --dir <dir>', 'Directory to search', '.')
    .action(async (query, opts) => {
      const spinner = ora({ text: chalk.gray(`searching for "${query}"...`), spinner: 'dots12' }).start();

      const results = tools.searchFiles(opts.dir, query);
      spinner.stop();

      if (results.length === 0) {
        info('No results found');
        return;
      }

      heading(`Search Results for "${query}" (${results.length} matches)`);
      const rows = results.slice(0, 50).map(r => [
        chalk.cyan(r.file),
        chalk.yellow(String(r.line)),
        r.content.substring(0, 80),
      ]);
      createTable(['File', 'Line', 'Content'], rows);

      if (results.length > 50) {
        info(`...and ${results.length - 50} more results`);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // HISTORY — View history
  // ─────────────────────────────────────────────────────────────
  program
    .command('history')
    .alias('log')
    .description('📜 View your ACODE session history')
    .option('-n, --count <count>', 'Number of entries', '20')
    .action(async (opts) => {
      heading('Session History 📜');
      const history = getHistory();
      if (history.length === 0) {
        info('No history yet. Start chatting!');
        return;
      }

      const count = parseInt(opts.count) || 20;
      const recent = history.slice(-count);
      const rows = recent.map(h => [
        new Date(h.timestamp).toLocaleString(),
        h.provider || '',
        h.model || '',
        (h.userMessage || '').substring(0, 50),
      ]);
      createTable(['Time', 'Provider', 'Model', 'Message'], rows);
    });

  // ─────────────────────────────────────────────────────────────
  // MAP — Show repo map
  // ─────────────────────────────────────────────────────────────
  program
    .command('map')
    .alias('tree')
    .description('🗺️  Map your codebase tree')
    .argument('[dir]', 'Directory to map', '.')
    .action(async (dir) => {
      heading('Repo Map 🗺️');
      console.log(tools.generateRepoMap(dir));
    });

  // ─────────────────────────────────────────────────────────────
  // ASK — Quick question (no chat loop)
  // ─────────────────────────────────────────────────────────────
  program
    .command('ask')
    .alias('q')
    .description('❓ Ask a quick question')
    .argument('<question...>', 'Your question')
    .option('-m, --model <model>', 'Override model')
    .action(async (questionParts, opts) => {
      const question = questionParts.join(' ');
      const spinner = ora({ text: chalk.gray('thinking...'), spinner: 'dots12' }).start();

      try {
        spinner.stop();
        process.stdout.write(chalk.cyan('  acode › '));
        await engine.stream(question, { model: opts.model });
        console.log('');
      } catch (err) {
        spinner.stop();
        error(err.message);
      }
    });

  // ─────────────────────────────────────────────────────────────
  // PROVIDERS — List/manage providers
  // ─────────────────────────────────────────────────────────────
  program
    .command('providers')
    .alias('models')
    .description('🏢 List all supported LLM providers')
    .action(async () => {
      heading('Supported LLM Providers');
      const config = getConfig();
      const rows = Object.entries(config.providers).map(([key, p]) => [
        key === config.provider ? chalk.green(`► ${key}`) : `  ${key}`,
        p.name,
        p.model,
        p.baseUrl.substring(0, 40),
        p.apiKey ? chalk.green('✓') : chalk.red('✗'),
      ]);
      createTable(['ID', 'Name', 'Default Model', 'Base URL', 'Key'], rows);

      console.log('');
      tip('Set provider: acode config set-provider <name>');
      tip('Set API key:  acode config set-key <provider> <key>');
      tip('Set model:    acode config set-model <model-name>');
    });

  // ─────────────────────────────────────────────────────────────
  // VERBS — List all custom verbs
  // ─────────────────────────────────────────────────────────────
  program
    .command('verbs')
    .description('🗣️  List all custom ACODE verbs')
    .action(async () => {
      heading('ACODE Verbs — Custom Slang Commands 🗣️');
      const config = getConfig();
      const rows = Object.entries(config.verbs).map(([verb, v]) => [
        `${getVerbEmoji(verb)} ${chalk.magenta(verb)}`,
        chalk.cyan(v.action),
        v.description,
      ]);
      createTable(['Verb', 'Action', 'Description'], rows);

      console.log('');
      tip('Add custom verb: acode config set-verb <name> <action> <description>');
    });

  return program;
}

// ═══════════════════════════════════════════════════════════════
// SLASH COMMANDS (inside chat mode)
// ═══════════════════════════════════════════════════════════════

async function handleSlashCommand(input) {
  const parts = input.slice(1).split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  switch (cmd) {
    case 'exit':
    case 'quit':
    case 'q':
      info('Ghosting this session — peace out ✌️');
      return 'exit';

    case 'clear':
      engine.clearHistory();
      success('Conversation cleared');
      break;

    case 'help':
      heading('Chat Commands');
      const commands = [
        ['/exit', 'Exit chat'],
        ['/clear', 'Clear conversation history'],
        ['/help', 'Show this help'],
        ['/stats', 'Show session stats'],
        ['/file <path>', 'Load a file into context'],
        ['/search <query>', 'Search codebase'],
        ['/map', 'Show project tree'],
        ['/git', 'Show git status'],
        ['/model <name>', 'Switch model mid-chat'],
        ['/provider <name>', 'Switch provider mid-chat'],
        ['/system <prompt>', 'Override system prompt'],
      ];
      createTable(['Command', 'Description'], commands);
      break;

    case 'stats': {
      const stats = engine.getStats();
      heading('Session Stats');
      showKeyValue([
        ['Messages', String(stats.messages)],
        ['Requests', String(stats.requests)],
      ]);
      break;
    }

    case 'file':
      if (!args) {
        warn('Usage: /file <path>');
        break;
      }
      try {
        const content = tools.readFile(args);
        engine.addContext('user', `Here is the content of ${args}:\n\`\`\`\n${content}\n\`\`\``);
        success(`Loaded: ${args} (${tools.estimateTokens(content)} tokens)`);
      } catch (err) {
        error(err.message);
      }
      break;

    case 'search':
      if (!args) {
        warn('Usage: /search <query>');
        break;
      }
      const results = tools.searchFiles('.', args);
      if (results.length === 0) {
        info('No results found');
      } else {
        const rows = results.slice(0, 20).map(r => [r.file, String(r.line), r.content.substring(0, 60)]);
        createTable(['File', 'Line', 'Content'], rows);
      }
      break;

    case 'map':
      console.log(tools.generateRepoMap('.'));
      break;

    case 'git': {
      const status = tools.gitStatus();
      if (status.success) {
        console.log(status.output || 'Clean working tree');
      } else {
        warn('Not a git repository');
      }
      break;
    }

    case 'model':
      if (args) {
        const config = getConfig();
        config.providers[config.provider].model = args;
        saveConfig();
        success(`Model switched to: ${args}`);
      } else {
        const config = getConfig();
        info(`Current model: ${config.providers[config.provider].model}`);
      }
      break;

    case 'provider':
      if (args) {
        if (setProvider(args)) {
          success(`Provider switched to: ${args}`);
        } else {
          error(`Unknown provider: ${args}`);
        }
      } else {
        info(`Current provider: ${getConfig().provider}`);
      }
      break;

    case 'system':
      if (args) {
        setSystemPrompt(args);
        success('System prompt updated for this session');
      } else {
        info('Current system prompt (first 100 chars):');
        console.log(chalk.gray('  ' + getSystemPrompt().substring(0, 100) + '...'));
      }
      break;

    default:
      warn(`Unknown command: /${cmd}. Type /help for commands.`);
  }

  return null;
}
