# Elevator Operations & Smart Route Maintenance Platform

A specialized field operations platform for elevator maintenance teams to manage 150+ monthly building contracts, eliminate backtracking with spatial clustering and route optimization, log verifiable on-site inspections with checklists and timestamps, and generate automated daily, weekly, and monthly performance reports.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following operational decisions were confirmed during the planning phase:

- **Confirmed Route Generation**: **Auto-cluster nearby sites with optimized driving sequence**. Technicians select their starting hub or target neighborhood, and the system automatically groups adjacent buildings within target travel radii, sequencing them to minimize travel time and prevent forgetting nearby sites.
- **Confirmed Export & Reporting**: **Excel and CSV download plus automated email summary report generator**. Generates one-click clean `.xlsx` / `.csv` sheets with visit date, exact time, technician ID, elevator unit count, and inspection status, alongside pre-formatted email digests for Daily, Weekly, and Monthly supervisor reporting.
- **Confirmed Site Visit Scope**: **Quick checklist, visit timestamp, status, and notes**. Each site log captures arrival timestamp, elevator operational status (e.g. *Operational*, *Requires Follow-up*, *Out of Service*), key safety inspection points (door mechanisms, leveling accuracy, emergency communication, machine room cleanliness), and technician observations.
- **Confirmed Device Adaptability**: **Touch-first ergonomic field interface with responsive desktop dispatch console**. Designed for mobile technician use on-site (44px+ touch hitboxes, bottom action bar, offline-safe local persistence) alongside full-screen desktop dispatch management.

---

## 1. Overview & Core Concept

### What It Does
The platform replaces paper building lists with a digital operations hub:
1. **Technician Allocation & Workspace**: Each technician (e.g., Adam, Sarah, Mike) logs in with their email/profile to view their monthly assigned portfolio of buildings across city districts.
2. **Site Directory & Management**: Full CRUD capabilities to add new contracted buildings, update elevator specs (unit count, brand, floor count, key access codes, building manager contacts), search/filter by status, and assign sites between team members.
3. **Smart Cluster & Route Sequencer**: Visualizes all allocated sites on an interactive map. Groups sites within walking or short driving radius into clustered daily batches (e.g., 6–10 sites/day), calculating an optimized visit sequence to prevent backtracking.
4. **On-Site Inspection Logger**: One-tap check-in with automatic local timestamping, quick 5-point safety inspection checklist, photo/note field, and status mark (*Visited for current month*).
5. **Supervisor Reports & Data Export**: Instant generation of daily technician route logs, weekly completion progress bars, monthly audit sheets in CSV/Excel format, and an email-ready report copy tool.

### Target Audience & Persona
- **Field Elevator Technicians**: Mobile-first users who need quick route directions, instant building contact codes, fast checklist taps, and zero-friction check-ins without tedious paperwork.
- **Lead Technicians & Field Supervisors**: Review monthly completion coverage (e.g. 112/150 visited, 38 remaining), monitor overdue buildings, reassign routes, and export audit trails for building owners.

### Key Value
- **Zero Backtracking**: Eliminates wasted fuel and lost hours caused by visiting building A, skipping building B next door, and having to return the following day.
- **100% Monthly Compliance**: Clear visual trackers and filterable lists guarantee zero buildings are overlooked before the month ends.
- **Verifiable Audit Records**: Eliminates disputed maintenance records by capturing exact date, time, and technician signatures for every site.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Technician Start-of-Day Flow**:
   - Technician selects or signs into their account (`adam.osama60@gmail.com`).
   - Dashboard loads the current month's overview: total assigned sites, sites visited this month, pending sites, and completion rate.
   - Technician taps **"Plan Today's Route"**: selects a target starting cluster or allows the smart optimizer to suggest today's batch (6–8 nearby pending sites).
   - Map displays numbered sequence pins with driving/walking path and turn-by-turn navigation link to Google Maps.
