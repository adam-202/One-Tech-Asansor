import React, { useState, useMemo } from 'react';
import { RouteStop, BuildingSite } from '../types';
import { buildGoogleMapsRouteUrl } from '../utils/geo';
import { geoMercator, geoPath, geoGraticule } from 'd3-geo';
import type { Feature, LineString, Polygon, FeatureCollection } from 'geojson';
import {
  ZoomIn,
  ZoomOut,
  Navigation,
  Crosshair,
  User,
  Search,
  ExternalLink,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Grid,
} from 'lucide-react';

interface RouteMapCanvasProps {
  stops: RouteStop[];
  activeStopIndex: number;
  onSelectStopIndex: (index: number) => void;
  onOpenInspect: (site: BuildingSite) => void;
  allSitesInCluster?: BuildingSite[];
  technicianName?: string;
  onAddSiteToRoute?: (site: BuildingSite) => void;
}

// Simulated real-world geographical river waterway (Hudson & East River coordinate paths)
const HUDSON_RIVER_GEOJSON: Feature<Polygon> = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [-74.035, 40.690],
        [-74.020, 40.710],
        [-74.015, 40.730],
        [-74.010, 40.750],
        [-74.000, 40.775],
        [-73.985, 40.795],
        [-74.015, 40.795],
        [-74.030, 40.760],
        [-74.040, 40.725],
        [-74.045, 40.690],
        [-74.035, 40.690],
      ],
    ],
  },
  properties: { name: 'Hudson River' },
};

const EAST_RIVER_GEOJSON: Feature<LineString> = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [-74.010, 40.700],
      [-73.990, 40.710],
      [-73.970, 40.730],
      [-73.960, 40.755],
      [-73.945, 40.775],
      [-73.935, 40.800],
    ],
  },
  properties: { name: 'East River' },
};

