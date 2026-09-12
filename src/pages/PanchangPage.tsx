import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { getPanchang, type PanchangData } from '../lib/panchang';
import { formatDate } from '../lib/constants';
import { MdChevronLeft, MdChevronRight, MdWbSunny, MdNightlight, MdCalendarToday } from 'react-icons/md';

export default function PanchangPage() {
  const { lang, location, selectedDate, setSelectedDate } = useApp();
  const { tr } = useI18n(lang);
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

  const Item = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
    <div className="field-item">
      <span className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon && <span style={{ fontSize: '14px', color: 'var(--gold)' }}>{icon}</span>}
        {label}
      </span>
      <span className="field-value">{value}</span>
    </div>
  );

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      {/* Date Nav */}
      <div className="date-nav">
        <button className="date-nav-btn" onClick={() => changeDate(-1)}><MdChevronLeft size={24} /></button>
        <span className="date-nav-label">{formatDate(new Date(selectedDate + 'T00:00:00'), lang)}</span>
        <button className="date-nav-btn" onClick={() => changeDate(1)}><MdChevronRight size={24} /></button>
      </div>

      {/* Sunrise/Sunset/Moonrise/Moonset */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdWbSunny size={20} color="var(--gold)" />
          {formatDate(new Date(selectedDate + 'T00:00:00'), lang)}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Item label={tr('sunrise')} value={data.sunrise} icon={<MdWbSunny size={14} />} />
          <Item label={tr('sunset')} value={data.sunset} icon={<MdNightlight size={14} />} />
          <Item label={tr('moonrise')} value={data.moonrise} icon={<MdNightlight size={14} />} />
          <Item label={tr('moonset')} value={data.moonset} icon={<MdNightlight size={14} />} />
        </div>
      </div>

      {/* Tithi, Nakshatra, Yoga, Karana, Vara */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdCalendarToday size={20} color="var(--gold)" />
          {tr('panchang')}
        </div>
        <div className="field-grid">
          <Item label={tr('tithi')} value={data.tithi} />
          <Item label={tr('nakshatra')} value={data.nakshatra} />
          <Item label={tr('yoga')} value={data.yoga} />
          <Item label={tr('karana')} value={data.karana} />
          <Item label={tr('vara')} value={data.vara} />
          <Item label={tr('masa')} value={data.masa} />
          <Item label={tr('ritu')} value={data.ritu} />
          <Item label={tr('ayana')} value={data.ayana} />
        </div>
      </div>

      {/* Rashi + Lagna */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', color: 'var(--gold)' }}>★</span>
          {tr('planets')}
        </div>
        <div className="field-grid">
          <Item label={tr('moonRashi')} value={data.moonRashi} />
          <Item label={tr('sunRashi')} value={data.sunRashi} />
          <Item label={tr('udayaLagna')} value={data.udayaLagna} />
        </div>
      </div>

      {/* Festivals & Special Yogas */}
      {data.festivals.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', color: 'var(--gold)' }}>🎉</span>
            {tr('festivals')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {data.festivals.map((f, i) => (
              <div key={i} className="chip chip-gold" style={{ fontSize: '12px' }}>{f}</div>
            ))}
          </div>
        </div>
      )}

      {data.specialYogas.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', color: 'var(--gold)' }}>✨</span>
            {tr('specialYogas')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {data.specialYogas.map((y, i) => (
              <div key={i} className="chip chip-gold" style={{ fontSize: '12px' }}>{y}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: '80px' }} />
    </div>
  );
}
