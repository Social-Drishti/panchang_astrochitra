import {
  ANALYSIS_MODULES,
  ASTRO_BUDGET,
  STEP_LABELS,
  type AstroAnalysisModule,
  type AstroAnalysisPlan,
  type AstroEvidence,
  type AstroFinding,
  type AstroModuleContext,
  type AstroStepName,
  type AstroStepRecord,
} from './astroTypes';
import { createProviderForModel, estimateCostUsd, type ModelUsage } from './astroModelProvider';

// ---------------------------------------------------------------------------
// Analysis modules — compact, structured, fact-only evidence. No essays.
// ---------------------------------------------------------------------------

const MODULE_SYSTEM = `You are a Vedic astrology analysis module in the AstroChitra pipeline. Produce COMPACT, factual observations for ONE chart-interpretation task.

Hard rules:
- Use ONLY the supplied kundli context. NEVER invent planet positions, houses, nakshatras, degrees, dignity, dasha periods, varga positions, or transit positions that are not in the context.
- If the needed data is absent from the context, do NOT guess — include a finding with observation "insufficient data" and empty evidence.
- Do NOT write prose or essays. Output STRICT JSON.
- Keep each finding short (one clause per observation).

Output STRICT JSON matching this shape:
{
  "findings": [
    {
      "factor": "short label (e.g. 10th Bhava, Saturn, Moon nakshatra)",
      "observation": "one factual clause",
      "effect": "supports" | "weakens" | "mixed" | "neutral",
      "strength": "strong" | "moderate" | "weak",
      "evidence": ["short fact string 1", "short fact string 2"],
      "confidence": number between 0 and 1
    }
  ]
}
Max ${ASTRO_BUDGET.maxEvidenceItemsPerModule} findings.`;

function focusLine(plan: AstroAnalysisPlan): string {
  return `Question type: ${plan.questionType} | intent: ${plan.intent} | bhavas: [${plan.requiredBhavas.join(', ')}] | grahas: [${plan.requiredGrahas.join(', ')}] | timingRequired: ${plan.timingRequired} | detailed: ${plan.detailed}`;
}

function buildPrompt(
  name: AstroStepName,
  ctx: AstroModuleContext
): string {
  const task: Record<string, string> = {
    analyze_question:
      'Classify the question into its astrological domain and intent; note the chart facts directly relevant to it (Lagna, Moon, 7th lord, current 9lord of the relevant bhava, current dasha). Findings = the parsed question + the directly relevant chart anchors.',
    select_relevant_factors:
      'From the relevant bhavas and grahas in focus, specify the exact houses, bhava lords, natural significators (karakas) and dispositors that matter for this question. Findings = the selected factors and why they matter.',
    assess_natal_promise:
      'For the relevant bhavas and their lords, judge the D1 natal promise strength. Findings = one verdict per relevant bhava/lord (strong/moderate/weak, supporting or hindering).',
    analyze_planets:
      'For the relevant grahas, analyze: sign, house, nakshatra + lord + pada, dignity, retrograde/combust — and what that means for the matter. One finding per planet.',
    analyze_nakshatra:
      'Analyze the nakshatras and nakshatra lords of the key grahas and the Moon, and the temperament/energy they confer on the matter. One finding per nakshatra.',
    analyze_drishti_conjunctions:
      'Identify aspects (drishti) and conjunctions touching the relevant houses and lords, and whether they strengthen, weaken or redirect the matter. One finding per aspect/conjunction.',
    detect_yogas:
      'Detect yogas (raja/dhana/vipareeta/neecha-bhanga/malefic) that touch the relevant houses or lords, and whether each helps or hinders. One finding per yoga.',
    check_varga:
      'Using the NAVAMSA (D9) provided, confirm, refine, or contradict the natal promise for the relevant lords. Findings = D9 placements and their verdict vs D1.',
    analyze_dasha:
      'Read the running Mahadasha x Antardasha from the context. Findings = which lords are activated now and how their sign/house relate to the question, plus the sub-period window.',
    analyze_gochar:
      'The kundli context states whether current transit data is included. If transit positions are NOT provided, return a single finding: observation "insufficient data", effect "neutral". Otherwise evaluate relevant transits as a TRIGGER only.',
  };
  return `Task for module "${name}" (${STEP_LABELS[name]}):
${task[name]}

${focusLine(ctx.plan)}
Relevant previous module evidence (use only if useful):
${ctx.relevantEvidence && ctx.relevantEvidence.length ? JSON.stringify(ctx.relevantEvidence) : 'none'}

User question: ${ctx.question}

Kundli context:
${ctx.kundliContext}

Return STRICT JSON findings only.`;
}

