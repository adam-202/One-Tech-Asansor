import { BuildingSite, Technician } from '../types';

/**
 * Normalizes email for case-insensitive comparison, handling Turkish dotted/dotless I
 */
export function normalizeEmail(email?: string | null): string {
  if (!email) return '';
  return email
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase();
}

/**
 * Returns an array of clean lowercase technician emails assigned to a site
 */
export function getSiteAssignedEmails(site: {
  assignedTechnicianEmail?: string;
  assignedTechnicianEmails?: string[];
}): string[] {
  if (Array.isArray(site.assignedTechnicianEmails) && site.assignedTechnicianEmails.length > 0) {
    return site.assignedTechnicianEmails.map(normalizeEmail).filter(Boolean);
  }
  if (!site.assignedTechnicianEmail) return [];
  return site.assignedTechnicianEmail
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
}

/**
 * Checks whether a site is assigned to a specific technician email
 */
export function isSiteAssignedTo(
  site: {
    category?: string;
    assignedTechnicianEmail?: string;
    assignedTechnicianEmails?: string[];
  },
  techEmail?: string | null
): boolean {
  if (!techEmail) return false;
  if (site.category === 'public') return true;
  const emails = getSiteAssignedEmails(site);
  return emails.includes(normalizeEmail(techEmail));
}

/**
 * Formats an array of emails into a clean comma-separated string for DB storage
 */
export function formatAssignedEmails(emails: string[]): string {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const e of emails) {
    const clean = e.trim();
    const key = normalizeEmail(clean);
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(clean);
    }
  }
  return result.join(', ');
}

/**
 * Returns an array of Technician objects assigned to a site
 */
export function getAssignedTechnicians(
  site: {
    assignedTechnicianEmail?: string;
    assignedTechnicianEmails?: string[];
  },
  allTechnicians: Technician[]
): Technician[] {
  const emails = getSiteAssignedEmails(site);
  return allTechnicians.filter((t) => emails.includes(normalizeEmail(t.email)));
}
