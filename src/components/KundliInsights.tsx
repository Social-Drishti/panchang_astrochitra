import { useMemo } from 'react';
import type { KundliInsights } from '../lib/kundli';
import type { KundliData } from '../lib/kundli';
import { DisplayCard } from './KundliView';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../App';
import { useI18n } from '../i18n';
import { formatDegMin } from './KundliView';
import { RASHI_NAME } from '../lib/kundli';
import { getGrahaByName } from '../lib/insights/grahas';

interface Props {
  data: KundliInsights | undefined;
  kundli: KundliData | undefined;
}

function paragraph(text: string) {
  return <p style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: 1.6, margin: 0 }}>{text}</p>;
}

function chip(text: string) {
  return <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: 'var(--gold-light)', color: 'var(--olive)', marginRight: '4px' }}>{text}</span>;
}

function ordinal(n: number) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return n + 'th';
  switch (n % 10) {
    case 1: return n + 'st';
    case 2: return n + 'nd';
    case 3: return n + 'rd';
    default: return n + 'th';
  }
}

function firstSentence(text: string) {
  const idx = text.indexOf('.');
  return idx > 0 ? text.slice(0, idx + 1).trim() : text.trim();
}

function planetNameFromLord(lord?: string) {
  if (!lord) return '';
  const idx = lord.indexOf('(');
  return idx > 0 ? lord.slice(0, idx).trim() : lord.trim();
}

export default function KundliInsights({ data, kundli }: Props) {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  const { navigate } = useNavigation();

  if (!data || !kundli) {
    return (
      <DisplayCard title={tr('insights')}>
        <p style={{ fontSize: '13px', color: 'var(--card-text-2)', textAlign: 'center', padding: '20px' }}>
          Insights not available for this chart. Generate a new chart to see detailed interpretations.
        </p>
      </DisplayCard>
    );
  }

  // Ascendant basics
  const ascSign = kundli.ascendantSignName;
  const ascSanskrit = kundli.ascendantRashiName;
  const ascDegree = formatDegMin(kundli.lagna.longitude % 30);
  const ascNak = kundli.lagna.nakshatraName;
  const ascPada = kundli.lagna.pada;

  // Moon basics
  const moonSign = kundli.moonSignName;
  const moonSanskrit = RASHI_NAME[moonSign] || '';
  const moonDeg = kundli.planets.find(p => p.key === 'Moon')?.normDegree ?? 0;
  const moonDegree = formatDegMin(moonDeg);
  const moonNak = kundli.moonNakshatra;
  const moonPada = kundli.planets.find(p => p.key === 'Moon')?.nakshatraPada ?? 1;

  // Ascendant ruler karakatva
  const ascLordName = data.ascendant.rashi?.lord ? planetNameFromLord(data.ascendant.rashi.lord) : '';
  const ascLordGraha = ascLordName ? getGrahaByName(ascLordName) : null;
  const ascLordKarakatva = ascLordGraha?.karakatva;

  return (
    <>
      {/* Ascendant Card */}
      <DisplayCard title={tr('ascendant')}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--card-gold)' }}>
            {ascSign} {ascSanskrit && `(${ascSanskrit})`}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--card-text-2)', marginTop: '4px' }}>
            {ascDegree} · {ascNak} · Pada {ascPada}
          </div>
        </div>

        {data.ascendant.generic && paragraph(data.ascendant.generic)}

        {data.ascendant.rashi && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--card-gold)', marginBottom: '4px' }}>
              {data.ascendant.rashi.name}{' '}
              {data.ascendant.rashi.lord && chip(`${data.ascendant.rashi.lord}`)}
              {data.ascendant.rashi.element && chip(data.ascendant.rashi.element)}
              {data.ascendant.rashi.nature && chip(data.ascendant.rashi.nature)}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: 1.6, margin: 0 }}>
              {data.ascendant.rashi.traits}
            </p>
          </div>
        )}

        {ascLordKarakatva && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--card-gold)', marginBottom: '4px' }}>
              Ascendant Ruler — Karakatva
            </div>
            <p style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: 1.6, margin: 0 }}>
              {ascLordKarakatva}
            </p>
          </div>
        )}

        {data.ascendant.nakshatra && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--card-gold)', marginBottom: '4px' }}>
              {data.ascendant.nakshatra.name} — {data.ascendant.nakshatra.lord}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: 1.6, margin: 0 }}>
              {data.ascendant.nakshatra.traits}
            </p>
          </div>
        )}
      </DisplayCard>

      {/* Moon Sign Card */}
      <DisplayCard title={tr('moonSign')}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--card-gold)' }}>
            {moonSign} {moonSanskrit && `(${moonSanskrit})`}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--card-text-2)', marginTop: '4px' }}>
            {moonDegree} · {moonNak} · Pada {moonPada}
          </div>
        </div>

        {data.moon.generic && paragraph(data.moon.generic)}

        {data.moon.rashi && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--card-gold)', marginBottom: '4px' }}>
              {data.moon.rashi.name}{' '}
              {data.moon.rashi.lord && chip(`${data.moon.rashi.lord}`)}
              {data.moon.rashi.element && chip(data.moon.rashi.element)}
              {data.moon.rashi.nature && chip(data.moon.rashi.nature)}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: 1.6, margin: 0 }}>
              {data.moon.rashi.traits}
            </p>
          </div>
        )}

        {data.moon.karakatva && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--card-gold)', marginBottom: '4px' }}>
              Moon — Karakatva
            </div>
            <p style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: 1.6, margin: 0 }}>
              {data.moon.karakatva}
            </p>
          </div>
        )}

        {data.moon.nakshatra && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--card-gold)', marginBottom: '4px' }}>
              {data.moon.nakshatra.name} — {data.moon.nakshatra.lord}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: 1.6, margin: 0 }}>
              {data.moon.nakshatra.traits}
            </p>
          </div>
        )}
      </DisplayCard>

      {/* Consultation Prompt */}
      <DisplayCard title="Consultation">
        <p style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: 1.6, marginBottom: '12px' }}>
          To know what does {ascSign} Lagna and {moonSign} Rashi combination means, book a consultation.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('consultation')} style={{ width: '100%' }}>
          Book Consultation
        </button>
      </DisplayCard>
    </>
  );
}