import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdPersonOutline } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function AccountPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdPersonOutline />}
      title={tr('account')}
      description={tr('comingSoon')}
    />
  );
}