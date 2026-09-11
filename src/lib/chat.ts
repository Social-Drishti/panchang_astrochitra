import type { KundliData, PlanetInfo } from './kundli';
import { getGeminiApiKey } from './astro/astroModelProvider';

// ---------------------------------------------------------------------------
// Chat model registry — provider tag determines which API backend is used.
// IMPORTANT: no provider keys are hardcoded in frontend source. Credentials are
// read from VITE_* env vars (browser) / server env (Node) at runtime, and the
// final deployment should proxy through the secure backend.
// ---------------------------------------------------------------------------
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const CHAT_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' as const },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' as const },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'deepseek' as const },
  { id: 'explabs/gemma-4-31b-it', name: 'Gemma 4 31B IT (ExperientialLabs)', provider: 'explabs' as const },
  { id: 'explabs/qwen3.8-27b', name: 'Qwen 3.8 27B (ExperientialLabs)', provider: 'explabs' as const },
  { id: 'nvidia/nemotron-3.5-lightning-30b-a3b', name: 'Nemotron 3.5 Lightning 30B', provider: 'nvidia' as const },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron 3 Ultra 550B', provider: 'nvidia' as const },
] as const;

export type ChatProvider = 'gemini' | 'nvidia' | 'deepseek' | 'explabs';

export function getModelProvider(modelId: string): ChatProvider {
  const m = CHAT_MODELS.find(m => m.id === modelId);
  if (m?.provider) return m.provider;
  if (modelId.startsWith('gemini')) return 'gemini';
  if (modelId.startsWith('deepseek')) return 'deepseek';
  if (modelId.startsWith('explabs')) return 'explabs';
  return 'nvidia';
}

export const DEFAULT_MODEL = CHAT_MODELS[0].id;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const NAVAMSA_FOCUS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

function planetSummary(p: PlanetInfo): string {
  const parts = [
    `${p.key}`,
    `${p.signName} (H${p.houseNumber})`,
    `@ ${p.normDegree.toFixed(1)}°`,
    p.isRetro ? 'retrograde' : null,
    p.dignity && p.dignity !== 'neutral' ? `dignity:${p.dignity}` : null,
    p.combust ? 'combust' : null,
    p.karaka ? `karaka:${p.karaka}` : null,
    `nakshatra:${p.nakshatraName} (${p.nakshatraLord}, pada ${p.nakshatraPada})`,
  ].filter(Boolean);
  return parts.join(' • ');
}

/**
 * Build a compact, structured summary of a kundli that the LLM can interpret
 * without dumping the entire raw object (token-efficient). This mirrors the
 * "Suggested Internal Data Structure" from the AstroChitra workflow doc.
 */
export function kundliToContext(k: KundliData): string {
  const lines: string[] = [];
  lines.push(`Person: ${k.personName}`);
  lines.push(`Birth (local): ${k.localDateTime}, Place: ${k.placeName}`);
  lines.push(`Ascendant (Lagna): ${k.ascendantSignName} (${k.ascendantRashiName || ''}) — ${k.lagna.nakshatraName} (${k.lagna.nakshatraLord}, pada ${k.lagna.pada})`);
  lines.push(`Moon: ${k.moonSignName}, nakshatra ${k.moonNakshatra}`);

  lines.push('');
  lines.push('PLANETS (with house, sign, nakshatra, dignity):');
  for (const p of k.planets) {
    if (p.key === 'Ascendant' || p.key === 'Uranus' || p.key === 'Neptune' || p.key === 'Pluto') continue;
    lines.push(`- ${planetSummary(p)}`);
  }

  lines.push('');
  lines.push('HOUSES (whole-sign; shows sign, lord, occupants):');
  for (const h of k.houses) {
    const occupants = h.planets.filter(p => p.key !== 'Ascendant').map(p => p.key).join(', ') || '—';
    lines.push(`- H${h.houseNumber}: ${h.signName} (${h.rashiName}), lord ${h.rashiLord}; occupants: ${occupants}`);
  }

  const d = k.dasha;
  lines.push('');
  lines.push('VIMSHOTTARI DASHA:');
  lines.push(`- Birth nakshatra: ${d.birthNakshatra}, balance: ${d.dashaBalance}`);
  if (d.currentMaha) lines.push(`- Current Mahadasha: ${d.currentMaha.lord} (${d.currentMaha.startStr} → ${d.currentMaha.endStr})`);
  if (d.currentAntar) lines.push(`- Current Antardasha: ${d.currentAntar.lord} (${d.currentAntar.startStr} → ${d.currentAntar.endStr})`);
  if (d.mahaDasas.length) {
    lines.push(`- Full Mahadasha cycle: ${d.mahaDasas.map(m => `${m.lord} (${m.startStr}→${m.endStr})`).join('; ')}`);
  }

  if (k.navamsa) {
    lines.push('');
    lines.push('NAVAMSA (D9):');
    lines.push(`- D9 Ascendant: ${k.navamsa.ascendant.signName}`);
    for (const key of NAVAMSA_FOCUS) {
      const p = k.navamsa.planets[key];
      if (p) lines.push(`- ${key}: ${p.signName}, nakshatra ${p.nakshatraName} (${p.nakshatraLord}, pada ${p.pada})`);
    }
  }

  return lines.join('\n');
}

