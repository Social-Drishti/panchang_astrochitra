import type { ReactNode } from 'react';
import {
  MdHome,
  MdBook,
  MdStar,
  MdMail,
  MdInsights,
  MdPerson,
  MdPersonOutline,
  MdFavorite,
  MdCalculate,
  MdForum,
  MdCalendarToday,
  MdWbSunny,
  MdAccessTime,
  MdPublic,
  MdSupportAgent,
  MdStorefront,
} from 'react-icons/md';

export type Page =
  | 'home'
  | 'journal'
  | 'dailyRashifal'
  | 'monthlyNewsletters'
  | 'insights'
  | 'kundli'
  | 'matchmaking'
  | 'mulankFinder'
  | 'askGuruji'
  | 'calendar'
  | 'panchang'
  | 'muhurta'
  | 'gochar'
  | 'account'
  | 'consultation'
  | 'store';

export interface NavItem {
  key: Page;
  icon?: ReactNode;
}

export interface NavGroup {
  id: string;
  main: Page;
  items: NavItem[];
}

export const PAGE_ICONS: Record<Page, ReactNode> = {
  home: <MdHome />,
  journal: <MdBook />,
  dailyRashifal: <MdStar />,
  monthlyNewsletters: <MdMail />,
  insights: <MdInsights />,
  kundli: <MdPerson />,
  matchmaking: <MdFavorite />,
  mulankFinder: <MdCalculate />,
  askGuruji: <MdForum />,
  calendar: <MdCalendarToday />,
  panchang: <MdWbSunny />,
  muhurta: <MdAccessTime />,
  gochar: <MdPublic />,
  account: <MdPersonOutline />,
  consultation: <MdSupportAgent />,
  store: <MdStorefront />,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'discover',
    main: 'home',
    items: [
      { key: 'home' },
      { key: 'journal' },
      { key: 'dailyRashifal' },
      { key: 'monthlyNewsletters' },
      { key: 'insights' },
    ],
  },
  {
    id: 'expertise',
    main: 'kundli',
    items: [
      { key: 'kundli' },
      { key: 'matchmaking' },
      { key: 'mulankFinder' },
      { key: 'askGuruji' },
    ],
  },
  {
    id: 'calendar',
    main: 'calendar',
    items: [
      { key: 'calendar' },
      { key: 'panchang' },
      { key: 'muhurta' },
      { key: 'gochar' },
    ],
  },
];

export const BOTTOM_NAV: Page[] = ['home', 'kundli', 'consultation', 'calendar', 'store'];

// Kundli is three screens rather than one page with internal tabs, so the
// chart viewer is addressable and the back button has something to return to.
export const KUNDLI_BASE = '/kundli';
export const KUNDLI_NEW = `${KUNDLI_BASE}/new`;
export const KUNDLI_SAVED = `${KUNDLI_BASE}/saved`;
export const KUNDLI_VIEW_BASE = `${KUNDLI_BASE}/view`;

export function kundliViewPath(id: string): string {
  return `${KUNDLI_VIEW_BASE}/${id}`;
}

// '/' is deliberately absent: it is the app entry point, not a page. The entry
// route restores the last visited page and falls back to '/home'.
export const PAGE_PATHS: Record<Page, string> = {
  home: '/home',
  journal: '/journal',
  dailyRashifal: '/daily-rashifal',
  monthlyNewsletters: '/monthly-newsletters',
  insights: '/insights',
  kundli: KUNDLI_NEW,
  matchmaking: '/matchmaking',
  mulankFinder: '/mulank-finder',
  askGuruji: '/ask-guruji',
  calendar: '/calendar',
  panchang: '/panchang',
  muhurta: '/muhurta',
  gochar: '/gochar',
  account: '/account',
  consultation: '/consultation',
  store: '/store',
};

const PATH_TO_PAGE: Record<string, Page> = Object.fromEntries(
  Object.entries(PAGE_PATHS).map(([page, path]) => [path, page as Page]),
);

export function pageFromPath(pathname: string): Page | undefined {
  // Every kundli sub-route stays on the 'kundli' page so the top menu highlight,
  // the bottom nav and the i18n label keep working across all three screens.
  // Bare '/kundli' (older bookmarks) is included; KundliRoutes redirects it to
  // the new-kundli form.
  if (pathname === KUNDLI_BASE || pathname.startsWith(`${KUNDLI_BASE}/`)) return 'kundli';
  return PATH_TO_PAGE[pathname];
}

export function groupForPage(page: Page): NavGroup | undefined {
  return NAV_GROUPS.find(g => g.items.some(i => i.key === page));
}