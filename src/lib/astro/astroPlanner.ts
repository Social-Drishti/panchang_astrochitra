import {
  ANALYSIS_MODULES,
  EVAL_MODULES,
  ASTRO_BUDGET,
  isAstroStep,
  type AstroAnalysisPlan,
  type QuestionIntent,
  type QuestionType,
} from './astroTypes';
import { createProviderForModel } from './astroModelProvider';

// ---------------------------------------------------------------------------
// Planner — a single small LLM call that determines ONLY what analysis is
// needed. It never interprets the chart and never narrates.
// ---------------------------------------------------------------------------

export interface PlanInput {
  question: string;
  kundliContext: string;
  conversation?: string;
  model?: string;
}

const ALLOWED_MODULES = [...ANALYSIS_MODULES, ...EVAL_MODULES];

const QUESTION_TYPES: QuestionType[] = [
  'career',
  'marriage',
  'finance',
  'health',
  'education',
  'children',
  'property',
  'travel',
  'litigation',
  'spiritual',
  'general',
  'other',
];

const INTENTS: QuestionIntent[] = [
  'prediction',
  'timing',
  'explanation',
  'cause',
  'compatibility',
  'guidance',
  'general',
];

/** Astrological defaults per question domain (safety-net fallback plans). */
const DOMAIN_FALLBACK: Record<QuestionType, Partial<AstroAnalysisPlan>> = {
  career: { requiredBhavas: [2, 6, 10, 11], requiredGrahas: ['Sun', 'Saturn', 'Mercury'] },
  marriage: { requiredBhavas: [2, 7, 11], requiredGrahas: ['Venus', 'Jupiter', 'Moon'] },
  finance: { requiredBhavas: [2, 5, 9, 11], requiredGrahas: ['Jupiter', 'Venus', 'Mercury'] },
  health: { requiredBhavas: [1, 6, 8], requiredGrahas: ['Moon', 'Saturn', 'Mars'] },
  education: { requiredBhavas: [1, 4, 5, 9], requiredGrahas: ['Moon', 'Mercury', 'Jupiter'] },
  children: { requiredBhavas: [5, 9], requiredGrahas: ['Jupiter', 'Moon'] },
  property: { requiredBhavas: [3, 4, 10], requiredGrahas: ['Mars', 'Jupiter', 'Moon'] },
  travel: { requiredBhavas: [3, 9, 12], requiredGrahas: ['Moon', 'Jupiter', 'Mars'] },
  litigation: { requiredBhavas: [6, 8, 12], requiredGrahas: ['Mars', 'Saturn', 'Mercury'] },
  spiritual: { requiredBhavas: [9, 12], requiredGrahas: ['Jupiter', 'Ketu', 'Moon'] },
  general: { requiredBhavas: [1, 4, 7, 10], requiredGrahas: ['Moon', 'Sun'] },
  other: {},
};

const PLANNER_SYSTEM = `You are the AstroChitra PLANNER. You decide WHAT analysis is needed for a Vedic astrology question. You do NOT interpret the chart and you write no astrology answers.

Available analysis modules (pick ONLY these names):
- analyze_question: classify the question and note its directly-relevant chart facts
- select_relevant_factors: identify the specific houses, karakas, dispositors that matter
- assess_natal_promise: judge the D1 natal strength for the relevant houses/lords
- analyze_planets: deep analysis of the focus planets (sign, house, dignity, retrograde, combust)
- analyze_nakshatra: nakshatra lords/padas of key grahas and the Moon
- analyze_drishti_conjunctions: aspects and conjunctions touching relevant houses/lords
- detect_yogas: yogas supporting or hindering the matter
- check_varga: confirm/refine via navamsa (D9)
- analyze_dasha: running Mahadasha x Antardasha and whether it activates the natal promise
- analyze_gochar: current transits as a TRIGGER (only when the natal promise already supports the answer)
- check_confirmations: which independent factors align
- check_contradictions: which independent factors oppose

Rules:
1. Choose the MINIMAL set needed to answer well. Do NOT force every module onto every question.
2. If the question is purely factual (moon sign, lagna, nakshatra, a planet's position, current dasha), choose only ["analyze_question"].
3. Only pick analyze_gochar if the kundli context includes current transit data. It usually will NOT (the context states "TRANSIT DATA ... NOT included"), so leave it out.
4. check_confirmations and check_contradictions together form ONE extra evaluation stage — pick BOTH only when the question needs weighing of multiple factors (predictions, timing, cause). Skip them for simple explanations.
5. requiredGrahas: only planets actually relevant (bhava lords of requiredBhavas, planets placed in those bhavas, natural significators). Max ~5.
6. requiredBhavas: 1-5 relevant houses for the domain.
7. timingRequired = true only if the user asks WHEN / future timing.
8. detailed = true only if the user asks for depth (e.g. "explain in detail", "detailed analysis").
9. Valid questionType values: ${QUESTION_TYPES.join(', ')}. Valid intent values: ${INTENTS.join(', ')}.
10. Return STRICT JSON only, exactly this shape:
{
  "questionType": string,
  "intent": string,
  "requiredBhavas": number[],
  "requiredGrahas": string[],
  "requiredModules": string[],
  "timingRequired": boolean,
  "detailed": boolean
}`;

