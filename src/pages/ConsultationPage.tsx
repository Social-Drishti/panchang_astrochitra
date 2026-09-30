import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import BirthDateTimeFields from '../components/BirthDateTimeFields';
import PlaceSearch from '../components/PlaceSearch';
import type { GeoResult } from '../lib/geocode';
import { locations } from '../lib/locations';
import {
  ConsultationError,
  fetchConsultationProfile,
  flushPendingLead,
  loadPendingLead,
  registerConsultation,
  savePendingLead,
  syncConsultation,
  clearPendingLead,
  type ConsultationAppointment,
  type ConsultationProfile,
  type ConsultationSyncResult,
} from '../lib/consultation';
import {
  MdSupportAgent,
  MdCheckCircle,
  MdVideocam,
  MdLocationOn,
  MdEvent,
  MdRefresh,
  MdSchedule,
  MdPhone,
  MdStarBorder,
} from 'react-icons/md';

const DEFAULT_PLACE: GeoResult = {
  lat: locations[0]!.lat,
  lon: locations[0]!.lon,
  displayName: locations[0]!.name,
};

const INTL_LOCALE: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };

/** Fills the `{token}` placeholders used by the consultation strings. */
function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole
  );
}

/** Accepts 10-15 digits, with an optional country code. */
function isValidPhone(raw: string): boolean {
  const trimmed = raw.trim();
  if (!/^\+?[\d\s()-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function formatDate(value: string, lang: string): string {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  // Built from parts rather than new Date(value) so a UTC parse cannot shift
  // the calendar day for users west of Greenwich.
  const when = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(INTL_LOCALE[lang] ?? 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(when);
}

function formatSyncedAt(value: string | null, lang: string): string {
  if (!value) return '';
  const when = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
  if (Number.isNaN(when.getTime())) return '';
  return new Intl.DateTimeFormat(INTL_LOCALE[lang] ?? 'en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(when);
}

function statusChipClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'completed') return 'chip chip-good';
  if (s === 'cancelled' || s === 'rejected') return 'chip chip-bad';
  return 'chip chip-neutral';
}

function appointmentKey(appt: ConsultationAppointment, index: number): string {
  return `${appt.kind}-${appt.date}-${appt.time}-${appt.id || index}`;
}

export default function ConsultationPage() {
  const { lang, isOnline } = useApp();
  const { tr } = useI18n(lang);

  const [profile, setProfile] = useState<ConsultationProfile | null>(null);
  const [sync, setSync] = useState<ConsultationSyncResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stale, setStale] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showBirth, setShowBirth] = useState(false);
  const [dob, setDob] = useState({ d: '', m: '', y: '' });
  const [tob, setTob] = useState({ h: '', min: '' });
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [place, setPlace] = useState<GeoResult | null>(null);
  const [question, setQuestion] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [queued, setQueued] = useState(false);

  const birthDate = useMemo(() => {
    const d = Number(dob.d);
    const m = Number(dob.m);
    const y = Number(dob.y);
    if (!dob.d || !dob.m || !dob.y || !d || !m || !y || y < 1000) return '';
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }, [dob]);

  const birthTime = useMemo(() => {
    const h = Number(tob.h);
    const min = Number(tob.min);
    if (!tob.h || !tob.min || h < 1 || h > 12 || min < 0 || min > 59) return '';
    const h24 = ampm === 'PM' ? (h % 12) + 12 : h % 12;
    return `${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }, [tob, ampm]);

  const runSync = useCallback(
    async (options: { force?: boolean } = {}) => {
      setSyncing(true);
      try {
        const result = await syncConsultation(options);
        setSync(result);
        setProfile(result.profile);
        setStale(result.stale);
        return result;
      } catch (e) {
        if (e instanceof ConsultationError && e.code === 'not_registered') {
          setProfile(null);
          setSync(null);
        } else if (e instanceof ConsultationError) {
          setStale(true);
        }
        return null;
      } finally {
        setSyncing(false);
      }
    },
    []
);

  // First load: an existing lead goes straight to its history, otherwise the form.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const existing = await fetchConsultationProfile();
      if (cancelled) return;
      if (existing) {
        setProfile(existing);
        await runSync();
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [runSync]);

  // Reconnects drain the queued lead first, then refresh the history so a
  // freshly attached Meet link appears without the user having to reload.
  useEffect(() => {
    if (!isOnline) return;
    const pending = loadPendingLead();
    if (!pending) return;
    void (async () => {
      const { sent, profile: flushed } = await flushPendingLead();
      if (!sent) return;
      setQueued(false);
      setJustSubmitted(true);
      if (flushed) setProfile(flushed);
      setName('');
      setPhone('');
      await runSync({ force: true });
    })();
  }, [isOnline, runSync]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setFieldError(tr('consultErrName'));
      return;
    }
    if (!isValidPhone(trimmedPhone)) {
      setFieldError(tr('consultErrPhone'));
      return;
    }

    setFieldError(null);
    setError(null);
    setSubmitting(true);

    const lead = {
      name: trimmedName,
      phone: trimmedPhone,
      email: undefined,
      date_of_birth: birthDate || undefined,
      birth_time: birthTime || undefined,
      birth_place: showBirth ? place?.displayName || undefined : undefined,
      question: question.trim() || undefined,
    };

    try {
      const result = await registerConsultation(lead);
      clearPendingLead();
      setQueued(false);
      setJustSubmitted(true);
      setProfile(result.profile);
      setQuestion('');
      await runSync();
    } catch (e) {
      if (e instanceof ConsultationError && e.code === 'phone_taken') {
        setError(tr('consultErrPhoneTaken'));
      } else if (e instanceof ConsultationError && e.retryable) {
        // Keep the lead locally so it is not lost while the device is offline.
        savePendingLead(lead);
        setQueued(true);
        setError(tr('consultErrRetryable'));
      } else if (e instanceof ConsultationError) {
        setError(e.message || tr('consultErrGeneric'));
      } else {
        setError(tr('consultErrGeneric'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const upcoming = sync?.appointments.upcoming ?? [];
  const past = sync?.appointments.past ?? [];
  const upcomingActive = upcoming.filter(a => a.status.toLowerCase() !== 'completed');
  const nextSession = upcomingActive[0] ?? null;
  const latestCompleted = [...past].reverse().find(a => a.status.toLowerCase() === 'completed');

  if (loading) {
    return (
      <div className="scroll-area" style={{ padding: '16px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
          <MdSchedule size={36} color="var(--card-text-3)" />
        </div>
      </div>
    );
  }

  /* ------------------------- registered: history ------------------------- */
  if (profile) {
    return (
      <div className="scroll-area" style={{ padding: '16px' }}>
        {stale && (
          <div
            className="card"
            style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'var(--bg-card)' }}
          >
            <MdPhone size={20} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: '1.5' }}>{tr('consultStale')}</div>
          </div>
        )}

        <div className="card">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdSupportAgent size={20} color="var(--gold)" />
            {tr('consultYourDetails')}
          </div>

          <div className="field-grid">
            <div className="field-item">
              <div className="field-label">{tr('consultYourName')}</div>
              <div className="field-value">{profile.name}</div>
            </div>
            <div className="field-item">
              <div className="field-label">{tr('consultPhone')}</div>
              <div className="field-value">{profile.phone}</div>
            </div>
            {profile.date_of_birth && (
              <div className="field-item">
                <div className="field-label">{tr('consultBirthDetails')}</div>
                <div className="field-value">
                  {profile.date_of_birth}
                  {profile.birth_time ? ` · ${profile.birth_time}` : ''}
                </div>
              </div>
            )}
            {profile.birth_place && (
              <div className="field-item">
                <div className="field-label">{tr('place')}</div>
                <div className="field-value">{profile.birth_place}</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
            {profile.status === 'linked' ? (
              <span className="chip chip-good" style={{ fontSize: '11px' }}>{tr('consultUpcoming')}</span>
            ) : profile.status === 'failed' ? (
              <span className="chip chip-bad" style={{ fontSize: '11px' }}>{tr('consultStatus')}</span>
            ) : (
              <span className="chip chip-neutral" style={{ fontSize: '11px' }}>{tr('consultPending')}</span>
            )}
          </div>

          {profile.status === 'pending' && (
            <p style={{ fontSize: '12px', color: 'var(--card-text-2)', lineHeight: '1.5', margin: '12px 0 0' }}>
              {tr('consultPending')}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '14px' }}>
            <span style={{ fontSize: '11px', color: 'var(--card-text-3)' }}>
              {sync?.synced_at ? fill(tr('consultSynced'), { when: formatSyncedAt(sync.synced_at, lang) }) : ''}
            </span>
            <button className="btn btn-outline" onClick={() => void runSync({ force: true })} disabled={syncing} style={{ padding: '8px 14px', fontSize: '13px' }}>
              <MdRefresh size={16} />
              {tr('refresh')}
            </button>
          </div>
        </div>

        {nextSession ? (
          <div className="card" style={{ borderColor: 'var(--gold-light)' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdStarBorder size={20} color="var(--gold)" />
              {tr('consultNextSession')}
            </div>
            <AppointmentRow appt={nextSession} tr={tr} lang={lang} />
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <MdEvent size={34} color="var(--card-text-3)" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--card-text)' }}>{tr('consultNoUpcoming')}</div>
            <div style={{ fontSize: '12px', color: 'var(--card-text-2)', lineHeight: '1.5', marginTop: '6px' }}>
              {tr('consultNoUpcomingBody')}
            </div>
          </div>
        )}

        {upcomingActive.length > 1 && (
          <div className="card">
            <div className="card-title">{tr('consultUpcoming')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingActive.slice(1).map((appt, i) => (
                <AppointmentRow key={appointmentKey(appt, i)} appt={appt} tr={tr} lang={lang} />
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-title">{tr('consultPast')}</div>
          {past.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--card-text-3)' }}>{tr('consultNoPast')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {past.map((appt, i) => (
                <AppointmentRow key={appointmentKey(appt, i)} appt={appt} tr={tr} lang={lang} />
              ))}
            </div>
          )}
        </div>

      {latestCompleted && (
        <div className="card" style={{ borderColor: 'var(--gold-light)', marginTop: '12px' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdCheckCircle size={20} color="var(--success)" />
            {tr('consultCompletedTitle')}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: '1.6', margin: '0 0 12px' }}>
            {tr('consultCompletedBody')}
          </p>
          <a
            className="btn btn-primary"
            href={`https://wa.me/917039726655?text=${encodeURIComponent('Hello, I would like to book another consultation.')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ width: '100%', padding: '12px', textAlign: 'center' }}
          >
            <MdPhone size={16} />
            {tr('consultContactWhatsApp')}
          </a>
        </div>
      )}
      </div>
    );

  /* ------------------------ unregistered: lead form ------------------------ */
  return (
    <div className="scroll-area" style={{ padding: '16px' }}>
      {justSubmitted && (
        <div className="card" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <MdCheckCircle size={22} color="var(--success)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--card-text)' }}>{tr('consultSuccessTitle')}</div>
            <div style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: '1.5', marginTop: '4px' }}>
              {fill(tr('consultSuccessBody'), { phone: phone.trim() })}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdSupportAgent size={20} color="var(--gold)" />
          {tr('consultation')}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--card-text-2)', lineHeight: '1.6', margin: '0 0 14px' }}>
          {tr('consultIntro')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="field-label" htmlFor="consult-name">{tr('consultYourName')}</label>
            <input
              id="consult-name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              style={{ borderRadius: '8px', padding: '10px 12px', background: 'var(--bg-card)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="field-label" htmlFor="consult-phone">{tr('consultPhone')}</label>
            <input
              id="consult-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
              style={{ borderRadius: '8px', padding: '10px 12px', background: 'var(--bg-card)' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--card-text-3)' }}>{tr('consultPhoneHint')}</span>
          </div>

          <button
            onClick={() => setShowBirth(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start',
              fontSize: '13px', fontWeight: 600, color: 'var(--gold)', padding: '6px 0',
            }}
          >
            <MdEvent size={16} />
            {tr('consultAddBirth')}
          </button>

          {showBirth && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
              <p style={{ fontSize: '12px', color: 'var(--card-text-3)', lineHeight: '1.5', margin: 0 }}>
                {tr('consultBirthFaster')}
              </p>
              <BirthDateTimeFields
                dob={dob}
                tob={tob}
                ampm={ampm}
                dateValue={birthDate}
                timeValue={birthTime}
                onDobChange={setDob}
                onTobChange={setTob}
                onAmpmChange={setAmpm}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="field-label">{tr('place')}</label>
                <PlaceSearch
                  value={place ?? DEFAULT_PLACE}
                  onSelect={p => setPlace(p)}
                  onClear={() => setPlace(null)}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="field-label" htmlFor="consult-question">{tr('consultQuestion')}</label>
            <textarea
              id="consult-question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={3}
              style={{ borderRadius: '8px', padding: '10px 12px', background: 'var(--bg-card)', resize: 'vertical' }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            style={{ width: '100%', marginTop: '4px', padding: '14px', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? tr('consultSubmitting') : tr('consultSubmit')}
          </button>

          {fieldError && <div style={{ color: 'var(--danger)', fontSize: '13px' }}>{fieldError}</div>}
          {error && (
            <div style={{ color: queued ? 'var(--gold)' : 'var(--danger)', fontSize: '13px', lineHeight: '1.5' }}>
              {error}
            </div>
          )}
        </div>
</div>
      </div>
    );
  }

function AppointmentRow({
  appt,
  tr,
  lang,
}: {
  appt: ConsultationAppointment;
  tr: (key: string) => string;
  lang: string;
}) {
  const isOnlineSession = appt.kind === 'online';
  const when = [formatDate(appt.date, lang), appt.time].filter(Boolean).join(' · ');

  // Detect if this appointment is today
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isToday = appt.date === todayStr;

  return (
    <div style={{ borderTop: '1px solid var(--card-line)', paddingTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--card-text)' }}>
            {isOnlineSession ? <MdVideocam size={16} color="var(--gold)" /> : <MdLocationOn size={16} color="var(--gold)" />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isOnlineSession ? tr('consultOnline') : tr('consultVisitSlot')}
            </span>
            {isToday && (
              <span className="chip chip-good" style={{ fontSize: '10px', marginLeft: '8px' }}>
                {tr('today')}
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--card-text-2)', marginTop: '4px' }}>{when}</div>
          {appt.duration && (
            <div style={{ fontSize: '12px', color: 'var(--card-text-3)', marginTop: '2px' }}>
              {fill(tr('consultDuration'), { n: appt.duration })}
            </div>
          )}
        </div>
        {appt.status && <span className={statusChipClass(appt.status)} style={{ flexShrink: 0, fontSize: '10px' }}>{appt.status}</span>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
        {appt.token_number != null && (
          <span className="chip chip-gold" style={{ fontSize: '11px' }}>
            {fill(tr('consultToken'), { n: appt.token_number })}
          </span>
        )}
      </div>

      {isOnlineSession && (
        <div style={{ marginTop: '10px' }}>
          {appt.has_meet && appt.google_meet_link ? (
            <a
              className="btn btn-primary"
              href={appt.google_meet_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              <MdVideocam size={16} />
              {tr('consultJoinMeet')}
            </a>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--card-text-3)', lineHeight: '1.5' }}>
              {tr('consultMeetPending')}
            </div>
          )}
        </div>
      )}

      {appt.feedback_link && (
        <a
          href={appt.feedback_link.startsWith('http') ? appt.feedback_link : `https://slots.astrochitra.com/feedback/?code=${encodeURIComponent(appt.feedback_link)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', fontSize: '12px', color: 'var(--gold)', marginTop: '10px' }}
        >
          {tr('feedback')}
        </a>
      )}
    </div>
  );
}
}
