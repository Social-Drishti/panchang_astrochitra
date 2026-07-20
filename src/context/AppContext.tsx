import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Lang } from '../i18n';

export interface LocationInfo {
  name: string;
  lat: number;
  lon: number;
}

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  location: LocationInfo;
  setLocation: (loc: LocationInfo) => void;
  useGps: boolean;
  setUseGps: (v: boolean) => void;
  gpsLoading: boolean;
  gpsError: string | null;
  isOnline: boolean;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
}

const DEFAULT_LOCATION: LocationInfo = { name: 'Mumbai', lat: 19.076, lon: 72.8777 };

const LOCATION_KEY = 'pach-location';
const GPS_KEY = 'pach-gps';
const LANG_KEY = 'pach-lang';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadFromStorage<Lang>(LANG_KEY, 'en'));
  const [location, setLocationState] = useState<LocationInfo>(loadFromStorage<LocationInfo>(LOCATION_KEY, DEFAULT_LOCATION));
  const [useGps, setUseGpsState] = useState(loadFromStorage<boolean>(GPS_KEY, false));
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedDate, setSelectedDate] = useState(todayString);

  useEffect(() => {
    const handler = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, JSON.stringify(l));
  }, []);

  const setLocation = useCallback((loc: LocationInfo) => {
    setLocationState(loc);
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
  }, []);

  const setUseGps = useCallback((v: boolean) => {
    setUseGpsState(v);
    localStorage.setItem(GPS_KEY, JSON.stringify(v));
    if (v) {
      setGpsLoading(true);
      setGpsError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ name: 'GPS Location', lat: pos.coords.latitude, lon: pos.coords.longitude });
          setGpsLoading(false);
        },
        (err) => {
          setGpsError(err.message);
          setUseGpsState(false);
          localStorage.setItem(GPS_KEY, JSON.stringify(false));
          setGpsLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    }
  }, [setLocation]);

  return (
    <AppCtx value={{ lang, setLang, location, setLocation, useGps, setUseGps, gpsLoading, gpsError, isOnline, selectedDate, setSelectedDate }}>
      {children}
    </AppCtx>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp outside AppProvider');
  return ctx;
}
