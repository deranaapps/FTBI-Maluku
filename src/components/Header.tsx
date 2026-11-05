import React from 'react';
import { Award, BookOpen, FileCode, CheckCircle2, SlidersHorizontal, HelpCircle, Printer, Link2, RefreshCw, Database, Users, Shuffle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'leaderboard' | 'peserta' | 'undian' | 'scoring' | 'simulation' | 'gas_code' | 'guide';
  setActiveTab: (tab: 'leaderboard' | 'peserta' | 'undian' | 'scoring' | 'simulation' | 'gas_code' | 'guide') => void;
  onOpenReport: () => void;
  isConnectedGas: boolean;
  onOpenConnectModal: () => void;
  onOpenSyncModal?: () => void;
  onQuickSync?: () => void;
  isSyncing?: boolean;
  lastSyncTime?: string | null;
  isAutoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: () => void;
  refreshCountdown?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenReport,
  isConnectedGas,
  onOpenConnectModal,
  onOpenSyncModal,
  onQuickSync,
  isSyncing = false,
  lastSyncTime,
  isAutoRefreshEnabled = true,
  onToggleAutoRefresh,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#f8f9fa] border-b border-[#e0e3e5] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src="/logo-kemendikdasmen.svg"
                alt="Logo Kemendikdasmen - Kementerian Pendidikan Dasar dan Menengah"
                className="w-11 h-11 object-contain drop-shadow-sm hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#191c1e] whitespace-nowrap">
                  FTBI Scoring & Leaderboard
                </h1>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#cbe6ff] text-[#001e30]">
                  Kemendikdasmen
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#50606e]">
                Kementerian Pendidikan Dasar dan Menengah RI
              </p>
            </div>
          </div>

          {/* Quick Connect Badge for Mobile */}
          <div className="md:hidden flex items-center gap-1.5">
            <button
              onClick={onQuickSync || onOpenConnectModal}
              disabled={isSyncing}
              className="p-1.5 rounded-full bg-white border border-[#c2c7cf] text-[#006495]"
              title="Sinkronkan Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onOpenSyncModal || onOpenConnectModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                isConnectedGas
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-[#50606e] border-[#c2c7cf]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConnectedGas ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              {isConnectedGas ? 'Tersinkron' : 'Sync'}
            </button>
          </div>
        </div>

        {/* M3 Segmented Navigation Bar */}
        <nav className="flex items-center p-1 bg-[#eceeef] rounded-2xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-white text-[#006495] shadow-sm font-semibold'
                : 'text-[#50606e] hover:text-[#191c1e]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('peserta')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'peserta'
                ? 'bg-white text-[#006495] shadow-sm font-semibold'
                : 'text-[#50606e] hover:text-[#191c1e]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Peserta</span>
          </button>

          <button
            onClick={() => setActiveTab('undian')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'undian'
                ? 'bg-white text-[#006495] shadow-sm font-semibold'
                : 'text-[#50606e] hover:text-[#191c1e]'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>Undian Urutan (19 Slot)</span>
          </button>

          <button
            onClick={() => setActiveTab('scoring')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'scoring'
                ? 'bg-white text-[#006495] shadow-sm font-semibold'
                : 'text-[#50606e] hover:text-[#191c1e]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Penilaian Juri</span>
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'simulation'
                ? 'bg-white text-[#006495] shadow-sm font-semibold'
                : 'text-[#50606e] hover:text-[#191c1e]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Simulasi Form</span>
          </button>

          <button
            onClick={() => setActiveTab('gas_code')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'gas_code'
                ? 'bg-white text-[#006495] shadow-sm font-semibold'
                : 'text-[#50606e] hover:text-[#191c1e]'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Kode GAS</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-white text-[#006495] shadow-sm font-semibold'
                : 'text-[#50606e] hover:text-[#191c1e]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Panduan</span>
          </button>
        </nav>

        {/* Right Actions Zone */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {/* Live Sync Auto-Refresh Button */}
          {onToggleAutoRefresh && (
            <button
              onClick={onToggleAutoRefresh}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all m3-button-press ${
                isAutoRefreshEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-white text-slate-500 border-[#c2c7cf] hover:bg-slate-50'
              }`}
              title={
                isAutoRefreshEnabled
                  ? 'Live Sync aktif: data tersinkronisasi otomatis secara langsung dari Google Spreadsheet.'
                  : 'Live Sync nonaktif. Klik untuk mengaktifkan pembaruan otomatis.'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAutoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{isAutoRefreshEnabled ? 'Live Sync' : 'Live Off'}</span>
            </button>
          )}

          {/* Quick Sync Button */}
          <button
            onClick={onQuickSync || onOpenConnectModal}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#006495] bg-[#cbe6ff] hover:bg-[#b2d9ff] rounded-xl transition-colors disabled:opacity-50 m3-button-press"
            title="Klik untuk menyinkronkan data peserta terbaru dari Spreadsheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan'}</span>
          </button>

          {/* Connection Status Button */}
          <button
            onClick={onOpenSyncModal || onOpenConnectModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
              isConnectedGas
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-[#50606e] border-[#c2c7cf] hover:bg-slate-50'
            }`}
            title="Kelola koneksi spreadsheet"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isConnectedGas ? 'Spreadsheet Terhubung' : 'Pautkan Spreadsheet'}</span>
          </button>

          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#006495] hover:bg-[#004f76] rounded-xl transition-colors shadow-sm m3-button-press"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Berita Acara</span>
          </button>
        </div>
      </div>
    </header>
  );
};
