import { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { MdCalendarMonth, MdSchedule } from 'react-icons/md';

export interface DobParts {
  d: string;
  m: string;
  y: string;
}

export interface TobParts {
  h: string;
  min: string;
}

interface Props {
  dob: DobParts;
  tob: TobParts;
  ampm: 'AM' | 'PM';
  dateValue: string;
  timeValue: string;
  onDobChange: (v: DobParts) => void;
  onTobChange: (v: TobParts) => void;
  onAmpmChange: (v: 'AM' | 'PM') => void;
}

const MAX_LEN: Record<string, number> = { d: 2, m: 2, y: 4, h: 2, min: 2 };

export default function BirthDateTimeFields({
  dob,
  tob,
  ampm,
  dateValue,
  timeValue,
  onDobChange,
  onTobChange,
  onAmpmChange,
}: Props) {
  const { lang } = useApp();
  const { tr } = useI18n(lang);

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const hourRef = useRef<HTMLInputElement>(null);
  const minRef = useRef<HTMLInputElement>(null);
  const startedFull = useRef<Record<string, boolean>>({});

  const digits = (raw: string, maxLen: number) => raw.replace(/\D/g, '').slice(0, maxLen);

  const noteStart = (key: string) => (e: React.FocusEvent<HTMLInputElement>) => {
    startedFull.current[key] = e.target.value.replace(/\D/g, '').length >= (MAX_LEN[key] ?? 2);
  };

  const advance = (key: string, nextRef: React.RefObject<HTMLInputElement | null>) => (raw: string) => {
    if (!startedFull.current[key] && raw.length >= (MAX_LEN[key] ?? 2)) nextRef.current?.focus();
  };

  const handleDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!v) return;
    const [y, m, d] = v.split('-');
    if (y && m && d) onDobChange({ d, m, y });
  };

  const handleTimePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!v) return;
    const [h24, min] = v.split(':');
    if (h24 === undefined || min === undefined) return;
    const h = Number(h24) % 12;
    onTobChange({ h: String(h === 0 ? 12 : h), min });
    onAmpmChange(Number(h24) >= 12 ? 'PM' : 'AM');
  };

  const numStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '10px 4px',
    minWidth: 0,
    flex: 1,
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', color: 'var(--card-text-3)' }}>{tr('dateOfBirth')}</label>
        <div className="dt-row">
          <input
            ref={dayRef}
            type="number"
            className="dt-num"
            inputMode="numeric"
            min={1}
            max={31}
            placeholder="DD"
            aria-label={tr('day')}
            value={dob.d}
            onFocus={noteStart('d')}
            onChange={e => {
              const raw = digits(e.target.value, 2);
              onDobChange({ ...dob, d: raw });
              advance('d', monthRef)(raw);
            }}
            style={numStyle}
          />
          <span className="dt-sep">/</span>
          <input
            ref={monthRef}
            type="number"
            className="dt-num"
            inputMode="numeric"
            min={1}
            max={12}
            placeholder="MM"
            aria-label={tr('month')}
            value={dob.m}
            onFocus={noteStart('m')}
            onChange={e => {
              const raw = digits(e.target.value, 2);
              onDobChange({ ...dob, m: raw });
              advance('m', yearRef)(raw);
            }}
            style={numStyle}
          />
          <span className="dt-sep">/</span>
          <input
            ref={yearRef}
            type="number"
            className="dt-num dt-year"
            inputMode="numeric"
            min={1000}
            max={9999}
            placeholder="YYYY"
            aria-label={tr('year')}
            value={dob.y}
            onFocus={noteStart('y')}
            onChange={e => {
              onDobChange({ ...dob, y: digits(e.target.value, 4) });
            }}
            style={numStyle}
          />
          <label className="dt-picker" aria-label={tr('dateOfBirth')}>
            <MdCalendarMonth size={20} color="var(--gold)" />
            <input type="date" className="dt-picker-input" value={dateValue} onChange={handleDatePick} tabIndex={-1} />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', color: 'var(--card-text-3)' }}>{tr('timeOfBirth')}</label>
        <div className="dt-row">
          <input
            ref={hourRef}
            type="number"
            className="dt-num"
            inputMode="numeric"
            min={1}
            max={12}
            placeholder="HH"
            aria-label={tr('hour')}
            value={tob.h}
            onFocus={noteStart('h')}
            onChange={e => {
              const raw = digits(e.target.value, 2);
              onTobChange({ ...tob, h: raw });
              advance('h', minRef)(raw);
            }}
            style={numStyle}
          />
          <span className="dt-sep">:</span>
          <input
            ref={minRef}
            type="number"
            className="dt-num"
            inputMode="numeric"
            min={0}
            max={59}
            placeholder="MM"
            aria-label={tr('minute')}
            value={tob.min}
            onFocus={noteStart('min')}
            onChange={e => {
              onTobChange({ ...tob, min: digits(e.target.value, 2) });
            }}
            style={numStyle}
          />
          <div className="dt-ampm">
            <button
              type="button"
              className={ampm === 'AM' ? 'active' : ''}
              onClick={() => onAmpmChange('AM')}
              aria-pressed={ampm === 'AM'}
            >
              {tr('am')}
            </button>
            <button
              type="button"
              className={ampm === 'PM' ? 'active' : ''}
              onClick={() => onAmpmChange('PM')}
              aria-pressed={ampm === 'PM'}
            >
              {tr('pm')}
            </button>
          </div>
          <label className="dt-picker" aria-label={tr('timeOfBirth')}>
            <MdSchedule size={20} color="var(--gold)" />
            <input type="time" className="dt-picker-input" value={timeValue} onChange={handleTimePick} tabIndex={-1} />
          </label>
        </div>
      </div>
    </>
  );
}