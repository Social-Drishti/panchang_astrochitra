import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdForum } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function AskGurujiPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdForum />}
      title={tr('askGuruji')}
      description={tr('comingSoon')}
    />
  );
}