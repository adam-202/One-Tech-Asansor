export interface InspectionChecklist {
  doorSensors: boolean;
  carLeveling: boolean;
  hoistwayCables: boolean;
  emergencyComm: boolean;
  machineRoom: boolean;
}

export type InspectionStatus = 'passed' | 'attention_needed' | 'critical';

export type VisitType = 'monthly' | 'fault' | 'emergency';

export type SiteCategory = 'private' | 'public';

export interface VisitRecord {
  id: string;
  siteId: string;
  siteName: string;
  address: string;
  neighborhood: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  monthYear: string; // YYYY-MM
  visitType: VisitType;
  technicianEmail: string;
  technicianName: string;
  attendingTechnicians: string[]; // multi-technician support (team of 2 or 3)
  status: InspectionStatus;
  checklist: InspectionChecklist;
  partsReplaced: string; // parts changed e.g. door interlock switch, roller guides
  notes: string;
  durationMinutes: number;
}

export interface BuildingSite {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  category: SiteCategory; // 'private' (assigned to tech email) or 'public' (shared / emergency pool)
  latitude: number;
  longitude: number;
  floors: number;
  elevatorUnits: number;
  elevatorBrand: string; // Otis, Schindler, KONE, Thyssenkrupp, Mitsubishi, etc.
  elevatorNumbers?: string; // e.g. "L1 (Pass), L2 (Pass), L3 (Service / Freight)"
  assignedTechnicianEmail: string; // email if private, or 'shared@elevatortech.io' if public
  managerName: string;
  managerPhone: string;
  accessCode: string;
  googleMapsUrl?: string; // direct Google Maps location URL
  notes: string;
  priority?: 'normal' | 'high' | 'vip' | 'fault_alert';
  lastVisit?: VisitRecord;
  visitHistory?: VisitRecord[]; // multiple visits per month allowed for faults/emergencies
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  assignedCount: number;
  avatarColor: string;
}

export interface RouteStop {
  stopNumber: number;
  site: BuildingSite;
  distanceFromPrevKm: number;
  estimatedTravelMin: number;
}
