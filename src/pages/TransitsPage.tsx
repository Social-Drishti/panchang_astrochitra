import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { getPanchang, type PanchangData } from '../lib/panchang';
import RasiChart from '../components/RasiChart';

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

// Average days per sign for each planet
const PLANET_SPEED_DAYS: Record<string, number> = {
  Sun: 30.44, Moon: 2.3, Mars: 45, Mercury: 24, Jupiter: 365,
  Venus: 25, Saturn: 730, Rahu: 540, Ketu: 540,
};

interface TransitEvent {
  planet: string;
  fromSign: number;
  fromSignName: string;
  toSign: number;
  toSignName: string;
  transitDate: string;
  daysAway: number;
}

const PLANET_ORDER = ['Moon', 'Mercury', 'Venus', 'Sun', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'];

function formatDateStr(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function signToHouse(signIndex: number, ascendantSign: number): number {
  return ((signIndex - (ascendantSign - 1) + 12) % 12) + 1;
}

export default function TransitsPage() {
  const { lang, location } = useApp();
  const { tr } = useI18n(lang);
  const [data, setData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const today = new Date();
    const result = getPanchang(today, location.lat, location.lon);
    setData(result);
    setLoading(false);
  }, [location]);

  const transits = useMemo(() => {
    if (!data?.planetPositions) return [];
    const events: TransitEvent[] = [];
    const now = new Date();

    Object.entries(data.planetPositions).forEach(([name, pos]) => {
      if (!pos) return;
      const fromSign = pos.sign;
      const toSign = (pos.sign + 1) % 12;
      const degInSign = pos.degree;
      const degRemaining = 30 - degInSign;
      const speedDays = PLANET_SPEED_DAYS[name] ?? 30;
      const daysUntil = Math.round((degRemaining / 30) * speedDays);

      const transitDate = new Date(now);
      transitDate.setDate(transitDate.getDate() + daysUntil);

      events.push({
        planet: name,
        fromSign,
        fromSignName: SIGN_NAMES[fromSign] ?? '',
        toSign,
        toSignName: SIGN_NAMES[toSign] ?? '',
        transitDate: formatDateStr(transitDate),
        daysAway: daysUntil,
      });
    });

    events.sort((a, b) => a.daysAway - b.daysAway);

    // Re-sort by planet order for same day
    events.sort((a, b) => {
      if (a.daysAway !== b.daysAway) return a.daysAway - b.daysAway;
      return PLANET_ORDER.indexOf(a.planet) - PLANET_ORDER.indexOf(b.planet);
    });

    return events;
  }, [data]);

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

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
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
                <span>{transit.transitDate}</span>
                {transit.daysAway > 1 && <span>({transit.daysAway} days away)</span>}
              </div>

              <RasiChart
                planets={data.planetPositions}
                ascendantSign={ascendantSign}
                showHeader={false}
                highlightPlanet={transit.planet}
                transitMode={{
                  fromHouse,
                  toHouse,
                  transitDate: transit.transitDate,
                }}
                // size={220}
              />
            </div>
          );
        })
      )}

      <div style={{ height: '80px' }} />
    </div>
  );
}
