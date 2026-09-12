import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import {
  getLivePositions,
  computeUpcomingIngresses,
  computeIngressesBetween,
  type SignIngress,
} from '../lib/transits';
import { formatDate, formatTime } from '../lib/constants';
import RasiChart from '../components/RasiChart';
import {
  MdPublic,
  MdTrendingUp,
  MdCalendarMonth,
  MdChevronLeft,
  MdChevronRight,
} from 'react-icons/md';

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

const PLANET_ICONS: Record<string, string> = {
  Sun: '/astro_icons/planets/Sun.svg',
  Moon: '/astro_icons/planets/Moon.svg',
  Mars: '/astro_icons/planets/Mars.svg',
  Mercury: '/astro_icons/planets/Mercury.svg',
  Jupiter: '/astro_icons/planets/Jupiter.svg',
  Venus: '/astro_icons/planets/Venus.svg',
  Saturn: '/astro_icons/planets/Saturn.svg',
  Rahu: '/astro_icons/planets/Rahu.svg',
  Ketu: '/astro_icons/planets/Ketu.svg',
};

function formatDegMin(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}′`;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function startOfDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function GocharPage() {
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

  const nextIngress = useMemo(() => {
    const list = computeUpcomingIngresses(now);
    const map: Record<string, SignIngress> = {};
    list.forEach(ing => { map[ing.planet] = ing; });
    return { list, map };
  }, [now]);

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

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const changeMonth = (delta: number) => {
    setViewMonth(prev => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const monthStart = useMemo(() => new Date(viewMonth.year, viewMonth.month, 1), [viewMonth]);
  const monthEnd = useMemo(() => new Date(viewMonth.year, viewMonth.month + 1, 1), [viewMonth]);

  const monthTransits = useMemo(
    () => computeIngressesBetween(monthStart, monthEnd),
    [monthStart, monthEnd]
  );

  const monthLabel = monthStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const todayMs = startOfDayMs(now);

  const renderTransitRow = (ingress: SignIngress, isLast: boolean) => {
    const fromName = SIGN_NAMES[ingress.fromSign]?.[langIdx] ?? '';
    const toName = SIGN_NAMES[ingress.toSign]?.[langIdx] ?? '';
    const daysAway = Math.round((startOfDayMs(ingress.ingressTime) - todayMs) / 86_400_000);
    const time = formatTime(ingress.ingressTime);
    return (
      <div
        key={`${ingress.planet}-${ingress.ingressTime.getTime()}`}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 0', borderBottom: isLast ? 'none' : '1px solid var(--card-line)',
        }}
      >
        <img
          src={PLANET_ICONS[ingress.planet] ?? ''}
          alt={ingress.planet}
          width={28}
          height={28}
          style={{ flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '13px' }}>{PLANET_NAMES[ingress.planet]?.[langIdx] ?? ingress.planet}</div>
          <div style={{ fontSize: '11px', color: 'var(--card-text-2)' }}>
            {fromName} → {toName}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--card-text-2)' }}>
          <div>{formatShortDate(ingress.ingressTime)}{time ? `, ${time}` : ''}</div>
          {daysAway === 0 && <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{tr('today')}</div>}
          {daysAway === 1 && <div>{tr('tomorrow')}</div>}
          {daysAway > 1 && <div style={{ color: 'var(--card-text-3)' }}>({daysAway}d)</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      {/* Live clock header */}
      <div className="date-nav">
        <span className="date-nav-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdPublic size={20} color="var(--gold)" />
          {formatDate(now, lang)}{formatTime(now) ? ` · ${formatTime(now)}` : ''}
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--gold)', background: 'var(--gold-light)', padding: '2px 8px', borderRadius: '10px' }}>
            LIVE
          </span>
        </span>
      </div>

      {/* Live Gochar chart */}
      <div className="card" style={{ padding: '8px' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <MdPublic size={20} color="var(--gold)" />
          {tr('gochar')}
        </div>
        <RasiChart
          planets={positions}
          houseData={houseData}
          ascendantSign={ascendantSign}
          planetDisplay="initials"
        />
      </div>

      {/* Current planet positions */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdTrendingUp size={20} color="var(--gold)" />
          {tr('planets')}
        </div>
        {Object.entries(positions).map(([name, pos], idx, arr) => {
          const names = PLANET_NAMES[name];
          const signName = SIGN_NAMES[pos.sign]?.[langIdx] ?? `Sign ${pos.sign}`;
          const ingress = nextIngress.map[name];
          const ingressTime = ingress ? formatTime(ingress.ingressTime) : null;
          return (
            <div key={name} style={{ padding: '10px 0', borderBottom: idx < arr.length - 1 ? '1px solid var(--card-line)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{names?.[langIdx] ?? name}</span>
                  {lang !== 'en' && <span style={{ fontSize: '12px', color: 'var(--card-text-3)', marginLeft: '8px' }}>({names?.[0] ?? name})</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 500 }}>
                    {signName}{pos.isRetrograde && <span style={{ fontSize: '11px', color: 'var(--gold)', marginLeft: '4px' }}> (R)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--card-text-2)' }}>{formatDegMin(pos.degree)}</div>
                </div>
              </div>
              {ingress && (
                <div style={{ fontSize: '11px', color: 'var(--card-text-3)', marginTop: '6px', textAlign: 'right' }}>
                  {tr('nextSignChange')}: → {SIGN_NAMES[ingress.toSign]?.[langIdx] ?? ''} · {formatShortDate(ingress.ingressTime)}{ingressTime ? `, ${ingressTime}` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming transits — next sign change per planet */}
      <div className="card" style={{ padding: '12px' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdTrendingUp size={20} color="var(--gold)" />
          {tr('planetaryTransits')}
        </div>
        {nextIngress.list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--card-text-3)' }}>
            <MdTrendingUp size={32} color="var(--card-text-3)" style={{ marginBottom: '8px' }} />
            {tr('noTransits')}
          </div>
        ) : (
          nextIngress.list.map((ingress, i) => renderTransitRow(ingress, i === nextIngress.list.length - 1))
        )}
      </div>

      {/* Month-by-month transit browser */}
      <div className="card" style={{ padding: '12px' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdCalendarMonth size={20} color="var(--gold)" />
          {monthLabel}
        </div>
        {monthTransits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--card-text-3)' }}>
            <MdTrendingUp size={32} color="var(--card-text-3)" style={{ marginBottom: '8px' }} />
            {tr('noTransits')}
          </div>
        ) : (
          monthTransits.map((t, i) => renderTransitRow(t, i === monthTransits.length - 1))
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          <button className="date-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">
            <MdChevronLeft size={24} />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--card-text-2)' }}>
            {monthLabel}
          </span>
          <button className="date-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">
            <MdChevronRight size={24} />
          </button>
        </div>
      </div>

      <div style={{ height: '80px' }} />
    </div>
  );
}
