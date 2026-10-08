import React, { useState, useMemo } from 'react';
import { BuildingSite, Technician, VisitRecord } from '../types';
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
}

export const ReportsView: React.FC<ReportsViewProps> = ({ sites, currentTechnician }) => {
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

  const selectedTech = TECHNICIANS.find((t) => t.email === selectedTechEmail) || {
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
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Auditing & Automated Dispatch Reporting</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-800 font-semibold">October 2026 Cycle</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Reports, Excel Spreadsheets & Email Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Export timestamped completion logs to Excel/CSV or dispatch structured daily, weekly, and monthly email summaries.
            </p>
          </div>

          {/* Quick Spreadsheet Exports */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportAllCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Master Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* Global Progress Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Total Contracts</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {sites.length}
            </p>
            <p className="text-[11px] text-slate-500">100% Monthly Target</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Visited & Verified</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-900 font-mono tabular-nums">
              {sites.filter((s) => s.lastVisit).length}
            </p>
            <p className="text-[11px] text-emerald-700">
              {Math.round((sites.filter((s) => s.lastVisit).length / sites.length) * 100)}% Month Completion
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Pending Sites</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-900 font-mono tabular-nums">
              {sites.filter((s) => !s.lastVisit).length}
            </p>
            <p className="text-[11px] text-amber-700">Queued for Route Optimizer</p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Safety Attention</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-900 font-mono tabular-nums">
              {sites.filter((s) => s.lastVisit && s.lastVisit.status !== 'passed').length}
            </p>
            <p className="text-[11px] text-rose-700">Minor defects & repairs</p>
          </div>
        </div>
      </div>

      {/* Technician Team Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Field Team Monthly Portfolio Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {TECHNICIANS.map((tech) => {
            const techSites = sites.filter((s) => s.assignedTechnicianEmail === tech.email);
            const techVisited = techSites.filter((s) => s.lastVisit).length;
            const techRate = techSites.length > 0 ? (techVisited / techSites.length) * 100 : 0;

            return (
              <div
                key={tech.id}
                onClick={() => setSelectedTechEmail(tech.email)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedTechEmail === tech.email
                    ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-7 h-7 rounded-full ${tech.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                    {tech.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{tech.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{tech.role}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-600">{techVisited}/{techSites.length} Visited</span>
                  <span className="font-bold text-slate-900">{techRate.toFixed(0)}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Email Report Configuration</span>
            </h2>

            {/* Frequency Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
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
                    className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      reportPeriod === item.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Technician Scope */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Technician Scope
              </label>
              <select
                value={selectedTechEmail}
                onChange={(e) => setSelectedTechEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-hidden font-medium"
              >
                <option value="all">Entire Maintenance Team ({sites.length} sites)</option>
                {TECHNICIANS.map((t) => (
                  <option key={t.id} value={t.email}>
                    {t.name} ({t.assignedCount} sites)
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Email Address */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Recipient Email (Supervisor / Owner)
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="supervisor@elevatormaintenance.com"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 outline-hidden text-slate-900"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={buildMailtoUrl(emailReport.subject, emailReport.body, recipientEmail)}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in Email Client (Mailto)</span>
              </a>

              <button
                onClick={handleCopyEmail}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-200"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Spreadsheet Downloads (Excel & Sheets)</span>
            </h2>

            <p className="text-xs text-slate-600">
              Generates RFC 4180 compliant CSV files with full audit timestamps, safety checklist results, building contacts, and access codes.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleExportVisitedCsv}
                className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between transition-colors"
              >
                <span>Visited Sites Only ({visitedSites.length})</span>
                <Download className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={handleExportPendingCsv}
                className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between transition-colors"
              >
                <span>Pending Route Sites ({pendingSites.length})</span>
                <Download className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Email Preview Box (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl text-slate-200 flex flex-col h-full">
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
