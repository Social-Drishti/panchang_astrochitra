// Provider-agnostic model interface for the AstroChitra analysis pipeline.
// No provider-specific imports leak into astro modules — they only use
// generateStructured / generateText through this facade.

export type ModelProviderName = 'gemini' | 'nvidia' | 'groq' | 'deepseek' | 'experientiallabs';

export interface AstroModelOptions {
  system: string;
  prompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  onUsage?: (usage: ModelUsage) => void;
}

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens?: number;
}

export interface AstroModelProvider {
  readonly name: ModelProviderName;
  generateStructured<T>(options: AstroModelOptions): Promise<T>;
  generateText(options: AstroModelOptions): Promise<string>;
}

export interface ModelPricing {
  inputUsdPer1M: number;
  outputUsdPer1M: number;
  cachedInputUsdPer1M?: number;
  note?: string;
}

/** Configurable, provider-keyed pricing (USD per 1M tokens). */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-2.5-flash': {
    inputUsdPer1M: 0.3,
    outputUsdPer1M: 2.5,
    cachedInputUsdPer1M: 0.075,
    note: 'List prices 2025; update from provider docs for accuracy.',
  },
  'gemini-2.5-pro': {
    inputUsdPer1M: 1.25,
    outputUsdPer1M: 10.0,
    cachedInputUsdPer1M: 0.3125,
  },
  'deepseek-chat': {
    inputUsdPer1M: 0.27,
    outputUsdPer1M: 1.1,
    note: 'List prices; update from provider docs for accuracy.',
  },
  'deepseek-reasoner': {
    inputUsdPer1M: 0.55,
    outputUsdPer1M: 2.19,
    note: 'List prices; update from provider docs for accuracy.',
  },
  'explabs/gemma-4-31b-it': {
    inputUsdPer1M: 0.2,
    outputUsdPer1M: 0.8,
    note: 'Placeholder pricing; update from provider docs.',
  },
  'explabs/qwen3.8-27b': {
    inputUsdPer1M: 0.2,
    outputUsdPer1M: 0.8,
    note: 'Placeholder pricing; update from provider docs.',
  },
  'nvidia/nemotron-3.5-lightning-30b-a3b': {
    inputUsdPer1M: 0.05,
    outputUsdPer1M: 0.15,
    note: 'Proxy-hosted; placeholder pricing.',
  },
};

export function estimateCostUsd(
  model: string,
  usage?: Partial<ModelUsage>
): number {
  if (!usage) return 0;
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  const inTokens = usage.inputTokens ?? 0;
  const outTokens = usage.outputTokens ?? 0;
  const cached = usage.cachedInputTokens ?? 0;
  const nonCachedIn = Math.max(0, inTokens - cached);
  return (
    (nonCachedIn / 1_000_000) * p.inputUsdPer1M +
    (cached / 1_000_000) * (p.cachedInputUsdPer1M ?? p.inputUsdPer1M) +
    (outTokens / 1_000_000) * p.outputUsdPer1M
  );
}

// ---------------------------------------------------------------------------
// Credential resolution — NO hardcoded keys. The app (Vite) injects the browser
// env key via setGeminiApiKey; server/tests may set process.env.GEMINI_API_KEY.
// Final deployment should proxy via a backend.
// ---------------------------------------------------------------------------
let injectedGeminiKey: string | undefined;

export function setGeminiApiKey(key: string): void {
  injectedGeminiKey = key;
}

export function getGeminiApiKey(): string {
  if (injectedGeminiKey) return injectedGeminiKey;
  const nodeKey = (globalThis as any)?.process?.env?.GEMINI_API_KEY as string | undefined;
  return nodeKey || '';
}

let injectedDeepSeekKey: string | undefined;

export function setDeepSeekApiKey(key: string): void {
  injectedDeepSeekKey = key;
}

export function getDeepSeekApiKey(): string {
  if (injectedDeepSeekKey) return injectedDeepSeekKey;
  const nodeKey = (globalThis as any)?.process?.env?.DEEPSEEK_API_KEY as string | undefined;
  return nodeKey || '';
}

let injectedExplabsKey: string | undefined;

export function setExplabsApiKey(key: string): void {
  injectedExplabsKey = key;
}

