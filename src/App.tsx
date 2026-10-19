/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BuildingSite, Technician, VisitRecord } from './types';
import { INITIAL_SITES, INITIAL_TECHNICIANS } from './data/seedSites';
import { TopNav } from './components/TopNav';
import { RoutePlannerView } from './components/RoutePlannerView';
import { SitesDirectoryView } from './components/SitesDirectoryView';
import { ReportsView } from './components/ReportsView';
import { VisitInspectionModal } from './components/VisitInspectionModal';
import { SiteModal } from './components/SiteModal';
import { EmergencyFaultModal } from './components/EmergencyFaultModal';
import { AdminPortal } from './components/AdminPortal';
import { SupabaseConnectModal } from './components/SupabaseConnectModal';
import { LoginPage } from './components/LoginPage';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Language, translations } from './utils/translations';
import { isSupabaseConfigured, testSupabaseConnection } from './utils/supabase';
import {
  fetchSitesFromSupabase,
  fetchTechniciansFromSupabase,
  upsertSiteToSupabase,
  deleteSiteFromSupabase,
  saveVisitToSupabase,
  upsertTechnicianToSupabase,
  deleteTechnicianFromSupabase,
} from './services/supabaseService';

const STORAGE_SITES_KEY = 'elevatorops_sites_v4_clean';
const STORAGE_TECHS_KEY = 'elevatorops_technicians_v4';
const STORAGE_LANG_KEY = 'elevatorops_language';
const STORAGE_AUTH_KEY = 'elevatorops_auth_session';

