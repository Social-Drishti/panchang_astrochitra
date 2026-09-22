import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdSupportAgent } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function ConsultationPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdSupportAgent />}
      title={tr('consultation')}
      description={tr('comingSoon')}
    />
  );
}