export function moduleRegistry(opts?: {
  model?: string;
  onUsage?: (u: ModelUsage) => void;
}): Record<AstroStepName, AstroAnalysisModule | undefined> {
  const model = opts?.model ?? 'gemini-2.5-flash';
  const onUsage = opts?.onUsage;
  const make = (
    name: AstroStepName,
    description: string
  ): AstroAnalysisModule => ({
    name,
    description,
    execute: async (ctx) => {
      const provider = createProviderForModel(model);
      const result = await provider.generateStructured<{ findings?: unknown }>(
        {
          system: MODULE_SYSTEM,
          prompt: buildPrompt(name, ctx),
          model,
          maxTokens: ASTRO_BUDGET.maxModuleOutputTokens,
          temperature: 0.3,
          ...(onUsage ? { onUsage } : {}),
        }
      );
      return {
        module: name,
        findings: normalizeFindings(result?.findings, name),
      };
    },
  });

  const reg: Record<string, AstroAnalysisModule | undefined> = {};
  for (const name of ANALYSIS_MODULES) {
    reg[name] = make(name, STEP_LABELS[name]);
  }
  return reg as Record<AstroStepName, AstroAnalysisModule | undefined>;
}

function normalizeFindings(raw: unknown, module: AstroStepName): AstroFinding[] {
  if (!Array.isArray(raw)) {
    return [{ factor: module, observation: 'insufficient data', effect: 'neutral', strength: 'weak', evidence: [], confidence: 0 }];
  }
  return raw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
    .slice(0, ASTRO_BUDGET.maxEvidenceItemsPerModule)
    .map((f) => ({
      factor: typeof f.factor === 'string' && f.factor ? f.factor.slice(0, 80) : module,
      observation:
        typeof f.observation === 'string' && f.observation ? f.observation.slice(0, 240) : 'insufficient data',
      effect: ['supports', 'weakens', 'mixed', 'neutral'].includes(f.effect as string)
        ? (f.effect as AstroFinding['effect'])
        : 'neutral',
      strength: ['strong', 'moderate', 'weak'].includes(f.strength as string)
        ? (f.strength as AstroFinding['strength'])
        : 'weak',
      evidence: Array.isArray(f.evidence)
        ? f.evidence.filter((e): e is string => typeof e === 'string').slice(0, 5)
        : [],
      confidence:
        typeof f.confidence === 'number' && !Number.isNaN(f.confidence)
          ? Math.min(1, Math.max(0, f.confidence))
          : 0,
    }));
}

// ---------------------------------------------------------------------------
// Dependencies + plan expansion
// ---------------------------------------------------------------------------

const MODULE_DEPENDENCIES: Partial<Record<AstroStepName, AstroStepName[]>> = {
  analyze_planets: ['select_relevant_factors'],
  analyze_nakshatra: ['analyze_planets'],
  analyze_drishti_conjunctions: ['analyze_planets'],
  detect_yogas: ['select_relevant_factors'],
  check_varga: ['select_relevant_factors'],
  analyze_dasha: [],
  analyze_gochar: [],
  assess_natal_promise: [],
  select_relevant_factors: [],
  analyze_question: [],
};

/** Expand required modules with the dependency closure, capped and ordered. */
export function expandModules(required: AstroStepName[]): AstroStepName[] {
  const ordered: AstroStepName[] = [];
  const push = (m: AstroStepName) => {
    if (!ordered.includes(m)) ordered.push(m);
  };
  for (const m of required) push(m);
  // inject prerequisites, but preserve the required order first
  const collect = (m: AstroStepName) => {
    for (const dep of MODULE_DEPENDENCIES[m] ?? []) collect(dep);
  };
  const deps: AstroStepName[] = [];
  for (const m of ordered) {
    for (const dep of MODULE_DEPENDENCIES[m] ?? []) {
      if (!deps.includes(dep)) deps.push(dep);
    }
  }
  const merged = [...ordered, ...deps];
  const unique = Array.from(new Set(merged));
  void collect;
  return unique.slice(0, ASTRO_BUDGET.maxModulesPerQuestion);
}

