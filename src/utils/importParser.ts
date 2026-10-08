import * as XLSX from 'xlsx';
import { BuildingSite, SiteCategory } from '../types';
import { NEIGHBORHOOD_PROFILES } from './staticMapHelper';

export interface ParsedImportRow {
  id?: string;
  name: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  elevatorUnits: number;
  floors: number;
  elevatorBrand: string;
  category: SiteCategory;
  assignedTechnicianEmail: string;
  managerName: string;
  managerPhone: string;
  accessCode: string;
  notes: string;
  isExistingMatch?: boolean;
  validationErrors: string[];
}

// Fallback neighborhood center coordinates
const DEFAULT_NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  'Downtown Financial Hub': { lat: 40.7075, lng: -74.0112 },
  'Midtown Commercial Corridor': { lat: 40.7549, lng: -73.9840 },
  'West End Medical Center': { lat: 40.7780, lng: -73.9850 },
  'Riverside Residential District': { lat: 40.7950, lng: -73.9720 },
  'North Tech & Creative Campus': { lat: 40.8120, lng: -73.9550 },
  'Harbor Gateway Towers': { lat: 40.7020, lng: -74.0150 },
  'University & Research Quarter': { lat: 40.7290, lng: -73.9960 },
  'Eastside Residential Complex': { lat: 40.7680, lng: -73.9520 },
};

const KNOWN_BRANDS: string[] = [
  'Otis',
  'Schindler',
  'KONE',
  'Thyssenkrupp',
  'Mitsubishi Electric',
  'Fujitec',
  'Hyundai Elevator',
  'Dover',
];

/**
 * Standardize keys for header mapping
 */
