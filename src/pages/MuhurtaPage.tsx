import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { getPanchang, type PanchangData } from '../lib/panchang';
import { formatDate } from '../lib/constants';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

type MuhurtaCategory = { label: string; items: { name: string; start: string; end: string; type: 'good' | 'bad' | 'neutral' }[] };

export default function MuhurtaPage() {
  const { lang, location, selectedDate, setSelectedDate } = useApp();
  const { tr, tr: t } = useI18n(lang);
  const [data, setData] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const d = new Date(selectedDate + 'T00:00:00');
    const result = getPanchang(d, location.lat, location.lon);
    setData(result);
    setLoading(false);
  }, [selectedDate, location]);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  if (loading || !data) {
    return (
      <div className="scroll-area" style={{ padding: '16px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card shimmer" style={{ height: '80px' }} />
        ))}
      </div>
    );
  }

  const categories: MuhurtaCategory[] = [
    {
      label: tr('rahuKalam'),
      items: [
        { name: tr('rahuKalam'), start: data.rahuKalam.split(' - ')[0] || '', end: data.rahuKalam.split(' - ')[1] || '', type: 'bad' },
        { name: tr('yamaganda'), start: data.yamaganda.split(' - ')[0] || '', end: data.yamaganda.split(' - ')[1] || '', type: 'bad' },
        { name: tr('gulikaKalam'), start: data.gulikaKalam.split(' - ')[0] || '', end: data.gulikaKalam.split(' - ')[1] || '', type: 'bad' },
      ],
    },
    {
      label: tr('abhijitMuhurta'),
      items: [
        { name: tr('abhijitMuhurta'), start: data.abhijitMuhurta.split(' - ')[0] || '', end: data.abhijitMuhurta.split(' - ')[1] || '', type: 'good' },
        { name: tr('brahmaMuhurta'), start: data.brahmaMuhurta.split(' - ')[0] || '', end: data.brahmaMuhurta.split(' - ')[1] || '', type: 'good' },
      ],
    },
  ];

  // For now show choghadiya and gowri as well
  categories.push({
    label: tr('choghadiya'),
    items: Object.entries(data.choghadiya ?? {}).map(([name, val]) => ({
      name,
      start: '',
      end: '',
      type: val as 'good' | 'bad' | 'neutral',
    })),
  });

  categories.push({
    label: tr('gowri'),
    items: Object.entries(data.gowri ?? {}).map(([name, val]) => ({
      name,
      start: '',
      end: '',
      type: val as 'good' | 'bad' | 'neutral',
    })),
  });

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      <div className="date-nav">
        <button className="date-nav-btn" onClick={() => changeDate(-1)}><MdChevronLeft size={24} /></button>
        <span className="date-nav-label">{formatDate(new Date(selectedDate + 'T00:00:00'), lang)}</span>
        <button className="date-nav-btn" onClick={() => changeDate(1)}><MdChevronRight size={24} /></button>
      </div>

      {categories.filter(c => c.items.length > 0).map((cat, ci) => (
        <div key={ci} className="card">
          <div className="card-title">{cat.label}</div>
          {cat.items.map((item, ii) => (
            <div key={ii} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: ii < cat.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontWeight: 500, fontSize: '14px' }}>{item.name}</span>
              {item.start && item.end ? (
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.start} - {item.end}</span>
              ) : (
                <span className={`chip chip-${item.type}`}>{tr(item.type)}</span>
              )}
            </div>
          ))}
        </div>
      ))}

      <div style={{ height: '80px' }} />
    </div>
  );
}
