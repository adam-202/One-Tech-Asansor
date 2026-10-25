import React, { useState, useEffect } from 'react';
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
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Pencil,
  MapPin,
  CheckSquare,
  Square,
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
  onUpdateTechnician?: (tech: Technician) => void;
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
  onUpdateTechnician,
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
  const [newMemberPassword, setNewMemberPassword] = useState('tech123');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberIsAdmin, setNewMemberIsAdmin] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Reset Password Modal State
  const [resettingTech, setResettingTech] = useState<Technician | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Edit Member Modal State
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberRole, setEditMemberRole] = useState('');
  const [editMemberColor, setEditMemberColor] = useState('bg-blue-600');
  const [editMemberIsAdmin, setEditMemberIsAdmin] = useState(false);

  // Assign Sites to Member Modal State
  const [assigningTech, setAssigningTech] = useState<Technician | null>(null);
  const [assignedSiteIdsForModal, setAssignedSiteIdsForModal] = useState<string[]>([]);
  const [assignModalSearch, setAssignModalSearch] = useState('');
  const [assignModalNeighborhood, setAssignModalNeighborhood] = useState('all');
  const [assignModalFilterMode, setAssignModalFilterMode] = useState<'all' | 'assigned' | 'other'>('all');

  // Handle mobile swipe back / browser back for sub-modals
  useEffect(() => {
    const isAnySubModalOpen = isAddMemberOpen || Boolean(editingTech) || Boolean(assigningTech) || Boolean(resettingTech);
    if (!isAnySubModalOpen) return;

    window.history.pushState({ adminSubModal: true }, '');

    const handlePopState = () => {
      setIsAddMemberOpen(false);
      setEditingTech(null);
      setAssigningTech(null);
      setResettingTech(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAddMemberOpen, editingTech, assigningTech, resettingTech]);

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

  const handleOpenResetPassword = (tech: Technician) => {
    setResettingTech(tech);
    setResetPasswordInput(tech.password || (tech.isAdmin ? 'onetech2026' : 'tech123'));
  };

  const handleSavePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingTech || !resetPasswordInput.trim()) return;

    const updatedTech: Technician = {
      ...resettingTech,
      password: resetPasswordInput.trim(),
    };

    if (onUpdateTechnician) {
      onUpdateTechnician(updatedTech);
    }
    setResettingTech(null);
    setResetPasswordInput('');
    setSuccessToast(
      language === 'en'
        ? `Login password updated for ${updatedTech.name}!`
        : `${updatedTech.name} için giriş şifresi güncellendi!`
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Open Edit Member Modal
  const handleOpenEditMember = (tech: Technician) => {
    setEditingTech(tech);
    setEditMemberName(tech.name);
    setEditMemberEmail(tech.email);
    setEditMemberPhone(tech.phone || '');
    setEditMemberRole(tech.role || '');
    setEditMemberColor(tech.avatarColor || 'bg-blue-600');
    setEditMemberIsAdmin(Boolean(tech.isAdmin || tech.email === 'adam.osama60@gmail.com'));
  };

  // Save Edit Member
  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTech || !editMemberName.trim() || !editMemberEmail.trim()) return;

    const oldEmail = editingTech.email;
    const newEmail = editMemberEmail.trim();

    const updatedTech: Technician = {
      ...editingTech,
      name: editMemberName.trim(),
      email: newEmail,
      phone: editMemberPhone.trim(),
      role: editMemberRole.trim() || editingTech.role,
      avatarColor: editMemberColor,
      isAdmin: editMemberIsAdmin,
    };

    if (onUpdateTechnician) {
      onUpdateTechnician(updatedTech);
    }

    // If email changed, reassign their existing sites to new email
    if (oldEmail !== newEmail) {
      const techSiteIds = sites
        .filter((s) => s.assignedTechnicianEmail === oldEmail)
        .map((s) => s.id);
      if (techSiteIds.length > 0) {
        onBatchReassign(newEmail, techSiteIds);
      }
    }

    setEditingTech(null);
    setSuccessToast(
      language === 'en'
        ? `Updated profile for ${updatedTech.name}!`
        : `${updatedTech.name} profili başarıyla güncellendi!`
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Open Assign Sites Modal
  const handleOpenAssignSites = (tech: Technician) => {
    setAssigningTech(tech);
    const currentIds = sites
      .filter((s) => s.assignedTechnicianEmail === tech.email)
      .map((s) => s.id);
    setAssignedSiteIdsForModal(currentIds);
    setAssignModalSearch('');
    setAssignModalNeighborhood('all');
    setAssignModalFilterMode('all');
  };

  // Toggle single site assignment in modal
  const handleToggleSiteInAssignModal = (siteId: string) => {
    setAssignedSiteIdsForModal((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  // Select all visible sites in modal
  const handleSelectAllVisibleSites = (visibleSiteIds: string[]) => {
    setAssignedSiteIdsForModal((prev) => {
      const set = new Set([...prev, ...visibleSiteIds]);
      return Array.from(set);
    });
  };

  // Deselect all visible sites in modal
  const handleDeselectAllVisibleSites = (visibleSiteIds: string[]) => {
    setAssignedSiteIdsForModal((prev) =>
      prev.filter((id) => !visibleSiteIds.includes(id))
    );
  };

  // Save all site assignments from modal
  const handleSaveAssignSites = () => {
    if (!assigningTech) return;

    // Sites currently assigned to this tech in the main state
    const previouslyAssigned = sites
      .filter((s) => s.assignedTechnicianEmail === assigningTech.email)
      .map((s) => s.id);

    // Newly added to this tech
    const addedSiteIds = assignedSiteIdsForModal.filter((id) => !previouslyAssigned.includes(id));
    // Removed from this tech
    const removedSiteIds = previouslyAssigned.filter((id) => !assignedSiteIdsForModal.includes(id));

    // Assign newly added to this tech
    if (addedSiteIds.length > 0) {
      onBatchReassign(assigningTech.email, addedSiteIds);
    }

    // Return removed sites to Adam (or shared)
    if (removedSiteIds.length > 0) {
      const fallbackEmail =
        assigningTech.email === 'adam.osama60@gmail.com'
          ? 'shared@elevatortech.io'
          : 'adam.osama60@gmail.com';
      onBatchReassign(fallbackEmail, removedSiteIds);
    }

    const count = assignedSiteIdsForModal.length;
    setSuccessToast(
      language === 'en'
        ? `Updated building allocations for ${assigningTech.name} (${count} buildings assigned)!`
        : `${assigningTech.name} için bina atamaları güncellendi (${count} bina atandı)!`
    );
    setAssigningTech(null);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSaveNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const colors = ['bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-indigo-600'];
    const avatarColor = colors[technicians.length % colors.length];

    const newTech: Technician = {
      id: `tech-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim().toLowerCase(),
      password: newMemberPassword.trim() || 'tech123',
      isAdmin: newMemberIsAdmin,
      phone: newMemberPhone.trim(),
      role: newMemberRole.trim() || (language === 'en' ? 'Field Service Technician' : 'Saha Servis Teknisyeni'),
      assignedCount: 0,
      avatarColor,
    };

    onAddTechnician(newTech);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberPassword('tech123');
    setNewMemberPhone('');
    setNewMemberRole('');
    setNewMemberIsAdmin(false);
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
            {/* Quick Director Profile & Buildings Shortcuts */}
            <button
              onClick={() => handleOpenEditMember(currentTechnician)}
              className="px-3.5 py-2 bg-blue-800/80 hover:bg-blue-700 text-white border border-blue-400/30 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              title={language === 'en' ? 'Edit Director Profile' : 'Direktör Profilini Düzenle'}
            >
              <Pencil className="w-4 h-4 text-blue-300" />
              <span>{language === 'en' ? 'Edit Profile' : 'Profili Düzenle'}</span>
            </button>
            <button
              onClick={() => handleOpenAssignSites(currentTechnician)}
              className="px-3.5 py-2 bg-cyan-700/80 hover:bg-cyan-600 text-white border border-cyan-400/30 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
              title={language === 'en' ? 'Manage My Buildings' : 'Bina Atamalarım'}
            >
              <MapPin className="w-4 h-4 text-cyan-200" />
              <span>{language === 'en' ? 'My Buildings' : 'Bina Atamalarım'}</span>
            </button>

            {onOpenSupabaseConnect && (
              <button
                onClick={onOpenSupabaseConnect}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Database className="w-4 h-4 text-indigo-200" />
                <span>Supabase Cloud DB</span>
              </button>
            )}
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addMemberBtn}</span>
            </button>
            <button
              onClick={() => exportSitesToCsv(sites, 'onetech_master_database')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t.downloadDatabase}</span>
            </button>
            <button
              onClick={onResetData}
              className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.resetData}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Success Toast */}
      {successToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 3. Team Roster & Member Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t.teamManagementTitle}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-mono font-semibold">
              {technicians.length}
            </span>
          </div>
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
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
            const isDirector = tech.isAdmin || tech.email === 'adam.osama60@gmail.com' || tech.name.toLowerCase().includes('adam');
            const currentPass = tech.password || (isDirector ? 'onetech2026' : 'tech123');

            return (
              <div
                key={tech.id}
                className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative group hover:border-blue-300 dark:hover:border-blue-500/60 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl ${tech.avatarColor || 'bg-blue-600'} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                      {tech.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{tech.name}</h3>
                        {isDirector && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{tech.role}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{tech.email}</p>
                    </div>
                  </div>

                  {/* Actions in Header */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditMember(tech)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title={language === 'en' ? 'Edit Member Profile' : 'Profili Düzenle'}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!isDirector ? (
                      <button
                        onClick={() => handleDeleteMember(tech)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title={t.removeMemberBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="p-1.5 text-blue-600 dark:text-blue-400" title={language === 'en' ? 'Operations Director (Protected)' : 'Operasyon Direktörü'}>
                        <Shield className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Password & Credentials Pill */}
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {language === 'en' ? 'Pass:' : 'Şifre:'}
                    </span>
                    <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 font-bold tracking-wider">
                      {revealedPasswords[tech.id] ? currentPass : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedPasswords((prev) => ({
                          ...prev,
                          [tech.id]: !prev[tech.id],
                        }))
                      }
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      title="Reveal password"
                    >
                      {revealedPasswords[tech.id] ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenResetPassword(tech)}
                    className="px-2 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'Change' : 'Şifre Değiştir'}
                  </button>
                </div>

                {/* Progress Bar & Site Count */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    <span>{t.maintenanceProgress}</span>
                    <span className="font-mono">{visitedCount}/{techSites.length} {t.buildingsCount} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Quick Action Bar: Assign Buildings & Edit Profile */}
                <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenAssignSites(tech)}
                    className="flex-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{language === 'en' ? 'Assign Buildings' : 'Bina Ata / Düzenle'}</span>
                    <span className="ml-0.5 px-1.5 py-0.2 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-md text-[10px] font-mono">
                      {techSites.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditMember(tech)}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title={language === 'en' ? 'Edit Profile' : 'Profili Düzenle'}
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Edit' : 'Düzenle'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {technicians.length <= 1 && (
          <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{t.noExtraMembers}</span>
            </div>
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
            >
              {t.addMemberBtn}
            </button>
          </div>
        )}
      </div>

      {/* 4. Batch Assignment Toolbar */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.batchReassignTitle}</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">({filteredSites.length} {t.buildingsCount})</span>
          </div>

          {/* Mass Reassign Action */}
          {selectedSiteIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 p-1.5 rounded-xl text-xs">
              <span className="font-semibold text-blue-900 dark:text-blue-200 px-2">
                {selectedSiteIds.length} {t.selectedCount}
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">{t.reassignToLabel}</span>
              <select
                value={reassignToEmail}
                onChange={(e) => setReassignToEmail(e.target.value)}
                className="p-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium text-xs outline-hidden"
              >
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.email}>
                    {tech.name} ({tech.role.split(' ')[0]})
                  </option>
                ))}
              </select>
              <button
                onClick={handleApplyReassignment}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
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
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white dark:placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedTechFilter}
              onChange={(e) => setSelectedTechFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              {selectedSiteIds.length === filteredSites.length ? t.clearSelection : t.selectAll}
            </button>
          </div>
        </div>

        {/* Buildings Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-semibold">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900/60">
              {filteredSites.map((site) => {
                const isSelected = selectedSiteIds.includes(site.id);
                const assignedTech = technicians.find((tech) => tech.email === site.assignedTechnicianEmail);

                return (
                  <tr
                    key={site.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-blue-50/40 dark:bg-blue-950/40' : ''}`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSite(site.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">
                      <div className="font-bold">{site.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{site.address}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300 font-medium">
                      {site.neighborhood}
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{site.elevatorBrand}</span> ({site.elevatorUnits} {t.unitsCount}, {site.floors} {t.floorsCount})
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                        <UserCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        {assignedTech?.name || site.assignedTechnicianEmail.split('@')[0]}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px]">
                      {site.accessCode ? (
                        <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800/80 font-bold">
                          {site.accessCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleTogglePriority(site)}
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            site.priority === 'fault_alert'
                              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                          title="Toggle Fault / Priority Alert"
                        >
                          {site.priority === 'fault_alert' ? 'Fault Alert' : 'Normal'}
                        </button>
                        <button
                          onClick={() => onDeleteSite(site.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
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
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'Login Password *' : 'Giriş Şifresi *'}
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="e.g. tech123"
                    className="w-full pl-9 pr-20 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMemberPassword(`tech${Math.floor(100 + Math.random() * 900)}`)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-medium cursor-pointer"
                    >
                      {language === 'en' ? 'Gen' : 'Oto'}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {language === 'en'
                    ? 'Default is tech123. Employee will use this password to sign in.'
                    : 'Varsayılan tech123. Çalışan bu şifre ile giriş yapacaktır.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.memberRoleLabel}
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    placeholder={t.memberRolePlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.memberPhoneLabel}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder={t.memberPhonePlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Admin Access Checkbox */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="adminRoleCheckbox"
                  checked={newMemberIsAdmin}
                  onChange={(e) => setNewMemberIsAdmin(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="adminRoleCheckbox" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span className="font-bold block text-slate-900 dark:text-white">
                    {language === 'en' ? 'Grant Administrator Privileges' : 'Yönetici Yetkisi Ver'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                    {language === 'en'
                      ? 'Allows access to the Operations Director Portal and team credential management.'
                      : 'Operasyon Yöneticisi Paneline ve çalışan hesaplarını yönetme yetkisine sahip olur.'}
                  </span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {t.saveMemberBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Reset Password Modal */}
      {resettingTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {language === 'en' ? 'Reset Employee Password' : 'Şifre Değiştir'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                    {resettingTech.name} ({resettingTech.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResettingTech(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePasswordReset} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'en' ? 'New Password' : 'Yeni Şifre'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={resetPasswordInput}
                    onChange={(e) => setResetPasswordInput(e.target.value)}
                    placeholder="e.g. tech2026"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setResetPasswordInput(`tech${Math.floor(100 + Math.random() * 900)}`)}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 font-medium cursor-pointer"
                  >
                    🎲 {language === 'en' ? 'Generate Random' : 'Rastgele Oluştur'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetPasswordInput('tech123')}
                    className="text-[10px] text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
                  >
                    {language === 'en' ? 'Default: tech123' : 'Varsayılan: tech123'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResettingTech(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {language === 'en' ? 'Save Password' : 'Şifreyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit Member Profile Modal */}
      {editingTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl ${editMemberColor} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                  {editMemberName ? editMemberName[0] : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {language === 'en' ? 'Edit Member Profile' : 'Ekip Üyesi Profilini Düzenle'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[220px]">
                    {editingTech.name} • {editingTech.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTech(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.memberNameLabel}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={editMemberName}
                    onChange={(e) => setEditMemberName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.memberRoleLabel}
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={editMemberRole}
                    onChange={(e) => setEditMemberRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.memberEmailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={editMemberEmail}
                    onChange={(e) => setEditMemberEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.memberPhoneLabel}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={editMemberPhone}
                    onChange={(e) => setEditMemberPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'en' ? 'Badge Color' : 'Rozet Rengi'}
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    'bg-blue-600',
                    'bg-emerald-600',
                    'bg-purple-600',
                    'bg-amber-600',
                    'bg-rose-600',
                    'bg-teal-600',
                    'bg-indigo-600',
                    'bg-slate-700',
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditMemberColor(color)}
                      className={`w-7 h-7 rounded-lg ${color} transition-transform cursor-pointer ${
                        editMemberColor === color ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Admin Privileges Toggle */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={editMemberIsAdmin}
                    onChange={(e) => setEditMemberIsAdmin(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'en' ? 'Administrator Privileges' : 'Yönetici Yetkisi (Admin Portalı ve Şifre Yönetimi)'}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'en'
                        ? 'Grants access to admin portal, member passwords and master data export.'
                        : 'Bu üyeye tam operasyon yetkisi, şifre görme ve bina dağıtım kontrolü verir.'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTech(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {language === 'en' ? 'Save Profile Changes' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Assign Buildings to Technician Modal */}
      {assigningTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl ${assigningTech.avatarColor || 'bg-blue-600'} flex items-center justify-center font-bold text-white text-base shadow-md`}>
                  {assigningTech.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">
                      {language === 'en' ? 'Manage Building Allocations' : 'Bina Atamalarını Yönet'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {assignedSiteIdsForModal.length} / {sites.length} {language === 'en' ? 'Assigned' : 'Atanmış'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    {assigningTech.name} ({assigningTech.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningTech(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 space-y-2.5 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={assignModalSearch}
                    onChange={(e) => setAssignModalSearch(e.target.value)}
                    placeholder={language === 'en' ? 'Search buildings or brand...' : 'Bina adı veya asansör markası ara...'}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={assignModalNeighborhood}
                    onChange={(e) => setAssignModalNeighborhood(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">{language === 'en' ? 'All Neighborhoods' : 'Tüm Bölgeler'}</option>
                    {Array.from(new Set(sites.map((s) => s.neighborhood))).filter(Boolean).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Actions & Filters */}
              {(() => {
                const visibleSites = sites.filter((s) => {
                  if (assignModalNeighborhood !== 'all' && s.neighborhood !== assignModalNeighborhood) return false;
                  if (assignModalSearch) {
                    const q = assignModalSearch.toLowerCase();
                    if (!s.name.toLowerCase().includes(q) && !s.address.toLowerCase().includes(q) && !s.elevatorBrand.toLowerCase().includes(q)) {
                      return false;
                    }
                  }
                  if (assignModalFilterMode === 'assigned') {
                    return assignedSiteIdsForModal.includes(s.id);
                  }
                  if (assignModalFilterMode === 'other') {
                    return !assignedSiteIdsForModal.includes(s.id);
                  }
                  return true;
                });
                const visibleIds = visibleSites.map((s) => s.id);

                return (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAssignModalFilterMode('all')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          assignModalFilterMode === 'all'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {language === 'en' ? 'All' : 'Tümü'} ({sites.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignModalFilterMode('assigned')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          assignModalFilterMode === 'assigned'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {language === 'en' ? 'Assigned' : 'Bu Teknisyende'} ({assignedSiteIdsForModal.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignModalFilterMode('other')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          assignModalFilterMode === 'other'
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {language === 'en' ? 'Unassigned / Others' : 'Diğerleri'} ({sites.length - assignedSiteIdsForModal.length})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAllVisibleSites(visibleIds)}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        {language === 'en' ? 'Select Filtered' : 'Görünenleri Seç'}
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={() => handleDeselectAllVisibleSites(visibleIds)}
                        className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        {language === 'en' ? 'Clear Filtered' : 'Görünenleri Kaldır'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Buildings Scroll List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800">
              {(() => {
                const visibleSites = sites.filter((s) => {
                  if (assignModalNeighborhood !== 'all' && s.neighborhood !== assignModalNeighborhood) return false;
                  if (assignModalSearch) {
                    const q = assignModalSearch.toLowerCase();
                    if (!s.name.toLowerCase().includes(q) && !s.address.toLowerCase().includes(q) && !s.elevatorBrand.toLowerCase().includes(q)) {
                      return false;
                    }
                  }
                  if (assignModalFilterMode === 'assigned') {
                    return assignedSiteIdsForModal.includes(s.id);
                  }
                  if (assignModalFilterMode === 'other') {
                    return !assignedSiteIdsForModal.includes(s.id);
                  }
                  return true;
                });

                if (visibleSites.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                      {language === 'en' ? 'No buildings match your filter.' : 'Filtreye uygun bina bulunamadı.'}
                    </div>
                  );
                }

                return visibleSites.map((site) => {
                  const isChecked = assignedSiteIdsForModal.includes(site.id);
                  const currentOwner = technicians.find((t) => t.email === site.assignedTechnicianEmail);
                  const isAssignedToOther = site.assignedTechnicianEmail && site.assignedTechnicianEmail !== assigningTech.email;

                  return (
                    <div
                      key={site.id}
                      onClick={() => handleToggleSiteInAssignModal(site.id)}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-blue-50/80 dark:bg-blue-950/60 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="shrink-0 text-blue-600 dark:text-blue-400">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {site.name}
                            </h4>
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {site.elevatorBrand || 'KONE'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{site.neighborhood} • {site.address}</p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {isChecked ? (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {language === 'en' ? 'Assigned' : 'Atandı'}
                          </span>
                        ) : isAssignedToOther ? (
                          <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                            {language === 'en' ? `Currently: ${currentOwner?.name || 'Other'}` : `Şu an: ${currentOwner?.name || 'Diğer'}`}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {language === 'en' ? 'Shared Pool' : 'Ortak Havuz'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-white">{assignedSiteIdsForModal.length}</span> {language === 'en' ? 'buildings selected for' : 'bina seçildi:'}{' '}
                <span className="font-semibold text-blue-700 dark:text-blue-300">{assigningTech.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningTech(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignSites}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'en' ? 'Save Building Allocations' : 'Atamaları Kaydet'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
