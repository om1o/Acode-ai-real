/**
 * ⚡ ACODE Tools Module
 * Agentic tools inspired by Claude Code, Aider, OpenClaude, and Claw Compactor
 * File operations, shell execution, code analysis, git integration, and more
 */

import { execSync, exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, unlinkSync, appendFileSync } from 'fs';
import { join, basename, extname, relative, resolve } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { success, error, info, warn, createTable, heading, box } from './ui.js';

// ═══════════════════════════════════════════════════════════════
// FILE TOOLS (Inspired by Claude Code's 40+ tools)
// ═══════════════════════════════════════════════════════════════

export function readFile(filePath) {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  return readFileSync(resolved, 'utf-8');
}

export function writeFile(filePath, content) {
  const resolved = resolve(filePath);
  writeFileSync(resolved, content, 'utf-8');
  return resolved;
}

export function appendToFile(filePath, content) {
  const resolved = resolve(filePath);
  appendFileSync(resolved, content, 'utf-8');
  return resolved;
}

export function deleteFile(filePath) {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  unlinkSync(resolved);
  return resolved;
}

export function listFiles(dirPath = '.', opts = {}) {
  const resolved = resolve(dirPath);
  const results = [];
  const maxDepth = opts.maxDepth || 3;

  function walk(dir, depth = 0) {
    if (depth > maxDepth) return;
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith('.') && !opts.showHidden) continue;
        if (['node_modules', '.git', '__pycache__', 'dist', 'build', '.next'].includes(entry)) continue;

        const fullPath = join(dir, entry);
        try {
          const stat = statSync(fullPath);
          results.push({
            path: relative(resolved, fullPath),
            name: entry,
            isDirectory: stat.isDirectory(),
            size: stat.size,
            ext: extname(entry),
            modified: stat.mtime,
          });
          if (stat.isDirectory()) {
            walk(fullPath, depth + 1);
          }
        } catch { /* skip inaccessible */ }
      }
    } catch { /* skip unreadable dirs */ }
  }

  walk(resolved);
  return results;
}

