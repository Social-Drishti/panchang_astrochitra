import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useI18n, type Lang } from './i18n';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { MdMenu, MdLanguage, MdMyLocation, MdLocationOn, MdPersonOutline } from 'react-icons/md';
import { locations } from './lib/locations';
import { PAGE_ICONS, BOTTOM_NAV, groupForPage, type Page } from './lib/navigation';

import HomePage from './pages/HomePage';
import PanchangPage from './pages/PanchangPage';
import MuhurtaPage from './pages/MuhurtaPage';
import GocharPage from './pages/GocharPage';
import KundliPage from './pages/KundliPage';
import CalendarPage from './pages/CalendarPage';
import JournalPage from './pages/JournalPage';
import DailyRashifalPage from './pages/DailyRashifalPage';
import MonthlyNewslettersPage from './pages/MonthlyNewslettersPage';
import InsightsPage from './pages/InsightsPage';
import MatchmakingPage from './pages/MatchmakingPage';
import MulankFinderPage from './pages/MulankFinderPage';
import AskGurujiPage from './pages/AskGurujiPage';
import AccountPage from './pages/AccountPage';
import ConsultationPage from './pages/ConsultationPage';
import StorePage from './pages/StorePage';
import TopMenu from './components/TopMenu';
import PWAInstallManager from './components/PWAInstallManager';

interface NavContextType {
  navigate: (page: Page) => void;
  currentPage: Page;
}

const NavContext = createContext<NavContextType | null>(null);

export function useNavigation() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNavigation must be used within NavProvider');
  return ctx;
}

function LocationBar() {
  const { lang, location, setLocation, useGps, gpsLoading } = useApp();
  const { tr } = useI18n(lang);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 12px', background: '#fbf7f0',
      borderBottom: '1px solid var(--border)', flexShrink: 0,
      minHeight: '36px',
    }}>
      {gpsLoading ? (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tr('loading')}</span>
      ) : useGps ? (
        <>
          <MdMyLocation size={14} color="var(--gold)" />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {location.lat.toFixed(2)}&deg;, {location.lon.toFixed(2)}&deg;
          </span>
        </>
      ) : (
        <>
          <MdLocationOn size={14} color="var(--olive)" />
          <select
            value={location.name}
            onChange={(e) => {
              const loc = locations.find(l => l.name === e.target.value);
              if (loc) setLocation(loc);
            }}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: '13px', fontWeight: 500, padding: '2px 0', outline: 'none',
              color: 'var(--text)', cursor: 'pointer',
            }}
          >
            {locations.map(l => (
              <option key={l.name} value={l.name}>{l.name}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}

function AppShell() {
  const { lang, setLang, location, setLocation, useGps, setUseGps, gpsLoading, gpsError, isOnline } = useApp();
  const { tr } = useI18n(lang);
  const [page, setPage] = useState<Page>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const navigate = (targetPage: Page) => {
    setPage(targetPage);
    setDrawerOpen(false);
  };

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage onOpenMenu={() => setDrawerOpen(true)} />;
      case 'panchang': return <PanchangPage />;
      case 'muhurta': return <MuhurtaPage />;
      case 'gochar': return <GocharPage />;
      case 'kundli': return <KundliPage />;
      case 'calendar': return <CalendarPage />;
      case 'journal': return <JournalPage />;
      case 'dailyRashifal': return <DailyRashifalPage />;
      case 'monthlyNewsletters': return <MonthlyNewslettersPage />;
      case 'insights': return <InsightsPage />;
      case 'matchmaking': return <MatchmakingPage />;
      case 'mulankFinder': return <MulankFinderPage />;
      case 'askGuruji': return <AskGurujiPage />;
      case 'account': return <AccountPage />;
      case 'consultation': return <ConsultationPage />;
      case 'store': return <StorePage />;
    }
  };

  const group = groupForPage(page);

  const topMenu = group ? (
    <TopMenu
      items={group.items.map(i => ({ key: i.key, label: tr(i.key), icon: PAGE_ICONS[i.key] }))}
      active={page}
      onSelect={(key) => navigate(key as Page)}
    />
  ) : null;

  const languages: { key: Lang; label: string }[] = [
    { key: 'en', label: 'English' },
    { key: 'hi', label: 'Hindi' },
    { key: 'mr', label: 'Marathi' },
  ];

  return (
    <MotionConfig reducedMotion="user">
    <NavContext.Provider value={{ navigate, currentPage: page }}>
      <>
        <AnimatePresence>
        {splash && (
          <motion.div
            className="splash-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img src="/icons/icon-512x512.png" alt="Panchang" className="splash-logo" />
            <div className="splash-text">{tr('appName')}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <PWAInstallManager />

      {!isOnline && (
        <div className="offline-badge">
          <span>{tr('offline')}</span>
        </div>
      )}

      {page !== 'home' && (
        <header className="header">
          <div className="header-left">
            <button onClick={() => setDrawerOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
              <MdMenu size={24} color="var(--olive)" />
            </button>
          </div>
          <div className="header-brand">Panchang</div>
          <div className="header-right">
            <button onClick={() => navigate('account')} className="header-user-btn" aria-label={tr('account')}>
              <MdPersonOutline size={22} color="var(--olive)" />
            </button>
          </div>
        </header>
      )}

      {page !== 'kundli' && page !== 'home' && page !== 'account' && <LocationBar />}

      <main className="main-content">
        {page !== 'home' && topMenu}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            className="page-transition"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="bottom-nav">
        {BOTTOM_NAV.map(itemKey => (
          <button
            key={itemKey}
            className={`nav-item ${page === itemKey ? 'active' : ''}`}
            onClick={() => navigate(itemKey)}
          >
            <motion.div
              className="nav-active-pill"
              layoutId="nav-pill"
              initial={false}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              style={{ opacity: page === itemKey ? 1 : 0 }}
            />
            {PAGE_ICONS[itemKey]}
            <span>{tr(itemKey)}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <div className="drawer-header">Panchang</div>
              <div className="drawer-body">
                <div className="drawer-divider" />
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {tr('language')}
                </div>
                {languages.map(l => (
                  <div
                    key={l.key}
                    className="drawer-item"
                    onClick={() => { setLang(l.key); setDrawerOpen(false); }}
                    style={lang === l.key ? { background: 'var(--bg)', fontWeight: 600 } : {}}
                  >
                    <MdLanguage />
                    <span>{l.label}</span>
                    {lang === l.key && <span style={{ marginLeft: 'auto', color: 'var(--gold)' }}>✓</span>}
                  </div>
                ))}

                <div className="drawer-divider" />
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {tr('location')}
                </div>
                <div className="drawer-item" onClick={() => setUseGps(!useGps)}>
                  <MdMyLocation />
                  <span style={{ flex: 1 }}>{tr('useMyLocation')}</span>
                  {gpsLoading ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tr('loading')}</span>
                  ) : (
                    <div className={`toggle ${useGps ? 'active' : ''}`}>
                      <div className="toggle-knob" />
                    </div>
                  )}
                </div>
                {gpsError && (
                  <div style={{ fontSize: '12px', color: 'var(--danger)', padding: '4px 8px' }}>{gpsError}</div>
                )}

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px', marginTop: '4px' }}>
                  {tr('savedLocation')}: {location.name}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </>
    </NavContext.Provider>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
