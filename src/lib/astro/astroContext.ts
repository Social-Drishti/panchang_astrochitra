import type { KundliData, PlanetInfo } from '../kundli';
import type { AstroAnalysisPlan } from './astroTypes';

const PLANET_SKIP = new Set(['Ascendant', 'Uranus', 'Neptune', 'Pluto']);

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
 * Canonical compact Kundli representation (mirrors the AstroChitra "calculated
 * data structure"). With a plan, targeted sections are trimmed to the relevant
 * bhavas/dasha/varga to save tokens across the pipeline — but never drops data
 * needed for a valid interpretation (always includes Lagna, Moon and all planets).
 */
export function buildKundliContext(
  k: KundliData,
  plan?: AstroAnalysisPlan
): string {
  const lines: string[] = [];
  lines.push(`Person: ${k.personName}`);
  lines.push(`Birth (local): ${k.localDateTime}, Place: ${k.placeName}`);
  lines.push(`Ascendant (Lagna): ${k.ascendantSignName} (${k.ascendantRashiName || ''}) — ${k.lagna.nakshatraName} (${k.lagna.nakshatraLord}, pada ${k.lagna.pada})`);
  lines.push(`Moon: ${k.moonSignName}, nakshatra ${k.moonNakshatra}`);
  lines.push(`TRANSIT DATA: current gochar positions are NOT included in this context. Do not assume or invent current transit positions.`);

  lines.push('');
  lines.push('PLANETS (with house, sign, nakshatra, dignity):');
  for (const p of k.planets) {
    if (PLANET_SKIP.has(p.key)) continue;
    lines.push(`- ${planetSummary(p)}`);
  }

  lines.push('');
  lines.push('HOUSES (whole-sign; shows sign, lord, occupants):');
  const relevant = plan?.requiredBhavas?.length
    ? Array.from(new Set([1, ...plan.requiredBhavas]))
    : undefined;
  for (const h of k.houses) {
    if (relevant && !relevant.includes(h.houseNumber)) continue;
    const occupants = h.planets
      .filter((p) => p.key !== 'Ascendant')
      .map((p) => p.key)
      .join(', ');
    lines.push(`- H${h.houseNumber}: ${h.signName} (${h.rashiName}), lord ${h.rashiLord}; occupants: ${occupants || '—'}`);
  }

  const includeDasha =
    !plan ||
    plan.timingRequired ||
    plan.requiredModules.includes('analyze_dasha');
  if (includeDasha) {
    const d = k.dasha;
    lines.push('');
    lines.push('VIMSHOTTARI DASHA:');
    lines.push(`- Birth nakshatra: ${d.birthNakshatra}, balance: ${d.dashaBalance}`);
    if (d.currentMaha) {
      lines.push(`- Current Mahadasha: ${d.currentMaha.lord} (${d.currentMaha.startStr} → ${d.currentMaha.endStr})`);
    }
    if (d.currentAntar) {
      lines.push(`- Current Antardasha: ${d.currentAntar.lord} (${d.currentAntar.startStr} → ${d.currentAntar.endStr})`);
    }
    if (d.mahaDasas.length) {
      lines.push(`- Full Mahadasha cycle: ${d.mahaDasas.map((m) => `${m.lord} (${m.startStr}→${m.endStr})`).join('; ')}`);
    }
  }

  const includeVarga =
    !plan || plan.requiredModules.includes('check_varga');
  if (includeVarga && k.navamsa) {
    lines.push('');
    lines.push('NAVAMSA (D9):');
    lines.push(`- D9 Ascendant: ${k.navamsa.ascendant.signName}`);
    for (const key of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const) {
      const p = k.navamsa.planets[key];
      if (p) {
        lines.push(`- ${key}: ${p.signName}, nakshatra ${p.nakshatraName} (${p.nakshatraLord}, pada ${p.pada})`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Reduce conversation history to what a module/synthesis actually needs:
 * the latest question, the most recent assistant answer, and at most a couple
 * of compact prior turns. Never forwards the full history to every call.
 */
export function buildConversationContext(
  conversation?: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTurns = 3
): string {
  if (!conversation || !conversation.length) return '';
  const recent = conversation
    .filter((m) => m.content.trim())
    .slice(-maxTurns)
    .map((m) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content.trim()}`)
    .join('\n');
  return recent
    ? `PREVIOUS CONVERSATION (recent only):\n${recent}`
    : '';
}

export { kundliToContext } from '../chat';