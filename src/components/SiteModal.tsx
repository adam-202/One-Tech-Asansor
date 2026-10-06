import React, { useState, useEffect } from 'react';
import { BuildingSite, SiteCategory } from '../types';
import { TECHNICIANS } from '../data/seedSites';
import {
  X,
  Building2,
  MapPin,
  KeyRound,
  Phone,
  UserCheck,
  Layers,
  Hash,
  Globe,
  Compass,
  Users,
} from 'lucide-react';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteToEdit: BuildingSite | null;
  onSaveSite: (site: BuildingSite) => void;
  currentTechnicianEmail: string;
}

const NEIGHBORHOODS = [
  'Downtown Financial Hub',
  'Midtown Commercial Corridor',
  'West End Medical Center',
  'Riverside Residential District',
  'North Tech & Creative Campus',
  'Harbor Gateway Towers',
  'University & Research Quarter',
  'Eastside Residential Complex',
];

const ELEVATOR_BRANDS = [
  'Otis SkyRise Gen2',
  'Schindler 5500 MRL',
  'KONE MonoSpace 700',
  'Thyssenkrupp Synergy 300',
  'Mitsubishi Electric Diamond Trac',
  'Fujitec Zexia Traction',
];

export const SiteModal: React.FC<SiteModalProps> = ({
  isOpen,
  onClose,
  siteToEdit,
  onSaveSite,
  currentTechnicianEmail,
}) => {
  const isEditing = Boolean(siteToEdit);

  const [name, setName] = useState(siteToEdit?.name || '');
  const [address, setAddress] = useState(siteToEdit?.address || '');
  const [neighborhood, setNeighborhood] = useState(siteToEdit?.neighborhood || NEIGHBORHOODS[0]);
  const [category, setCategory] = useState<SiteCategory>(siteToEdit?.category || 'private');
  const [latitude, setLatitude] = useState(siteToEdit?.latitude || 40.7128);
  const [longitude, setLongitude] = useState(siteToEdit?.longitude || -74.006);
  const [floors, setFloors] = useState(siteToEdit?.floors || 12);
  const [elevatorUnits, setElevatorUnits] = useState(siteToEdit?.elevatorUnits || 3);
  const [elevatorNumbers, setElevatorNumbers] = useState(siteToEdit?.elevatorNumbers || 'L1 (Pass), L2 (Pass), L3 (Service)');
  const [elevatorBrand, setElevatorBrand] = useState(siteToEdit?.elevatorBrand || ELEVATOR_BRANDS[0]);
  const [assignedEmail, setAssignedEmail] = useState(
    siteToEdit?.assignedTechnicianEmail || currentTechnicianEmail
  );
  const [managerName, setManagerName] = useState(siteToEdit?.managerName || '');
  const [managerPhone, setManagerPhone] = useState(siteToEdit?.managerPhone || '');
  const [accessCode, setAccessCode] = useState(siteToEdit?.accessCode || '#2401*');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(siteToEdit?.googleMapsUrl || '');
  const [notes, setNotes] = useState(siteToEdit?.notes || '');

  useEffect(() => {
    if (siteToEdit) {
      setName(siteToEdit.name);
      setAddress(siteToEdit.address);
      setNeighborhood(siteToEdit.neighborhood);
      setCategory(siteToEdit.category || 'private');
      setLatitude(siteToEdit.latitude);
      setLongitude(siteToEdit.longitude);
      setFloors(siteToEdit.floors);
      setElevatorUnits(siteToEdit.elevatorUnits);
      setElevatorNumbers(siteToEdit.elevatorNumbers || `L1-L${siteToEdit.elevatorUnits}`);
      setElevatorBrand(siteToEdit.elevatorBrand);
      setAssignedEmail(siteToEdit.assignedTechnicianEmail);
      setManagerName(siteToEdit.managerName);
      setManagerPhone(siteToEdit.managerPhone);
      setAccessCode(siteToEdit.accessCode);
      setGoogleMapsUrl(siteToEdit.googleMapsUrl || '');
      setNotes(siteToEdit.notes);
    } else {
      setName('');
      setAddress('');
      setNeighborhood(NEIGHBORHOODS[0]);
      setCategory('private');
      setLatitude(40.7128 + (Math.random() - 0.5) * 0.01);
      setLongitude(-74.006 + (Math.random() - 0.5) * 0.01);
      setFloors(10);
      setElevatorUnits(3);
      setElevatorNumbers('L1 (Pass), L2 (Pass), L3 (Service)');
      setElevatorBrand(ELEVATOR_BRANDS[0]);
      setAssignedEmail(currentTechnicianEmail);
      setManagerName('');
      setManagerPhone('');
      setAccessCode('#' + Math.floor(1000 + Math.random() * 9000) + '*');
      setGoogleMapsUrl('');
      setNotes('Rooftop machine room key available with security guard.');
    }
  }, [siteToEdit, currentTechnicianEmail]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    const gUrl =
      googleMapsUrl.trim() ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name.trim()}, ${address.trim()}`)}`;

    const savedSite: BuildingSite = {
      id: siteToEdit?.id || `site-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      address: address.trim(),
      neighborhood,
      category,
      latitude: Number(latitude) || 40.7128,
      longitude: Number(longitude) || -74.006,
      floors: Number(floors) || 1,
      elevatorUnits: Number(elevatorUnits) || 1,
      elevatorNumbers: elevatorNumbers.trim() || `L1-L${elevatorUnits}`,
      elevatorBrand,
      assignedTechnicianEmail: category === 'public' ? 'shared@elevatortech.io' : assignedEmail,
      managerName: managerName.trim() || 'Building Super',
      managerPhone: managerPhone.trim() || '+1 (555) 000-0000',
      accessCode: accessCode.trim() || '#1234*',
      googleMapsUrl: gUrl,
      notes: notes.trim(),
      priority: siteToEdit?.priority || 'normal',
      lastVisit: siteToEdit?.lastVisit,
      visitHistory: siteToEdit?.visitHistory,
    };

    onSaveSite(savedSite);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {isEditing ? `Edit Building: ${siteToEdit?.name}` : 'Register New Building Site'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* 2 Category Selection: Private vs Public Shared Pool */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Site Allocation Category *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('private')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    category === 'private'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Private (Assigned by Email)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('public')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    category === 'public'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>Public / Shared Pool (All 20 Techs)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {category === 'private'
                  ? 'Assigned to a specific technician for routine monthly schedule.'
                  : 'Open shared emergency/fault pool: any colleague or multi-tech team can attend.'}
              </p>
            </div>

            {/* Building Name & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Building / Property Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sovereign Commerce Center"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder-slate-400 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 350 Broadway, New York, NY"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder-slate-400 outline-hidden"
                />
              </div>
            </div>

            {/* Neighborhood Cluster & Assigned Technician */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Geographic District
                </label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden bg-white"
                >
                  {NEIGHBORHOODS.map((nh) => (
                    <option key={nh} value={nh}>
                      {nh}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {category === 'private' ? 'Assigned Maintenance Technician' : 'Public Pool Status'}
                </label>
                {category === 'private' ? (
                  <select
                    value={assignedEmail}
                    onChange={(e) => setAssignedEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden bg-white"
                  >
                    {TECHNICIANS.map((tech) => (
                      <option key={tech.id} value={tech.email}>
                        {tech.name} ({tech.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                    Open to all 20 Field Technicians
                  </div>
                )}
              </div>
            </div>

            {/* Equipment Fleet & Brand */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Elevator Units
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={elevatorUnits}
                  onChange={(e) => setElevatorUnits(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Floor Count
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={floors}
                  onChange={(e) => setFloors(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  System Brand
                </label>
                <select
                  value={elevatorBrand}
                  onChange={(e) => setElevatorBrand(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 outline-hidden bg-white"
                >
                  {ELEVATOR_BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Elevator Unit Identifiers */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Elevator Numbers / Lift IDs (e.g. L1, L2, Service)</span>
              </label>
              <input
                type="text"
                value={elevatorNumbers}
                onChange={(e) => setElevatorNumbers(e.target.value)}
                placeholder="e.g. L1 (Passenger), L2 (Passenger), L3 (Freight/Service)"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 outline-hidden text-slate-900"
              />
            </div>

            {/* Building Super Contact & Key Access Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Super / Manager Name
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="e.g. Robert Vance"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder-slate-400 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Manager Contact Phone
                </label>
                <input
                  type="text"
                  value={managerPhone}
                  onChange={(e) => setManagerPhone(e.target.value)}
                  placeholder="+1 (555) 782-1144"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder-slate-400 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Key Box / Door Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="#4891*"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder-slate-400 outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Geolocation Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>GPS Latitude (WGS84)</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 outline-hidden font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>GPS Longitude (WGS84)</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 outline-hidden font-mono text-slate-900"
                />
              </div>
            </div>

            {/* Google Maps Location Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Maps Location Link (or auto-generated)</span>
              </label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 outline-hidden text-slate-900 font-mono"
              />
            </div>

            {/* Special Instructions & Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Access Notes & Special Instructions
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Machine room access through roof bulkhead. Bring elevator fire service key FEO-K1."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder-slate-400 outline-hidden"
              />
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-md shadow-blue-600/20 transition-all"
            >
              {isEditing ? 'Save Changes' : 'Register Building'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
