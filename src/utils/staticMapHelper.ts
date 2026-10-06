import { BuildingSite } from '../types';

export interface NeighborhoodGeoProfile {
  name: string;
  themeColor: string;
  accentColor: string;
  gridDensity: number;
  waterwaySide?: 'west' | 'east' | 'south' | 'none';
  primaryStreet: string;
  crossAvenue: string;
  landmark: string;
  character: string;
}

export const NEIGHBORHOOD_PROFILES: Record<string, NeighborhoodGeoProfile> = {
  'Downtown Financial Hub': {
    name: 'Downtown Financial Hub',
    themeColor: '#0f172a',
    accentColor: '#38bdf8',
    gridDensity: 8,
    waterwaySide: 'west',
    primaryStreet: 'Wall & Broad St',
    crossAvenue: 'Broadway Corridor',
    landmark: 'Federal Hall & Stock Exchange Plaza',
    character: 'Dense High-Rise Commercial Towers',
  },
  'Midtown Commercial Corridor': {
    name: 'Midtown Commercial Corridor',
    themeColor: '#1e1b4b',
    accentColor: '#818cf8',
    gridDensity: 10,
    waterwaySide: 'none',
    primaryStreet: '5th Ave & 42nd St',
    crossAvenue: 'Madison Avenue',
    landmark: 'Grand Central & Bryant Park',
    character: 'High-Capacity Traction Elevators & Plaza Towers',
  },
  'West End Medical Center': {
    name: 'West End Medical Center',
    themeColor: '#064e3b',
    accentColor: '#34d399',
    gridDensity: 7,
    waterwaySide: 'west',
    primaryStreet: 'Amsterdam & 68th St',
    crossAvenue: 'Columbus Avenue',
    landmark: 'University Hospital Pavilion',
    character: 'Priority Medical Service & Stretcher Lifts',
  },
  'Riverside Residential District': {
    name: 'Riverside Residential District',
    themeColor: '#0c4a6e',
    accentColor: '#38bdf8',
    gridDensity: 6,
    waterwaySide: 'west',
    primaryStreet: 'Riverside Drive',
    crossAvenue: 'West End Avenue',
    landmark: 'Hudson Riverside Promenade',
    character: 'High-Rise Residential Luxury Condos',
  },
  'North Tech & Creative Campus': {
    name: 'North Tech & Creative Campus',
    themeColor: '#3b0764',
    accentColor: '#c084fc',
    gridDensity: 9,
    waterwaySide: 'east',
    primaryStreet: 'Silicon Boulevard',
    crossAvenue: 'Tech Plaza Parkway',
    landmark: 'Foundry Innovation Hub',
    character: 'Modern Smart MRL Elevator Systems',
  },
  'Harbor Gateway Towers': {
    name: 'Harbor Gateway Towers',
    themeColor: '#134e4a',
    accentColor: '#2dd4bf',
    gridDensity: 7,
    waterwaySide: 'south',
    primaryStreet: 'South Street Ferry Way',
    crossAvenue: 'Battery Place',
    landmark: 'Harbor Marina & Maritime Terminal',
    character: 'Waterfront High-Rise Hydraulic & Traction Banks',
  },
  'University & Research Quarter': {
    name: 'University & Research Quarter',
    themeColor: '#14532d',
    accentColor: '#4ade80',
    gridDensity: 8,
    waterwaySide: 'none',
    primaryStreet: 'Washington Square East',
    crossAvenue: 'University Place',
    landmark: 'Academic Library & Lab Complex',
    character: 'Academic & Laboratory Freight Elevators',
  },
  'Eastside Residential Complex': {
    name: 'Eastside Residential Complex',
    themeColor: '#701a75',
    accentColor: '#f472b6',
    gridDensity: 8,
    waterwaySide: 'east',
    primaryStreet: '1st Avenue',
    crossAvenue: 'York Avenue',
    landmark: 'East River Esplanade',
    character: 'Multi-Bank Residential Elevator Clusters',
  },
};

/**
 * Returns geo profile for neighborhood or default fallback
 */
export function getNeighborhoodGeoProfile(neighborhood: string): NeighborhoodGeoProfile {
  return (
    NEIGHBORHOOD_PROFILES[neighborhood] || {
      name: neighborhood || 'Urban District',
      themeColor: '#1e293b',
      accentColor: '#60a5fa',
      gridDensity: 8,
      waterwaySide: 'none',
      primaryStreet: 'Main Arterial St',
      crossAvenue: 'Central Ave',
      landmark: 'Civic District Center',
      character: 'Commercial & Residential Elevators',
    }
  );
}

