import {
  getPanchangam, Observer,
  tithiNames, nakshatraNames, yogaNames, karanaNames,
  rashiNames, masaNames, rituNames, ayanaNames, samvatsaraNames
} from '@ishubhamx/panchangam-js';
import { VARA_NAMES, PLANET_NAMES, formatTime } from './constants';

export interface PlanetPosition {
  name: string; sanskritName: string; longitude: number;
  rashi: { index: number; name: string };
  nakshatra: string | null; degrees: number; isRetrograde: boolean;
}

export interface ChoghadiyaItem {
  name: string; rating: string; start: string | null; end: string | null;
}

export interface GowriItem {
  name: string; rating: string; start: string | null; end: string | null;
}

export interface PanchangResponse {
  date: string;
  location: { latitude: number; longitude: number; elevation: number };
  tithi: { index: number; name: string; endTime: string | null | undefined };
  nakshatra: { index: number; name: string; endTime: string | null | undefined; pada: number | null };
  yoga: { index: number; name: string; endTime: string | null | undefined };
  karana: { index: number; name: string };
  vara: { index: number; name: string };
  paksha: { name: string; displayName: string };
  masa: { index: number; name: string; isAdhika: boolean };
  samvat: { vikram: number; shaka: number; samvatsara: string };
  ritu: { index: number; name: string };
  ayana: { index: number; name: string };
  times: {
    sunrise: string | null; sunset: string | null;
    moonrise: string | null; moonset: string | null;
  };
  inauspicious: {
    rahuKalam: { start: string | null; end: string | null } | null;
    yamaganda: { start: string | null; end: string | null } | null;
    gulikaKalam: { start: string | null; end: string | null } | null;
  };
  auspicious: {
    abhijitMuhurta: { start: string | null; end: string | null } | null;
    brahmaMuhurta: { start: string | null; end: string | null } | null;
  };
  choghadiya: { day: ChoghadiyaItem[]; night: ChoghadiyaItem[] } | null;
  gowri: { day: GowriItem[]; night: GowriItem[] } | null;
  planets: PlanetPosition[];
  moonRashi: { index: number; name: string } | null;
  sunRashi: { index: number; name: string } | null;
  udayaLagna: { index: number; name: string; longitude: number | null } | null;
  festivals: any[];
  specialYogas: any[];
}

export interface LocationInput {
  latitude: number; longitude: number; elevation: number;
}

function normalizeDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 0, 30, 0, 0));
}

function parseDateStr(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  const [y, m, d] = [parts[0] ?? 2000, parts[1] ?? 1, parts[2] ?? 1];
  return normalizeDate(y, m - 1, d);
}

function fmtPeriod(period: { start?: Date; end?: Date } | null): { start: string | null; end: string | null } | null {
  if (!period?.start || !period?.end) return null;
  return { start: formatTime(period.start), end: formatTime(period.end) };
}

