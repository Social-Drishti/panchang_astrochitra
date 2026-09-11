import { getKundli, Observer, rashiNames, nakshatraNames, getAyanamsa } from '@ishubhamx/panchangam-js';
import * as Astronomy from 'astronomy-engine';

export const ZODIAC = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export const RASHI_NAME: Record<string, string> = {
  Aries: 'Mesh', Taurus: 'Vrish', Gemini: 'Mithun', Cancer: 'Kark',
  Leo: 'Simha', Virgo: 'Kanya', Libra: 'Tula', Scorpio: 'Vrischik',
  Sagittarius: 'Dhanu', Capricorn: 'Makar', Aquarius: 'Kumbh', Pisces: 'Meen',
};

export const RASHI_LORDS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

export const RASHI_LORDS_SA: Record<string, string> = {
  Aries: 'Mangal', Taurus: 'Shukra', Gemini: 'Budh', Cancer: 'Chandra',
  Leo: 'Surya', Virgo: 'Budh', Libra: 'Shukra', Scorpio: 'Mangal',
  Sagittarius: 'Guru', Capricorn: 'Shani', Aquarius: 'Shani', Pisces: 'Guru',
};

const NAK_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus',
  'Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
];

export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

export function nakshatraAtLongitude(lon: number): { name: string; lord: string; pada: number } {
  const ni = Math.floor(lon / (13 + 1 / 3));
  return {
    name: NAKSHATRA_NAMES[ni] ?? 'Unknown',
    lord: NAK_LORDS[ni] ?? 'Unknown',
    pada: Math.floor(((lon % (13 + 1 / 3)) / (13 + 1 / 3)) * 4) + 1,
  };
}

const DASHA_LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

const KARAKA_PLANET: Record<string, string> = {
  Sun: 'Atma karaka', Moon: 'Matri karaka', Mars: 'Bhratri karaka',
  Mercury: 'Gnati karaka', Jupiter: 'Putra karaka', Venus: 'Kalatra karaka', Saturn: 'Karma karaka',
};

export const GRAHA_KEYS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;

export type GrahaKey = typeof GRAHA_KEYS[number];

export interface BirthDetails {
  name: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM (24h)
  timezone: number;   // hours east of UTC, default 5.5
  latitude: number;
  longitude: number;
  placeName: string;
}

export interface HouseInfo {
  houseNumber: number;
  signNumber: number;
  signName: string;
  rashiName: string;
  rashiLord: string;
  rashiLordSa: string;
  planets: PlanetInfo[];
}

export interface PlanetInfo {
  key: string;
  label: string;
  houseNumber: number;
  isRetro: boolean;
  signName: string;
  currentSign: number;      // 1-12
  normDegree: number;       // 0-30
  longitude: number;        // 0-360 sidereal
  nakshatraName: string;
  nakshatraPada: number;    // 1-4
  nakshatraLord: string;
  dignity: string;
  combust?: boolean;
  karaka?: string;
  aspectsOnHouses?: boolean[];
}

export interface DashaPeriod {
  lord: string;
  start: string;
  end: string;
  startStr: string;
  endStr: string;
}

export interface DashaData {
  birthNakshatra: string;
  nakshatraPada: number;
  dashaBalance: string;
  currentMaha: DashaPeriod | null;
  currentAntar: DashaPeriod | null;
  mahaDasas: DashaPeriod[];
  antarDasas: DashaPeriod[];
}

export interface KundliData {
  personName: string;
  utcDateTime: string;
  localDateTime: string;
  placeName: string;
  ascendantSign: number;          // 1-12
  ascendantSignName: string;
  ascendantRashiName: string;
  lagna: {
    longitude: number;
    nakshatraName: string;
    nakshatraLord: string;
    pada: number;
  };
  moonSign: number;
  moonSignName: string;
  moonNakshatra: string;
  planets: PlanetInfo[];
  houses: HouseInfo[];
  dasha: DashaData;
  navamsa: NavamsaData | null;
}

