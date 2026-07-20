export const LOCATION_IDS = [
  'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata',
  'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'varanasi'
] as const;

export const VARA_NAMES = [
  'Ravivara', 'Somavara', 'Mangalavara', 'Budhavara',
  'Guruvara', 'Shukravara', 'Shanivara'
] as const;

export const PAKSHA = { SHUKLA: 'Shukla', KRISHNA: 'Krishna' } as const;

export const RITU_NAMES = [
  'Vasant', 'Grishma', 'Varsha', 'Sharad', 'Hemant', 'Shishir'
] as const;

export const AYANA_NAMES = [
  'Uttarayana', 'Dakshinayana'
] as const;

export const MUHURTA_RATING = { GOOD: 'good', BAD: 'bad', NEUTRAL: 'neutral' } as const;

export const PLANET_NAMES = {
  sun: 'Surya', moon: 'Chandra', mars: 'Mangal',
  mercury: 'Budh', jupiter: 'Guru', venus: 'Shukra',
  saturn: 'Shani', rahu: 'Rahu', ketu: 'Ketu'
} as const;

export const LOCATION_STORAGE_KEY = 'panchang-location';
export const DEFAULT_LOCATION = 'delhi';

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

export function formatDate(date: Date, lang?: string): string {
  try {
    return date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}

export function formatTime(date: Date | null | undefined): string | null {
  if (!date) return null;
  try {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  } catch { return null; }
}

export function formatTimePeriod(period: { start?: Date; end?: Date } | null): { start: string | null; end: string | null } | null {
  if (!period?.start || !period?.end) return null;
  return {
    start: formatTime(period.start),
    end: formatTime(period.end),
  };
}
