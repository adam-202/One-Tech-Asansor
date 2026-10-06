import { BuildingSite, Technician, InspectionStatus, VisitRecord } from '../types';

export const TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'Adam Osama',
    email: 'adam.osama60@gmail.com',
    phone: '+1 (555) 234-8901',
    role: 'Lead Field Specialist',
    assignedCount: 48,
    avatarColor: 'bg-blue-600',
  },
  {
    id: 'tech-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@elevatortech.io',
    phone: '+1 (555) 345-6789',
    role: 'Senior Elevator Inspector',
    assignedCount: 22,
    avatarColor: 'bg-emerald-600',
  },
  {
    id: 'tech-3',
    name: 'Michael Torres',
    email: 'michael.torres@elevatortech.io',
    phone: '+1 (555) 456-7890',
    role: 'Field Service Technician',
    assignedCount: 18,
    avatarColor: 'bg-amber-600',
  },
  {
    id: 'tech-4',
    name: 'Marcus Vance',
    email: 'marcus.vance@elevatortech.io',
    phone: '+1 (555) 567-8901',
    role: 'High-Rise Systems Specialist',
    assignedCount: 12,
    avatarColor: 'bg-purple-600',
  },
  {
    id: 'tech-5',
    name: 'Elena Rostova',
    email: 'elena.rostova@elevatortech.io',
    phone: '+1 (555) 678-9012',
    role: 'Traction Systems Technician',
    assignedCount: 10,
    avatarColor: 'bg-teal-600',
  },
  {
    id: 'tech-6',
    name: 'David Kim',
    email: 'david.kim@elevatortech.io',
    phone: '+1 (555) 789-0123',
    role: 'Electrical & Controller Tech',
    assignedCount: 9,
    avatarColor: 'bg-indigo-600',
  },
  {
    id: 'tech-7',
    name: 'Carlos Mendez',
    email: 'carlos.mendez@elevatortech.io',
    phone: '+1 (555) 890-1234',
    role: 'Hydraulic & MRL Specialist',
    assignedCount: 8,
    avatarColor: 'bg-cyan-600',
  },
  {
    id: 'tech-8',
    name: 'James Wilson',
    email: 'james.wilson@elevatortech.io',
    phone: '+1 (555) 901-2345',
    role: 'Field Maintenance Engineer',
    assignedCount: 7,
    avatarColor: 'bg-sky-600',
  },
  {
    id: 'tech-9',
    name: 'Aisha Patel',
    email: 'aisha.patel@elevatortech.io',
    phone: '+1 (555) 012-3456',
    role: 'Safety & Modernization Inspector',
    assignedCount: 6,
    avatarColor: 'bg-pink-600',
  },
  {
    id: 'tech-10',
    name: 'Robert Taylor',
    email: 'robert.taylor@elevatortech.io',
    phone: '+1 (555) 123-4567',
    role: 'Emergency Response Technician',
    assignedCount: 5,
    avatarColor: 'bg-red-600',
  },
  {
    id: 'tech-11',
    name: 'Kevin Wright',
    email: 'kevin.wright@elevatortech.io',
    phone: '+1 (555) 234-5678',
    role: 'Field Service Specialist',
    assignedCount: 4,
    avatarColor: 'bg-orange-600',
  },
  {
    id: 'tech-12',
    name: 'Daniel Lee',
    email: 'daniel.lee@elevatortech.io',
    phone: '+1 (555) 345-6780',
    role: 'Preventive Care Technician',
    assignedCount: 4,
    avatarColor: 'bg-green-600',
  },
  {
    id: 'tech-13',
    name: 'Sofia Martinez',
    email: 'sofia.martinez@elevatortech.io',
    phone: '+1 (555) 456-7891',
    role: 'Hoistway & Cables Inspector',
    assignedCount: 3,
    avatarColor: 'bg-rose-600',
  },
  {
    id: 'tech-14',
    name: 'Chris Evans',
    email: 'chris.evans@elevatortech.io',
    phone: '+1 (555) 567-8902',
    role: 'Field Maintenance Specialist',
    assignedCount: 3,
    avatarColor: 'bg-slate-600',
  },
  {
    id: 'tech-15',
    name: 'Ryan Miller',
    email: 'ryan.miller@elevatortech.io',
    phone: '+1 (555) 678-9013',
    role: 'Elevator Mechanic',
    assignedCount: 3,
    avatarColor: 'bg-violet-600',
  },
  {
    id: 'tech-16',
    name: 'Brian Hall',
    email: 'brian.hall@elevatortech.io',
    phone: '+1 (555) 789-0124',
    role: 'Service & Overhaul Tech',
    assignedCount: 2,
    avatarColor: 'bg-lime-600',
  },
  {
    id: 'tech-17',
    name: 'Thomas Anderson',
    email: 'thomas.anderson@elevatortech.io',
    phone: '+1 (555) 890-1235',
    role: 'Automation & Door Systems',
    assignedCount: 2,
    avatarColor: 'bg-emerald-700',
  },
  {
    id: 'tech-18',
    name: 'Lucas Scott',
    email: 'lucas.scott@elevatortech.io',
    phone: '+1 (555) 901-2346',
    role: 'Field Apprentice / Junior Tech',
    assignedCount: 2,
    avatarColor: 'bg-amber-700',
  },
  {
    id: 'tech-19',
    name: 'Justin Reed',
    email: 'justin.reed@elevatortech.io',
    phone: '+1 (555) 012-3457',
    role: 'Mechanical Repairs Specialist',
    assignedCount: 2,
    avatarColor: 'bg-blue-700',
  },
  {
    id: 'tech-20',
    name: 'Nathan Green',
    email: 'nathan.green@elevatortech.io',
    phone: '+1 (555) 123-4568',
    role: 'Rapid Response Team',
    assignedCount: 2,
    avatarColor: 'bg-cyan-700',
  },
];