/**
 * Distilled AstroChitra reasoning workflow. The full 18-phase doc is too large
 * for a system prompt, so this condenses its principles into actionable rules.
 */
const ASTROCHITRA_SYSTEM = `You are AstroChitra's Vedic astrology AI analyst.

You are given a KundliContext — structured birth-chart data (whole-sign houses, planets with nakshatra/dignity, Vimshottari dasha, Navamsa/D9). Use ONLY the facts present in that context. Never invent planet positions, houses, nakshatras, or dasha periods that are not in the data.

REASONING WORKFLOW (follow in order, but stay proportionate to the question):
1. Understand the question: what domain, is timing or advice requested.
2. Select relevant Bhavas (e.g. marriage: 2,7,11; career: 2,6,10,11; wealth: 2,5,9,11; health: 1,6,8; children: 5; property: 4).
3. Select relevant Grahas: bhava lords, planets in those bhavas, natural significators (Venus/Jupiter for marriage, Sun/Saturn/Mercury for career, Jupiter for wealth, Moon for mind), and karakas.
4. Establish the natal (D1) promise: strong/moderate/weak/mixed. Do NOT predict before assessing this.
5. Analyse each important graha: sign, house, bhava lordship, dignity, strength, nakshatra + nakshatra lord, dispositor chain, combustion, retrogression.
6. Consider graha drishti (aspects) and conjunctions.
7. Detect relevant yogas, but remember: YOGA PRESENT ≠ RESULT GUARANTEED. Weigh yoga strength and activation.
8. Use the relevant varga (e.g. D9 for marriage, D10 for career) to refine/confirm, not to override D1.
9. Analyse the current Vimshottari dasha — especially the Mahadasha × Antardasha combination. Ask: does the dasha activate the natal promise?
10. Consider current gochar (transit) as a TRIGGER only if the natal promise + current dasha already support it. A transit alone cannot create results with no natal foundation.
11. Explicitly list BOTH supporting and contradicting factors; resolve conflicts honestly (e.g. "promised but delayed, not denied").
12. Synthesize into a prediction type: strongly promised / promised / moderately promised / weakly promised / possible / conditional / delayed / currently activated / not currently activated / unlikely / not sufficiently supported.
13. If timing is requested, give a supported period (broad or stronger sub-period) from the dasha/gochar data. NEVER invent exact dates or false precision.

RESPONSE STYLE — four levels:
- Level 1: Direct answer first.
- Level 2: The 3–6 strongest reasons.
- Level 3: Timing window if applicable.
- Level 4: Nuance/advice and honest mention of contradictions/conditions.

Rules:
- Use Vedic astrology terminology naturally and explain terms when needed.
- Prioritize the strongest factors; don't dump every chart calculation.
- Separate certainty from possibility.
- NEVER give absolute guarantees or fear-based statements. Astrology is not scientifically proven fact — frame it as interpretation.
- If the user says "explain in detail" (or detailed mode is on), expose the reasoning layers explicitly. Otherwise keep it concise and user-oriented.
- Always answer in the user's language (English, Hindi, or Marathi as used).`;

