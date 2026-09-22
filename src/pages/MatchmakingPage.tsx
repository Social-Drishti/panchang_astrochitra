import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdFavorite } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function MatchmakingPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdFavorite />}
      title={tr('matchmaking')}
      description={tr('comingSoon')}
    />
  );
}