export function getExplabsApiKey(): string {
  if (injectedExplabsKey) return injectedExplabsKey;
  const nodeKey = (globalThis as any)?.process?.env?.EXPLABS_API_KEY as string | undefined;
  return nodeKey || '';
}

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const EXPABS_BASE_URL = 'https://api.experientiallabs.ai/v1';

function explabsBaseUrl(): string {
  const configured = import.meta.env.VITE_EXPLABS_PROXY;
  if (configured) return configured.replace(/\/+$/, '');
  if (import.meta.env.DEV) return '/api/explabs';
  return EXPABS_BASE_URL;
}

function extractRetryMs(msg: string): number {
  const m = msg.match(/retry in (\d+(?:\.\d+)?)s/i);
  return m ? Math.min(60_000, Math.ceil(parseFloat(m[1]!) * 1000)) : 15_000;
}

export interface GeminiProviderOptions {
  apiKey?: string;
}

export class GeminiProvider implements AstroModelProvider {
  readonly name = 'gemini' as const;

  private apiKey: string;

  constructor(opts: GeminiProviderOptions = {}) {
    this.apiKey = opts.apiKey ?? getGeminiApiKey();
  }

  async generateStructured<T>(
    options: AstroModelOptions
  ): Promise<T> {
    const text = await this.generateText({
      ...options,
      structured: true,
    } as AstroModelOptions & { structured?: boolean });
    return parseJsonObject<T>(text);
  }

  async generateText(
    options: AstroModelOptions & { structured?: boolean }
  ): Promise<string> {
    const { system, prompt, model, maxTokens, temperature, onUsage, structured } = options;

    if (!this.apiKey) {
      throw new Error(
        'Gemini API key is not configured. Set VITE_GEMINI_API_KEY (or GEMINI_API_KEY in Node) or route through the proxy.'
      );
    }

    const generationConfig: Record<string, unknown> = {
      temperature,
      maxOutputTokens: maxTokens,
    };
    const payload: Record<string, unknown> = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    };
    if (system) {
      payload.systemInstruction = { parts: [{ text: system }] };
    }
    if (structured) {
      generationConfig.responseMimeType = 'application/json';
    }

    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    let attempts = 0;
    const maxAttempts = 3;
    while (true) {
      attempts++;
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e: any) {
        if (attempts >= maxAttempts) {
          throw new Error(`Network error calling ${model}: ${e?.message || 'unknown'}`);
        }
        await sleep(15_000 * attempts);
        continue;
      }

      const bodyText = await res.text();
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        let retriesLeft = maxAttempts - attempts;
        try {
          const j = JSON.parse(bodyText);
          message = j?.error?.message || message;
          const isQuota = /quota|RESOURCE_EXHAUSTED|429|rate.limit/i.test(
            `${res.status} ${message}`
          );
          if (isQuota && retriesLeft > 0) {
            await sleep(extractRetryMs(message));
            continue;
          }
        } catch {
          /* non-JSON error body */
        }
        throw new Error(`${model} request failed: ${message}`);
      }

      let parsed: any;
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        throw new Error(`${model} returned a non-JSON response body.`);
      }

      if (parsed?.error?.message) {
        throw new Error(`${model} error: ${parsed.error.message}`);
      }

      const usage = parsed?.usageMetadata;
      if (usage) {
        onUsage?.({
          inputTokens: usage.promptTokenCount ?? 0,
          outputTokens: usage.candidatesTokenCount ?? 0,
          cachedInputTokens: usage.cachedContentTokenCount ?? 0,
        });
      }

      const parts = parsed?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts) || !parts.length) {
        throw new Error(`${model} returned an empty response.`);
      }
      const text = parts
        .map((p: any) => (typeof p.text === 'string' ? p.text : ''))
        .join('')
        .trim();
      if (!text) {
        throw new Error(`${model} returned an empty response.`);
      }
      return text;
    }
  }
}

export interface DeepSeekProviderOptions {
  apiKey?: string;
}

/**
 * DeepSeek provider — OpenAI-compatible Chat Completions API.
 * Supports `deepseek-chat` (structured JSON via response_format) and
 * `deepseek-reasoner` (no response_format / temperature).
 */
