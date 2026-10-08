import React, { useState, useEffect } from 'react';
import {
  BuildingSite,
  InspectionChecklist,
  InspectionStatus,
  VisitRecord,
  VisitType,
} from '../types';
import { TECHNICIANS } from '../data/seedSites';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  MapPin,
  Building2,
  KeyRound,
  Phone,
  Compass,
  CheckSquare,
  Square,
  Sparkles,
  Users,
  Wrench,
  Layers,
  History,
  ShieldCheck,
  Plus,
  Calendar,
  FileText,
} from 'lucide-react';
import { buildSingleSiteMapUrl } from '../utils/geo';

interface VisitInspectionModalProps {
  site: BuildingSite | null;
  technicianEmail: string;
  technicianName: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveVisit: (siteId: string, visitRecord: VisitRecord) => void;
}

export const VisitInspectionModal: React.FC<VisitInspectionModalProps> = ({
  site,
  technicianEmail,
  technicianName,
  isOpen,
  onClose,
  onSaveVisit,
}) => {
  // Tab switch between logging a new visit and viewing history
  const [activeModalTab, setActiveModalTab] = useState<'new_log' | 'history'>('new_log');

  // Form states
  const [visitType, setVisitType] = useState<VisitType>('monthly');
  const [status, setStatus] = useState<InspectionStatus>('passed');
  const [checklist, setChecklist] = useState<InspectionChecklist>({
    doorSensors: true,
    carLeveling: true,
    hoistwayCables: true,
    emergencyComm: true,
    machineRoom: true,
  });
  const [partsReplaced, setPartsReplaced] = useState<string>('None - routine maintenance');
  const [notes, setNotes] = useState<string>('Periodic maintenance completed. All elevator cars operational.');
  const [attendingTechs, setAttendingTechs] = useState<string[]>([technicianName]);

  useEffect(() => {
    if (site) {
      setActiveModalTab('new_log');
      // If site has a fault or critical status, suggest fault inspection
      if (site.lastVisit && (site.lastVisit.status === 'critical' || site.lastVisit.status === 'attention_needed')) {
        setVisitType('fault');
        setStatus('attention_needed');
        setPartsReplaced('Follow-up inspection & calibration');
        setNotes('Follow-up inspection for previous reported issue.');
      } else {
        setVisitType('monthly');
        setStatus('passed');
        setPartsReplaced('None - routine maintenance');
        setNotes('Periodic maintenance completed. All elevator cars operational.');
      }
      setAttendingTechs([technicianName]);
    }
  }, [site, technicianName]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !site) return null;

  const historyList: VisitRecord[] = site.visitHistory || (site.lastVisit ? [site.lastVisit] : []);

  const toggleChecklistItem = (key: keyof InspectionChecklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAttendingTech = (name: string) => {
    if (attendingTechs.includes(name)) {
      if (attendingTechs.length === 1) return;
      setAttendingTechs(attendingTechs.filter((t) => t !== name));
    } else {
      if (attendingTechs.length >= 4) return;
      setAttendingTechs([...attendingTechs, name]);
    }
  };

  const handleApplyPartPreset = (presetText: string) => {
    setPartsReplaced((prev) =>
      prev && prev !== 'None - routine maintenance' && prev !== 'None - routine inspection'
        ? `${prev}, ${presetText}`
        : presetText
    );
  };

  const handleComplete = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8);

    const record: VisitRecord = {
      id: `visit-${Date.now()}`,
      siteId: site.id,
      siteName: site.name,
      address: site.address,
      neighborhood: site.neighborhood,
      date: dateStr,
      time: timeStr,
      monthYear: '2026-10',
      visitType,
      technicianEmail,
      technicianName,
      attendingTechnicians: attendingTechs,
      status,
      checklist,
      partsReplaced: partsReplaced.trim() || 'None',
      notes: notes.trim(),
      durationMinutes: visitType === 'emergency' ? 60 : 30,
    };

    onSaveVisit(site.id, record);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-xs cursor-pointer"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 cursor-default">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-blue-400">
                Site Operations Console
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {site.category === 'public' ? 'Public Pool' : 'Private Assignment'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              {site.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Building Quick Info Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium text-slate-800">{site.address}</span>
            <span className="text-slate-400">({site.neighborhood})</span>
          </div>

          <a
            href={site.googleMapsUrl || buildSingleSiteMapUrl(site)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Open in Google Maps</span>
          </a>
        </div>

        {/* Modal Navigation Tabs (New Visit Log vs Visit History) */}
        <div className="px-6 pt-3 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModalTab('new_log')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeModalTab === 'new_log'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Visit Log</span>
            </button>

            <button
              onClick={() => setActiveModalTab('history')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeModalTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>
                Visit History <span className="font-mono text-xs opacity-75">({historyList.length})</span>
              </span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Multiple visits allowed per month
          </span>
        </div>

        {/* Tab 1: New Visit Log Entry */}
        {activeModalTab === 'new_log' && (
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Elevator Fleet IDs & Security Code */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fleet Units</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 font-mono">
                  {site.elevatorUnits} Lifts · {site.floors} Fls
                </p>
                <p className="text-[10px] text-slate-500 truncate">{site.elevatorBrand}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Door / Key Code</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 font-mono tracking-wider">
                  {site.accessCode || 'Front Desk'}
                </p>
                <p className="text-[10px] text-slate-500">Service Keybox</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2">
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Building Super / Manager</span>
                </div>
                <p className="text-xs font-semibold text-slate-900">
                  {site.managerName}
                </p>
                <p className="text-[11px] text-blue-600 font-mono">{site.managerPhone}</p>
              </div>
            </div>

            {/* Elevator Numbers Banner */}
            {site.elevatorNumbers && (
              <div className="px-3 py-2 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Elevator Units on Site:</strong> {site.elevatorNumbers}
                </span>
              </div>
            )}

            {/* 1. Visit Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Visit Purpose / Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVisitType('monthly');
                    setStatus('passed');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center text-center transition-all ${
                    visitType === 'monthly'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 mb-1 ${visitType === 'monthly' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="font-semibold">Monthly Maintenance</span>
                  <span className="text-[10px] text-slate-500">Regular routine visit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVisitType('fault');
                    setStatus('attention_needed');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center text-center transition-all ${
                    visitType === 'fault'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wrench className={`w-4 h-4 mb-1 ${visitType === 'fault' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className="font-semibold">Fault / Breakdown</span>
                  <span className="text-[10px] text-slate-500">Part replacement / repair</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVisitType('emergency');
                    setStatus('critical');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center text-center transition-all ${
                    visitType === 'emergency'
                      ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertOctagon className={`w-4 h-4 mb-1 ${visitType === 'emergency' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span className="font-semibold">Emergency Issue</span>
                  <span className="text-[10px] text-slate-500">Critical callout</span>
                </button>
              </div>
            </div>

            {/* 2. Multi-Technician Team Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attending Technicians (Team of {attendingTechs.length})</span>
                </label>
                <span className="text-[11px] text-slate-500">Select colleagues on site</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {TECHNICIANS.slice(0, 10).map((tech) => {
                    const isSelected = attendingTechs.includes(tech.name);
                    return (
                      <button
                        key={tech.id}
                        type="button"
                        onClick={() => toggleAttendingTech(tech.name)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-slate-400" />}
                        <span>{tech.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500">
                  Logged as: <strong className="text-slate-800">{attendingTechs.join(', ')}</strong>.
                </p>
              </div>
            </div>

            {/* 3. Parts Replaced & Fixed */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  <span>Parts Replaced or Repaired</span>
                </label>
                <span className="text-[11px] text-slate-400">Captured in Excel report</span>
              </div>

              {/* Quick Part Presets */}
              <div className="flex flex-wrap gap-1 mb-2">
                {[
                  'Door interlock contact switch',
                  'Landing photoelectric sensor',
                  'Door operator roller guide',
                  'Main contactor relay board',
                  'Brake shoe lining adjustment',
                  'In-cab emergency battery',
                ].map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => handleApplyPartPreset(part)}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    + {part}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={partsReplaced}
                onChange={(e) => setPartsReplaced(e.target.value)}
                placeholder="e.g. Replaced worn door guide shoes on Car 2, lubricated hoist ropes..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden"
              />
            </div>

            {/* 4. Safety Inspection Points */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Safety Inspection Checklist
                </label>
                <span className="text-[11px] text-slate-500">
                  {Object.values(checklist).filter(Boolean).length}/5 Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'doorSensors' as const, label: 'Door safety optical curtain' },
                  { key: 'carLeveling' as const, label: 'Car leveling flush (±5mm)' },
                  { key: 'hoistwayCables' as const, label: 'Hoistway ropes & tension' },
                  { key: 'emergencyComm' as const, label: 'In-cab phone & alarm bell' },
                  { key: 'machineRoom' as const, label: 'Machine room brake & lubrication' },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => toggleChecklistItem(item.key)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
                      checklist[item.key]
                        ? 'border-emerald-200 bg-emerald-50/50 text-slate-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {checklist[item.key] ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Inspection Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Technician Findings & Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Record any diagnostic observations, root cause for fault, or upcoming follow-up recommendations..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder-slate-400 outline-hidden"
              />
            </div>

            {/* Timestamp Preview */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Timestamp: <strong>{new Date().toLocaleDateString()}</strong> at <strong>{new Date().toLocaleTimeString()}</strong>
                </span>
              </div>
              <span className="text-[11px] font-mono text-blue-700">
                Logged by: {technicianName}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Full Visit History Feature */}
        {activeModalTab === 'history' && (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Historical Logs for {site.name}</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {historyList.length} Total Visits Recorded
              </span>
            </div>

            {historyList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-slate-700">No visits logged yet this month</p>
                <p className="mt-1">Switch to "Add Visit Log" above to record the first inspection.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-2 text-xs"
                  >
                    {/* Log Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.visitType === 'emergency'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : log.visitType === 'fault'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {log.visitType === 'monthly'
                            ? 'Monthly Maintenance'
                            : log.visitType === 'fault'
                            ? 'Fault Repair'
                            : 'Emergency Callout'}
                        </span>
                        <span className="font-mono text-slate-500">
                          {log.date} at {log.time}
                        </span>
                      </div>

                      <span
                        className={`font-semibold capitalize text-[11px] ${
                          log.status === 'passed'
                            ? 'text-emerald-700'
                            : log.status === 'attention_needed'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {log.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Attending Technicians */}
                    <div className="text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Attending: <strong>{log.attendingTechnicians?.join(', ') || log.technicianName}</strong>
                      </span>
                    </div>

                    {/* Parts Replaced */}
                    {log.partsReplaced && log.partsReplaced !== 'None' && (
                      <div className="text-slate-700 flex items-center gap-1.5 bg-amber-50/80 p-2 rounded-lg border border-amber-100">
                        <Wrench className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Parts Replaced: <strong>{log.partsReplaced}</strong>
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {log.notes && (
                      <div className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] italic">
                        "{log.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Close
          </button>

          {activeModalTab === 'new_log' ? (
            <button
              type="button"
              onClick={handleComplete}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Add Visit Log</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveModalTab('new_log')}
              className="px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200"
            >
              + Create Another Visit Log
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
