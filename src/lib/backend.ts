import type { SavedKundli } from './kundliStorage';
import { isAndroid, isIOS, isStandalone } from '../pwa/platformDetection';
import pkg from '../../package.json';

const DEVICE_KEY = 'panchang-device-id';
const HEARTBEAT_KEY = 'panchang-heartbeat-at';
const INSTALL_KEY = 'panchang-is-installed';
const HEARTBEAT_INTERVAL = 5 * 60 * 1000;

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? pkg.version ?? '0.0.0';

/**
 * API key for the authenticated data API (`/api/v1/stats`, `/api/v1/clients`,
 * `/api/v1/kundlis`). Overridable via VITE_API_KEY; defaults to the shared
 * read key. NOTE: a hardcoded client-side key is visible to anyone — rotate
 * it via the admin dashboard if it ever leaks.
 */
export const API_KEY =
  (import.meta.env.VITE_API_KEY as string | undefined) ??
  'ak_2b702dbac60c50967f62da81b211a35f6f7d1d5833f76df0';

export function apiBase(): string {
  return (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/v1';
}

export function isBackendConfigured(): boolean {
  return apiBase().length > 0;
}

/** Headers for the authenticated data API. */
export function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  };
}

/**
 * GET a JSON endpoint (public or API-key authenticated). Resolves to
 * `null` on network failure or non-2xx so callers can degrade silently.
 */
export async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      headers: apiHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Stable, local-only anonymous device id. Never leaves the device except to the backend. */
export function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id || !/^[A-Za-z0-9_\-]{8,128}$/.test(id)) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      id = 'd' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

function detectPlatform(): { platform: string; isMobile: boolean } {
  if (isIOS()) return { platform: 'ios', isMobile: true };
  if (isAndroid()) return { platform: 'android', isMobile: true };
  return { platform: 'web', isMobile: false };
}

async function post(path: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Anonymous heartbeat. Counts a web user on first sight and an install
 * when the device reports standalone/appinstalled state. Fire-and-forget.
 */
export async function reportClient(opts: { force?: boolean } = {}): Promise<boolean> {
  const id = deviceId();
  if (!id || !isBackendConfigured()) return false;

  if (opts.force !== true) {
    const last = Number(localStorage.getItem(HEARTBEAT_KEY) ?? 0);
    if (Date.now() - last < HEARTBEAT_INTERVAL) return false;
  }

  const installed = localStorage.getItem(INSTALL_KEY) === '1' || (!(import.meta.env.DEV) && isStandalone());
  const { platform, isMobile } = detectPlatform();

  const ok = await post('/client', {
    device_id: id,
    is_installed: installed,
    platform,
    is_mobile: isMobile,
    app_version: APP_VERSION,
  });

  if (ok) {
    try { localStorage.setItem(HEARTBEAT_KEY, String(Date.now())); } catch { /* ignore */ }
  }
  return ok;
}

/** Flags the device as installed and reports it once the PWA installs. */
export function watchInstall(): void {
  const markInstalled = () => {
    try { localStorage.setItem(INSTALL_KEY, '1'); } catch { /* ignore */ }
    void reportClient({ force: true });
  };

  window.addEventListener('appinstalled', markInstalled);

  if (isStandalone()) {
    try { localStorage.setItem(INSTALL_KEY, '1'); } catch { /* ignore */ }
    void reportClient({ force: true });
  }

  // Old installs that predate the tracking flag get captured too.
  if (!localStorage.getItem(INSTALL_KEY) && !(import.meta.env.DEV)) {
    document.addEventListener('visibilitychange', function onVisible() {
      if (!document.hidden && isStandalone()) {
        document.removeEventListener('visibilitychange', onVisible);
        markInstalled();
      }
    });
  }
}

/** Fire-and-forget anonymous kundli sync (offline-safe; failures are silent). */
export async function syncKundli(entry: SavedKundli): Promise<boolean> {
  if (!isBackendConfigured()) return false;
  const id = deviceId();
  return post('/kundli', {
    device_id: id || undefined,
    kundli_key: entry.id,
    date: entry.date,
    time: entry.time,
    timezone: entry.timezone,
    latitude: entry.latitude,
    longitude: entry.longitude,
    place_name: entry.placeName,
    kundli_json: JSON.stringify(entry.kundli),
  });
}

/** Re-push every locally saved kundli (e.g., after login/backend goes live). */
export async function resyncAllSavedKundlis(): Promise<void> {
  const { loadSavedKundlis } = await import('./kundliStorage');
  for (const entry of loadSavedKundlis()) {
    await syncKundli(entry);
  }
}

/* ---------------------- Authenticated data API ---------------------- */

export interface BackendStats {
  clients_total: number;
  clients_installed: number;
  kundlis_total: number;
  kundlis_today: number;
  generated_at: string;
}

export interface BackendListResult<T> {
  data: T[];
  limit: number;
  offset: number;
  count: number;
}

export function fetchStats(): Promise<BackendStats | null> {
  return apiGet<BackendStats>('/stats');
}

export function fetchDataClients(options?: { limit?: number; offset?: number; q?: string }): Promise<BackendListResult<Record<string, unknown>> | null> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));
  if (options?.q) params.set('q', options.q);
  const qs = params.toString();
  return apiGet<BackendListResult<Record<string, unknown>>>(`/clients${qs ? `?${qs}` : ''}`);
}

export function fetchDataKundlis(options?: { limit?: number; offset?: number }): Promise<BackendListResult<Record<string, unknown>> | null> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));
  const qs = params.toString();
  return apiGet<BackendListResult<Record<string, unknown>>>(`/kundlis${qs ? `?${qs}` : ''}`);
}