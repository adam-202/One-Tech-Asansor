import React, { useState, useMemo, useRef } from 'react';
import { RouteStop, BuildingSite } from '../types';
import { buildGoogleMapsRouteUrl, calculateDistanceKm } from '../utils/geo';
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature, LineString, FeatureCollection } from 'geojson';
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
  Radio,
  Milestone,
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
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredStop, setHoveredStop] = useState<RouteStop | null>(null);
  const [hoveredSite, setHoveredSite] = useState<BuildingSite | null>(null);
  const [searchMapText, setSearchMapText] = useState<string>('');
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showAllClusterSites, setShowAllClusterSites] = useState<boolean>(true);
  const [showClusterZone, setShowClusterZone] = useState<boolean>(true);
  const [showHopDistances, setShowHopDistances] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
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
            geometry: { type: 'Point', coordinates: [28.9784, 41.0082] },
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
          coordinates: [site.longitude, site.latitude],
        },
        properties: {
          id: site.id,
          name: site.name,
        },
      })),
    };
  }, [allPoints]);

  // Configure D3 Geo Mercator Projection safely
  const { projection, pathGenerator, centerCoords, projectionScale } = useMemo(() => {
    const proj = geoMercator();

    try {
      if (allPoints.length > 1) {
        proj.fitExtent(
          [
            [padding, padding],
            [width - padding, height - padding],
          ],
          pointsFeatureCollection
        );
      } else if (allPoints.length === 1) {
        proj.center([allPoints[0].longitude, allPoints[0].latitude])
            .scale(60000)
            .translate([width / 2, height / 2]);
      } else {
        proj.center([28.9784, 41.0082])
            .scale(40000)
            .translate([width / 2, height / 2]);
      }
    } catch {
      proj.center([28.9784, 41.0082])
          .scale(40000)
          .translate([width / 2, height / 2]);
    }

    const baseScale = proj.scale() || 40000;
    const baseTranslate = proj.translate() || [width / 2, height / 2];

    proj
      .scale(baseScale * zoomLevel)
      .translate([baseTranslate[0] + panOffset.x, baseTranslate[1] + panOffset.y]);

    const generator = geoPath().projection(proj);
    let center = [0, 0];
    try {
      center = proj.invert ? proj.invert([width / 2, height / 2]) || [0, 0] : [0, 0];
    } catch {
      center = [0, 0];
    }

    return {
      projection: proj,
      pathGenerator: generator,
      centerCoords: center,
      projectionScale: Math.round(proj.scale() || 1000),
    };
  }, [pointsFeatureCollection, allPoints, width, height, padding, zoomLevel, panOffset]);

  // Generate D3 projected path for the suggested optimized route
  const d3RoutePath = useMemo(() => {
    if (stops.length < 2) return '';
    try {
      const lineFeature: Feature<LineString> = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: stops.map((s) => [s.site.longitude, s.site.latitude]),
        },
        properties: {},
      };
      return pathGenerator(lineFeature) || '';
    } catch {
      return '';
    }
  }, [stops, pathGenerator]);

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

  const clusterData = useMemo(() => {
    const sitesToUse = stops.length > 0 ? stops.map((s) => s.site) : allSitesInCluster;
    if (sitesToUse.length === 0) return null;

    let sumLat = 0;
    let sumLng = 0;
    sitesToUse.forEach((s) => {
      sumLat += s.latitude;
      sumLng += s.longitude;
    });
    const centerLat = sumLat / sitesToUse.length;
    const centerLng = sumLng / sitesToUse.length;

    let maxRadiusKm = 0;
    sitesToUse.forEach((s) => {
      const d = calculateDistanceKm(centerLat, centerLng, s.latitude, s.longitude);
      if (d > maxRadiusKm) maxRadiusKm = d;
    });

    const avgDistanceKm =
      stops.length > 1
        ? stops.slice(1).reduce((acc, s) => acc + s.distanceFromPrevKm, 0) / (stops.length - 1)
        : 0;

    return {
      centerLat,
      centerLng,
      radiusKm: Math.max(0.6, Number(maxRadiusKm.toFixed(1))),
      avgDistanceKm: Number(avgDistanceKm.toFixed(2)),
      count: sitesToUse.length,
    };
  }, [stops, allSitesInCluster]);

  const clusterVisuals = useMemo(() => {
    if (!clusterData || !projection) return null;
    try {
      const centerPx = projection([clusterData.centerLng, clusterData.centerLat]);
      if (!centerPx) return null;

      const latDelta = clusterData.radiusKm / 111;
      const edgePx = projection([clusterData.centerLng, clusterData.centerLat + latDelta]);
      const radiusPx = edgePx ? Math.abs(edgePx[1] - centerPx[1]) : 80;

      return {
        centerPx,
        radiusPx: Math.max(35, radiusPx),
      };
    } catch {
      return null;
    }
  }, [clusterData, projection]);

  const stopHopMarkers = useMemo(() => {
    if (!showHopDistances || stops.length < 2 || !projection) return [];

    return stops.slice(1).map((currStop, idx) => {
      const prevStop = stops[idx];
      try {
        const p1 = projection([prevStop.site.longitude, prevStop.site.latitude]);
        const p2 = projection([currStop.site.longitude, currStop.site.latitude]);
        if (!p1 || !p2) return null;

        const midX = (p1[0] + p2[0]) / 2;
        const midY = (p1[1] + p2[1]) / 2;

        return {
          key: `hop-${prevStop.site.id}-${currStop.site.id}`,
          x: midX,
          y: midY,
          distanceKm: currStop.distanceFromPrevKm,
          minutes: currStop.estimatedTravelMin,
          fromStop: prevStop.stopNumber,
          toStop: currStop.stopNumber,
        };
      } catch {
        return null;
      }
    }).filter(Boolean) as {
      key: string;
      x: number;
      y: number;
      distanceKm: number;
      minutes: number;
      fromStop: number;
      toStop: number;
    }[];
  }, [stops, showHopDistances, projection]);

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button, a, input')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const selectedStop = stops[activeStopIndex] || stops[0];

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden border border-slate-300 shadow-md select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${
        mapType === 'satellite' ? 'bg-[#182333]' : mapType === 'blueprint' ? 'bg-[#0f243a]' : 'bg-[#EAE8E4]'
      }`}
    >
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
            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 font-semibold shrink-0"
            title="Open in Google Maps App"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Maps</span>
          </a>
        </div>
      </div>

      {/* 2. Top-Right Map Mode & Layer Toggles */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-slate-200/90 flex items-center gap-1 text-xs">
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              mapType === 'roadmap' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Roadmap
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              mapType === 'satellite' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dark Mode
          </button>
          <button
            onClick={() => setMapType('blueprint')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              mapType === 'blueprint' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Blueprint
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-lg border border-slate-200/90 hidden md:flex items-center gap-1 text-xs">
          <button
            onClick={() => setShowClusterZone((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${
              showClusterZone ? 'bg-amber-100 text-amber-800' : 'text-slate-400 hover:bg-slate-100'
            }`}
            title="Toggle Territory Cluster Radius"
          >
            <Radio className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowHopDistances((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${
              showHopDistances ? 'bg-blue-100 text-blue-800' : 'text-slate-400 hover:bg-slate-100'
            }`}
            title="Toggle Hop Distances"
          >
            <Milestone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGraticule((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${
              showGraticule ? 'bg-sky-100 text-sky-800' : 'text-slate-400 hover:bg-slate-100'
            }`}
            title="Toggle Coordinate Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. SVG Map Graphics Canvas */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full block"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="routeGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
          </linearGradient>

          <pattern id="gridRoadPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={mapType === 'satellite' ? '#243248' : mapType === 'blueprint' ? '#1b3b5f' : '#d8d4cd'}
              strokeWidth="0.75"
            />
          </pattern>

          <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.35" />
          </filter>
        </defs>

        <rect width={width} height={height} fill="url(#gridRoadPattern)" />

        {showGraticule && (
          <g opacity={mapType === 'satellite' ? '0.15' : '0.25'}>
            {[100, 200, 300, 400, 500, 600, 700, 800].map((gx) => (
              <line
                key={`gx-${gx}`}
                x1={gx}
                y1="0"
                x2={gx}
                y2={height}
                stroke={mapType === 'blueprint' ? '#38bdf8' : '#64748b'}
                strokeWidth="0.5"
                strokeDasharray="4,6"
              />
            ))}
            {[80, 160, 240, 320, 400, 480].map((gy) => (
              <line
                key={`gy-${gy}`}
                x1="0"
                y1={gy}
                x2={width}
                y2={gy}
                stroke={mapType === 'blueprint' ? '#38bdf8' : '#64748b'}
                strokeWidth="0.5"
                strokeDasharray="4,6"
              />
            ))}
          </g>
        )}

        {showClusterZone && clusterVisuals && (
          <g>
            <circle
              cx={clusterVisuals.centerPx[0]}
              cy={clusterVisuals.centerPx[1]}
              r={clusterVisuals.radiusPx}
              fill="#3b82f6"
              fillOpacity={mapType === 'satellite' ? '0.08' : '0.06'}
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="6,6"
            />
            <circle
              cx={clusterVisuals.centerPx[0]}
              cy={clusterVisuals.centerPx[1]}
              r="4"
              fill="#3b82f6"
              opacity="0.6"
            />
          </g>
        )}

        {d3RoutePath && (
          <g>
            <path
              d={d3RoutePath}
              fill="none"
              stroke={mapType === 'satellite' ? '#1e3a8a' : '#93c5fd'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
            <path
              d={d3RoutePath}
              fill="none"
              stroke="url(#routeGlowGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {stopHopMarkers.map((hop) => (
          <g key={hop.key} transform={`translate(${hop.x}, ${hop.y})`}>
            <rect
              x="-28"
              y="-10"
              width="56"
              height="20"
              rx="10"
              fill="#0f172a"
              fillOpacity="0.85"
              stroke="#38bdf8"
              strokeWidth="1"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="600"
              fontFamily="monospace"
            >
              {hop.distanceKm} km
            </text>
          </g>
        ))}

        {showAllClusterSites &&
          allSitesInCluster.map((site) => {
            const isStop = stops.some((s) => s.site.id === site.id);
            if (isStop) return null;

            let pos = [0, 0];
            try {
              pos = projection ? projection([site.longitude, site.latitude]) || [0, 0] : [0, 0];
            } catch {
              return null;
            }

            const isMatch = searchFilter
              ? site.name.toLowerCase().includes(searchFilter) ||
                site.address.toLowerCase().includes(searchFilter)
              : false;

            return (
              <g
                key={`cluster-${site.id}`}
                transform={`translate(${pos[0]}, ${pos[1]})`}
                className="cursor-pointer group"
                onClick={() => {
                  if (onAddSiteToRoute) onAddSiteToRoute(site);
                  else onOpenInspect(site);
                }}
                onMouseEnter={() => setHoveredSite(site)}
                onMouseLeave={() => setHoveredSite(null)}
              >
                <circle
                  r={isMatch ? 12 : 7}
                  fill={isMatch ? '#eab308' : site.lastVisit ? '#10b981' : '#64748b'}
                  fillOpacity="0.85"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle r={isMatch ? 5 : 2.5} fill="#ffffff" />
              </g>
            );
          })}

        {stops.map((stop, index) => {
          let pos = [0, 0];
          try {
            pos = projection ? projection([stop.site.longitude, stop.site.latitude]) || [0, 0] : [0, 0];
          } catch {
            return null;
          }

          const isTarget = index === activeStopIndex;
          const isVisited = Boolean(stop.site.lastVisit);
          const hasEmergency = stop.site.lastVisit?.status === 'critical';
          const isAttention = stop.site.lastVisit?.status === 'attention_needed';

          const pinColor = hasEmergency
            ? '#ef4444'
            : isAttention
            ? '#f59e0b'
            : isVisited
            ? '#10b981'
            : isTarget
            ? '#2563eb'
            : '#475569';

          const isMatch = searchFilter
            ? stop.site.name.toLowerCase().includes(searchFilter) ||
              stop.site.address.toLowerCase().includes(searchFilter)
            : false;

          return (
            <g
              key={`stop-marker-${stop.site.id}-${index}`}
              transform={`translate(${pos[0]}, ${pos[1]})`}
              className="cursor-pointer"
              onClick={() => {
                onSelectStopIndex(index);
                onOpenInspect(stop.site);
              }}
              onMouseEnter={() => setHoveredStop(stop)}
              onMouseLeave={() => setHoveredStop(null)}
            >
              {isTarget && (
                <circle r="24" fill="#3b82f6" opacity="0.25">
                  <animate
                    attributeName="r"
                    values="14;30;14"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0;0.4"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              <path
                d="M 0 0 C -9 -14 -14 -20 -14 -28 C -14 -36 -7 -42 0 -42 C 7 -42 14 -36 14 -28 C 14 -20 9 -14 0 0 Z"
                fill={pinColor}
                stroke="#ffffff"
                strokeWidth={isTarget || isMatch ? '2.5' : '1.5'}
                filter="url(#pinShadow)"
              />

              <circle cx="0" cy="-28" r="9" fill="#ffffff" />

              <text
                x="0"
                y="-24"
                textAnchor="middle"
                fill={pinColor}
                fontSize="10"
                fontWeight="800"
                fontFamily="system-ui, -apple-system, sans-serif"
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
          title="Recenter Map"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>

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

        <div className="bg-white/95 backdrop-blur-xs rounded-lg shadow-md border border-slate-200 overflow-hidden flex flex-col">
          <button
            onClick={() => setZoomLevel((z) => Math.min(4, z + 0.3))}
            className="w-9 h-8 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center border-b border-slate-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.3))}
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
          <span>Mercator Projection</span>
          <span className="text-slate-500">|</span>
          <span>Center: [{centerCoords[0].toFixed(3)}°, {centerCoords[1].toFixed(3)}°]</span>
          <span className="text-slate-500">|</span>
          <span>Scale: {projectionScale}</span>
        </div>

        <div className="bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Target #{activeStopIndex + 1}</span>
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
              {totalDistanceKm.toFixed(1)} km • ~{totalEstMinutes} mins driving
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
            <span>•</span>
            <span>{hoveredStop.site.floors} Fls</span>
            <span>•</span>
            <span>From prev: {hoveredStop.distanceFromPrevKm} km</span>
            <span>•</span>
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
            <span>•</span>
            <span className={hoveredSite.lastVisit ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
              {hoveredSite.lastVisit ? 'Visited this month' : 'Click to add to route'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