export class DeepSeekProvider implements AstroModelProvider {
  readonly name = 'deepseek' as const;

  private apiKey: string;

  constructor(opts: DeepSeekProviderOptions = {}) {
    this.apiKey = opts.apiKey ?? getDeepSeekApiKey();
  }

  async generateStructured<T>(
    options: AstroModelOptions
  ): Promise<T> {
    const text = await this.generateText({
      ...options,
      structured: true,
    } as AstroModelOptions & { structured?: boolean });
    return parseJsonObject<T>(text);
  }

  async generateText(
    options: AstroModelOptions & { structured?: boolean }
  ): Promise<string> {
    const { system, prompt, model, maxTokens, temperature, onUsage, structured } = options;

    if (!this.apiKey) {
      throw new Error(
        'DeepSeek API key is not configured. Set VITE_DEEPSEEK_API_KEY (or DEEPSEEK_API_KEY in Node) or route through the proxy.'
      );
    }

    const isReasoner = model === 'deepseek-reasoner';
    const body: Record<string, unknown> = {
      model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      stream: false,
    };
    // deepseek-reasoner does not support response_format or custom temperature.
    if (!isReasoner) {
      body.temperature = temperature;
      if (structured) {
        body.response_format = { type: 'json_object' };
      }
    }

    let attempts = 0;
    const maxAttempts = 3;
    while (true) {
      attempts++;
      let res: Response;
      try {
        res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });
      } catch (e: any) {
        if (attempts >= maxAttempts) {
          throw new Error(`Network error calling DeepSeek (${model}): ${e?.message || 'unknown'}`);
        }
        await sleep(15_000 * attempts);
        continue;
      }

      const bodyText = await res.text();
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        let retriesLeft = maxAttempts - attempts;
        try {
          const j = JSON.parse(bodyText);
          message = j?.error?.message || message;
          const retryable = /quota|rate|429|5\d\d|overloaded|try again/i.test(`${res.status} ${message}`);
          if (retryable && retriesLeft > 0) {
            await sleep(extractRetryMs(message));
            continue;
          }
        } catch {
          /* non-JSON error body */
        }
        throw new Error(`DeepSeek (${model}) request failed: ${message}`);
      }

      let parsed: any;
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        throw new Error(`DeepSeek (${model}) returned a non-JSON response body.`);
      }

      if (parsed?.error?.message) {
        throw new Error(`DeepSeek (${model}) error: ${parsed.error.message}`);
      }

      const usage = parsed?.usage;
      if (usage) {
        onUsage?.({
          inputTokens: usage.prompt_tokens ?? 0,
          outputTokens: usage.completion_tokens ?? 0,
        });
      }

      const msg = parsed?.choices?.[0]?.message;
      const text = (typeof msg?.content === 'string' ? msg.content : '').trim();
      if (!text) {
        throw new Error(`DeepSeek (${model}) returned an empty response.`);
      }
      return text;
    }
  }
}

export interface ExperientialLabsProviderOptions {
  apiKey?: string;
}

/**
 * ExperientialLabs provider — OpenAI-compatible Chat Completions API
 * (https://api.experientiallabs.ai). Model ids may be prefixed with
 * `explabs/` for the UI dropdown; the prefix is stripped before the call.
 */
export class ExperientialLabsProvider implements AstroModelProvider {
  readonly name = 'experientiallabs' as const;

  private apiKey: string;

  constructor(opts: ExperientialLabsProviderOptions = {}) {
    this.apiKey = opts.apiKey ?? getExplabsApiKey();
  }

  async generateStructured<T>(
    options: AstroModelOptions
  ): Promise<T> {
    const text = await this.generateText({
      ...options,
      structured: true,
    } as AstroModelOptions & { structured?: boolean });
    return parseJsonObject<T>(text);
  }

