import React, { useState, useRef, useEffect } from 'react';
import { BuildingSite, Technician } from '../types';
import { Language } from '../utils/translations';
import {
  ParsedImportRow,
  parseExcelFile,
  parseCsvText,
  parseWhatsAppText,
  generateSampleCsvTemplate,
} from '../utils/importParser';
import {
  X,
  Upload,
  FileSpreadsheet,
  Clipboard,
  MessageSquare,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
  Database,
  Building2,
  Sparkles,
} from 'lucide-react';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSites: BuildingSite[];
  currentTechnician: Technician;
  onBatchSave: (importedSites: BuildingSite[], updateExisting: boolean) => void;
  language?: Language;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  existingSites,
  currentTechnician,
  onBatchSave,
  language = 'tr',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'file' | 'clipboard' | 'whatsapp'>('file');
  const [pasteText, setPasteText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rows: ParsedImportRow[] = [];

      if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        rows = parseExcelFile(buffer, existingSites, currentTechnician.email);
      } else {
        const text = await file.text();
        rows = parseCsvText(text, existingSites, currentTechnician.email);
      }

      setParsedRows(rows);
      setSelectedIndices(new Set(rows.map((_, idx) => idx)));
    } catch (err) {
      console.error('Error parsing spreadsheet file:', err);
      alert('Failed to parse file. Please check file format.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  // Parse clipboard text
  const handleParseClipboard = () => {
    if (!pasteText.trim()) return;
    setIsProcessing(true);
    try {
      const rows =
        activeTab === 'whatsapp'
          ? parseWhatsAppText(pasteText, existingSites, currentTechnician.email)
          : parseCsvText(pasteText, existingSites, currentTechnician.email);
      setParsedRows(rows);
      setSelectedIndices(new Set(rows.map((_, idx) => idx)));
    } catch (err) {
      console.error('Error parsing text:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download sample CSV
  const handleDownloadSample = () => {
    const sample = generateSampleCsvTemplate();
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'elevator_sites_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Toggle row selection
  const handleToggleRow = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const handleToggleAll = () => {
    if (selectedIndices.size === parsedRows.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsedRows.map((_, idx) => idx)));
    }
  };

  // Final Commit Import
  const handleCommitImport = () => {
    const selectedRows = parsedRows.filter((_, idx) => selectedIndices.has(idx));
    if (selectedRows.length === 0) return;

    // Convert parsed rows to BuildingSite objects
    let maxIdNum = 160;
    existingSites.forEach((s) => {
      const match = s.id.match(/site-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxIdNum) maxIdNum = n;
      }
    });

    const newBuildingSites: BuildingSite[] = selectedRows.map((row, index) => {
      const siteId = row.id || `site-${maxIdNum + index + 1}`;
      const existingMatch = existingSites.find((s) => s.id === siteId || s.name.toLowerCase() === row.name.toLowerCase());

      return {
        id: existingMatch?.id || siteId,
        name: row.name,
        address: row.address,
        neighborhood: row.neighborhood,
        latitude: row.latitude,
        longitude: row.longitude,
        elevatorUnits: row.elevatorUnits,
        floors: row.floors,
        elevatorBrand: row.elevatorBrand,
        elevatorNumbers: existingMatch?.elevatorNumbers || `L1-L${row.elevatorUnits}`,
        category: row.category,
        assignedTechnicianEmail: row.assignedTechnicianEmail || currentTechnician.email,
        managerName: row.managerName,
        managerPhone: row.managerPhone,
        accessCode: row.accessCode,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${row.name}, ${row.address}`)}`,
        notes: row.notes,
        priority: existingMatch?.priority || 'normal',
        lastVisit: existingMatch?.lastVisit,
        visitHistory: existingMatch?.visitHistory,
      };
    });

    onBatchSave(newBuildingSites, updateExisting);
    onClose();
  };

  const newSitesCount = parsedRows.filter((r) => !r.isExistingMatch).length;
  const matchSitesCount = parsedRows.filter((r) => r.isExistingMatch).length;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/80 backdrop-blur-xs cursor-pointer"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] cursor-default">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                  {language === 'tr' ? 'Toplu Veri İçe Aktarma' : 'Mass Batch Import'}
                </span>
                <span className="text-xs text-slate-400">
                  {language === 'tr' ? 'CSV · Excel · WhatsApp · Pano' : 'CSV · Excel · WhatsApp · Clipboard'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {language === 'tr' ? 'Asansör Binaları Veri Setini İçe Aktar ve Eşitle' : 'Import & Sync Elevator Sites Dataset'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSample}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title={language === 'tr' ? 'Örnek CSV Şablonunu İndir' : 'Download Sample CSV Template'}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'tr' ? 'Örnek CSV' : 'Sample CSV'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('file')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{language === 'tr' ? 'Dosya Yükleme (.xlsx / .csv)' : 'File Upload (.xlsx / .csv)'}</span>
            </button>
            <button
              onClick={() => setActiveTab('clipboard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'clipboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>{language === 'tr' ? 'Tablodan Yapıştır (Sheets / Excel)' : 'Paste from Spreadsheet'}</span>
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'tr' ? 'WhatsApp Metni' : 'WhatsApp Dataset'}</span>
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span className="font-medium">
              {language === 'tr' ? 'Eşleşen mevcut binaların teknik özelliklerini güncelle' : 'Update specs for existing matching sites'}
            </span>
          </label>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: File Upload */}
          {activeTab === 'file' && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {fileName ? fileName : (language === 'tr' ? 'Bir tablo dosyası seçin veya buraya sürükleyip bırakın' : 'Choose a spreadsheet or drag & drop here')}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {language === 'tr'
                  ? <>Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>), Virgülle Ayrılmış Değerler (<strong>.csv</strong>) veya Sekmeyle Ayrılmış metinleri destekler.</>
                  : <>Supports Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>), Comma-Separated Values (<strong>.csv</strong>), or Tab-Delimited text.</>}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>{language === 'tr' ? 'Sütunlar: Bina Adı, Adres, Semt, Enlem, Boylam, Asansör Sayısı, Marka, Kapı Kodu' : 'Columns: Name, Address, District, Lat, Lng, Units, Brand, Code'}</span>
              </div>
            </div>
          )}

          {/* TAB 2 & 3: Clipboard or WhatsApp Text Area */}
          {(activeTab === 'clipboard' || activeTab === 'whatsapp') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  {activeTab === 'whatsapp'
                    ? (language === 'tr' ? 'Asansör bina satırlarını içeren WhatsApp mesaj metnini yapıştırın:' : 'Paste WhatsApp message text containing elevator site lines:')
                    : (language === 'tr' ? 'Google E-Tablolar veya Excelden doğrudan kopyalanan tablo hücrelerini yapıştırın:' : 'Paste table cells copied directly from Google Sheets or Excel:')}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {activeTab === 'whatsapp'
                    ? (language === 'tr' ? 'örn. Skyline Plaza | Kadıköy Moda Cd 14 | Kadıköy | 4 asansör | KONE | #1234*' : 'e.g. Skyline Tower | 350 5th Ave | Midtown | 4 lifts | Otis | #1234*')
                    : (language === 'tr' ? 'Sekme veya Virgülle ayrılmış satırlar' : 'Tab or Comma separated rows')}
                </span>
              </div>

              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={
                  activeTab === 'whatsapp'
                    ? (language === 'tr'
                        ? `1. Apex Kule | Atatürk Cd No 12 | Kadıköy Finans | 4 asansör | KONE | #4912*\n2. Bahçeşehir Konutları | Gölet Cd No 8 | Bahçeşehir | 2 asansör | Schindler | #8812*\n3. Metro İş Merkezi | E-5 Yan Yol No 44 | Maltepe | 3 asansör | Otis | #1044*`
                        : `1. Apex Center | 120 Wall St | Downtown Financial Hub | 6 lifts | KONE | #4912*\n2. Hudson Heights | 720 Riverside Dr | Riverside Residential | 4 lifts | Schindler | #8812*\n3. Metro Pavilion | 525 E 68th St | West End Medical | 5 lifts | Otis | #1044*`)
                    : (language === 'tr'
                        ? `Bina Adı\tAdres\tSemt\tAsansör\tMarka\tKapı Kodu\nİpekyolu Plaza\tBağdat Cd 220\tKadıköy Ticaret\t4\tKONE\t#4201*\nDenizkent Kuleleri\tSahil Yolu 88\tMaltepe Sahil\t2\tSchindler\t#8812*`
                        : `Name\tAddress\tNeighborhood\tElevators\tBrand\tAccess Code\nEmpire Plaza\t350 5th Ave\tMidtown Commercial Corridor\t6\tOtis\t#4201*\nRiverfront Towers\t720 Riverside Dr\tRiverside Residential District\t4\tSchindler\t#8812*`)
                }
                className="w-full text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden bg-slate-50/50 dark:bg-slate-950"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPasteText('')}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer"
                >
                  {language === 'tr' ? 'Metni Temizle' : 'Clear Text'}
                </button>
                <button
                  type="button"
                  onClick={handleParseClipboard}
                  disabled={!pasteText.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {language === 'tr'
                      ? `Çözümle & Önizle (${pasteText.split('\n').filter(Boolean).length} satır)`
                      : `Parse & Preview (${pasteText.split('\n').filter(Boolean).length} lines)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* PARSED PREVIEW SECTION */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {language === 'tr'
                      ? `Veri Önizleme (${parsedRows.length} binadan ${selectedIndices.size} tanesi seçildi)`
                      : `Preview Data (${selectedIndices.size} of ${parsedRows.length} sites selected)`}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {newSitesCount} {language === 'tr' ? 'Yeni' : 'New'}
                  </span>
                  {matchSitesCount > 0 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {matchSitesCount} {language === 'tr' ? 'Güncelleme' : 'Updates'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleAll}
                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    {selectedIndices.size === parsedRows.length
                      ? (language === 'tr' ? 'Tüm Seçimleri Kaldır' : 'Deselect All')
                      : (language === 'tr' ? 'Tümünü Seç' : 'Select All')}
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIndices.size === parsedRows.length}
                          onChange={handleToggleAll}
                          className="rounded text-blue-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-2.5">{language === 'tr' ? 'Bina Adı' : 'Building Name'}</th>
                      <th className="p-2.5">{language === 'tr' ? 'Adres' : 'Address'}</th>
                      <th className="p-2.5">{language === 'tr' ? 'Semt' : 'District'}</th>
                      <th className="p-2.5 font-mono">{language === 'tr' ? 'Koordinat (Enlem, Boylam)' : 'Coords (Lat, Lng)'}</th>
                      <th className="p-2.5">{language === 'tr' ? 'Asansör' : 'Lifts'}</th>
                      <th className="p-2.5">{language === 'tr' ? 'Marka' : 'Brand'}</th>
                      <th className="p-2.5">{language === 'tr' ? 'Giriş Kodu' : 'Access Code'}</th>
                      <th className="p-2.5">{language === 'tr' ? 'Durum' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {parsedRows.map((row, idx) => {
                      const isSelected = selectedIndices.has(idx);
                      const hasErrors = row.validationErrors.length > 0;

                      return (
                        <tr
                          key={idx}
                          onClick={() => handleToggleRow(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/40 dark:bg-blue-950/40 hover:bg-blue-50/70' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          } ${hasErrors ? 'bg-rose-50/40 dark:bg-rose-950/40' : ''}`}
                        >
                          <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(idx)}
                              className="rounded text-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                            {row.name || <span className="text-rose-500 italic">{language === 'tr' ? 'İsim Eksik' : 'Missing Name'}</span>}
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                            {row.address}
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300">
                            {row.neighborhood}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {row.elevatorUnits} {language === 'tr' ? 'Asansör' : 'Lifts'}
                          </td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">
                            {row.elevatorBrand}
                          </td>
                          <td className="p-2.5 font-mono text-amber-700 dark:text-amber-400 font-semibold">
                            {row.accessCode}
                          </td>
                          <td className="p-2.5">
                            {row.isExistingMatch ? (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                {language === 'tr' ? 'Eşleşti (Güncelle)' : 'Match (Update)'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {language === 'tr' ? 'Yeni Bina' : 'New Site'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {parsedRows.length > 0 ? (
              <span>
                {language === 'tr'
                  ? <>Rehberinize <strong>{selectedIndices.size}</strong> binayı kaydetmeye hazır.</>
                  : <>Ready to commit <strong>{selectedIndices.size}</strong> building sites to your directory.</>}
              </span>
            ) : (
              <span>
                {language === 'tr'
                  ? 'Başlamak için yukarıdan dosya yükleyin veya tablo hücrelerini yapıştırın.'
                  : 'Upload a file or paste spreadsheet text above to begin.'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {language === 'tr' ? 'İptal' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              disabled={selectedIndices.size === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {language === 'tr'
                  ? `${selectedIndices.size} Binayı Filoya Aktar`
                  : `Import ${selectedIndices.size} Sites to Fleet`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
