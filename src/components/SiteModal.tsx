import React, { useState, useEffect } from 'react';
import { BuildingSite, SiteCategory, Technician } from '../types';
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
  'Otis',
  'Schindler',
  'KONE',
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
  language = 'en',
}) => {
  const t = translations[language];

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
    }
  }, [siteToEdit, isOpen, currentTechnicianEmail]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const baseLat = 40.985;
    const baseLng = 29.030;
    const lat = siteToEdit ? siteToEdit.latitude : baseLat;
    const lng = siteToEdit ? siteToEdit.longitude : baseLng;

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
      notes: notes.trim() || 'Aylık periyodik asansör bakım sözleşmesi.',
      priority: siteToEdit?.priority || 'normal',
      lastVisit: siteToEdit?.lastVisit,
      visitHistory: siteToEdit?.visitHistory || [],
    };

    onSaveSite(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {siteToEdit ? t.siteModalEditTitle : t.siteModalAddTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {siteToEdit ? siteToEdit.name : 'One Tech Asansör İstanbul'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.siteNameLabel} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="örn. Adel Palace veya Göktürk Ay Tek"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.neighborhoodLabel}
              </label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden bg-white"
              >
                {ISTANBUL_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.addressLabel}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Açık adres veya semt detayı..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.elevatorBrandLabel}
              </label>
              <select
                value={elevatorBrand}
                onChange={(e) => setElevatorBrand(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden bg-white"
              >
                {ELEVATOR_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.elevatorUnitsLabel}
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={elevatorUnits}
                onChange={(e) => setElevatorUnits(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.floorsLabel}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Manager Name (Optional)' : 'Yönetici Adı (Opsiyonel)'}
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder={language === 'en' ? 'Leave empty if unknown' : 'Bilinmiyorsa boş bırakın'}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Manager Phone (Optional)' : 'Yönetici Telefonu (Opsiyonel)'}
              </label>
              <input
                type="text"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="+90 (532)..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.doorCodeLabel} (Optional)
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="**3437, **1803..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.tableColAssigned}
            </label>
            <select
              value={assignedEmail}
              onChange={(e) => setAssignedEmail(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden bg-white"
            >
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.email}>
                  {tech.name} ({tech.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.googleMapsUrlLabel}
            </label>
            <input
              type="text"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden font-mono"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95"
            >
              {t.saveSiteBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
