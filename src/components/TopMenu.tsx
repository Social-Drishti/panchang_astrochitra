import type { ReactNode } from 'react';

export interface TopMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface TopMenuProps {
  items: TopMenuItem[];
  active: string;
  onSelect: (key: string) => void;
}

export default function TopMenu({ items, active, onSelect }: TopMenuProps) {
  return (
    <nav className="top-menu" aria-label="Page section menu">
      <div className="top-menu-scroll">
        {items.map(item => (
          <button
            key={item.key}
            className={`top-menu-item${item.key === active ? ' active' : ''}`}
            onClick={() => onSelect(item.key)}
          >
            {item.icon && <span className="top-menu-icon">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}