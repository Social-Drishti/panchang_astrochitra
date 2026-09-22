import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdStar } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function DailyRashifalPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdStar />}
      title={tr('dailyRashifal')}
      description={tr('comingSoon')}
    />
  );
}