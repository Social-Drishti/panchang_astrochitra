import { useMemo } from 'react';

interface ChartPlanet {
  key: string;
  houseNumber: number;
  isRetro: boolean;
}

interface KundliChartProps {
  houseData: { houseNumber: number; planets: ChartPlanet[] }[];
  ascendantSign: number;
  selectedHouse?: number | null;
  onHouseClick?: (house: number) => void;
  size?: number;

}

const ENGLISH_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const RASHI_LORDS: Record<string, string> = {
  Aries: 'Ma', Taurus: 'Ve', Gemini: 'Me', Cancer: 'Mo',
  Leo: 'Su', Virgo: 'Me', Libra: 'Ve', Scorpio: 'Ma',
  Sagittarius: 'Ju', Capricorn: 'Sa', Aquarius: 'Sa', Pisces: 'Ju',
};

const PLANET_ABBREV: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
  Ascendant: 'Asc',
};

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D2691E', Moon: '#4682B4', Mars: '#B22222', Mercury: '#2E8B57',
  Jupiter: '#B8860B', Venus: '#C71585', Saturn: '#4169E1',
  Rahu: '#2F4F4F', Ketu: '#8B4513', Ascendant: '#8B0000',
};

const STROKE = '#c2410c';
const FILL = '#ffffff';
const FILL_LIGHT = '#fbf7f0';
const ACCENT = '#8e2a1c';
const TEXT_MUTED = '#6b6253';
const SEL_FILL = 'rgba(194,65,12,0.18)';
const HOVER_FILL = 'rgba(194,65,12,0.08)';

const NORTH_PATHS: Record<number, string> = {
  1: 'M 150 0 L 225 75 L 150 150 L 75 75 Z',
  2: 'M 0 0 L 150 0 L 75 75 Z',
  3: 'M 0 0 L 75 75 L 0 150 Z',
  4: 'M 0 150 L 75 75 L 150 150 L 75 225 Z',
  5: 'M 0 150 L 75 225 L 0 300 Z',
  6: 'M 0 300 L 75 225 L 150 300 Z',
  7: 'M 150 150 L 225 225 L 150 300 L 75 225 Z',
  8: 'M 150 300 L 225 225 L 300 300 Z',
  9: 'M 300 300 L 225 225 L 300 150 Z',
  10: 'M 150 150 L 225 75 L 300 150 L 225 225 Z',
  11: 'M 300 150 L 225 75 L 300 0 Z',
  12: 'M 150 0 L 300 0 L 225 75 Z',
};

const TRIANGLE_HOUSES = [2, 3, 5, 6, 8, 9, 11, 12];

