import { useLocation, Navigate, Route, Routes } from 'react-router-dom';
import { KUNDLI_BASE, KUNDLI_NEW, KUNDLI_SAVED, KUNDLI_VIEW_BASE } from '../lib/navigation';
import KundliPage from './KundliPage';
import SavedKundlisPage from './SavedKundlisPage';
import KundliViewPage from './KundliViewPage';

function KundliFallback() {
  const { pathname } = useLocation();

  // Redirect bare '/kundli' (older bookmarks) and unknown kundli sub-paths to
  // the new-kundli form.
  //
  // The pathname guard is essential: during the page exit animation this
  // component stays mounted while the URL already points at the page being
  // entered. An unconditional <Navigate> here would match that non-kundli URL
  // and yank the user straight back to /kundli/new on every navigation away.
  if (pathname === KUNDLI_BASE || pathname.startsWith(`${KUNDLI_BASE}/`)) {
    return <Navigate to={KUNDLI_NEW} replace />;
  }
  return null;
}

// Absolute paths: this <Routes> is rendered from the page switch in AppShell
// rather than nested under a parent <Route>, so it matches the whole pathname.
export default function KundliRoutes() {
  return (
    <Routes>
      <Route path={KUNDLI_NEW} element={<KundliPage />} />
      <Route path={KUNDLI_SAVED} element={<SavedKundlisPage />} />
      <Route path={`${KUNDLI_VIEW_BASE}/:id`} element={<KundliViewPage />} />
      <Route path="*" element={<KundliFallback />} />
    </Routes>
  );
}