import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { getPanchang, type PanchangData } from '../lib/panchang';
import {
  computeUpcomingIngresses,
  computeIngressesBetween,
} from '../lib/transits';
import { formatTime } from '../lib/constants';
import RasiChart from '../components/RasiChart';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

const PLANET_ICONS: Record<string, string> = {
  Sun: '/astro_icons/planets/Sun.svg', Moon: '/astro_icons/planets/Moon.svg',
  Mars: '/astro_icons/planets/Mars.svg', Mercury: '/astro_icons/planets/Mercury.svg',
  Jupiter: '/astro_icons/planets/Jupiter.svg', Venus: '/astro_icons/planets/Venus.svg',
  Saturn: '/astro_icons/planets/Saturn.svg', Rahu: '/astro_icons/planets/Rahu.svg',
  Ketu: '/astro_icons/planets/Ketu.svg',
};

const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

interface TransitEvent {
  planet: string;
  fromSign: number;
  fromSignName: string;
  toSign: number;
  toSignName: string;
  ingressTime: Date;
  transitDate: string;
  transitTime: string | null;
  daysAway: number;
}

const PLANET_ORDER = ['Moon', 'Mercury', 'Venus', 'Sun', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'];

function formatDateStr(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function startOfDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function signToHouse(signIndex: number, ascendantSign: number): number {
  return ((signIndex - (ascendantSign - 1) + 12) % 12) + 1;
}

export default function TransitsPage() {
  const { lang, location, selectedDate } = useApp();
  const { tr } = useI18n(lang);
  const [data, setData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const d = new Date(`${selectedDate}T00:00:00`);
    const result = getPanchang(d, location.lat, location.lon);
    setData(result);
    setLoading(false);
  }, [selectedDate, location]);

  const transits = useMemo(() => {
    if (!data?.planetPositions) return [];
    const base = new Date(`${selectedDate}T00:00:00`);

    const ingresses = computeUpcomingIngresses(base);

    const events: TransitEvent[] = ingresses.map(ingress => ({
      planet: ingress.planet,
      fromSign: ingress.fromSign,
      fromSignName: SIGN_NAMES[ingress.fromSign] ?? '',
      toSign: ingress.toSign,
      toSignName: SIGN_NAMES[ingress.toSign] ?? '',
      ingressTime: ingress.ingressTime,
      transitDate: formatDateStr(ingress.ingressTime),
      transitTime: formatTime(ingress.ingressTime),
      daysAway: Math.round((startOfDayMs(ingress.ingressTime) - startOfDayMs(base)) / 86_400_000),
    }));

    events.sort((a, b) => {
      if (a.ingressTime.getTime() !== b.ingressTime.getTime()) {
        return a.ingressTime.getTime() - b.ingressTime.getTime();
      }
      return PLANET_ORDER.indexOf(a.planet) - PLANET_ORDER.indexOf(b.planet);
    });

    return events;
  }, [data, selectedDate]);

  const selectedParts = useMemo(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return { year: y ?? new Date().getFullYear(), month: (m ?? 1) - 1 };
  }, [selectedDate]);

  const [viewMonth, setViewMonth] = useState(selectedParts);

  const changeMonth = (delta: number) => {
    setViewMonth(prev => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const monthStart = useMemo(() => new Date(viewMonth.year, viewMonth.month, 1), [viewMonth]);
  const monthEnd = useMemo(
    () => new Date(viewMonth.year, viewMonth.month + 1, 1),
    [viewMonth]
  );

  const monthTransits = useMemo(() => {
    const events: TransitEvent[] = computeIngressesBetween(monthStart, monthEnd).map(ingress => ({
      planet: ingress.planet,
      fromSign: ingress.fromSign,
      fromSignName: SIGN_NAMES[ingress.fromSign] ?? '',
      toSign: ingress.toSign,
      toSignName: SIGN_NAMES[ingress.toSign] ?? '',
      ingressTime: ingress.ingressTime,
      transitDate: formatDateStr(ingress.ingressTime),
      transitTime: formatTime(ingress.ingressTime),
      daysAway: Math.round((startOfDayMs(ingress.ingressTime) - startOfDayMs(new Date())) / 86_400_000),
    }));
    events.sort((a, b) => {
      if (a.ingressTime.getTime() !== b.ingressTime.getTime()) {
        return a.ingressTime.getTime() - b.ingressTime.getTime();
      }
      return PLANET_ORDER.indexOf(a.planet) - PLANET_ORDER.indexOf(b.planet);
    });
    return events;
  }, [monthStart, monthEnd]);

  const monthLabel = monthStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  if (loading || !data) {
    return (
      <div className="scroll-area" style={{ padding: '16px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card shimmer" style={{ height: '100px' }} />
        ))}
      </div>
    );
  }

  const ascendantSign = (data.planetPositions?.Sun?.sign ?? 0) + 1;

  const renderTransitRow = (transit: TransitEvent, isLast: boolean) => (
    <div key={`${transit.planet}-${transit.ingressTime.getTime()}`} style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '8px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <img
        src={PLANET_ICONS[transit.planet] ?? ''}
        alt={transit.planet}
        width={26}
        height={26}
        style={{ flexShrink: 0 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '13px' }}>{transit.planet}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          {transit.fromSignName} &rarr; {transit.toSignName}
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>
        <div>{formatShortDate(transit.ingressTime)}{transit.transitTime ? `, ${transit.transitTime}` : ''}</div>
        {transit.daysAway === 0 && <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{tr('today')}</div>}
        {transit.daysAway === 1 && <div>{tr('tomorrow')}</div>}
        {transit.daysAway > 1 && <div style={{ color: 'var(--text-muted)' }}>({transit.daysAway}d)</div>}
      </div>
    </div>
  );

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      {/* Next ingress per planet */}
      {transits.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
          {tr('noTransits')}
        </div>
      ) : (
        transits.map((transit, i) => {
          const fromHouse = signToHouse(transit.fromSign, ascendantSign);
          const toHouse = signToHouse(transit.toSign, ascendantSign);
          const isToday = transit.daysAway === 0;
          const isTomorrow = transit.daysAway === 1;

          return (
            <div key={i} className="card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <img
                  src={PLANET_ICONS[transit.planet] ?? ''}
                  alt={transit.planet}
                  width={36}
                  height={36}
                  style={{ flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{transit.planet}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {transit.fromSignName} &rarr; {transit.toSignName}
                  </div>
                </div>
                {isToday && (
                  <span style={{
                    background: 'var(--gold)', color: '#fff', padding: '2px 10px',
                    borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  }}>
                    {tr('today')}
                  </span>
                )}
                {isTomorrow && (
                  <span style={{
                    background: 'var(--gold-light)', color: 'var(--olive)', padding: '2px 10px',
                    borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  }}>
                    {tr('tomorrow')}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>{transit.transitDate}{transit.transitTime ? `, ${transit.transitTime}` : ''}</span>
                {transit.daysAway > 1 && <span>({transit.daysAway} days away)</span>}
              </div>

              <RasiChart
                planets={data.planetPositions}
                ascendantSign={ascendantSign}
                showHeader={false}
                highlightPlanet={transit.planet}
                planetDisplay="initials"
                transitMode={{
                  fromHouse,
                  toHouse,
                  transitDate: transit.transitDate,
                }}
              />
            </div>
          );
        })
      )}

      {/* Month-by-month transit browser */}
      <div className="card" style={{ padding: '12px' }}>
        <div className="card-title">{monthLabel}</div>
        {monthTransits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            {tr('noTransits')}
          </div>
        ) : (
          monthTransits.map((t, i) => renderTransitRow(t, i === monthTransits.length - 1))
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          <button
            className="date-nav-btn"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            <MdChevronLeft size={24} />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {monthLabel}
          </span>
          <button
            className="date-nav-btn"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
          >
            <MdChevronRight size={24} />
          </button>
        </div>
      </div>

      <div style={{ height: '80px' }} />
    </div>
  );
}
