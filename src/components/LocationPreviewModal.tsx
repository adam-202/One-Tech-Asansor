import React, { useState, useEffect } from 'react';
import { BuildingSite } from '../types';
import {
  getNeighborhoodGeoProfile,
  formatCoordinatesDMS,
  generateStaticMapSvg,
} from '../utils/staticMapHelper';
import { buildSingleSiteMapUrl } from '../utils/geo';
import {
  X,
  MapPin,
  Compass,
  ExternalLink,
  Download,
  Copy,
  Check,
  Building2,
  KeyRound,
  Phone,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface LocationPreviewModalProps {
  site: BuildingSite | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInspect?: (site: BuildingSite) => void;
}

export const LocationPreviewModal: React.FC<LocationPreviewModalProps> = ({
  site,
  isOpen,
  onClose,
  onOpenInspect,
}) => {
  if (!isOpen || !site) return null;

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [mapTheme, setMapTheme] = useState<'blueprint' | 'streets' | 'satellite'>('blueprint');
  const [zoomLevel, setZoomLevel] = useState(1);

  const profile = getNeighborhoodGeoProfile(site.neighborhood);
  const { latDMS, lngDMS } = formatCoordinatesDMS(site.latitude, site.longitude);
  const googleMapsUrl = buildSingleSiteMapUrl(site);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(site.accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLocationBrief = () => {
    const brief = `📍 LOCATION DISPATCH BRIEF:
Building: ${site.name}
Address: ${site.address} (${site.neighborhood})
GPS: ${site.latitude.toFixed(6)}, ${site.longitude.toFixed(6)}
Elevators: ${site.elevatorUnits} Lifts (${site.elevatorBrand})
Floors: ${site.floors}
Access Code: ${site.accessCode}
Manager: ${site.managerName} (${site.managerPhone})
Notes: ${site.notes}
Google Maps: ${googleMapsUrl}`;

    navigator.clipboard.writeText(brief);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const handleDownloadStaticMap = () => {
    const svgContent = generateStaticMapSvg(site);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `static_map_${site.id}_${site.neighborhood.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 cursor-pointer"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] cursor-default">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm shadow-inner"
              style={{ backgroundColor: profile.accentColor, color: '#0f172a' }}
            >
              {site.elevatorUnits}L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                  Location Preview Helper
                </span>
                <span className="text-xs text-slate-400 font-mono">{site.id}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {site.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadStaticMap}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
              title="Download static SVG neighborhood map"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Map</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Top Visual: Interactive Static Map Canvas Container */}
          <div className="relative w-full h-72 sm:h-84 rounded-xl overflow-hidden border border-slate-300 shadow-inner bg-slate-950">
            {/* Map Controls Overlay */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              <div className="bg-slate-900/90 backdrop-blur-md rounded-lg p-0.5 border border-slate-700 flex text-[11px] font-medium text-slate-300">
                <button
                  onClick={() => setMapTheme('blueprint')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    mapTheme === 'blueprint' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'
                  }`}
                >
                  Blueprint
                </button>
                <button
                  onClick={() => setMapTheme('streets')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    mapTheme === 'streets' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'
                  }`}
                >
                  Streets
                </button>
                <button
                  onClick={() => setMapTheme('satellite')}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    mapTheme === 'satellite' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'
                  }`}
                >
                  Satellite
                </button>
              </div>

              <div className="bg-slate-900/90 backdrop-blur-md rounded-lg p-0.5 border border-slate-700 flex text-slate-300">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2, z + 0.25))}
                  className="p-1.5 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                  className="p-1.5 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Static Neighborhood Map SVG Visualization */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <svg
                viewBox="0 0 600 360"
                className="w-full h-full select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="modalBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop
                      offset="0%"
                      stopColor={
                        mapTheme === 'satellite'
                          ? '#020617'
                          : mapTheme === 'streets'
                          ? '#f1f5f9'
                          : profile.themeColor
                      }
                    />
                    <stop
                      offset="100%"
                      stopColor={
                        mapTheme === 'satellite'
                          ? '#0f172a'
                          : mapTheme === 'streets'
                          ? '#e2e8f0'
                          : '#030712'
                      }
                    />
                  </linearGradient>

                  <pattern
                    id="modalStreetGrid"
                    width="36"
                    height="36"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 36 0 L 0 0 0 36"
                      fill="none"
                      stroke={
                        mapTheme === 'streets'
                          ? 'rgba(0,0,0,0.06)'
                          : 'rgba(255,255,255,0.08)'
                      }
                      strokeWidth="1"
                    />
                  </pattern>

                  <filter id="modalPinGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.5" />
                  </filter>
                </defs>

                {/* Base Grid */}
                <rect width="600" height="360" fill="url(#modalBgGrad)" />
                <rect width="600" height="360" fill="url(#modalStreetGrid)" />

                {/* District Avenues */}
                <path
                  d="M 0 150 L 600 150"
                  stroke={mapTheme === 'streets' ? '#cbd5e1' : 'rgba(255,255,255,0.2)'}
                  strokeWidth="18"
                />
                <path
                  d="M 0 150 L 600 150"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />

                <path
                  d="M 300 0 L 300 360"
                  stroke={mapTheme === 'streets' ? '#cbd5e1' : 'rgba(255,255,255,0.2)'}
                  strokeWidth="22"
                />
                <path
                  d="M 300 0 L 300 360"
                  stroke={mapTheme === 'streets' ? '#94a3b8' : '#ffffff'}
                  strokeWidth="1.5"
                  strokeDasharray="8 8"
                />

                {/* Cross Streets */}
                <path
                  d="M 60 360 L 520 0"
                  stroke={mapTheme === 'streets' ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}
                  strokeWidth="12"
                />

                {/* City Blocks Footprints */}
                <rect
                  x="40"
                  y="30"
                  width="200"
                  height="90"
                  rx="6"
                  fill={mapTheme === 'streets' ? '#ffffff' : 'rgba(255,255,255,0.05)'}
                  stroke={mapTheme === 'streets' ? '#cbd5e1' : 'rgba(255,255,255,0.12)'}
                  strokeWidth="1"
                />
                <rect
                  x="360"
                  y="30"
                  width="200"
                  height="90"
                  rx="6"
                  fill={mapTheme === 'streets' ? '#ffffff' : 'rgba(255,255,255,0.05)'}
                  stroke={mapTheme === 'streets' ? '#cbd5e1' : 'rgba(255,255,255,0.12)'}
                  strokeWidth="1"
                />
                <rect
                  x="40"
                  y="190"
                  width="200"
                  height="130"
                  rx="6"
                  fill={mapTheme === 'streets' ? '#ffffff' : 'rgba(255,255,255,0.05)'}
                  stroke={mapTheme === 'streets' ? '#cbd5e1' : 'rgba(255,255,255,0.12)'}
                  strokeWidth="1"
                />
                <rect
                  x="360"
                  y="190"
                  width="200"
                  height="130"
                  rx="6"
                  fill={mapTheme === 'streets' ? '#ffffff' : 'rgba(255,255,255,0.05)'}
                  stroke={mapTheme === 'streets' ? '#cbd5e1' : 'rgba(255,255,255,0.12)'}
                  strokeWidth="1"
                />

                {/* Target Building Footprint */}
                <rect
                  x="245"
                  y="100"
                  width="110"
                  height="95"
                  rx="8"
                  fill={profile.accentColor}
                  fillOpacity="0.25"
                  stroke={profile.accentColor}
                  strokeWidth="2.5"
                  filter="url(#modalPinGlow)"
                />

                {/* Elevator Shaft / Machine Room Core */}
                <rect
                  x="285"
                  y="130"
                  width="30"
                  height="30"
                  rx="4"
                  fill={profile.accentColor}
                />
                <text
                  x="300"
                  y="150"
                  fontFamily="monospace"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#0f172a"
                  textAnchor="middle"
                >
                  {site.elevatorUnits}L
                </text>

                {/* Target Pin Radiating Waves */}
                <circle
                  cx="300"
                  cy="145"
                  r="35"
                  fill="none"
                  stroke={profile.accentColor}
                  strokeWidth="2"
                  strokeOpacity="0.4"
                />
                <circle
                  cx="300"
                  cy="145"
                  r="50"
                  fill="none"
                  stroke={profile.accentColor}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  strokeOpacity="0.3"
                />

                {/* Street Names Overlay */}
                <text
                  x="120"
                  y="144"
                  fontFamily="system-ui, sans-serif"
                  fontSize="10"
                  fontWeight="bold"
                  fill={mapTheme === 'streets' ? '#475569' : '#94a3b8'}
                  letterSpacing="1"
                >
                  {profile.primaryStreet.toUpperCase()}
                </text>
                <text
                  x="315"
                  y="250"
                  fontFamily="system-ui, sans-serif"
                  fontSize="10"
                  fontWeight="bold"
                  fill={mapTheme === 'streets' ? '#475569' : '#94a3b8'}
                  transform="rotate(90 315 250)"
                  letterSpacing="1"
                >
                  {profile.crossAvenue.toUpperCase()}
                </text>

                {/* Entrance & Machine Room Tag */}
                <g transform="translate(365, 125)">
                  <rect
                    width="120"
                    height="24"
                    rx="4"
                    fill="#0f172a"
                    fillOpacity="0.85"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                  />
                  <text
                    x="10"
                    y="16"
                    fontFamily="monospace"
                    fontSize="9"
                    fill="#38bdf8"
                    fontWeight="bold"
                  >
                    ENTRY · CODE {site.accessCode}
                  </text>
                </g>

                {/* Compass Rose */}
                <g transform="translate(560, 40)">
                  <circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="#0f172a"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1.5"
                  />
                  <polygon points="0,-12 3.5,-2 0,0 -3.5,-2" fill="#ef4444" />
                  <polygon points="0,12 3.5,2 0,0 -3.5,2" fill="#94a3b8" />
                  <text
                    x="0"
                    y="-14"
                    fontFamily="system-ui, sans-serif"
                    fontSize="7"
                    fontWeight="bold"
                    fill="#ffffff"
                    textAnchor="middle"
                  >
                    N
                  </text>
                </g>
              </svg>
            </div>

            {/* Bottom HUD Bar */}
            <div className="absolute bottom-2 left-3 z-10 flex items-center gap-2 text-[10px] font-mono text-slate-300 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/60">
              <Compass className="w-3 h-3 text-sky-400" />
              <span>
                GPS: {site.latitude.toFixed(6)}°, {site.longitude.toFixed(6)}°
              </span>
              <span className="text-slate-500">|</span>
              <span>DMS: {latDMS}</span>
            </div>
          </div>

          {/* Grid: Location Data & Elevator Infrastructure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Geolocation & Neighborhood Profile */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Territory & Neighborhood Profile</span>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">District:</span>
                  <span className="font-semibold text-slate-900">{site.neighborhood}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Street Address:</span>
                  <span className="font-semibold text-slate-900 text-right">{site.address}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Coordinates (WGS84):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Main Arterial:</span>
                  <span className="font-medium text-slate-800">{profile.primaryStreet}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">District Landmark:</span>
                  <span className="font-medium text-slate-800">{profile.landmark}</span>
                </div>
              </div>
            </div>

            {/* Right Card: Building Elevator Core & Security Access */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Elevator Hardware & Site Access</span>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Elevator Bank Units:</span>
                  <span className="font-bold font-mono text-slate-900">
                    {site.elevatorUnits} Lifts ({site.elevatorBrand})
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Building Height:</span>
                  <span className="font-semibold text-slate-900">{site.floors} Floors</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Machine Room:</span>
                  <span className="font-medium text-slate-800">
                    {site.floors > 10 ? 'Rooftop Penthouse Room' : 'Basement Level B1'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Security Key Code:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>{site.accessCode}</span>
                    <button
                      onClick={handleCopyCode}
                      className="ml-1 text-slate-400 hover:text-slate-700"
                      title="Copy access code"
                    >
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Building Manager:</span>
                  <a
                    href={`tel:${site.managerPhone}`}
                    className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>
                      {site.managerName} ({site.managerPhone})
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Access Notes Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Technician Field Access Notes: </span>
              <span>{site.notes}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLocationBrief}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              {copiedBrief ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{copiedBrief ? 'Copied Brief!' : 'Copy Location Brief'}</span>
            </button>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close Preview
            </button>
            {onOpenInspect && (
              <button
                onClick={() => {
                  onClose();
                  onOpenInspect(site);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
              >
                Log Visit / Inspect Site
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
