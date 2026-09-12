import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { generateKundli, type KundliData, type BirthDetails } from '../lib/kundli';
import type { GeoResult } from '../lib/geocode';
import { locations } from '../lib/locations';
import {
  loadSavedKundlis,
  saveKundli,
  deleteKundli,
  kundliId,
  type SavedKundli,
  type SavedKundliInput,
} from '../lib/kundliStorage';
import KundliView from '../components/KundliView';
import PlaceSearch from '../components/PlaceSearch';
import BirthDateTimeFields from '../components/BirthDateTimeFields';
import { MdNoteAdd, MdFolder, MdDelete, MdArrowBack, MdClose } from 'react-icons/md';

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

type Tab = 'new' | 'saved';

interface KundliPageProps {
  onClose?: () => void;
}

export default function KundliPage({ onClose }: KundliPageProps) {
  const { lang } = useApp();
  const { tr } = useI18n(lang);

  const [tab, setTab] = useState<Tab>('new');
  const [savedList, setSavedList] = useState<SavedKundli[]>(() => loadSavedKundlis());

  // New-kundli form state
  const [name, setName] = useState('');
  const [dob, setDob] = useState({ d: '', m: '', y: '' });
  const [tob, setTob] = useState({ h: '', min: '' });
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [timezone, setTimezone] = useState(5.5);
  const [place, setPlace] = useState<GeoResult | null>(DEFAULT_PLACE);

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

  // View state (independent per tab)
  const [newView, setNewView] = useState<KundliData | null>(null);   // generated result in New tab
  const [newViewId, setNewViewId] = useState<string | null>(null);   // matching saved id (if any)
  const [savedViewId, setSavedViewId] = useState<string | null>(null); // opened entry in Saved tab
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    if (!place) {
      setError('Please select a place of birth');
      return;
    }
    if (!date || !time) {
      setError('Please enter a valid date and time of birth');
      return;
    }
    try {
      const bd: BirthDetails = {
        name: name.trim() || 'Person',
        date,
        time,
        timezone,
        latitude: place.lat,
        longitude: place.lon,
        placeName: place.displayName,
      };
      const result = generateKundli(bd);
      setNewView(result);
      setNewViewId(kundliId({
        name: bd.name,
        date: bd.date,
        time: bd.time,
        timezone: bd.timezone,
        latitude: bd.latitude,
        longitude: bd.longitude,
      }));
    } catch (e: any) {
      setError(e?.message || 'Failed to generate kundli');
      setNewView(null);
      setNewViewId(null);
    }
  };

  const handleSave = () => {
    if (!newView || !place) return;
    const input: SavedKundliInput = {
      name: newView.personName,
      date,
      time,
      timezone,
      latitude: place.lat,
      longitude: place.lon,
      placeName: newView.placeName,
      kundli: newView,
    };
    const entry = saveKundli(input);
    setNewViewId(entry.id);
    setSavedList(loadSavedKundlis());
  };

  const openSaved = (entry: SavedKundli) => {
    setSavedViewId(entry.id);
    setTab('saved');
  };

  const handleDelete = (id: string) => {
    deleteKundli(id);
    const list = loadSavedKundlis();
    setSavedList(list);
    if (savedViewId === id) setSavedViewId(null);
    if (newViewId === id) setNewViewId(null);
  };

  const L = {
    newKundli: 'New Kundli',
    savedKundlis: 'Saved Kundlis',
    name: 'Name',
    dob: 'Date of Birth',
    tob: 'Time of Birth',
    tz: 'Timezone',
    place: 'Place',
    generate: 'Generate Kundli',
    backToForm: '← New adjustments',
    backToList: '← Back to list',
    savedListTitle: 'Saved Kundlis',
    empty: 'No saved kundlis yet. Generate a new kundli and save it to store it here.',
  };

  const renderTabs = () => (
    <div className="k-tabs">
      <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: 0 }}>
        <button className={`k-tab${tab === 'new' ? ' active' : ''}`} onClick={() => setTab('new')}>
          <MdNoteAdd size={18} />
          <span>{L.newKundli}</span>
        </button>
        <button className={`k-tab${tab === 'saved' ? ' active' : ''}`} onClick={() => setTab('saved')}>
          <MdFolder size={18} />
          <span>{L.savedKundlis}</span>
          {savedList.length > 0 && <span className="k-tab-count">{savedList.length}</span>}
        </button>
      </div>
      {onClose && (
        <button onClick={onClose} className="k-tab-close" aria-label="Close">
          <MdClose size={20} />
        </button>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MdNoteAdd size={20} color="var(--gold)" />
        {L.newKundli}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: 'var(--card-text-3)' }}>{L.name}</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter name" style={{ borderRadius: '8px', padding: '10px 12px', background: '#fff' }} />
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
          <label style={{ fontSize: '12px', color: 'var(--card-text-3)' }}>{L.tz}</label>
          <select value={timezone} onChange={e => setTimezone(parseFloat(e.target.value))} style={{ borderRadius: '8px', padding: '10px 12px', background: '#fff' }}>
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: 'var(--card-text-3)' }}>{L.place}</label>
          <PlaceSearch value={place} onSelect={p => setPlace(p)} onClear={() => setPlace(null)} />
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} style={{ width: '100%', marginTop: '4px', padding: '14px' }}>
          {L.generate}
        </button>
        {error && <div style={{ color: '#ffb3b3', fontSize: '13px' }}>{error}</div>}
      </div>
    </div>
  );

  const renderSavedList = () => {
    if (savedList.length === 0) {
      return (
        <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
          <MdFolder size={40} color="var(--card-text-3)" style={{ marginBottom: '8px' }} />
          <div style={{ color: 'var(--card-text-2)', fontSize: '13px', lineHeight: '1.5' }}>
            {L.empty}
          </div>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--card-text-3)' }}>{L.savedListTitle} ({savedList.length})</div>
        {savedList.map(entry => {
          const k = entry.kundli;
          const savedId = entry.id;
          return (
            <div key={entry.id} className="card" style={{ padding: '12px', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => openSaved(entry)} style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--card-gold)' }}>{k.personName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--card-text-2)', marginTop: '2px' }}>
                    {k.localDateTime} · {k.placeName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    <span className="chip chip-gold" style={{ fontSize: '11px' }}>Lagna {k.ascendantRashiName}</span>
                    <span className="chip chip-neutral" style={{ fontSize: '11px' }}>Moon {k.moonSignName}</span>
                    {k.dasha.currentMaha && (
                      <span className="chip chip-good" style={{ fontSize: '11px' }}>
                        MD: {k.dasha.currentMaha.lord}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(savedId)}
                  style={{ color: '#ff8a80', padding: '8px', flexShrink: 0, display: 'flex' }}
                  aria-label="Delete"
                >
                  <MdDelete size={22} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      {renderTabs()}

      {tab === 'new' && (
        <>
          {newView ? (
            <>
              <button
                onClick={() => { setNewView(null); setNewViewId(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--olive)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}
              >
                <MdArrowBack size={16} /> {L.backToForm}
              </button>
              <KundliView
                kundli={newView}
                saved={newViewId ? savedList.some(e => e.id === newViewId) : false}
                onSave={handleSave}
              />
            </>
          ) : (
            renderForm()
          )}
        </>
      )}

      {tab === 'saved' && (
        <>
          {savedViewId != null ? (() => {
            const entry = savedList.find(e => e.id === savedViewId);
            return entry ? (
              <>
                <button
                  onClick={() => setSavedViewId(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--olive)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}
                >
                  <MdArrowBack size={16} /> {L.backToList}
                </button>
                <KundliView kundli={entry.kundli} saved />
              </>
            ) : (
              renderSavedList()
            );
          })() : (
            renderSavedList()
          )}
        </>
      )}
    </div>
  );
}