export function calculatePanchang(dateStr: string, location: LocationInput): PanchangResponse {
  const date = parseDateStr(dateStr);
  const observer = new Observer(location.latitude, location.longitude, location.elevation);
  const raw = getPanchangam(date, observer);

  const tithi = raw.tithi ?? 0;
  const nakshatra = raw.nakshatra ?? 0;
  const yoga = raw.yoga ?? 0;
  const vara = raw.vara ?? date.getDay();

  const karanaValue = raw.karana;
  const karanaIdx = typeof karanaValue === 'number' ? karanaValue : (karanaNames?.indexOf(karanaValue) ?? 0);
  const karanaName = typeof karanaValue === 'string' ? karanaValue : (karanaNames?.[karanaIdx] || 'Unknown');

  const masaData = raw.masa || { index: 0, name: 'Unknown', isAdhika: false };

  const pakshaValue = raw.paksha || (tithi < 15 ? 'Shukla' : 'Krishna');
  const pakshaDisplay = pakshaValue === 'Shukla' ? 'Shukla Paksha' : 'Krishna Paksha';

  const samvat = raw.samvat || { vikram: date.getFullYear() + 57, shaka: date.getFullYear() - 78, samvatsara: 'Unknown' };

  const rituValue = raw.ritu || 'Unknown';
  const rituIdx = rituNames?.indexOf(rituValue) ?? 0;

  const ayanaValue = raw.ayana || 'Unknown';
  const ayanaIdx = ayanaNames?.indexOf(ayanaValue) ?? 0;

  const udayaLng = raw.udayaLagna;
  let udayaIdx = 0, udayaName = null;
  if (typeof udayaLng === 'number') {
    udayaIdx = Math.floor(udayaLng / 30) % 12;
    udayaName = rashiNames?.[udayaIdx] || null;
  }

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    date: (date.toISOString().split('T')[0] ?? ''),
    location: { ...location },

    tithi: { index: tithi, name: tithiNames?.[tithi] || 'Unknown', endTime: formatTime(raw.tithiEndTime) },
    nakshatra: { index: nakshatra, name: nakshatraNames?.[nakshatra] || 'Unknown', endTime: formatTime(raw.nakshatraEndTime), pada: raw.nakshatraPada ?? null },
    yoga: { index: yoga, name: yogaNames?.[yoga] || 'Unknown', endTime: formatTime(raw.yogaEndTime) },
    karana: { index: karanaIdx, name: karanaName },
    vara: { index: vara, name: VARA_NAMES[vara] ?? weekDays[vara] ?? 'Unknown' },
    paksha: { name: pakshaValue, displayName: pakshaDisplay },

    masa: { index: masaData.index, name: masaData.name, isAdhika: masaData.isAdhika ?? false },
    samvat: { vikram: samvat.vikram, shaka: samvat.shaka, samvatsara: samvat.samvatsara },
    ritu: { index: rituIdx < 0 ? 0 : rituIdx, name: rituValue },
    ayana: { index: ayanaIdx < 0 ? 0 : ayanaIdx, name: ayanaValue },

    times: {
      sunrise: formatTime(raw.sunrise), sunset: formatTime(raw.sunset),
      moonrise: formatTime(raw.moonrise), moonset: formatTime(raw.moonset),
    },

    inauspicious: {
      rahuKalam: raw.rahuKalamStart && raw.rahuKalamEnd ? { start: formatTime(raw.rahuKalamStart), end: formatTime(raw.rahuKalamEnd) } : null,
      yamaganda: fmtPeriod(raw.yamagandaKalam),
      gulikaKalam: fmtPeriod(raw.gulikaKalam),
    },

    auspicious: {
      abhijitMuhurta: fmtPeriod(raw.abhijitMuhurta),
      brahmaMuhurta: fmtPeriod(raw.brahmaMuhurta),
    },

    choghadiya: raw.choghadiya ? {
      day: (raw.choghadiya.day || []).map(c => ({ name: c.name, rating: c.rating, start: formatTime(c.startTime), end: formatTime(c.endTime) })),
      night: (raw.choghadiya.night || []).map(c => ({ name: c.name, rating: c.rating, start: formatTime(c.startTime), end: formatTime(c.endTime) })),
    } : null,

    gowri: raw.gowri ? {
      day: (raw.gowri.day || []).map(g => ({ name: g.name, rating: g.rating, start: formatTime(g.startTime), end: formatTime(g.endTime) })),
      night: (raw.gowri.night || []).map(g => ({ name: g.name, rating: g.rating, start: formatTime(g.startTime), end: formatTime(g.endTime) })),
    } : null,

    planets: raw.planetaryPositions ? Object.entries(raw.planetaryPositions).map(([planet, data]: [string, any]) => ({
      name: planet,
      sanskritName: PLANET_NAMES[planet.toLowerCase() as keyof typeof PLANET_NAMES] || planet,
      longitude: data.longitude,
      rashi: { index: data.rashiIndex ?? data.rashi, name: data.rashiName || rashiNames?.[data.rashiIndex ?? data.rashi] || 'Unknown' },
      nakshatra: data.nakshatraName || null,
      degrees: data.degrees ?? data.degree,
      isRetrograde: data.isRetrograde ?? false,
    })) : [],

    moonRashi: raw.moonRashi ? { index: raw.moonRashi.index, name: raw.moonRashi.name || rashiNames?.[raw.moonRashi.index] || 'Unknown' } : null,
    sunRashi: raw.sunRashi ? { index: raw.sunRashi.index, name: raw.sunRashi.name || rashiNames?.[raw.sunRashi.index] || 'Unknown' } : null,

    udayaLagna: udayaName ? { index: udayaIdx, name: udayaName, longitude: typeof udayaLng === 'number' ? udayaLng : null } : null,
    festivals: raw.festivals || [],
    specialYogas: raw.specialYogas || [],
  };
}

