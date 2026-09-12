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
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => handleQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={value ? value.displayName : (placeholder || 'Search place, city, country...')}
        style={{ borderRadius: '8px', padding: '10px 12px', background: '#fff', width: '100%' }}
      />
      {value && (
        <button
          onClick={() => { setQuery(''); setOpen(false); onClear?.(); setSearched(false); }}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            border: '1px solid var(--border)', borderRadius: '50%', width: 20, height: 20,
            fontSize: 12, lineHeight: '18px', color: 'var(--text-muted)', background: '#fff',
          }}
        >
          ×
        </button>
      )}

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
            background: '#fff', border: '1px solid var(--border)', borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {loading && (
            <div style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
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
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px',
                  borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: '13px', color: 'var(--text)', background: '#fff',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <span style={{ fontWeight: 500 }}>{r.displayName.split(',')[0]}</span>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {r.displayName}
                </div>
              </button>
            ))}
        </div>
      )}

      {value && !open && (
        <div style={{ fontSize: '11px', color: 'var(--card-text-3)', marginTop: '4px' }}>
          {value.lat.toFixed(4)}°, {value.lon.toFixed(4)}°
        </div>
      )}
    </div>
  );
}