/**
 * Formats latitude/longitude to Degrees Minutes Seconds (DMS) representation
 */
export function formatCoordinatesDMS(lat: number, lng: number): { latDMS: string; lngDMS: string } {
  const toDMS = (coord: number, isLat: boolean) => {
    const absCoord = Math.abs(coord);
    const degrees = Math.floor(absCoord);
    const minutesNotTruncated = (absCoord - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    const direction = isLat ? (coord >= 0 ? 'N' : 'S') : coord >= 0 ? 'E' : 'W';
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  return {
    latDMS: toDMS(lat, true),
    lngDMS: toDMS(lng, false),
  };
}

/**
 * Generates an SVG Static Map Image string that can be downloaded or rendered
 */
export function generateStaticMapSvg(site: BuildingSite): string {
  const profile = getNeighborhoodGeoProfile(site.neighborhood);
  const { latDMS, lngDMS } = formatCoordinatesDMS(site.latitude, site.longitude);

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${profile.themeColor}" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <pattern id="streetGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="none" />
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />
    </pattern>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="600" height="400" fill="url(#bgGrad)" />
  <rect width="600" height="400" fill="url(#streetGrid)" />

  <!-- Surrounding District Avenues -->
  <path d="M 0 160 L 600 160" stroke="rgba(255,255,255,0.22)" stroke-width="16" />
  <path d="M 0 160 L 600 160" stroke="#fbbf24" stroke-width="2" stroke-dasharray="8 8" />
  
  <path d="M 280 0 L 280 400" stroke="rgba(255,255,255,0.2)" stroke-width="20" />
  <path d="M 280 0 L 280 400" stroke="#f8fafc" stroke-width="1.5" stroke-dasharray="10 10" />

  <!-- Diagonal Avenue Connector -->
  <path d="M 60 400 L 500 0" stroke="rgba(255,255,255,0.15)" stroke-width="12" />

  <!-- City Blocks Footprints -->
  <rect x="50" y="40" width="180" height="90" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
  <rect x="330" y="40" width="220" height="90" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
  <rect x="50" y="210" width="180" height="150" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
  <rect x="330" y="210" width="220" height="150" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />

  <!-- Target Building Footprint -->
  <rect x="230" y="115" width="100" height="90" rx="8" fill="${profile.accentColor}" fill-opacity="0.25" stroke="${profile.accentColor}" stroke-width="2.5" filter="url(#shadow)" />
  
  <!-- Elevator Machine Room / Core Indicator -->
  <rect x="265" y="145" width="30" height="30" rx="4" fill="${profile.accentColor}" />
  <text x="280" y="165" font-family="monospace" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">${site.elevatorUnits}L</text>

  <!-- GPS Target Location Marker Pin -->
  <circle cx="280" cy="160" r="32" fill="none" stroke="${profile.accentColor}" stroke-width="2" stroke-opacity="0.4" />
  <circle cx="280" cy="160" r="44" fill="none" stroke="${profile.accentColor}" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.3" />

  <!-- Street Names Overlay -->
  <text x="140" y="154" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94a3b8" letter-spacing="1">${profile.primaryStreet.toUpperCase()}</text>
  <text x="295" y="260" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94a3b8" transform="rotate(90 295 260)" letter-spacing="1">${profile.crossAvenue.toUpperCase()}</text>

  <!-- Location Header Banner -->
  <rect x="20" y="20" width="320" height="48" rx="8" fill="#0f172a" fill-opacity="0.9" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
  <text x="35" y="42" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#ffffff">${site.name}</text>
  <text x="35" y="58" font-family="monospace" font-size="10" fill="#94a3b8">${site.address}</text>

  <!-- Geolocation Coordinates Badge -->
  <rect x="20" y="340" width="280" height="42" rx="8" fill="#0f172a" fill-opacity="0.9" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
  <text x="35" y="357" font-family="monospace" font-size="10" font-weight="bold" fill="${profile.accentColor}">GPS: ${site.latitude.toFixed(6)}°, ${site.longitude.toFixed(6)}°</text>
  <text x="35" y="372" font-family="monospace" font-size="9" fill="#94a3b8">DMS: ${latDMS} · ${lngDMS}</text>

  <!-- Compass Rose -->
  <g transform="translate(545, 45)">
    <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
    <polygon points="0,-14 4,-2 0,0 -4,-2" fill="#ef4444" />
    <polygon points="0,14 4,2 0,0 -4,2" fill="#94a3b8" />
    <text x="0" y="-16" font-family="system-ui, sans-serif" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle">N</text>
  </g>
</svg>
`.trim();
}
