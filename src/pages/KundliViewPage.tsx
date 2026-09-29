import { useMemo, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { loadDraft, loadSavedKundlis, saveKundli, clearDraft, type SavedKundliInput } from '../lib/kundliStorage';
import { KUNDLI_NEW, KUNDLI_SAVED } from '../lib/navigation';
import KundliView from '../components/KundliView';
import { MdArrowBack } from 'react-icons/md';

export default function KundliViewPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  const navigate = useNavigate();

  // A generated chart lives in the draft slot until it is saved; after that the
  // same id resolves out of the saved list. Anything else is a stale link.
  const source = useMemo<{ entry: SavedKundliInput; fromDraft: boolean } | null>(() => {
    if (!id) return null;
    const draft = loadDraft();
    if (draft && draft.id === id) return { entry: draft.entry, fromDraft: true };
    const found = loadSavedKundlis().find(e => e.id === id);
    return found ? { entry: found, fromDraft: false } : null;
  }, [id]);

  // Saving promotes the draft into the saved list, which flips where Back leads
  // and turns the button into "update" — so both live in state, not the memo.
  const [fromDraft, setFromDraft] = useState(() => source?.fromDraft ?? false);
  const [isSaved, setIsSaved] = useState(() => !!id && loadSavedKundlis().some(e => e.id === id));

  if (!source) return <Navigate to={KUNDLI_NEW} replace />;

  const backTo = fromDraft ? KUNDLI_NEW : KUNDLI_SAVED;

  const handleBack = () => {
    // Replace rather than push: pushing would leave the viewer in the stack and
    // the hardware back button would bounce straight back into it.
    navigate(backTo, { replace: true });
  };

  const handleSave = () => {
    if (!fromDraft) return;
    saveKundli(source.entry);
    clearDraft();
    setFromDraft(false);
    setIsSaved(true);
  };

  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      <button
        onClick={handleBack}
        style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--olive)', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}
      >
        <MdArrowBack size={16} /> {fromDraft ? tr('newAdjustments') : tr('backToList')}
      </button>

      <KundliView
        kundli={source.entry.kundli}
        saved={isSaved}
        onSave={fromDraft ? handleSave : undefined}
      />
    </div>
  );
}