export interface NavamsaData {
  ascendant: {
    sign: number;
    signName: string;
  };
  planets: Record<string, { sign: number; signName: string; nakshatraName: string; nakshatraLord: string; pada: number; longitude: number }>;
}

interface RawPosition {
  longitude: number;
  rashi: number;
  rashiName: string;
  degree: number;
  nakshatra?: string;
  nakshatraLord?: string;
  pada?: number;
  isRetrograde: boolean;
  speed?: number;
  dignity?: string | number;
  isCombust?: boolean;
  karaka?: number;
  naturalRelations?: number[];
  aspectsOnHouses?: boolean[];
}

function wholeSignHouse(lon: number, ascLon: number): number {
  const ascSign = Math.floor(ascLon / 30);
  const plSign = Math.floor(lon / 30);
  return (((plSign - ascSign) % 12) + 12) % 12 + 1;
}

function nakshatraIndex(lon: number): number {
  return Math.floor(lon / (13 + 1 / 3));
}

function nakshatraPada(lon: number): number {
  return Math.floor((lon % (13 + 1 / 3)) / (13 + 1 / 3) * 4) + 1;
}

function dignityLabel(dignity: string | number): string {
  if (typeof dignity === 'number') return `state ${dignity}`;
  return dignity || 'neutral';
}