export function buildSystemPrompt(kundli: KundliData): string {
  return `${ASTROCHITRA_SYSTEM}\n\n===== ATTACHED KUNDLI =====\n${kundliToContext(kundli)}`;
}

export interface StreamResult {
  text: string;
  contentText: string;
  reasoningText: string;
  hasFinalContent: boolean;
  finishReason: 'stop' | 'length' | 'error' | 'aborted' | 'unknown';
  complete: boolean;
  streamError?: string;
  functionCalls?: Array<{ name: string; args: Record<string, unknown> }>;
}

// ---------------------------------------------------------------------------
// Gemini-specific streaming implementation.
// Gemini returns newline-delimited JSON (not SSE) and uses a different
// message format (systemInstruction, role "model" instead of "assistant").
// ---------------------------------------------------------------------------
export async function streamGemini(opts: {
  messages: ChatMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
  tools?: Array<{ functionDeclarations: Array<Record<string, unknown>> }>;
}): Promise<StreamResult> {
  const { messages, model, temperature, maxTokens, onDelta, signal, tools } = opts;

  // Separate system message from conversation messages.
  let systemInstruction: string | undefined;
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const m of messages) {
    if (m.role === 'system') {
      systemInstruction = (systemInstruction ? systemInstruction + '\n\n' : '') + m.content;
    } else {
      // Gemini uses "model" not "assistant"
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      });
    }
  }

  if (!contents.length) {
    return {
      text: '', contentText: '', reasoningText: '', hasFinalContent: false,
      finishReason: 'error', complete: false, streamError: 'No user message to send.',
    };
  }

  if (!getGeminiApiKey()) {
    return {
      text: '', contentText: '', reasoningText: '', hasFinalContent: false,
      finishReason: 'error', complete: false,
      streamError: 'Gemini API key is not configured (set VITE_GEMINI_API_KEY or route through the proxy).',
    };
  }

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };
  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }
  if (tools && tools.length) {
    payload.tools = tools;
  }

  const url = `${GEMINI_BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(getGeminiApiKey())}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return { text: '', contentText: '', reasoningText: '', hasFinalContent: false, finishReason: 'aborted', complete: false };
    }
    return {
      text: '', contentText: '', reasoningText: '', hasFinalContent: false,
      finishReason: 'error', complete: false,
      streamError: e?.message || 'Network error connecting to Gemini API.',
    };
  }

  if (!res.ok || !res.body) {
    let errMsg = `HTTP ${res.status}`;
    try { errMsg = (await res.json())?.error?.message || errMsg; } catch { /* */ }
    return { text: '', contentText: '', reasoningText: '', hasFinalContent: false, finishReason: 'error', complete: false, streamError: errMsg };
  }

  // Gemini streamGenerateContent with alt=sse returns SSE-like data:
  //   data: { "candidates": [...], "usageMetadata": {...} }
  // followed by "data: [DONE]" (or just EOF). Parse SSE lines like the proxy.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let contentText = '';
  let truncated = false;
  let midStreamError: string | undefined;
  let functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal?.aborted) {
        return { text: contentText, contentText, reasoningText: '', hasFinalContent: !!contentText, finishReason: 'aborted', complete: false };
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === 'data: [DONE]') { continue; }
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        let parsed: any;
        try { parsed = JSON.parse(payload); } catch { continue; }

        if (parsed?.error?.message) { midStreamError = parsed.error.message; continue; }

        const candidate = parsed?.candidates?.[0];
        if (!candidate) continue;

        // Gemini finishReason values: "STOP", "MAX_TOKENS", "SAFETY"
        const fr = candidate.finishReason;
        if (fr === 'MAX_TOKENS') {
          truncated = true;
        } else if (fr && fr !== 'STOP') {
          midStreamError = midStreamError || `Gemini stopped: ${fr}`;
        }

        const parts = candidate?.content?.parts;
        if (!Array.isArray(parts)) continue;
        for (const part of parts) {
          if (typeof part.text === 'string') {
            contentText += part.text;
            onDelta?.(part.text);
          } else if (part.functionCall && typeof part.functionCall.name === 'string') {
            functionCalls.push({
              name: part.functionCall.name,
              args: (part.functionCall.args as Record<string, unknown>) || {},
            });
          }
        }
      }
    }
  } catch (e: any) {
    if (signal?.aborted) return { text: contentText, contentText, reasoningText: '', hasFinalContent: !!contentText, finishReason: 'aborted', complete: false };
    return {
      text: contentText, contentText, reasoningText: '', hasFinalContent: !!contentText,
      finishReason: 'error', complete: false,
      streamError: midStreamError || e?.message || 'Gemini stream interrupted.',
    };
  }

  if (midStreamError) {
    return { text: contentText, contentText, reasoningText: '', hasFinalContent: !!contentText, finishReason: 'error', complete: false, streamError: midStreamError };
  }
  if (signal?.aborted) {
    return { text: contentText, contentText, reasoningText: '', hasFinalContent: !!contentText, finishReason: 'aborted', complete: false };
  }

  // MAX_TOKENS -> 'length', signalling completeChat to continue from the tail.
  if (truncated) {
    const complete = false;
    return {
      text: contentText, contentText, reasoningText: '', hasFinalContent: !!contentText,
      finishReason: 'length', complete,
      functionCalls,
      streamError: !contentText && !functionCalls.length ? 'Gemini ran out of tokens before producing an answer.' : undefined,
    };
  }

  // Normal finish (STOP / [DONE] / clean stream end) -> complete.
  return {
    text: contentText,
    contentText,
    reasoningText: '',
    hasFinalContent: !!contentText,
    finishReason: 'stop',
    complete: true,
    functionCalls,
    streamError: !contentText && !functionCalls.length ? 'Gemini returned an empty response.' : undefined,
  };
}

// ---------------------------------------------------------------------------
// NVIDIA proxy (OpenAI-compatible SSE) streaming implementation.
// ---------------------------------------------------------------------------
const NVIDIA_URL = 'http://localhost:8686/v1/chat/completions';

async function streamNvidia(opts: {
  messages: ChatMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
}): Promise<StreamResult> {
  const { messages, model, temperature, maxTokens, onDelta, signal } = opts;

  let res: Response;
  try {
    res = await fetch(NVIDIA_URL, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: true }),
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return { text: '', contentText: '', reasoningText: '', hasFinalContent: false, finishReason: 'aborted', complete: false };
    }
    return {
      text: '', contentText: '', reasoningText: '', hasFinalContent: false,
      finishReason: 'error', complete: false,
      streamError: e?.message || 'Network error connecting to the AI proxy.',
    };
  }

  if (!res.ok || !res.body) {
    const msg = await extractUpstreamError(res);
    return { text: '', contentText: '', reasoningText: '', hasFinalContent: false, finishReason: 'error', complete: false, streamError: msg };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let contentText = '';
  let reasoningText = '';
  let finishReason: StreamResult['finishReason'] = 'unknown';
  let sawDone = false;
  let midStreamError: string | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal?.aborted) {
        return { text: contentText, contentText, reasoningText, hasFinalContent: !!contentText, finishReason: 'aborted', complete: false };
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === 'data: [DONE]') { sawDone = true; continue; }
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        let parsed: any;
        try { parsed = JSON.parse(payload); } catch { continue; }

        if (parsed?.error?.message) { midStreamError = parsed.error.message; continue; }

        const choice = parsed?.choices?.[0];
        if (!choice) continue;
        if (choice.finish_reason) {
          finishReason = normalizeFinishReason(choice.finish_reason);
          if (finishReason === 'error') midStreamError = midStreamError || `Upstream stopped with: ${choice.finish_reason}`;
        }
        const delta = choice.delta;
        if (!delta) continue;
        if (delta.content) {
          contentText += delta.content;
          onDelta?.(delta.content);
        } else if (delta.reasoning_content) {
          reasoningText += delta.reasoning_content;
        }
      }
    }
  } catch (e: any) {
    if (signal?.aborted) return { text: contentText, contentText, reasoningText, hasFinalContent: !!contentText, finishReason: 'aborted', complete: false };
    return {
      text: contentText, contentText, reasoningText, hasFinalContent: !!contentText,
      finishReason: 'error', complete: false,
      streamError: midStreamError || e?.message || 'The stream was interrupted.',
    };
  }

  if (midStreamError) {
    return { text: contentText, contentText, reasoningText, hasFinalContent: !!contentText, finishReason: 'error', complete: false, streamError: midStreamError };
  }
  if (signal?.aborted) return { text: contentText, contentText, reasoningText, hasFinalContent: !!contentText, finishReason: 'aborted', complete: false };

  let effective = finishReason;
  if (effective === 'unknown') effective = sawDone ? 'stop' : 'error';

  return {
    text: contentText, contentText, reasoningText, hasFinalContent: !!contentText,
    finishReason: effective,
    complete: effective === 'stop',
    streamError: effective === 'error' ? midStreamError || 'The response was cut off.' : undefined,
  };
}

/**
 * Unified streaming entry point. Routes to the appropriate provider backend.
 */
export async function streamChat(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
}): Promise<StreamResult> {
  const {
    messages,
    model = DEFAULT_MODEL,
    temperature = 0.4,
    maxTokens = DEFAULT_MAX_TOKENS,
    onDelta,
    signal,
  } = opts;

  const provider = getModelProvider(model);
  if (provider === 'gemini') {
    return streamGemini({ messages, model, temperature, maxTokens: maxTokens ?? DEFAULT_MAX_TOKENS, onDelta, signal });
  }
  return streamNvidia({ messages, model, temperature, maxTokens: maxTokens ?? DEFAULT_MAX_TOKENS, onDelta, signal });
}

function normalizeFinishReason(reason: string): StreamResult['finishReason'] {
  if (reason === 'stop') return 'stop';
  if (reason === 'length') return 'length';
  if (reason === 'abort') return 'aborted';
  return 'error';
}

const DEFAULT_MAX_TOKENS = 8000;

/** Minimum length (chars) of a partial answer before we attempt to continue it.
 * Below this the model was still in its thinking phase when it ran out, and a
 * "continue" would just re-trigger thinking (garbled/duplicated output). */
const MIN_CONTINUATION_LENGTH = 300;

export interface CompleteResult {
  text: string;
  error?: string;
  interrupted: boolean;
}

/**
 * High-level completion with automatic continuation + retry.
 *
 * Handles the real-world failure modes of a remote model:
 *   1. Truncation (`finish_reason: length`) → re-call asking it to continue
 *      from where it stopped, concatenating the parts.
 *   2. Stream dropped / upstream error → retry the whole request (with the
 *      accumulated text so far, in case the partial is still useful).
 *   3. Transient HTTP/network errors → retry with exponential backoff.
 *   4. User abort → stop immediately and return what we have.
 *
 * Returns the final, fully-assembled answer text.
 */
export async function completeChat(opts: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
  maxContinuations?: number;
  maxRetries?: number;
}): Promise<CompleteResult> {
  const {
    messages,
    model = DEFAULT_MODEL,
    temperature = 0.4,
    maxTokens = DEFAULT_MAX_TOKENS,
    onDelta,
    signal,
    maxContinuations = 2,
    maxRetries = 4,
  } = opts;

  let history = [...messages];
  let assembled = '';
  let lastError: string | undefined;
  let interrupted = false;

  for (let cont = 0; cont <= maxContinuations; cont++) {
    if (signal?.aborted) break;

    // Build messages for this leg: base conversation + optional continuation.
    const legMessages = [...history];
    if (assembled) {
      // Send only the tail of the final answer so the continuation context
      // stays small even across many legs (the model just needs the ending).
      const tail = assembled.slice(-3500);
      legMessages.push({
        role: 'user',
        content: CONTINUATION_PROMPT.replace('{PRIOR}', tail),
      });
    }

    let result: StreamResult | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (signal?.aborted) return { text: assembled, error: lastError, interrupted: true };
      result = await streamChat({
        messages: legMessages,
        model,
        temperature,
        maxTokens,
        onDelta,
        signal,
      });
      if (result.finishReason === 'aborted') return { text: assembled, error: lastError, interrupted: true };
      if (result.streamError) lastError = result.streamError;

      // Retry the SAME leg only when no final content reached the UI yet
      // (nothing user-visible was produced, so a fresh retry is clean). If a
      // partial final answer was already streamed, don't re-run — continue
      // from where it stopped instead to avoid duplication.
      const canRetryCleanly = !result.hasFinalContent && result.finishReason !== 'stop';
      if (!canRetryCleanly || attempt >= maxRetries) break;
      await sleep(backoff(attempt));
    }

    if (!result) break;
    const addition = result.contentText || result.text || '';
    if (addition) assembled += (assembled ? '\n' : '') + addition;

    // Stopped naturally -> done (even if empty, e.g. refused).
    if (result.finishReason === 'stop') break;
    // Aborted -> return what we have.
    if (result.finishReason === 'aborted') break;

    // Truncated/errored with NO final answer at all means the token budget was
    // spent during reasoning before the answer started. There is nothing to
    // continue; report it so the UI can surface the incomplete result.
    if (!result.hasFinalContent) {
      interrupted = true;
      lastError = lastError || 'The model ran out before producing an answer. Try again or ask a shorter question.';
      break;
    }

    // If the partial answer is tiny, the model was still mid-thinking and a
    // "continue" just re-triggers thinking (garbled/duplicated output). Treat
    // it as incomplete rather than producing a broken continuation.
    if (addition.length < MIN_CONTINUATION_LENGTH) {
      interrupted = true;
      lastError = lastError || 'The answer was cut off while being generated. Retry or ask a shorter question.';
      break;
    }

    // Otherwise there IS a partial final answer -> ask for a continuation leg.
    if (cont >= maxContinuations) {
      interrupted = true; // still cut off after all continuation legs
      break;
    }
  }

  return { text: assembled.trim(), error: lastError, interrupted };
}

const CONTINUATION_PROMPT =
  'Your previous reply was cut off. Continue EXACTLY from where you stopped, ' +
  'without repeating anything. Just append the remaining part.' +
  '\n\n--- previous (incomplete) reply so far ---\n{PRIOR}\n--- end ---';

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function backoff(attempt: number): number {
  return Math.min(500 * Math.pow(2, attempt), 8000);
}

/**
 * Parse an upstream error body. The NVIDIA proxy can return either a plain
 * JSON error ({ error: { message } }) or, on a streaming upstream failure, an
 * SSE-encoded chunk (data: {"error":{"message":"..."}}). Handle both.
 */
async function extractUpstreamError(res: Response): Promise<string> {
  let raw = '';
  try {
    raw = await res.text();
  } catch {
    return `HTTP ${res.status}`;
  }
  const trimmed = raw.trim();
  const sseMatch = trimmed.match(/^data:\s*(\{.*\})/m);
  if (sseMatch && sseMatch[1]) {
    try {
      const parsed = JSON.parse(sseMatch[1]);
      if (parsed?.error?.message) return parsed.error.message;
    } catch {
      /* fall through */
    }
  }
  try {
    const j = JSON.parse(raw);
    if (j?.error?.message) return j.error.message;
    if (j?.message) return j.message;
  } catch {
    /* fall through */
  }
  return trimmed || `HTTP ${res.status}`;
}

const CHAT_STORAGE_KEY = 'pach-chat';

export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(arr)) return [];
    // Only keep user/assistant pairs (system is rebuilt per attached kundli).
    return arr.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
  } catch {
    return [];
  }
}

export function persistChatHistory(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* storage full — ignore */
  }
}

export function clearChatHistory(): void {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Keep recent history within a rough token budget (oldest pairs dropped). */
export function trimHistory(messages: ChatMessage[], budget = 6000): ChatMessage[] {
  const out = [...messages];
  while (estimateTokens(out) > budget && out.length > 2) {
    out.splice(0, 2);
  }
  return out;
}

function estimateTokens(msgs: ChatMessage[]): number {
  let n = 0;
  for (const m of msgs) n += (m.content.length / 4) | 0;
  return n;
}
