import React, { useState } from 'react';
import { Technician } from '../types';
import {
  Plus,
  Check,
  ChevronDown,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Database,
  LogOut,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface TopNavProps {
  activeTab: 'routes' | 'directory' | 'reports' | 'admin';
  onSelectTab: (tab: 'routes' | 'directory' | 'reports' | 'admin') => void;
  technicians: Technician[];
  currentTechnician: Technician;
  onSelectTechnician: (tech: Technician) => void;
  language: Language;
  onToggleLanguage: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenAddSite: () => void;
  onOpenEmergencyFault: () => void;
  totalSitesCount: number;
  visitedSitesCount: number;
  isSupabaseConnected?: boolean;
  onOpenSupabaseConnect?: () => void;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  technicians,
  currentTechnician,
  onSelectTechnician,
  language,
  onToggleLanguage,
  theme = 'dark',
  onToggleTheme,
  onOpenAddSite,
  onOpenEmergencyFault,
  totalSitesCount,
  visitedSitesCount,
  isSupabaseConnected = false,
  onOpenSupabaseConnect,
  isAdmin = false,
  onLogout,
}) => {
  const [techDropdownOpen, setTechDropdownOpen] = useState(false);
  const t = translations[language];
  const completionPercentage = totalSitesCount > 0 ? Math.round((visitedSitesCount / totalSitesCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 dark:bg-slate-950/90 bg-white/90 backdrop-blur-xl border-b dark:border-slate-800/80 border-slate-200/90 dark:text-white text-slate-900 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight dark:text-white text-slate-900 block leading-none">
                  {t.appName}
                </span>
                <span className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold tracking-wide flex items-center gap-1">
                  <span>{t.companySubtitle}</span>
                  <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-blue-500/40" />
                  <span className="hidden sm:inline-block text-[9px] uppercase font-mono dark:text-slate-400 text-slate-500">v2.4</span>
                </span>
              </div>
            </div>

            {/* Cycle Indicator (Desktop only) */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl dark:bg-slate-900/80 bg-slate-100/90 border dark:border-slate-800 border-slate-200 text-xs dark:text-slate-300 text-slate-600 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="font-medium">{language === 'tr' ? 'Ekim 2026' : 'Oct 2026'} {t.currentCycle}</span>
              <span aria-hidden="true" className="dark:text-slate-600 text-slate-300">•</span>
              <span className="font-mono tabular-nums font-bold dark:text-slate-100 text-slate-800">
                {visitedSitesCount}/{totalSitesCount} {t.visited} ({completionPercentage}%)
              </span>
            </div>
          </div>

          {/* Zone 2: Primary Nav Tabs (Hidden on mobile; handled by MobileBottomNav) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl dark:bg-slate-900/70 bg-slate-100/80 border dark:border-slate-800/80 border-slate-200/80">
            <button
              onClick={() => onSelectTab('routes')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'routes'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/60 hover:bg-white/80'
              }`}
            >
              {t.routePlanner}
            </button>
            <button
              onClick={() => onSelectTab('directory')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/60 hover:bg-white/80'
              }`}
            >
              {t.sitesDirectory} <span className="font-mono text-xs opacity-80 hidden lg:inline">({totalSitesCount})</span>
            </button>
            <button
              onClick={() => onSelectTab('reports')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'dark:text-slate-400 text-slate-600 dark:hover:text-white hover:text-slate-900 dark:hover:bg-slate-800/60 hover:bg-white/80'
              }`}
            >
              {t.reportsExports}
            </button>

            {/* Admin Portal Tab (Only visible to Operations Director / Admin) */}
            {isAdmin && (
              <button
                onClick={() => onSelectTab('admin')}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                    : 'text-amber-500 dark:text-amber-400 dark:hover:bg-slate-800/60 hover:bg-amber-50'
                }`}
                title={t.adminPortal}
              >
                <span>{t.adminPortal}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400/25 text-amber-800 dark:text-amber-300 font-mono font-bold">
                  {t.directorBadge}
                </span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions, Theme Switcher, Language Switcher & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle Button (Dark / Light) */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-xl dark:bg-slate-900 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 border dark:border-slate-800 border-slate-200/80 transition-all cursor-pointer shadow-2xs"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 animate-fadeIn" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600 animate-fadeIn" />
                )}
              </button>
            )}

            {/* Language Toggle Button (Shows Active Language with Flag) */}
            <button
              onClick={onToggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-xl dark:bg-slate-900 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 dark:text-slate-200 text-slate-700 border dark:border-slate-800 border-slate-200/80 transition-all active:scale-95 shadow-2xs cursor-pointer"
              title={
                language === 'tr'
                  ? 'Aktif Dil: Türkçe (İngilizceye geçmek için tıklayın)'
                  : 'Active Language: English (Click to switch to Turkish)'
              }
            >
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[11px] font-bold">
                {language === 'tr' ? '🇹🇷 TR' : '🇺🇸 EN'}
              </span>
            </button>

            {/* Supabase Cloud DB Status Pill */}
            {onOpenSupabaseConnect && (
              <button
                onClick={onOpenSupabaseConnect}
                className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-xl border transition-all active:scale-95 shadow-2xs cursor-pointer ${
                  isSupabaseConnected
                    ? 'dark:bg-emerald-950/30 bg-emerald-50 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-100/60'
                    : 'dark:bg-amber-950/30 bg-amber-50 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-100/60'
                }`}
                title={
                  isSupabaseConnected
                    ? language === 'tr'
                      ? 'Bulut DB Aktif (Telefon & PC Eşitleniyor)'
                      : 'Cloud DB Active (Phone & PC Synced)'
                    : language === 'tr'
                      ? 'Bulut DB Bağlı Değil (Veriler yerel). Telefon ile PC senkronizasyonu için tıklayın.'
                      : 'Cloud DB Offline (Local data). Click to sync phone & laptop.'
                }
              >
                <Database className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className="hidden sm:inline text-[11px] font-semibold">
                  {isSupabaseConnected
                    ? language === 'tr' ? 'Bulut: Canlı' : 'Cloud: Synced'
                    : language === 'tr' ? 'Bulut: Yerel' : 'Cloud: Local'}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'}`} />
              </button>
            )}

            {/* Quick Emergency / Fault Shortcut Button (Desktop) */}
            <button
              onClick={onOpenEmergencyFault}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 border border-rose-500/80 rounded-xl shadow-sm shadow-rose-900/30 transition-all whitespace-nowrap cursor-pointer"
              title={t.logEmergencyFault}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="hidden lg:inline">{t.logEmergencyFault}</span>
              <span className="lg:hidden">{t.faultShortcut}</span>
            </button>

            {/* Add Site Button (Desktop) */}
            <button
              onClick={onOpenAddSite}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold dark:text-white text-slate-800 dark:bg-slate-900 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 border dark:border-slate-800 border-slate-200/80 rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              <span>{t.addSite}</span>
            </button>

            {/* Technician Profile Selector & Logout */}
            <div className="relative">
              <button
                onClick={() => setTechDropdownOpen(!techDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl dark:bg-slate-900 bg-slate-100 dark:border-slate-800 border-slate-200/80 hover:border-slate-400 text-left transition-colors cursor-pointer shadow-2xs"
                aria-expanded={techDropdownOpen}
              >
                <div className={`w-7 h-7 rounded-lg ${currentTechnician.avatarColor || 'bg-blue-600'} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs`}>
                  {currentTechnician.name[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold dark:text-white text-slate-900 truncate max-w-[90px]">
                    {currentTechnician.name}
                  </div>
                  <div className="text-[10px] dark:text-slate-400 text-slate-500 font-mono truncate max-w-[90px]">
                    {currentTechnician.isAdmin ? (language === 'tr' ? 'Yönetici' : 'Director') : (language === 'tr' ? 'Teknisyen' : 'Tech')}
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
                  <div className="absolute right-0 mt-2 w-64 dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 rounded-2xl shadow-2xl py-1.5 z-50 dark:text-slate-200 text-slate-800 animate-fadeIn">
                    <div className="px-3 py-2 border-b dark:border-slate-800 border-slate-100 text-[11px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                      {t.switchProfile}
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                      {technicians.map((tech) => {
                        const isCurrent = tech.id === currentTechnician.id;
                        return (
                          <button
                            key={tech.id}
                            onClick={() => {
                              onSelectTechnician(tech);
                              setTechDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                                : 'dark:hover:bg-slate-800/80 hover:bg-slate-50 dark:text-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className={`w-6 h-6 rounded-md ${tech.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}>
                                {tech.name[0]}
                              </div>
                              <div className="text-left truncate">
                                <div className="truncate font-medium">{tech.name}</div>
                                <div className="text-[10px] dark:text-slate-500 text-slate-400 font-mono truncate">
                                  {tech.role}
                                </div>
                              </div>
                            </div>
                            {isCurrent && <Check className="w-4 h-4 text-blue-500 shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>

                    {onLogout && (
                      <div className="pt-1 mt-1 border-t dark:border-slate-800 border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setTechDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          <span>{language === 'en' ? 'Sign Out of Account' : 'Hesaptan Çıkış Yap'}</span>
                        </button>
                      </div>
                    )}
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