2. **On-Site Execution Flow**:
   - Arriving at Building #1, technician taps the building card.
   - Views access notes, floor count, manager phone, and elevator unit IDs.
   - Performs check: toggles 5 rapid inspection items (Door detectors, car leveling, hoistway cables, emergency phone, machine room).
   - Taps **"Complete Visit"**: captures exact date & timestamp, records status as *Nominal* or *Attention Needed*, and transitions the site to *Visited*.
   - Next waypoint on the route immediately becomes active.
3. **Supervisor / Manager Reporting Flow**:
   - Filter by date range, technician, or neighborhood.
   - Click **"Export Excel / CSV"** to generate timestamped raw logs.
   - Click **"Generate Email Report"** to create a structured Markdown/HTML email summary ready to send to building owners or regional managers.
4. **Site Directory Management Flow**:
   - Add new sites with coordinates, elevator counts, and building codes.
   - Full-scale seed dataset of 150+ realistic maintenance buildings across key districts for immediate operational simulation.

### Visual Identity & Theme
- **Aesthetic Direction**: Utilitarian Industrial SaaS & Rugged Field Console. High-contrast, clean lines, zero decorative AI slop, dense data readability in bright outdoor daylight.
- **Color Palette**:
  - Dominant Canvas: Crisp neutral white (`#FFFFFF`) with cool slate field background (`#F8FAFC`).
  - Structural Surfaces: Pure slate containers (`#FFFFFF` with `#E2E8F0` hairline borders).
  - Primary Brand & Action: Precision Safety Navy / Cobalt (`#0F172A` / `#2563EB`) for high-contrast visibility.
  - Semantic Status:
    - *Completed / Visited*: Emerald (`#059669` / `#ECFDF5`)
    - *Pending / Queued*: Slate / Amber Accent (`#475569` / `#D97706`)
    - *Critical / Attention Needed*: Crimson (`#DC2626` / `#FEF2F2`)
- **Typography & Hierarchy**:
  - Headings & Brand: `Plus Jakarta Sans` font (weight 600/700, geometric, crisp).
  - Body & Form Controls: `Plus Jakarta Sans` / `Satoshi` (weight 400/500).
  - Timestamps, IDs & Telemetry: Monospace tabular numerals (`font-mono tabular-nums`).
