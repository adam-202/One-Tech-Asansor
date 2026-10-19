import React, { useState, useMemo } from 'react';
import { BuildingSite, Technician, VisitRecord } from '../types';
import { Language, translations } from '../utils/translations';
import { TECHNICIANS } from '../data/seedSites';
import {
  FileSpreadsheet,
  Mail,
  Download,
  Copy,
  Check,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Send,
  Building2,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';
import {
  exportSitesToCsv,
  generateEmailReport,
  buildMailtoUrl,
  ReportPeriod,
  ReportSummaryData,
} from '../utils/exportReport';

interface ReportsViewProps {
  sites: BuildingSite[];
  currentTechnician: Technician;
  technicians?: Technician[];
  language?: Language;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sites,
  currentTechnician,
  technicians = TECHNICIANS,
  language = 'en',
}) => {
  const activeTechnicians: Technician[] = technicians && technicians.length > 0 ? technicians : TECHNICIANS;
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('daily');
  const [selectedTechEmail, setSelectedTechEmail] = useState<string>(currentTechnician.email);
  const [recipientEmail, setRecipientEmail] = useState<string>('supervisor@elevatormaintenance.com');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Filter sites for the selected report target
  const targetSites = useMemo(() => {
    if (selectedTechEmail === 'all') return sites;
    return sites.filter((s) => s.assignedTechnicianEmail === selectedTechEmail);
  }, [sites, selectedTechEmail]);

  const visitedSites = useMemo(() => {
    return targetSites.filter((s) => Boolean(s.lastVisit));
  }, [targetSites]);

  const pendingSites = useMemo(() => {
    return targetSites.filter((s) => !s.lastVisit);
  }, [targetSites]);

  const criticalIssues = useMemo(() => {
    return targetSites.filter((s) => s.lastVisit?.status === 'critical');
  }, [targetSites]);

  const attentionNeeded = useMemo(() => {
    return targetSites.filter((s) => s.lastVisit?.status === 'attention_needed');
  }, [targetSites]);

  // Today's completed sites (for Daily wrap-up)
  const todayStr = new Date().toISOString().slice(0, 10);
  const completedToday = useMemo(() => {
    return targetSites.filter(
      (s) => s.lastVisit && (s.lastVisit.date === todayStr || s.lastVisit.date === '2026-10-02')
    );
  }, [targetSites, todayStr]);

  const selectedTech = activeTechnicians.find((t) => t.email === selectedTechEmail) || {
    name: 'All Field Specialists',
    email: 'team@elevatormaintenance.com',
  };

  const completionRate =
    targetSites.length > 0 ? (visitedSites.length / targetSites.length) * 100 : 0;

  // Build current email report content
  const emailReport = useMemo(() => {
    const summaryData: ReportSummaryData = {
      period: reportPeriod,
      dateStr: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      technicianName: selectedTech.name,
      technicianEmail: selectedTech.email,
      totalAssigned: targetSites.length,
      visitedCount: visitedSites.length,
      pendingCount: pendingSites.length,
      completionRate,
      criticalIssues,
      attentionNeeded,
      completedTodaySites: completedToday,
    };

    return generateEmailReport(summaryData);
  }, [
    reportPeriod,
    selectedTech,
    targetSites,
    visitedSites,
    pendingSites,
    completionRate,
    criticalIssues,
    attentionNeeded,
    completedToday,
  ]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`${emailReport.subject}\n\n${emailReport.body}`);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleExportAllCsv = () => {
    exportSitesToCsv(sites, 'elevator_master_audit_october_2026');
  };

  const handleExportVisitedCsv = () => {
    exportSitesToCsv(visitedSites, 'elevator_completed_visits_october_2026');
  };

  const handleExportPendingCsv = () => {
    exportSitesToCsv(pendingSites, 'elevator_pending_routes_october_2026');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Auditing & Automated Dispatch Reporting</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">October 2026 Cycle</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Reports, Excel Spreadsheets & Email Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Export timestamped completion logs to Excel/CSV or dispatch structured daily, weekly, and monthly email summaries.
            </p>
          </div>

          {/* Quick Spreadsheet Exports */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportAllCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export Master Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* Global Progress Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Total Contracts</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {sites.length}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">100% Monthly Target</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/60">
            <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Visited & Verified</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 font-mono tabular-nums">
              {sites.filter((s) => s.lastVisit).length}
            </p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              {Math.round((sites.filter((s) => s.lastVisit).length / sites.length) * 100)}% Month Completion
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/60">
            <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Pending Sites</span>
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 font-mono tabular-nums">
              {sites.filter((s) => !s.lastVisit).length}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">Queued for Route Optimizer</p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/60">
            <div className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Safety Attention</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-900 dark:text-rose-100 font-mono tabular-nums">
              {sites.filter((s) => s.lastVisit && s.lastVisit.status !== 'passed').length}
            </p>
            <p className="text-[11px] text-rose-700 dark:text-rose-400">Minor defects & repairs</p>
          </div>
        </div>
      </div>

      {/* Technician Team Breakdown */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs backdrop-blur-md">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Field Team Monthly Portfolio Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {activeTechnicians.map((tech) => {
            const techSites = sites.filter((s) => s.assignedTechnicianEmail === tech.email);
            const techVisited = techSites.filter((s) => s.lastVisit).length;
            const techRate = techSites.length > 0 ? (techVisited / techSites.length) * 100 : 0;

            return (
              <div
                key={tech.id}
                onClick={() => setSelectedTechEmail(tech.email)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedTechEmail === tech.email
                    ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-7 h-7 rounded-full ${tech.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                    {tech.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{tech.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{tech.role}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-600 dark:text-slate-400">{techVisited}/{techSites.length} Visited</span>
                  <span className="font-bold text-slate-900 dark:text-white">{techRate.toFixed(0)}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${techRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Email Report Generator & Live Dispatch Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Report Controls & Download Buttons (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 backdrop-blur-md">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Email Report Configuration</span>
            </h2>

            {/* Frequency Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Report Frequency / Period
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'daily' as const, label: 'Daily Route' },
                  { id: 'weekly' as const, label: 'Weekly Summary' },
                  { id: 'monthly' as const, label: 'Monthly Audit' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setReportPeriod(item.id)}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                      reportPeriod === item.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Technician Scope */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Technician Scope
              </label>
              <select
                value={selectedTechEmail}
                onChange={(e) => setSelectedTechEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-hidden font-medium cursor-pointer"
              >
                <option value="all">Entire Maintenance Team ({sites.length} sites)</option>
                {activeTechnicians.map((t) => (
                  <option key={t.id} value={t.email}>
                    {t.name} ({t.assignedCount} sites)
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Email Address */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Recipient Email (Supervisor / Owner)
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="supervisor@elevatormaintenance.com"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 outline-hidden text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={buildMailtoUrl(emailReport.subject, emailReport.body, recipientEmail)}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in Email Client (Mailto)</span>
              </a>

              <button
                onClick={handleCopyEmail}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Formatted Text</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick CSV Export Box */}
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3 backdrop-blur-md">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Spreadsheet Downloads (Excel & Sheets)</span>
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Generates RFC 4180 compliant CSV files with full audit timestamps, safety checklist results, building contacts, and access codes.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleExportVisitedCsv}
                className="w-full py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Visited Sites Only ({visitedSites.length})</span>
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              </button>

              <button
                onClick={handleExportPendingCsv}
                className="w-full py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Pending Route Sites ({pendingSites.length})</span>
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Email Preview Box (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/95 dark:bg-slate-900/95 rounded-2xl p-5 border border-slate-800 shadow-xl text-slate-200 flex flex-col h-full backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Email Report Preview
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                To: {recipientEmail}
              </span>
            </div>

            <div className="mt-3 py-1.5 px-3 bg-slate-950/80 rounded-lg border border-slate-800 font-mono text-xs text-blue-300 truncate">
              Subject: {emailReport.subject}
            </div>

            <div className="mt-3 flex-1 bg-slate-950/60 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[500px]">
              {emailReport.body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
