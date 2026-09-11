import {
  ASTRO_BUDGET,
  type AstroAnalysisPlan,
  type AstroEvidence,
  type EvidenceEvaluation,
} from './astroTypes';
import { createProviderForModel, estimateCostUsd, type ModelUsage } from './astroModelProvider';

// ---------------------------------------------------------------------------
// Evidence evaluation — combines confirmation + contradiction in ONE call.
// ---------------------------------------------------------------------------

const EVAL_SYSTEM = `You are the AstroChitra EVIDENCE EVALUATOR. You receive structured evidence findings from independent chart-analysis modules and decide how the evidence nets out for the user's question.

Rules:
- Only reason from the supplied evidence findings. Do NOT invent chart facts.
- supportingFactors = short labels of findings that point toward the matter materializing.
- contradictingFactors = short labels of findings that point against it or delay it.
- overallDirection: "supports" | "mixed" | "weakens" | "neutral".
- strength: "strong" | "moderate" | "weak" (how decisive the evidence is, not the prediction tone).
- confidence: 0 to 1.
- Output STRICT JSON only:
{
  "supportingFactors": string[],
  "contradictingFactors": string[],
  "overallDirection": string,
  "strength": string,
  "confidence": number
}`;

function normalizeEvaluation(raw: unknown): EvidenceEvaluation {
  const fallback: EvidenceEvaluation = {
    supportingFactors: [],
    contradictingFactors: [],
    overallDirection: 'neutral',
    strength: 'weak',
    confidence: 0.5,
  };
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;
  return {
    supportingFactors: Array.isArray(r.supportingFactors)
      ? r.supportingFactors.filter((s): s is string => typeof s === 'string').slice(0, 8)
      : [],
    contradictingFactors: Array.isArray(r.contradictingFactors)
      ? r.contradictingFactors.filter((s): s is string => typeof s === 'string').slice(0, 8)
      : [],
    overallDirection: ['supports', 'mixed', 'weakens', 'neutral'].includes(
      r.overallDirection as string
    )
      ? (r.overallDirection as EvidenceEvaluation['overallDirection'])
      : 'neutral',
    strength: ['strong', 'moderate', 'weak'].includes(r.strength as string)
      ? (r.strength as EvidenceEvaluation['strength'])
      : 'weak',
    confidence:
      typeof r.confidence === 'number' && !Number.isNaN(r.confidence)
        ? Math.min(1, Math.max(0, r.confidence))
        : 0.5,
  };
}

/**
 * Deterministic fallback: nets out the findings' effect/strength/confidence
 * without an LLM call. Used when the plan did not request the confirmation/
 * contradiction evaluation stage.
 */
export function aggregateEvidence(evidence: AstroEvidence[]): EvidenceEvaluation {
  let score = 0;
  let weightSum = 0;
  const supporting: string[] = [];
  const contradicting: string[] = [];
  for (const ev of evidence) {
    for (const f of ev.findings) {
      const w =
        f.strength === 'strong' ? 3 : f.strength === 'moderate' ? 2 : 1;
      const sign = f.effect === 'supports' ? 1 : f.effect === 'weakens' ? -1 : f.effect === 'mixed' ? 0.2 : 0;
      const conf = f.confidence ?? 0.5;
      score += sign * w * conf;
      weightSum += w;
      if (f.effect === 'supports') supporting.push(f.factor);
      else if (f.effect === 'weakens') contradicting.push(f.factor);
    }
  }
  const weight = weightSum || 1;
  const normalized = score / weight;
  const overallDirection: EvidenceEvaluation['overallDirection'] =
    normalized > 0.12 ? 'supports'
    : normalized < -0.12 ? 'weakens'
    : Math.abs(normalized) <= 0.12 && (supporting.length || contradicting.length) ? 'mixed'
    : 'neutral';
  const strength: EvidenceEvaluation['strength'] =
    weightSum >= 4 ? 'strong' : weightSum >= 2 ? 'moderate' : 'weak';
  const confidence = Math.min(1, Math.max(0, 0.5 + normalized * 0.5));
  return {
    supportingFactors: supporting.slice(0, 8),
    contradictingFactors: contradicting.slice(0, 8),
    overallDirection,
    strength,
    confidence,
  };
}

export interface EvidenceRunResult {
  evaluation: EvidenceEvaluation;
  usedLlmCall: boolean;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export async function evaluateEvidence(opts: {
  question: string;
  evidence: AstroEvidence[];
  plan: AstroAnalysisPlan;
  model?: string;
}): Promise<EvidenceRunResult> {
  const model = opts.model ?? 'gemini-2.5-flash';
  const usage: ModelUsage[] = [];
  const onUsage = (u: ModelUsage) => usage.push(u);

  const compactEvidence = JSON.stringify(
    opts.evidence.map((ev) => ({
      module: ev.module,
      findings: ev.findings,
    }))
  );

  const provider = createProviderForModel(model);
  const raw = await provider.generateStructured<unknown>({
    system: EVAL_SYSTEM,
    prompt: `User question: ${opts.question}\nPlan focus: type=${opts.plan.questionType}, intent=${opts.plan.intent}, timingRequired=${opts.plan.timingRequired}\n\nEvidence findings:\n${compactEvidence}\n\nReturn STRICT JSON evaluation.`,
    model,
    maxTokens: Math.min(ASTRO_BUDGET.maxModuleOutputTokens, 300),
    temperature: 0.2,
    onUsage,
  });

  const usageTotal = usage.reduce(
    (a, u) => ({ inputTokens: a.inputTokens + u.inputTokens, outputTokens: a.outputTokens + u.outputTokens }),
    { inputTokens: 0, outputTokens: 0 }
  );

  return {
    evaluation: normalizeEvaluation(raw),
    usedLlmCall: true,
    requestCount: 1,
    inputTokens: usageTotal.inputTokens,
    outputTokens: usageTotal.outputTokens,
    estimatedCostUsd: estimateCostUsd(model, usageTotal),
  };
}