import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdCalculate } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function MulankFinderPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdCalculate />}
      title={tr('mulankFinder')}
      description={tr('comingSoon')}
    />
  );
}