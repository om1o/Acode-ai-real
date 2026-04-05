/**
 * ⚡ ACODE LLM Provider Engine
 * Multi-provider LLM integration with streaming, failover, and tool calling
 * Inspired by: Aider, Claude Code, OpenClaude, and system-prompts-and-models-of-ai-tools
 */

import axios from 'axios';
import { getConfig, getProvider, addToHistory } from './config.js';
import { error, streamChar, streamDone } from './ui.js';

// ═══════════════════════════════════════════════════════════════
// PROVIDER ENGINE
// ═══════════════════════════════════════════════════════════════

class LLMEngine {
  constructor() {
    this.conversationHistory = [];
    this.totalTokensUsed = 0;
    this.requestCount = 0;
  }

  /**
   * Send a message and get a response (non-streaming)
   */
  async chat(userMessage, opts = {}) {
    const config = getConfig();
    const provider = getProvider();
    const providerName = config.provider;

    if (!provider.apiKey && providerName !== 'ollama') {
      throw new Error(`No API key set for ${provider.name}. Run: acode config set-key ${providerName} <your-key>`);
    }

    // Build messages array
    const messages = [
      { role: 'system', content: opts.systemPrompt || config.systemPrompt },
      ...this.conversationHistory,
      { role: 'user', content: userMessage },
    ];

    try {
      let response;

      if (providerName === 'anthropic') {
        response = await this.callAnthropic(provider, messages, opts);
      } else if (providerName === 'gemini') {
        response = await this.callGemini(provider, messages, opts);
      } else {
        // OpenAI-compatible (OpenAI, DeepSeek, Groq, OpenRouter, Together, Ollama, GitHub, Custom)
        response = await this.callOpenAICompatible(provider, messages, opts);
      }

      // Track conversation
      this.conversationHistory.push({ role: 'user', content: userMessage });
      this.conversationHistory.push({ role: 'assistant', content: response.content });
      this.requestCount++;

      // Save to history
      addToHistory({
        provider: providerName,
        model: provider.model,
        userMessage: userMessage.substring(0, 200),
        responseLength: response.content.length,
        tokens: response.tokens || 0,
      });

      return response;

    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message || 'Unknown error';
      throw new Error(`[${provider.name}] ${errMsg}`);
    }
  }

  /**
   * Stream a response (OpenAI-compatible providers)
   */
  async stream(userMessage, opts = {}) {
    const config = getConfig();
    const provider = getProvider();
    const providerName = config.provider;

    if (!provider.apiKey && providerName !== 'ollama') {
      throw new Error(`No API key set for ${provider.name}. Run: acode config set-key ${providerName} <your-key>`);
    }

    const messages = [
      { role: 'system', content: opts.systemPrompt || config.systemPrompt },
      ...this.conversationHistory,
      { role: 'user', content: userMessage },
    ];

    let fullContent = '';

    try {
      if (providerName === 'anthropic') {
        fullContent = await this.streamAnthropic(provider, messages, opts);
      } else if (providerName === 'gemini') {
        // Gemini doesn't support SSE streaming easily, fall back to non-streaming
        const resp = await this.callGemini(provider, messages, opts);
        for (const char of resp.content) {
          streamChar(char);
          await sleep(8);
        }
        streamDone();
        fullContent = resp.content;
      } else {
        fullContent = await this.streamOpenAI(provider, messages, opts);
      }

      this.conversationHistory.push({ role: 'user', content: userMessage });
      this.conversationHistory.push({ role: 'assistant', content: fullContent });
      this.requestCount++;

      addToHistory({
        provider: providerName,
        model: provider.model,
        userMessage: userMessage.substring(0, 200),
        responseLength: fullContent.length,
      });

      return { content: fullContent };

    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message || 'Unknown error';
      throw new Error(`[${provider.name}] ${errMsg}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // OPENAI-COMPATIBLE API
  // ─────────────────────────────────────────────────────────────

  async callOpenAICompatible(provider, messages, opts = {}) {
    const response = await axios.post(`${provider.baseUrl}/chat/completions`, {
      model: opts.model || provider.model,
      messages,
      max_tokens: opts.maxTokens || provider.maxTokens,
      temperature: opts.temperature ?? provider.temperature,
      stream: false,
    }, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    });

    const choice = response.data.choices?.[0];
    return {
      content: choice?.message?.content || '',
      tokens: response.data.usage?.total_tokens || 0,
      model: response.data.model,
      finishReason: choice?.finish_reason,
    };
  }

  async streamOpenAI(provider, messages, opts = {}) {
    const response = await axios.post(`${provider.baseUrl}/chat/completions`, {
      model: opts.model || provider.model,
      messages,
      max_tokens: opts.maxTokens || provider.maxTokens,
      temperature: opts.temperature ?? provider.temperature,
      stream: true,
    }, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      timeout: 120000,
    });

    let fullContent = '';
    let buffer = '';

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              streamChar(delta);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      });

      response.data.on('end', () => {
        streamDone();
        resolve(fullContent);
      });

      response.data.on('error', (err) => {
        reject(err);
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // ANTHROPIC API
  // ─────────────────────────────────────────────────────────────

  async callAnthropic(provider, messages, opts = {}) {
    // Extract system message
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await axios.post(`${provider.baseUrl}/messages`, {
      model: opts.model || provider.model,
      max_tokens: opts.maxTokens || provider.maxTokens,
      system: systemMsg,
      messages: chatMessages,
    }, {
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      timeout: 120000,
    });

    const content = response.data.content?.map(c => c.text).join('') || '';
    return {
      content,
      tokens: (response.data.usage?.input_tokens || 0) + (response.data.usage?.output_tokens || 0),
      model: response.data.model,
    };
  }

  async streamAnthropic(provider, messages, opts = {}) {
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await axios.post(`${provider.baseUrl}/messages`, {
      model: opts.model || provider.model,
      max_tokens: opts.maxTokens || provider.maxTokens,
      system: systemMsg,
      messages: chatMessages,
      stream: true,
    }, {
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      responseType: 'stream',
      timeout: 120000,
    });

    let fullContent = '';
    let buffer = '';

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(trimmed.slice(6));
            if (json.type === 'content_block_delta' && json.delta?.text) {
              fullContent += json.delta.text;
              streamChar(json.delta.text);
            }
          } catch { /* skip */ }
        }
      });

      response.data.on('end', () => {
        streamDone();
        resolve(fullContent);
      });

      response.data.on('error', reject);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // GEMINI API
  // ─────────────────────────────────────────────────────────────

  async callGemini(provider, messages, opts = {}) {
    const model = opts.model || provider.model;
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';

    const response = await axios.post(
      `${provider.baseUrl}/models/${model}:generateContent?key=${provider.apiKey}`,
      {
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          maxOutputTokens: opts.maxTokens || provider.maxTokens,
          temperature: opts.temperature ?? provider.temperature,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000,
      }
    );

    const content = response.data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    return {
      content,
      tokens: response.data.usageMetadata?.totalTokenCount || 0,
      model,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CONVERSATION MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  clearHistory() {
    this.conversationHistory = [];
  }

  getConversationLength() {
    return this.conversationHistory.length;
  }

  addContext(role, content) {
    this.conversationHistory.push({ role, content });
  }

  getStats() {
    return {
      messages: this.conversationHistory.length,
      requests: this.requestCount,
      totalTokens: this.totalTokensUsed,
    };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Singleton
const engine = new LLMEngine();
export default engine;
export { LLMEngine };