export const RouteMapCanvas: React.FC<RouteMapCanvasProps> = ({
  stops,
  activeStopIndex,
  onSelectStopIndex,
  onOpenInspect,
  allSitesInCluster = [],
  technicianName,
  onAddSiteToRoute,
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'blueprint'>('roadmap');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredStop, setHoveredStop] = useState<RouteStop | null>(null);
  const [hoveredSite, setHoveredSite] = useState<BuildingSite | null>(null);
  const [searchMapText, setSearchMapText] = useState<string>('');
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showAllClusterSites, setShowAllClusterSites] = useState<boolean>(true);

  const width = 880;
  const height = 520;
  const padding = 70;

  // Aggregate all point coordinates for fitting the D3 projection bounding box
  const allPoints = useMemo(() => {
    const list: BuildingSite[] = [];
    if (stops.length > 0) {
      stops.forEach((s) => list.push(s.site));
    }
    allSitesInCluster.forEach((site) => {
      if (!list.some((existing) => existing.id === site.id)) {
        list.push(site);
      }
    });
    return list;
  }, [stops, allSitesInCluster]);

  // Construct standard GeoJSON FeatureCollection of all site points
  const pointsFeatureCollection = useMemo<FeatureCollection>(() => {
    if (allPoints.length === 0) {
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
            properties: {},
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-73.970, 40.760] },
            properties: {},
          },
        ],
      };
    }

    return {
      type: 'FeatureCollection',
      features: allPoints.map((site) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [site.longitude, site.latitude], // standard GeoJSON [lng, lat]
        },
        properties: {
          id: site.id,
          name: site.name,
        },
      })),
    };
  }, [allPoints]);

  // Configure D3 Geo Mercator Projection
  const { projection, pathGenerator, centerCoords, projectionScale } = useMemo(() => {
    const proj = geoMercator();

    // Fit the geographic extent of our elevator sites to the SVG canvas
    proj.fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding],
      ],
      pointsFeatureCollection
    );

    const baseScale = proj.scale();
    const baseTranslate = proj.translate();

    // Apply interactive zoom & pan transforms to the D3 projection
    proj
      .scale(baseScale * zoomLevel)
      .translate([baseTranslate[0] + panOffset.x, baseTranslate[1] + panOffset.y]);

    const generator = geoPath().projection(proj);
    const center = proj.invert ? proj.invert([width / 2, height / 2]) : [-74.006, 40.73];

    return {
      projection: proj,
      pathGenerator: generator,
      centerCoords: center || [-74.006, 40.73],
      projectionScale: Math.round(proj.scale()),
    };
  }, [pointsFeatureCollection, width, height, padding, zoomLevel, panOffset]);

  // Generate D3 projected path for the suggested optimized route
  const d3RoutePath = useMemo(() => {
    if (stops.length < 2) return '';
    const lineFeature: Feature<LineString> = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: stops.map((s) => [s.site.longitude, s.site.latitude]),
      },
      properties: {},
    };
    return pathGenerator(lineFeature) || '';
  }, [stops, pathGenerator]);

  // D3 GeoGraticule grid (meridians and parallels)
  const graticulePath = useMemo(() => {
    if (!showGraticule) return '';
    const graticule = geoGraticule().step([0.015, 0.015]);
    return pathGenerator(graticule()) || '';
  }, [showGraticule, pathGenerator]);

  // D3 Waterways projected paths
  const riverPolygonPath = useMemo(() => {
    return pathGenerator(HUDSON_RIVER_GEOJSON) || '';
  }, [pathGenerator]);

  const eastRiverPath = useMemo(() => {
    return pathGenerator(EAST_RIVER_GEOJSON) || '';
  }, [pathGenerator]);

  // Filter sites for search query if entered
  const searchFilter = searchMapText.toLowerCase().trim();

  const totalDistanceKm = useMemo(() => {
    return stops.reduce((acc, s) => acc + s.distanceFromPrevKm, 0);
  }, [stops]);

  const totalEstMinutes = useMemo(() => {
    return stops.reduce((acc, s) => acc + s.estimatedTravelMin, 0);
  }, [stops]);

  const googleMapsUrl = useMemo(() => {
    return buildGoogleMapsRouteUrl(stops);
  }, [stops]);

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const selectedStop = stops[activeStopIndex] || stops[0];

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-300 shadow-md select-none bg-[#EAE8E4]">
      {/* 1. Top Bar: Search + D3 Projection Status HUD */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 max-w-sm sm:max-w-xl w-full pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/90 flex items-center px-3 py-2 w-full text-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
          <input
            type="text"
            value={searchMapText}
            onChange={(e) => setSearchMapText(e.target.value)}
            placeholder="Search site, address or elevator unit on map..."
            className="w-full text-slate-800 placeholder-slate-400 outline-hidden bg-transparent font-medium"
          />
          {searchMapText && (
            <button
              onClick={() => setSearchMapText('')}
              className="text-slate-400 hover:text-slate-600 text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 mr-2 font-mono"
            >
              CLEAR
            </button>
          )}
          <div className="h-4 w-px bg-slate-200 mx-1.5" />
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 font-semibold"
            title="Open turn-by-turn directions in Google Maps"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Navigate</span>
          </a>
        </div>
      </div>

      {/* 2. Top-Right Map Mode & Layer Switchers */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto">
        {/* Graticule toggle */}
        <button
          onClick={() => setShowGraticule(!showGraticule)}
          className={`p-2 rounded-lg shadow-md border text-xs font-semibold transition-colors flex items-center gap-1 ${
            showGraticule
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Toggle D3 Geographic Graticule Coordinates Grid"
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">D3 Grid</span>
        </button>

        {/* Cluster unassigned sites toggle */}
        <button
          onClick={() => setShowAllClusterSites(!showAllClusterSites)}
          className={`p-2 rounded-lg shadow-md border text-xs font-semibold transition-colors flex items-center gap-1 ${
            showAllClusterSites
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Show all assigned sites in this territory"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">All Sites</span>
        </button>

        {/* Map Type Toggle */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden flex items-center p-0.5 text-xs font-semibold">
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              mapType === 'roadmap' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Street
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              mapType === 'satellite' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setMapType('blueprint')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              mapType === 'blueprint' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Blueprint
          </button>
        </div>
      </div>

      {/* 3. D3 Geographic Projection SVG Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <defs>
          {/* Street grid background pattern */}
          <pattern id="d3MapGrid" width="48" height="48" patternUnits="userSpaceOnUse">
            <rect
              width="48"
              height="48"
              fill={
                mapType === 'satellite'
                  ? '#0f172a'
                  : mapType === 'blueprint'
                  ? '#0a192f'
                  : '#f4f3ef'
              }
            />
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke={
                mapType === 'satellite'
                  ? 'rgba(255,255,255,0.06)'
                  : mapType === 'blueprint'
                  ? 'rgba(56,189,248,0.12)'
                  : '#e5e3de'
              }
              strokeWidth="1"
            />
          </pattern>

          {/* Waterway linear gradients */}
          <linearGradient id="d3Water" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor={
                mapType === 'satellite'
                  ? '#091e3a'
                  : mapType === 'blueprint'
                  ? '#0f2942'
                  : '#b9dcf7'
              }
            />
            <stop
              offset="100%"
              stopColor={
                mapType === 'satellite'
                  ? '#030712'
                  : mapType === 'blueprint'
                  ? '#071527'
                  : '#9ccaf0'
              }
            />
          </linearGradient>

          {/* Drop shadow for waypoint teardrop markers */}
          <filter id="d3PinShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodOpacity="0.3" />
          </filter>

          {/* Route path glow filter */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Base Map Background */}
        <rect width={width} height={height} fill="url(#d3MapGrid)" />

        {/* D3 Projected GeoGraticule Coordinate Lines */}
        {graticulePath && (
          <path
            d={graticulePath}
            fill="none"
            stroke={
              mapType === 'satellite'
                ? 'rgba(255,255,255,0.1)'
                : mapType === 'blueprint'
                ? 'rgba(56,189,248,0.18)'
                : 'rgba(100,116,139,0.16)'
            }
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />
        )}

        {/* D3 Projected Hudson River Polygon */}
        {riverPolygonPath && (
          <path
            d={riverPolygonPath}
            fill="url(#d3Water)"
            stroke={
              mapType === 'satellite'
                ? '#1e293b'
                : mapType === 'blueprint'
                ? '#38bdf8'
                : '#7bb7e8'
            }
            strokeWidth="1.5"
            opacity={0.85}
          />
        )}

        {/* D3 Projected East River Channel Line */}
        {eastRiverPath && (
          <path
            d={eastRiverPath}
            fill="none"
            stroke="url(#d3Water)"
            strokeWidth="28"
            strokeLinecap="round"
            opacity={0.8}
          />
        )}

        {/* Suggested Optimized Route Path (Rendered via D3 GeoPath from GeoJSON LineString) */}
        {d3RoutePath && (
          <g filter="url(#routeGlow)">
            {/* Outer casing */}
            <path
              d={d3RoutePath}
              fill="none"
              stroke={mapType === 'blueprint' ? '#0284c7' : '#174ea6'}
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
            {/* Inner vibrant route line */}
            <path
              d={d3RoutePath}
              fill="none"
              stroke={mapType === 'blueprint' ? '#38bdf8' : '#2563eb'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Animated dash line to show visitation sequence direction */}
            <path
              d={d3RoutePath}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeDasharray="6 14"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="40"
                to="0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        )}

        {/* Unqueued Sites in Current Cluster (D3 Projected Points) */}
        {showAllClusterSites &&
          allSitesInCluster.map((site) => {
            const isStop = stops.some((s) => s.site.id === site.id);
            if (isStop) return null;

            const projected = projection([site.longitude, site.latitude]);
            if (!projected) return null;
            const [x, y] = projected;

            const isVisited = Boolean(site.lastVisit);
            const isCritical = site.lastVisit?.status === 'critical' || site.priority === 'fault_alert';
            const matchesSearch = searchFilter ? site.name.toLowerCase().includes(searchFilter) || site.address.toLowerCase().includes(searchFilter) : true;

            return (
              <g
                key={site.id}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => {
                  if (onAddSiteToRoute && !isVisited) {
                    onAddSiteToRoute(site);
                  } else {
                    onOpenInspect(site);
                  }
                }}
                onMouseEnter={() => setHoveredSite(site)}
                onMouseLeave={() => setHoveredSite(null)}
                opacity={matchesSearch ? 1 : 0.25}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isCritical ? '6' : '4.5'}
                  fill={
                    isCritical
                      ? '#ef4444'
                      : isVisited
                      ? '#10b981'
                      : site.category === 'public'
                      ? '#f59e0b'
                      : '#64748b'
                  }
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  filter="url(#d3PinShadow)"
                />
                {isCritical && (
                  <circle
                    cx={x}
                    cy={y}
                    r="10"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                  >
                    <animate
                      attributeName="r"
                      values="6;14;6"
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            );
          })}

        {/* Suggested Route Waypoints (Numbered D3 Projected Markers) */}
        {stops.map((stop, index) => {
          const projected = projection([stop.site.longitude, stop.site.latitude]);
          if (!projected) return null;
          const [x, y] = projected;

          const isSelected = index === activeStopIndex;
          const isVisited = Boolean(stop.site.lastVisit);
          const isCritical = stop.site.lastVisit?.status === 'critical' || stop.site.priority === 'fault_alert';

          const pinColor = isSelected
            ? '#2563eb'
            : isCritical
            ? '#dc2626'
            : isVisited
            ? '#16a34a'
            : '#ea580c';

          return (
            <g
              key={stop.site.id}
              className="cursor-pointer transition-transform"
              onClick={() => {
                onSelectStopIndex(index);
                onOpenInspect(stop.site);
              }}
              onMouseEnter={() => setHoveredStop(stop)}
              onMouseLeave={() => setHoveredStop(null)}
              filter="url(#d3PinShadow)"
            >
              {/* Selected Target Stop Ring Pulse */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeOpacity="0.8"
                >
                  <animate
                    attributeName="r"
                    values="14;28;14"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    values="0.9;0.1;0.9"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Waypoint Teardrop Pin */}
              <path
                d={`M ${x} ${y} 
                    C ${x - 12} ${y - 12}, ${x - 14} ${y - 24}, ${x} ${y - 30} 
                    C ${x + 14} ${y - 24}, ${x + 12} ${y - 12}, ${x} ${y} Z`}
                fill={pinColor}
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* White Center Circle */}
              <circle cx={x} cy={y - 19} r="6.5" fill="#ffffff" />

              {/* Suggested Visitation Sequence Number */}
              <text
                x={x}
                y={y - 16}
                textAnchor="middle"
                fill={pinColor}
                fontSize="9"
                fontWeight="800"
                fontFamily="system-ui, sans-serif"
                pointerEvents="none"
              >
                {stop.stopNumber}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 4. Controls on Bottom-Right */}
      <div className="absolute bottom-5 right-3 z-20 flex flex-col items-center gap-2 pointer-events-auto">
        <button
          onClick={handleResetView}
          className="w-9 h-9 bg-white/95 hover:bg-white text-slate-700 rounded-lg shadow-md border border-slate-200 flex items-center justify-center transition-colors"
          title="Recenter and Fit D3 Projection to Territory"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>

        {/* Google Maps Street View Shortcut */}
        <a
          href={
            selectedStop
              ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedStop.site.latitude},${selectedStop.site.longitude}`
              : 'https://www.google.com/maps'
          }
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-lg shadow-md flex items-center justify-center transition-colors font-bold"
          title="Open Street View at current stop"
        >
          <User className="w-4 h-4" />
        </a>

        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-xs rounded-lg shadow-md border border-slate-200 overflow-hidden flex flex-col">
          <button
            onClick={() => setZoomLevel((z) => Math.min(3, z + 0.3))}
            className="w-9 h-8 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center border-b border-slate-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.3))}
            className="w-9 h-8 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Bottom-Left D3 Geo Projection HUD & Map Legend */}
      <div className="absolute bottom-2.5 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-none text-[10px]">
        <div className="bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-md border border-slate-700/80 flex items-center gap-1.5 font-mono">
          <Compass className="w-3 h-3 text-sky-400" />
          <span>D3 Mercator Projection</span>
          <span className="text-slate-500">|</span>
          <span>Center: [{centerCoords[0].toFixed(3)}°, {centerCoords[1].toFixed(3)}°]</span>
          <span className="text-slate-500">|</span>
          <span>Scale: {projectionScale}</span>
        </div>

        {/* Map Legend */}
        <div className="bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Target #{activeStopIndex + 1}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>Suggested Order</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Visited</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Pending Site</span>
          </div>
        </div>
      </div>

      {/* 6. Itinerary Quick Summary Pill */}
      <div className="absolute top-14 left-3 z-20 pointer-events-auto">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 shadow-md flex items-center gap-3 text-xs hover:border-blue-400 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 group-hover:text-blue-600">
              <span>{stops.length} Suggested Stops</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {totalDistanceKm.toFixed(1)} km · ~{totalEstMinutes} mins driving
            </p>
          </div>
        </a>
      </div>

      {/* 7. Hover InfoWindow for Waypoint Stops */}
      {hoveredStop && (
        <div className="absolute bottom-12 left-3 bg-white/95 backdrop-blur-md border border-slate-300 rounded-xl p-3 shadow-2xl text-xs text-slate-800 max-w-xs pointer-events-none transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-[10px]">
              {hoveredStop.stopNumber}
            </span>
            <span className="font-bold text-slate-900 truncate">{hoveredStop.site.name}</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">{hoveredStop.site.address}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-600 border-t border-slate-100 pt-1 font-mono">
            <span>{hoveredStop.site.elevatorUnits} Lifts</span>
            <span>·</span>
            <span>{hoveredStop.site.floors} Fls</span>
            <span>·</span>
            <span>From prev: {hoveredStop.distanceFromPrevKm} km</span>
            <span>·</span>
            <span
              className={
                hoveredStop.site.lastVisit
                  ? 'text-emerald-600 font-bold'
                  : 'text-amber-600 font-bold'
              }
            >
              {hoveredStop.site.lastVisit ? 'Visited' : 'Pending'}
            </span>
          </div>
        </div>
      )}

      {/* 8. Hover InfoWindow for Unassigned Cluster Sites */}
      {hoveredSite && !hoveredStop && (
        <div className="absolute bottom-12 left-3 bg-white/95 backdrop-blur-md border border-slate-300 rounded-xl p-3 shadow-2xl text-xs text-slate-800 max-w-xs pointer-events-none transition-all">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-900 truncate">{hoveredSite.name}</span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">{hoveredSite.address}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-600 border-t border-slate-100 pt-1 font-mono">
            <span>{hoveredSite.elevatorUnits} Lifts</span>
            <span>·</span>
            <span className={hoveredSite.lastVisit ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
              {hoveredSite.lastVisit ? 'Visited this month' : 'Click to add to route'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
