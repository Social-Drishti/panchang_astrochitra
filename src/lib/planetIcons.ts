const PLANET_ICON_MAP: Record<string, string> = {
  sun: '/astro_icons/planets/Sun.svg',
  moon: '/astro_icons/planets/Moon.svg',
  mars: '/astro_icons/planets/Mars.svg',
  mercury: '/astro_icons/planets/Mercury.svg',
  jupiter: '/astro_icons/planets/Jupiter.svg',
  venus: '/astro_icons/planets/Venus.svg',
  saturn: '/astro_icons/planets/Saturn.svg',
  rahu: '/astro_icons/planets/Rahu.svg',
  ketu: '/astro_icons/planets/Ketu.svg',
};

export function getPlanetIcon(planet: string): string {
  return PLANET_ICON_MAP[planet.toLowerCase()] || '';
}
