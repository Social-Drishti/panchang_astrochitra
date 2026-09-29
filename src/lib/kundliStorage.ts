import type { KundliData } from './kundli';

const KEY = 'pach-kundlis';

export interface SavedKundli {
  id: string;
  name: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  timezone: number;
  latitude: number;
  longitude: number;
  placeName: string;
  savedAt: number;    // epoch ms
  kundli: KundliData;
}

/** Stable id derived from birth data so re-generating the same birth updates the record. */
export function kundliId(entry: Pick<SavedKundli, 'name' | 'date' | 'time' | 'timezone' | 'latitude' | 'longitude'>): string {
  const s = [
    entry.name.trim().toLowerCase(),
    entry.date,
    entry.time,
    entry.timezone,
    Math.round(entry.latitude * 10000),
    Math.round(entry.longitude * 10000),
  ].join('|');
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return 'k' + Math.abs(hash).toString(36);
}

export type SavedKundliInput = Omit<SavedKundli, 'id' | 'savedAt'>;

export function loadSavedKundlis(): SavedKundli[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedKundli[];
    if (!Array.isArray(arr)) return [];
    return arr.filter(e => e && e.id && e.kundli);
  } catch {
    return [];
  }
}

function persist(list: SavedKundli[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full or unavailable — ignore
  }
}

export function saveKundli(input: SavedKundliInput): SavedKundli {
  const id = kundliId(input);
  const entry: SavedKundli = { ...input, id, savedAt: Date.now() };
  const list = loadSavedKundlis();
  const existing = list.findIndex(e => e.id === id);
  if (existing >= 0) list[existing] = entry;
  else list.unshift(entry);
  persist(list);
  void import('./backend').then(({ syncKundli }) => syncKundli(entry));
  return entry;
}

export function deleteKundli(id: string): void {
  persist(loadSavedKundlis().filter(e => e.id !== id));
}

// A generated-but-unsaved chart has no record yet, but the viewer is addressed
// by id (/kundli/view/:id), so the chart has to be retrievable by something
// other than React state. One slot, mirroring the single "current result" the
// page used to hold. sessionStorage so it survives a reload but is dropped with
// the tab rather than lingering as a stale unsaved chart.
const DRAFT_KEY = 'pach-kundli-draft';

export interface KundliDraft {
  id: string;
  entry: SavedKundliInput;
}

export function loadDraft(): KundliDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as KundliDraft;
    return d && d.id && d.entry && d.entry.kundli ? d : null;
  } catch {
    return null;
  }
}

export function saveDraft(id: string, entry: SavedKundliInput): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ id, entry }));
  } catch {
    // storage unavailable; the chart still renders, it just won't survive reload
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}