interface NeighborhoodDef {
  name: string;
  centerLat: number;
  centerLng: number;
  prefix: string;
}

const NEIGHBORHOODS: NeighborhoodDef[] = [
  { name: 'Downtown Financial Hub', centerLat: 40.7128, centerLng: -74.006, prefix: 'Financial' },
  { name: 'Midtown Commercial Corridor', centerLat: 40.7549, centerLng: -73.984, prefix: 'Midtown' },
  { name: 'West End Medical Center', centerLat: 40.768, centerLng: -73.987, prefix: 'Medical' },
  { name: 'Riverside Residential District', centerLat: 40.741, centerLng: -74.004, prefix: 'Riverside' },
  { name: 'North Tech & Creative Campus', centerLat: 40.772, centerLng: -73.955, prefix: 'Tech' },
  { name: 'Harbor Gateway Towers', centerLat: 40.704, centerLng: -74.015, prefix: 'Harbor' },
  { name: 'University & Research Quarter', centerLat: 40.729, centerLng: -73.996, prefix: 'University' },
  { name: 'Eastside Residential Complex', centerLat: 40.748, centerLng: -73.972, prefix: 'Eastside' },
];

const ELEVATOR_BRANDS = [
  'Otis SkyRise Gen2',
  'Schindler 5500 MRL',
  'KONE MonoSpace 700',
  'Thyssenkrupp Synergy 300',
  'Mitsubishi Electric Diamond Trac',
  'Fujitec Zexia Traction',
];

const BUILDING_NAMES = [
  'Apex Commerce Tower', 'Meridian Exchange Plaza', 'Beacon Financial Center', 'Sovereign Bank Building',
  'The Metropolitan Tower', 'Centurion Hall', 'St. Jude Medical Pavilion', 'Columbia Health Annex',
  'Bellevue Specialty Care', 'Hudson Riverfront Residences', 'Marina View Lofts', 'The Grand Atrium',
  'One Liberty Place', 'Parkview Corporate Center', 'North Point Media Labs', 'Foundry Innovation Hub',
  'Vanguard Life Sciences', 'Horizon Tech Center', 'Trinity Court Offices', 'Federal Reserve Chambers',
  'Lexington Square Tower', 'Crown Heights Manor', 'The Continental Suites', 'Empire Telecommunications Hub',
  'Bayside Terminal Offices', 'Skyline Horizon Residences', 'Pinnacle Center West', 'Crosstown Logistics Hub',
  'Franklin Heritage Lofts', 'Sutton Place Residences', 'Governors Island Marina Office', 'Canal Street Commerce',
  'Westgate Medical Plaza', 'Manhattan View Tower', 'Chelsea Gallery Lofts', 'Hudson Yards South Tower',
  'Battery Park Plaza', 'Exchange Place Center', 'Broadway Arts Pavilion', 'Fifth Avenue Executive Suites',
  'Madison Avenue Offices', 'Gramercy Park Manor', 'Flatiron Architectural Tower', 'Union Square Corporate',
  'Tribeca Waterfront Lofts', 'SoHo Cast Iron Building', 'Greenwich Village Lofts', 'Washington Square Annex',
  'Ninth Avenue Commercial', 'Columbus Circle Tower', 'Lincoln Center Plaza', 'Upper Westside Pavilion',
  'Riverside Boulevard Tower', 'Amsterdam Avenue Lofts', 'Yorkville Residential Plaza', 'Carnegie Hill Manor',
  'Lenox Hill Health Tower', 'Midtown South Innovation Hub', 'Herald Square Plaza', 'Bryant Park Executive Suites'
];

