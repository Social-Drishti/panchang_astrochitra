import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { loadSavedKundlis, deleteKundli, type SavedKundli } from '../lib/kundliStorage';
import { kundliViewPath } from '../lib/navigation';
import KundliTabs from '../components/KundliTabs';
import { MdFolder, MdDelete } from 'react-icons/md';

export default function SavedKundlisPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  const navigate = useNavigate();
  const [savedList, setSavedList] = useState<SavedKundli[]>(() => loadSavedKundlis());

  const handleDelete = (id: string) => {
    deleteKundli(id);
    setSavedList(loadSavedKundlis());
  };

  if (savedList.length === 0) {
    return (
      <div className="scroll-area" style={{ padding: '16px' }}>
        <KundliTabs active="saved" />
        <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
          <MdFolder size={40} color="var(--card-text-3)" style={{ marginBottom: '8px' }} />
          <div style={{ color: 'var(--card-text-2)', fontSize: '13px', lineHeight: '1.5' }}>
            {tr('emptySaved')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      <KundliTabs active="saved" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--card-text-3)' }}>{tr('savedKundlis')} ({savedList.length})</div>
        {savedList.map(entry => {
          const k = entry.kundli;
          return (
            <div key={entry.id} className="card" style={{ padding: '12px', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => navigate(kundliViewPath(entry.id))} style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--card-gold)' }}>{k.personName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--card-text-2)', marginTop: '2px' }}>
                    {k.localDateTime} · {k.placeName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    <span className="chip chip-gold" style={{ fontSize: '11px' }}>{tr('ascendant')} {k.ascendantRashiName}</span>
                    <span className="chip chip-neutral" style={{ fontSize: '11px' }}>{tr('moonSign')} {k.moonSignName}</span>
                    {k.dasha.currentMaha && (
                      <span className="chip chip-good" style={{ fontSize: '11px' }}>
                        {tr('mahadasha')} {k.dasha.currentMaha.lord}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  style={{ color: 'var(--danger)', padding: '8px', flexShrink: 0, display: 'flex' }}
                  aria-label={tr('delete')}
                >
                  <MdDelete size={22} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
