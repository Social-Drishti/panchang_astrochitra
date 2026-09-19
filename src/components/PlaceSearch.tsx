import { useEffect, useRef, useState } from 'react';
import { searchPlaces, type GeoResult } from '../lib/geocode';
import { locations } from '../lib/locations';

interface PlaceSearchProps {
  value: GeoResult | null;
  placeholder?: string;
  onSelect: (loc: GeoResult) => void;
  onClear?: () => void;
}

const PRESETS: GeoResult[] = locations.map(l => ({
  lat: l.lat,
  lon: l.lon,
  displayName: l.name,
}));

export default function PlaceSearch({ value, placeholder, onSelect, onClear }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const runSearch = (q: string) => {
    const id = ++idRef.current;
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const found = await searchPlaces(q, 'en');
      if (id === idRef.current) {
        setResults(found);
        setLoading(false);
        setSearched(true);
      }
    }, 450);
  };

  const handleQuery = (q: string) => {
    setQuery(q);
    setOpen(true);
    setSearched(false);
    if (!q.trim()) {
      setResults(PRESETS);
      setLoading(false);
      return;
    }
    runSearch(q);
  };

  return (
    <div ref={ref} className="place-search">
      <input
        value={query}
        onChange={e => handleQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={value ? value.displayName : (placeholder || 'Search place, city, country...')}
        className="ps-input"
      />
      {value && (
        <button
          onClick={() => { setQuery(''); setOpen(false); onClear?.(); setSearched(false); }}
          className="ps-clear"
          aria-label="Clear location"
        >
          ×
        </button>
      )}

      {open && (
        <div className="ps-dropdown">
          {loading && <div className="ps-status">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="ps-status">
              {searched ? 'No results found' : 'Type to search a place'}
            </div>
          )}
          {!loading &&
            results.map((r, i) => (
              <button
                key={`${r.lat}-${r.lon}-${i}`}
                onClick={() => {
                  setQuery('');
                  setOpen(false);
                  setSearched(false);
                  onSelect(r);
                }}
                className="ps-option"
              >
                <span className="ps-title">{r.displayName.split(',')[0]}</span>
                <div className="ps-meta">{r.displayName}</div>
              </button>
            ))}
        </div>
      )}

      {value && !open && (
        <div className="ps-coords">
          {value.lat.toFixed(4)}°, {value.lon.toFixed(4)}°
        </div>
      )}
    </div>
  );
}