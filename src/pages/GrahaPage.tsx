import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { getLivePositions, findNextSignIngress, type SignIngress } from '../lib/transits';
import { formatDate, formatTime } from '../lib/constants';
import RasiChart from '../components/RasiChart';

const PLANET_NAMES: Record<string, [string, string, string]> = {
  Sun: ['Sun', 'सूर्य', 'सूर्य'],
  Moon: ['Moon', 'चंद्र', 'चंद्र'],
  Mars: ['Mars', 'मंगल', 'मंगळ'],
  Mercury: ['Mercury', 'बुध', 'बुध'],
  Jupiter: ['Jupiter', 'गुरु', 'गुरु'],
  Venus: ['Venus', 'शुक्र', 'शुक्र'],
  Saturn: ['Saturn', 'शनि', 'शनि'],
  Rahu: ['Rahu', 'राहु', 'राहु'],
  Ketu: ['Ketu', 'केतु', 'केतु'],
};

const SIGN_NAMES: [string, string, string][] = [
  ['Aries', 'मेष', 'मेष'],
  ['Taurus', 'वृष', 'वृषभ'],
  ['Gemini', 'मिथुन', 'मिथुन'],
  ['Cancer', 'कर्क', 'कर्क'],
  ['Leo', 'सिंह', 'सिंह'],
  ['Virgo', 'कन्या', 'कन्या'],
  ['Libra', 'तुला', 'तुला'],
  ['Scorpio', 'वृश्चिक', 'वृश्चिक'],
  ['Sagittarius', 'धनु', 'धनु'],
  ['Capricorn', 'मकर', 'मकर'],
  ['Aquarius', 'कुंभ', 'कुंभ'],
  ['Pisces', 'मीन', 'मीन'],
];

function formatDegMin(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}′`;
}

export default function GrahaPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleTick = () => {
      const msToNextMinute = 60_000 - (Date.now() % 60_000) + 25;
      timeoutId = setTimeout(() => {
        setNow(new Date());
        scheduleTick();
      }, msToNextMinute);
    };
    scheduleTick();
    return () => clearTimeout(timeoutId);
  }, []);

  const positions = useMemo(() => getLivePositions(now), [now]);

  const ingresses = useMemo(() => {
    const map: Record<string, SignIngress> = {};
    Object.keys(positions).forEach(name => {
      const ingress = findNextSignIngress(name, now);
      if (ingress) map[name] = ingress;
    });
    return map;
  }, [positions, now]);

  const langIdx = lang === 'en' ? 0 : lang === 'hi' ? 1 : 2;
  const ascendantSign = (positions.Sun?.sign ?? 0) + 1;

  const houseData = useMemo(() => {
    const houses = Array.from({ length: 12 }, (_, i) => ({
      houseNumber: i + 1,
      planets: [] as { key: string; houseNumber: number; isRetro: boolean }[],
    }));
    Object.entries(positions).forEach(([key, pos]) => {
      const hNum = ((pos.sign - (ascendantSign - 1) + 12) % 12) + 1;
      houses[hNum - 1]?.planets.push({ key, houseNumber: hNum, isRetro: pos.isRetrograde });
    });
    return houses;
  }, [positions, ascendantSign]);

  const formatIngressDate = (d: Date): string =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const currentTime = formatTime(now);

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      {/* Live clock header */}
      <div className="date-nav">
        <span className="date-nav-label">
          {formatDate(now, lang)}{currentTime ? ` \u00b7 ${currentTime}` : ''}
        </span>
      </div>

      {/* Kundli Chart */}
      <div className="card" style={{ padding: '8px' }}>
        <RasiChart
          planets={positions}
          houseData={houseData}
          ascendantSign={ascendantSign}
          planetDisplay="initials"
        />
      </div>

      {/* Planet positions list */}
      <div className="card">
        <div className="card-title">{tr('planets')}</div>
        {Object.entries(positions).map(([name, pos], idx, arr) => {
          const names = PLANET_NAMES[name];
          const signName = SIGN_NAMES[pos.sign]?.[langIdx] ?? `Sign ${pos.sign}`;
          const ingress = ingresses[name];
          const ingressTime = ingress ? formatTime(ingress.ingressTime) : null;
          return (
            <div key={name} style={{ padding: '8px 0', borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{names?.[langIdx] ?? name}</span>
                  {lang !== 'en' && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>({names?.[0] ?? name})</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {signName}{pos.isRetrograde && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}> (R)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDegMin(pos.degree)}</div>
                </div>
              </div>
              {ingress && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                  {tr('nextSignChange')}: &rarr; {SIGN_NAMES[ingress.toSign]?.[langIdx] ?? ''} &middot; {formatIngressDate(ingress.ingressTime)}{ingressTime ? `, ${ingressTime}` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ height: '80px' }} />
    </div>
  );
}
