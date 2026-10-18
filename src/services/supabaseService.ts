import { getSupabase, isSupabaseConfigured } from '../utils/supabase';
import { BuildingSite, Technician, VisitRecord } from '../types';

// Convert DB site row to BuildingSite model
function mapDbSiteToModel(row: any, visits: VisitRecord[] = []): BuildingSite {
  const siteVisits = visits.filter((v) => v.siteId === row.id);
  const lastVisit = row.last_visit || (siteVisits.length > 0 ? siteVisits[0] : undefined);

  return {
    id: row.id,
    name: row.name,
    address: row.address,
    neighborhood: row.neighborhood || '',
    category: row.category || 'private',
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    floors: Number(row.floors) || 1,
    elevatorUnits: Number(row.elevator_units) || 1,
    elevatorBrand: row.elevator_brand || 'Otis',
    elevatorNumbers: row.elevator_numbers || '',
    assignedTechnicianEmail: row.assigned_technician_email || 'adam.osama60@gmail.com',
    managerName: row.manager_name || '',
    managerPhone: row.manager_phone || '',
    accessCode: row.access_code || '',
    googleMapsUrl: row.google_maps_url || '',
    notes: row.notes || '',
    priority: row.priority || 'normal',
    lastVisit: lastVisit,
    visitHistory: siteVisits,
  };
}

// Convert BuildingSite model to DB row
function mapModelToDbSite(site: BuildingSite): any {
  return {
    id: site.id,
    name: site.name,
    address: site.address,
    neighborhood: site.neighborhood,
    category: site.category,
    latitude: site.latitude,
    longitude: site.longitude,
    floors: site.floors,
    elevator_units: site.elevatorUnits,
    elevator_brand: site.elevatorBrand,
    elevator_numbers: site.elevatorNumbers || '',
    assigned_technician_email: site.assignedTechnicianEmail,
    manager_name: site.managerName || '',
    manager_phone: site.managerPhone || '',
    access_code: site.accessCode || '',
    google_maps_url: site.googleMapsUrl || '',
    notes: site.notes || '',
    priority: site.priority || 'normal',
    last_visit: site.lastVisit || null,
    updated_at: new Date().toISOString(),
  };
}

// Convert DB visit row to VisitRecord
function mapDbVisitToModel(row: any): VisitRecord {
  return {
    id: row.id,
    siteId: row.site_id,
    siteName: row.site_name,
    address: row.address || '',
    neighborhood: row.neighborhood || '',
    date: row.date,
    time: row.time,
    monthYear: row.month_year,
    visitType: row.visit_type,
    technicianEmail: row.technician_email,
    technicianName: row.technician_name,
    attendingTechnicians: Array.isArray(row.attending_technicians) ? row.attending_technicians : [],
    status: row.status,
    checklist: row.checklist || {
      doorSensors: true,
      carLeveling: true,
      hoistwayCables: true,
      emergencyComm: true,
      machineRoom: true,
    },
    partsReplaced: row.parts_replaced || 'None',
    notes: row.notes || '',
    durationMinutes: Number(row.duration_minutes) || 30,
  };
}

// Convert VisitRecord to DB visit row
function mapModelToDbVisit(visit: VisitRecord): any {
  return {
    id: visit.id,
    site_id: visit.siteId,
    site_name: visit.siteName,
    address: visit.address,
    neighborhood: visit.neighborhood,
    date: visit.date,
    time: visit.time,
    month_year: visit.monthYear,
    visit_type: visit.visitType,
    technician_email: visit.technicianEmail,
    technician_name: visit.technicianName,
    attending_technicians: visit.attendingTechnicians,
    status: visit.status,
    checklist: visit.checklist,
    parts_replaced: visit.partsReplaced,
    notes: visit.notes,
    duration_minutes: visit.durationMinutes,
  };
}

// Fetch all sites with their visits from Supabase
export async function fetchSitesFromSupabase(): Promise<BuildingSite[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const [sitesRes, visitsRes] = await Promise.all([
      supabase.from('sites').select('*').order('name'),
      supabase.from('visits').select('*').order('date', { ascending: false }),
    ]);

    if (sitesRes.error) {
      console.warn('Error fetching sites from Supabase:', sitesRes.error.message);
      return null;
    }

    const visits: VisitRecord[] = (visitsRes.data || []).map(mapDbVisitToModel);
    return (sitesRes.data || []).map((row) => mapDbSiteToModel(row, visits));
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return null;
  }
}

// Upsert a single site
export async function upsertSiteToSupabase(site: BuildingSite): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('sites').upsert(mapModelToDbSite(site));
    if (error) {
      console.error('Error upserting site to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase upsert error:', err);
    return false;
  }
}

// Delete site
export async function deleteSiteFromSupabase(siteId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('sites').delete().eq('id', siteId);
    return !error;
  } catch (err) {
    console.error('Supabase delete error:', err);
    return false;
  }
}

// Save a visit and update site last_visit
export async function saveVisitToSupabase(siteId: string, visit: VisitRecord): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    // 1. Insert visit row
    const { error: visitErr } = await supabase.from('visits').upsert(mapModelToDbVisit(visit));
    if (visitErr) {
      console.error('Error saving visit to Supabase:', visitErr);
      return false;
    }

    // 2. Update site last_visit
    await supabase.from('sites').update({
      last_visit: visit,
      updated_at: new Date().toISOString(),
    }).eq('id', siteId);

    return true;
  } catch (err) {
    console.error('Supabase visit save error:', err);
    return false;
  }
}

// Fetch Technicians
export async function fetchTechniciansFromSupabase(): Promise<Technician[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('technicians').select('*').order('name');
    if (error) return null;

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      role: row.role || 'Field Technician',
      assignedCount: Number(row.assigned_count) || 0,
      avatarColor: row.avatar_color || 'bg-blue-600',
    }));
  } catch (err) {
    console.error('Supabase technicians fetch error:', err);
    return null;
  }
}

// Upsert Technician
export async function upsertTechnicianToSupabase(tech: Technician): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('technicians').upsert({
      id: tech.id,
      name: tech.name,
      email: tech.email,
      phone: tech.phone,
      role: tech.role,
      assigned_count: tech.assignedCount,
      avatar_color: tech.avatarColor,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch (err) {
    return false;
  }
}

// Delete Technician
export async function deleteTechnicianFromSupabase(techId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('technicians').delete().eq('id', techId);
    return !error;
  } catch (err) {
    return false;
  }
}

// Batch Sync / Seed local data to Supabase
export async function uploadSeedDataToSupabase(
  sites: BuildingSite[],
  technicians: Technician[]
): Promise<{ success: boolean; message: string; count: number }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase client is not configured.', count: 0 };
  }

  try {
    // 1. Upload Technicians
    const techRows = technicians.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      role: t.role,
      assigned_count: t.assignedCount,
      avatar_color: t.avatarColor,
    }));
    const { error: techErr } = await supabase.from('technicians').upsert(techRows);
    if (techErr) {
      return { success: false, message: `Technicians sync failed: ${techErr.message}`, count: 0 };
    }

    // 2. Upload Sites
    const siteRows = sites.map(mapModelToDbSite);
    const { error: sitesErr } = await supabase.from('sites').upsert(siteRows);
    if (sitesErr) {
      return { success: false, message: `Sites sync failed: ${sitesErr.message}`, count: 0 };
    }

    return {
      success: true,
      message: `Successfully migrated ${sites.length} sites and ${technicians.length} technicians to Supabase!`,
      count: sites.length,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Upload failed', count: 0 };
  }
}
