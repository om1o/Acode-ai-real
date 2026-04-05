/**
 * ⚡ ACODE UI Module
 * Premium terminal aesthetics with gradients, boxes, and animations
 */

import chalk from 'chalk';
import gradient from 'gradient-string';
import boxen from 'boxen';
import Table from 'cli-table3';
import figlet from 'figlet';
import { getConfig } from './config.js';

// ═══════════════════════════════════════════════════════════════
// GRADIENTS & THEMES
// ═══════════════════════════════════════════════════════════════

const GRADIENTS = {
  neon:    gradient(['#ff006e', '#8338ec', '#3a86ff']),
  retro:   gradient(['#ff9a00', '#ff0080', '#7928ca']),
  hacker:  gradient(['#00ff41', '#00cc33', '#009926']),
  minimal: gradient(['#888888', '#cccccc', '#ffffff']),
  fire:    gradient(['#ff0000', '#ff4400', '#ff8800', '#ffcc00']),
  ice:     gradient(['#00ffff', '#0088ff', '#0044cc', '#6600ff']),
  sigma:   gradient(['#ff006e', '#ffbe0b', '#fb5607', '#ff006e']),
};

const THEME = () => {
  const cfg = getConfig();
  return GRADIENTS[cfg.ui?.theme] || GRADIENTS.neon;
};

// ═══════════════════════════════════════════════════════════════
// BANNER
// ═══════════════════════════════════════════════════════════════

export function showBanner() {
  const cfg = getConfig();
  if (!cfg.ui?.showBanner) return;

  const bannerText = figlet.textSync('ACODE', {
    font: 'ANSI Shadow',
    horizontalLayout: 'fitted',
  });

  console.log('');
  console.log(THEME()(bannerText));
  console.log('');
  console.log(THEME()('  ⚡ The Ultimate Agentic AI Coding CLI'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────'));
  console.log(chalk.gray(`  Provider: `) + chalk.cyan(cfg.providers[cfg.provider]?.name || cfg.provider));
  console.log(chalk.gray(`  Model:    `) + chalk.yellow(cfg.providers[cfg.provider]?.model || 'not set'));
  console.log(chalk.gray(`  Version:  `) + chalk.green('1.0.0'));
  console.log(chalk.gray('  ─────────────────────────────────────────────────'));
  console.log('');
}

// ═══════════════════════════════════════════════════════════════
// STYLED OUTPUT HELPERS
// ═══════════════════════════════════════════════════════════════

export function success(msg) {
  console.log(chalk.green('  ✓ ') + chalk.white(msg));
}

export function error(msg) {
  console.log(chalk.red('  ✗ ') + chalk.white(msg));
}

export function warn(msg) {
  console.log(chalk.yellow('  ⚠ ') + chalk.white(msg));
}

export function info(msg) {
  console.log(chalk.cyan('  ℹ ') + chalk.white(msg));
}

export function tip(msg) {
  console.log(chalk.magenta('  💡 ') + chalk.gray(msg));
}

export function divider() {
  console.log(chalk.gray('  ─────────────────────────────────────────────────'));
}

export function heading(text) {
  console.log('');
  console.log(THEME()(`  ▸ ${text}`));
  divider();
}

export function subheading(text) {
  console.log(chalk.cyan(`    ${text}`));
}

// ═══════════════════════════════════════════════════════════════
// BOXED OUTPUT
// ═══════════════════════════════════════════════════════════════

export function box(content, title = '') {
  const opts = {
    padding: 1,
    margin: { top: 0, bottom: 0, left: 2, right: 0 },
    borderStyle: 'round',
    borderColor: 'cyan',
    dimBorder: false,
  };
  if (title) opts.title = chalk.cyan.bold(` ${title} `);
  console.log(boxen(content, opts));
}

export function errorBox(content, title = 'Error') {
  console.log(boxen(chalk.red(content), {
    padding: 1,
    margin: { top: 0, bottom: 0, left: 2, right: 0 },
    borderStyle: 'round',
    borderColor: 'red',
    title: chalk.red.bold(` ${title} `),
  }));
}

export function successBox(content, title = 'Success') {
  console.log(boxen(chalk.green(content), {
    padding: 1,
    margin: { top: 0, bottom: 0, left: 2, right: 0 },
    borderStyle: 'round',
    borderColor: 'green',
    title: chalk.green.bold(` ${title} `),
  }));
}

// ═══════════════════════════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════════════════════════

export function createTable(headers, rows) {
  const table = new Table({
    head: headers.map(h => chalk.cyan.bold(h)),
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│',
    },
    style: {
      head: [],
      border: ['gray'],
    },
  });
  rows.forEach(r => table.push(r));
  console.log('  ' + table.toString().split('\n').join('\n  '));
}

// ═══════════════════════════════════════════════════════════════
// SLANG WELCOME MESSAGES
// ═══════════════════════════════════════════════════════════════

const WELCOME_MESSAGES = [
  "no cap, your code's about to go crazy 🔥",
  "we're locked in — let's rizzmaxx this codebase 💀",
  "sigma coding session activated, no skibidi allowed 🗿",
  "the aura is immaculate, let's ship some code ✨",
  "mewing silently while we debug this W 🤫",
  "bout to mog every other CLI tool fr fr 💪",
  "fanum taxing the best features from every AI tool 🍟",
  "we're not crashing out today — we're shipping 📦",
  "flexing on npm one commit at a time 💎",
  "ghosting bugs, stanning clean code 👻",
];

export function randomWelcome() {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
}

// ═══════════════════════════════════════════════════════════════
// VERB DISPLAY
// ═══════════════════════════════════════════════════════════════

const VERB_EMOJIS = {
  rizzmaxxing: '💬',
  goingmaxing: '🤖',
  aurafarming: '✨',
  mewing: '🤫',
  mog: '💪',
  crashout: '🔥',
  fanumtax: '🍟',
  yeet: '🗑️',
  flex: '💎',
  ghost: '👻',
  stan: '⭐',
  troll: '🤡',
};

export function getVerbEmoji(verb) {
  return VERB_EMOJIS[verb.toLowerCase()] || '⚡';
}

// ═══════════════════════════════════════════════════════════════
// STREAMING OUTPUT
// ═══════════════════════════════════════════════════════════════

export function streamChar(char) {
  process.stdout.write(chalk.white(char));
}

export function streamDone() {
  console.log('');
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS / STATUS
// ═══════════════════════════════════════════════════════════════

export function showStatus(label, value, color = 'cyan') {
  console.log(chalk.gray(`  ${label}: `) + chalk[color](value));
}

export function showKeyValue(pairs) {
  pairs.forEach(([key, value]) => {
    console.log(chalk.gray(`  ${key.padEnd(16)} `) + chalk.white(value));
  });
}

export { GRADIENTS, THEME };