function formatShortDate(date: Date | string): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function mapPlanets(planets: Record<string, RawPosition>, asc: RawPosition | null): Record<string, PlanetInfo> {
  const allowed: Record<string, boolean> = {};
  GRAHA_KEYS.forEach(k => (allowed[k] = true));

  const out: Record<string, PlanetInfo> = {};

  for (const [k, pd] of Object.entries(planets)) {
    if (!allowed[k]) continue;
    const lon = pd.longitude;
    const ni = nakshatraIndex(lon);
    const pa = nakshatraPada(lon);
    const hn = asc ? wholeSignHouse(lon, asc.longitude) : 0;
    out[k] = {
      key: k,
      label: k,
      houseNumber: hn,
      isRetro: !!pd.isRetrograde,
      signName: pd.rashiName || rashiNames[pd.rashi] || ZODIAC[pd.rashi] || 'Unknown',
      currentSign: pd.rashi + 1,
      normDegree: pd.degree ?? lon % 30,
      longitude: lon,
      nakshatraName: pd.nakshatra || nakshatraNames[ni] || 'Unknown',
      nakshatraPada: pd.pada || pa,
      nakshatraLord: pd.nakshatraLord || NAK_LORDS[ni] || 'Unknown',
      dignity: dignityLabel(pd.dignity ?? 'neutral'),
      combust: pd.isCombust,
      karaka: KARAKA_PLANET[k],
      aspectsOnHouses: pd.aspectsOnHouses,
    };
  }

  if (asc) {
    const lon = asc.longitude;
    const ni = nakshatraIndex(lon);
    const pa = nakshatraPada(lon);
    out.Ascendant = {
      key: 'Ascendant',
      label: 'Ascendant',
      houseNumber: 1,
      isRetro: false,
      signName: asc.rashiName,
      currentSign: asc.rashi + 1,
      normDegree: lon % 30,
      longitude: lon,
      nakshatraName: asc.nakshatra || nakshatraNames[ni] || 'Unknown',
      nakshatraPada: asc.pada || pa,
      nakshatraLord: asc.nakshatraLord || NAK_LORDS[ni] || 'Unknown',
      dignity: 'lagna',
      karaka: 'Lagna',
    };
  }

  return out;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function computeDasha(dasha: any): DashaData {
  const now = new Date();
  let mahaDasas: DashaPeriod[] = [];
  let antarDasas: DashaPeriod[] = [];
  const base: DashaData = {
    birthNakshatra: dasha?.birthNakshatra || '',
    nakshatraPada: dasha?.nakshatraPada || 0,
    dashaBalance: dasha?.dashaBalance || '',
    currentMaha: null,
    currentAntar: null,
    mahaDasas,
    antarDasas,
  };
  if (!dasha || !dasha.fullCycle) return base;

  mahaDasas = dasha.fullCycle.map((d: any) => ({
    lord: d.planet,
    start: d.startTime,
    end: d.endTime,
    startStr: formatShortDate(d.startTime),
    endStr: formatShortDate(d.endTime),
  }));

  const currentMahaRaw = dasha.fullCycle.find((d: any) => now >= new Date(d.startTime) && now < new Date(d.endTime));
  if (!currentMahaRaw) return { ...base, mahaDasas, antarDasas };

  const currentMaha: DashaPeriod = {
    lord: currentMahaRaw.planet,
    start: currentMahaRaw.startTime,
    end: currentMahaRaw.endTime,
    startStr: formatShortDate(currentMahaRaw.startTime),
    endStr: formatShortDate(currentMahaRaw.endTime),
  };

  const mahaLordIdx = DASHA_LORDS.indexOf(currentMahaRaw.planet);
  const mahaStart = new Date(currentMahaRaw.startTime);
  const mahaEnd = new Date(currentMahaRaw.endTime);
  const mahaDurationMs = mahaEnd.getTime() - mahaStart.getTime();

  let antarStart = mahaStart;
  for (let j = 0; j < 9; j++) {
    const adIdx = (mahaLordIdx + j + 9) % 9;
    const adLord = DASHA_LORDS[adIdx] ?? 'Unknown';
    const adDurationMs = ((DASHA_YEARS[adIdx] ?? 0) / 120) * mahaDurationMs;
    const adEnd = new Date(antarStart.getTime() + adDurationMs);
    antarDasas.push({
      lord: adLord,
      start: antarStart.toISOString(),
      end: adEnd.toISOString(),
      startStr: formatShortDate(antarStart),
      endStr: formatShortDate(adEnd),
    });
    antarStart = adEnd;
  }

  const currentAntar = antarDasas.find(d => now >= new Date(d.start) && now < new Date(d.end)) || null;

  return { ...base, currentMaha, currentAntar, mahaDasas, antarDasas };
}

function buildHouses(planets: PlanetInfo[], ascendantSign: number): HouseInfo[] {
  const houses: HouseInfo[] = [];
  for (let i = 1; i <= 12; i++) {
    const signNumber = ((ascendantSign - 1 + (i - 1)) % 12) + 1;
    const signName = ZODIAC[signNumber - 1] ?? 'Unknown';
    houses.push({
      houseNumber: i,
      signNumber,
      signName,
      rashiName: RASHI_NAME[signName] || signName,
      rashiLord: RASHI_LORDS[signName] || '',
      rashiLordSa: RASHI_LORDS_SA[signName] || '',
      planets: planets.filter(p => p.houseNumber === i && p.key !== 'Ascendant'),
    });
  }
  return houses;
}

function buildNavamsa(r: any): NavamsaData | null {
  const d9 = r?.vargas?.d9;
  if (!d9 || !d9.planets || !d9.ascendant) return null;

  const map: NavamsaData['planets'] = {};
  const keys: Record<string, boolean> = {};
  GRAHA_KEYS.forEach(k => (keys[k] = true));

  for (const [k, v] of Object.entries(d9.planets) as any) {
    if (!keys[k]) continue;
    const p = v as any;
    const nk = nakshatraIndex(p.longitude);
    map[k] = {
      sign: p.rashi,
      signName: p.rashiName || ZODIAC[p.rashi] || 'Unknown',
      nakshatraName: p.nakshatra || nakshatraNames[nk] || 'Unknown',
      nakshatraLord: p.nakshatraLord || NAK_LORDS[nk] || 'Unknown',
      pada: p.pada || nakshatraPada(p.longitude),
      longitude: p.longitude,
    };
  }

  return {
    ascendant: {
      sign: d9.ascendant.rashi,
      signName: d9.ascendant.rashiName || ZODIAC[d9.ascendant.rashi] || 'Unknown',
    },
    planets: map,
  };
}

/**
 * Generate a full Janam Kundli (birth chart) for a given date/time/place.
 * Follows the same whole-sign house + nakshatra/lord derivation used by
 * the kundli-api reference implementation.
 */
export function generateKundli(bd: BirthDetails): KundliData {
  const [yyyy = 1970, mm = 1, dd = 1] = bd.date.split('-').map(Number);
  const [hh = 0, mn = 0] = bd.time.split(':').map(Number);
  const tz = bd.timezone != null ? bd.timezone : 5.5;

  const dt = new Date(Date.UTC(yyyy, mm - 1, dd, hh, mn, 0) - tz * 3600000);
  const obs = new Observer(bd.latitude, bd.longitude, 0);
  const r = getKundli(dt, obs, { houseSystem: 'whole_sign' });

  const mapped = mapPlanets(r.planets as Record<string, RawPosition>, (r.ascendant as RawPosition) ?? null);

  // Add outer planets (Uranus, Neptune, Pluto) via astronomy-engine
  let time: ReturnType<typeof Astronomy.MakeTime>;
  try {
    time = Astronomy.MakeTime(dt);
  } catch {
    time = dt as any;
  }
  const ayanamsa = getAyanamsa(dt);
  const extraBodies = ['Uranus', 'Neptune', 'Pluto'];
  for (const name of extraBodies) {
    try {
      const body = (Astronomy.Body as any)[name];
      if (!body) continue;
      const gv = Astronomy.GeoVector(body, time, true);
      const ecl = Astronomy.Ecliptic(gv);
      const lon = (ecl.elon - ayanamsa + 360) % 360;
      const ri = Math.floor(lon / 30);
      const ni = nakshatraIndex(lon);
      const pa = nakshatraPada(lon);
      const hn = r.ascendant ? wholeSignHouse(lon, r.ascendant.longitude) : 0;
      mapped[name] = {
        key: name,
        label: name,
        houseNumber: hn,
        isRetro: false,
        signName: rashiNames[ri] ?? 'Unknown',
        currentSign: ri + 1,
        normDegree: lon % 30,
        longitude: lon,
        nakshatraName: nakshatraNames[ni] || 'Unknown',
        nakshatraPada: pa,
        nakshatraLord: NAK_LORDS[ni] ?? 'Unknown',
        dignity: 'neutral',
      };
    } catch (err) {
      console.warn(`Failed to compute outer planet ${name}:`, err);
    }
  }

  const ascendantSign = mapped.Ascendant ? mapped.Ascendant.currentSign : 1;
  const ascendantSignName = ZODIAC[ascendantSign - 1] ?? 'Unknown';
  const ascendantRashiName = RASHI_NAME[ascendantSignName] || ascendantSignName;

  const planets = Object.entries(mapped).map(([, v]) => v);

  const houses = buildHouses(planets, ascendantSign);
  const dasha = computeDasha(r.dasha);
  const navamsa = buildNavamsa(r);

  const ascSymbol = mapped.Ascendant;
  const moon = mapped.Moon;

  const localDate = new Date(dt.getTime() + tz * 3600000);
  const localDateTime =
    `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())} ` +
    `${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`;

  return {
    personName: bd.name,
    utcDateTime: dt.toISOString(),
    localDateTime,
    placeName: bd.placeName,
    ascendantSign,
    ascendantSignName,
    ascendantRashiName,
    lagna: {
      longitude: ascSymbol?.longitude ?? 0,
      nakshatraName: ascSymbol?.nakshatraName ?? '',
      nakshatraLord: ascSymbol?.nakshatraLord ?? '',
      pada: ascSymbol?.nakshatraPada ?? 1,
    },
    moonSign: moon?.currentSign ?? 0,
    moonSignName: moon?.signName ?? '',
    moonNakshatra: moon?.nakshatraName ?? '',
    planets,
    houses,
    dasha,
    navamsa,
  };
}
