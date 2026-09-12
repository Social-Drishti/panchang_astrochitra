import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../App';
import { getPanchang, type PanchangData } from '../lib/panchang';
import {
  MdMenu,
  MdWbSunny,
  MdAccessTime,
  MdPublic,
  MdPerson,
  MdFavorite,
  MdCalendarToday,
  MdLocationOn,
  MdChevronRight,
  MdArrowForward,
  MdAutoAwesome,
} from 'react-icons/md';

interface HomePageProps {
  onOpenMenu: () => void;
}

const SUN_RAYS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

const HomePage: React.FC<HomePageProps> = ({ onOpenMenu }) => {
  const { lang, location, selectedDate } = useApp();
  const { tr } = useI18n(lang);
  const { navigate } = useNavigation();
  const [glance, setGlance] = useState<PanchangData | null>(null);

  useEffect(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    setGlance(getPanchang(d, location.lat, location.lon));
  }, [selectedDate, location]);

  const shortDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString(
    lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN',
    { weekday: 'short', day: 'numeric', month: 'short' }
  );

  const features = [
    {
      cls: 'fc-panchang',
      icon: <MdWbSunny />,
      title: 'dailyPanchang',
      desc: 'dailyPanchangDesc',
      onClick: () => navigate('panchang'),
    },
    {
      cls: 'fc-muhurta',
      icon: <MdAccessTime />,
      title: 'muhurta',
      desc: 'muhurtaDesc',
      onClick: () => navigate('muhurta'),
    },
    {
      cls: 'fc-gochar',
      icon: <MdPublic />,
      title: 'gochar',
      desc: 'gocharDesc',
      onClick: () => navigate('gochar'),
    },
    {
      cls: 'fc-saved',
      icon: <MdFavorite />,
      title: 'savedCharts',
      desc: 'savedChartsDesc',
      onClick: () => navigate('kundli'),
    },
    {
      cls: 'fc-kundli fc-wide',
      icon: <MdPerson />,
      title: 'kundliCreation',
      desc: 'kundliCreationDesc',
      onClick: () => navigate('kundli'),
    },
  ];

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-sun" aria-hidden="true">
          <svg viewBox="0 0 200 200" width="160" height="160">
            <circle cx="100" cy="100" r="46" fill="rgba(255, 233, 184, 0.92)" />
            <circle cx="100" cy="100" r="68" fill="none" stroke="rgba(255, 233, 184, 0.35)" strokeWidth="2" strokeDasharray="3 7" />
            {SUN_RAYS.map((a) => (
              <rect key={a} x="97" y="6" width="6" height="22" rx="3" fill="rgba(255, 233, 184, 0.6)" transform={`rotate(${a} 100 100)`} />
            ))}
          </svg>
        </div>

        <div className="hero-top">
          <button className="hero-menu-btn" onClick={onOpenMenu} aria-label="Menu">
            <MdMenu size={22} />
          </button>
          <img src="/icons/icon-96x96.png" alt="Panchang" className="hero-logo" />
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
        <button className="today-card" onClick={() => navigate('panchang')}>
          <div className="today-header">
            <span className="today-label">
              <MdAutoAwesome size={17} />
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

        <section className="features">
          <div className="features-head">
            <h2>{tr('features')}</h2>
          </div>
          <div className="feature-grid">
            {features.map((f) => (
              <button key={f.title} className={`feature-card ${f.cls}`} onClick={f.onClick}>
                <span className="fc-icon">{f.icon}</span>
                <h3>{tr(f.title)}</h3>
                <p>{tr(f.desc)}</p>
                <span className="fc-foot">
                  {tr('explore')}
                  <MdArrowForward size={15} />
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;