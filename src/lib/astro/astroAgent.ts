import type { KundliData } from '../kundli';
import {
  ASTRO_STEP_NAMES,
  STEP_LABELS,
  type AstroAgentResult,
  type AstroAnalysisPlan,
  type AstroRunMetrics,
  type AstroStepName,
  type AstroStepRecord,
} from './astroTypes';
import { buildKundliContext, buildConversationContext } from './astroContext';
import {
  defaultPlan,
  planAstroAnalysis,
  tryDirectKundliAnswer,
  validatePlan,
} from './astroPlanner';
import { executeAstroModules } from './astroModules';
import { aggregateEvidence, evaluateEvidence } from './astroEvidence';
import { synthesizeAstroAnswer } from './astroSynthesis';

// Re-export for backward compatibility with the previous self-chaining agent.
export { ASTRO_STEP_NAMES, STEP_LABELS };
export type { AstroStepName, AstroStepRecord };

export interface RunAstroAnalysisOpts {
  question: string;
  kundli: KundliData;
  conversation?: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Legacy: model dropdown selection. The pipeline uses its own per-stage budgets/models. */
  model?: string;
  /** Legacy: ignored — internal stage budgets govern output. */
  maxTokens?: number;
  detailed?: boolean;
  onStep?: (step: AstroStepRecord) => void;
  models?: { planner?: string; analysis?: string; synthesis?: string };
  signal?: AbortSignal;
}

function aborted(signal?: AbortSignal): boolean {
  return !!signal?.aborted;
}

/**
 * AstroChitra analysis pipeline (Planner → Modules → Evidence → Synthesis).
 *
 * Request shape target:
 *  - simple factual          → 0 AI calls (deterministic fast path)
 *  - normal interpretation   → 1 planner + 3–5 parallel modules + 1 synthesis
 *  - deep interpretation     → 1 planner + up to 6 modules + 1 evaluation + 1 synthesis
 */
export async function runAstroAnalysis(
  opts: RunAstroAnalysisOpts
): Promise<AstroAgentResult> {
  const { question, kundli, detailed = false, onStep } = opts;
  const conversationContext = buildConversationContext(opts.conversation);
  const models = opts.models ?? {};
  const startedAt = Date.now();

  const steps: AstroStepRecord[] = [];
  const emit = (step: AstroStepName, note: string, status: 'running' | 'done' | 'error') => {
    const rec: AstroStepRecord = { step, note, status };
    steps.push(rec);
    onStep?.(rec);
  };
  const setDone = (step: AstroStepName) => {
    const rec = steps[steps.length - 1];
    if (rec && rec.step === step) rec.status = 'done';
  };

  // 1. Deterministic fast path — 0 AI calls.
  try {
    const direct = tryDirectKundliAnswer(kundli, question);
    if (direct) {
      return {
        ...direct,
        metrics: {
          questionType: 'general',
          intent: 'explanation',
          selectedModules: [],
          moduleCount: 0,
          requestCount: 0,
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: 0,
          durationMs: Date.now() - startedAt,
        },
      };
    }
  } catch {
    /* fall through to the AI pipeline */
  }

  if (aborted(opts.signal)) return { final: '', steps, interrupted: true };

  // 2. Compact context.
  const kundliContext = buildKundliContext(kundli);

  // 3. Planner — one small call; safe fallback plan on any failure.
  emit('analyze_question', STEP_LABELS.analyze_question, 'running');
  let plan: AstroAnalysisPlan;
  try {
    plan = await planAstroAnalysis({
      question,
      kundliContext,
      conversation: conversationContext,
      model: models.planner ?? 'gemini-2.5-flash',
    });
  } catch {
    plan = defaultPlan('general', detailed);
  }
  plan = validatePlan(plan, defaultPlan('general', detailed));
  plan = { ...plan, detailed: plan.detailed || detailed };
  setDone('analyze_question');

  if (aborted(opts.signal)) return { final: '', steps, interrupted: true };

  // 4. Execute the selected modules in parallel (dependency-aware).
  let moduleRun;
  let moduleError: string | undefined;
  try {
    moduleRun = await executeAstroModules({
      question,
      kundliContext: buildKundliContext(kundli, plan),
      plan,
      conversationContext,
      models,
      onStep,
    });
    for (const rec of moduleRun.executed) {
      steps.push(rec);
    }
  } catch (e: any) {
    moduleError = e?.message || 'Analysis modules failed.';
  }

  if (moduleError || !moduleRun) {
    return {
      final: '',
      steps,
      error: moduleError || 'No evidence was produced.',
      interrupted: false,
      metrics: {
        questionType: plan.questionType,
        intent: plan.intent,
        selectedModules: plan.requiredModules,
        moduleCount: 0,
        requestCount: 1,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  // 5. Evidence evaluation — one LLM call if the plan asked for it, else deterministic.
  let evaluation;
  let evalInput = 0;
  let evalOutput = 0;
  let evalCost = 0;
  if (moduleRun.requiresEvaluation) {
    const er = await evaluateEvidence({
      question,
      evidence: moduleRun.evidence,
      plan,
      model: models.planner ?? 'gemini-2.5-flash',
    });
    evaluation = er.evaluation;
    evalInput = er.inputTokens;
    evalOutput = er.outputTokens;
    evalCost = er.estimatedCostUsd;
  } else {
    evaluation = aggregateEvidence(moduleRun.evidence);
  }

  // 6. Final synthesis — one strong call.
  emit('synthesize', STEP_LABELS.synthesize, 'running');
  const synth = await synthesizeAstroAnswer({
    question,
    kundliContext: buildKundliContext(kundli, plan),
    plan,
    evidence: moduleRun.evidence,
    evaluation,
    conversationContext,
    detailed: plan.detailed,
    model: models.synthesis ?? 'gemini-2.5-flash',
  });
  setDone('synthesize');

  const metrics: AstroRunMetrics = {
    questionType: plan.questionType,
    intent: plan.intent,
    selectedModules: plan.requiredModules,
    moduleCount: moduleRun.executed.length,
    requestCount: 1 + moduleRun.requestCount + (moduleRun.requiresEvaluation ? 1 : 0) + 1,
    inputTokens:
      moduleRun.inputTokens + evalInput + synth.inputTokens,
    outputTokens:
      moduleRun.outputTokens + evalOutput + synth.outputTokens,
    estimatedCostUsd:
      moduleRun.estimatedCostUsd + evalCost + synth.estimatedCostUsd,
    durationMs: Date.now() - startedAt,
  };

  if (!synth.text.trim()) {
    return {
      final: '',
      steps,
      error: 'The AI did not produce an answer.',
      interrupted: false,
      metrics,
    };
  }

  return {
    final: synth.text,
    steps,
    interrupted: false,
    metrics,
  };
}