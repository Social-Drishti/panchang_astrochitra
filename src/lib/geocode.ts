export interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
}

/**
 * Search for a place using OpenStreetMap Nominatim — the same geocoder used by
 * the kundli-api reference server.
 * @param query Free-text place name
 * @param lang Preferred result language (en/hi/mr)
 * @param limit Max results
 */
export async function searchPlaces(query: string, lang = 'en', limit = 6): Promise<GeoResult[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: String(limit),
    addressdetails: '1',
  });
  if (lang !== 'en') params.set('accept-language', lang);

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
    if (!Array.isArray(data)) return [];

    return data
      .filter(d => d?.lat && d?.lon)
      .map(d => ({
        lat: parseFloat(d.lat as string),
        lon: parseFloat(d.lon as string),
        displayName: d.display_name || q,
      }));
  } catch {
    return [];
  }
}