/** Topological layers: modules whose deps are satisfied run in the same batch. */
export function dependencyLevels(
  modules: AstroStepName[]
): AstroStepName[][] {
  const level = new Map<AstroStepName, number>();
  for (const m of modules) level.set(m, 0);
  // Relax until stable so dependencies always precede dependents regardless
  // of the input order.
  let changed = true;
  while (changed) {
    changed = false;
    for (const m of modules) {
      const deps = (MODULE_DEPENDENCIES[m] ?? []).filter((d) => modules.includes(d));
      const target = deps.length
        ? Math.max(...deps.map((d) => level.get(d) ?? 0)) + 1
        : 1;
      if (target > (level.get(m) ?? 0)) {
        level.set(m, target);
        changed = true;
      }
    }
  }
  const max = Math.max(...Array.from(level.values()));
  const layers: AstroStepName[][] = [];
  for (let l = 1; l <= max; l++) {
    const group = modules.filter((m) => level.get(m) === l);
    if (group.length) layers.push(group);
  }
  return layers;
}

// ---------------------------------------------------------------------------
// Module runner — parallel where independent, evidence store output.
// ---------------------------------------------------------------------------

export interface ModuleRunResult {
  evidence: AstroEvidence[];
  executed: AstroStepRecord[];
  requiresEvaluation: boolean;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

function emptyMetrics(): {
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
} {
  return { requestCount: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 };
}

export async function executeAstroModules(opts: {
  question: string;
  kundliContext: string;
  plan: AstroAnalysisPlan;
  relevantEvidence?: AstroEvidence[];
  conversationContext?: string;
  models?: { planner?: string; analysis?: string; synthesis?: string };
  onStep?: (rec: AstroStepRecord) => void;
}): Promise<ModuleRunResult> {
  const { question, kundliContext, plan, conversationContext, onStep } = opts;
  const analysisModel = opts.models?.analysis ?? 'gemini-2.5-flash';
  const metrics = emptyMetrics();
  const usageAccum: ModelUsage[] = [];
  const onUsage = (u: ModelUsage) => usageAccum.push(u);

  const requiresEvaluation =
    plan.requiredModules.includes('check_confirmations') ||
    plan.requiredModules.includes('check_contradictions');

  const executionModules = expandModules(
    plan.requiredModules.filter((m) => ANALYSIS_MODULES.includes(m))
  );

  const registry = moduleRegistry({ model: analysisModel, onUsage });
  const executed: AstroStepRecord[] = [];
  const evidence: AstroEvidence[] = [];
  const ctx: AstroModuleContext = {
    question,
    kundliContext,
    plan,
    relevantEvidence: opts.relevantEvidence,
    conversationContext,
  };

  const layers = dependencyLevels(executionModules);
  let failed = 0;
  for (const layer of layers) {
    await Promise.all(
      layer.map(async (name) => {
        const mod = registry[name];
        if (!mod) return;
        onStep?.({ step: name, note: STEP_LABELS[name], status: 'running' });
        executed.push({ step: name, note: STEP_LABELS[name], status: 'running' });
        try {
          const ev = await mod.execute(ctx);
          metrics.requestCount += 1;
          evidence.push(ev);
          const rec = executed[executed.length - 1];
          if (rec) rec.status = 'done';
          onStep?.({ step: name, note: STEP_LABELS[name], status: 'done' });
        } catch (e: any) {
          failed++;
          metrics.requestCount += 1;
          evidence.push({
            module: name,
            findings: [],
            error: e?.message || `Module ${name} failed`,
          });
          const rec = executed[executed.length - 1];
          if (rec) rec.status = 'error';
          onStep?.({ step: name, note: STEP_LABELS[name], status: 'error' });
        }
      })
    );
  }

  if (failed === executionModules.length && executionModules.length > 0) {
    const firstError = evidence.find((e) => e.error)?.error;
    throw new Error(
      firstError
        ? `All analysis modules failed. ${firstError}`
        : 'All analysis modules failed. Check the AI provider/API key.'
    );
  }

  for (const u of usageAccum) {
    metrics.inputTokens += u.inputTokens;
    metrics.outputTokens += u.outputTokens;
  }
  metrics.estimatedCostUsd += estimateCostUsd(
    analysisModel,
    usageAccum.reduce(
      (a, u) => ({
        inputTokens: a.inputTokens + u.inputTokens,
        outputTokens: a.outputTokens + u.outputTokens,
      }),
      { inputTokens: 0, outputTokens: 0 }
    )
  );

  return { evidence, executed, requiresEvaluation, ...metrics };
}