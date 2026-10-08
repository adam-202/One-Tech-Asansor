import React from 'react';
import { BuildingSite } from '../types';
import { getNeighborhoodGeoProfile } from '../utils/staticMapHelper';
import { MapPin, Navigation } from 'lucide-react';

interface SiteMapIconProps {
  site: BuildingSite;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const SiteMapIcon: React.FC<SiteMapIconProps> = ({
  site,
  onClick,
  size = 'md',
  showLabel = false,
}) => {
  const profile = getNeighborhoodGeoProfile(site.neighborhood);

  // Dimensions based on size prop
  const dimensions =
    size === 'sm'
      ? { w: 38, h: 38, pinSize: 12, fontSize: 8 }
      : size === 'lg'
      ? { w: 68, h: 68, pinSize: 18, fontSize: 11 }
      : { w: 50, h: 50, pinSize: 14, fontSize: 9 };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={`Location Preview: ${site.name} (${site.neighborhood}) - Click to inspect static map`}
      className={`group relative select-none rounded-xl overflow-hidden border border-slate-700/60 shadow-xs transition-all ${
        onClick
          ? 'cursor-pointer hover:border-blue-400 hover:shadow-md hover:scale-105 active:scale-95'
          : ''
      }`}
      style={{
        width: dimensions.w,
        height: dimensions.h,
        backgroundColor: profile.themeColor,
      }}
    >
      {/* High-Level Site Map Isometric / Blueprint SVG Icon */}
      <svg
        viewBox="0 0 60 60"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle grid lines */}
        <line x1="15" y1="0" x2="15" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <line x1="45" y1="0" x2="45" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <line x1="0" y1="15" x2="60" y2="15" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <line x1="0" y1="45" x2="60" y2="45" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

        {/* Street Lines */}
        <line x1="0" y1="28" x2="60" y2="28" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
        <line x1="30" y1="0" x2="30" y2="60" stroke="rgba(255,255,255,0.22)" strokeWidth="5" />
        <line x1="0" y1="28" x2="60" y2="28" stroke="#fbbf24" strokeWidth="0.8" strokeDasharray="2 2" />

        {/* Diagonal Transit / Alley Line */}
        <line x1="45" y1="0" x2="60" y2="28" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />

        {/* Adjacent Block Outlines */}
        <rect x="4" y="6" width="20" height="16" rx="2" fill="rgba(255,255,255,0.06)" />
        <rect x="36" y="6" width="18" height="16" rx="2" fill="rgba(255,255,255,0.06)" />
        <rect x="4" y="36" width="20" height="18" rx="2" fill="rgba(255,255,255,0.06)" />
        <rect x="36" y="36" width="18" height="18" rx="2" fill="rgba(255,255,255,0.06)" />

        {/* Building Footprint with Accent Glow */}
        <rect
          x="20"
          y="18"
          width="20"
          height="20"
          rx="4"
          fill={profile.accentColor}
          fillOpacity="0.25"
          stroke={profile.accentColor}
          strokeWidth="1.5"
        />

        {/* Elevator Core Marker with Unit Count */}
        <rect
          x="24"
          y="22"
          width="12"
          height="12"
          rx="2"
          fill={profile.accentColor}
        />
        <text
          x="30"
          y="31"
          fontSize="7.5"
          fontFamily="monospace"
          fontWeight="bold"
          fill="#0f172a"
          textAnchor="middle"
        >
          {site.elevatorUnits}L
        </text>

        {/* Outer Geolocation Pulse Ring on Hover */}
        <circle
          cx="30"
          cy="28"
          r="16"
          fill="none"
          stroke={profile.accentColor}
          strokeWidth="1"
          strokeOpacity="0.5"
          className="group-hover:animate-ping opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </svg>

      {/* Floating GPS beacon corner pill */}
      <div
        className="absolute bottom-0 right-0 w-3 h-3 rounded-tl-md flex items-center justify-center text-[7px] font-mono font-bold"
        style={{ backgroundColor: profile.accentColor, color: '#0f172a' }}
        title={`${site.elevatorUnits} Lifts`}
      >
        <span className="scale-75">•</span>
      </div>

      {showLabel && (
        <span className="sr-only">Location preview for {site.name}</span>
      )}
    </div>
  );
};
