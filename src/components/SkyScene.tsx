import { motion } from 'framer-motion';
import type { SkyState, MoonGeometry } from '../lib/dayPhase';
import { moonShadowOffset } from '../lib/dayPhase';

interface SkySceneProps {
  state: SkyState;
  moon: MoonGeometry;
}

const SUN_RAYS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

const SCENE_T = { duration: 4, ease: 'easeInOut' as const };

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const rnd = mulberry32(2026);
  return Array.from({ length: 26 }, () => ({
    x: 2 + rnd() * 86,
    y: 3 + rnd() * 40,
    r: 0.55 + rnd() * 0.95,
    dur: 2.6 + rnd() * 3.6,
    delay: rnd() * 4,
  }));
})();

const R = 46; // moon/sun disc radius in the 200px viewBox

export default function SkyScene({ state, moon }: SkySceneProps) {
  const { dayness, twilight, sunHeight, sunVisibility, moonVisibility, phase } = state;

  // Sun sinks toward the horizon at dawn/dusk, rises overhead at noon.
  const sunY = 30 - sunHeight * 88;

  const shadowOffset = moonShadowOffset(moon.phaseFraction);
  const shadowCx = 100 + (moon.waxing ? -shadowOffset * R : shadowOffset * R);
  const isFull = moon.phaseFraction >= 0.985;
  const isNew = moon.phaseFraction <= 0.02;

  const maskId = 'moon-crescent-mask';

  return (
    <div className="hero-scene" aria-hidden="true">
      {/* Sky layers — crossfaded by dayness */}
      <motion.div
        className="hero-sky sky-night"
        initial={false}
        animate={{ opacity: 1 - dayness }}
        transition={SCENE_T}
      />
      <motion.div
        className="hero-sky sky-day"
        initial={false}
        animate={{ opacity: dayness }}
        transition={SCENE_T}
      />
      {/* Warm glow wash that peaks at dawn and dusk */}
      <motion.div
        className="hero-sky sky-twilight"
        initial={false}
        animate={{ opacity: twilight }}
        transition={SCENE_T}
      />

      {/* Stars — fade in as the sky darkens */}
      <motion.svg
        className="hero-stars"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        initial={false}
        animate={{ opacity: moonVisibility }}
        transition={SCENE_T}
      >
        {STARS.map((s, i) => (
          <circle
            key={i}
            className="hero-star"
            cx={s.x}
            cy={s.y}
            r={s.r}
            style={{
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </motion.svg>

      {/* Celestial bodies */}
      <motion.div
        className="hero-body hero-sun"
        initial={false}
        animate={{ opacity: sunVisibility, y: sunY }}
        transition={{ ...SCENE_T, duration: 6 }}
        style={{ translateX: 0 }}
      >
        <svg viewBox="0 0 200 200" width="168" height="168">
          <g
            className="hero-rays"
            style={{
              opacity: phase === 'day' ? 1 : 0.7,
              animationPlayState: sunVisibility > 0.05 ? 'running' : 'paused',
            }}
          >
            <g className="hero-rays-spin">
              {SUN_RAYS.map((a) => (
                <rect
                  key={a}
                  x="97"
                  y="6"
                  width="6"
                  height="22"
                  rx="3"
                  fill="rgba(255, 233, 184, 0.6)"
                  transform={`rotate(${a} 100 100)`}
                />
              ))}
            </g>
          </g>
          <circle
            cx="100"
            cy="100"
            r="68"
            fill="none"
            stroke="rgba(255, 233, 184, 0.35)"
            strokeWidth="2"
            strokeDasharray="3 7"
          />
          <circle cx="100" cy="100" r={R} fill="rgba(255, 233, 184, 0.92)" />
        </svg>
      </motion.div>

      <motion.div
        className="hero-body hero-moon"
        initial={false}
        animate={{ opacity: moonVisibility }}
        transition={{ ...SCENE_T, duration: 6 }}
      >
        <div className="moon-halo" />
        <svg viewBox="0 0 200 200" width="168" height="168">
          <defs>
            <mask id={maskId}>
              <rect width="200" height="200" fill="white" />
              <circle cx={shadowCx} cy="100" r={R * 1.02} fill="black" />
            </mask>
          </defs>
          {isNew ? (
            <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255, 246, 230, 0.28)" strokeWidth="1.5" strokeDasharray="2 5" />
          ) : isFull ? (
            <circle cx="100" cy="100" r={R} fill="#ffe3a1" />
          ) : (
            <circle cx="100" cy="100" r={R} fill="#ffe3a1" mask={`url(#${maskId})`} />
          )}
        </svg>
      </motion.div>
    </div>
  );
}