export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
}

export const LOCATION_PRESETS: Record<string, Location> = {
  delhi: { id: 'delhi', name: 'Delhi', latitude: 28.6139, longitude: 77.209, elevation: 216 },
  mumbai: { id: 'mumbai', name: 'Mumbai', latitude: 19.076, longitude: 72.8777, elevation: 14 },
  bangalore: { id: 'bangalore', name: 'Bangalore', latitude: 12.9716, longitude: 77.5946, elevation: 920 },
  chennai: { id: 'chennai', name: 'Chennai', latitude: 13.0827, longitude: 80.2707, elevation: 6 },
  kolkata: { id: 'kolkata', name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, elevation: 9 },
  hyderabad: { id: 'hyderabad', name: 'Hyderabad', latitude: 17.385, longitude: 78.4867, elevation: 542 },
  pune: { id: 'pune', name: 'Pune', latitude: 18.5204, longitude: 73.8567, elevation: 560 },
  ahmedabad: { id: 'ahmedabad', name: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714, elevation: 53 },
  jaipur: { id: 'jaipur', name: 'Jaipur', latitude: 26.9124, longitude: 75.7873, elevation: 431 },
  varanasi: { id: 'varanasi', name: 'Varanasi', latitude: 25.3176, longitude: 82.9739, elevation: 80 },
};

export const LOCATIONS_LIST: Location[] = Object.values(LOCATION_PRESETS);

// Simplified locations array for city dropdown
export const locations: { name: string; lat: number; lon: number }[] = LOCATIONS_LIST.map(l => ({
  name: l.name,
  lat: l.latitude,
  lon: l.longitude,
}));