function normalizeKey(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Maps raw key-value record from CSV or Excel row to ParsedImportRow
 */
export function mapRowToSite(
  rawRecord: Record<string, any>,
  existingSites: BuildingSite[],
  defaultTechEmail: string
): ParsedImportRow {
  const normMap: Record<string, any> = {};
  for (const [k, v] of Object.entries(rawRecord)) {
    normMap[normalizeKey(k)] = v;
  }

  // Find fields using flexible aliases
  const name =
    normMap['name'] ||
    normMap['building'] ||
    normMap['buildingname'] ||
    normMap['site'] ||
    normMap['sitename'] ||
    '';

  const address =
    normMap['address'] ||
    normMap['street'] ||
    normMap['streetaddress'] ||
    normMap['location'] ||
    '';

  let neighborhood =
    normMap['neighborhood'] ||
    normMap['district'] ||
    normMap['area'] ||
    normMap['zone'] ||
    '';

  // Attempt to match neighborhood from known list if misspelled
  const matchedNh = Object.keys(DEFAULT_NEIGHBORHOOD_COORDS).find(
    (n) => n.toLowerCase() === neighborhood.toLowerCase()
  );
  if (matchedNh) {
    neighborhood = matchedNh;
  } else if (!neighborhood) {
    neighborhood = 'Midtown Commercial Corridor';
  }

  // Geolocation coordinates
  let lat = Number(normMap['lat'] || normMap['latitude'] || 0);
  let lng = Number(normMap['lng'] || normMap['lon'] || normMap['longitude'] || 0);

  // If combined "coordinates" string like "40.7128, -74.0060"
  const coordsStr = normMap['coords'] || normMap['coordinates'] || normMap['gps'];
  if (typeof coordsStr === 'string' && coordsStr.includes(',')) {
    const parts = coordsStr.split(',').map((p) => Number(p.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      lat = parts[0];
      lng = parts[1];
    }
  }

  // If coordinates are invalid or missing, jitter around neighborhood center
  if (lat === 0 || lng === 0 || isNaN(lat) || isNaN(lng)) {
    const center = DEFAULT_NEIGHBORHOOD_COORDS[neighborhood] || { lat: 40.75, lng: -73.98 };
    const jitterLat = (Math.random() - 0.5) * 0.008;
    const jitterLng = (Math.random() - 0.5) * 0.008;
    lat = Number((center.lat + jitterLat).toFixed(6));
    lng = Number((center.lng + jitterLng).toFixed(6));
  }

  const elevatorUnits = Math.max(
    1,
    Number(normMap['units'] || normMap['elevatorunits'] || normMap['lifts'] || normMap['elevators'] || 2)
  );

  const floors = Math.max(
    1,
    Number(normMap['floors'] || normMap['stories'] || normMap['levels'] || 10)
  );

  let elevatorBrand =
    normMap['brand'] ||
    normMap['elevatorbrand'] ||
    normMap['manufacturer'] ||
    'Otis';

  const brandMatch = KNOWN_BRANDS.find((b) => b.toLowerCase() === elevatorBrand.toLowerCase());
  if (brandMatch) elevatorBrand = brandMatch;

  const category: SiteCategory =
    (normMap['category'] || normMap['type'] || '').toLowerCase().includes('public')
      ? 'public'
      : 'private';

  const assignedTech =
    normMap['technician'] ||
    normMap['technicianemail'] ||
    normMap['tech'] ||
    normMap['assignedto'] ||
    (category === 'public' ? 'shared@elevatortech.io' : defaultTechEmail);

  const managerName = normMap['manager'] || normMap['managername'] || normMap['super'] || 'Building Manager';
  const managerPhone = normMap['phone'] || normMap['managerphone'] || normMap['contact'] || '+1 (555) 300-8800';
  const accessCode =
    normMap['code'] || normMap['accesscode'] || normMap['doorcode'] || normMap['pin'] || `#${Math.floor(1000 + Math.random() * 8999)}*`;
  const notes = normMap['notes'] || normMap['instructions'] || normMap['accessnotes'] || 'Imported from external dataset.';

  // Check if existing match exists by ID or by exact building name
  const rawId = normMap['id'] || normMap['siteid'];
  const existingMatch = existingSites.find(
    (s) => (rawId && s.id === String(rawId)) || (name && s.name.toLowerCase() === String(name).toLowerCase())
  );

  const validationErrors: string[] = [];
  if (!name.trim()) validationErrors.push('Missing building name');
  if (!address.trim()) validationErrors.push('Missing street address');

  return {
    id: existingMatch?.id || (rawId ? String(rawId) : undefined),
    name: name.trim(),
    address: address.trim(),
    neighborhood,
    latitude: lat,
    longitude: lng,
    elevatorUnits,
    floors,
    elevatorBrand,
    category,
    assignedTechnicianEmail: assignedTech,
    managerName,
    managerPhone,
    accessCode,
    notes,
    isExistingMatch: Boolean(existingMatch),
    validationErrors,
  };
}

/**
 * Parses XLSX / XLS file buffer using SheetJS
 */
export function parseExcelFile(
  fileData: ArrayBuffer,
  existingSites: BuildingSite[],
  defaultTechEmail: string
): ParsedImportRow[] {
  const workbook = XLSX.read(fileData, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

  return jsonData.map((row) => mapRowToSite(row, existingSites, defaultTechEmail));
}

/**
 * Parses plain CSV / TSV text
 */
export function parseCsvText(
  text: string,
  existingSites: BuildingSite[],
  defaultTechEmail: string
): ParsedImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Determine separator: tab vs comma vs semicolon vs pipe
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
  else if (firstLine.includes('|') && !firstLine.includes(',')) delimiter = '|';

  // Check if first line is a header line
  const headers = splitDelimited(firstLine, delimiter).map((h) => h.trim());
  const hasHeaders = headers.some((h) => {
    const norm = normalizeKey(h);
    return ['name', 'building', 'address', 'neighborhood', 'lifts', 'units', 'brand'].includes(norm);
  });

  const parsedRows: ParsedImportRow[] = [];

  if (hasHeaders) {
    for (let i = 1; i < lines.length; i++) {
      const values = splitDelimited(lines[i], delimiter);
      const record: Record<string, any> = {};
      headers.forEach((h, idx) => {
        record[h] = values[idx] || '';
      });
      parsedRows.push(mapRowToSite(record, existingSites, defaultTechEmail));
    }
  } else {
    // Treat as positional columns: Name, Address, Neighborhood, Lifts, Brand, Code
    for (let i = 0; i < lines.length; i++) {
      const values = splitDelimited(lines[i], delimiter);
      const record: Record<string, any> = {
        name: values[0] || `Imported Site ${i + 1}`,
        address: values[1] || 'Main St, New York, NY',
        neighborhood: values[2] || 'Midtown Commercial Corridor',
        elevatorUnits: values[3] || 2,
        elevatorBrand: values[4] || 'Otis',
        accessCode: values[5] || '#1001*',
      };
      parsedRows.push(mapRowToSite(record, existingSites, defaultTechEmail));
    }
  }

  return parsedRows;
}

/**
 * Parses unstructured WhatsApp message blocks with regex patterns
 * e.g. "Building: Skyline Tower | Address: 350 5th Ave | Lifts: 6 | Code: #1234*"
 */
export function parseWhatsAppText(
  text: string,
  existingSites: BuildingSite[],
  defaultTechEmail: string
): ParsedImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ParsedImportRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Pattern 1: Pipe / hyphen separated e.g. "Grand Plaza | 450 Broadway | Midtown | 4 lifts | Otis | #1234*"
    if (line.includes('|') || line.includes(' - ')) {
      const parts = (line.includes('|') ? line.split('|') : line.split(' - ')).map((p) => p.trim());
      const cleanName = parts[0].replace(/^(\d+[\.\)]\s*)/, ''); // strip leading 1. or 1)
      const record: Record<string, any> = {
        name: cleanName,
        address: parts[1] || `${cleanName} St, New York, NY`,
        neighborhood: parts[2] || 'Midtown Commercial Corridor',
        elevatorUnits: parts[3]?.replace(/\D/g, '') || 3,
        elevatorBrand: parts[4] || 'Otis',
        accessCode: parts[5] || '#1234*',
      };
      results.push(mapRowToSite(record, existingSites, defaultTechEmail));
    }
  }

  if (results.length > 0) return results;

  // Fallback to generic CSV parser
  return parseCsvText(text, existingSites, defaultTechEmail);
}

/**
 * Splits delimited string respecting quotes
 */
function splitDelimited(row: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Generates sample CSV template for download
 */
export function generateSampleCsvTemplate(): string {
  return `name,address,neighborhood,lat,lng,elevator_units,floors,elevator_brand,category,access_code,manager_name,manager_phone,notes
"Empire Commercial Plaza","350 5th Ave, New York, NY","Midtown Commercial Corridor",40.7484,-73.9857,6,42,"Otis","private","#4201*","Robert Vance","+1 (555) 234-8800","Key box in security control room"
"Hudson Heights Condos","720 Riverside Dr, New York, NY","Riverside Residential District",40.8310,-73.9480,4,22,"Schindler","private","#8812*","Elena Ramos","+1 (555) 456-9900","Machine room access via roof stairs"
"Wall Street Financial Tower","60 Wall St, New York, NY","Downtown Financial Hub",40.7060,-74.0090,8,48,"KONE","private","#9901*","Marcus Hall","+1 (555) 789-1122","Priority VIP bank with destination dispatch"
"Metropolitan Health Pavilion","525 E 68th St, New York, NY","West End Medical Center",40.7645,-73.9540,5,16,"Thyssenkrupp","public","#5510*","Dr. Aris Thorne","+1 (555) 890-4433","Shared emergency pool stretcher lifts"`;
}