// Simplified types for UI components
export interface PlanetPositions {
  [key: string]: { sign: number; degree: number } | undefined;
  Sun?: { sign: number; degree: number };
  Moon?: { sign: number; degree: number };
  Mars?: { sign: number; degree: number };
  Mercury?: { sign: number; degree: number };
  Jupiter?: { sign: number; degree: number };
  Venus?: { sign: number; degree: number };
  Saturn?: { sign: number; degree: number };
  Rahu?: { sign: number; degree: number };
  Ketu?: { sign: number; degree: number };
}

export interface PanchangData {
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  vara: string;
  masa: string;
  ritu: string;
  ayana: string;
  moonRashi: string;
  sunRashi: string;
  udayaLagna: string;
  rahuKalam: string;
  yamaganda: string;
  gulikaKalam: string;
  abhijitMuhurta: string;
  brahmaMuhurta: string;
  festivals: string[];
  specialYogas: string[];
  choghadiya?: { day: ChoghadiyaItem[]; night: ChoghadiyaItem[] };
  gowri?: { day: GowriItem[]; night: GowriItem[] };
  planetPositions: PlanetPositions;
}

export function getPanchang(date: Date, lat: number, lon: number): PanchangData {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const raw = calculatePanchang(dateStr, { latitude: lat, longitude: lon, elevation: 0 });

  const fmt = (p: { start: string | null; end: string | null } | null) =>
    p ? `${p.start ?? ''} - ${p.end ?? ''}` : '';

  const planetPositions: PlanetPositions = {};
  raw.planets.forEach(p => {
    const key = p.name.charAt(0).toUpperCase() + p.name.slice(1);
    planetPositions[key] = { sign: p.rashi.index, degree: p.degrees };
  });

  return {
    sunrise: raw.times.sunrise ?? '',
    sunset: raw.times.sunset ?? '',
    moonrise: raw.times.moonrise ?? '',
    moonset: raw.times.moonset ?? '',
    tithi: raw.tithi.name,
    nakshatra: raw.nakshatra.name,
    yoga: raw.yoga.name,
    karana: raw.karana.name,
    vara: raw.vara.name,
    masa: raw.masa.name,
    ritu: raw.ritu.name,
    ayana: raw.ayana.name,
    moonRashi: raw.moonRashi?.name ?? '',
    sunRashi: raw.sunRashi?.name ?? '',
    udayaLagna: raw.udayaLagna?.name ?? '',
    rahuKalam: fmt(raw.inauspicious.rahuKalam),
    yamaganda: fmt(raw.inauspicious.yamaganda),
    gulikaKalam: fmt(raw.inauspicious.gulikaKalam),
    abhijitMuhurta: fmt(raw.auspicious.abhijitMuhurta),
    brahmaMuhurta: fmt(raw.auspicious.brahmaMuhurta),
    festivals: raw.festivals.map((f: any) => typeof f === 'string' ? f : f.name ?? ''),
    specialYogas: raw.specialYogas.map((y: any) => typeof y === 'string' ? y : y.name ?? ''),
    choghadiya: raw.choghadiya ?? undefined,
    gowri: raw.gowri ?? undefined,
    planetPositions,
  };
}
