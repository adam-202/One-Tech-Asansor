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
  Smartphone,
  Laptop,
  ArrowRightLeft,
  Download,
  Upload,
  Info,
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
import { Language } from '../utils/translations';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: BuildingSite[];
  technicians: Technician[];
  language?: Language;
  onSyncComplete?: () => void;
  onImportData?: (sites: BuildingSite[], technicians: Technician[]) => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({
  isOpen,
  onClose,
  sites,
  technicians,
  language = 'tr',
  onSyncComplete,
  onImportData,
}) => {
  const [url, setUrl] = useState(DEFAULT_SUPABASE_URL);
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'credentials' | 'transfer' | 'schema'>('credentials');

  // Mobile history navigation support: pushState when opening modal so swipe-back on mobile closes modal instead of exiting app
  useEffect(() => {
    if (!isOpen) return;
    const stateId = `modal_db_${Date.now()}`;
    window.history.pushState({ modalOpen: true, id: stateId }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  // Touch swipe-to-dismiss gesture for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (diffX > 80 && diffX > diffY * 1.5 && touchStartX < 120) {
      onClose();
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url || DEFAULT_SUPABASE_URL);
      setAnonKey(cfg.key || '');
      setTestResult(null);
      setSyncResult(null);
      setImportStatus(null);
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

  // Instant Device Export & Import handlers
  const handleExportData = () => {
    const payload = {
      app: 'OneTechAsansor',
      version: 2.4,
      timestamp: new Date().toISOString(),
      sitesCount: sites.length,
      techniciansCount: technicians.length,
      sites,
      technicians,
    };
    const jsonStr = JSON.stringify(payload);
    navigator.clipboard.writeText(jsonStr);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 3000);
  };

  const handleApplyImport = () => {
    try {
      if (!importJsonText.trim()) {
        setImportStatus(language === 'tr' ? 'Lütfen kopyalanan veriyi yapıştırın.' : 'Please paste the sync data JSON.');
        return;
      }
      const parsed = JSON.parse(importJsonText.trim());
      if (!parsed || !Array.isArray(parsed.sites)) {
        setImportStatus(language === 'tr' ? 'Geçersiz veri formatı. Lütfen geçerli aktarım kodunu yapıştırın.' : 'Invalid data format. Please paste a valid sync payload.');
        return;
      }

      if (onImportData) {
        onImportData(parsed.sites, parsed.technicians || technicians);
      }
      setImportStatus(
        language === 'tr'
          ? `Başarılı! ${parsed.sites.length} bina ve ${(parsed.technicians || []).length} personel başarıyla eşitlendi.`
          : `Success! Imported ${parsed.sites.length} sites and ${(parsed.technicians || []).length} team members.`
      );
      setImportJsonText('');
    } catch (err: any) {
      setImportStatus(language === 'tr' ? 'Hata: Veri çözümlenemedi. Eksik kopyalamış olabilirsiniz.' : `Parse error: ${err.message}`);
    }
  };

  const sqlSchemaText = `-- ONE TECH ASANSÖR SUPABASE MIGRATION (v2.4)
-- Copy & Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/sql/new

CREATE TABLE IF NOT EXISTS public.technicians (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT DEFAULT 'tech123',
    phone TEXT DEFAULT '',
    role TEXT DEFAULT 'Field Technician',
    is_admin BOOLEAN DEFAULT FALSE,
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
    elevator_brand TEXT DEFAULT 'KONE',
    elevator_numbers TEXT DEFAULT '',
    assigned_technician_email TEXT DEFAULT 'adam.osama60@gmail.com',
    manager_name TEXT DEFAULT '',
    manager_phone TEXT DEFAULT '',
    access_code TEXT DEFAULT '',
    google_maps_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'vip', 'fault_alert')),
    machine_type TEXT DEFAULT '',
    suspension_ratio TEXT DEFAULT '',
    wire_rope_specs TEXT DEFAULT '',
    control_panel TEXT DEFAULT '',
    door_operator TEXT DEFAULT '',
    spare_parts JSONB DEFAULT '[]'::jsonb,
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn cursor-pointer"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] cursor-default">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{language === 'tr' ? 'Veritabanı ve Cihaz Senkronizasyonu' : 'Database & Device Sync'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {DEFAULT_SUPABASE_PROJECT_ID}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'tr'
                  ? 'Telefon ve bilgisayar arasındaki verileri canlı veya anında eşitleyin'
                  : 'Sync your data live between phone and laptop via Supabase or fast transfer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'credentials'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{language === 'tr' ? 'Bulut Bağlantısı (Supabase)' : 'Cloud API Key'}</span>
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'transfer'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{language === 'tr' ? 'Cihazlar Arası Hızlı Transfer' : 'Direct Device Transfer'}</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'schema'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{language === 'tr' ? 'SQL Tabloları' : 'Database SQL'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200">
          {activeTab === 'credentials' && (
            <>
              {/* Explanation Note for Adam */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{language === 'tr' ? 'Neden Telefon ve Bilgisayar Eşitlenmedi?' : 'Why were phone and laptop not in sync?'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {language === 'tr'
                    ? 'Tarayıcılar güvenlik gereği yerel belleği (localStorage) cihaz başına izole tutar. Telefonda eklediğiniz yeni personel veya bina, Supabase API anahtarı girilene kadar yalnızca o telefonun hafızasında kalır. Aşağıdan Supabase anahtarınızı girdiğinizde tüm cihazlar internet üzerinden canlı ve anında eşitlenir!'
                    : 'Browsers keep local storage isolated per device. Members or buildings added on your phone remain in that phone until the Supabase API key is connected. Once connected, all devices sync instantly over the cloud!'}
                </p>
              </div>

              {/* Project Info Banner */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    Supabase Project: <code className="font-mono bg-blue-100 dark:bg-blue-900/80 px-1 py-0.5 rounded">{DEFAULT_SUPABASE_PROJECT_ID}</code>
                  </p>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300">
                    {language === 'tr'
                      ? 'Projenizin API sayfasından anon public anahtarını kopyalayın.'
                      : 'Get your anon public key from Supabase Project Settings → API.'}
                  </p>
                </div>
                <a
                  href={`https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/settings/api`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shrink-0 shadow-xs transition-colors cursor-pointer"
                >
                  <span>{language === 'tr' ? 'Supabase API Sayfasını Aç' : 'Open API Keys'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://qdjlqmtmpbhidloxaxea.supabase.co"
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 outline-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Anon Public Key */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Supabase Anon Key (Public)
                </label>
                <textarea
                  rows={3}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder={language === 'tr' ? 'eyJhbGciOi... ile başlayan anon public anahtarınızı buraya yapıştırın' : 'Paste your anon public key here (starts with eyJhbGciOi...)'}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 outline-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'tr'
                    ? 'Supabase Paneli → Settings → API → anon public anahtarını kopyalayın.'
                    : 'Located in Supabase Dashboard → Project Settings → API → Project API Keys (anon public).'}
                </p>
              </div>

              {/* Test Connection Button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveAndTest}
                  disabled={testing || !anonKey.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>
                    {testing
                      ? (language === 'tr' ? 'Bağlantı Test Ediliyor...' : 'Testing Connection...')
                      : (language === 'tr' ? 'Kaydet ve Bağlantıyı Test Et' : 'Save & Test Connection')}
                  </span>
                </button>
              </div>

              {/* Connection Status Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.success && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        {language === 'tr'
                          ? 'Supabase bulut bağlantısı aktif! Artık tüm binalar, bakımlar ve yeni üyeler gerçek zamanlı olarak eşitlenecek.'
                          : 'Supabase is now active! All visits and site edits will sync in real time.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cloud Sync & Seed local data */}
              {isSupabaseConfigured() && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        {language === 'tr' ? `İlk Veri Yükleme (${sites.length} Bina)` : `Initial Data Migration (${sites.length} Sites)`}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'tr'
                          ? 'Mevcut tüm bina ve ekip kayıtlarını buluta toplu yükleyin.'
                          : 'Upload all current sites and team records into your Supabase tables.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePushData}
                      disabled={syncing}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      <UploadCloud className={`w-3.5 h-3.5 ${syncing ? 'animate-bounce' : ''}`} />
                      <span>{syncing ? (language === 'tr' ? 'Yükleniyor...' : 'Uploading...') : (language === 'tr' ? `${sites.length} Binayı Buluta Yükle` : `Upload ${sites.length} Sites`)}</span>
                    </button>
                  </div>

                  {syncResult && (
                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-medium">
                      {syncResult}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'transfer' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span>{language === 'tr' ? 'Cihazlar Arası Anında Veri Aktarımı' : 'Instant Device Sync Without Keys'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {language === 'tr'
                    ? 'API anahtarı girmeden telefonunuzdaki tüm yeni personeli ve binaları bilgisayarınıza aktarabilirsiniz: Telefondan "Eşitleme Kodunu Kopyala" butonuna basın, bilgisayarınızda buraya yapıştırıp "Verileri Aktar"a tıklayın.'
                    : 'Instantly transfer all team members and buildings from your phone to your laptop: Click "Copy Sync Code" on your phone, then paste it here on your laptop and click "Apply Import".'}
                </p>
              </div>

              {/* Step 1: Export */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      <span>{language === 'tr' ? '1. Bu Cihazdaki Verileri Kopyala' : '1. Export Current Data'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {sites.length} {language === 'tr' ? 'bina' : 'sites'}, {technicians.length} {language === 'tr' ? 'personel hazır' : 'technicians ready'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedExport ? (language === 'tr' ? 'Kopyalandı!' : 'Copied!') : (language === 'tr' ? 'Eşitleme Kodunu Kopyala' : 'Copy Sync Code')}</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Import */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'tr' ? '2. Diğer Cihazdan Alınan Kodu Buraya Yapıştır' : '2. Paste Code from Other Device'}</span>
                </h4>
                <textarea
                  rows={4}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder={language === 'tr' ? 'Diğer cihazdan kopyaladığınız kodu buraya yapıştırın...' : 'Paste sync payload from other device here...'}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 outline-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{language === 'tr' ? 'Verileri Uygula & Eşitle' : 'Apply & Sync Data to this Device'}</span>
                </button>

                {importStatus && (
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {importStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'tr'
                    ? 'Bu SQL betiğini Supabase SQL Editöründe çalıştırarak tablolarınızı güncelleyin.'
                    : 'Run this SQL in your Supabase SQL Editor to create tables with elevator specs and spare parts.'}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={copySqlSchema}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSchema ? (language === 'tr' ? 'Kopyalandı!' : 'Copied!') : (language === 'tr' ? 'SQL Kopyala' : 'Copy SQL')}</span>
                  </button>
                  <a
                    href={`https://supabase.com/dashboard/project/${DEFAULT_SUPABASE_PROJECT_ID}/sql/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <span>SQL Editor</span>
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
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Project ID: <strong className="text-slate-800 dark:text-slate-200 font-mono">{DEFAULT_SUPABASE_PROJECT_ID}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
          >
            {language === 'tr' ? 'Kapat' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
