import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { generateKundli, type BirthDetails } from '../lib/kundli';
import type { GeoResult } from '../lib/geocode';
import { locations } from '../lib/locations';
import { kundliId, saveDraft, type SavedKundliInput } from '../lib/kundliStorage';
import { kundliViewPath } from '../lib/navigation';
import KundliTabs from '../components/KundliTabs';
import PlaceSearch from '../components/PlaceSearch';
import BirthDateTimeFields from '../components/BirthDateTimeFields';
import { MdNoteAdd } from 'react-icons/md';

const TIMEZONES = [
  { label: 'IST (UTC+5:30)', value: 5.5 },
  { label: 'UAE (UTC+4)', value: 4 },
  { label: 'UK (UTC+0)', value: 0 },
  { label: 'US East (UTC-5)', value: -5 },
  { label: 'US Central (UTC-6)', value: -6 },
  { label: 'US West (UTC-8)', value: -8 },
  { label: 'Japan (UTC+9)', value: 9 },
  { label: 'Australia East (UTC+10)', value: 10 },
  { label: 'Singapore (UTC+8)', value: 8 },
];

const DEFAULT_PLACE: GeoResult = {
  lat: locations[0]!.lat,
  lon: locations[0]!.lon,
  displayName: locations[0]!.name,
};

export default function KundliPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [dob, setDob] = useState({ d: '', m: '', y: '' });
  const [tob, setTob] = useState({ h: '', min: '' });
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [timezone, setTimezone] = useState(5.5);
  const [place, setPlace] = useState<GeoResult | null>(DEFAULT_PLACE);
  const [error, setError] = useState<string | null>(null);

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const date = useMemo(() => {
    const d = Number(dob.d);
    const m = Number(dob.m);
    const y = Number(dob.y);
    if (!dob.d || !dob.m || !dob.y || !d || !m || !y || !Number.isInteger(y) || y < 1000) return '';
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';
    return `${y}-${pad2(m)}-${pad2(d)}`;
  }, [dob]);

  const time = useMemo(() => {
    const h = Number(tob.h);
    const min = Number(tob.min);
    if (!tob.h || !tob.min || h < 1 || h > 12 || min < 0 || min > 59) return '';
    let h24 = h % 12;
    if (ampm === 'PM') h24 += 12;
    return `${pad2(h24)}:${pad2(min)}`;
  }, [tob, ampm]);

  const handleGenerate = () => {
    setError(null);
    if (!place) {
      setError(tr('errSelectPlace'));
      return;
    }
    if (!date || !time) {
      setError(tr('errValidBirth'));
      return;
    }
    try {
      const bd: BirthDetails = {
        name: name.trim() || tr('person'),
        date,
        time,
        timezone,
        latitude: place.lat,
        longitude: place.lon,
        placeName: place.displayName,
      };
      const result = generateKundli(bd);
      const entry: SavedKundliInput = {
        name: bd.name,
        date,
        time,
        timezone,
        latitude: place.lat,
        longitude: place.lon,
        placeName: bd.placeName,
        kundli: result,
      };
      // Stash the result so the viewer can resolve it by id, then move to it.
      const id = kundliId(entry);
      saveDraft(id, entry);
      navigate(kundliViewPath(id));
    } catch (e: any) {
      setError(e?.message || tr('errGenerate'));
    }
  };

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      <KundliTabs active="new" />

      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdNoteAdd size={20} color="var(--gold)" />
          {tr('newKundli')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--card-text-3)' }}>{tr('name')}</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={tr('enterName')} style={{ borderRadius: '8px', padding: '10px 12px', background: 'var(--bg-card)' }} />
          </div>
          <BirthDateTimeFields
            dob={dob}
            tob={tob}
            ampm={ampm}
            dateValue={date}
            timeValue={time}
            onDobChange={setDob}
            onTobChange={setTob}
            onAmpmChange={setAmpm}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--card-text-3)' }}>{tr('timezone')}</label>
            <select value={timezone} onChange={e => setTimezone(parseFloat(e.target.value))} style={{ borderRadius: '8px', padding: '10px 12px', background: 'var(--bg-card)' }}>
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', color: 'var(--card-text-3)' }}>{tr('place')}</label>
            <PlaceSearch value={place} onSelect={p => setPlace(p)} onClear={() => setPlace(null)} />
          </div>
          <button className="btn btn-primary" onClick={handleGenerate} style={{ width: '100%', marginTop: '4px', padding: '14px' }}>
            {tr('generateKundli')}
          </button>
          {error && <div style={{ color: '#ffb3b3', fontSize: '13px' }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
