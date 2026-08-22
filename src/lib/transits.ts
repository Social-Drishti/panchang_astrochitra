import { GeoVector, Ecliptic, Body } from 'astronomy-engine';
import { getAyanamsa, getRahuPosition } from '@ishubhamx/panchangam-js';

export const TRANSIT_PLANETS = [
  'Moon', 'Mercury', 'Venus', 'Sun', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu',
] as const;

const DAY_MS = 86_400_000;
const INGRESS_TOLERANCE_MS = 60_000;
const MAX_SCAN_DAYS = 4_000;

const PLANET_BODIES = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mars: Body.Mars,
  Mercury: Body.Mercury,
  Jupiter: Body.Jupiter,
  Venus: Body.Venus,
  Saturn: Body.Saturn,
} as const;

// Real ephemeris position (sidereal longitude) for a planet at an instant.
// Mirrors the math used by @ishubhamx/panchangam-js planetaryPositions.
function siderealLongitude(planet: string, date: Date): number {
  const ayanamsa = getAyanamsa(date);
  if (planet === 'Rahu') return getRahuPosition(date, ayanamsa).longitude;
  if (planet === 'Ketu') return (getRahuPosition(date, ayanamsa).longitude + 180) % 360;
  const body = PLANET_BODIES[planet as keyof typeof PLANET_BODIES];
  const tropicalLon = Ecliptic(GeoVector(body, date, true)).elon;
  return (tropicalLon - ayanamsa + 360) % 360;
}

export interface SignIngress {
  planet: string;
  fromSign: number;
  toSign: number;
  ingressTime: Date;
}

export interface LivePosition {
  longitude: number;
  sign: number;
  degree: number;
  isRetrograde: boolean;
}

const SPEED_WINDOW_MS = 30 * 60 * 1000;

// Real-time ephemeris position for a planet at an arbitrary instant.
// Retrograde flag matches the library's ±30min finite-difference method.
export function getLivePosition(planet: string, date: Date): LivePosition {
  const longitude = siderealLongitude(planet, date);
  let isRetrograde = false;
  if (planet === 'Rahu' || planet === 'Ketu') {
    isRetrograde = true;
  } else {
    const before = siderealLongitude(planet, new Date(date.getTime() - SPEED_WINDOW_MS));
    const after = siderealLongitude(planet, new Date(date.getTime() + SPEED_WINDOW_MS));
    let diff = after - before;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    isRetrograde = diff < 0;
  }
  return {
    longitude,
    sign: Math.floor(longitude / 30),
    degree: longitude % 30,
    isRetrograde,
  };
}

export function getLivePositions(date: Date, planets: readonly string[] = TRANSIT_PLANETS): Record<string, LivePosition> {
  const positions: Record<string, LivePosition> = {};
  planets.forEach(planet => { positions[planet] = getLivePosition(planet, date); });
  return positions;
}

// Scans forward day by day using real ephemeris positions until the planet's
// sign changes, then binary-searches the bracketing interval to pinpoint the
// exact ingress instant (~1 minute precision).
export function findNextSignIngress(planet: string, fromDate: Date): SignIngress | null {
  const startMs = fromDate.getTime();
  let prevMs = startMs;
  let prevSign = Math.floor(siderealLongitude(planet, fromDate) / 30);

  for (let day = 1; day <= MAX_SCAN_DAYS; day++) {
    const curMs = startMs + day * DAY_MS;
    const curSign = Math.floor(siderealLongitude(planet, new Date(curMs)) / 30);

    if (curSign !== prevSign) {
      // A planet cannot cross a boundary twice within 24h (max speed < 30 deg/day),
      // so exactly one crossing lies in [prevMs, curMs].
      let lo = prevMs;
      let hi = curMs;
      while (hi - lo > INGRESS_TOLERANCE_MS) {
        const midMs = (lo + hi) / 2;
        const midSign = Math.floor(siderealLongitude(planet, new Date(midMs)) / 30);
        if (midSign === prevSign) lo = midMs;
        else hi = midMs;
      }
      return { planet, fromSign: prevSign, toSign: curSign, ingressTime: new Date(hi) };
    }

    prevSign = curSign;
  }
  return null;
}

export function computeUpcomingIngresses(
  fromDate: Date,
  planets: readonly string[] = TRANSIT_PLANETS
): SignIngress[] {
  return planets
    .map(planet => findNextSignIngress(planet, fromDate))
    .filter((ingress): ingress is SignIngress => ingress !== null)
    .sort((a, b) => a.ingressTime.getTime() - b.ingressTime.getTime());
}

// Collects every sign crossing of a planet within [start, end).
export function findIngressesInRange(planet: string, start: Date, end: Date): SignIngress[] {
  const events: SignIngress[] = [];
  const endMs = end.getTime();
  if (!(endMs > start.getTime())) return events;

  let cursorMs = start.getTime();
  let prevSign = Math.floor(siderealLongitude(planet, start) / 30);

  while (cursorMs < endMs) {
    const sampleMs = Math.min(cursorMs + DAY_MS, endMs);
    const sampleSign = Math.floor(siderealLongitude(planet, new Date(sampleMs)) / 30);

    if (sampleSign !== prevSign && sampleMs > cursorMs) {
      let lo = cursorMs;
      let hi = sampleMs;
      while (hi - lo > INGRESS_TOLERANCE_MS) {
        const midMs = (lo + hi) / 2;
        const midSign = Math.floor(siderealLongitude(planet, new Date(midMs)) / 30);
        if (midSign === prevSign) lo = midMs;
        else hi = midMs;
      }
      events.push({ planet, fromSign: prevSign, toSign: sampleSign, ingressTime: new Date(hi) });
    }

    prevSign = sampleSign;
    cursorMs = sampleMs;
  }
  return events;
}

export function computeIngressesBetween(
  start: Date,
  end: Date,
  planets: readonly string[] = TRANSIT_PLANETS
): SignIngress[] {
  return planets
    .flatMap(planet => findIngressesInRange(planet, start, end))
    .sort((a, b) => a.ingressTime.getTime() - b.ingressTime.getTime());
}
