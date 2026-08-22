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

  const TimingRow = ({ name, rating, start, end, isLast }: { name: string; rating: string; start: string | null; end: string | null; isLast: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontWeight: 500, fontSize: '14px' }}>{name}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className={`chip chip-${rating}`}>{tr(rating)}</span>
        {start && end && (
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{start} - {end}</span>
        )}
      </span>
    </div>
  );

  const SubLabel = ({ children }: { children: string }) => (
    <div style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 2px' }}>{children}</div>
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

      {/* Choghadiya timings */}
      {((data.choghadiya?.day?.length ?? 0) > 0 || (data.choghadiya?.night?.length ?? 0) > 0) && (
        <div className="card">
          <div className="card-title">{tr('choghadiya')}</div>
          {(data.choghadiya?.day?.length ?? 0) > 0 && (
            <>
              <SubLabel>{tr('day')}</SubLabel>
              {data.choghadiya!.day.map((c, i) => (
                <TimingRow key={`cd-${i}`} name={c.name} rating={c.rating} start={c.start} end={c.end} isLast={i === data.choghadiya!.day.length - 1 && (data.choghadiya!.night?.length ?? 0) === 0} />
              ))}
            </>
          )}
          {(data.choghadiya?.night?.length ?? 0) > 0 && (
            <>
              <SubLabel>{tr('night')}</SubLabel>
              {data.choghadiya!.night.map((c, i) => (
                <TimingRow key={`cn-${i}`} name={c.name} rating={c.rating} start={c.start} end={c.end} isLast={i === data.choghadiya!.night.length - 1} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Gowri timings */}
      {((data.gowri?.day?.length ?? 0) > 0 || (data.gowri?.night?.length ?? 0) > 0) && (
        <div className="card">
          <div className="card-title">{tr('gowri')}</div>
          {(data.gowri?.day?.length ?? 0) > 0 && (
            <>
              <SubLabel>{tr('day')}</SubLabel>
              {data.gowri!.day.map((g, i) => (
                <TimingRow key={`gd-${i}`} name={g.name} rating={g.rating} start={g.start} end={g.end} isLast={i === data.gowri!.day.length - 1 && (data.gowri!.night?.length ?? 0) === 0} />
              ))}
            </>
          )}
          {(data.gowri?.night?.length ?? 0) > 0 && (
            <>
              <SubLabel>{tr('night')}</SubLabel>
              {data.gowri!.night.map((g, i) => (
                <TimingRow key={`gn-${i}`} name={g.name} rating={g.rating} start={g.start} end={g.end} isLast={i === data.gowri!.night.length - 1} />
              ))}
            </>
          )}
        </div>
      )}

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