export function defaultPlan(
  questionType: QuestionType = 'general',
  detailed = false
): AstroAnalysisPlan {
  const base = DOMAIN_FALLBACK[questionType] || DOMAIN_FALLBACK.general;
  return {
    questionType,
    intent: 'general',
    requiredBhavas: base.requiredBhavas ?? [1, 4, 7, 10],
    requiredGrahas: base.requiredGrahas ?? ['Moon', 'Sun'],
    requiredModules: ['analyze_question', 'assess_natal_promise'],
    timingRequired: false,
    detailed,
  };
}

// ---------------------------------------------------------------------------
// Deterministic fast path — answers directly from the calculated kundli data
// with ZERO AI calls. Only used when the question is purely factual.
// ---------------------------------------------------------------------------

const PLANET_ALIASES: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mars: 'Mars', mercury: 'Mercury', jupiter: 'Jupiter',
  venus: 'Venus', saturn: 'Saturn', rahu: 'Rahu', ketu: 'Ketu',
};

export type DirectAnswer = {
  final: string;
  steps: [];
  interrupted: false;
};

export function tryDirectKundliAnswer(
  kundli: import('../kundli').KundliData,
  question: string
): DirectAnswer | null {
  const q = question.trim().toLowerCase();

  // Planet position / house placement (e.g. "which house is my Mars in?")
  for (const [alias, key] of Object.entries(PLANET_ALIASES)) {
    if (new RegExp(`(where|which|position|placed|in which house).{0,15}${alias}`).test(q) ||
        new RegExp(`${alias}.{0,15}(in which house|position|placed)`).test(q)) {
      const p = kundli.planets.find((pl) => pl.key === key);
      if (p) {
        const extra = p.isRetro ? ' (retrograde)' : '';
        return {
          final: `${p.label || key} is in ${p.signName}${extra}, placed in House ${p.houseNumber} at ${p.normDegree.toFixed(1)}° (${
            p.nakshatraName
          } nakshatra, lord ${p.nakshatraLord}).`,
          steps: [],
          interrupted: false,
        };
      }
    }
  }

  // "which planet is in my {n}th house?" — no planet name given, list them.
  const housePlanetMatch = q.match(
    /planet.{0,30}(?<!\d)in.{0,15}(?<!\d)(\d{1,2})(?:st|nd|rd|th)\s+house|(?<!\d)(\d{1,2})(?:st|nd|rd|th)\s+house.{0,20}planet/i
  );
  if (housePlanetMatch) {
    const n = parseInt(housePlanetMatch[1] || housePlanetMatch[2] || '', 10);
    const inHouse = kundli.planets.filter((p) => p.houseNumber === n).map((p) => p.label || p.key);
    if (inHouse.length > 0) {
      return {
        final: `In House ${n}, the planets are: ${inHouse.join(', ')}.`,
        steps: [],
        interrupted: false,
      };
    }
  }

  // Moon sign
  if (/moon/.test(q) && /(sign|rashi|rasi)/.test(q)) {
    return {
      final: `Your Moon sign (Chandra Rashi) is ${kundli.moonSignName}. Your Moon is in ${kundli.moonNakshatra} nakshatra.`,
      steps: [],
      interrupted: false,
    };
  }

  // Lagna / Ascendant
  if (/(lagna|ascendant)/.test(q)) {
    return {
      final: `Your Lagna (Ascendant) is ${kundli.ascendantSignName} (${kundli.ascendantRashiName || kundli.ascendantSignName}), nakshatra ${kundli.lagna.nakshatraName} (lord ${kundli.lagna.nakshatraLord}, pada ${kundli.lagna.pada}). Lagna lord is ${getLagnaLord(kundli)}.`,
      steps: [],
      interrupted: false,
    };
  }

  // Moon nakshatra
  if (/nakshatra/.test(q) && /moon/.test(q)) {
    return {
      final: `Your Moon is in ${kundli.moonNakshatra} nakshatra.`,
      steps: [],
      interrupted: false,
    };
  }

  // Current Mahadasha / Antardasha
  if (/(maha ?dasha|current dasha|running dasha)/.test(q)) {
    const md = kundli.dasha.currentMaha;
    if (md) {
      return {
        final: `Your current Mahadasha is ${md.lord} (${md.startStr} to ${md.endStr}).`,
        steps: [],
        interrupted: false,
      };
    }
  }
  if (/(antar ?dasha|antardasha)/.test(q)) {
    const ad = kundli.dasha.currentAntar;
    if (ad) {
      return {
        final: `Your current Antardasha is ${ad.lord} (${ad.startStr} to ${ad.endStr}).`,
        steps: [],
        interrupted: false,
      };
    }
  }
  if (/dasha|dasa/.test(q)) {
    const md = kundli.dasha.currentMaha;
    if (md) {
      const ad = kundli.dasha.currentAntar;
      return {
        final: `Your current running period is ${md.lord} Mahadasha · ${ad?.lord || '—'} Antardasha (${ad?.startStr || md.startStr} to ${ad?.endStr || md.endStr}).`,
        steps: [],
        interrupted: false,
      };
    }
  }

  // Specific house lord — supports "7th house lord", "lord of the 10th house", "10th lord"
  const lordMatch = q.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+house[^.!?]{0,20}lord|lord[^.!?]{0,25}(?<!\d)(\d{1,2})(?:st|nd|rd|th)\s+house|(?<!\d)(\d{1,2})(?:st|nd|rd|th)\s+lord/i
  );
  if (lordMatch) {
    const n = parseInt(lordMatch[1] || lordMatch[2] || lordMatch[3] || '', 10);
    const house = kundli.houses.find((h) => h.houseNumber === n);
    if (house) {
      return {
        final: `Your ${n}${ordinal(n)} house lord is ${house.rashiLord} (${house.rashiLordSa}).`,
        steps: [],
        interrupted: false,
      };
    }
  }

  // Fallback: a bare dasha/lagna/nakshatra mention is not enough — be conservative.
  return null;
}

