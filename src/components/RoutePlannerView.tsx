import React, { useState, useMemo } from 'react';
import { BuildingSite, RouteStop, Technician } from '../types';
import {
  optimizeRouteSequence,
  evaluateRouteOptimizationMetrics,
  buildGoogleMapsRouteUrl,
  buildSingleSiteMapUrl,
} from '../utils/geo';
import { RouteMapCanvas } from './RouteMapCanvas';
import {
  Sparkles,
  MapPin,
  Compass,
  CheckCircle2,
  Building2,
  KeyRound,
  Phone,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckSquare,
  ExternalLink,
  ArrowLeftRight,
  Route,
  TrendingDown,
  Layers,
  User,
  Plus,
  Eye,
} from 'lucide-react';
import { SiteMapIcon } from './SiteMapIcon';
import { LocationPreviewModal } from './LocationPreviewModal';

interface RoutePlannerViewProps {
  sites: BuildingSite[];
  currentTechnician: Technician;
  onOpenInspect: (site: BuildingSite) => void;
  onOpenAddSite: () => void;
}

export const RoutePlannerView: React.FC<RoutePlannerViewProps> = ({
  sites,
  currentTechnician,
  onOpenInspect,
  onOpenAddSite,
}) => {
  // Filter settings
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('All');
  const [onlyMySites, setOnlyMySites] = useState<boolean>(true);
  const [targetBatchSize, setTargetBatchSize] = useState<number>(8);
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
  const [previewLocationSite, setPreviewLocationSite] = useState<BuildingSite | null>(null);

  // Extract unique neighborhoods from sites
  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => set.add(s.neighborhood));
    return ['All', ...Array.from(set)];
  }, [sites]);

  // Filter pool of candidate sites based on technician assignment and neighborhood
  const candidateSites = useMemo(() => {
    return sites.filter((site) => {
      if (onlyMySites && site.assignedTechnicianEmail !== currentTechnician.email) {
        return false;
      }
      if (selectedNeighborhood !== 'All' && site.neighborhood !== selectedNeighborhood) {
        return false;
      }
      return true;
    });
  }, [sites, onlyMySites, currentTechnician, selectedNeighborhood]);

  const unvisitedCandidateSites = useMemo(() => {
    return candidateSites.filter((s) => !s.lastVisit);
  }, [candidateSites]);

  // Explicit queue of site IDs in the route
  const [queuedSiteIds, setQueuedSiteIds] = useState<string[]>([]);

  // Generated route stops with distance calculations
  const currentStops: RouteStop[] = useMemo(() => {
    if (queuedSiteIds.length === 0) {
      const initialPool = unvisitedCandidateSites.slice(0, targetBatchSize);
      if (initialPool.length > 0) {
        return optimizeRouteSequence(initialPool);
      }
      return [];
    }

    const sitesInRoute = queuedSiteIds
      .map((id) => sites.find((s) => s.id === id))
      .filter((s): s is BuildingSite => Boolean(s));

    // When user has an explicit queue, keep their manual sequence order
    return sitesInRoute.map((site, index) => {
      let dist = 0;
      if (index > 0) {
        const prev = sitesInRoute[index - 1];
        // Calculate haversine distance from prior stop
        const R = 6371;
        const dLat = ((site.latitude - prev.latitude) * Math.PI) / 180;
        const dLon = ((site.longitude - prev.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((prev.latitude * Math.PI) / 180) *
            Math.cos((site.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      }
      const estMin = Math.round((dist / 25) * 60) + (index === 0 ? 0 : 2);
      return {
        stopNumber: index + 1,
        site,
        distanceFromPrevKm: Number(dist.toFixed(2)),
        estimatedTravelMin: Math.max(1, estMin),
      };
    });
  }, [queuedSiteIds, unvisitedCandidateSites, sites, targetBatchSize]);

  // Compute optimization comparison metrics
  const optimizationMetrics = useMemo(() => {
    const sitesToEval = currentStops.map((s) => s.site);
    return evaluateRouteOptimizationMetrics(sitesToEval);
  }, [currentStops]);

  // Handler to trigger smart route optimization using 2-opt TSP
  const handleSuggestOptimizedOrder = () => {
    const pending = unvisitedCandidateSites;
    if (pending.length === 0) {
      alert('All assigned sites in this filter have already been completed for this month!');
      return;
    }

    // Take top batch and apply TSP sequence optimization
    const batch = pending.slice(0, targetBatchSize);
    const optimized = optimizeRouteSequence(batch);
    setQueuedSiteIds(optimized.map((s) => s.site.id));
    setActiveStopIndex(0);
  };

  // Reverse / Invert current route sequence
  const handleInvertRouteOrder = () => {
    if (currentStops.length < 2) return;
    const reversedIds = [...currentStops.map((s) => s.site.id)].reverse();
    setQueuedSiteIds(reversedIds);
    setActiveStopIndex(0);
  };

  // Add site from map directly to the route
  const handleAddSiteToRoute = (site: BuildingSite) => {
    if (currentStops.some((s) => s.site.id === site.id)) return;
    const newSiteList = [...currentStops.map((s) => s.site), site];
    // Re-optimize with the newly added site included
    const reOptimized = optimizeRouteSequence(newSiteList);
    setQueuedSiteIds(reOptimized.map((s) => s.site.id));
  };

  // Reorder stop manually
  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const newStops = [...currentStops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStops.length) return;

    const temp = newStops[index];
    newStops[index] = newStops[targetIndex];
    newStops[targetIndex] = temp;

    setQueuedSiteIds(newStops.map((s) => s.site.id));
  };

  const handleRemoveStop = (siteId: string) => {
    const updated = currentStops.filter((s) => s.site.id !== siteId);
    setQueuedSiteIds(updated.map((s) => s.site.id));
  };

  const completedTodayCount = currentStops.filter((s) => s.site.lastVisit).length;
  const isAllStopsCompleted = currentStops.length > 0 && completedTodayCount === currentStops.length;

  const totalKm = currentStops.reduce((sum, s) => sum + s.distanceFromPrevKm, 0);
  const totalMins = currentStops.reduce((sum, s) => sum + s.estimatedTravelMin, 0);

  return (
    <div className="space-y-6">
      {/* 1. Top Controls & Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                D3 Geo Projected Visualization
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">TSP 2-Opt Optimization</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Technician Route Planner:</span>
              <span className="text-blue-600 font-medium">{currentTechnician.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Visualizes assigned buildings on an interactive D3 Mercator projection and computes an optimized visitation order to eliminate backtracking.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSuggestOptimizedOrder}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
              title="Compute shortest Hamiltonian visitation sequence"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Suggest Optimized Order</span>
            </button>

            <button
              onClick={handleInvertRouteOrder}
              disabled={currentStops.length < 2}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all disabled:opacity-40"
              title="Reverse visitation direction"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Invert Route</span>
            </button>

            <a
              href={buildGoogleMapsRouteUrl(currentStops)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all active:scale-95 shadow-sm"
              title="Open full waypoint sequence in Google Maps app"
            >
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Territory & Scope Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-center">
          {/* Target Cluster Neighborhood */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Territory Zone
            </label>
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 outline-hidden font-medium"
            >
              {neighborhoods.map((nh) => (
                <option key={nh} value={nh}>
                  {nh === 'All' ? 'All Territories & Neighborhoods' : nh}
                </option>
              ))}
            </select>
          </div>

          {/* Technician Assignment Scope */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Assignment Scope
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setOnlyMySites(true)}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                  onlyMySites ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Sites Only
              </button>
              <button
                onClick={() => setOnlyMySites(false)}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                  !onlyMySites ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Team ({sites.length})
              </button>
            </div>
          </div>

          {/* Daily Stops Target Slider */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Stops Per Shift: <span className="font-mono text-slate-900 font-bold">{targetBatchSize} Sites</span>
            </label>
            <input
              type="range"
              min={4}
              max={15}
              value={targetBatchSize}
              onChange={(e) => setTargetBatchSize(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Unvisited Candidates in Territory */}
          <div className="text-right sm:text-left lg:text-right">
            <span className="text-[11px] text-slate-500 block">Pending In Selected Zone</span>
            <span className="text-sm font-semibold font-mono text-slate-900">
              {unvisitedCandidateSites.length} unvisited sites
            </span>
          </div>
        </div>
      </div>

      {/* 2. Suggested Optimization Order Comparison HUD */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Suggested Visitation Order
              </span>
              <span className="text-xs text-slate-300">
                {currentTechnician.name}’s Route Sequence
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-bold text-white font-mono text-base">
                {currentStops.length} Stops Sequence
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-emerald-400 font-semibold font-mono flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                <span>{optimizationMetrics.savedKm > 0 ? `${optimizationMetrics.savedPercent}% Distance Saved` : 'Optimized Path'}</span>
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300 font-mono text-xs">
                Total: {totalKm.toFixed(1)} km (~{totalMins} mins drive)
              </span>
            </div>
          </div>

          {/* Sequential Order Breadcrumbs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full lg:max-w-xl">
            {currentStops.slice(0, 5).map((stop, idx) => (
              <React.Fragment key={stop.site.id}>
                <button
                  onClick={() => {
                    setActiveStopIndex(idx);
                    onOpenInspect(stop.site);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-medium truncate max-w-[120px] transition-all ${
                    idx === activeStopIndex
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={`${stop.stopNumber}. ${stop.site.name} (${stop.site.address})`}
                >
                  #{stop.stopNumber} {stop.site.name.split(' ')[0]}
                </button>
                {idx < Math.min(currentStops.length, 5) - 1 && (
                  <span className="text-slate-500 text-xs">→</span>
                )}
              </React.Fragment>
            ))}
            {currentStops.length > 5 && (
              <span className="text-xs text-slate-400 font-mono px-1">
                +{currentStops.length - 5} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. D3 Geo Projection Map Canvas */}
      <RouteMapCanvas
        stops={currentStops}
        activeStopIndex={activeStopIndex}
        onSelectStopIndex={(idx) => setActiveStopIndex(idx)}
        onOpenInspect={onOpenInspect}
        allSitesInCluster={candidateSites}
        technicianName={currentTechnician.name}
        onAddSiteToRoute={handleAddSiteToRoute}
      />

      {/* 4. Shift Completion Progress Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 font-mono">
            {completedTodayCount}/{currentStops.length}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">
              {isAllStopsCompleted
                ? 'All Scheduled Visits Completed For Today!'
                : `Today's Route Progress: ${completedTodayCount} of ${currentStops.length} Visited`}
            </p>
            <p className="text-[11px] text-slate-500">
              {isAllStopsCompleted
                ? 'All safety inspection checklists recorded. Great work!'
                : 'Click "Add Visit Log" as you complete each site to record timestamp and checklist.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSuggestOptimizedOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-cluster Next Sites</span>
          </button>
        </div>
      </div>

      {/* 5. Suggested Order Sequential Waypoints Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Route className="w-4 h-4 text-blue-600" />
            <span>Suggested Order Waypoints</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              ({currentStops.length} sequential stops)
            </span>
          </h2>
          <span className="text-xs text-slate-500">
            2-Opt TSP sequence minimizing drive time
          </span>
        </div>

        {currentStops.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No Sites In Queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              All sites for the selected filter have already been completed, or none match your criteria.
            </p>
            <button
              onClick={() => {
                setSelectedNeighborhood('All');
                setOnlyMySites(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl"
            >
              Reset Filters to All Sites
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentStops.map((stop, idx) => {
              const isVisited = Boolean(stop.site.lastVisit);
              const isActive = idx === activeStopIndex;
              const isCritical = stop.site.lastVisit?.status === 'critical' || stop.site.priority === 'fault_alert';

              return (
                <div
                  key={stop.site.id}
                  className={`bg-white rounded-2xl p-4 border transition-all ${
                    isActive
                      ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-sm'
                      : isVisited
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isCritical
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Sequence badge & building details */}
                    <div className="flex items-start gap-3.5">
                      <SiteMapIcon
                        site={stop.site}
                        size="sm"
                        onClick={() => setPreviewLocationSite(stop.site)}
                      />
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold font-mono text-sm shrink-0 ${
                          isVisited
                            ? 'bg-emerald-600 text-white'
                            : isCritical
                            ? 'bg-rose-600 text-white'
                            : isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isVisited ? <CheckCircle2 className="w-5 h-5" /> : stop.stopNumber}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => {
                              setActiveStopIndex(idx);
                              onOpenInspect(stop.site);
                            }}
                          >
                            {stop.site.name}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-400">
                            {stop.site.id}
                          </span>
                          {isVisited ? (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Visited {stop.site.lastVisit?.date} at {stop.site.lastVisit?.time}</span>
                            </span>
                          ) : isCritical ? (
                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              Attention Required
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Stop #{stop.stopNumber} Pending
                            </span>
                          )}
                        </div>

                        {/* Address & Travel Info */}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {stop.site.address}
                          </span>
                          <span aria-hidden="true" className="text-slate-400">·</span>
                          <span className="font-mono text-slate-500">
                            {idx === 0 ? 'Suggested Starting Point' : `+${stop.distanceFromPrevKm} km (~${stop.estimatedTravelMin} mins drive)`}
                          </span>
                        </div>

                        {/* Elevator Hardware Specs & Access Code */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">
                            {stop.site.elevatorUnits} Lifts ({stop.site.elevatorBrand})
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{stop.site.floors} Floors</span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 font-mono text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                            <KeyRound className="w-3 h-3 text-amber-600" />
                            {stop.site.accessCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {stop.site.managerName} ({stop.site.managerPhone})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Manual sequence adjust */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => handleMoveStop(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                          title="Move stop earlier in sequence"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveStop(idx, 'down')}
                          disabled={idx === currentStops.length - 1}
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
                          title="Move stop later in sequence"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Location Preview Button */}
                      <button
                        onClick={() => setPreviewLocationSite(stop.site)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                        title="Location Preview: Inspect static neighborhood map & geolocation"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>

                      {/* Google Maps Navigation */}
                      <a
                        href={buildSingleSiteMapUrl(stop.site)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                        title="Navigate to this building in Google Maps"
                      >
                        <Compass className="w-4 h-4" />
                      </a>

                      {/* Remove stop */}
                      <button
                        onClick={() => handleRemoveStop(stop.site.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                        title="Remove from suggested route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Log Visit CTA */}
                      <button
                        onClick={() => {
                          setActiveStopIndex(idx);
                          onOpenInspect(stop.site);
                        }}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 ${
                          isVisited
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Add Visit Log</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Location Preview Helper Modal */}
      <LocationPreviewModal
        site={previewLocationSite}
        isOpen={Boolean(previewLocationSite)}
        onClose={() => setPreviewLocationSite(null)}
        onOpenInspect={onOpenInspect}
      />
    </div>
  );
};
