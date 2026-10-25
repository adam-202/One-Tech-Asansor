import React, { useState, useEffect } from 'react';
import {
  BuildingSite,
  InspectionChecklist,
  InspectionStatus,
  VisitRecord,
  VisitType,
  Technician,
  SparePartItem,
} from '../types';
import { TECHNICIANS } from '../data/seedSites';
import { Language, translations } from '../utils/translations';
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
  Trash2,
  Save,
  Cpu,
  Cable,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { buildSingleSiteMapUrl } from '../utils/geo';

interface VisitInspectionModalProps {
  technicians?: Technician[];
  language?: Language;
  site: BuildingSite | null;
  technicianEmail: string;
  technicianName: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveVisit: (siteId: string, visitRecord: VisitRecord) => void;
  onUpdateSite?: (site: BuildingSite) => void;
}

export const VisitInspectionModal: React.FC<VisitInspectionModalProps> = ({
  site,
  technicianEmail,
  technicianName,
  isOpen,
  onClose,
  onSaveVisit,
  onUpdateSite,
  technicians: passedTechnicians,
  language = 'tr',
}) => {
  const t = translations[language];
  const activeTechnicians = passedTechnicians && passedTechnicians.length > 0 ? passedTechnicians : TECHNICIANS;

  // 3 Tabs: 'new_log' | 'history' | 'specs_parts'
  const [activeModalTab, setActiveModalTab] = useState<'new_log' | 'history' | 'specs_parts'>('new_log');

  // Visit Form states
  const [visitType, setVisitType] = useState<VisitType>('monthly');
  const [status, setStatus] = useState<InspectionStatus>('passed');
  const [checklist, setChecklist] = useState<InspectionChecklist>({
    doorSensors: true,
    carLeveling: true,
    hoistwayCables: true,
    emergencyComm: true,
    machineRoom: true,
  });
  const [partsReplaced, setPartsReplaced] = useState<string>(
    language === 'tr' ? 'Yok - standart periyodik bakım' : 'None - routine maintenance'
  );
  const [notes, setNotes] = useState<string>(
    language === 'tr'
      ? 'Aylık periyodik bakım tamamlandı. Tüm asansörler ve emniyet tertibatları faal.'
      : 'Periodic maintenance completed. All elevator cars operational.'
  );
  const [attendingTechs, setAttendingTechs] = useState<string[]>([technicianName]);

  // Technical Specs & Spare Parts State
  const [machineType, setMachineType] = useState('');
  const [suspensionRatio, setSuspensionRatio] = useState('2:1');
  const [wireRopeSpecs, setWireRopeSpecs] = useState('');
  const [controlPanel, setControlPanel] = useState('');
  const [doorOperator, setDoorOperator] = useState('');
  const [spareParts, setSpareParts] = useState<SparePartItem[]>([]);
  const [specsSavedFeedback, setSpecsSavedFeedback] = useState(false);

  // Initialize form and technical specs on site change
  useEffect(() => {
    if (site) {
      setActiveModalTab('new_log');

      // Initialize specs & spare parts from site data
      setMachineType(site.machineType || (language === 'tr' ? 'Dişlisiz Senkron PM Motor' : 'Gearless Synchronous PM'));
      setSuspensionRatio(site.suspensionRatio || '2:1');
      setWireRopeSpecs(
        site.wireRopeSpecs ||
          (language === 'tr'
            ? 'Ø10mm 8x19S-SFC Çelik Halat (5 halat x 165m), 24 Damarlı Fleks Seyir Kablosu'
            : 'Ø10mm 8x19S-SFC Steel Wire Rope (5 ropes x 165m), 24-core Traveling Cable')
      );
      setControlPanel(site.controlPanel || 'Arkel A-Cube / ML65');
      setDoorOperator(
        site.doorOperator ||
          (language === 'tr' ? 'VVVF 2 Panelli Merkez Açılır Otomatik Kapı' : 'VVVF 2-Panel Center Open Automatic Door')
      );

      // Initialize spare parts & wires list
      if (site.spareParts && site.spareParts.length > 0) {
        setSpareParts(site.spareParts);
      } else {
        setSpareParts([
          {
            id: 'part-default-1',
            partName: language === 'tr' ? 'Taşıyıcı Çelik Halat Ø10mm (8x19S)' : 'Hoist Wire Rope Ø10mm (8x19S)',
            quantity: '175 m',
          },
          {
            id: 'part-default-2',
            partName: language === 'tr' ? 'Kapı Emniyet Boy Fotoseli Seti' : 'Full Height Light Curtain Sensor',
            quantity: '1 set',
          },
          {
            id: 'part-default-3',
            partName: language === 'tr' ? 'Kabin Paten Pabuçları & Yağdanlık' : 'Cabin Roller Guides & Lubricator',
            quantity: '4 pcs',
          },
        ]);
      }

      // Prepopulate visit fields
      if (site.lastVisit && (site.lastVisit.status === 'critical' || site.lastVisit.status === 'attention_needed')) {
        setVisitType('fault');
        setStatus('attention_needed');
        setPartsReplaced(language === 'tr' ? 'Arıza müdahalesi ve parça kalibrasyonu' : 'Follow-up inspection & calibration');
        setNotes(language === 'tr' ? 'Önceki arıza kaydına istinaden saha müdahalesi gerçekleştirildi.' : 'Follow-up inspection for previous reported issue.');
      } else {
        setVisitType('monthly');
        setStatus('passed');
        setPartsReplaced(language === 'tr' ? 'Yok - standart periyodik bakım' : 'None - routine maintenance');
        setNotes(
          language === 'tr'
            ? 'Aylık periyodik bakım tamamlandı. Tüm asansörler ve emniyet tertibatları faal.'
            : 'Periodic maintenance completed. All elevator cars operational.'
        );
      }
      setAttendingTechs([technicianName]);
    }
  }, [site, technicianName, language]);

  // Support Mobile Swipe-Back & Browser History Navigation
  useEffect(() => {
    if (!isOpen) return;

    // Push state onto browser history so mobile edge swipe or Android back button closes the modal cleanly instead of exiting the site
    const stateObj = { modal: 'visit_modal', timestamp: Date.now() };
    window.history.pushState(stateObj, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSafeClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Mobile Touch Gesture: Swipe Right to Dismiss Modal
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      // If swiped right by more than 80px starting from near left edge (< 70px)
      if (touchEndX - touchStartX > 80 && touchStartX < 70) {
        handleSafeClose();
      }
    }
    setTouchStartX(null);
  };

  // Safe Close Handler: pops state if it was pushed
  const handleSafeClose = () => {
    if (window.history.state?.modal === 'visit_modal') {
      window.history.back();
    } else {
      onClose();
    }
  };

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
      prev && !prev.toLowerCase().includes('yok') && !prev.toLowerCase().includes('none')
        ? `${prev}, ${presetText}`
        : presetText
    );
  };

  const handleCompleteVisit = () => {
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
      partsReplaced: partsReplaced.trim() || (language === 'tr' ? 'Yok' : 'None'),
      notes: notes.trim(),
      durationMinutes: visitType === 'emergency' ? 60 : 30,
    };

    onSaveVisit(site.id, record);
    handleSafeClose();
  };

  // Dynamic Spare Parts List Handlers
  const handleAddSparePartRow = () => {
    const newItem: SparePartItem = {
      id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      partName: '',
      quantity: '',
    };
    setSpareParts((prev) => [...prev, newItem]);
  };

  const handleUpdateSparePartRow = (id: string, field: 'partName' | 'quantity', val: string) => {
    setSpareParts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveSparePartRow = (id: string) => {
    setSpareParts((prev) => prev.filter((item) => item.id !== id));
  };

  // Save Technical Specs & Spare Parts to Building Site
  const handleSaveSpecsAndParts = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onUpdateSite) return;

    // Filter out completely empty spare part rows
    const cleanedParts = spareParts.filter((p) => p.partName.trim().length > 0 || p.quantity.trim().length > 0);

    const updatedSite: BuildingSite = {
      ...site,
      machineType: machineType.trim(),
      suspensionRatio: suspensionRatio.trim(),
      wireRopeSpecs: wireRopeSpecs.trim(),
      controlPanel: controlPanel.trim(),
      doorOperator: doorOperator.trim(),
      spareParts: cleanedParts,
    };

    onUpdateSite(updatedSite);
    setSpecsSavedFeedback(true);
    setTimeout(() => setSpecsSavedFeedback(false), 3000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSafeClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-xs cursor-pointer animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto cursor-default flex flex-col max-h-[94vh]">
        {/* Mobile Swipe-Down Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSafeClose}
              className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors sm:hidden"
              title={t.swipeBackTooltip}
            >
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-mono tracking-wider text-blue-400 font-semibold">
                  {t.siteOpsConsole}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {site.category === 'public' ? t.publicPool : t.privateAssignment}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5 truncate max-w-xs sm:max-w-md">
                {site.name}
              </h2>
            </div>
          </div>
          <button
            onClick={handleSafeClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Building Quick Info Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-y-1 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-medium text-slate-800 dark:text-white truncate">{site.address}</span>
            <span className="text-slate-400 dark:text-slate-500 shrink-0">({site.neighborhood})</span>
          </div>

          <a
            href={site.googleMapsUrl || buildSingleSiteMapUrl(site)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{t.openGoogleMaps}</span>
          </a>
        </div>

        {/* Modal Navigation Tabs (3 Tabs: Add Visit Log, Visit History, Specs & Spare Parts) */}
        <div className="px-4 sm:px-6 pt-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Tab 1: New Visit Log */}
            <button
              onClick={() => setActiveModalTab('new_log')}
              className={`pb-2.5 px-2.5 sm:px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeModalTab === 'new_log'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{t.addVisitLogTab}</span>
            </button>

            {/* Tab 2: Visit History */}
            <button
              onClick={() => setActiveModalTab('history')}
              className={`pb-2.5 px-2.5 sm:px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeModalTab === 'history'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>
                {t.visitHistoryTab} <span className="font-mono text-xs opacity-75">({historyList.length})</span>
              </span>
            </button>

            {/* Tab 3: Elevator Specs & Spare Parts (Requested by user) */}
            <button
              onClick={() => setActiveModalTab('specs_parts')}
              className={`pb-2.5 px-2.5 sm:px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeModalTab === 'specs_parts'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>{t.elevatorSpecsAndParts}</span>
            </button>
          </div>

          <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden md:inline shrink-0">
            {t.multipleVisitsNotice}
          </span>
        </div>

        {/* TAB 1: New Visit Log Entry */}
        {activeModalTab === 'new_log' && (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Elevator Fleet IDs & Security Code */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.fleetUnits}</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                  {site.elevatorUnits ?? 1} {t.unitsCount} · {site.floors ?? 6} {t.floorsCount}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{site.elevatorBrand}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t.doorKeyCode}</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white font-mono tracking-wider">
                  {site.accessCode || (language === 'tr' ? 'Danışma / Güvenlik' : 'Front Desk')}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {language === 'tr' ? 'Hizmet Anahtar Dolabı' : 'Service Keybox'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 col-span-2">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.buildingSuper}</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {site.managerName || (language === 'tr' ? 'Bina Yöneticisi' : 'Building Manager')}
                </p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                  {site.managerPhone || (language === 'tr' ? 'Telefon Kaydedilmedi' : 'No phone')}
                </p>
              </div>
            </div>

            {/* Elevator Numbers Banner */}
            {site.elevatorNumbers && (
              <div className="px-3 py-2 bg-blue-50/70 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  <strong>{t.elevatorUnitsOnSite}:</strong> {site.elevatorNumbers}
                </span>
              </div>
            )}

            {/* 1. Visit Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                {t.visitPurposeType}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVisitType('monthly');
                    setStatus('passed');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    visitType === 'monthly'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 mb-1 ${visitType === 'monthly' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span className="font-semibold">{t.monthlyMaintenance}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.regularRoutineVisit}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVisitType('fault');
                    setStatus('attention_needed');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    visitType === 'fault'
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-2 ring-amber-600/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Wrench className={`w-4 h-4 mb-1 ${visitType === 'fault' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                  <span className="font-semibold">{t.faultBreakdown}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.partReplacementRepair}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVisitType('emergency');
                    setStatus('critical');
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    visitType === 'emergency'
                      ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 ring-2 ring-rose-600/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <AlertOctagon className={`w-4 h-4 mb-1 ${visitType === 'emergency' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                  <span className="font-semibold">{t.emergencyIssue}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{t.criticalCallout}</span>
                </button>
              </div>
            </div>

            {/* 2. Attending Specialists */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t.attendingTechnicians} ({attendingTechs.length})</span>
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t.selectColleaguesOnSite}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeTechnicians.map((tech) => {
                  const isSelected = attendingTechs.includes(tech.name);
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => toggleAttendingTech(tech.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3 h-3 text-slate-400" />}
                      <span>{tech.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {t.loggedAs}: <strong>{technicianName}</strong>.
              </p>
            </div>

            {/* 3. Parts Replaced or Repaired */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.partsReplacedTitle}</span>
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {t.capturedInExcelReport}
                </span>
              </div>

              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  language === 'tr' ? 'Kapı fiş kontağı değişimi' : 'Door interlock contact switch',
                  language === 'tr' ? 'Fotosel sensör değişimi' : 'Landing photoelectric sensor',
                  language === 'tr' ? 'Kapı makarası & paten ayarı' : 'Door operator roller guide',
                  language === 'tr' ? 'Ana kontaktör röle kartı' : 'Main contactor relay board',
                  language === 'tr' ? 'Fren balata ayarı' : 'Brake shoe lining adjustment',
                  language === 'tr' ? 'Kabin acil aydınlatma aküsü' : 'In-cab emergency battery',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleApplyPartPreset(chip)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={partsReplaced}
                onChange={(e) => setPartsReplaced(e.target.value)}
                placeholder={language === 'tr' ? 'Değişen parçalar (örn. 2 adet kilit kontağı, paten pabucu)...' : 'Parts changed (e.g. 2x door interlock, guide shoes)...'}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white outline-hidden font-medium"
              />
            </div>

            {/* 4. Safety Inspection Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t.safetyInspectionChecklist}
                </label>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {Object.values(checklist).filter(Boolean).length}/5 {t.verified}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'doorSensors' as const, label: t.chkDoorSensors },
                  { key: 'carLeveling' as const, label: t.chkCarLeveling },
                  { key: 'hoistwayCables' as const, label: t.chkHoistwayCables },
                  { key: 'emergencyComm' as const, label: t.chkEmergencyComm },
                  { key: 'machineRoom' as const, label: t.chkMachineRoom },
                ].map((item) => (
                  <div
                    key={item.key}
                    onClick={() => toggleChecklistItem(item.key)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
                      checklist[item.key]
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {checklist[item.key] ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    )}
                    <span className="text-xs font-medium leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Inspection Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.techNotesTitle}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'tr' ? 'Teşhis gözlemleri, arıza kök nedeni veya bir sonraki bakım için öneriler...' : 'Record diagnostic observations, root cause for fault, or upcoming follow-up recommendations...'}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-hidden"
              />
            </div>

            {/* Timestamp Preview */}
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  {language === 'tr' ? 'Tarih & Saat:' : 'Timestamp:'} <strong>{new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}</strong> - <strong>{new Date().toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US')}</strong>
                </span>
              </div>
              <span className="text-[11px] font-mono text-blue-700 dark:text-blue-300">
                {t.loggedAs}: {technicianName}
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: Visit History */}
        {activeModalTab === 'history' && (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{language === 'tr' ? `${site.name} Bakım Geçmişi` : `Historical Logs for ${site.name}`}</span>
              </h3>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {historyList.length} {language === 'tr' ? 'Kayıtlı Ziyaret' : 'Visits Recorded'}
              </span>
            </div>

            {historyList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {language === 'tr' ? 'Bu ay henüz bakım kaydı girilmedi' : 'No visits logged yet this month'}
                </p>
                <p className="mt-1">
                  {language === 'tr' ? 'İlk kontrolü kaydetmek için yukarıdaki "Bakım Kaydı Ekle" sekmesine geçin.' : 'Switch to "Add Visit Log" above to record the first inspection.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            log.visitType === 'emergency'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : log.visitType === 'fault'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {log.visitType === 'monthly'
                            ? t.monthlyMaintenance
                            : log.visitType === 'fault'
                            ? t.faultBreakdown
                            : t.emergencyIssue}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {log.date} · {log.time}
                        </span>
                      </div>

                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          log.status === 'passed'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : log.status === 'attention_needed'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {log.status === 'passed' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{language === 'tr' ? 'Geçti / Kusursuz' : 'Passed'}</span>
                          </>
                        ) : log.status === 'attention_needed' ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{language === 'tr' ? 'Müdahale Gerekli' : 'Attention'}</span>
                          </>
                        ) : (
                          <>
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>{language === 'tr' ? 'Kritik Durma' : 'Critical'}</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">{t.attendingTechnicians}: </span>
                        <strong>{log.attendingTechnicians ? log.attendingTechnicians.join(', ') : log.technicianName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500">{t.partsReplacedTitle}: </span>
                        <span>{log.partsReplaced || (language === 'tr' ? 'Yok' : 'None')}</span>
                      </div>
                    </div>

                    {log.notes && (
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Elevator Specs & Spare Parts (Requested in Screenshot 1) */}
        {activeModalTab === 'specs_parts' && (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span>{t.elevatorSpecsAndParts}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'tr'
                    ? 'Bu binaya ait cer makinesi, askı donanımı, kumanda panosu, çelik halatlar ve yedek parçalar.'
                    : 'Machine drive, suspension ratio, control panel, wire ropes, and spare parts for this site.'}
                </p>
              </div>

              {specsSavedFeedback && (
                <div className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-700 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.specsSavedToast}</span>
                </div>
              )}
            </div>

            {/* Technical Parameters Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t.machineTypeLabel}</span>
                </label>
                <input
                  type="text"
                  value={machineType}
                  onChange={(e) => setMachineType(e.target.value)}
                  placeholder={t.machineTypePlaceholder}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.suspensionRatioLabel}</span>
                </label>
                <select
                  value={suspensionRatio}
                  onChange={(e) => setSuspensionRatio(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium"
                >
                  <option value="1:1">1:1 Direct Suspension (Direkt Askı)</option>
                  <option value="2:1">2:1 Roped (Palangalı / Kasnaklı)</option>
                  <option value="4:1">4:1 Heavy Duty Freight (Ağır Yük)</option>
                  <option value="Hydraulic 1:2">Hydraulic 1:2 (Hidrolik Dolaylı)</option>
                  <option value="Hydraulic Direct">Hydraulic Direct (Hidrolik Direkt)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t.controlPanelLabel}</span>
                </label>
                <input
                  type="text"
                  value={controlPanel}
                  onChange={(e) => setControlPanel(e.target.value)}
                  placeholder={t.controlPanelPlaceholder}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t.doorOperatorLabel}</span>
                </label>
                <input
                  type="text"
                  value={doorOperator}
                  onChange={(e) => setDoorOperator(e.target.value)}
                  placeholder={t.doorOperatorPlaceholder}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Cable className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t.wireRopeSpecsLabel}</span>
                </label>
                <input
                  type="text"
                  value={wireRopeSpecs}
                  onChange={(e) => setWireRopeSpecs(e.target.value)}
                  placeholder={t.wireRopeSpecsPlaceholder}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium"
                />
              </div>
            </div>

            {/* DYNAMIC 2-COLUMN SPARE PARTS & WIRES TABLE (Requested feature) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500" />
                    <span>{t.sparePartsListTitle}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'tr'
                      ? 'Parça adı ve adet/metre miktarını girin. Yeni satır eklemek için "+" butonuna basın.'
                      : 'Enter part description and quantity. Click "+" to add more rows.'}
                  </p>
                </div>

                {/* + Button to add more dynamic rows */}
                <button
                  type="button"
                  onClick={handleAddSparePartRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addPartRowBtn}</span>
                </button>
              </div>

              {spareParts.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs">
                  <Wrench className="w-6 h-6 mx-auto text-slate-400 mb-1.5" />
                  <p>{t.noPartsRegistered}</p>
                </div>
              ) : (
                <div className="space-y-2 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-2.5 sm:p-3 bg-slate-50/60 dark:bg-slate-800/40">
                  {/* Column Header Titles */}
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 pb-1">
                    <div className="col-span-7 sm:col-span-8">{t.partNameCol}</div>
                    <div className="col-span-4 sm:col-span-3">{t.quantityCol}</div>
                    <div className="col-span-1 text-center"></div>
                  </div>

                  {/* 2-Column Rows */}
                  {spareParts.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs"
                    >
                      {/* Column 1: Part / Wire Name */}
                      <div className="col-span-7 sm:col-span-8">
                        <input
                          type="text"
                          value={item.partName}
                          onChange={(e) => handleUpdateSparePartRow(item.id, 'partName', e.target.value)}
                          placeholder={t.partNamePlaceholder}
                          className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-white focus:border-blue-500 outline-hidden font-medium"
                        />
                      </div>

                      {/* Column 2: Quantity / Length */}
                      <div className="col-span-4 sm:col-span-3">
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => handleUpdateSparePartRow(item.id, 'quantity', e.target.value)}
                          placeholder={t.quantityPlaceholder}
                          className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-white focus:border-blue-500 outline-hidden font-mono font-semibold"
                        />
                      </div>

                      {/* Delete Row Button */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSparePartRow(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Save Specs & Parts Action */}
              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSpecsAndParts}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.saveTechnicalSpecs}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer (Dynamic according to active tab) */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSafeClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {t.closeBtn}
          </button>

          {activeModalTab === 'new_log' ? (
            <button
              type="button"
              onClick={handleCompleteVisit}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.submitInspectionBtn}</span>
            </button>
          ) : activeModalTab === 'specs_parts' ? (
            <button
              type="button"
              onClick={handleSaveSpecsAndParts}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t.saveTechnicalSpecs}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveModalTab('new_log')}
              className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
            >
              + {t.addVisitLogTab}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