function getLagnaLord(kundli: import('../kundli').KundliData): string {
  return kundli.houses.find((h) => h.houseNumber === 1)?.rashiLord || kundli.ascendantSignName;
}

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th';
  const last = n % 10;
  return last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th';
}

/**
 * Never trust model-generated module names blindly: validate against enums and
 * hard limits. Invalid output falls back to a safe domain-based plan.
 */
export function validatePlan(
  raw: unknown,
  fallback?: AstroAnalysisPlan
): AstroAnalysisPlan {
  const fb: AstroAnalysisPlan = fallback ?? defaultPlan('general');
  if (!raw || typeof raw !== 'object') return fb;
  const p = raw as Record<string, unknown>;

  const questionType = QUESTION_TYPES.includes(p.questionType as QuestionType)
    ? (p.questionType as QuestionType)
    : fb.questionType;
  const intent = INTENTS.includes(p.intent as QuestionIntent)
    ? (p.intent as QuestionIntent)
    : fb.intent;

  const requiredBhavas = Array.isArray(p.requiredBhavas)
    ? (p.requiredBhavas as unknown[])
        .filter(
          (n): n is number =>
            typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 12
        )
        .slice(0, 6)
    : fb.requiredBhavas;

  const requiredGrahas = Array.isArray(p.requiredGrahas)
    ? (p.requiredGrahas as unknown[])
        .filter((g): g is string => typeof g === 'string')
        .slice(0, 5)
    : fb.requiredGrahas;

  const requiredModules = Array.isArray(p.requiredModules)
    ? (p.requiredModules as unknown[])
        .filter(isAstroStep)
        .filter((s) => s !== 'synthesize' && s !== 'finish')
        .filter((s) => ALLOWED_MODULES.includes(s))
        .slice(0, ASTRO_BUDGET.maxModulesPerQuestion)
    : fb.requiredModules;

  if (requiredModules.length === 0) return fb;

  return {
    questionType,
    intent,
    requiredBhavas,
    requiredGrahas,
    requiredModules,
    timingRequired: Boolean(p.timingRequired),
    detailed: Boolean(p.detailed),
  };
}

/**
 * One small planner call. Returns a validated plan.
 */
export async function planAstroAnalysis(input: PlanInput): Promise<AstroAnalysisPlan> {
  const model = input.model ?? 'gemini-2.5-flash';
  const provider = createProviderForModel(model);
  const result = await provider.generateStructured<AstroAnalysisPlan>({
    system: PLANNER_SYSTEM,
    prompt: `Kundli context:\n${input.kundliContext}\n\n${input.conversation ? `${input.conversation}\n\n` : ''}User question: ${input.question}\n\nDecide the minimal analysis plan. Return STRICT JSON.`,
    model,
    maxTokens: ASTRO_BUDGET.maxPlannerOutputTokens,
    temperature: 0.2,
  });
  return validatePlan(result);
}