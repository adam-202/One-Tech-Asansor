import React from 'react';
import {
  Compass,
  Building2,
  AlertTriangle,
  FileSpreadsheet,
  ShieldAlert,
} from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface MobileBottomNavProps {
  activeTab: 'routes' | 'directory' | 'reports' | 'admin';
  onSelectTab: (tab: 'routes' | 'directory' | 'reports' | 'admin') => void;
  onOpenEmergency: () => void;
  isAdmin: boolean;
  language: Language;
  unreadAlertsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenEmergency,
  isAdmin,
  language,
  unreadAlertsCount = 0,
}) => {
  const t = translations[language];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 dark:bg-slate-950/95 bg-white/95 backdrop-blur-xl border-t dark:border-slate-800/80 border-slate-200/90 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.6)] transition-colors duration-200">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* 1. Routes */}
        <button
          type="button"
          onClick={() => onSelectTab('routes')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[48px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'routes'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Compass className={`w-5 h-5 mb-0.5 ${activeTab === 'routes' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] leading-tight tracking-tight font-medium">
            {t.routePlanner || 'Routes'}
          </span>
          {activeTab === 'routes' && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5 shadow-[0_0_6px_#3b82f6]" />
          )}
        </button>

        {/* 2. Directory */}
        <button
          type="button"
          onClick={() => onSelectTab('directory')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[48px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className={`w-5 h-5 mb-0.5 ${activeTab === 'directory' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] leading-tight tracking-tight font-medium">
            {t.sitesDirectory || 'Sites'}
          </span>
          {activeTab === 'directory' && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5 shadow-[0_0_6px_#3b82f6]" />
          )}
        </button>

        {/* 3. Center Action: Emergency Breakdown Dispatch Button */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-5">
          <button
            type="button"
            onClick={onOpenEmergency}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white flex items-center justify-center shadow-lg shadow-rose-900/40 border-2 dark:border-slate-950 border-white active:scale-90 transition-transform cursor-pointer"
            title="Emergency Fault Dispatch"
          >
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </button>
          <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {t.faultShortcut || 'Emergency'}
          </span>
        </div>

        {/* 4. Reports */}
        <button
          type="button"
          onClick={() => onSelectTab('reports')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[48px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className={`w-5 h-5 mb-0.5 ${activeTab === 'reports' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] leading-tight tracking-tight font-medium">
            {t.reportsExports || 'Reports'}
          </span>
          {activeTab === 'reports' && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5 shadow-[0_0_6px_#3b82f6]" />
          )}
        </button>

        {/* 5. Admin (Only if Admin / Adam) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => onSelectTab('admin')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[48px] rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className={`w-5 h-5 mb-0.5 ${activeTab === 'admin' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] leading-tight tracking-tight font-medium">
              {t.adminPortal || 'Admin'}
            </span>
            {activeTab === 'admin' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5 shadow-[0_0_6px_#3b82f6]" />
            )}
          </button>
        )}
      </div>
    </nav>
  );
};
