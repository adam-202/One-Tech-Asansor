import React, { useState, useMemo } from 'react';
import { BuildingSite, Technician } from '../types';
import { TECHNICIANS } from '../data/seedSites';
import {
  Search,
  Filter,
  Plus,
  Download,
  Building2,
  MapPin,
  KeyRound,
  Phone,
  CheckCircle2,
  AlertCircle,
  AlertOctagon,
  Clock,
  Edit2,
  Trash2,
  CheckSquare,
  ArrowUpDown,
  UserCheck,
  Compass,
  X,
  RotateCcw,
  SlidersHorizontal,
  User,
  ShieldAlert,
  Eye,
  Upload,
} from 'lucide-react';
import { exportSitesToCsv } from '../utils/exportReport';
import { buildSingleSiteMapUrl } from '../utils/geo';
import { SiteMapIcon } from './SiteMapIcon';
import { LocationPreviewModal } from './LocationPreviewModal';
import { BatchImportModal } from './BatchImportModal';

interface SitesDirectoryViewProps {
  sites: BuildingSite[];
  currentTechnician: Technician;
  onOpenInspect: (site: BuildingSite) => void;
  onOpenEditSite: (site: BuildingSite) => void;
  onOpenAddSite: () => void;
  onDeleteSite: (siteId: string) => void;
  onReassignSite: (siteId: string, newEmail: string) => void;
  onBatchImport: (newSites: BuildingSite[], updateExisting: boolean) => void;
}

