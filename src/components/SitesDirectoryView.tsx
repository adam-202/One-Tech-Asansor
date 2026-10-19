import React, { useState, useMemo } from 'react';
import { BuildingSite, Technician } from '../types';
import { Language, translations } from '../utils/translations';
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
  LayoutGrid,
  List,
} from 'lucide-react';
import { exportSitesToCsv } from '../utils/exportReport';
import { buildSingleSiteMapUrl } from '../utils/geo';
import { SiteMapIcon } from './SiteMapIcon';
import { LocationPreviewModal } from './LocationPreviewModal';
import { BatchImportModal } from './BatchImportModal';

interface SitesDirectoryViewProps {
  technicians?: Technician[];
  language?: Language;
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
  technicians: passedTechnicians,
  language = 'en',
  onOpenInspect,
  onOpenEditSite,
  onOpenAddSite,
  onDeleteSite,
  onReassignSite,
  onBatchImport,
}) => {
  const t = translations[language];
  const activeTechnicians = passedTechnicians && passedTechnicians.length > 0 ? passedTechnicians : TECHNICIANS;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visited' | 'pending' | 'issues'>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'neighborhood' | 'units' | 'status'>('neighborhood');
  const [sortAsc, setSortAsc] = useState(true);
  const [previewLocationSite, setPreviewLocationSite] = useState<BuildingSite | null>(null);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);

  const getBrandBadge = (brand: string) => {
    const b = (brand || '').toLowerCase();
    if (b.includes('kone')) {
      return 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
    }
    if (b.includes('otis')) {
      return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    if (b.includes('schindler')) {
      return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (b.includes('thyssen') || b.includes('tke')) {
      return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
    return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  };

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
          diff = (a.elevatorUnits ?? 0) - (b.elevatorUnits ?? 0);
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
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Elevator Portfolio Master Directory</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200 font-semibold">{sites.length} Total Contracts</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sites Directory & Fleet Register
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Easily search buildings, filter by status or technician, update specs, and manage monthly inspection coverage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors shadow-xs cursor-pointer"
              title="Mass-add or update building sites from Excel, CSV, clipboard or WhatsApp"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Import Dataset</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenAddSite}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Building</span>
            </button>
          </div>
        </div>

        {/* Quick Segmented Status & Assignment Filter Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setStatusFilter('all');
              setTechFilter('all');
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'all' && techFilter === 'all'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              techFilter === 'mine'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Assigned to Me ({myAssignedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('visited')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'visited'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Visited This Month ({visitedCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Inspection ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('issues')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'issues'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Needs Attention ({issuesCount})</span>
          </button>
        </div>

        {/* Dedicated Search Bar & Advanced Dropdown Filters Console */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
          {/* Main Search Bar */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Search Building Name, Address, Access Code, or Manager</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type building name (e.g. Apex, Meridian, Sovereign), address, code (#2401*)..."
                className="w-full text-xs pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-hidden bg-white dark:bg-slate-800 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
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
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Visit Status</span>
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium shadow-2xs"
              >
                <option value="all">All Statuses ({sites.length})</option>
                <option value="visited">Visited This Month ({visitedCount})</option>
                <option value="pending">Pending Visit ({pendingCount})</option>
                <option value="issues">Issues / Needs Attention ({issuesCount})</option>
              </select>
            </div>

            {/* Filter 2: Assigned Technician Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>Assigned Technician</span>
              </label>
              <select
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium shadow-2xs"
              >
                <option value="all">All Technicians ({activeTechnicians.length})</option>
                <option value="mine">Assigned to Me ({currentTechnician.name})</option>
                {activeTechnicians.map((t) => {
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
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                <span>Neighborhood District</span>
              </label>
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium shadow-2xs"
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
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Elevator Brand</span>
              </label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium shadow-2xs"
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
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Active Filters:</span>
                {searchQuery && (
                  <span className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    Name/Query: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 dark:hover:text-rose-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    Status: {statusFilter}
                    <button onClick={() => setStatusFilter('all')} className="hover:text-rose-600 dark:hover:text-rose-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {techFilter !== 'all' && (
                  <span className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    Technician: {techFilter === 'mine' ? currentTechnician.name : techFilter.split('@')[0]}
                    <button onClick={() => setTechFilter('all')} className="hover:text-rose-600 dark:hover:text-rose-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedNeighborhood !== 'All' && (
                  <span className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    District: {selectedNeighborhood}
                    <button onClick={() => setSelectedNeighborhood('All')} className="hover:text-rose-600 dark:hover:text-rose-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {brandFilter !== 'All' && (
                  <span className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                    Brand: {brandFilter}
                    <button onClick={() => setBrandFilter('All')} className="hover:text-rose-600 dark:hover:text-rose-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline ml-auto cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-mono tabular-nums">
          Showing <strong className="text-slate-900 dark:text-white">{filteredSites.length}</strong> of <strong className="text-slate-900 dark:text-white">{sites.length}</strong> contracted sites
        </span>
        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="List Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">Sort:</span>
          <button
            onClick={() => handleToggleSort('name')}
            className={`flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer ${sortBy === 'name' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
          >
            <span>Building</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleToggleSort('neighborhood')}
            className={`flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer ${sortBy === 'neighborhood' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
          >
            <span>District</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleToggleSort('units')}
            className={`flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer ${sortBy === 'units' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
          >
            <span>Units</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleToggleSort('status')}
            className={`flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer ${sortBy === 'status' ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}`}
          >
            <span>Status</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Sites List / Grid / Empty State */}
      {filteredSites.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 backdrop-blur-md">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No matching buildings found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search keywords, status filter, technician assignment, or neighborhood selector.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Reset All Filters & Search
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Modern Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map((site) => {
            const isVisited = Boolean(site.lastVisit);
            const visit = site.lastVisit;
            const assignedTech = activeTechnicians.find((t) => t.email === site.assignedTechnicianEmail);
            const brandBadgeStyle = getBrandBadge(site.elevatorBrand);

            return (
              <div
                key={site.id}
                className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-lg transition-all flex flex-col justify-between group relative backdrop-blur-md"
              >
                <div>
                  {/* Top Row: Icon, Title & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <SiteMapIcon
                        site={site}
                        size="md"
                        onClick={() => setPreviewLocationSite(site)}
                      />
                      <div>
                        <h3
                          onClick={() => onOpenInspect(site)}
                          className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 cursor-pointer transition-colors"
                        >
                          {site.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">{site.id}</span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{site.neighborhood}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isVisited ? (
                      visit?.status === 'critical' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3 text-rose-600" />
                          <span>Critical</span>
                        </span>
                      ) : visit?.status === 'attention_needed' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Attention</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Inspected</span>
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-3.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{site.address}</span>
                  </p>

                  {/* Hardware & Access Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${brandBadgeStyle}`}>
                      {site.elevatorBrand || 'KONE'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {site.elevatorUnits ?? '–'} Lifts
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {site.floors ?? '–'} Fl.
                    </span>
                    {site.accessCode ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        {site.accessCode}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">No Code</span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Technician & Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    {assignedTech ? (
                      <>
                        <div className={`w-6 h-6 rounded-full ${assignedTech.avatarColor || 'bg-blue-600'} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                          {assignedTech.name[0]}
                        </div>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                          {assignedTech.name.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setPreviewLocationSite(site)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Location Map"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenEditSite(site)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Building"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenInspect(site)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Log</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Streamlined Enterprise List Table */
        <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800 backdrop-blur-md">
          {filteredSites.map((site) => {
            const isVisited = Boolean(site.lastVisit);
            const visit = site.lastVisit;
            const assignedTech = activeTechnicians.find((t) => t.email === site.assignedTechnicianEmail);

            return (
              <div
                key={site.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
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
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : visit?.status === 'attention_needed'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
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
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                      >
                        {site.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        {site.id}
                      </span>
                      {site.priority === 'vip' && (
                        <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          Priority Site
                        </span>
                      )}
                    </div>

                    {/* Street Address & District */}
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {site.address}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{site.neighborhood}</span>
                    </div>

                    {/* Hardware Info, Access Code, Contacts */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {site.elevatorUnits} Lifts · {site.floors} Floors
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-600 dark:text-slate-400">{site.elevatorBrand}</span>
                      <span aria-hidden="true">·</span>
                      {site.accessCode ? (
                        <span className="flex items-center gap-1 font-mono text-amber-900 dark:text-amber-200 font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                          <KeyRound className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          {site.accessCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">
                          {t.noDoorCode}
                        </span>
                      )}
                      <span aria-hidden="true">•</span>
                      {(site.managerName || site.managerPhone) ? (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {site.managerName} {site.managerPhone ? `(${site.managerPhone})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {t.managerContact}: {t.notSpecified}
                        </span>
                      )}
                    </div>

                    {/* Visit Log Record if Completed */}
                    {visit && (
                      <div className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800 flex flex-wrap items-center gap-2 font-mono">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          Visited on <strong>{visit.date}</strong> at <strong>{visit.time}</strong> by {visit.technicianName}
                        </span>
                        <span aria-hidden="true" className="text-emerald-400">·</span>
                        <span className="capitalize font-semibold text-emerald-900 dark:text-emerald-200">
                          {visit.status.replace('_', ' ')}
                        </span>
                        {visit.notes && (
                          <span className="text-slate-600 dark:text-slate-400 font-sans italic truncate max-w-xs">
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
                      className="text-xs py-1.5 pl-2 pr-6 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-hidden font-medium cursor-pointer"
                      title="Reassign to another technician"
                    >
                      {activeTechnicians.map((tech) => (
                        <option key={tech.id} value={tech.email}>
                          Assign: {tech.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Preview Button */}
                  <button
                    onClick={() => setPreviewLocationSite(site)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Location Preview: View static neighborhood map & geolocation"
                  >
                    <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>

                  {/* Open in Maps */}
                  <a
                    href={buildSingleSiteMapUrl(site)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    title="Open address in Google Maps"
                  >
                    <Compass className="w-4 h-4" />
                  </a>

                  {/* Edit site modal */}
                  <button
                    onClick={() => onOpenEditSite(site)}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Edit site specifications"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete site */}
                  <button
                    onClick={() => {
                      onDeleteSite(site.id);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Delete site contract"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Add Visit Log Button */}
                  <button
                    onClick={() => onOpenInspect(site)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isVisited
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800'
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
