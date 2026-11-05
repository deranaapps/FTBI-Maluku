import React, { useState, useMemo } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link2,
  FileSpreadsheet,
  Globe,
  ArrowRight,
  ShieldCheck,
  Database,
  Layers,
  Bug,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { PesertaFTBI } from '../types/ftbi';
import { CABANG_LOMBA_LIST } from '../data/ftbiBranches';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  setWebAppUrl: (url: string) => void;
  onSyncGas: (url: string) => Promise<boolean>;
  onSyncDirectSheet: (urlOrId: string, sheetName?: string) => Promise<boolean>;
  isSyncing: boolean;
  syncError: string | null;
  syncSuccessMessage: string | null;
  lastSyncTime: string | null;
  isConnected: boolean;
  pesertaList: PesertaFTBI[];
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  setWebAppUrl,
  onSyncGas,
  onSyncDirectSheet,
  isSyncing,
  syncError,
  syncSuccessMessage,
  lastSyncTime,
  isConnected,
  pesertaList,
}) => {
  const [activeTab, setActiveTab] = useState<'gas' | 'direct_sheet'>('gas');
  const [directUrl, setDirectUrl] = useState(() => localStorage.getItem('ftbi_sheet_url') || '');
  const [sheetName, setSheetName] = useState(() => localStorage.getItem('ftbi_sheet_name') || 'Form Responses 1');
  const [testString, setTestString] = useState('');
  const [showTester, setShowTester] = useState(false);

  if (!isOpen) return null;

  // Participant breakdown by branch
  const branchCounts = CABANG_LOMBA_LIST.map((c) => {
    const countSD = pesertaList.filter((p) => p.cabangLombaId === c.id && p.jenjang === 'SD').length;
    const countSMP = pesertaList.filter((p) => p.cabangLombaId === c.id && p.jenjang === 'SMP').length;
    return { ...c, countSD, countSMP, total: countSD + countSMP };
  });

  // Diagnostic string analysis for spreadsheet headers or cell values
  const testAnalysis = useMemo(() => {
    if (!testString) return null;
    const raw = testString;
    const codes = Array.from(raw).map((char, i) => {
      const code = char.charCodeAt(0);
      const hex = `0x${code.toString(16).toUpperCase().padStart(4, '0')}`;
      let label = char === ' ' ? '[SPASI]' : char;
      if (code === 160) label = '[NBSP / 160]';
      if (code === 8203) label = '[ZWSP]';
      return `${label}: ${code} (${hex})`;
    });

    const hasNbsp = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/.test(raw);
    const clean = raw
      .normalize('NFKD')
      .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    let matchedBranchId = CABANG_LOMBA_LIST[0].id;
    if (
      clean.includes('nyanyi') ||
      clean.includes('rakyat') ||
      clean.includes('lagu') ||
      clean.includes('vokal') ||
      clean.includes('vocal') ||
      clean.includes('tembang') ||
      clean.includes('pupuh') ||
      clean.includes('sekar') ||
      clean.includes('kawih') ||
      clean.includes('suara') ||
      clean.includes('solis') ||
      clean.includes('menyanyi')
    ) {
      matchedBranchId = 'menyanyi';
    } else if (clean.includes('cerita') || clean.includes('pendek') || clean.includes('cerpen') || clean.includes('carpon')) {
      matchedBranchId = 'menulis_cerpen';
    } else if (clean.includes('puisi') || clean.includes('sajak')) {
      matchedBranchId = 'menulis_membaca_puisi';
    } else if (clean.includes('dongeng') || clean.includes('ngedongeng')) {
      matchedBranchId = 'mendongeng';
    } else if (clean.includes('stand') || clean.includes('comedy') || clean.includes('komedi') || clean.includes('lawak') || clean.includes('tunggal') || clean.includes('borangan')) {
      matchedBranchId = 'stand_up_comedy';
    } else if (clean.includes('pidato') || clean.includes('biantara')) {
      matchedBranchId = 'berpidato';
    }

    const branch = CABANG_LOMBA_LIST.find((c) => c.id === matchedBranchId);

    return {
      raw,
      length: raw.length,
      clean,
      hasNbsp,
      codes,
      branchName: branch ? branch.nama : matchedBranchId,
      branchId: matchedBranchId,
    };
  }, [testString]);

  const handleGasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webAppUrl.trim()) return;
    await onSyncGas(webAppUrl.trim());
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;
    localStorage.setItem('ftbi_sheet_url', directUrl.trim());
    localStorage.setItem('ftbi_sheet_name', sheetName.trim());
    await onSyncDirectSheet(directUrl.trim(), sheetName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#e0e3e5] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#f2f4f6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#006495] text-white flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#191c1e] tracking-tight">
                Sinkronisasi Daftar Peserta Spreadsheet
              </h3>
              <p className="text-xs text-[#50606e]">
                Tarik data pendaftaran Google Form & perbarui daftar peserta FTBI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#50606e] hover:text-[#191c1e] hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Indicator */}
          <div className="p-4 rounded-2xl bg-[#f8f9fa] border border-[#e0e3e5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div>
                <span className="text-xs font-bold text-[#191c1e]">
                  {isConnected ? 'Terhubung dengan Google Spreadsheet' : 'Belum Terhubung'}
                </span>
                <p className="text-[11px] text-[#50606e]">
                  Total terdaftar di aplikasi:{' '}
                  <strong className="text-[#006495] font-mono">{pesertaList.length} peserta</strong>
                  {lastSyncTime && ` · Sinkronisasi terakhir: ${lastSyncTime}`}
                </p>
              </div>
            </div>

            {isConnected && (
              <button
                onClick={() => onSyncGas(webAppUrl)}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#006495] bg-[#cbe6ff] hover:bg-[#b2d9ff] rounded-xl transition-colors shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Ulang'}</span>
              </button>
            )}
          </div>

          {/* Success / Error Messages */}
          {syncSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Sinkronisasi Berhasil!</p>
                <p className="mt-0.5">{syncSuccessMessage}</p>
              </div>
            </div>
          )}

          {syncError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Kendala Sinkronisasi:</p>
                <p className="mt-0.5 whitespace-pre-line">{syncError}</p>
              </div>
            </div>
          )}

          {/* M3 Segmented Method Selector */}
          <div>
            <label className="block text-xs font-bold text-[#191c1e] mb-2">
              Pilih Jalur Sinkronisasi:
            </label>
            <div className="grid grid-cols-2 p-1 bg-[#eceeef] rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('gas')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'gas'
                    ? 'bg-white text-[#006495] shadow-xs'
                    : 'text-[#50606e] hover:text-[#191c1e]'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>1. Web App GAS (2 Arah)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('direct_sheet')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'direct_sheet'
                    ? 'bg-white text-[#006495] shadow-xs'
                    : 'text-[#50606e] hover:text-[#191c1e]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>2. Link Sheet Langsung (Cepat)</span>
              </button>
            </div>
          </div>

          {/* Form Tab 1: Google Apps Script Web App */}
          {activeTab === 'gas' && (
            <form onSubmit={handleGasSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">
                  URL Web App Google Apps Script (/exec):
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#f8f9fa] border border-[#c2c7cf] focus:border-[#006495] focus:bg-white rounded-2xl outline-none transition-colors"
                  />
                </div>
                <p className="text-[11px] text-[#50606e] mt-1.5 leading-relaxed">
                  Didapatkan dari menu <strong>Deploy &gt; Manage deployments</strong> di Google Spreadsheet Anda. Pastikan opsi <em>"Who has access"</em> disetel ke <strong className="text-[#006495]">"Anyone"</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-[#f0f7ff] rounded-2xl border border-[#cbe6ff] text-xs text-[#004f76] space-y-1">
                <span className="font-bold block">✨ Keunggulan Metode Web App:</span>
                <p>• Otomatis mendistribusikan pendaftaran dari sheet Google Form ke sheet cabang lomba.</p>
                <p>• Mendukung penyimpanan nilai 3 Juri langsung kembali ke Google Spreadsheet.</p>
              </div>

              <button
                type="submit"
                disabled={isSyncing || !webAppUrl.trim()}
                className="w-full py-3 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] disabled:opacity-50 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 m3-button-press"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Menghubungi Google Apps Script...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Tarik & Sinkronkan Peserta Sekarang</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form Tab 2: Direct Google Sheet Link */}
          {activeTab === 'direct_sheet' && (
            <form onSubmit={handleDirectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">
                  URL Google Spreadsheet:
                </label>
                <input
                  type="text"
                  value={directUrl}
                  onChange={(e) => setDirectUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-[#f8f9fa] border border-[#c2c7cf] focus:border-[#006495] focus:bg-white rounded-2xl outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">
                  Nama Sheet Respons Formulir:
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Form Responses 1 atau Respon Formulir 1"
                  className="w-full px-3.5 py-2 text-xs bg-[#f8f9fa] border border-[#c2c7cf] focus:border-[#006495] focus:bg-white rounded-2xl outline-none transition-colors"
                />
                <p className="text-[11px] text-[#50606e] mt-1">
                  Cukup klik tombol <strong>Bagikan (Share)</strong> di Google Spreadsheet &gt; pilih <em>"Siapa saja yang memiliki link: Pelihat"</em>.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSyncing || !directUrl.trim()}
                className="w-full py-3 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] disabled:opacity-50 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 m3-button-press"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Membaca Data Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Tarik Peserta Langsung via Link Sheet</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Current Participant Breakdown Card */}
          <div className="pt-2 border-t border-[#f2f4f6]">
            <h4 className="text-xs font-bold text-[#191c1e] mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#006495]" />
              <span>Jumlah Peserta Per Cabang Lomba Saat Ini:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {branchCounts.map((b) => (
                <div key={b.id} className="p-2.5 bg-[#f8f9fa] rounded-xl border border-[#e0e3e5] text-[11px]">
                  <span className="font-semibold text-[#191c1e] block truncate" title={b.nama}>
                    {b.nama}
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-[#50606e]">
                    <span>SD: <strong className="text-[#006495]">{b.countSD}</strong></span>
                    <span>·</span>
                    <span>SMP: <strong className="text-[#006495]">{b.countSMP}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Branch String Detection Tester (Diagnostic Tool) */}
          <div className="pt-2 border-t border-[#f2f4f6]">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowTester(!showTester)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#50606e] hover:text-[#006495] transition-colors"
              >
                <Bug className="w-3.5 h-3.5 text-amber-600" />
                <span>Uji Deteksi Teks Cabang (Diagnostik String Spreadsheet)</span>
                {showTester ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showTester && (
              <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 text-xs">
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Tempel teks judul kolom atau nilai cabang langsung dari spreadsheet Anda untuk menguji apakah ada karakter spasi tersembunyi (seperti Non-Breaking Space <code className="bg-amber-200/60 px-1 py-0.5 rounded font-mono text-[10px]">\u00A0</code> / 160).
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testString}
                    onChange={(e) => setTestString(e.target.value)}
                    placeholder="Contoh: Menyanyi Nyanyian Rakyat atau SD_Menyanyi"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                  {testString && (
                    <button
                      type="button"
                      onClick={() => setTestString('')}
                      className="px-2.5 py-1 text-xs text-amber-900 bg-amber-200/60 hover:bg-amber-200 rounded-xl font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {testAnalysis && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-semibold text-slate-600">
                        Hasil Klasifikasi Cabang:
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs border border-emerald-200">
                        {testAnalysis.branchName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-500">Panjang String: </span>
                        <strong className="font-mono text-slate-800">{testAnalysis.length} karakter</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Status Spasi: </span>
                        {testAnalysis.hasNbsp ? (
                          <span className="text-red-700 font-bold">⚠️ Non-Breaking Space (160) Terdeteksi</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">✓ Spasi Standar (32)</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">
                        Daftar Kode Karakter (ASCII / Unicode):
                      </span>
                      <div className="p-2 bg-slate-50 rounded-lg font-mono text-[10px] text-slate-700 max-h-24 overflow-y-auto leading-relaxed">
                        {testAnalysis.codes.map((c, idx) => (
                          <span key={idx} className="inline-block mr-2 text-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8f9fa] border-t border-[#f2f4f6] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-[#50606e] hover:text-[#191c1e] hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
