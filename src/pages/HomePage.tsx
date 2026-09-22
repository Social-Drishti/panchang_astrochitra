import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../App';
import { getPanchang, type PanchangData } from '../lib/panchang';
import { computeSky, getMoonGeometry, type SkyState, type SkyEventTimes } from '../lib/dayPhase';
import SkyScene from '../components/SkyScene';
import type { Page } from '../lib/navigation';
import {
  MdMenu,
  MdWbSunny,
  MdAccessTime,
  MdPublic,
  MdPerson,
  MdPersonOutline,
  MdFavorite,
  MdCalendarToday,
  MdLocationOn,
  MdChevronRight,
  MdArrowOutward,
  MdStar,
  MdMail,
  MdBook,
  MdInsights,
  MdCalculate,
  MdForum,
  MdSupportAgent,
} from 'react-icons/md';

interface HomePageProps {
  onOpenMenu: () => void;
}

const PHASE_OVERRIDES: Record<'dawn' | 'day' | 'dusk' | 'night', SkyState> = {
  dawn: { phase: 'dawn', dayness: 0.5, twilight: 1, sunHeight: 0.16, sunVisibility: 1, moonVisibility: 0.3 },
  day: { phase: 'day', dayness: 1, twilight: 0, sunHeight: 0.85, sunVisibility: 1, moonVisibility: 0 },
  dusk: { phase: 'dusk', dayness: 0.42, twilight: 1, sunHeight: 0.3, sunVisibility: 1, moonVisibility: 0.3 },
  night: { phase: 'night', dayness: 0, twilight: 0, sunHeight: 0, sunVisibility: 0, moonVisibility: 1 },
};

interface RowItem {
  key: Page;
  cls: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const HomePage: React.FC<HomePageProps> = ({ onOpenMenu }) => {
  const { lang, location, selectedDate } = useApp();
  const { tr } = useI18n(lang);
  const { navigate } = useNavigation();
  const [glance, setGlance] = useState<PanchangData | null>(null);

  useEffect(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    setGlance(getPanchang(d, location.lat, location.lon));
  }, [selectedDate, location]);

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    const onVisible = () => setNow(Date.now());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const todayEvents = useMemo<SkyEventTimes | null>(() => {
    try {
      const p = getPanchang(new Date(), location.lat, location.lon);
      if (p.sunEvents?.sunrise && p.sunEvents?.sunset) {
        return { sunrise: p.sunEvents.sunrise, sunset: p.sunEvents.sunset };
      }
    } catch { /* fall back to device-clock bands */ }
    return null;
  }, [location]);

  const skyState = useMemo<SkyState>(() => {
    const params = new URLSearchParams(window.location.search);
    const ov = params.get('phase');
    if (ov === 'dawn' || ov === 'day' || ov === 'dusk' || ov === 'night') {
      return PHASE_OVERRIDES[ov];
    }
    return computeSky(now, todayEvents);
  }, [now, todayEvents]);

  const moon = useMemo(() => getMoonGeometry(now), [now]);

  const shortDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(
    lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN',
    { weekday: 'short', day: 'numeric', month: 'short' }
  );

