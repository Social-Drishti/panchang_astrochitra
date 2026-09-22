import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdInsights } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function InsightsPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdInsights />}
      title={tr('insights')}
      description={tr('comingSoon')}
    />
  );
}