  async generateText(
    options: AstroModelOptions & { structured?: boolean }
  ): Promise<string> {
    const { system, prompt, model, maxTokens, temperature, onUsage, structured } = options;

    if (!this.apiKey) {
      throw new Error(
        'ExperientialLabs API key is not configured. Set VITE_EXPLABS_API_KEY (or EXPLABS_API_KEY in Node) or route through the proxy.'
      );
    }

    const apiModel = model.replace(/^explabs\//, '');
    function makeBody(forceJson: boolean): Record<string, unknown> {
      return {
        model: apiModel,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
        stream: false,
        ...(structured && forceJson ? { response_format: { type: 'json_object' } } : {}),
      };
    }

    let attempts = 0;
    const maxAttempts = 3;
    let body = makeBody(true);
    while (true) {
      attempts++;
      let res: Response;
      try {
        res = await fetch(`${explabsBaseUrl()}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });
      } catch (e: any) {
        const directHitsApi = explabsBaseUrl() === EXPABS_BASE_URL;
        const corsLike = e instanceof TypeError && directHitsApi;
        if (corsLike || attempts >= maxAttempts) {
          const hint = directHitsApi
            ? ' (ExperientialLabs blocks browser CORS - set VITE_EXPLABS_PROXY to a server-side proxy or route through a backend)'
            : '';
          throw new Error(`Network error calling ExperientialLabs (${model}): ${e?.message || 'unknown'}${hint}`);
        }
        await sleep(15_000 * attempts);
        continue;
      }

      const bodyText = await res.text();
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        let retriesLeft = maxAttempts - attempts;
        try {
          const j = JSON.parse(bodyText);
          message = j?.error?.message || message;
          // Some hosted models reject response_format — retry without it once.
          if (/response_format|json_object/.test(message) && body.response_format && structured && attempts === 1) {
            body = makeBody(false);
            retriesLeft = maxAttempts - attempts;
          }
          const retryable = /quota|rate|429|5\d\d|overloaded|try again/i.test(`${res.status} ${message}`);
          if (retryable && retriesLeft > 0) {
            await sleep(extractRetryMs(message));
            continue;
          }
        } catch {
          /* non-JSON error body */
        }
        throw new Error(`ExperientialLabs (${model}) request failed: ${message}`);
      }

      let parsed: any;
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        throw new Error(`ExperientialLabs (${model}) returned a non-JSON response body.`);
      }

      if (parsed?.error?.message) {
        throw new Error(`ExperientialLabs (${model}) error: ${parsed.error.message}`);
      }

      const usage = parsed?.usage;
      if (usage) {
        onUsage?.({
          inputTokens: usage.prompt_tokens ?? 0,
          outputTokens: usage.completion_tokens ?? 0,
        });
      }

      const msg = parsed?.choices?.[0]?.message;
      const text = (typeof msg?.content === 'string' ? msg.content : '').trim();
      if (!text) {
        throw new Error(`ExperientialLabs (${model}) returned an empty response.`);
      }
      return text;
    }
  }
}

/** Resolve a provider by name, defaulting to Gemini. */
export function createProvider(name: ModelProviderName): AstroModelProvider {
  switch (name) {
    case 'gemini':
      return new GeminiProvider();
    case 'deepseek':
      return new DeepSeekProvider();
    case 'experientiallabs':
      return new ExperientialLabsProvider();
    case 'nvidia':
      throw new Error('NVIDIA provider is not configured in the analysis pipeline yet.');
    case 'groq':
      throw new Error(`${name} provider is not configured yet.`);
  }
}

/**
 * Map a model id to the backend that serves it. Pipeline stages pass bare model
 * ids (e.g. `gemini-2.5-flash`, `deepseek-chat`); the prefix decides the provider.
 */
export function providerNameForModel(model: string): ModelProviderName {
  const m = model.toLowerCase();
  if (m === 'explabs' || m.startsWith('explabs/')) return 'experientiallabs';
  if (m === 'deepseek' || m.startsWith('deepseek')) return 'deepseek';
  if (m === 'nvidia' || m.startsWith('nvidia/') || m.startsWith('nemotron')) return 'nvidia';
  return 'gemini';
}

export function createProviderForModel(model: string): AstroModelProvider {
  return createProvider(providerNameForModel(model));
}

function parseJsonObject<T>(text: string): T {
  let candidate = text;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    candidate = fenced[1]!.trim();
  } else {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      candidate = text.slice(start, end + 1);
    }
  }
  try {
    return JSON.parse(candidate) as T;
  } catch {
    throw new Error('Model did not return valid JSON: ' + text.slice(0, 200));
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}