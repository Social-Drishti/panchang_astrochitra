import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdCalendarToday } from 'react-icons/md';
import PagePlaceholder from '../components/PagePlaceholder';

export default function CalendarPage() {
  const { lang } = useApp();
  const { tr } = useI18n(lang);
  return (
    <PagePlaceholder
      icon={<MdCalendarToday />}
      title={tr('calendar')}
      description={tr('comingSoon')}
    />
  );
}