const MANAGERS = [
  { name: 'Robert Vance', phone: '+1 (555) 782-1144' },
  { name: 'Elena Rostova', phone: '+1 (555) 893-2255' },
  { name: 'David Kim', phone: '+1 (555) 431-3366' },
  { name: 'Clara Oswald', phone: '+1 (555) 672-4477' },
  { name: 'Arthur Pendelton', phone: '+1 (555) 238-5588' },
  { name: 'Mariana Silva', phone: '+1 (555) 914-6699' },
  { name: 'Kenneth Brooks', phone: '+1 (555) 349-7700' },
  { name: 'Grace Hopper', phone: '+1 (555) 512-8811' },
];

function generate160Sites(): BuildingSite[] {
  const sites: BuildingSite[] = [];
  let idCounter = 1;

  for (const n of NEIGHBORHOODS) {
    const siteCount = 20;
    for (let i = 0; i < siteCount; i++) {
      const id = `site-${String(idCounter).padStart(3, '0')}`;
      const nameIndex = (idCounter - 1) % BUILDING_NAMES.length;
      const baseName = BUILDING_NAMES[nameIndex];
      const name = i < BUILDING_NAMES.length ? `${baseName} ${i > 7 ? `#${(i % 5) + 1}` : ''}`.trim() : `${n.name} Building ${i + 1}`;

      // Local cluster coordinate distribution
      const latOffset = (Math.sin(idCounter * 12.7) * 0.006) + ((i % 5 - 2) * 0.0015);
      const lngOffset = (Math.cos(idCounter * 14.3) * 0.007) + ((Math.floor(i / 5) - 2) * 0.0018);

      const lat = Number((n.centerLat + latOffset).toFixed(6));
      const lng = Number((n.centerLng + lngOffset).toFixed(6));

      const streetNum = 100 + ((idCounter * 17) % 850);
      const streetName = ['Broadway', 'Park Ave', 'Madison St', 'Lexington Ave', 'Water St', 'Hudson St', 'Riverside Dr', 'West End Ave', 'Grand St', 'Pine St'][idCounter % 10];
      const address = `${streetNum} ${streetName}, New York, NY`;

      const floors = 4 + ((idCounter * 7) % 48);
      const elevatorUnits = 2 + ((idCounter * 3) % 9);
      const elevatorBrand = ELEVATOR_BRANDS[idCounter % ELEVATOR_BRANDS.length];

      // 2 Categories: Public (Shared emergency pool ~25%) vs Private (Assigned to tech email ~75%)
      const isPublicShared = idCounter % 4 === 0;
      const category = isPublicShared ? 'public' : 'private';

      // Primary tech assignment
      const assignedTech = isPublicShared
        ? 'shared@elevatortech.io'
        : (idCounter % 3 === 0 || idCounter % 5 === 0)
        ? 'adam.osama60@gmail.com'
        : TECHNICIANS[idCounter % TECHNICIANS.length].email;

      const manager = MANAGERS[idCounter % MANAGERS.length];
      const accessCode = `#${1000 + ((idCounter * 137) % 8999)}*`;

      // Elevator numbers / IDs
      const unitNames = Array.from({ length: elevatorUnits }, (_, idx) =>
        idx === elevatorUnits - 1 && elevatorUnits > 2 ? `L${idx + 1} (Freight / Service)` : `L${idx + 1} (Pass)`
      ).join(', ');

      // Seed ~55% as visited in October 2026
      const isVisited = (idCounter % 2 === 0 || idCounter % 3 === 0) && (idCounter % 7 !== 0);
      const visitDay = 1 + ((idCounter * 3) % 2) + ((idCounter * 7) % 3);
      const visitHour = 8 + (idCounter % 9);
      const visitMin = (idCounter * 13) % 60;
      const visitSec = (idCounter * 29) % 60;
      const formattedDate = `2026-10-0${visitDay}`;
      const formattedTime = `${String(visitHour).padStart(2, '0')}:${String(visitMin).padStart(2, '0')}:${String(visitSec).padStart(2, '0')}`;

      // Visit Types: 'monthly' vs 'fault' vs 'emergency'
      const isFault = idCounter % 9 === 0;
      const isEmergency = idCounter === 42 || idCounter === 98 || idCounter === 134;
      const visitType = isEmergency ? 'emergency' : isFault ? 'fault' : 'monthly';
      const status: InspectionStatus = isEmergency ? 'critical' : isFault ? 'attention_needed' : 'passed';

      // Multi-technician team (sometimes 2 or 3 technicians visit together!)
      const attendingTechs =
        idCounter % 6 === 0
          ? ['Adam Osama', 'Sarah Chen', 'Michael Torres']
          : idCounter % 3 === 0
          ? ['Adam Osama', 'David Kim']
          : [TECHNICIANS.find((t) => t.email === assignedTech)?.name || 'Adam Osama'];

      const partsReplaced = isEmergency
        ? 'Main safety governor switch, 2x traction sheave liner pads'
        : isFault
        ? 'Car 1 door interlock roller, landing photoelectric sensor'
        : 'None - routine preventive lubrication and contact cleaning';

      const notes = isEmergency
        ? 'Emergency shutdown resolved. Car 1 leveled and safety brake recalibrated by team of 3 technicians.'
        : isFault
        ? 'Reported door sticking on 8th floor. Replaced worn door guide shoes and adjusted belt tension.'
        : 'Standard monthly preventive maintenance completed. Door reopening safety curtain verified.';

      const lastVisit: VisitRecord | undefined = isVisited
        ? {
            id: `visit-${idCounter}`,
            siteId: id,
            siteName: name,
            address,
            neighborhood: n.name,
            date: formattedDate,
            time: formattedTime,
            monthYear: '2026-10',
            visitType,
            technicianEmail: assignedTech === 'shared@elevatortech.io' ? 'adam.osama60@gmail.com' : assignedTech,
            technicianName: attendingTechs[0],
            attendingTechnicians: attendingTechs,
            status,
            checklist: {
              doorSensors: !isEmergency,
              carLeveling: !isFault,
              hoistwayCables: true,
              emergencyComm: true,
              machineRoom: !isEmergency,
            },
            partsReplaced,
            notes,
            durationMinutes: 25 + ((idCounter * 7) % 35),
          }
        : undefined;

      const visitHistory: VisitRecord[] = lastVisit ? [lastVisit] : [];

      // If it had a fault visit, also add an initial monthly maintenance visit earlier in the month
      if (lastVisit && (visitType === 'fault' || visitType === 'emergency')) {
        visitHistory.unshift({
          id: `visit-initial-${idCounter}`,
          siteId: id,
          siteName: name,
          address,
          neighborhood: n.name,
          date: '2026-10-01',
          time: '09:15:00',
          monthYear: '2026-10',
          visitType: 'monthly',
          technicianEmail: assignedTech === 'shared@elevatortech.io' ? 'sarah.chen@elevatortech.io' : assignedTech,
          technicianName: 'Sarah Chen',
          attendingTechnicians: ['Sarah Chen'],
          status: 'passed',
          checklist: {
            doorSensors: true,
            carLeveling: true,
            hoistwayCables: true,
            emergencyComm: true,
            machineRoom: true,
          },
          partsReplaced: 'None',
          notes: 'Regular scheduled monthly service passed without issues.',
          durationMinutes: 25,
        });
      }

      sites.push({
        id,
        name,
        address,
        neighborhood: n.name,
        category,
        latitude: lat,
        longitude: lng,
        floors,
        elevatorUnits,
        elevatorBrand,
        elevatorNumbers: unitNames,
        assignedTechnicianEmail: assignedTech,
        managerName: manager.name,
        managerPhone: manager.phone,
        accessCode,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`,
        notes: `Elevator machine room on ${floors > 10 ? 'Rooftop Penthouse' : 'Basement Level B1'}. Key code: ${accessCode}`,
        priority: isEmergency ? 'fault_alert' : idCounter % 15 === 0 ? 'vip' : 'normal',
        lastVisit,
        visitHistory,
      });

      idCounter++;
    }
  }

  return sites;
}

export const INITIAL_SITES: BuildingSite[] = generate160Sites();
