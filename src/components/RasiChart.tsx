import { useMemo } from 'react';
import type { PlanetPositions } from '../lib/panchang';

interface PlanetData {
  key: string;
  houseNumber: number;
  isRetro: boolean;
}

interface TransitMode {
  fromHouse: number;
  toHouse: number;
  transitDate: string;
}

interface RasiChartProps {
  planets?: PlanetPositions;
  houseData?: { houseNumber: number; planets: PlanetData[] }[];
  ascendantSign?: number;
  layout?: 'north';
  highlightPlanet?: string;
  showHeader?: boolean;
  transitMode?: TransitMode;
  size?: number;
}

const ENGLISH_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: '/astro_icons/signs/Aries.svg', Taurus: '/astro_icons/signs/Taurus.svg',
  Gemini: '/astro_icons/signs/Gemini.svg', Cancer: '/astro_icons/signs/Cancer.svg',
  Leo: '/astro_icons/signs/Leo.svg', Virgo: '/astro_icons/signs/Virgo.svg',
  Libra: '/astro_icons/signs/Libra.svg', Scorpio: '/astro_icons/signs/Scorpio.svg',
  Sagittarius: '/astro_icons/signs/Sagittarius.svg', Capricorn: '/astro_icons/signs/Capricorn.svg',
  Aquarius: '/astro_icons/signs/Aquarius.svg', Pisces: '/astro_icons/signs/Pisces.svg',
};

const RASHI_NAMES: Record<string, string> = {
  Aries: 'Mesh', Taurus: 'Vrish', Gemini: 'Mithun', Cancer: 'Kark',
  Leo: 'Simha', Virgo: 'Kanya', Libra: 'Tula', Scorpio: 'Vrischik',
  Sagittarius: 'Dhanu', Capricorn: 'Makar', Aquarius: 'Kumbh', Pisces: 'Meen',
};

const PLANET_ABBREV: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

const PLANET_ICONS: Record<string, string> = {
  Sun: '/astro_icons/planets/Sun.svg', Moon: '/astro_icons/planets/Moon.svg',
  Mars: '/astro_icons/planets/Mars.svg', Mercury: '/astro_icons/planets/Mercury.svg',
  Jupiter: '/astro_icons/planets/Jupiter.svg', Venus: '/astro_icons/planets/Venus.svg',
  Saturn: '/astro_icons/planets/Saturn.svg', Rahu: '/astro_icons/planets/Rahu.svg',
  Ketu: '/astro_icons/planets/Ketu.svg',
};

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D2691E', Moon: '#4682B4', Mars: '#B22222', Mercury: '#2E8B57',
  Jupiter: '#DAA520', Venus: '#C71585', Saturn: '#4169E1',
  Rahu: '#2F4F4F', Ketu: '#8B4513',
};

const STROKE = '#8b7a3a';
const STROKE_LIGHT = '#a0925a';
const FILL = '#fffbe6';
const FILL_LIGHT = '#ffffff';
const ACCENT = '#f5a623';
const TEXT_MUTED = '#654e12';

// All coordinates in 300x300 viewBox space
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

const NORTH_CENTERS: Record<number, { x: number; y: number }> = {
  1: { x: 150, y: 75 }, 2: { x: 75, y: 25 }, 3: { x: 25, y: 75 },
  4: { x: 75, y: 150 }, 5: { x: 25, y: 225 }, 6: { x: 75, y: 275 },
  7: { x: 150, y: 225 }, 8: { x: 225, y: 275 }, 9: { x: 275, y: 225 },
  10: { x: 225, y: 150 }, 11: { x: 275, y: 75 }, 12: { x: 225, y: 25 },
};

const TRIANGLE_HOUSES = [2, 3, 5, 6, 8, 9, 11, 12];

function getPlanetHouse(planetKey: string, signIndex: number, ascendantSign: number): number {
  return ((signIndex - (ascendantSign - 1) + 12) % 12) + 1;
}

