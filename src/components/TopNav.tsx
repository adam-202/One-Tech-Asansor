import React, { useState } from 'react';
import { TECHNICIANS } from '../data/seedSites';
import { Technician } from '../types';
import { Plus, User, Check, ChevronDown, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';

interface TopNavProps {
  activeTab: 'routes' | 'directory' | 'reports';
  onSelectTab: (tab: 'routes' | 'directory' | 'reports') => void;
  currentTechnician: Technician;
  onSelectTechnician: (tech: Technician) => void;
  onOpenAddSite: () => void;
  onOpenEmergencyFault: () => void;
  totalSitesCount: number;
  visitedSitesCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  currentTechnician,
  onSelectTechnician,
  onOpenAddSite,
  onOpenEmergencyFault,
  totalSitesCount,
  visitedSitesCount,
}) => {
  const [techDropdownOpen, setTechDropdownOpen] = useState(false);
  const completionPercentage = totalSitesCount > 0 ? Math.round((visitedSitesCount / totalSitesCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                ElevatorOps
              </span>
            </div>

            {/* October 2026 Cycle Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Oct 2026 Cycle</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="font-mono tabular-nums text-slate-200">
                {visitedSitesCount}/{totalSitesCount} Visited ({completionPercentage}%)
              </span>
            </div>
          </div>

          {/* Zone 2: Primary Nav Tabs (Single-line, clear active states) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onSelectTab('routes')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'routes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Route Planner
            </button>
            <button
              onClick={() => onSelectTab('directory')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'directory'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Sites Directory <span className="font-mono text-xs opacity-75 hidden sm:inline">({totalSitesCount})</span>
            </button>
            <button
              onClick={() => onSelectTab('reports')}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Reports & Exports
            </button>
          </nav>

          {/* Zone 3: Actions & Technician Account Profile Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Emergency / Fault Shortcut Button */}
            <button
              onClick={onOpenEmergencyFault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 border border-rose-500 rounded-lg shadow-sm shadow-rose-900/30 transition-all whitespace-nowrap"
              title="Report site breakdown or emergency issue directly"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
              <span className="hidden sm:inline">Log Emergency Fault</span>
              <span className="sm:hidden">Fault</span>
            </button>

            <button
              onClick={onOpenAddSite}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Add Site</span>
            </button>

            {/* Technician Profile Selector */}
            <div className="relative">
              <button
                onClick={() => setTechDropdownOpen(!techDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-left transition-colors"
                aria-expanded={techDropdownOpen}
              >
                <div className={`w-7 h-7 rounded-full ${currentTechnician.avatarColor} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                  {currentTechnician.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-white truncate max-w-[120px]">
                    {currentTechnician.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
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
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-slate-200">
                    <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Switch Technician Profile
                    </div>
                    {TECHNICIANS.map((tech) => (
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
                          <div className={`w-6 h-6 rounded-full ${tech.avatarColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                            {tech.name.split(' ').map((n) => n[0]).join('')}
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

                    <div className="border-t border-slate-800 p-2">
                      <button
                        onClick={() => {
                          setTechDropdownOpen(false);
                          onOpenAddSite();
                        }}
                        className="w-full py-1.5 px-2 flex items-center justify-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Register New Site</span>
                      </button>
                    </div>
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
