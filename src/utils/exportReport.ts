import { BuildingSite, VisitRecord } from '../types';

/**
 * Escapes fields for CSV according to RFC 4180
 */
function escapeCsv(val: string | number | boolean | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports site logs to CSV file and triggers client-side download
 */
export function exportSitesToCsv(sites: BuildingSite[], filenamePrefix = 'elevator_maintenance_report'): void {
  const headers = [
    'Site ID',
    'Building Name',
    'Address',
    'Neighborhood',
    'Category (Public/Private)',
    'Floors',
    'Elevator Units',
    'Elevator Numbers / IDs',
    'Elevator Brand',
    'Assigned Technician',
    'Building Manager',
    'Manager Phone',
    'Access Key Code',
    'Current Month Status',
    'Visit Purpose / Type',
    'Visit Date',
    'Visit Time',
    'Attending Team (Technicians)',
    'Parts Replaced / Repaired',
    'Inspection Outcome',
    'Door Sensors Checked',
    'Car Leveling Checked',
    'Hoistway Cables Checked',
    'Emergency Comm Checked',
    'Machine Room Checked',
    'Technician Notes',
  ];

  const rows = sites.map((site) => {
    const v = site.lastVisit;
    return [
      escapeCsv(site.id),
      escapeCsv(site.name),
      escapeCsv(site.address),
      escapeCsv(site.neighborhood),
      escapeCsv(site.category === 'public' ? 'PUBLIC_SHARED_POOL' : 'PRIVATE_ASSIGNED'),
      escapeCsv(site.floors),
      escapeCsv(site.elevatorUnits),
      escapeCsv(site.elevatorNumbers || 'L1-L' + site.elevatorUnits),
      escapeCsv(site.elevatorBrand),
      escapeCsv(site.assignedTechnicianEmail),
      escapeCsv(site.managerName),
      escapeCsv(site.managerPhone),
      escapeCsv(site.accessCode),
      escapeCsv(v ? 'VISITED' : 'PENDING'),
      escapeCsv(v ? String(v.visitType || 'monthly').toUpperCase() : 'PENDING'),
      escapeCsv(v ? (v.date || 'N/A') : 'N/A'),
      escapeCsv(v ? (v.time || 'N/A') : 'N/A'),
      escapeCsv(v ? (Array.isArray(v.attendingTechnicians) ? v.attendingTechnicians.join(' & ') : v.technicianName || 'N/A') : 'N/A'),
      escapeCsv(v ? (v.partsReplaced || 'None') : 'None'),
      escapeCsv(v ? String(v.status || 'passed').toUpperCase() : 'NOT_INSPECTED'),
      escapeCsv(v && v.checklist ? (v.checklist.doorSensors ? 'PASS' : 'FAIL') : 'N/A'),
      escapeCsv(v && v.checklist ? (v.checklist.carLeveling ? 'PASS' : 'FAIL') : 'N/A'),
      escapeCsv(v && v.checklist ? (v.checklist.hoistwayCables ? 'PASS' : 'FAIL') : 'N/A'),
      escapeCsv(v && v.checklist ? (v.checklist.emergencyComm ? 'PASS' : 'FAIL') : 'N/A'),
      escapeCsv(v && v.checklist ? (v.checklist.machineRoom ? 'PASS' : 'FAIL') : 'N/A'),
      escapeCsv(v ? (v.notes || site.notes) : site.notes),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${filenamePrefix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface ReportSummaryData {
  period: ReportPeriod;
  dateStr: string;
  technicianName: string;
  technicianEmail: string;
  totalAssigned: number;
  visitedCount: number;
  pendingCount: number;
  completionRate: number;
  criticalIssues: BuildingSite[];
  attentionNeeded: BuildingSite[];
  completedTodaySites: BuildingSite[];
}

/**
 * Builds email report body and subject line
 */
export function generateEmailReport(data: ReportSummaryData): { subject: string; body: string } {
  const periodTitle =
    data.period === 'daily'
      ? 'Daily Maintenance Route Wrap-Up'
      : data.period === 'weekly'
      ? 'Weekly Field Operations Summary'
      : 'Monthly Elevator Contract Compliance Audit';

  const subject = `[ElevatorOps Report] ${periodTitle} - ${data.dateStr} (${data.technicianName})`;

  const criticalSection =
    data.criticalIssues.length > 0
      ? `\n[!] CRITICAL SAFETY / EMERGENCY CALLOUTS (${data.criticalIssues.length}):\n` +
        data.criticalIssues
          .map(
            (s) =>
              `- ${s.name} (${s.address})\n  Units: ${s.elevatorUnits} [${s.elevatorNumbers || 'Lifts'}] | Team: ${Array.isArray(s.lastVisit?.attendingTechnicians) ? s.lastVisit.attendingTechnicians.join(', ') : s.lastVisit?.technicianName || 'Specialist'}\n  Parts Replaced: ${s.lastVisit?.partsReplaced || 'None'}\n  Diagnostic Note: ${s.lastVisit?.notes || 'Requires immediate shutdown investigation'}`
          )
          .join('\n\n')
      : '\n[OK] CRITICAL DEFECTS: None reported. All active elevators running in nominal safety limits.';

  const attentionSection =
    data.attentionNeeded.length > 0
      ? `\n[i] FAULT / MINOR REPAIRS LOGGED (${data.attentionNeeded.length}):\n` +
        data.attentionNeeded
          .slice(0, 5)
          .map(
            (s) =>
              `- ${s.name} (${s.neighborhood}): Repaired by [${Array.isArray(s.lastVisit?.attendingTechnicians) ? s.lastVisit.attendingTechnicians.join(', ') : s.lastVisit?.technicianName || 'Team'}]. Parts: ${s.lastVisit?.partsReplaced || 'None'}. Note: ${s.lastVisit?.notes || 'Adjusted'}`
          )
          .join('\n')
      : '';

  const completedTodayList =
    data.completedTodaySites.length > 0
      ? `\n[+] RECENT VISITS LOGGED TODAY (${data.completedTodaySites.length}):\n` +
        data.completedTodaySites
          .map(
            (s, idx) =>
              `${idx + 1}. [${s.lastVisit?.time || 'Visited'}] ${s.name} - ${s.elevatorUnits} Lifts | Type: ${String(s.lastVisit?.visitType || 'monthly').toUpperCase()} | Team: ${Array.isArray(s.lastVisit?.attendingTechnicians) ? s.lastVisit.attendingTechnicians.join(', ') : s.lastVisit?.technicianName || 'Specialist'}`
          )
          .join('\n')
      : '\n[+] RECENT VISITS LOGGED TODAY: None recorded on this shift yet.';

  const body = `ELEVATOR OPERATIONS FIELD DISPATCH REPORT
----------------------------------------------------
Report Type: ${periodTitle}
Date: ${data.dateStr}
Primary Specialist: ${data.technicianName} <${data.technicianEmail}>
----------------------------------------------------

KEY PERFORMANCE METRICS:
- Total Assigned Sites: ${data.totalAssigned}
- Completed Visits: ${data.visitedCount}
- Pending Sites Remaining: ${data.pendingCount}
- Monthly Route Completion: ${data.completionRate.toFixed(1)}%

${criticalSection}
${attentionSection}
${completedTodayList}

----------------------------------------------------
Generated by ElevatorOps Smart Dispatch Platform
System Time: ${new Date().toLocaleString()}
`;

  return { subject, body };
}

/**
 * Creates mailto link
 */
export function buildMailtoUrl(subject: string, body: string, recipient = ''): string {
  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
