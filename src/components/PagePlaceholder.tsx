import type { ReactNode } from 'react';

interface PagePlaceholderProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function PagePlaceholder({ icon, title, description }: PagePlaceholderProps) {
  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div className="placeholder-icon">{icon}</div>
        <h2 className="placeholder-title">{title}</h2>
        <p className="placeholder-desc">{description}</p>
      </div>
      <div style={{ height: '80px' }} />
    </div>
  );
}