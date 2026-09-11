export const ASTRO_STEP_NAMES = [
  'analyze_question',
  'select_relevant_factors',
  'assess_natal_promise',
  'analyze_planets',
  'analyze_nakshatra',
  'analyze_drishti_conjunctions',
  'detect_yogas',
  'check_varga',
  'analyze_dasha',
  'analyze_gochar',
  'check_confirmations',
  'check_contradictions',
  'synthesize',
  'finish',
] as const;

export type AstroStepName = (typeof ASTRO_STEP_NAMES)[number];

export function isAstroStep(name: unknown): name is AstroStepName {
  return typeof name === 'string' && (ASTRO_STEP_NAMES as readonly string[]).includes(name);
}

export const STEP_LABELS: Record<AstroStepName, string> = {
  analyze_question: 'Analyzing question',
  select_relevant_factors: 'Selecting relevant houses & planets',
  assess_natal_promise: 'Assessing natal promise',
  analyze_planets: 'Analyzing planets',
  analyze_nakshatra: 'Analyzing nakshatras',
  analyze_drishti_conjunctions: 'Checking aspects & conjunctions',
  detect_yogas: 'Detecting yogas',
  check_varga: 'Checking varga charts',
  analyze_dasha: 'Analyzing dasha periods',
  analyze_gochar: 'Checking current transits',
  check_confirmations: 'Weighing confirmations',
  check_contradictions: 'Checking contradictions',
  synthesize: 'Synthesizing the evidence',
  finish: 'Writing final answer',
};

export const ANALYSIS_MODULES: readonly AstroStepName[] = [
  'analyze_question',
  'select_relevant_factors',
  'assess_natal_promise',
  'analyze_planets',
  'analyze_nakshatra',
  'analyze_drishti_conjunctions',
  'detect_yogas',
  'check_varga',
  'analyze_dasha',
  'analyze_gochar',
];

export const EVAL_MODULES: readonly AstroStepName[] = [
  'check_confirmations',
  'check_contradictions',
];

export type QuestionType =
  | 'career'
  | 'marriage'
  | 'finance'
  | 'health'
  | 'education'
  | 'children'
  | 'property'
  | 'travel'
  | 'litigation'
  | 'spiritual'
  | 'general'
  | 'other';

export type QuestionIntent =
  | 'prediction'
  | 'timing'
  | 'explanation'
  | 'cause'
  | 'compatibility'
  | 'guidance'
  | 'general';

export interface AstroAnalysisPlan {
  questionType: QuestionType;
  intent: QuestionIntent;
  requiredBhavas: number[];
  requiredGrahas: string[];
  requiredModules: AstroStepName[];
  timingRequired: boolean;
  detailed: boolean;
}

export interface AstroFinding {
  factor: string;
  observation: string;
  effect: 'supports' | 'weakens' | 'mixed' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
  evidence: string[];
  confidence: number;
}

export interface AstroEvidence {
  module: AstroStepName;
  findings: AstroFinding[];
  error?: string;
}

export interface EvidenceEvaluation {
  supportingFactors: string[];
  contradictingFactors: string[];
  overallDirection: 'supports' | 'mixed' | 'weakens' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
  confidence: number;
}

export interface AstroModuleContext {
  question: string;
  kundliContext: string;
  plan: AstroAnalysisPlan;
  relevantEvidence?: AstroEvidence[];
  conversationContext?: string;
}

export interface AstroAnalysisModule {
  name: AstroStepName;
  description: string;
  execute: (context: AstroModuleContext) => Promise<AstroEvidence>;
}

export interface AstroRunMetrics {
  questionType: string;
  intent: string;
  selectedModules: string[];
  moduleCount: number;
  requestCount: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  durationMs: number;
}

export interface AstroStepRecord {
  step: AstroStepName;
  note: string;
  status?: 'running' | 'done' | 'error';
}

export interface AstroAgentResult {
  final: string;
  steps: AstroStepRecord[];
  error?: string;
  interrupted: boolean;
  metrics?: AstroRunMetrics;
}

/** Token/cost budgets for the pipeline (configurable starting values). */
export const ASTRO_BUDGET = {
  maxPlannerOutputTokens: 300,
  maxModuleOutputTokens: 350,
  maxModulesPerQuestion: 6,
  maxEvidenceItemsPerModule: 5,
  maxSynthesisOutputTokens: 900,
} as const;

export const MAX_MODULES_LIMIT = ASTRO_BUDGET.maxModulesPerQuestion;