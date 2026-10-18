import React, { useState } from 'react';
import { BuildingSite, Technician } from '../types';
import {
  ShieldAlert,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  UserCheck,
  Search,
  Filter,
  Trash2,
  Plus,
  X,
  Mail,
  Phone,
  Briefcase,
  User,
  Shield,
  Database,
} from 'lucide-react';
import { exportSitesToCsv } from '../utils/exportReport';
import { Language, translations } from '../utils/translations';

interface AdminPortalProps {
  sites: BuildingSite[];
  technicians: Technician[];
  currentTechnician: Technician;
  language: Language;
  onUpdateSite: (site: BuildingSite) => void;
  onDeleteSite: (siteId: string) => void;
  onBatchReassign: (targetEmail: string, siteIds: string[]) => void;
  onAddTechnician: (tech: Technician) => void;
  onDeleteTechnician: (techId: string) => void;
  onResetData: () => void;
  onOpenSupabaseConnect?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  sites,
  technicians,
  currentTechnician,
  language,
  onUpdateSite,
  onDeleteSite,
  onBatchReassign,
  onAddTechnician,
  onDeleteTechnician,
  onResetData,
  onOpenSupabaseConnect,
}) => {
  const t = translations[language];

  const [search, setSearch] = useState('');
  const [selectedTechFilter, setSelectedTechFilter] = useState('all');
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [reassignToEmail, setReassignToEmail] = useState(technicians[0]?.email || 'adam.osama60@gmail.com');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  const filteredSites = sites.filter((s) => {
    if (selectedTechFilter !== 'all' && s.assignedTechnicianEmail !== selectedTechFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.neighborhood.toLowerCase().includes(q) ||
        s.elevatorBrand.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectAll = () => {
    if (selectedSiteIds.length === filteredSites.length) {
      setSelectedSiteIds([]);
    } else {
      setSelectedSiteIds(filteredSites.map((s) => s.id));
    }
  };

  const handleToggleSite = (id: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyReassignment = () => {
    if (selectedSiteIds.length === 0) return;
    onBatchReassign(reassignToEmail, selectedSiteIds);
    const targetTech = technicians.find((tech) => tech.email === reassignToEmail);
    const msg = language === 'en'
      ? `Successfully reassigned ${selectedSiteIds.length} buildings to ${targetTech?.name || reassignToEmail}.`
      : `${selectedSiteIds.length} bina ${targetTech?.name || reassignToEmail} teknisyenine başarıyla devredildi.`;
    setSuccessToast(msg);
    setSelectedSiteIds([]);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleTogglePriority = (site: BuildingSite) => {
    const newPriority = site.priority === 'fault_alert' ? 'normal' : 'fault_alert';
    onUpdateSite({ ...site, priority: newPriority });
    const msg = language === 'en'
      ? `${site.name} priority changed to ${newPriority}`
      : `${site.name} öncelik durumu güncellendi: ${newPriority}`;
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const handleSaveNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const colors = ['bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600'];
    const avatarColor = colors[technicians.length % colors.length];

    const newTech: Technician = {
      id: `tech-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      phone: newMemberPhone.trim(),
      role: newMemberRole.trim() || (language === 'en' ? 'Field Service Technician' : 'Saha Servis Teknisyeni'),
      assignedCount: 0,
      avatarColor,
    };

    onAddTechnician(newTech);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPhone('');
    setNewMemberRole('');
    setIsAddMemberOpen(false);
    setSuccessToast(t.memberAddedToast);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleDeleteMember = (tech: Technician) => {
    const confirmMsg = language === 'en'
      ? `Are you sure you want to remove ${tech.name}? All their assigned sites will be transferred to Adam.`
      : `${tech.name} üyesini silmek istediğinizden emin misiniz? Atanmış binalar Adam hesabına aktarılacaktır.`;

    if (window.confirm(confirmMsg)) {
      onDeleteTechnician(tech.id);
      setSuccessToast(t.memberDeletedToast);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white border border-blue-900/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-mono uppercase tracking-wider font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.adminBadge}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{t.operationsDirector}:</span>
              <span className="text-blue-400">{currentTechnician.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {t.adminSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenSupabaseConnect && (
              <button
                onClick={onOpenSupabaseConnect}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Database className="w-4 h-4 text-indigo-200" />
                <span>Supabase Cloud DB</span>
              </button>
            )}
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addMemberBtn}</span>
            </button>
            <button
              onClick={() => exportSitesToCsv(sites, 'onetech_master_database')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadDatabase}</span>
            </button>
            <button
              onClick={onResetData}
              className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.resetData}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Success Toast */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 3. Team Roster & Member Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">{t.teamManagementTitle}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-semibold">
              {technicians.length}
            </span>
          </div>
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addMemberBtn}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((tech) => {
            const techSites = sites.filter((s) => s.assignedTechnicianEmail === tech.email);
            const visitedCount = techSites.filter((s) => Boolean(s.lastVisit)).length;
            const pct = techSites.length > 0 ? Math.round((visitedCount / techSites.length) * 100) : 0;
            const isDirector = tech.email === 'adam.osama60@gmail.com' || tech.name.toLowerCase().includes('adam');

            return (
              <div
                key={tech.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 relative group hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl ${tech.avatarColor || 'bg-blue-600'} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                      {tech.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900">{tech.name}</h3>
                        {isDirector && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{tech.role}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{tech.email}</p>
                    </div>
                  </div>

                  {/* Remove Member Button */}
                  {!isDirector ? (
                    <button
                      onClick={() => handleDeleteMember(tech)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={t.removeMemberBtn}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                </div>

                {/* Progress Bar & Site Count */}
                <div className="pt-1 border-t border-slate-100">
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                    <span>{t.maintenanceProgress}</span>
                    <span className="font-mono">{visitedCount}/{techSites.length} {t.buildingsCount} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {technicians.length <= 1 && (
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{t.noExtraMembers}</span>
            </div>
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {t.addMemberBtn}
            </button>
          </div>
        )}
      </div>

      {/* 4. Batch Assignment Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{t.batchReassignTitle}</h2>
            <span className="text-xs text-slate-500 font-mono">({filteredSites.length} {t.buildingsCount})</span>
          </div>

          {/* Mass Reassign Action */}
          {selectedSiteIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 p-1.5 rounded-xl text-xs">
              <span className="font-semibold text-blue-900 px-2">
                {selectedSiteIds.length} {t.selectedCount}
              </span>
              <span className="text-slate-500 font-medium">{t.reassignToLabel}</span>
              <select
                value={reassignToEmail}
                onChange={(e) => setReassignToEmail(e.target.value)}
                className="p-1.5 rounded-lg border border-blue-300 bg-white text-slate-800 font-medium text-xs outline-hidden"
              >
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.email}>
                    {tech.name} ({tech.role.split(' ')[0]})
                  </option>
                ))}
              </select>
              <button
                onClick={handleApplyReassignment}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                {t.applyReassignment}
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedTechFilter}
              onChange={(e) => setSelectedTechFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t.allTechPool}</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.email}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              {selectedSiteIds.length === filteredSites.length ? t.clearSelection : t.selectAll}
            </button>
          </div>
        </div>

        {/* Buildings Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={filteredSites.length > 0 && selectedSiteIds.length === filteredSites.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3 text-left">{t.tableColSite}</th>
                <th className="px-3 py-3 text-left">{t.neighborhoodLabel}</th>
                <th className="px-3 py-3 text-left">{t.tableColSpecs}</th>
                <th className="px-3 py-3 text-left">{t.tableColAssigned}</th>
                <th className="px-3 py-3 text-left">{t.doorCodeLabel}</th>
                <th className="px-3 py-3 text-center">{t.tableColActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSites.map((site) => {
                const isSelected = selectedSiteIds.includes(site.id);
                const assignedTech = technicians.find((tech) => tech.email === site.assignedTechnicianEmail);

                return (
                  <tr
                    key={site.id}
                    className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSite(site.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      <div className="font-bold">{site.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{site.address}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 font-medium">
                      {site.neighborhood}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <span className="font-semibold text-slate-800">{site.elevatorBrand}</span> ({site.elevatorUnits} {t.unitsCount}, {site.floors} {t.floorsCount})
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        <UserCheck className="w-3 h-3 text-blue-600" />
                        {assignedTech?.name || site.assignedTechnicianEmail.split('@')[0]}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px]">
                      {site.accessCode ? (
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 font-bold">
                          {site.accessCode}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleTogglePriority(site)}
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                            site.priority === 'fault_alert'
                              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Toggle Fault / Priority Alert"
                        >
                          {site.priority === 'fault_alert' ? 'Fault Alert' : 'Normal'}
                        </button>
                        <button
                          onClick={() => onDeleteSite(site.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title={t.deleteBtn}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{t.addMemberModalTitle}</h3>
                  <p className="text-[11px] text-slate-400">{t.addMemberModalSubtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.memberNameLabel} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder={t.memberNamePlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.memberEmailLabel} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder={t.memberEmailPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.memberRoleLabel}
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    placeholder={t.memberRolePlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.memberPhoneLabel}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder={t.memberPhonePlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95"
                >
                  {t.saveMemberBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
