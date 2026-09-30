import { deviceId } from './backend';

/**
 * Consultation leads and the install's own consultation history.
 *
 * The Astrochitra Slots API key never reaches the browser: every call goes to
 * this app's own PHP backend, which holds the key and scopes its response to
 * the install id sent here. If a caller sends a device id it does not own, the
 * backend still only ever returns the row bound to that id — there is no way
 * to read another install's data through these calls.
 */

const PENDING_KEY = 'pach-consultation-pending';

export interface ConsultationProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  birth_time: string;
  birth_place: string;
  question: string;
  status: 'pending' | 'linked' | 'failed' | string;
  astro_client_id: number | null;
  last_error: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface ConsultationAppointment {
  id: number;
  kind: 'offline' | 'online' | string;
  date: string;
  time: string;
  duration: string;
  token_number: number | null;
  status: string;
  google_meet_link: string;
  has_meet: boolean;
  feedback_link: string;
}

export interface ConsultationSyncResult {
  ok: boolean;
  profile: ConsultationProfile;
  client: Record<string, unknown>;
  appointments: {
    upcoming: ConsultationAppointment[];
    past: ConsultationAppointment[];
  };
  synced_at: string | null;
  stale: boolean;
  message: string;
}

export interface ConsultationLeadInput {
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  birth_time?: string;
  birth_place?: string;
  question?: string;
}

/** Thrown for a failed call so the page can tell a network blip from a rejection. */
export class ConsultationError extends Error {
  readonly field: string | null;
  readonly code: string | null;
  readonly retryable: boolean;

  constructor(message: string, options: { field?: string | null; code?: string | null; retryable?: boolean } = {}) {
    super(message);
    this.name = 'ConsultationError';
    this.field = options.field ?? null;
    this.code = options.code ?? null;
    this.retryable = options.retryable ?? false;
  }
}

function base(): string {
  return (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api/v1';
}

function query(path: string, params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const encoded = qs.toString();
  return encoded ? `?${encoded}` : '';
}

async function parse<T>(res: Response): Promise<T> {
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    /* a non-JSON body is treated as an opaque failure below */
  }

  if (!res.ok) {
    throw new ConsultationError(
      typeof body.error === 'string' ? body.error : 'Something went wrong. Please try again.',
      {
        field: typeof body.field === 'string' ? body.field : null,
        code: typeof body.code === 'string' ? body.code : null,
        retryable: body.retryable === true || res.status >= 500 || res.status === 429,
      }
    );
  }

  return body as T;
}

/**
 * Creates the lead in the consultation system. Idempotent per install: calling
 * it again for a device that is already linked returns the existing profile
 * rather than creating a second lead.
 */
export async function registerConsultation(input: ConsultationLeadInput): Promise<{ created: boolean; profile: ConsultationProfile }> {
  const id = deviceId();
  if (!id) throw new ConsultationError('This device could not be identified. Please reopen the app.');

  let res: Response;
  try {
    res = await fetch(`${base()}/consultation/register${query('', { device_id: id })}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ConsultationError('Could not reach the server. Check your connection and try again.', { retryable: true });
  }

  const body = await parse<{ ok: boolean; created: boolean; profile: ConsultationProfile }>(res);
  return { created: body.created, profile: body.profile };
}

/** The lead bound to this install, or null if it has not registered. */
export async function fetchConsultationProfile(): Promise<ConsultationProfile | null> {
  const id = deviceId();
  if (!id) return null;

  try {
    const res = await fetch(`${base()}/consultation/profile${query('', { device_id: id })}`);
    if (!res.ok) return null;
    const body = (await res.json()) as { profile: ConsultationProfile | null };
    return body.profile;
  } catch {
    return null;
  }
}

/**
 * This install's client record and appointment history.
 *
 * The backend serves a cached snapshot while it is fresh, so this is cheap to
 * call on every page view. `force` bypasses that cache, which is what the
 * pull-to-refresh action uses when the user is waiting on a Meet link.
 */
export async function syncConsultation(options: { force?: boolean } = {}): Promise<ConsultationSyncResult> {
  const id = deviceId();
  if (!id) throw new ConsultationError('This device could not be identified. Please reopen the app.');

  const params: Record<string, string | undefined> = { device_id: id };
  if (options.force) params.force = '1';

  let res: Response;
  try {
    res = await fetch(`${base()}/consultation/sync${query('', params)}`);
  } catch {
    throw new ConsultationError('Could not reach the server. Check your connection and try again.', { retryable: true });
  }

  return parse<ConsultationSyncResult>(res);
}

/* ------------------------- offline lead queue ------------------------- */

/**
 * A lead the user submitted while offline, kept so it can be sent when the
 * connection returns. A lost lead is a lost customer, so the form never
 * reports success until the server has actually accepted it.
 */
export function loadPendingLead(): ConsultationLeadInput | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsultationLeadInput;
    return parsed && typeof parsed.phone === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function savePendingLead(input: ConsultationLeadInput): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(input));
  } catch {
    /* private mode or quota — the in-memory form still holds the values */
  }
}

export function clearPendingLead(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Retries a queued lead when the device comes back online. Safe to call often:
 * it is a no-op unless something is actually queued.
 */
export async function flushPendingLead(): Promise<{ sent: boolean; profile: ConsultationProfile | null }> {
  const pending = loadPendingLead();
  if (!pending) return { sent: false, profile: null };

  try {
    const { profile } = await registerConsultation(pending);
    clearPendingLead();
    return { sent: true, profile };
  } catch {
    // Still unreachable: leave it queued for the next online event.
    return { sent: false, profile: null };
  }
}