export default function App() {
  // 1. Language state (defaults to English 'en')
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'en' || saved === 'tr') return saved;
    } catch (e) {}
    return 'en';
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next: Language = prev === 'en' ? 'tr' : 'en';
      try {
        localStorage.setItem(STORAGE_LANG_KEY, next);
      } catch (e) {}
      return next;
    });
  };

  const t = translations[language];

  // 2. Technicians / Team state
  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TECHS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading stored technicians:', e);
    }
    return INITIAL_TECHNICIANS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TECHS_KEY, JSON.stringify(technicians));
    } catch (e) {
      console.error('Error persisting technicians:', e);
    }
  }, [technicians]);

  // Authentication State
  const [authenticatedUser, setAuthenticatedUser] = useState<Technician | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTH_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading auth session:', e);
    }
    return null;
  });

  // Current active technician (defaults to authenticatedUser or Adam)
  const [currentTechnician, setCurrentTechnician] = useState<Technician>(
    () => authenticatedUser || technicians[0] || INITIAL_TECHNICIANS[0]
  );

  useEffect(() => {
    if (authenticatedUser) {
      const found = technicians.find((t) => t.id === authenticatedUser.id || t.email === authenticatedUser.email);
      if (found) {
        setCurrentTechnician(found);
      }
    } else {
      const found = technicians.find((tech) => tech.id === currentTechnician.id);
      if (!found && technicians.length > 0) {
        setCurrentTechnician(technicians[0]);
      }
    }
  }, [technicians, authenticatedUser]);

  // 3. Sites state
  const [sites, setSites] = useState<BuildingSite[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SITES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any): BuildingSite => {
            const lastVisit = s.lastVisit
              ? {
                  ...s.lastVisit,
                  visitType: s.lastVisit.visitType || 'monthly',
                  status: s.lastVisit.status || 'passed',
                  attendingTechnicians: Array.isArray(s.lastVisit.attendingTechnicians) && s.lastVisit.attendingTechnicians.length > 0
                    ? s.lastVisit.attendingTechnicians
                    : [s.lastVisit.technicianName || 'Adam'],
                  checklist: s.lastVisit.checklist || {
                    doorSensors: true,
                    carLeveling: true,
                    hoistwayCables: true,
                    emergencyComm: true,
                    machineRoom: true,
                  },
                  partsReplaced: s.lastVisit.partsReplaced || 'None',
                  notes: s.lastVisit.notes || '',
                }
              : undefined;

            const visitHistory = Array.isArray(s.visitHistory) && s.visitHistory.length > 0
              ? s.visitHistory.map((v: any) => ({
                  ...v,
                  visitType: v.visitType || 'monthly',
                  status: v.status || 'passed',
                  attendingTechnicians: Array.isArray(v.attendingTechnicians) && v.attendingTechnicians.length > 0
                    ? v.attendingTechnicians
                    : [v.technicianName || 'Specialist'],
                }))
              : lastVisit
              ? [lastVisit]
              : [];

            return {
              ...s,
              category: s.category || 'private',
              assignedTechnicianEmail: s.assignedTechnicianEmail || 'adam.osama60@gmail.com',
              lastVisit,
              visitHistory,
            };
          });
        }
      }
    } catch (e) {
      console.error('Error loading stored sites:', e);
    }
    return INITIAL_SITES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(sites));
    } catch (e) {
      console.error('Error persisting sites data:', e);
    }
  }, [sites]);

  // Tab & modal states
  const [activeTab, setActiveTab] = useState<'routes' | 'directory' | 'reports' | 'admin'>('routes');
  const [inspectingSite, setInspectingSite] = useState<BuildingSite | null>(null);
  const [isSiteModalOpen, setIsSiteModalOpen] = useState<boolean>(false);
  const [isEmergencyFaultModalOpen, setIsEmergencyFaultModalOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [editingSite, setEditingSite] = useState<BuildingSite | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication Handlers & Role Gate
  const isAdmin = Boolean(
    authenticatedUser?.isAdmin ||
    authenticatedUser?.email === 'adam.osama60@gmail.com' ||
    authenticatedUser?.name.toLowerCase().includes('adam')
  );

  const handleLoginSuccess = (user: Technician) => {
    setAuthenticatedUser(user);
    setCurrentTechnician(user);
    try {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
    } catch (e) {}
    showToast(
      language === 'en'
        ? `Welcome back, ${user.name}!`
        : `Hoş geldiniz, ${user.name}!`
    );
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    } catch (e) {}
    setAuthenticatedUser(null);
    setActiveTab('routes');
    showToast(
      language === 'en'
        ? 'Signed out successfully.'
        : 'Başarıyla çıkış yapıldı.'
    );
  };

  // If non-admin logged in and currently on admin tab, safely route to routes
  useEffect(() => {
    if (authenticatedUser && !isAdmin && activeTab === 'admin') {
      setActiveTab('routes');
    }
  }, [authenticatedUser, isAdmin, activeTab]);

  // Auto-connect to Supabase cloud if configured
  useEffect(() => {
    let isMounted = true;
    async function initSupabase() {
      if (isSupabaseConfigured()) {
        const ping = await testSupabaseConnection();
        if (ping.success && isMounted) {
          setIsSupabaseConnected(true);
          const remoteSites = await fetchSitesFromSupabase();
          if (remoteSites && remoteSites.length > 0 && isMounted) {
            setSites(remoteSites);
          }
          const remoteTechs = await fetchTechniciansFromSupabase();
          if (remoteTechs && remoteTechs.length > 0 && isMounted) {
            setTechnicians(remoteTechs);
          }
        }
      }
    }
    initSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Add Member
  const handleAddTechnician = (newTech: Technician) => {
    setTechnicians((prev) => [...prev, newTech]);
    if (isSupabaseConnected) {
      upsertTechnicianToSupabase(newTech);
    }
  };

  // Update Member (e.g. password, admin privileges)
  const handleUpdateTechnician = (updatedTech: Technician) => {
    setTechnicians((prev) => prev.map((t) => (t.id === updatedTech.id ? updatedTech : t)));
    if (isSupabaseConnected) {
      upsertTechnicianToSupabase(updatedTech);
    }
    if (authenticatedUser?.id === updatedTech.id) {
      setAuthenticatedUser(updatedTech);
      try {
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(updatedTech));
      } catch (e) {}
    }
  };

  // Delete Member & safely reassign their sites to Adam
  const handleDeleteTechnician = (techId: string) => {
    const targetTech = technicians.find((t) => t.id === techId);
    setTechnicians((prev) => prev.filter((t) => t.id !== techId));
    if (isSupabaseConnected) {
      deleteTechnicianFromSupabase(techId);
    }

    if (targetTech) {
      setSites((prev) =>
        prev.map((s) => {
          if (s.assignedTechnicianEmail === targetTech.email) {
            const reallocated = { ...s, assignedTechnicianEmail: 'adam.osama60@gmail.com' };
            if (isSupabaseConnected) {
              upsertSiteToSupabase(reallocated);
            }
            return reallocated;
          }
          return s;
        })
      );
    }
  };

  // Update site GPS location from map drag-and-drop
  const handleUpdateSiteLocation = (siteId: string, lat: number, lng: number) => {
    let updatedSite: BuildingSite | null = null;
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          updatedSite = {
            ...s,
            latitude: lat,
            longitude: lng,
            googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}&z=17&hl=en`,
          };
          return updatedSite;
        }
        return s;
      })
    );
    if (isSupabaseConnected && updatedSite) {
      upsertSiteToSupabase(updatedSite);
    }
    const targetSite = sites.find((s) => s.id === siteId);
    showToast(
      language === 'en'
        ? `${targetSite?.name || 'Building'} GPS location updated!`
        : `${targetSite?.name || 'Bina'} konumu başarıyla güncellendi!`
    );
  };

  // Batch reassign sites to a specific technician
  const handleBatchReassign = (targetEmail: string, siteIds: string[]) => {
    setSites((prev) =>
      prev.map((s) => {
        if (siteIds.includes(s.id)) {
          const updated = { ...s, assignedTechnicianEmail: targetEmail };
          if (isSupabaseConnected) {
            upsertSiteToSupabase(updated);
          }
          return updated;
        }
        return s;
      })
    );
  };

  // Save visit inspection
  const handleSaveVisit = (siteId: string, visitRecord: VisitRecord) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const priorHistory = s.visitHistory || (s.lastVisit ? [s.lastVisit] : []);
          const updatedHistory = [visitRecord, ...priorHistory.filter((v) => v.id !== visitRecord.id)];
          return {
            ...s,
            lastVisit: visitRecord,
            visitHistory: updatedHistory,
            priority: visitRecord.status === 'critical' ? 'fault_alert' : s.priority,
          };
        }
        return s;
      })
    );
    if (isSupabaseConnected) {
      saveVisitToSupabase(siteId, visitRecord);
    }
    showToast(
      language === 'en'
        ? `Inspection log saved for ${visitRecord.siteName}!`
        : `${visitRecord.siteName} için bakım kaydı kaydedildi!`
    );
  };

  // Handle Emergency Fault Shortcut
  const handleSaveEmergencyFault = (siteId: string, visitRecord: VisitRecord) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const priorHistory = s.visitHistory || (s.lastVisit ? [s.lastVisit] : []);
          const updatedHistory = [visitRecord, ...priorHistory.filter((v) => v.id !== visitRecord.id)];
          return {
            ...s,
            lastVisit: visitRecord,
            visitHistory: updatedHistory,
            priority: 'fault_alert',
          };
        }
        return s;
      })
    );
    if (isSupabaseConnected) {
      saveVisitToSupabase(siteId, visitRecord);
    }
    showToast(
      language === 'en'
        ? `EMERGENCY ALERT: ${visitRecord.siteName} flagged for immediate service!`
        : `ACİL ARIZA BİLDİRİMİ: ${visitRecord.siteName} acil müdahale havuzuna alındı!`
    );
  };

  // Save / Add site
  const handleSaveSite = (savedSite: BuildingSite) => {
    setSites((prev) => {
      const exists = prev.some((s) => s.id === savedSite.id);
      if (exists) {
        return prev.map((s) => (s.id === savedSite.id ? savedSite : s));
      }
      return [savedSite, ...prev];
    });
    if (isSupabaseConnected) {
      upsertSiteToSupabase(savedSite);
    }
    showToast(
      language === 'en'
        ? `Building ${savedSite.name} successfully updated.`
        : `${savedSite.name} binası başarıyla güncellendi.`
    );
  };

  // Site deletion
  const handleDeleteSite = (siteId: string) => {
    const target = sites.find((s) => s.id === siteId);
    setSites((prev) => prev.filter((s) => s.id !== siteId));
    if (isSupabaseConnected) {
      deleteSiteFromSupabase(siteId);
    }
    showToast(
      language === 'en'
        ? `Site ${target?.name || siteId} removed from contracts.`
        : `${target?.name || siteId} sözleşmelerden kaldırıldı.`
    );
  };

  // Reassign single site
  const handleReassignSite = (siteId: string, newEmail: string) => {
    const targetTech = technicians.find((t) => t.email === newEmail);
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          return { ...s, assignedTechnicianEmail: newEmail };
        }
        return s;
      })
    );
    showToast(
      language === 'en'
        ? `Reassigned site to ${targetTech?.name || newEmail}.`
        : `Bina ${targetTech?.name || newEmail} teknisyenine devredildi.`
    );
  };

  // Batch import
  const handleBatchImport = (importedSites: BuildingSite[], updateExisting: boolean) => {
    setSites((prev) => {
      const existingIdMap = new Map(prev.map((s) => [s.id, s]));
      const existingNameMap = new Map(prev.map((s) => [s.name.toLowerCase().trim(), s]));

      let addedCount = 0;
      let updatedCount = 0;

      const result = [...prev];

      importedSites.forEach((imported) => {
        const match = existingIdMap.get(imported.id) || existingNameMap.get(imported.name.toLowerCase().trim());

        if (match && updateExisting) {
          const idx = result.findIndex((s) => s.id === match.id);
          if (idx !== -1) {
            result[idx] = {
              ...match,
              ...imported,
              id: match.id,
              lastVisit: match.lastVisit,
              visitHistory: match.visitHistory,
            };
            updatedCount++;
          }
        } else if (!match) {
          result.push(imported);
          addedCount++;
        }
      });

      showToast(
        language === 'en'
          ? `Import complete: ${addedCount} new sites added, ${updatedCount} updated.`
          : `İçe aktarma tamamlandı: ${addedCount} yeni bina eklendi, ${updatedCount} güncellendi.`
      );
      return result;
    });
  };

  // Reset to initial demo data
  const handleResetData = () => {
    setSites(INITIAL_SITES);
    setTechnicians(INITIAL_TECHNICIANS);
    localStorage.removeItem(STORAGE_SITES_KEY);
    localStorage.removeItem(STORAGE_TECHS_KEY);
    showToast(
      language === 'en'
        ? 'Database reset to clean real Istanbul sites and Adam operations director.'
        : 'Veritabanı gerçek İstanbul binalarına ve Adam yönetici profiline sıfırlandı.'
    );
  };

  const visitedCount = sites.filter((s) => s.lastVisit).length;

  // Authentication Gate: Render dedicated Login Page if not signed in
  if (!authenticatedUser) {
    return (
      <LoginPage
        technicians={technicians}
        onLoginSuccess={handleLoginSuccess}
        language={language}
        onToggleLanguage={toggleLanguage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Bar with Language Switcher & Profile */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        technicians={technicians}
        currentTechnician={currentTechnician}
        onSelectTechnician={setCurrentTechnician}
        language={language}
        onToggleLanguage={toggleLanguage}
        onOpenAddSite={() => {
          setEditingSite(null);
          setIsSiteModalOpen(true);
        }}
        onOpenEmergencyFault={() => setIsEmergencyFaultModalOpen(true)}
        totalSitesCount={sites.length}
        visitedSitesCount={visitedCount}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseConnect={() => setIsSupabaseModalOpen(true)}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      {/* Main Content Area (extra bottom padding on mobile for MobileBottomNav) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-28 md:pb-6">
        {activeTab === 'routes' && (
          <RoutePlannerView
            sites={sites}
            technicians={technicians}
            currentTechnician={currentTechnician}
            language={language}
            onUpdateSiteLocation={handleUpdateSiteLocation}
            isAdmin={isAdmin}
            onOpenInspect={(site) => setInspectingSite(site)}
            onOpenAddSite={() => {
              setEditingSite(null);
              setIsSiteModalOpen(true);
            }}
          />
        )}

        {activeTab === 'directory' && (
          <SitesDirectoryView
            sites={sites}
            technicians={technicians}
            currentTechnician={currentTechnician}
            language={language}
            onOpenInspect={(site) => setInspectingSite(site)}
            onOpenEditSite={(site) => {
              setEditingSite(site);
              setIsSiteModalOpen(true);
            }}
            onOpenAddSite={() => {
              setEditingSite(null);
              setIsSiteModalOpen(true);
            }}
            onDeleteSite={handleDeleteSite}
            onReassignSite={handleReassignSite}
            onBatchImport={handleBatchImport}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            sites={sites}
            technicians={technicians}
            currentTechnician={currentTechnician}
            language={language}
            onUpdateSite={handleSaveSite}
            onDeleteSite={handleDeleteSite}
            onBatchReassign={handleBatchReassign}
            onAddTechnician={handleAddTechnician}
            onUpdateTechnician={handleUpdateTechnician}
            onDeleteTechnician={handleDeleteTechnician}
            onResetData={handleResetData}
            onOpenSupabaseConnect={() => setIsSupabaseModalOpen(true)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            sites={sites}
            technicians={technicians}
            currentTechnician={currentTechnician}
            language={language}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-xs text-slate-500 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">ElevatorOps</span>
            <span aria-hidden="true">•</span>
            <span>One Tech Asansör - Operations & Route Management</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetData}</span>
            </button>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <span className="font-mono tabular-nums">{t.activeTechnician}: {currentTechnician.name}</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Thumb friendly, accessible navigation) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenEmergency={() => setIsEmergencyFaultModalOpen(true)}
        isAdmin={isAdmin}
        language={language}
        unreadAlertsCount={sites.filter((s) => s.priority === 'fault_alert').length}
      />


      {/* On-Site Inspection & Visit Modal */}
      <VisitInspectionModal
        site={inspectingSite}
        technicians={technicians}
        technicianEmail={currentTechnician.email}
        technicianName={currentTechnician.name}
        language={language}
        isOpen={Boolean(inspectingSite)}
        onClose={() => setInspectingSite(null)}
        onSaveVisit={handleSaveVisit}
      />

      {/* Add / Edit Site Modal */}
      <SiteModal
        isOpen={isSiteModalOpen}
        onClose={() => {
          setIsSiteModalOpen(false);
          setEditingSite(null);
        }}
        siteToEdit={editingSite}
        onSaveSite={handleSaveSite}
        currentTechnicianEmail={currentTechnician.email}
        technicians={technicians}
        language={language}
      />

      {/* Emergency Fault Rapid Dispatch Modal */}
      <EmergencyFaultModal
        isOpen={isEmergencyFaultModalOpen}
        onClose={() => setIsEmergencyFaultModalOpen(false)}
        sites={sites}
        technicians={technicians}
        technicianEmail={currentTechnician.email}
        technicianName={currentTechnician.name}
        language={language}
        onSaveFault={handleSaveEmergencyFault}
      />

      {/* Supabase Cloud Database Connection & Sync Modal */}
      <SupabaseConnectModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        sites={sites}
        technicians={technicians}
        onSyncComplete={() => {
          setIsSupabaseConnected(true);
          showToast(
            language === 'en'
              ? 'Supabase cloud synchronization active!'
              : 'Supabase bulut senkronizasyonu devrede!'
          );
        }}
      />

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
