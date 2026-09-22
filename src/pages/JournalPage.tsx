import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdBook } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function JournalPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdBook />}
      title={tr('journal')}
      description={tr('comingSoon')}
    />
  );
}