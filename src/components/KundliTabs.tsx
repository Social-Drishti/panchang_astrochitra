import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { loadSavedKundlis } from '../lib/kundliStorage';
import { KUNDLI_NEW, KUNDLI_SAVED } from '../lib/navigation';
import { MdNoteAdd, MdFolder } from 'react-icons/md';

export type KundliSection = 'new' | 'saved';

interface KundliTabsProps {
  active: KundliSection;
}

export default function KundliTabs({ active }: KundliTabsProps) {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  const navigate = useNavigate();
  const savedCount = loadSavedKundlis().length;

  return (
    <div className="k-tabs">
      <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: 0 }}>
        <button className={`k-tab${active === 'new' ? ' active' : ''}`} onClick={() => navigate(KUNDLI_NEW)}>
          <MdNoteAdd size={18} />
          <span>{tr('newKundli')}</span>
        </button>
        <button className={`k-tab${active === 'saved' ? ' active' : ''}`} onClick={() => navigate(KUNDLI_SAVED)}>
          <MdFolder size={18} />
          <span>{tr('savedKundlis')}</span>
          {savedCount > 0 && <span className="k-tab-count">{savedCount}</span>}
        </button>
      </div>
    </div>
  );
}
