import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdStorefront } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function StorePage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdStorefront />}
      title={tr('store')}
      description={tr('comingSoon')}
    />
  );
}