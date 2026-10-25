import React, { useState, useEffect } from 'react';
import { BuildingSite, SiteCategory, Technician, SparePartItem } from '../types';
import {
  X,
  Building2,
  MapPin,
  KeyRound,
  Phone,
  Layers,
  Sparkles,
  Compass,
  Save,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Wrench,
  Cable,
  Cpu,
  ChevronLeft,
} from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteToEdit?: BuildingSite | null;
  onSaveSite: (site: BuildingSite) => void;
  currentTechnicianEmail: string;
  technicians?: Technician[];
  language?: Language;
}

const ELEVATOR_BRANDS = [
  'KONE',
  'Otis',
  'Schindler',
  'Thyssenkrupp',
  'Mitsubishi',
  'Fujitec',
];

const ISTANBUL_DISTRICTS = [
  'Kadıköy & Moda',
  'Kadıköy Sahil',
  'Bağdat Caddesi & Erenköy',
  'Bağdat Caddesi & Suadiye',
  'Ataşehir & Kozyatağı',
  'Göktürk & Eyüpsultan',
  'Ümraniye & Çekmeköy',
  'Şişli & Teşvikiye',
  'Başakşehir & İkitelli',
  'Gaziosmanpaşa & Eyüp',
  'Zeytinburnu & Bakırköy',
];

