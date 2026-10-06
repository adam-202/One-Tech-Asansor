import React, { useState } from 'react';
import { BuildingSite, VisitRecord, InspectionStatus } from '../types';
import { TECHNICIANS } from '../data/seedSites';
import {
  AlertTriangle,
  AlertOctagon,
  Search,
  Building2,
  X,
  Users,
  Wrench,
  Clock,
  CheckCircle2,
  Plus,
  Layers,
  MapPin,
} from 'lucide-react';

interface EmergencyFaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: BuildingSite[];
  technicianEmail: string;
  technicianName: string;
  onSaveFault: (siteId: string, visitRecord: VisitRecord) => void;
}

export const EmergencyFaultModal: React.FC<EmergencyFaultModalProps> = ({
  isOpen,
  onClose,
  sites,
  technicianEmail,
  technicianName,
  onSaveFault,
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.id || '');
  const [siteSearch, setSiteSearch] = useState<string>('');
  const [severity, setSeverity] = useState<'fault' | 'emergency'>('fault');
  const [affectedUnit, setAffectedUnit] = useState<string>('Car 1 (Passenger)');
  const [issueSummary, setIssueSummary] = useState<string>('');
  const [partsReplaced, setPartsReplaced] = useState<string>('');
  const [attendingTechs, setAttendingTechs] = useState<string[]>([technicianName]);

  // Filter sites for search dropdown
  const filteredSites = sites.filter((s) => {
    if (!siteSearch.trim()) return true;
    const q = siteSearch.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.address || '').toLowerCase().includes(q) || (s.id || '').toLowerCase().includes(q);
  });

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  const toggleAttendingTech = (name: string) => {
    if (attendingTechs.includes(name)) {
      if (attendingTechs.length === 1) return;
      setAttendingTechs(attendingTechs.filter((t) => t !== name));
    } else {
      if (attendingTechs.length >= 4) return;
      setAttendingTechs([...attendingTechs, name]);
    }
  };

  const handleApplyPreset = (preset: string) => {
    setIssueSummary((prev) => (prev ? `${prev}. ${preset}` : preset));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8);

    const status: InspectionStatus = severity === 'emergency' ? 'critical' : 'attention_needed';

    const visitRecord: VisitRecord = {
      id: `fault-${Date.now()}`,
      siteId: selectedSite.id,
      siteName: selectedSite.name,
      address: selectedSite.address,
      neighborhood: selectedSite.neighborhood,
      date: dateStr,
      time: timeStr,
      monthYear: '2026-10',
      visitType: severity,
      technicianEmail,
      technicianName,
      attendingTechnicians: attendingTechs,
      status,
      checklist: {
        doorSensors: severity !== 'emergency',
        carLeveling: severity !== 'fault',
        hoistwayCables: true,
        emergencyComm: true,
        machineRoom: severity !== 'emergency',
      },
      partsReplaced: partsReplaced.trim() || 'Pending parts diagnosis',
      notes: `[EMERGENCY FAULT REPORT - ${affectedUnit}]: ${issueSummary || 'Emergency callout reported by building super.'}`,
      durationMinutes: severity === 'emergency' ? 45 : 30,
    };

    onSaveFault(selectedSite.id, visitRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden my-6">
        {/* Urgent Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-950 text-white border-b border-rose-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center font-bold text-white shadow-xs">
              <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-mono tracking-wider text-rose-300">
                Rapid Emergency Dispatch
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Log Emergency Fault & Flag Attention
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-300 hover:text-white rounded-lg hover:bg-rose-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* 1. Quick Building Selector with Search */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Select Building / Site *</span>
              </label>

              {/* Search input to narrow down 160 sites */}
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  placeholder="Filter 160 buildings by name or address..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-hidden bg-slate-50 focus:bg-white"
                />
              </div>

              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-hidden font-medium"
                required
              >
                {filteredSites.slice(0, 50).map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} — {site.address} ({site.elevatorUnits} Lifts)
                  </option>
                ))}
              </select>

              {selectedSite && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{selectedSite.name}</span>
                    <span className="text-slate-500">· {selectedSite.address}</span>
                  </div>
                  <span className="font-mono text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Code: {selectedSite.accessCode}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Fault Severity Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Fault Severity *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSeverity('fault')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    severity === 'fault'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Fault / Attention Required</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSeverity('emergency')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    severity === 'emergency'
                      ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-600/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Critical Shutdown / Entrapment</span>
                </button>
              </div>
            </div>

            {/* 3. Affected Elevator Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Affected Elevator Car / Fleet ID</span>
              </label>
              <input
                type="text"
                value={affectedUnit}
                onChange={(e) => setAffectedUnit(e.target.value)}
                placeholder="e.g. Car 1 (Passenger), Freight Lift, or All Units"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-rose-500 outline-hidden text-slate-900"
              />
            </div>

            {/* 4. Issue Description & Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Issue Description & Symptom *
                </label>
                <span className="text-[11px] text-slate-400">Quick Presets</span>
              </div>

              {/* Quick Fault Presets */}
              <div className="flex flex-wrap gap-1 mb-2">
                {[
                  'Door interlock failure',
                  'Passenger entrapment (released)',
                  'Unusual vibration / brake drag',
                  'Floor leveling misalignment',
                  'Emergency intercom silent',
                  'Governor trip / safety clamp',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <textarea
                required
                rows={2}
                value={issueSummary}
                onChange={(e) => setIssueSummary(e.target.value)}
                placeholder="Describe the issue reported by the building manager or technician on site..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-hidden text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* 5. Parts Replaced or Required */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>Parts Replaced or Components Needed</span>
              </label>
              <input
                type="text"
                value={partsReplaced}
                onChange={(e) => setPartsReplaced(e.target.value)}
                placeholder="e.g. New door optical sensor, 2x roller guides installed, or Parts on order"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-rose-500 outline-hidden text-slate-900"
              />
            </div>

            {/* 6. Attending Technicians on Site */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Responding Team ({attendingTechs.length})</span>
                </label>
                <span className="text-[11px] text-slate-500">Colleagues responding</span>
              </div>

              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                {TECHNICIANS.slice(0, 10).map((tech) => {
                  const isSelected = attendingTechs.includes(tech.name);
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => toggleAttendingTech(tech.name)}
                      className={`px-2 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-slate-400" />}
                      <span>{tech.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Flag as Attention Required & Save Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
