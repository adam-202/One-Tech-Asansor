import React, { useEffect, useRef, useState, useMemo } from 'react';
import { RouteStop, BuildingSite } from '../types';
import { buildGoogleMapsRouteUrl } from '../utils/geo';
import L from 'leaflet';
import {
  Layers,
  Crosshair,
  ExternalLink,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Move,
  Save,
  RotateCcw,
  PlusCircle,
  Eye,
} from 'lucide-react';

interface InteractiveRealMapProps {
  stops: RouteStop[];
  activeStopIndex: number;
  onSelectStopIndex: (index: number) => void;
  onOpenInspect: (site: BuildingSite) => void;
  allSitesInCluster?: BuildingSite[];
  technicianName?: string;
  onAddSiteToRoute?: (site: BuildingSite) => void;
  onUpdateSiteLocation?: (siteId: string, lat: number, lng: number) => void;
  isAdmin?: boolean;
  userGps?: { latitude: number; longitude: number } | null;
  onRequestLocation?: () => void;
  isLocating?: boolean;
}

export const InteractiveRealMap: React.FC<InteractiveRealMapProps> = ({
  stops,
  activeStopIndex,
  onSelectStopIndex,
  onOpenInspect,
  allSitesInCluster = [],
  technicianName,
  onAddSiteToRoute,
  onUpdateSiteLocation,
  isAdmin = false,
  userGps,
  onRequestLocation,
  isLocating = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [isAdjustMode, setIsAdjustMode] = useState<boolean>(false);
  const [selectedSiteForAdjust, setSelectedSiteForAdjust] = useState<BuildingSite | null>(null);
  const [draggedCoords, setDraggedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const defaultCenter = useMemo<[number, number]>(() => {
    if (stops.length > 0) {
      const active = stops[activeStopIndex] || stops[0];
      return [active.site.latitude, active.site.longitude];
    }
    if (allSitesInCluster.length > 0) {
      return [allSitesInCluster[0].latitude, allSitesInCluster[0].longitude];
    }
    return [41.0082, 28.9784];
  }, [stops, activeStopIndex, allSitesInCluster]);

  const getTileUrl = (style: 'streets' | 'satellite' | 'dark') => {
    switch (style) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'streets':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: false,
    });

    const tile = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 19,
      attribution: '© OpenStreetMap | Esri',
    }).addTo(map);

    tileLayerRef.current = tile;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileUrl(mapStyle));
  }, [mapStyle]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (stops.length > 0) {
      const active = stops[activeStopIndex];
      if (active) {
        map.panTo([active.site.latitude, active.site.longitude], { animate: true });
      }
    }
  }, [activeStopIndex, stops]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    // 1. Live Device GPS Radar Pin
    if (userGps) {
      const gpsPulseIcon = L.divIcon({
        className: 'custom-live-gps-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <span style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: #38bdf8; opacity: 0.4; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <span style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: #0284c7; opacity: 0.3;"></span>
            <span style="width: 14px; height: 14px; border-radius: 50%; background-color: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(37,99,235,0.8); position: relative; z-index: 10;"></span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const gpsMarker = L.marker([userGps.latitude, userGps.longitude], {
        icon: gpsPulseIcon,
        zIndexOffset: 3000,
      });

      gpsMarker.bindTooltip(
        `<div style="font-size: 11px; font-weight: bold; color: #1e3a8a;">📍 Sizin Canlı Konumunuz (Saha GPS)</div>`,
        { direction: 'top', offset: [0, -18] }
      );
      markersGroup.addLayer(gpsMarker);
    }

    // 2. Route Polyline (Originating from userGps if present, else stop 1)
    const routePoints: [number, number][] = [];
    if (userGps && stops.length > 0) {
      routePoints.push([userGps.latitude, userGps.longitude]);
    }
    stops.forEach((s) => routePoints.push([s.site.latitude, s.site.longitude]));

    if (routePoints.length > 1) {
      const polyline = L.polyline(routePoints, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
      routeLayerRef.current = polyline;
    }

    allSitesInCluster.forEach((site) => {
      const isStop = stops.some((s) => s.site.id === site.id);
      if (isStop) return;

      const isCurrentAdjust = isAdjustMode && selectedSiteForAdjust?.id === site.id;

      const unassignedIcon = L.divIcon({
        className: 'custom-unassigned-pin',
        html: `
          <div style="
            width: 22px; 
            height: 22px; 
            border-radius: 50%; 
            background-color: ${site.lastVisit ? '#10b981' : '#64748b'}; 
            border: 2px solid white; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex; 
            align-items: center; 
            justify-content: center;
            cursor: pointer;
          ">
            <span style="width: 6px; height: 6px; border-radius: 50%; background-color: white;"></span>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([site.latitude, site.longitude], {
        icon: unassignedIcon,
        draggable: isCurrentAdjust,
      });

      marker.on('click', () => {
        if (isAdjustMode) {
          setSelectedSiteForAdjust(site);
          setDraggedCoords({ lat: site.latitude, lng: site.longitude });
        } else {
          onOpenInspect(site);
        }
      });

      marker.on('dragend', (e: any) => {
        const newPos = e.target.getLatLng();
        setDraggedCoords({ lat: Number(newPos.lat.toFixed(6)), lng: Number(newPos.lng.toFixed(6)) });
        setSelectedSiteForAdjust(site);
      });

      marker.bindTooltip(
        `<strong>${site.name}</strong><br/><span style="font-size: 11px; color: #64748b;">${site.neighborhood}</span>`,
        { direction: 'top', offset: [0, -10] }
      );

      markersGroup.addLayer(marker);
    });

    stops.forEach((stop, index) => {
      const isTarget = index === activeStopIndex;
      const isVisited = Boolean(stop.site.lastVisit);
      const isCritical = stop.site.lastVisit?.status === 'critical';
      const isAttention = stop.site.lastVisit?.status === 'attention_needed';
      const isCurrentAdjust = isAdjustMode && selectedSiteForAdjust?.id === stop.site.id;

      const pinColor = isCritical
        ? '#ef4444'
        : isAttention
        ? '#f59e0b'
        : isVisited
        ? '#10b981'
        : isTarget
        ? '#2563eb'
        : '#334155';

      const stopIcon = L.divIcon({
        className: 'custom-stop-pin',
        html: `
          <div style="position: relative; width: 34px; height: 42px; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              width: 30px; 
              height: 30px; 
              border-radius: 50% 50% 50% 0; 
              transform: rotate(-45deg); 
              background-color: ${pinColor}; 
              border: 2px solid #ffffff; 
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="
                transform: rotate(45deg); 
                color: #ffffff; 
                font-size: 11px; 
                font-weight: 800; 
                font-family: system-ui, -apple-system, sans-serif;
              ">${stop.stopNumber}</span>
            </div>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 36],
      });

      const marker = L.marker([stop.site.latitude, stop.site.longitude], {
        icon: stopIcon,
        draggable: isCurrentAdjust,
        zIndexOffset: isTarget ? 1000 : 100,
      });

      marker.on('click', () => {
        if (isAdjustMode) {
          setSelectedSiteForAdjust(stop.site);
          setDraggedCoords({ lat: stop.site.latitude, lng: stop.site.longitude });
        } else {
          onSelectStopIndex(index);
          onOpenInspect(stop.site);
        }
      });

      marker.on('dragend', (e: any) => {
        const newPos = e.target.getLatLng();
        setDraggedCoords({ lat: Number(newPos.lat.toFixed(6)), lng: Number(newPos.lng.toFixed(6)) });
        setSelectedSiteForAdjust(stop.site);
      });

      marker.bindTooltip(
        `<div style="font-size: 12px; font-family: system-ui;"><strong>#${stop.stopNumber} ${stop.site.name}</strong><br/><span style="color: #64748b;">${stop.site.address}</span><br/><span style="color: #2563eb; font-weight: bold;">${stop.site.elevatorUnits} Asansör</span></div>`,
        { direction: 'top', offset: [0, -28] }
      );

      markersGroup.addLayer(marker);
    });
  }, [stops, allSitesInCluster, activeStopIndex, isAdjustMode, selectedSiteForAdjust, userGps]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points: [number, number][] = [];
    if (userGps) {
      points.push([userGps.latitude, userGps.longitude]);
    }
    stops.forEach((s) => points.push([s.site.latitude, s.site.longitude]));

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (allSitesInCluster.length > 0) {
      const bounds = L.latLngBounds(allSitesInCluster.map((s) => [s.latitude, s.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const handleSaveLocation = () => {
    if (!selectedSiteForAdjust || !draggedCoords || !onUpdateSiteLocation) return;
    onUpdateSiteLocation(selectedSiteForAdjust.id, draggedCoords.lat, draggedCoords.lng);
    setSelectedSiteForAdjust(null);
    setDraggedCoords(null);
    setIsAdjustMode(false);
  };

  const totalKm = stops.reduce((acc, s) => acc + s.distanceFromPrevKm, 0);
  const googleMapsUrl = buildGoogleMapsRouteUrl(stops, userGps);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-300 shadow-md">
      {/* 1. Leaflet Real Tile Map Viewport */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 2. Top-Left Floating Controls: Navigation + Adjust Mode */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 text-xs font-semibold text-slate-800 hover:text-blue-600 transition-all group"
        >
          <div className={`w-6 h-6 rounded-md ${userGps ? 'bg-emerald-600' : 'bg-blue-600'} text-white flex items-center justify-center shrink-0`}>
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="leading-tight">
              {userGps ? '📍 Canlı GPS ile Başlat' : `${stops.length} Durak Rotası`}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {stops.length} bina • {totalKm.toFixed(1)} km
            </span>
          </div>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
        </a>

        {/* Location Adjustment Mode Toggle */}
        <button
          onClick={() => {
            setIsAdjustMode(!isAdjustMode);
            setSelectedSiteForAdjust(null);
            setDraggedCoords(null);
          }}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg border transition-all ${
            isAdjustMode
              ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
              : 'bg-white/95 text-slate-700 hover:bg-white border-slate-200'
          }`}
          title="Konum Düzeltme Modu (İğneyi tutup sürükleyerek haritada gerçek yerini ayarlayın)"
        >
          <Move className="w-3.5 h-3.5" />
          <span>{isAdjustMode ? 'Konum Ayarlama Açık' : 'Konumları Ayarla (Sürükle)'}</span>
        </button>
      </div>

      {/* 3. Top-Right Real Map Style Switcher */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200 pointer-events-auto text-xs">
        <button
          onClick={() => setMapStyle('streets')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            mapStyle === 'streets' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sokak Haritası
        </button>
        <button
          onClick={() => setMapStyle('satellite')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            mapStyle === 'satellite' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Uydu (Gerçek)
        </button>
        <button
          onClick={() => setMapStyle('dark')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            mapStyle === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Karanlık Mod
        </button>
      </div>

      {/* 4. Active Location Adjustment Toolbar */}
      {isAdjustMode && (
        <div className="absolute top-16 left-3 right-3 sm:right-auto z-10 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 max-w-md pointer-events-auto text-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
            <span className="font-bold flex items-center gap-1.5 text-amber-400">
              <Move className="w-4 h-4" />
              <span>Konum Düzeltme Modu</span>
            </span>
            <button
              onClick={() => setIsAdjustMode(false)}
              className="text-slate-400 hover:text-white text-[11px]"
            >
              Kapat
            </button>
          </div>
          <p className="text-slate-300 text-[11px] mb-2 leading-relaxed">
            Düzeltmek istediğiniz binanın iğnesine tıklayın ve haritada tam doğru noktaya <strong>sürükleyip bırakın</strong>.
          </p>
          {selectedSiteForAdjust ? (
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 space-y-2">
              <div className="font-semibold text-white truncate">{selectedSiteForAdjust.name}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Yeni Koordinat: {draggedCoords ? `${draggedCoords.lat}, ${draggedCoords.lng}` : `${selectedSiteForAdjust.latitude}, ${selectedSiteForAdjust.longitude}`}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSaveLocation}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Yeni Konumu Kaydet</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedSiteForAdjust(null);
                    setDraggedCoords(null);
                  }}
                  className="py-1.5 px-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 italic">
              Lütfen haritada yerini değiştirmek istediğiniz binaya tıklayın.
            </div>
          )}
        </div>
      )}

      {/* 5. Bottom Controls: Recenter & GPS Locate */}
      <div className="absolute bottom-5 right-3 z-10 flex flex-col items-center gap-2 pointer-events-auto">
        {onRequestLocation && (
          <button
            onClick={() => {
              onRequestLocation();
              if (userGps && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([userGps.latitude, userGps.longitude], 16, { animate: true });
              }
            }}
            className={`w-9 h-9 rounded-lg shadow-md border flex items-center justify-center transition-all cursor-pointer ${
              userGps
                ? 'bg-blue-600 text-white border-blue-700 shadow-blue-500/30'
                : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200'
            }`}
            title={userGps ? 'Konumuma Git (GPS Aktif)' : 'Cihaz Konumunu Al'}
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
        )}

        <button
          onClick={handleRecenter}
          className="w-9 h-9 bg-white/95 hover:bg-white text-slate-700 rounded-lg shadow-md border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          title="Tüm Binaları Göster ve Ortala"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>
      </div>

      {/* 6. Bottom-Left Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 text-[10px] font-medium pointer-events-none shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span>Sıradaki Hedef</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>Bakımı Yapıldı</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Bekliyor</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span>Diğer Binalar</span>
        </div>
      </div>
    </div>
  );
};