export const SiteModal: React.FC<SiteModalProps> = ({
  isOpen,
  onClose,
  siteToEdit,
  onSaveSite,
  currentTechnicianEmail,
  technicians = [],
  language = 'tr',
}) => {
  const t = translations[language];

  // Core Site Details
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState(ISTANBUL_DISTRICTS[0]);
  const [category, setCategory] = useState<SiteCategory>('private');
  const [floors, setFloors] = useState<number>(8);
  const [elevatorUnits, setElevatorUnits] = useState<number>(2);
  const [elevatorBrand, setElevatorBrand] = useState(ELEVATOR_BRANDS[0]);
  const [assignedEmail, setAssignedEmail] = useState(currentTechnicianEmail);
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Technical Specs & Wires / Spare Parts
  const [machineType, setMachineType] = useState('');
  const [suspensionRatio, setSuspensionRatio] = useState('2:1');
  const [wireRopeSpecs, setWireRopeSpecs] = useState('');
  const [controlPanel, setControlPanel] = useState('');
  const [doorOperator, setDoorOperator] = useState('');
  const [spareParts, setSpareParts] = useState<SparePartItem[]>([]);

  // Mobile Swipe-Back: Push state so back gesture closes modal instead of app
  useEffect(() => {
    if (!isOpen) return;
    const stateObj = { modal: 'site_modal', timestamp: Date.now() };
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

  // Touch Gesture: Swipe Right on Mobile to Dismiss
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      if (touchEndX - touchStartX > 80 && touchStartX < 70) {
        handleSafeClose();
      }
    }
    setTouchStartX(null);
  };

  const handleSafeClose = () => {
    if (window.history.state?.modal === 'site_modal') {
      window.history.back();
    } else {
      onClose();
    }
  };

  useEffect(() => {
    if (siteToEdit) {
      setName(siteToEdit.name);
      setAddress(siteToEdit.address);
      setNeighborhood(siteToEdit.neighborhood);
      setCategory(siteToEdit.category);
      setFloors(siteToEdit.floors ?? 6);
      setElevatorUnits(siteToEdit.elevatorUnits ?? 1);
      setElevatorBrand(siteToEdit.elevatorBrand);
      setAssignedEmail(siteToEdit.assignedTechnicianEmail);
      setManagerName(siteToEdit.managerName || '');
      setManagerPhone(siteToEdit.managerPhone || '');
      setAccessCode(siteToEdit.accessCode || '');
      setGoogleMapsUrl(siteToEdit.googleMapsUrl || '');
      setNotes(siteToEdit.notes || '');

      setMachineType(siteToEdit.machineType || '');
      setSuspensionRatio(siteToEdit.suspensionRatio || '2:1');
      setWireRopeSpecs(siteToEdit.wireRopeSpecs || '');
      setControlPanel(siteToEdit.controlPanel || '');
      setDoorOperator(siteToEdit.doorOperator || '');
      setSpareParts(siteToEdit.spareParts || []);
    } else {
      setName('');
      setAddress('');
      setNeighborhood(ISTANBUL_DISTRICTS[0]);
      setCategory('private');
      setFloors(6);
      setElevatorUnits(2);
      setElevatorBrand(ELEVATOR_BRANDS[0]);
      setAssignedEmail(currentTechnicianEmail);
      setManagerName('');
      setManagerPhone('');
      setAccessCode('');
      setGoogleMapsUrl('');
      setNotes('');

      setMachineType(language === 'tr' ? 'Dişlisiz Senkron PM Motor' : 'Gearless Synchronous PM');
      setSuspensionRatio('2:1');
      setWireRopeSpecs(
        language === 'tr'
          ? 'Ø10mm 8x19S-SFC Çelik Halat (5 halat), 24 Damar Seyir Kablosu'
          : 'Ø10mm 8x19S-SFC Steel Wire Rope (5 ropes), 24-core Traveling Cable'
      );
      setControlPanel('Arkel A-Cube / ML65');
      setDoorOperator('VVVF 2 Panelli Merkez Açılır');
      setSpareParts([
        {
          id: `part-${Date.now()}-1`,
          partName: language === 'tr' ? 'Taşıyıcı Çelik Halat Ø10mm' : 'Hoist Steel Wire Rope Ø10mm',
          quantity: '175 m',
        },
        {
          id: `part-${Date.now()}-2`,
          partName: language === 'tr' ? 'Kapı Boy Fotoseli' : 'Full Height Light Curtain Sensor',
          quantity: '1 takım',
        },
      ]);
    }
  }, [siteToEdit, isOpen, currentTechnicianEmail, language]);

  if (!isOpen) return null;

  // Dynamic 2-column list row handlers
  const handleAddSparePartRow = () => {
    const newRow: SparePartItem = {
      id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      partName: '',
      quantity: '',
    };
    setSpareParts((prev) => [...prev, newRow]);
  };

  const handleUpdateSparePartRow = (id: string, field: 'partName' | 'quantity', val: string) => {
    setSpareParts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveSparePartRow = (id: string) => {
    setSpareParts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const baseLat = 40.985;
    const baseLng = 29.030;
    const lat = siteToEdit ? siteToEdit.latitude : baseLat;
    const lng = siteToEdit ? siteToEdit.longitude : baseLng;

    // Filter out empty rows
    const cleanedParts = spareParts.filter((p) => p.partName.trim().length > 0 || p.quantity.trim().length > 0);

    const saved: BuildingSite = {
      id: siteToEdit?.id || `site-tr-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      address: address.trim() || `${name.trim()}, ${neighborhood}, İstanbul`,
      neighborhood,
      category,
      latitude: lat,
      longitude: lng,
      floors: Number(floors) || 5,
      elevatorUnits: Number(elevatorUnits) || 1,
      elevatorBrand,
      assignedTechnicianEmail: category === 'public' ? 'shared@onetechasansor.com' : assignedEmail,
      managerName: managerName.trim(),
      managerPhone: managerPhone.trim(),
      accessCode: accessCode.trim(),
      googleMapsUrl: googleMapsUrl.trim() || (siteToEdit?.googleMapsUrl || `https://www.google.com/maps?q=${lat},${lng}&z=17&hl=en`),
      notes: notes.trim() || (language === 'tr' ? 'Aylık periyodik asansör bakım sözleşmesi.' : 'Monthly periodic maintenance contract.'),
      priority: siteToEdit?.priority || 'normal',
      lastVisit: siteToEdit?.lastVisit,
      visitHistory: siteToEdit?.visitHistory || [],

      // Extended specs & dynamic 2-column parts/wires
      machineType: machineType.trim(),
      suspensionRatio: suspensionRatio.trim(),
      wireRopeSpecs: wireRopeSpecs.trim(),
      controlPanel: controlPanel.trim(),
      doorOperator: doorOperator.trim(),
      spareParts: cleanedParts,
    };

    onSaveSite(saved);
    handleSafeClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSafeClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-fadeIn cursor-pointer"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto cursor-default">
        {/* Mobile Swipe-Down Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2 sm:hidden" />

        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSafeClose}
              className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors sm:hidden"
              title={t.swipeBackTooltip}
            >
              <ChevronLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {siteToEdit ? t.siteModalEditTitle : t.siteModalAddTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {siteToEdit ? siteToEdit.name : 'One Tech Asansör İstanbul'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSafeClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Section 1: Basic Site Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.siteNameLabel} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'tr' ? 'örn. Adel Palace veya Göktürk Ay Tek' : 'e.g. Adel Palace or Göktürk Ay Tek'}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.neighborhoodLabel}
              </label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden"
              >
                {ISTANBUL_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.addressLabel}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={language === 'tr' ? 'Açık adres veya semt detayı...' : 'Street address and district details...'}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden"
            />
          </div>

          {/* Section 2: Elevator Units & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.elevatorBrandLabel}
              </label>
              <select
                value={elevatorBrand}
                onChange={(e) => setElevatorBrand(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-semibold"
              >
                {ELEVATOR_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.elevatorUnitsLabel}
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={elevatorUnits}
                onChange={(e) => setElevatorUnits(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.floorsLabel}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Section 3: Technical Specifications & Machine Drive */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>{language === 'tr' ? 'Asansör Teknik Donanım & Makine Bilgileri' : 'Elevator Technical Hardware & Drive'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.machineTypeLabel}
                </label>
                <input
                  type="text"
                  value={machineType}
                  onChange={(e) => setMachineType(e.target.value)}
                  placeholder={t.machineTypePlaceholder}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.suspensionRatioLabel}
                </label>
                <select
                  value={suspensionRatio}
                  onChange={(e) => setSuspensionRatio(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-hidden"
                >
                  <option value="1:1">1:1 Direct (Direkt Askı)</option>
                  <option value="2:1">2:1 Roped (Palangalı)</option>
                  <option value="4:1">4:1 Heavy Freight (Ağır Yük)</option>
                  <option value="Hydraulic 1:2">Hydraulic 1:2 (Hidrolik)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.controlPanelLabel}
                </label>
                <input
                  type="text"
                  value={controlPanel}
                  onChange={(e) => setControlPanel(e.target.value)}
                  placeholder={t.controlPanelPlaceholder}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.doorOperatorLabel}
                </label>
                <input
                  type="text"
                  value={doorOperator}
                  onChange={(e) => setDoorOperator(e.target.value)}
                  placeholder={t.doorOperatorPlaceholder}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Cable className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t.wireRopeSpecsLabel}</span>
                </label>
                <input
                  type="text"
                  value={wireRopeSpecs}
                  onChange={(e) => setWireRopeSpecs(e.target.value)}
                  placeholder={t.wireRopeSpecsPlaceholder}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: DYNAMIC 2-COLUMN SPARE PARTS & WIRES FEATURE (Requested by User) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/60 border border-blue-200/60 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{t.sparePartsListTitle}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'tr'
                    ? 'Halatlar, kablolar ve yedek parçaları 2 sütun halinde girin. "+" butonuyla yeni satır ekleyebilirsiniz.'
                    : 'Enter wires, ropes, and components in 2 columns. Click "+" to add more rows.'}
                </p>
              </div>

              {/* + Sign to add more dynamic rows manually */}
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
              <div className="p-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs bg-white/60 dark:bg-slate-900/40">
                <p>{t.noPartsRegistered}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                  <div className="col-span-7 sm:col-span-8">{t.partNameCol}</div>
                  <div className="col-span-4 sm:col-span-3">{t.quantityCol}</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                {/* Rows */}
                {spareParts.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    {/* Column 1: Part Name / Specification */}
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
                        title="Delete row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Access Credentials & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'en' ? 'Manager Name (Optional)' : 'Yönetici Adı (Opsiyonel)'}
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder={language === 'en' ? 'Leave empty if unknown' : 'Bilinmiyorsa boş bırakın'}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:border-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'en' ? 'Manager Phone (Optional)' : 'Yönetici Telefonu (Opsiyonel)'}
              </label>
              <input
                type="text"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="+90 (532)..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:border-blue-500 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.doorCodeLabel}
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="**3437, **1803..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:border-blue-500 outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.tableColAssigned}
              </label>
              <select
                value={assignedEmail}
                onChange={(e) => setAssignedEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 outline-hidden"
              >
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.email}>
                    {tech.name} ({tech.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.googleMapsUrlLabel}
              </label>
              <input
                type="text"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:border-blue-500 outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSafeClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{t.saveSiteBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