export default function KundliChart({
  houseData,
  ascendantSign,
  selectedHouse,
  onHouseClick,
  size = 300,
}: KundliChartProps) {
  const houseRefs = useMemo(() => {
    const refs: Record<number, { x: number; y: number }> = {};
    for (let i = 1; i <= 12; i++) {
      const path = NORTH_PATHS[i] ?? '';
      if (!path) continue;
      const coords = path
        .replace(/[MLZ]/g, ' ')
        .trim()
        .split(/\s+/)
        .map(Number);
      let sx = 0, sy = 0, count = 0;
      for (let j = 0; j + 1 < coords.length; j += 2) {
        sx += coords[j]!;
        sy += coords[j + 1]!;
        count++;
      }
      if (count > 0) refs[i] = { x: sx / count, y: sy / count };
    }
    return refs;
  }, []);

  const chartHouses = useMemo(() => {
    const result: {
      houseNumber: number; signNumber: number; signName: string;
      rashiLord: string; planets: ChartPlanet[];
    }[] = [];
    for (let i = 1; i <= 12; i++) {
      const signNumber = ((ascendantSign - 1 + (i - 1)) % 12) + 1;
      const signName = ENGLISH_SIGNS[signNumber - 1] ?? '';
      result.push({
        houseNumber: i,
        signNumber,
        signName,
        rashiLord: RASHI_LORDS[signName] || '',
        planets: houseData.find(h => h.houseNumber === i)?.planets || [],
      });
    }
    return result;
  }, [houseData, ascendantSign]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '8px' }}>
      <svg
        viewBox="0 0 300 300"
        style={{
          width: '100%',
          height: 'auto',
          background: `linear-gradient(135deg, ${FILL_LIGHT} 0%, ${FILL} 100%)`,
          border: `3px double ${STROKE}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          display: 'block',
          maxWidth: `${size}px`,
        }}
        role="img"
        aria-label="North Indian kundli chart - tap a house for details"
      >
        {/* Structure lines */}
        <g stroke={STROKE} strokeWidth="2" fill="none">
          <rect x="2" y="2" width="296" height="296" />
          <line x1="0" y1="0" x2="300" y2="300" />
          <line x1="300" y1="0" x2="0" y2="300" />
          <line x1="150" y1="0" x2="300" y2="150" />
          <line x1="300" y1="150" x2="150" y2="300" />
          <line x1="150" y1="300" x2="0" y2="150" />
          <line x1="0" y1="150" x2="150" y2="0" />
          <line x1="75" y1="75" x2="0" y2="0" />
          <line x1="225" y1="75" x2="300" y2="0" />
          <line x1="75" y1="225" x2="0" y2="300" />
          <line x1="225" y1="225" x2="300" y2="300" />
        </g>

        {chartHouses.map(house => {
          const c = houseRefs[house.houseNumber];
          if (!c) return null;
          const isTri = TRIANGLE_HOUSES.includes(house.houseNumber);
          const isAsc = house.houseNumber === 1;
          const isSel = selectedHouse === house.houseNumber;
          const signFont = isTri ? 11 : 15;
          const rashiFont = isTri ? 8 : 10;
          const planetFont = isTri ? 8 : 11;
          const planetSpacing = isTri ? 22 : 26;
          const planetLH = isTri ? 11 : 14;
          const maxPlanetsPerRow = isTri ? 2 : 3;

          const rashiY = c.y - (isTri ? 16 : 26);
          const signX = c.x - (isTri ? 14 : 18);
          const signY = c.y - (isTri ? 20 : 32);
          const rashiX = c.x + (isTri ? 10 : 12);
          const rashiY2 = rashiY + (isTri ? 14 : 20);
          const planetsBaseY = rashiY2 + (isTri ? 22 : 30);

          const cols = Math.min(Math.max(house.planets.length, 1), maxPlanetsPerRow);
          const totalW = (cols - 1) * planetSpacing;

          return (
            <g
              key={`h-${house.houseNumber}`}
              onClick={() => onHouseClick?.(house.houseNumber)}
              style={{ cursor: onHouseClick ? 'pointer' : 'default' }}
            >
              {/* Clickable hit area */}
              <path
                d={NORTH_PATHS[house.houseNumber]}
                fill={isSel ? SEL_FILL : isAsc ? 'rgba(245,166,35,0.12)' : 'transparent'}
                fillOpacity={isSel || isAsc ? 1 : 0.001}
                style={{ pointerEvents: 'all' }}
              >
                <title>{`House ${house.houseNumber} Â· ${house.signName} Â· lord ${house.rashiLord}`}</title>
              </path>

              {/* Sign number + rashi name */}
              <text
                x={signX} y={signY}
                textAnchor="middle" dominantBaseline="middle"
                fill={isAsc ? ACCENT : '#2c1f04'}
                fontSize={signFont} fontWeight={800}
                fontFamily="Georgia, serif"
                paintOrder="stroke fill" stroke="rgba(255,251,230,0.95)" strokeWidth="2.5px"
                style={{ pointerEvents: 'none' }}
              >
                {house.signNumber}
              </text>
              <text
                x={rashiX} y={rashiY2}
                textAnchor="middle" dominantBaseline="middle"
                fill={TEXT_MUTED}
                fontSize={rashiFont} fontWeight={700}
                fontFamily="Georgia, serif"
                paintOrder="stroke fill" stroke="rgba(255,251,230,0.95)" strokeWidth="2.5px"
                style={{ pointerEvents: 'none' }}
              >
                {house.signName}
              </text>

              {/* Planets */}
              {house.planets.map((planet, idx) => {
                const row = Math.floor(idx / cols);
                const col = idx % cols;
                const offX = col * planetSpacing - totalW / 2;
                const pY = planetsBaseY + row * planetLH;
                const colr = PLANET_COLORS[planet.key] || '#2c1f04';
                const abbr = PLANET_ABBREV[planet.key] || planet.key.substring(0, 2);
                const retro = planet.isRetro ? 'R' : '';
                return (
                  <text
                    key={`${planet.key}-${house.houseNumber}`}
                    x={c.x + offX} y={pY}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={colr} fontSize={planetFont} fontWeight={800}
                    fontFamily="Georgia, serif"
                    paintOrder="stroke fill" stroke="rgba(255,251,230,0.95)" strokeWidth="3px"
                    style={{ pointerEvents: 'none' }}
                  >
                    {abbr}{retro}
                  </text>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
