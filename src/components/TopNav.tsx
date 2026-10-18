import React, { useState } from 'react';
import { Technician } from '../types';
import { Plus, Check, ChevronDown, Calendar, ShieldCheck, AlertTriangle, Globe, Database } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface TopNavProps {
  activeTab: 'routes' | 'directory' | 'reports' | 'admin';
  onSelectTab: (tab: 'routes' | 'directory' | 'reports' | 'admin') => void;
  technicians: Technician[];
  currentTechnician: Technician;
  onSelectTechnician: (tech: Technician) => void;
  language: Language;
  onToggleLanguage: () => void;
  onOpenAddSite: () => void;
  onOpenEmergencyFault: () => void;
  totalSitesCount: number;
  visitedSitesCount: number;
  isSupabaseConnected?: boolean;
  onOpenSupabaseConnect?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  technicians,
  currentTechnician,
  onSelectTechnician,
  language,
  onToggleLanguage,
  onOpenAddSite,
  onOpenEmergencyFault,
  totalSitesCount,
  visitedSitesCount,
  isSupabaseConnected = false,
  onOpenSupabaseConnect,
}) => {
  const [techDropdownOpen, setTechDropdownOpen] = useState(false);
  const t = translations[language];
  const completionPercentage = totalSitesCount > 0 ? Math.round((visitedSitesCount / totalSitesCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-white block leading-none">
                  {t.appName}
                </span>
                <span className="text-[10px] text-blue-400 font-medium tracking-wide">
                  {t.companySubtitle}
                </span>
              </div>
            </div>

            {/* Cycle Indicator */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Oct 2026 {t.currentCycle}</span>
              <span aria-hidden="true" className="text-slate-500">•</span>
              <span className="font-mono tabular-nums text-slate-200">
                {visitedSitesCount}/{totalSitesCount} {t.visited} ({completionPercentage}%)
              </span>
            </div>
          </div>

          {/* Zone 2: Primary Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectTab('routes')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'routes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.routePlanner}
            </button>
            <button
              onClick={() => onSelectTab('directory')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'directory'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.sitesDirectory} <span className="font-mono text-xs opacity-75 hidden md:inline">({totalSitesCount})</span>
            </button>
            <button
              onClick={() => onSelectTab('reports')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.reportsExports}
            </button>

            {/* Admin Portal Tab (Operations Director) */}
            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
              }`}
              title={t.adminPortal}
            >
              <span>{t.adminPortal}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400/20 text-amber-300 font-mono font-bold">
                {t.directorBadge}
              </span>
            </button>
          </nav>

          {/* Zone 3: Actions, Language Switcher & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Cloud DB Status Pill */}
            {onOpenSupabaseConnect && (
              <button
                onClick={onOpenSupabaseConnect}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 shadow-xs ${
                  isSupabaseConnected
                    ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border-amber-600/40'
                }`}
                title={isSupabaseConnected ? 'Supabase Connected (Live)' : 'Connect Supabase Cloud Database'}
              >
                <Database className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="hidden sm:inline">
                  {isSupabaseConnected ? 'DB: Live' : 'Connect DB'}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 animate-pulse'}`} />
              </button>
            )}

            {/* Language Toggle Button */}
            <button
              onClick={onToggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all active:scale-95 shadow-xs"
              title="Switch Language / Dil Değiştir"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>{language === 'en' ? '🇹🇷 TR' : '🇺🇸 EN'}</span>
            </button>

            {/* Quick Emergency / Fault Shortcut Button */}
            <button
              onClick={onOpenEmergencyFault}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 border border-rose-500 rounded-lg shadow-sm shadow-rose-900/30 transition-all whitespace-nowrap"
              title={t.logEmergencyFault}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
              <span className="hidden lg:inline">{t.logEmergencyFault}</span>
              <span className="lg:hidden">{t.faultShortcut}</span>
            </button>

            <button
              onClick={onOpenAddSite}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.addSite}</span>
            </button>

            {/* Technician Profile Selector */}
            <div className="relative">
              <button
                onClick={() => setTechDropdownOpen(!techDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-left transition-colors"
                aria-expanded={techDropdownOpen}
              >
                <div className={`w-7 h-7 rounded-full ${currentTechnician.avatarColor || 'bg-blue-600'} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                  {currentTechnician.name[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-white truncate max-w-[100px]">
                    {currentTechnician.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[100px]">
                    {currentTechnician.email.split('@')[0]}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {techDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setTechDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-slate-200 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {t.switchProfile}
                    </div>
                    {technicians.map((tech) => (
                      <button
                        key={tech.id}
                        onClick={() => {
                          onSelectTechnician(tech);
                          setTechDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-800 transition-colors ${
                          currentTechnician.id === tech.id ? 'bg-slate-800/60 text-blue-400' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`w-6 h-6 rounded-full ${tech.avatarColor || 'bg-blue-600'} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                            {tech.name[0]}
                          </div>
                          <div className="truncate">
                            <p className="font-medium text-slate-200 truncate">{tech.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{tech.email}</p>
                          </div>
                        </div>
                        {currentTechnician.id === tech.id && (
                          <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