export const SitesDirectoryView: React.FC<SitesDirectoryViewProps> = ({
  sites,
  currentTechnician,
  onOpenInspect,
  onOpenEditSite,
  onOpenAddSite,
  onDeleteSite,
  onReassignSite,
  onBatchImport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visited' | 'pending' | 'issues'>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'neighborhood' | 'units' | 'status'>('neighborhood');
  const [sortAsc, setSortAsc] = useState(true);
  const [previewLocationSite, setPreviewLocationSite] = useState<BuildingSite | null>(null);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);

  // Extract unique neighborhoods
  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => set.add(s.neighborhood));
    return ['All', ...Array.from(set)];
  }, [sites]);

  // Extract unique brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => set.add(s.elevatorBrand));
    return ['All', ...Array.from(set)];
  }, [sites]);

  // Filtered and sorted sites
  const filteredSites = useMemo(() => {
    return sites
      .filter((site) => {
        // Search by building name, address, neighborhood, site ID, access code, manager, or assigned technician
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const match =
            (site.name || '').toLowerCase().includes(q) ||
            (site.address || '').toLowerCase().includes(q) ||
            (site.neighborhood || '').toLowerCase().includes(q) ||
            (site.id || '').toLowerCase().includes(q) ||
            (site.accessCode || '').toLowerCase().includes(q) ||
            (site.managerName || '').toLowerCase().includes(q) ||
            (site.assignedTechnicianEmail || '').toLowerCase().includes(q) ||
            (site.elevatorBrand || '').toLowerCase().includes(q);
          if (!match) return false;
        }

        // Status Filter
        if (statusFilter === 'visited' && !site.lastVisit) return false;
        if (statusFilter === 'pending' && site.lastVisit) return false;
        if (
          statusFilter === 'issues' &&
          (!site.lastVisit || site.lastVisit.status === 'passed')
        ) {
          return false;
        }

        // Neighborhood Filter
        if (selectedNeighborhood !== 'All' && site.neighborhood !== selectedNeighborhood) {
          return false;
        }

        // Technician Filter
        if (techFilter === 'mine' && site.assignedTechnicianEmail !== currentTechnician.email) {
          return false;
        }
        if (techFilter !== 'all' && techFilter !== 'mine' && site.assignedTechnicianEmail !== techFilter) {
          return false;
        }

        // Brand Filter
        if (brandFilter !== 'All' && site.elevatorBrand !== brandFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') {
          diff = a.name.localeCompare(b.name);
        } else if (sortBy === 'neighborhood') {
          diff = a.neighborhood.localeCompare(b.neighborhood) || a.name.localeCompare(b.name);
        } else if (sortBy === 'units') {
          diff = a.elevatorUnits - b.elevatorUnits;
        } else if (sortBy === 'status') {
          const aV = a.lastVisit ? 1 : 0;
          const bV = b.lastVisit ? 1 : 0;
          diff = aV - bV;
        }
        return sortAsc ? diff : -diff;
      });
  }, [sites, searchQuery, statusFilter, selectedNeighborhood, techFilter, brandFilter, sortBy, sortAsc, currentTechnician]);

  const visitedCount = sites.filter((s) => s.lastVisit).length;
  const pendingCount = sites.length - visitedCount;
  const issuesCount = sites.filter(
    (s) => s.lastVisit && s.lastVisit.status !== 'passed'
  ).length;
  const myAssignedCount = sites.filter(
    (s) => s.assignedTechnicianEmail === currentTechnician.email
  ).length;

  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    selectedNeighborhood !== 'All' ||
    techFilter !== 'all' ||
    brandFilter !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedNeighborhood('All');
    setTechFilter('all');
    setBrandFilter('All');
  };

  const handleExportCsv = () => {
    exportSitesToCsv(filteredSites, 'elevator_sites_master');
  };

  const handleToggleSort = (field: 'name' | 'neighborhood' | 'units' | 'status') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Elevator Portfolio Master Directory</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-800 font-semibold">{sites.length} Total Contracts</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Sites Directory & Fleet Register
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Easily search buildings, filter by status or technician, update specs, and manage monthly inspection coverage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors shadow-xs"
              title="Mass-add or update building sites from Excel, CSV, clipboard or WhatsApp"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import Dataset</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenAddSite}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Building</span>
            </button>
          </div>
        </div>

        {/* Quick Segmented Status & Assignment Filter Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setStatusFilter('all');
              setTechFilter('all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'all' && techFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>All Sites ({sites.length})</span>
          </button>

          <button
            onClick={() => {
              setTechFilter('mine');
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              techFilter === 'mine'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Assigned to Me ({myAssignedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('visited')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'visited'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Visited This Month ({visitedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Inspection ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('issues')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === 'issues'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Needs Attention ({issuesCount})</span>
          </button>
        </div>

        {/* Dedicated Search Bar & Advanced Dropdown Filters Console */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
          {/* Main Search Bar */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>Search Building Name, Address, Access Code, or Manager</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type building name (e.g. Apex, Meridian, Sovereign), address, code (#2401*)..."
                className="w-full text-xs pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder-slate-400 outline-hidden bg-white shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
                  title="Clear search input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter 1: Inspection Status Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Visit Status</span>
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium shadow-2xs"
              >
                <option value="all">All Statuses ({sites.length})</option>
                <option value="visited">Visited This Month ({visitedCount})</option>
                <option value="pending">Pending Visit ({pendingCount})</option>
                <option value="issues">Issues / Needs Attention ({issuesCount})</option>
              </select>
            </div>

            {/* Filter 2: Assigned Technician Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-blue-600" />
                <span>Assigned Technician</span>
              </label>
              <select
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium shadow-2xs"
              >
                <option value="all">All Technicians ({TECHNICIANS.length})</option>
                <option value="mine">Assigned to Me ({currentTechnician.name})</option>
                {TECHNICIANS.map((t) => {
                  const count = sites.filter((s) => s.assignedTechnicianEmail === t.email).length;
                  return (
                    <option key={t.id} value={t.email}>
                      {t.name} ({count} sites)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filter 3: Neighborhood District Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>Neighborhood District</span>
              </label>
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium shadow-2xs"
              >
                {neighborhoods.map((nh) => {
                  const count = nh === 'All' ? sites.length : sites.filter((s) => s.neighborhood === nh).length;
                  return (
                    <option key={nh} value={nh}>
                      {nh === 'All' ? 'All Districts / Neighborhoods' : `${nh} (${count})`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filter 4: Elevator Brand Model Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-600" />
                <span>Elevator Brand</span>
              </label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium shadow-2xs"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b === 'All' ? 'All Elevator Brands' : b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Badges & Reset Button */}
          {isAnyFilterActive && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
                <span className="font-semibold text-slate-700">Active Filters:</span>
                {searchQuery && (
                  <span className="bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    Name/Query: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('all')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {techFilter !== 'all' && (
                  <span className="bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    Technician: {techFilter === 'mine' ? currentTechnician.name : techFilter.split('@')[0]}
                    <button onClick={() => setTechFilter('all')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedNeighborhood !== 'All' && (
                  <span className="bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    District: {selectedNeighborhood}
                    <button onClick={() => setSelectedNeighborhood('All')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {brandFilter !== 'All' && (
                  <span className="bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    Brand: {brandFilter}
                    <button onClick={() => setBrandFilter('All')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline ml-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results HUD */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span className="font-mono tabular-nums">
          Showing <strong>{filteredSites.length}</strong> of <strong>{sites.length}</strong> contracted sites
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Sort by:</span>
          <button
            onClick={() => handleToggleSort('name')}
            className={`flex items-center gap-1 hover:text-slate-900 ${sortBy === 'name' ? 'font-semibold text-blue-600' : ''}`}
          >
            <span>Building</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleToggleSort('neighborhood')}
            className={`flex items-center gap-1 hover:text-slate-900 ${sortBy === 'neighborhood' ? 'font-semibold text-blue-600' : ''}`}
          >
            <span>District</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleToggleSort('units')}
            className={`flex items-center gap-1 hover:text-slate-900 ${sortBy === 'units' ? 'font-semibold text-blue-600' : ''}`}
          >
            <span>Units</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleToggleSort('status')}
            className={`flex items-center gap-1 hover:text-slate-900 ${sortBy === 'status' ? 'font-semibold text-blue-600' : ''}`}
          >
            <span>Status</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Sites List / Table */}
      {filteredSites.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching buildings found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search keywords, status filter, technician assignment, or neighborhood selector.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            Reset All Filters & Search
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredSites.map((site) => {
            const isVisited = Boolean(site.lastVisit);
            const visit = site.lastVisit;
            const assignedTech = TECHNICIANS.find((t) => t.email === site.assignedTechnicianEmail);

            return (
              <div
                key={site.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Building Specs & Site Map Icon */}
                <div className="flex items-start gap-3.5">
                  <SiteMapIcon
                    site={site}
                    size="md"
                    onClick={() => setPreviewLocationSite(site)}
                  />
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isVisited
                        ? visit?.status === 'critical'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : visit?.status === 'attention_needed'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isVisited ? (
                      visit?.status === 'critical' ? (
                        <AlertOctagon className="w-5 h-5 text-rose-600" />
                      ) : visit?.status === 'attention_needed' ? (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      )
                    ) : (
                      site.id.replace('site-', '')
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        onClick={() => onOpenInspect(site)}
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                      >
                        {site.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        {site.id}
                      </span>
                      {site.priority === 'vip' && (
                        <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          Priority Site
                        </span>
                      )}
                    </div>

                    {/* Street Address & District */}
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {site.address}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="text-slate-500 font-medium">{site.neighborhood}</span>
                    </div>

                    {/* Hardware Info, Access Code, Contacts */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 font-mono">
                        {site.elevatorUnits} Lifts · {site.floors} Floors
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-600">{site.elevatorBrand}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 font-mono text-slate-800 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        {site.accessCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {site.managerName} ({site.managerPhone})
                      </span>
                    </div>

                    {/* Visit Log Record if Completed */}
                    {visit && (
                      <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/80 flex flex-wrap items-center gap-2 font-mono">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Visited on <strong>{visit.date}</strong> at <strong>{visit.time}</strong> by {visit.technicianName}
                        </span>
                        <span aria-hidden="true" className="text-emerald-400">·</span>
                        <span className="capitalize font-semibold text-emerald-900">
                          {visit.status.replace('_', ' ')}
                        </span>
                        {visit.notes && (
                          <span className="text-slate-600 font-sans italic truncate max-w-xs">
                            "{visit.notes}"
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Assigned Tech Switcher & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center shrink-0">
                  {/* Reassign Tech Dropdown */}
                  <div className="relative">
                    <select
                      value={site.assignedTechnicianEmail}
                      onChange={(e) => onReassignSite(site.id, e.target.value)}
                      className="text-xs py-1.5 pl-2 pr-6 rounded-lg border border-slate-300 bg-white text-slate-700 outline-hidden font-medium"
                      title="Reassign to another technician"
                    >
                      {TECHNICIANS.map((tech) => (
                        <option key={tech.id} value={tech.email}>
                          Assign: {tech.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Preview Button */}
                  <button
                    onClick={() => setPreviewLocationSite(site)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors"
                    title="Location Preview: View static neighborhood map & geolocation"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                  </button>

                  {/* Open in Maps */}
                  <a
                    href={buildSingleSiteMapUrl(site)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors"
                    title="Open address in Google Maps"
                  >
                    <Compass className="w-4 h-4" />
                  </a>

                  {/* Edit site modal */}
                  <button
                    onClick={() => onOpenEditSite(site)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    title="Edit site specifications"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete site */}
                  <button
                    onClick={() => {
                      onDeleteSite(site.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                    title="Delete site contract"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Add Visit Log Button */}
                  <button
                    onClick={() => onOpenInspect(site)}
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
            );
          })}
        </div>
      )}

      {/* Location Preview Helper Modal */}
      <LocationPreviewModal
        site={previewLocationSite}
        isOpen={Boolean(previewLocationSite)}
        onClose={() => setPreviewLocationSite(null)}
        onOpenInspect={onOpenInspect}
      />

      {/* Mass Batch Import Modal (CSV, Excel, WhatsApp, Clipboard) */}
      <BatchImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        existingSites={sites}
        currentTechnician={currentTechnician}
        onBatchSave={onBatchImport}
      />
    </div>
  );
};