- **Ergonomics & Touch Discipline**:
  - 48px minimum touch targets for all primary mobile buttons and checklist toggles.
  - Sticky bottom action bar on mobile viewports capped under 12% screen height.
  - Zero-pill metadata: Building addresses, dates, and elevator counts rendered as clean typographic strings with dot separators (`14 Floors · 3 Units · Assigned to Adam`).

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Spatial Clustering & Sequence Heuristic
- **Chosen Approach**: Client-side K-Means / Radius-based geographic clustering combined with a 2-Opt Nearest-Neighbor Traveling Salesperson (TSP) heuristic, paired with interactive Map visualization.
- **Why**: Allows technicians to instantly generate an optimal 6–10 stop daily itinerary from 150+ sites in under 50ms without server delays or rate limits, while calculating accurate turn-by-turn Google Maps deep-links for in-car GPS.
- **Alternatives Considered**: Manual ordering (too prone to technician guesswork and backtracking) or rigid calendar assignment (inflexible when weather, traffic, or emergency shutdowns delay a day's schedule).

### Decision 2: Multi-Technician Profiles & Persistence Architecture
- **Chosen Approach**: Robust client-side reactive state engine with persistent LocalStorage auto-sync and seed loader, supporting multiple technician profiles and email switches.
- **Why**: Guarantees zero data loss if field technicians enter elevators or underground machine rooms with spotty cell connectivity. All edits, check-ins, and timestamp records persist immediately.
- **Alternatives Considered**: Pure remote database without offline caching (would fail when technicians lose signal in basements or elevator shafts).

### Decision 3: Excel/CSV & Multi-Frequency Email Report Engine
- **Chosen Approach**: Built-in CSV/Excel sheet generator using standard RFC 4180 formatting + structured email report generator with templates for Daily Route Wrap-up, Weekly Velocity, and Monthly Client Compliance.
- **Why**: Fully satisfies user's explicit requirement to export spreadsheets for payroll/audits and email stakeholders without requiring third-party SaaS subscriptions.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ELEVATOR OPS FIELD PLATFORM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │   Technician Switcher │  │           Month & Progress HUD             │  │
│  │  [adam.osama60@...] ▼ │  │  [ 86/154 Visited · 56% Completion · 68 Left]│  │
│  └───────────┬───────────┘  └─────────────────────┬──────────────────────┘  │
│              │                                    │                         │
│  ┌───────────▼────────────────────────────────────▼──────────────────────┐  │
│  │                          MAIN VIEW TABS                               │  │
│  │   [ 1. Daily Route Planner ]  [ 2. Sites Directory ]  [ 3. Reports ]  │  │
│  └───────────────────┬───────────────────────────────────────────────────┘  │
│                      │                                                      │
│  ┌───────────────────▼───────────────────────────────────────────────────┐  │
│  │                     VIEW 1: SMART ROUTE PLANNER                       │  │
│  │ ┌───────────────────────────────────┐ ┌─────────────────────────────┐ │  │
│  │ │ Cluster Controls & Site Selection │ │ Interactive Route Map       │ │  │
│  │ │ - Cluster Radius (1km, 3km, 5km)  │ │ - Clustered Waypoint Pins   │ │  │
│  │ │ - Auto-Optimize Sequence (TSP)    │ │ - Path Trajectory Polyline  │ │  │
│  │ │ - 8 Sites Queued for Today        │ │ - Google Maps Nav Deeplink  │ │  │
│  │ └───────────────────────────────────┘ └─────────────────────────────┘ │  │
│  │ ┌───────────────────────────────────────────────────────────────────┐ │  │
│  │ │ Active Waypoint Inspection Card (Checklist + Status + Check-In)   │ │  │
│  │ └───────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────┐         ┌───────────────────────────────┐  │
│  │ VIEW 2: SITES DIRECTORY     │         │ VIEW 3: REPORTS & EXPORT      │  │
│  │ - 150+ Building Master List │         │ - Excel / CSV Downloader      │  │
│  │ - Add / Edit / Delete Modal │         │ - Daily Route Wrap-up Email   │  │
│  │ - Search, Filter, Reassign  │         │ - Monthly Compliance Summary  │  │
│  └─────────────────────────────┘         └───────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Data Entities

```typescript
interface BuildingSite {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  floors: number;
  elevatorUnits: number;
  elevatorBrand: string; // Otis, Schindler, KONE, Thyssenkrupp, etc.
  assignedTechnicianEmail: string;
  managerName: string;
  managerPhone: string;
  accessCode: string;
  notes: string;
  lastVisit?: {
    date: string; // YYYY-MM-DD
    time: string; // HH:mm:ss
    monthYear: string; // YYYY-MM
    technicianEmail: string;
    status: 'passed' | 'attention_needed' | 'critical';
    checklist: {
      doorSensors: boolean;
      carLeveling: boolean;
      hoistwayCables: boolean;
      emergencyComm: boolean;
      machineRoom: boolean;
    };
    notes: string;
  };
}

interface RouteStop {
  stopNumber: number;
  site: BuildingSite;
  distanceFromPrevKm: number;
  estimatedDriveMin: number;
}
```

### Verification & Implementation Safeguards
- Pre-populated realistic initial dataset of 150+ commercial & residential elevator buildings with authentic locations, equipment models, and coordinates.
- Full working handlers for all controls: filter, cluster recalculation, sequence optimization, modal add/edit/delete, visit completion, CSV export, and email generator.
- Production build validation with zero TypeScript compile or lint errors.
