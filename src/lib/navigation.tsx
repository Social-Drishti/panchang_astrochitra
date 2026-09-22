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

export function groupForPage(page: Page): NavGroup | undefined {
  return NAV_GROUPS.find(g => g.items.some(i => i.key === page));
}