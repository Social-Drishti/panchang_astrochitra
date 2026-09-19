import { Illumination, Body } from 'astronomy-engine';

export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';

export interface SkyEventTimes {
  sunrise?: Date | null;
  sunset?: Date | null;
}

export interface SkyState {
  phase: SkyPhase;
  /** 0 = full night, 1 = full daylight (sun well above horizon) */
  dayness: number;
  /** 0..1 warm horizon-glow intensity around dawn/dusk */
  twilight: number;
  /** 0..1 sun arc height — 0 at the horizon, 1 overhead */
  sunHeight: number;
  /** 0..1 sun visibility */
  sunVisibility: number;
  /** 0..1 moon visibility */
  moonVisibility: number;
}

export interface MoonGeometry {
  /** illuminated fraction of the disc, 0..1 */
  phaseFraction: number;
  /** true when the lit side is growing (crescent opens right) */
  waxing: boolean;
}

const TWILIGHT_MS = 45 * 60 * 1000;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Drive a sunny/(twilight)/night hero scene from real solar events.
 * `now` is a unix millisecond instant; events are absolute Date instants.
 */
export function computeSky(now: number, events?: SkyEventTimes | null): SkyState {
  const sunrise = events?.sunrise?.getTime();
  const sunset = events?.sunset?.getTime();

  if (typeof sunrise !== 'number' || typeof sunset !== 'number' || Number.isNaN(sunrise) || Number.isNaN(sunset)) {
    return computeSkyFallback(now);
  }

  const A1 = sunrise - TWILIGHT_MS; // dawn starts
  const A2 = sunrise + TWILIGHT_MS; // dawn ends
  const D1 = sunset - TWILIGHT_MS;  // dusk starts
  const D2 = sunset + TWILIGHT_MS;  // dusk ends

  let phase: SkyPhase;
  if (now < A1) phase = 'night';
  else if (now < A2) phase = 'dawn';
  else if (now < D1) phase = 'day';
  else if (now < D2) phase = 'dusk';
  else phase = 'night';

  let dayness: number;
  let twilight: number;

  if (now >= A1 && now < A2) {
    const p = (now - A1) / (A2 - A1);
    dayness = p;
    twilight = Math.sin(p * Math.PI);
  } else if (now >= A2 && now < D1) {
    dayness = 1;
    twilight = 0;
  } else if (now >= D1 && now < D2) {
    const p = (now - D1) / (D2 - D1);
    dayness = 1 - p;
    twilight = Math.sin(p * Math.PI);
  } else {
    dayness = 0;
    twilight = 0;
  }

  // Sun arcs from the horizon (twilight ends) to the zenith (solar noon) and back.
  const span = D2 - A1;
  const progress = clamp01((now - A1) / span);
  const sunHeight = Math.sin(progress * Math.PI);

  const light = dayness + twilight;
  const sunVisibility = smoothstep(0.12, 0.45, light);
  const moonVisibility = clamp01(1 - light * 1.15);

  return { phase, dayness, twilight, sunHeight, sunVisibility, moonVisibility };
}

/** Device-clock fallback (fixed hour bands) when solar events are missing. */
function computeSkyFallback(now: number): SkyState {
  const d = new Date(now);
  const sod = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const t = Math.max(0, now - sod);
  const hour = 3600e3;

  const A1 = 5 * hour;  // 05:00
  const A2 = 7 * hour;  // 07:00
  const D1 = 17 * hour; // 17:00
  const D2 = 19 * hour; // 19:00

  if (t >= A1 && t < A2) {
    const p = (t - A1) / (A2 - A1);
    return {
      phase: 'dawn', dayness: p, twilight: Math.sin(p * Math.PI),
      sunHeight: p * 0.45, sunVisibility: smoothstep(0.12, 0.45, p * 2),
      moonVisibility: clamp01(1 - p * 2 * 1.15),
    };
  }
  if (t >= A2 && t < D1) {
    const progress = (t - A2) / (D1 - A2);
    return {
      phase: 'day', dayness: 1, twilight: 0,
      sunHeight: 0.5 - 0.5 * Math.cos(2 * Math.PI * progress),
      sunVisibility: 1, moonVisibility: 0,
    };
  }
  if (t >= D1 && t < D2) {
    const p = (t - D1) / (D2 - D1);
    const light = (1 - p) + Math.sin(p * Math.PI);
    return {
      phase: 'dusk', dayness: 1 - p, twilight: Math.sin(p * Math.PI),
      sunHeight: (1 - p) * 0.45, sunVisibility: smoothstep(0.12, 0.45, light),
      moonVisibility: clamp01(1 - light * 1.15),
    };
  }
  return {
    phase: 'night', dayness: 0, twilight: 0, sunHeight: 0,
    sunVisibility: 0, moonVisibility: 1,
  };
}

/** Moon disc geometry — illuminated fraction + whether it is waxing. */
export function getMoonGeometry(now: number): MoonGeometry {
  try {
    const illum = Illumination(Body.Moon, new Date(now));
    const fraction = typeof illum.phase_fraction === 'number'
      ? clamp01(illum.phase_fraction)
      : 0.5;
    const waxing = typeof illum.phase_angle === 'number' ? illum.phase_angle < 180 : true; 
    return { phaseFraction: fraction, waxing };
  } catch {
    return { phaseFraction: 0.5, waxing: true };
  }
}

/** Offset (in moon radii) of the carving shadow circle for an illuminated fraction. */
export function moonShadowOffset(phaseFraction: number): number {
  const f = clamp01(phaseFraction);
  if (f >= 0.985) return 2;
  if (f <= 0.015) return 0;
  // overlap fraction of two unit-radius circles offset by d:
  // lens(d) = (2*acos(d/2) - d*sqrt(4-d*d)) / PI
  // solve lens(d) = 1 - f
  let lo = 0;
  let hi = 2;
  const target = 1 - f;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    const lens = mid >= 2
      ? 0
      : (2 * Math.acos(mid / 2) - mid * Math.sqrt(4 - mid * mid)) / Math.PI;
    if (lens > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export { lerp, clamp01 };