export default function RasiChart({
  planets,
  houseData: externalHouseData,
  ascendantSign = 1,
  highlightPlanet,
  showHeader = true,
  transitMode,
  size = 300,
}: RasiChartProps) {
  const houseData = useMemo(() => {
    if (externalHouseData) return externalHouseData;
    const houses: { houseNumber: number; planets: PlanetData[] }[] = [];
    for (let i = 1; i <= 12; i++) {
      houses.push({ houseNumber: i, planets: [] });
    }
    if (planets) {
      Object.entries(planets).forEach(([key, pos]) => {
        if (!pos) return;
        const hNum = getPlanetHouse(key, pos.sign, ascendantSign);
        const h = houses.find(h => h.houseNumber === hNum);
        if (h) h.planets.push({ key, houseNumber: hNum, isRetro: false });
      });
    }
    return houses;
  }, [planets, externalHouseData, ascendantSign]);

  const chartHouses = useMemo(() => {
    const result: {
      houseNumber: number; signNumber: number; signName: string;
      signSymbol: string; rashiName: string; planets: PlanetData[];
    }[] = [];
    for (let i = 1; i <= 12; i++) {
      const signNumber = ((ascendantSign - 1 + (i - 1)) % 12) + 1;
      const englishName = ENGLISH_SIGNS[signNumber - 1] ?? '';
      result.push({
        houseNumber: i,
        signNumber,
        signName: englishName,
        signSymbol: ZODIAC_SYMBOLS[englishName] || '',
        rashiName: RASHI_NAMES[englishName] || englishName,
        planets: houseData.find(h => h.houseNumber === i)?.planets || [],
      });
    }
    return result;
  }, [houseData, ascendantSign]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px' }}>
      {showHeader && (
        <div style={{ fontSize: '16px', fontWeight: 700, color: STROKE, fontFamily: 'Georgia, serif', letterSpacing: '1px' }}>
          Janma Kundali
        </div>
      )}

      <svg
        viewBox="0 0 300 300"
        style={{
          width: '100%',
          // maxWidth: `${size}px`,
          height: 'auto',
          background: `linear-gradient(135deg, ${FILL_LIGHT} 0%, ${FILL} 100%)`,
          border: `3px double ${STROKE}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          display: 'block',
        }}
        role="img"
        aria-label="North Indian rasi chart"
      >
        <defs>
          <radialGradient id="paperGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor={FILL_LIGHT} />
            <stop offset="70%" stopColor={FILL} />
            <stop offset="100%" stopColor={FILL} />
          </radialGradient>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={ACCENT} />
          </marker>
        </defs>

        <rect x="0" y="0" width="300" height="300" fill="url(#paperGrad)" />

        {/* Chart structure lines - 300x300 coordinates */}
        <g stroke={STROKE} strokeWidth="2" fill="none" strokeLinecap="round">
          <rect x="2" y="2" width="296" height="296" />
          <rect x="6" y="6" width="288" height="288" strokeWidth="0.5" stroke={STROKE_LIGHT} />
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

        {/* Transit arrow - drawn BEFORE house content so planets render on top */}
        {transitMode && (() => {
          const fromC = NORTH_CENTERS[transitMode.fromHouse];
          const toC = NORTH_CENTERS[transitMode.toHouse];
          if (!fromC || !toC) return null;
          return (
            <g>
              <line
                x1={fromC.x} y1={fromC.y}
                x2={toC.x} y2={toC.y}
                stroke={ACCENT} strokeWidth={3}
                strokeDasharray="6,3"
                markerEnd="url(#arrowhead)"
              />
              <rect
                x={toC.x - 48} y={toC.y + 12}
                width={96} height={18} rx={9}
                fill={ACCENT} opacity={0.9}
              />
              <text
                x={toC.x} y={toC.y + 24}
                textAnchor="middle" fill="#1a1a1a"
                fontSize={9} fontWeight={800}
                fontFamily="Georgia, serif"
              >
                {transitMode.transitDate}
              </text>
            </g>
          );
        })()}

        {/* House contents */}
        {chartHouses.map(house => {
          const center = NORTH_CENTERS[house.houseNumber]!;
          const isTri = TRIANGLE_HOUSES.includes(house.houseNumber);
          const rashiFontSize = isTri ? 10 : 13;
          const planetFontSize = isTri ? 8 : 10;
          const planetSpacing = isTri ? 20 : 24;
          const planetLH = isTri ? 10 : 12;
          const iconSize = isTri ? 18 : 24;
          const planetIconSize = isTri ? 16 : 20;
          const rashiY = isTri ? center.y - 10 : center.y - 18;
          const rashiNameY = rashiY + (isTri ? 12 : 15);
          const planetsBaseY = rashiNameY + (isTri ? 10 : 14);
          const isAsc = house.houseNumber === 1;

          return (
            <g key={`content-${house.houseNumber}`} style={{ pointerEvents: 'none' }}>
              {/* Sign icon */}
              {house.signSymbol && (
                <image
                  href={house.signSymbol}
                  x={center.x - iconSize / 2 - 2}
                  y={rashiY - iconSize / 2}
                  width={iconSize}
                  height={iconSize}
                />
              )}
              <text
                x={center.x + iconSize / 2 + 2}
                y={rashiY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isAsc ? ACCENT : '#2c1f04'}
                fontSize={rashiFontSize}
                fontWeight={700}
                fontFamily="Georgia, serif"
                paintOrder="stroke fill"
                stroke="rgba(255,251,230,0.9)"
                strokeWidth="2.5px"
              >
                {house.signNumber}
              </text>

              {/* Rashi name */}
              <text
                x={center.x}
                y={rashiNameY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={TEXT_MUTED}
                fontSize={rashiFontSize - 1}
                fontFamily="Georgia, serif"
                fontWeight={700}
                paintOrder="stroke fill"
                stroke="rgba(255,251,230,0.9)"
                strokeWidth="2.5px"
              >
                {house.rashiName}
              </text>

              {/* Planets */}
              {house.planets.length > 0 && (
                <>
                  {house.planets.map((planet, idx) => {
                    const maxCols = isTri ? 2 : 3;
                    const cols = Math.min(house.planets.length, maxCols);
                    const row = Math.floor(idx / cols);
                    const col = idx % cols;
                    const totalW = (cols - 1) * planetSpacing;
                    const offX = col * planetSpacing - totalW / 2;
                    const pY = planetsBaseY + row * planetLH;
                    const isHL = highlightPlanet && planet.key.toLowerCase() === highlightPlanet.toLowerCase();

                    if (PLANET_ICONS[planet.key]) {
                      return (
                        <g key={planet.key}>
                          {isHL && (
                            <circle
                              cx={center.x + offX} cy={pY - 1}
                              r={planetIconSize / 2 + 4}
                              fill="rgba(245, 166, 35, 0.25)"
                              stroke={ACCENT} strokeWidth={1.5}
                            />
                          )}
                          <image
                            href={PLANET_ICONS[planet.key] || ''}
                            x={center.x + offX - planetIconSize / 2}
                            y={pY - planetIconSize / 2}
                            width={planetIconSize}
                            height={planetIconSize}
                          />
                        </g>
                      );
                    }

                    const colr = PLANET_COLORS[planet.key] || '#2c1f04';
                    const abbr = PLANET_ABBREV[planet.key] || planet.key.substring(0, 2);
                    const retro = planet.isRetro ? 'R' : '';

                    return (
                      <g key={planet.key}>
                        {isHL && (
                          <circle
                            cx={center.x + offX} cy={pY - 1}
                            r={planetFontSize + 3}
                            fill="rgba(245, 166, 35, 0.25)"
                            stroke={ACCENT} strokeWidth={1.5}
                          />
                        )}
                        <text
                          x={center.x + offX} y={pY}
                          textAnchor="middle" dominantBaseline="middle"
                          fill={colr}
                          fontSize={planetFontSize}
                          fontWeight={isHL ? 900 : 800}
                          fontFamily="Georgia, serif"
                          paintOrder="stroke fill"
                          stroke="rgba(255,251,230,0.95)"
                          strokeWidth="3px"
                        >
                          {abbr}{retro}
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
