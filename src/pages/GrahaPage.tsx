import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { getPanchang, type PanchangData } from '../lib/panchang';
import { formatDate } from '../lib/constants';
import RasiChart from '../components/RasiChart';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

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

export default function GrahaPage() {
  const { lang, location, selectedDate, setSelectedDate } = useApp();
  const { tr } = useI18n(lang);
  const [data, setData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const d = new Date(selectedDate + 'T00:00:00');
    const result = getPanchang(d, location.lat, location.lon);
    setData(result);
    setLoading(false);
  }, [selectedDate, location]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  if (loading || !data) {
    return (
      <div className="scroll-area" style={{ padding: '16px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card shimmer" style={{ height: '80px' }} />
        ))}
      </div>
    );
  }

  const langIdx = lang === 'en' ? 0 : lang === 'hi' ? 1 : 2;
  const planets = data.planetPositions ?? {};

  const ascendantSign = (planets.Sun?.sign ?? 0) + 1;

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      <div className="date-nav">
        <button className="date-nav-btn" onClick={() => changeDate(-1)}><MdChevronLeft size={24} /></button>
        <span className="date-nav-label">{formatDate(new Date(selectedDate + 'T00:00:00'), lang)}</span>
        <button className="date-nav-btn" onClick={() => changeDate(1)}><MdChevronRight size={24} /></button>
      </div>

      {/* Kundli Chart */}
      <div className="card" style={{ padding: '8px' }}>
        <RasiChart planets={planets} ascendantSign={ascendantSign} />
      </div>

      {/* Planet positions list */}
      <div className="card">
        <div className="card-title">{tr('planets')}</div>
        {Object.entries(planets).map(([name, pos]) => {
          if (!pos) return null;
          const names = PLANET_NAMES[name];
          const signName = SIGN_NAMES[pos.sign]?.[langIdx] ?? `Sign ${pos.sign}`;
          const deg = pos.degree.toFixed(1);
          return (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{names?.[langIdx] ?? name}</span>
                {lang !== 'en' && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>({names?.[0] ?? name})</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{signName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{deg}°</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: '80px' }} />
    </div>
  );
}
