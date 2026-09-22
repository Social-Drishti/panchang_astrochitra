import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdMail } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function MonthlyNewslettersPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdMail />}
      title={tr('monthlyNewsletters')}
      description={tr('comingSoon')}
    />
  );
}