import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_PROJECT_ID = 'qdjlqmtmpbhidloxaxea';
export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;

const STORAGE_SUPABASE_URL = 'elevatorops_supabase_url';
const STORAGE_SUPABASE_KEY = 'elevatorops_supabase_key';

export function getSupabaseConfig(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  
  const savedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_SUPABASE_URL) : null;
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_SUPABASE_KEY) : null;

  return {
    url: envUrl || savedUrl || DEFAULT_SUPABASE_URL,
    key: envKey || savedKey || '',
  };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_SUPABASE_KEY, key.trim());
  }
  supabaseInstance = null; // reset cached instance
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const { key } = getSupabaseConfig();
  return Boolean(key && key.trim().length > 10);
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase Anon Key is not set. Please provide your Supabase API key.',
    };
  }

  try {
    // Attempt a light ping by querying technicians or sites
    const { error } = await client.from('sites').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase, but tables have not been created yet. Please execute supabase_schema.sql in your Supabase SQL Editor.',
        };
      }
      return { success: false, message: `Supabase error: ${error.message} (${error.code || ''})` };
    }
    return { success: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to reach Supabase server.' };
  }
}