  const sections: { num: string; title: string; items: RowItem[] }[] = [
    {
      num: '02',
      title: tr('essentials'),
      items: [
        { key: 'panchang', cls: 'fc-panchang', icon: <MdWbSunny />, title: tr('dailyPanchang'), desc: tr('dailyPanchangDesc') },
        { key: 'muhurta', cls: 'fc-muhurta', icon: <MdAccessTime />, title: tr('muhurta'), desc: tr('muhurtaDesc') },
        { key: 'gochar', cls: 'fc-gochar', icon: <MdPublic />, title: tr('gochar'), desc: tr('gocharDesc') },
      ],
    },
    {
      num: '03',
      title: tr('readingRoom'),
      items: [
        { key: 'dailyRashifal', cls: 'fc-rashifal', icon: <MdStar />, title: tr('dailyRashifal'), desc: tr('dailyRashifalDesc') },
        { key: 'monthlyNewsletters', cls: 'fc-newsletter', icon: <MdMail />, title: tr('monthlyNewsletters'), desc: tr('monthlyNewslettersDesc') },
        { key: 'journal', cls: 'fc-journal', icon: <MdBook />, title: tr('journal'), desc: tr('journalDesc') },
        { key: 'insights', cls: 'fc-insights', icon: <MdInsights />, title: tr('insights'), desc: tr('insightsDesc') },
      ],
    },
    {
      num: '04',
      title: tr('vedicServices'),
      items: [
        { key: 'kundli', cls: 'fc-kundli', icon: <MdPerson />, title: tr('kundliCreation'), desc: tr('kundliCreationDesc') },
        { key: 'matchmaking', cls: 'fc-match', icon: <MdFavorite />, title: tr('matchmaking'), desc: tr('matchmakingDesc') },
        { key: 'mulankFinder', cls: 'fc-mulank', icon: <MdCalculate />, title: tr('mulankFinder'), desc: tr('mulankFinderDesc') },
        { key: 'askGuruji', cls: 'fc-guruji', icon: <MdForum />, title: tr('askGuruji'), desc: tr('askGurujiDesc') },
      ],
    },
    {
      num: '05',
      title: tr('planAhead'),
      items: [
        { key: 'calendar', cls: 'fc-calendar', icon: <MdCalendarToday />, title: tr('calendar'), desc: tr('calendarDesc') },
        { key: 'consultation', cls: 'fc-consult', icon: <MdSupportAgent />, title: tr('consultation'), desc: tr('consultationDesc') },
      ],
    },
  ];

  let rowIndex = 1;

  return (
    <div className="home-page">
      <div className="home-hero">
        <SkyScene state={skyState} moon={moon} />

        <div className="hero-top">
          <button className="hero-menu-btn" onClick={onOpenMenu} aria-label="Menu">
            <MdMenu size={22} />
          </button>
          <button className="hero-user-btn" onClick={() => navigate('account')} aria-label={tr('account')}>
            <MdPersonOutline size={22} />
          </button>
        </div>

        <h1 className="hero-title">{tr('appName')}</h1>
        <p className="hero-subtitle">{tr('welcomeSubtitle')}</p>

        <div className="hero-chips">
          <span className="hero-chip">
            <MdLocationOn size={15} />
            {location.name}
          </span>
          <span className="hero-chip">
            <MdCalendarToday size={15} />
            {shortDate}
          </span>
        </div>
      </div>

      <div className="home-content">
        <section className="ed-section">
          <div className="ed-head">
            <span className="ed-num">01</span>
            <h2 className="ed-title">{tr('today')}</h2>
            <span className="ed-line" />
          </div>

          <button className="today-card" onClick={() => navigate('panchang')}>
            <div className="today-header">
              <span className="today-label">
                <MdWbSunny size={17} />
                {tr('todayPanchang')}
              </span>
              <MdChevronRight size={22} />
            </div>

            {glance ? (
              <div className="today-grid">
                <div className="today-item">
                  <span className="t-label">{tr('tithi')}</span>
                  <span className="t-value">{glance.tithi}</span>
                </div>
                <div className="today-item">
                  <span className="t-label">{tr('nakshatra')}</span>
                  <span className="t-value">{glance.nakshatra}</span>
                </div>
                <div className="today-item">
                  <span className="t-label">{tr('sunrise')}</span>
                  <span className="t-value">{glance.sunrise || '--:--'}</span>
                </div>
                <div className="today-item">
                  <span className="t-label">{tr('sunset')}</span>
                  <span className="t-value">{glance.sunset || '--:--'}</span>
                </div>
              </div>
            ) : (
              <div className="today-grid">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="today-item shimmer" style={{ height: 36, borderRadius: 10 }} />
                ))}
              </div>
            )}
          </button>
        </section>

        {sections.map(section => (
          <section key={section.num} className="ed-section">
            <div className="ed-head">
              <span className="ed-num">{section.num}</span>
              <h2 className="ed-title">{section.title}</h2>
              <span className="ed-line" />
            </div>

            <div className="ed-list">
              {section.items.map(item => {
                const idx = String(++rowIndex).padStart(2, '0');
                return (
                  <button key={item.key} className={`feature-card fc-row ${item.cls}`} onClick={() => navigate(item.key)}>
                    <span className="fc-index">{idx}</span>
                    <span className="fc-icon">{item.icon}</span>
                    <span className="fc-body">
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                    </span>
                    <MdArrowOutward className="fc-arrow" />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default HomePage;