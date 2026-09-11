import { ASTRO_BUDGET, type AstroAnalysisPlan, type AstroEvidence, type EvidenceEvaluation } from './astroTypes';
import { createProviderForModel, estimateCostUsd, type ModelUsage } from './astroModelProvider';

// ---------------------------------------------------------------------------
// Synthesis — one strong final call that produces the user-facing answer.
// ---------------------------------------------------------------------------

export interface SynthesisInput {
  question: string;
  kundliContext: string;
  plan: AstroAnalysisPlan;
  evidence: AstroEvidence[];
  evaluation: EvidenceEvaluation;
  conversationContext?: string;
  detailed: boolean;
  model?: string;
}

export interface SynthesisResult {
  text: string;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

function buildSynthesisSystem(detailed: boolean): string {
  return `You are AstroChitra's final Vedic astrology synthesis expert. Combine the supplied structured evidence into one clear, confident, user-facing answer.

Rules:
- Answer the user's ACTUAL question first. Prioritize the strongest evidence, not a dump of every finding.
- RESPECT the natal (D1) promise: a weak natal promise cannot be rescued by transits alone; a strong one can be delayed but not denied.
- Use the Dasha for activation (running Mahadasha x Antardasha), and treat Gochar as a TRIGGER — never as the standalone foundation for a prediction.
- Use Varga (D9) only to confirm or refine, not to override D1.
- Explicitly handle contradictions: where factors point opposite ways, say the likely outcome and the condition that determines it (e.g. "promised but delayed, not denied").
- Use ONLY the chart facts in the supplied evidence/kundli context. NEVER invent planet positions, houses, nakshatras, degrees, dashas, varga or gochar. If data is missing, say "insufficient data" rather than guessing.
- NEVER invent exact dates or false precision. If timing is given, use a supported broad or sub-period window.
- NEVER give absolute guarantees or fear-based statements. Astrology is interpretation, not scientific fact.
- Use Vedic astrology terminology naturally and briefly explain terms when needed.
- Answer in the user's language (English, Hindi, or Marathi as used).
- ${detailed ? 'DETAILED MODE: expose the reasoning explicitly — question interpretation, relevant Bhavas, relevant Grahas, D1 promise, key graha analysis, Dasha, Gochar, Varga, confirmations, contradictions, then synthesis. Be thorough but stay structured.' : 'NORMAL MODE: give the direct answer first (1 sentence), then the 3-6 strongest reasons, then timing if applicable, then conditions/caveats. Keep it concise and user-oriented.'}
- Do NOT mention the internal AI workflow, modules, evidence, or "analysis pipeline".`;
}

export async function synthesizeAstroAnswer(
  input: SynthesisInput
): Promise<SynthesisResult> {
  const model = input.model ?? 'gemini-2.5-flash';
  const maxTokens = input.detailed
    ? ASTRO_BUDGET.maxSynthesisOutputTokens + 400
    : ASTRO_BUDGET.maxSynthesisOutputTokens;

  const usage: ModelUsage[] = [];
  const onUsage = (u: ModelUsage) => usage.push(u);

  const evidenceText = JSON.stringify(
    input.evidence.map((ev) => ({
      module: ev.module,
      findings: ev.findings,
      ...(ev.error ? { error: ev.error } : {}),
    }))
  );

  const prompt = `User question: ${input.question}
${input.conversationContext ? input.conversationContext + '\n' : ''}
Plan: type=${input.plan.questionType}, intent=${input.plan.intent}, timingRequired=${input.plan.timingRequired}, detailed=${input.detailed}

Kundli context:
${input.kundliContext}

Evidence:
${evidenceText}

Evidence evaluation:
overallDirection=${input.evaluation.overallDirection}, strength=${input.evaluation.strength}, confidence=${input.evaluation.confidence.toFixed(2)}
supporting=[${input.evaluation.supportingFactors.join(', ')}]
contradicting=[${input.evaluation.contradictingFactors.join(', ')}]

Write the final answer now.`;

  const provider = createProviderForModel(model);
  const text = await provider.generateText({
    system: buildSynthesisSystem(input.detailed),
    prompt,
    model,
    maxTokens,
    temperature: input.detailed ? 0.55 : 0.45,
    onUsage,
  });

  const usageTotal = usage.reduce(
    (a, u) => ({ inputTokens: a.inputTokens + u.inputTokens, outputTokens: a.outputTokens + u.outputTokens }),
    { inputTokens: 0, outputTokens: 0 }
  );

  return {
    text,
    requestCount: 1,
    inputTokens: usageTotal.inputTokens,
    outputTokens: usageTotal.outputTokens,
    estimatedCostUsd: estimateCostUsd(model, usageTotal),
  };
}