import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  ShieldCheck,
  KeyRound,
  FileCode,
} from 'lucide-react';
import {
  DEFAULT_SUPABASE_PROJECT_ID,
  DEFAULT_SUPABASE_URL,
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  isSupabaseConfigured,
} from '../utils/supabase';
import { uploadSeedDataToSupabase } from '../services/supabaseService';
import { BuildingSite, Technician } from '../types';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: BuildingSite[];
  technicians: Technician[];
  onSyncComplete?: () => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({
  isOpen,
  onClose,
  sites,
  technicians,
  onSyncComplete,
}) => {
  const [url, setUrl] = useState(DEFAULT_SUPABASE_URL);
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'schema'>('credentials');

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url || DEFAULT_SUPABASE_URL);
      setAnonKey(cfg.key || '');
      setTestResult(null);
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    saveSupabaseConfig(url, anonKey);
    setTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection();
    setTestResult(result);
    setTesting(false);
    if (result.success && onSyncComplete) {
      onSyncComplete();
    }
  };

  const handlePushData = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await uploadSeedDataToSupabase(sites, technicians);
    if (res.success) {
      setSyncResult(res.message);
      if (onSyncComplete) onSyncComplete();
    } else {
      setSyncResult(`Sync failed: ${res.message}`);
    }
    setSyncing(false);
  };

  const sqlSchemaText = `-- ONE TECH ASANSÖR SUPABASE MIGRATION
-- Copy & Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/sql/new

CREATE TABLE IF NOT EXISTS public.technicians (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    role TEXT DEFAULT 'Field Technician',
    assigned_count INTEGER DEFAULT 0,
    avatar_color TEXT DEFAULT 'bg-blue-600',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    neighborhood TEXT DEFAULT '',
    category TEXT DEFAULT 'private' CHECK (category IN ('private', 'public')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    floors INTEGER DEFAULT 1,
    elevator_units INTEGER DEFAULT 1,
    elevator_brand TEXT DEFAULT 'Otis',
    elevator_numbers TEXT DEFAULT '',
    assigned_technician_email TEXT DEFAULT 'adam.osama60@gmail.com',
    manager_name TEXT DEFAULT '',
    manager_phone TEXT DEFAULT '',
    access_code TEXT DEFAULT '',
    google_maps_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'vip', 'fault_alert')),
    last_visit JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.visits (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES public.sites(id) ON DELETE CASCADE,
    site_name TEXT NOT NULL,
    address TEXT DEFAULT '',
    neighborhood TEXT DEFAULT '',
    date DATE NOT NULL,
    time TIME NOT NULL,
    month_year TEXT NOT NULL,
    visit_type TEXT DEFAULT 'monthly' CHECK (visit_type IN ('monthly', 'fault', 'emergency')),
    technician_email TEXT NOT NULL,
    technician_name TEXT NOT NULL,
    attending_technicians JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'passed' CHECK (status IN ('passed', 'attention_needed', 'critical')),
    checklist JSONB DEFAULT '{}'::jsonb,
    parts_replaced TEXT DEFAULT 'None',
    notes TEXT DEFAULT '',
    duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon access technicians" ON public.technicians FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access sites" ON public.sites FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access visits" ON public.visits FOR ALL TO anon USING (true) WITH CHECK (true);
`;

  const copySqlSchema = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Supabase Cloud Database</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {DEFAULT_SUPABASE_PROJECT_ID}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect your real-time PostgreSQL database for One Tech Asansör
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Connection & API Key</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Database Tables (SQL)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'credentials' ? (
            <>
              {/* Project Info Banner */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    Target Project ID: <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">{DEFAULT_SUPABASE_PROJECT_ID}</code>
                  </p>
                  <p className="text-[11px] text-blue-800">
                    To connect, get your <strong>anon public</strong> key from your Supabase Project Settings.
                  </p>
                </div>
                <a
                  href={`https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/settings/api`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] shrink-0 shadow-xs transition-colors"
                >
                  <span>Open API Keys</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://qdjlqmtmpbhidloxaxea.supabase.co"
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden bg-slate-50/50 text-slate-900"
                />
              </div>

              {/* Anon Public Key */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Supabase Anon Key (Public)
                </label>
                <textarea
                  rows={3}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="Paste your anon public key here (starts with eyJhbGciOi...)"
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden bg-white text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Located in Supabase Dashboard → Project Settings → API → Project API Keys (anon public).
                </p>
              </div>

              {/* Test Connection Button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveAndTest}
                  disabled={testing || !anonKey.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing Connection...' : 'Save & Test Connection'}</span>
                </button>
              </div>

              {/* Connection Status Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.success && (
                      <p className="text-[11px] text-emerald-700">
                        Supabase is now active! All visits and site edits will sync in real time.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cloud Sync & Seed local data */}
              {isSupabaseConfigured() && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">
                        Initial Data Migration ({sites.length} Sites)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Upload all current 46 sites and team records into your Supabase tables.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePushData}
                      disabled={syncing}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <UploadCloud className={`w-3.5 h-3.5 ${syncing ? 'animate-bounce' : ''}`} />
                      <span>{syncing ? 'Uploading...' : 'Upload 46 Sites'}</span>
                    </button>
                  </div>

                  {syncResult && (
                    <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-medium">
                      {syncResult}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Run this SQL in your Supabase SQL Editor to create the <code>sites</code>, <code>technicians</code>, and <code>visits</code> tables.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copySqlSchema}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSchema ? 'Copied!' : 'Copy SQL'}</span>
                  </button>
                  <a
                    href={`https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/sql/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <span>Open SQL Editor</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                {sqlSchemaText}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Project ID: <strong className="text-slate-800 font-mono">{DEFAULT_SUPABASE_PROJECT_ID}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
