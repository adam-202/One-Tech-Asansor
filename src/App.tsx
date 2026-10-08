/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BuildingSite, Technician, VisitRecord } from './types';
import { INITIAL_SITES, TECHNICIANS } from './data/seedSites';
import { TopNav } from './components/TopNav';
import { RoutePlannerView } from './components/RoutePlannerView';
import { SitesDirectoryView } from './components/SitesDirectoryView';
import { ReportsView } from './components/ReportsView';
import { VisitInspectionModal } from './components/VisitInspectionModal';
import { SiteModal } from './components/SiteModal';
import { EmergencyFaultModal } from './components/EmergencyFaultModal';
import { CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'elevatorops_sites_data_v1';

export default function App() {
  // Load sites from local storage or fallback to initial seed
  const [sites, setSites] = useState<BuildingSite[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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
                    : [s.lastVisit.technicianName || 'Adam Osama'],
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

  // Current logged in technician (defaults to Adam Osama)
  const [currentTechnician, setCurrentTechnician] = useState<Technician>(TECHNICIANS[0]);
  const [activeTab, setActiveTab] = useState<'routes' | 'directory' | 'reports'>('routes');

  // Modal states
  const [inspectingSite, setInspectingSite] = useState<BuildingSite | null>(null);
  const [isSiteModalOpen, setIsSiteModalOpen] = useState<boolean>(false);
  const [isEmergencyFaultModalOpen, setIsEmergencyFaultModalOpen] = useState<boolean>(false);
  const [editingSite, setEditingSite] = useState<BuildingSite | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
    } catch (e) {
      console.error('Error persisting sites data:', e);
    }
  }, [sites]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Handle visit completion (appends to visit history so buildings can be visited multiple times)
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
    showToast(`Visit log #${(sites.find((s) => s.id === siteId)?.visitHistory?.length || 0) + 1} recorded for ${visitRecord.siteName}!`);
  };

  // Handle Emergency Fault Shortcut (marks site as Attention Required & appends log)
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
    showToast(`EMERGENCY REPORTED: ${visitRecord.siteName} updated to Attention Required!`);
  };

  // Handle add / edit site
  const handleSaveSite = (savedSite: BuildingSite) => {
    setSites((prev) => {
      const exists = prev.some((s) => s.id === savedSite.id);
      if (exists) {
        return prev.map((s) => (s.id === savedSite.id ? savedSite : s));
      }
      return [savedSite, ...prev];
    });
    showToast(`Building ${savedSite.name} successfully updated.`);
  };

  // Handle site deletion
  const handleDeleteSite = (siteId: string) => {
    const target = sites.find((s) => s.id === siteId);
    setSites((prev) => prev.filter((s) => s.id !== siteId));
    showToast(`Site ${target?.name || siteId} removed from contracts.`);
  };

  // Handle reassigning site
  const handleReassignSite = (siteId: string, newEmail: string) => {
    const tech = TECHNICIANS.find((t) => t.email === newEmail);
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          return { ...s, assignedTechnicianEmail: newEmail };
        }
        return s;
      })
    );
    showToast(`Reassigned site to ${tech?.name || newEmail}.`);
  };

  // Handle mass-batch import of building sites from Excel, CSV, or WhatsApp
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

      showToast(`Batch import complete: ${addedCount} new sites added, ${updatedCount} existing updated.`);
      return result;
    });
  };

  // Reset to initial demo data
  const handleResetData = () => {
    setSites(INITIAL_SITES);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Database reset to initial 160 contracted sites.');
  };

  const visitedCount = sites.filter((s) => s.lastVisit).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
      {/* Top Bar with Emergency Fault Shortcut */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentTechnician={currentTechnician}
        onSelectTechnician={setCurrentTechnician}
        onOpenAddSite={() => {
          setEditingSite(null);
          setIsSiteModalOpen(true);
        }}
        onOpenEmergencyFault={() => setIsEmergencyFaultModalOpen(true)}
        totalSitesCount={sites.length}
        visitedSitesCount={visitedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'routes' && (
          <RoutePlannerView
            sites={sites}
            currentTechnician={currentTechnician}
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
            currentTechnician={currentTechnician}
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

        {activeTab === 'reports' && (
          <ReportsView sites={sites} currentTechnician={currentTechnician} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">ElevatorOps</span>
            <span aria-hidden="true">·</span>
            <span>Intelligent Maintenance Dispatch & Route Optimization</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
              title="Reset initial 160 elevator sites data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed Data</span>
            </button>
            <span aria-hidden="true" className="text-slate-300">|</span>
            <span className="font-mono tabular-nums">Logged in as {currentTechnician.email}</span>
          </div>
        </div>
      </footer>

      {/* On-Site Inspection & Visit Modal */}
      <VisitInspectionModal
        site={inspectingSite}
        technicianEmail={currentTechnician.email}
        technicianName={currentTechnician.name}
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
      />

      {/* Emergency Fault Rapid Dispatch Modal */}
      <EmergencyFaultModal
        isOpen={isEmergencyFaultModalOpen}
        onClose={() => setIsEmergencyFaultModalOpen(false)}
        sites={sites}
        technicianEmail={currentTechnician.email}
        technicianName={currentTechnician.name}
        onSaveFault={handleSaveEmergencyFault}
      />

      {/* Floating Success Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