export function searchFiles(dirPath, query, opts = {}) {
  const files = listFiles(dirPath, { maxDepth: opts.maxDepth || 5 });
  const results = [];

  for (const file of files) {
    if (file.isDirectory) continue;
    try {
      const content = readFileSync(join(resolve(dirPath), file.path), 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (opts.caseSensitive ? lines[i].includes(query) : lines[i].toLowerCase().includes(query.toLowerCase())) {
          results.push({
            file: file.path,
            line: i + 1,
            content: lines[i].trim(),
          });
        }
      }
    } catch { /* skip binary / unreadable */ }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// SHELL TOOLS (Inspired by Claude Code BashTool)
// ═══════════════════════════════════════════════════════════════

export function runCommand(command, opts = {}) {
  try {
    const result = execSync(command, {
      cwd: opts.cwd || process.cwd(),
      encoding: 'utf-8',
      timeout: opts.timeout || 30000,
      maxBuffer: 1024 * 1024 * 10,
      stdio: opts.silent ? 'pipe' : 'pipe',
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return {
      success: false,
      output: err.stdout?.trim() || '',
      error: err.stderr?.trim() || err.message,
      code: err.status,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// GIT TOOLS (Inspired by Aider's git integration)
// ═══════════════════════════════════════════════════════════════

export function gitStatus() {
  return runCommand('git status --porcelain');
}

export function gitDiff(staged = false) {
  return runCommand(staged ? 'git diff --staged' : 'git diff');
}

export function gitLog(count = 10) {
  return runCommand(`git log --oneline -n ${count}`);
}

export function gitAdd(files = '.') {
  return runCommand(`git add ${files}`);
}

export function gitCommit(message) {
  return runCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`);
}

export function gitBranch() {
  return runCommand('git branch --show-current');
}

export function isGitRepo() {
  return runCommand('git rev-parse --is-inside-work-tree').success;
}

// ═══════════════════════════════════════════════════════════════
// CODE ANALYSIS (Inspired by Aider's repo mapping)
// ═══════════════════════════════════════════════════════════════

const LANGUAGE_MAP = {
  '.js':   'JavaScript',
  '.jsx':  'React JSX',
  '.ts':   'TypeScript',
  '.tsx':  'React TSX',
  '.py':   'Python',
  '.rb':   'Ruby',
  '.go':   'Go',
  '.rs':   'Rust',
  '.java': 'Java',
  '.kt':   'Kotlin',
  '.swift':'Swift',
  '.c':    'C',
  '.cpp':  'C++',
  '.h':    'C/C++ Header',
  '.cs':   'C#',
  '.php':  'PHP',
  '.html': 'HTML',
  '.css':  'CSS',
  '.scss': 'SCSS',
  '.vue':  'Vue',
  '.svelte': 'Svelte',
  '.md':   'Markdown',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml':  'YAML',
  '.toml': 'TOML',
  '.sql':  'SQL',
  '.sh':   'Shell',
  '.bash': 'Bash',
  '.ps1':  'PowerShell',
  '.r':    'R',
  '.lua':  'Lua',
  '.dart': 'Dart',
  '.ex':   'Elixir',
  '.exs':  'Elixir Script',
  '.zig':  'Zig',
  '.nim':  'Nim',
};

export function analyzeProject(dirPath = '.') {
  const files = listFiles(dirPath, { maxDepth: 5 });
  const stats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalLines: 0,
    totalSize: 0,
    languages: {},
    largest: [],
    recentlyModified: [],
  };

  for (const file of files) {
    if (file.isDirectory) {
      stats.totalDirectories++;
      continue;
    }
    stats.totalFiles++;
    stats.totalSize += file.size;

    const lang = LANGUAGE_MAP[file.ext] || 'Other';
    if (!stats.languages[lang]) stats.languages[lang] = { files: 0, lines: 0, size: 0 };
    stats.languages[lang].files++;
    stats.languages[lang].size += file.size;

    try {
      const content = readFileSync(join(resolve(dirPath), file.path), 'utf-8');
      const lineCount = content.split('\n').length;
      stats.totalLines += lineCount;
      stats.languages[lang].lines += lineCount;
    } catch { /* skip binary */ }

    stats.largest.push({ path: file.path, size: file.size });
    stats.recentlyModified.push({ path: file.path, modified: file.modified });
  }

  stats.largest.sort((a, b) => b.size - a.size);
  stats.largest = stats.largest.slice(0, 10);
  stats.recentlyModified.sort((a, b) => b.modified - a.modified);
  stats.recentlyModified = stats.recentlyModified.slice(0, 10);

  return stats;
}

export function generateRepoMap(dirPath = '.') {
  const files = listFiles(dirPath, { maxDepth: 4 });
  let map = '';

  const tree = {};
  for (const file of files) {
    const parts = file.path.split(/[\\/]/);
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1 && !file.isDirectory) {
        current[part] = file;
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
  }

  function renderTree(node, prefix = '') {
    const keys = Object.keys(node);
    keys.forEach((key, idx) => {
      const isLast = idx === keys.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';

      if (typeof node[key] === 'object' && !node[key].path) {
        // Directory
        map += `${prefix}${connector}${chalk.cyan(key)}/\n`;
        renderTree(node[key], prefix + childPrefix);
      } else {
        // File
        const ext = extname(key);
        const lang = LANGUAGE_MAP[ext] || '';
        const langTag = lang ? chalk.gray(` (${lang})`) : '';
        map += `${prefix}${connector}${chalk.white(key)}${langTag}\n`;
      }
    });
  }

  map += chalk.cyan.bold(basename(resolve(dirPath))) + '/\n';
  renderTree(tree);
  return map;
}

// ═══════════════════════════════════════════════════════════════
// TOKEN ESTIMATION (Inspired by Claw Compactor)
// ═══════════════════════════════════════════════════════════════

export function estimateTokens(text) {
  // Rough heuristic: ~4 chars per token for English, ~3 for code
  return Math.ceil(text.length / 3.5);
}

export function compressContext(text, maxTokens = 4000) {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) return text;

  // Simple compression: remove excessive whitespace, comments, blank lines
  let compressed = text
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '')          // Remove line comments
    .replace(/^\s*$/gm, '')            // Remove blank lines
    .replace(/\n{3,}/g, '\n\n')        // Reduce multiple newlines
    .replace(/  +/g, ' ');             // Reduce spaces

  return compressed;
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════

export function displayProjectStats(stats) {
  heading('Project Analysis — Flex Mode 💎');

  console.log('');
  createTable(
    ['Metric', 'Value'],
    [
      ['📁 Files', String(stats.totalFiles)],
      ['📂 Directories', String(stats.totalDirectories)],
      ['📝 Total Lines', stats.totalLines.toLocaleString()],
      ['💾 Total Size', formatBytes(stats.totalSize)],
    ]
  );

  console.log('');
  heading('Languages Breakdown');

  const langRows = Object.entries(stats.languages)
    .sort((a, b) => b[1].lines - a[1].lines)
    .map(([lang, data]) => [
      lang,
      String(data.files),
      data.lines.toLocaleString(),
      formatBytes(data.size),
    ]);

  createTable(['Language', 'Files', 'Lines', 'Size'], langRows);

  if (stats.largest.length > 0) {
    console.log('');
    heading('Largest Files');
    const largestRows = stats.largest.map(f => [f.path, formatBytes(f.size)]);
    createTable(['File', 'Size'], largestRows);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ═══════════════════════════════════════════════════════════════
// WEB FETCH (Inspired by OpenClaude WebFetch)
// ═══════════════════════════════════════════════════════════════

export async function fetchUrl(url) {
  const { default: axios } = await import('axios');
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'ACODE/1.0' },
    });
    // Basic HTML to text
    let text = response.data;
    if (typeof text === 'string') {
      text = text
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return { success: true, content: typeof text === 'string' ? text.substring(0, 5000) : JSON.stringify(text).substring(0, 5000) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default {
  readFile, writeFile, appendToFile, deleteFile,
  listFiles, searchFiles,
  runCommand,
  gitStatus, gitDiff, gitLog, gitAdd, gitCommit, gitBranch, isGitRepo,
  analyzeProject, generateRepoMap,
  estimateTokens, compressContext,
  fetchUrl,
  displayProjectStats,
};
