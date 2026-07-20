import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { getPanchang, type PanchangData } from '../lib/panchang';
import { formatDate } from '../lib/constants';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

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

  const Item = ({ label, value }: { label: string; value: string }) => (
    <div className="field-item">
      <span className="field-label">{label}</span>
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
        <div className="card-title">{formatDate(new Date(selectedDate + 'T00:00:00'), lang)}</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Item label={tr('sunrise')} value={data.sunrise} />
          <Item label={tr('sunset')} value={data.sunset} />
          <Item label={tr('moonrise')} value={data.moonrise} />
          <Item label={tr('moonset')} value={data.moonset} />
        </div>
      </div>

      {/* Tithi, Nakshatra, Yoga, Karana, Vara */}
      <div className="card">
        <div className="card-title">{tr('panchang')}</div>
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
        <div className="card-title">{tr('planets')}</div>
        <div className="field-grid">
          <Item label={tr('moonRashi')} value={data.moonRashi} />
          <Item label={tr('sunRashi')} value={data.sunRashi} />
          <Item label={tr('udayaLagna')} value={data.udayaLagna} />
        </div>
      </div>

      {/* Auspicious timings */}
      <div className="card">
        <div className="card-title">{tr('rahuKalam')}</div>
        <div className="field-grid">
          <Item label={tr('rahuKalam')} value={data.rahuKalam} />
          <Item label={tr('yamaganda')} value={data.yamaganda} />
          <Item label={tr('gulikaKalam')} value={data.gulikaKalam} />
          <Item label={tr('abhijitMuhurta')} value={data.abhijitMuhurta} />
          <Item label={tr('brahmaMuhurta')} value={data.brahmaMuhurta} />
        </div>
      </div>

      {/* Festivals & Special Yogas */}
      {data.festivals.length > 0 && (
        <div className="card">
          <div className="card-title">{tr('festivals')}</div>
          {data.festivals.map((f, i) => (
            <div key={i} className="chip chip-gold" style={{ marginBottom: '4px' }}>{f}</div>
          ))}
        </div>
      )}

      {data.specialYogas.length > 0 && (
        <div className="card">
          <div className="card-title">{tr('specialYogas')}</div>
          {data.specialYogas.map((y, i) => (
            <div key={i} className="chip chip-gold" style={{ marginBottom: '4px' }}>{y}</div>
          ))}
        </div>
      )}

      <div style={{ height: '80px' }} />
    </div>
  );
}
