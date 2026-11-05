import React, { useState, useMemo } from 'react';
import { CABANG_LOMBA_LIST } from '../data/ftbiBranches';
import { PesertaFTBI, Jenjang, KategoriGender } from '../types/ftbi';
import { Trophy, Medal, Award, Search, ChevronDown, ChevronUp, Download, Printer, UserCheck, Sparkles, SlidersHorizontal, CheckCircle2, RefreshCw, Database, School, Shuffle, ArrowUpDown } from 'lucide-react';

interface LeaderboardViewProps {
  pesertaList: PesertaFTBI[];
  onSelectPesertaForScoring: (pesertaId: string) => void;
  onOpenReport: () => void;
  selectedJenjang: Jenjang;
  setSelectedJenjang: (lvl: Jenjang) => void;
  selectedCabangId: string;
  setSelectedCabangId: (id: string) => void;
  onSyncSpreadsheet?: () => void;
  isSyncing?: boolean;
  onOpenSyncModal?: () => void;
  recentlyUpdatedPesertaIds?: string[];
  isAutoRefreshEnabled?: boolean;
  onToggleAutoRefresh?: () => void;
  refreshCountdown?: number;
  onNavigateToUndian?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  pesertaList,
  onSelectPesertaForScoring,
  onOpenReport,
  selectedJenjang,
  setSelectedJenjang,
  selectedCabangId,
  setSelectedCabangId,
  onSyncSpreadsheet,
  isSyncing = false,
  onOpenSyncModal,
  recentlyUpdatedPesertaIds = [],
  isAutoRefreshEnabled = true,
  onToggleAutoRefresh,
  onNavigateToUndian,
}) => {
  const [selectedGender, setSelectedGender] = useState<'Semua' | KategoriGender>('Semua');
  const [selectedSekolah, setSelectedSekolah] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<'ranking' | 'urutanTampil'>('ranking');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Active Cabang
  const activeCabang = useMemo(() => {
    return CABANG_LOMBA_LIST.find((c) => c.id === selectedCabangId) || CABANG_LOMBA_LIST[0];
  }, [selectedCabangId]);

  // Unique list of schools for active level
  const schoolList = useMemo(() => {
    return Array.from(
      new Set(
        pesertaList
          .filter((p) => p.jenjang === selectedJenjang && p.asalSekolah && p.asalSekolah !== '-')
          .map((p) => p.asalSekolah)
      )
    ).sort();
  }, [pesertaList, selectedJenjang]);

  // Filtered & Sorted Peserta
  const filteredPeserta = useMemo(() => {
    // 1. Calculate base rankings for all participants in this branch & level first
    const branchAll = pesertaList
      .filter((p) => p.jenjang === selectedJenjang && p.cabangLombaId === selectedCabangId)
      .sort((a, b) => {
        if (b.totalNilai !== a.totalNilai) return b.totalNilai - a.totalNilai;
        const j1A = a.nilaiJuri1?.totalWeightedScore || 0;
        const j1B = b.nilaiJuri1?.totalWeightedScore || 0;
        if (j1B !== j1A) return j1B - j1A;
        return b.rataRataNilai - a.rataRataNilai;
      })
      .map((p, index) => {
        const rank = index + 1;
        let predikat: PesertaFTBI['predikat'] = 'Peserta';
        if (rank === 1) predikat = 'Juara 1';
        else if (rank === 2) predikat = 'Juara 2';
        else if (rank === 3) predikat = 'Juara 3';
        else if (rank === 4) predikat = 'Harapan 1';
        else if (rank === 5) predikat = 'Harapan 2';
        else if (rank === 6) predikat = 'Harapan 3';
        return { ...p, peringkat: rank, predikat };
      });

    // 2. Filter by school, gender, and search query
    const filtered = branchAll.filter((p) => {
      const matchGender = selectedGender === 'Semua' || p.kategoriGender === selectedGender;
      const matchSekolah = selectedSekolah === 'Semua' || p.asalSekolah === selectedSekolah;
      const matchSearch =
        !searchQuery.trim() ||
        p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.asalSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.kecamatanKabupaten.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.noUndian.includes(searchQuery);

      return matchGender && matchSekolah && matchSearch;
    });

    // 3. Sort by requested mode
    if (sortBy === 'urutanTampil') {
      return [...filtered].sort((a, b) => {
        const numA = parseInt(a.noUndian, 10) || 999;
        const numB = parseInt(b.noUndian, 10) || 999;
        return numA - numB;
      });
    }

    return filtered;
  }, [pesertaList, selectedJenjang, selectedCabangId, selectedGender, selectedSekolah, searchQuery, sortBy]);

  // Top 3 Podium
  const top1 = filteredPeserta[0];
  const top2 = filteredPeserta[1];
  const top3 = filteredPeserta[2];

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Peringkat',
      'Predikat',
      'No Undian',
      'Nama Peserta',
      'NISN',
      'Asal Sekolah',
      'Kecamatan/Kabupaten',
      'Jenjang',
      'Kategori',
      'Nilai Juri 1',
      'Nilai Juri 2',
      'Nilai Juri 3',
      'Total Nilai',
      'Rata-Rata',
      'Status Verifikasi',
    ];

    const rows = filteredPeserta.map((p) => [
      p.peringkat,
      p.predikat,
      `'${p.noUndian}`,
      `"${p.nama}"`,
      `'${p.nisn || ''}`,
      `"${p.asalSekolah}"`,
      `"${p.kecamatanKabupaten}"`,
      p.jenjang,
      p.kategoriGender,
      p.nilaiJuri1?.totalWeightedScore || 0,
      p.nilaiJuri2?.totalWeightedScore || 0,
      p.nilaiJuri3?.totalWeightedScore || 0,
      p.totalNilai.toFixed(2),
      p.rataRataNilai.toFixed(2),
      p.statusVerifikasi,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Leaderboard_FTBI_${selectedJenjang}_${activeCabang.id}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner Card (Material 3 Surface Container Low) */}
      <div className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#50606e] mb-1">
              <span>Festival Tunas Bahasa Ibu (FTBI)</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#006495]">{selectedJenjang}</span>
              <span aria-hidden="true">·</span>
              <span>{activeCabang.nama}</span>
            </div>
            <h2 className="text-2xl font-bold text-[#191c1e] tracking-tight">
              Papan Peringkat Resmi Dewan Juri
            </h2>
            <p className="text-sm text-[#50606e] mt-1 max-w-2xl">
              {activeCabang.deskripsi}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center shrink-0 flex-wrap">
            {onToggleAutoRefresh && (
              <button
                onClick={onToggleAutoRefresh}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-2xl border transition-all m3-button-press ${
                  isAutoRefreshEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-[#eceeef] text-[#50606e] border-transparent hover:bg-slate-200'
                }`}
                title={
                  isAutoRefreshEnabled
                    ? 'Live Sync aktif: data tersinkronisasi otomatis langsung dari Google Spreadsheet.'
                    : 'Live Sync nonaktif. Klik untuk mengaktifkan sinkronisasi otomatis.'
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

            {onSyncSpreadsheet && (
              <button
                onClick={onSyncSpreadsheet}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#006495] bg-[#cbe6ff] hover:bg-[#b2d9ff] disabled:opacity-50 rounded-2xl transition-colors m3-button-press"
                title="Sinkronkan data peserta dari Google Spreadsheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan'}</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#50606e] hover:text-[#191c1e] bg-[#eceeef] hover:bg-slate-200 rounded-2xl transition-colors m3-button-press"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006495] hover:bg-[#004f76] rounded-2xl transition-colors shadow-sm m3-button-press"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>

        {/* M3 Segmented Filters Bar */}
        <div className="mt-6 pt-5 border-t border-[#f2f4f6] grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Jenjang Switcher */}
          <div className="md:col-span-3 flex items-center p-1 bg-[#eceeef] rounded-2xl">
            <button
              onClick={() => setSelectedJenjang('SD')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
                selectedJenjang === 'SD'
                  ? 'bg-white text-[#006495] shadow-sm font-bold'
                  : 'text-[#50606e] hover:text-[#191c1e]'
              }`}
            >
              Tingkat SD
            </button>
            <button
              onClick={() => setSelectedJenjang('SMP')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
                selectedJenjang === 'SMP'
                  ? 'bg-white text-[#006495] shadow-sm font-bold'
                  : 'text-[#50606e] hover:text-[#191c1e]'
              }`}
            >
              Tingkat SMP
            </button>
          </div>

          {/* Gender Filter */}
          <div className="md:col-span-4 flex items-center p-1 bg-[#eceeef] rounded-2xl">
            {(['Semua', 'Putra', 'Putri'] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => setSelectedGender(gender)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
                  selectedGender === gender
                    ? 'bg-white text-[#006495] shadow-sm font-bold'
                    : 'text-[#50606e] hover:text-[#191c1e]'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#72777f] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama peserta, nomor undian, atau sekolah..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-2xl outline-none transition-colors"
            />
          </div>
        </div>

        {/* Cabang Lomba Horizontal Chips */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CABANG_LOMBA_LIST.map((c) => {
            const isSelected = c.id === selectedCabangId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCabangId(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#006495] text-white shadow-sm'
                    : 'bg-[#f2f4f6] text-[#50606e] hover:bg-[#e6e8ea]'
                }`}
              >
                {c.namaSunda}
              </button>
            );
          })}
        </div>

        {/* Row 3: Filter per Sekolah, Urutan Tampil (No. Undian) vs Peringkat, & Tombol Undian */}
        <div className="mt-4 pt-3 border-t border-[#f2f4f6] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* School Selector */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-1.5 text-[#50606e] font-semibold shrink-0">
              <School className="w-4 h-4 text-[#006495]" />
              <span>Filter Sekolah:</span>
            </div>
            <select
              value={selectedSekolah}
              onChange={(e) => setSelectedSekolah(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-[#f2f4f6] hover:bg-[#e6e8ea] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl text-xs font-medium text-[#191c1e] outline-none transition-colors"
            >
              <option value="Semua">Semua Sekolah ({schoolList.length} Sekolah Terdaftar)</option>
              {schoolList.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
            {selectedSekolah !== 'Semua' && (
              <button
                onClick={() => setSelectedSekolah('Semua')}
                className="text-xs text-[#006495] hover:underline font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          {/* Sort Mode & Undian Shortcut */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-1 bg-[#eceeef] rounded-xl items-center">
              <button
                onClick={() => setSortBy('ranking')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  sortBy === 'ranking'
                    ? 'bg-white text-[#006495] shadow-xs'
                    : 'text-[#50606e] hover:text-[#191c1e]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Peringkat Nilai</span>
              </button>
              <button
                onClick={() => setSortBy('urutanTampil')}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  sortBy === 'urutanTampil'
                    ? 'bg-white text-[#006495] shadow-xs'
                    : 'text-[#50606e] hover:text-[#191c1e]'
                }`}
                title="Tampilkan peserta berurutan sesuai nomor undian urutan tampil hasil undian sekolah (1 s.d. 19)"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Urutan Tampil (No. Undian)</span>
              </button>
            </div>

            {onNavigateToUndian && (
              <button
                onClick={onNavigateToUndian}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#006495] bg-[#cbe6ff] hover:bg-[#b2d9ff] rounded-xl transition-all shadow-2xs m3-button-press"
                title="Buka pengundian urutan tampil 19 nomor per sekolah"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Undian Urutan (19 Slot)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Podium Top 3 (Material 3 Cards) */}
      {filteredPeserta.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
          {/* Juara 2 (Perak) */}
          {top2 && (() => {
            const isTop2RecentlyUpdated = recentlyUpdatedPesertaIds.includes(top2.id);
            return (
              <div
                className={`order-2 md:order-1 bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-700 hover:shadow-md ${
                  isTop2RecentlyUpdated
                    ? 'ring-4 ring-emerald-500 bg-emerald-50/70 animate-pulse border-emerald-400 shadow-lg'
                    : 'border-[#e0e3e5]'
                }`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-200/50 to-transparent rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isTop2RecentlyUpdated && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-bounce flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Baru Dinilai
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Pemenang II (Perak)
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-[#50606e] font-mono mb-1">
                    No. Undian: {top2.noUndian}
                  </div>
                  <h3 className="text-base font-bold text-[#191c1e] line-clamp-1">
                    {top2.nama}
                  </h3>
                  <p className="text-xs text-[#50606e] line-clamp-1 mt-0.5">
                    {top2.asalSekolah}
                  </p>
                  <p className="text-[11px] text-[#72777f] mt-0.5">
                    {top2.kecamatanKabupaten}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f2f4f6] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#72777f] block">Total Nilai</span>
                    <span
                      className={`text-lg font-bold font-mono tabular-nums ${
                        isTop2RecentlyUpdated ? 'text-emerald-700 font-extrabold text-xl' : 'text-[#191c1e]'
                      }`}
                    >
                      {top2.totalNilai}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#72777f] block">Rata-Rata</span>
                    <span className="text-sm font-semibold font-mono text-[#006495] tabular-nums">
                      {top2.rataRataNilai.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Juara 1 (Emas - Highest Card) */}
          {top1 && (() => {
            const isTop1RecentlyUpdated = recentlyUpdatedPesertaIds.includes(top1.id);
            return (
              <div
                className={`order-1 md:order-2 bg-[#f0f7ff] rounded-3xl p-6 border-2 shadow-md flex flex-col justify-between relative overflow-hidden transition-all duration-700 hover:shadow-lg ${
                  isTop1RecentlyUpdated
                    ? 'ring-4 ring-emerald-500 bg-emerald-50/80 animate-pulse border-emerald-500 shadow-xl'
                    : 'border-[#006495]'
                }`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/60 to-transparent rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-lg shadow-sm">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isTop1RecentlyUpdated && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white animate-bounce flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Baru Dinilai
                        </span>
                      )}
                      <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-3 py-1 rounded-full shadow-xs">
                        Pemenang I (Emas)
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-[#006495] font-mono font-semibold mb-1">
                    No. Undian: {top1.noUndian}
                  </div>
                  <h3 className="text-lg font-bold text-[#191c1e] line-clamp-1">
                    {top1.nama}
                  </h3>
                  <p className="text-xs font-medium text-[#50606e] line-clamp-1 mt-0.5">
                    {top1.asalSekolah}
                  </p>
                  <p className="text-[11px] text-[#72777f] mt-0.5">
                    {top1.kecamatanKabupaten}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#cbe6ff] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#50606e] block">Total 3 Juri</span>
                    <span
                      className={`text-2xl font-bold font-mono tabular-nums ${
                        isTop1RecentlyUpdated ? 'text-emerald-700 font-extrabold text-3xl' : 'text-[#006495]'
                      }`}
                    >
                      {top1.totalNilai}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#50606e] block">Rata-Rata</span>
                    <span className="text-base font-bold font-mono text-emerald-700 tabular-nums">
                      {top1.rataRataNilai.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Juara 3 (Perunggu) */}
          {top3 && (() => {
            const isTop3RecentlyUpdated = recentlyUpdatedPesertaIds.includes(top3.id);
            return (
              <div
                className={`order-3 bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-700 hover:shadow-md ${
                  isTop3RecentlyUpdated
                    ? 'ring-4 ring-emerald-500 bg-emerald-50/70 animate-pulse border-emerald-400 shadow-lg'
                    : 'border-[#e0e3e5]'
                }`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100/40 to-transparent rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isTop3RecentlyUpdated && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white animate-bounce flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Baru Dinilai
                        </span>
                      )}
                      <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
                        Pemenang III (Perunggu)
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-[#50606e] font-mono mb-1">
                    No. Undian: {top3.noUndian}
                  </div>
                  <h3 className="text-base font-bold text-[#191c1e] line-clamp-1">
                    {top3.nama}
                  </h3>
                  <p className="text-xs text-[#50606e] line-clamp-1 mt-0.5">
                    {top3.asalSekolah}
                  </p>
                  <p className="text-[11px] text-[#72777f] mt-0.5">
                    {top3.kecamatanKabupaten}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f2f4f6] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#72777f] block">Total Nilai</span>
                    <span
                      className={`text-lg font-bold font-mono tabular-nums ${
                        isTop3RecentlyUpdated ? 'text-emerald-700 font-extrabold text-xl' : 'text-[#191c1e]'
                      }`}
                    >
                      {top3.totalNilai.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#72777f] block">Rata-Rata</span>
                    <span className="text-sm font-semibold font-mono text-[#006495] tabular-nums">
                      {top3.rataRataNilai.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-[#e0e3e5] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#f2f4f6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#191c1e] text-base">
              Daftar Seluruh Peserta & Rekap Nilai
            </h3>
            <span className="text-xs text-[#50606e] font-mono">
              ({filteredPeserta.length} Peserta)
            </span>
          </div>

          <div className="text-xs text-[#50606e]">
            Formula: <span className="font-mono font-medium text-[#191c1e]">Total = Juri 1 + Juri 2 + Juri 3</span>
          </div>
        </div>

        {filteredPeserta.length === 0 ? (
          <div className="py-14 text-center text-[#50606e] max-w-md mx-auto">
            <Award className="w-12 h-12 mx-auto text-[#c2c7cf] mb-2" />
            <p className="font-semibold text-base text-[#191c1e]">Belum ada data peserta untuk filter ini.</p>
            <p className="text-xs mt-1 text-[#50606e]">
              Jika Anda sudah memiliki respon di Google Form atau Google Spreadsheet, klik tombol di bawah untuk menyinkronkan data langsung ke aplikasi.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {onSyncSpreadsheet && (
                <button
                  onClick={onSyncSpreadsheet}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] disabled:opacity-50 rounded-2xl shadow-sm transition-all m3-button-press"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sedang Menyinkronkan...' : 'Sinkronkan dari Spreadsheet'}</span>
                </button>
              )}
              {onOpenSyncModal && (
                <button
                  onClick={onOpenSyncModal}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#006495] bg-[#cbe6ff] hover:bg-[#b2d9ff] rounded-2xl transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Pengaturan Sumber Data</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] border-b border-[#e0e3e5] text-[#50606e] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-3 w-16 text-center">No Undian</th>
                  <th className="py-3 px-4">Nama Peserta & Sekolah</th>
                  <th className="py-3 px-3 text-center">Kategori</th>
                  <th className="py-3 px-3 text-right">Juri 1</th>
                  <th className="py-3 px-3 text-right">Juri 2</th>
                  <th className="py-3 px-3 text-right">Juri 3</th>
                  <th className="py-3 px-4 text-right font-bold text-[#191c1e]">Total Skor</th>
                  <th className="py-3 px-3 text-right font-bold text-[#006495]">Rata-Rata</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4f6]">
                {filteredPeserta.map((p) => {
                  const isExpanded = expandedRowId === p.id;
                  const isWinner = (p.peringkat || 99) <= 3;
                  const isHarapan = (p.peringkat || 99) > 3 && (p.peringkat || 99) <= 6;
                  const isRecentlyUpdated = recentlyUpdatedPesertaIds.includes(p.id);

                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        className={`transition-all duration-700 ${
                          isRecentlyUpdated
                            ? 'bg-emerald-50/95 ring-2 ring-emerald-500 shadow-md animate-pulse font-medium'
                            : p.peringkat === 1
                            ? 'bg-[#f0f7ff]/50 hover:bg-[#f8f9fa]'
                            : p.peringkat === 2
                            ? 'bg-slate-50/50 hover:bg-[#f8f9fa]'
                            : p.peringkat === 3
                            ? 'bg-amber-50/30 hover:bg-[#f8f9fa]'
                            : 'hover:bg-[#f8f9fa]'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center font-bold">
                          {p.peringkat === 1 && (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs">
                              1
                            </span>
                          )}
                          {p.peringkat === 2 && (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs">
                              2
                            </span>
                          )}
                          {p.peringkat === 3 && (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-900 text-xs">
                              3
                            </span>
                          )}
                          {p.peringkat && p.peringkat > 3 && (
                            <span className="text-[#50606e] font-mono">{p.peringkat}</span>
                          )}
                        </td>

                        {/* No Undian */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-[#006495]">
                          {p.noUndian}
                        </td>

                        {/* Nama & Sekolah */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#191c1e] text-sm">{p.nama}</span>
                            {isRecentlyUpdated && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs animate-bounce tracking-wide">
                                <Sparkles className="w-3 h-3 text-amber-300" /> Baru Dinilai
                              </span>
                            )}
                            {isWinner && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                                {p.predikat}
                              </span>
                            )}
                            {isHarapan && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#d3e4f5] text-[#0c1d29]">
                                {p.predikat}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#50606e] flex items-center gap-2 mt-0.5">
                            <span>{p.asalSekolah}</span>
                            <span aria-hidden="true">·</span>
                            <span>{p.kecamatanKabupaten}</span>
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="py-3.5 px-3 text-center text-[#50606e]">
                          {p.kategoriGender}
                        </td>

                        {/* Juri 1 */}
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {p.nilaiJuri1 ? (
                            <span className="text-[#191c1e] font-medium">
                              {p.nilaiJuri1.totalWeightedScore.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[#c2c7cf]">-</span>
                          )}
                        </td>

                        {/* Juri 2 */}
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {p.nilaiJuri2 ? (
                            <span className="text-[#191c1e] font-medium">
                              {p.nilaiJuri2.totalWeightedScore.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[#c2c7cf]">-</span>
                          )}
                        </td>

                        {/* Juri 3 */}
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {p.nilaiJuri3 ? (
                            <span className="text-[#191c1e] font-medium">
                              {p.nilaiJuri3.totalWeightedScore.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[#c2c7cf]">-</span>
                          )}
                        </td>

                        {/* Total Nilai */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm tabular-nums">
                          <span
                            className={
                              isRecentlyUpdated
                                ? 'inline-block px-2 py-0.5 rounded-lg bg-emerald-600 text-white shadow-xs font-bold text-sm animate-pulse'
                                : 'text-[#191c1e]'
                            }
                          >
                            {p.totalNilai.toFixed(2)}
                          </span>
                        </td>

                        {/* Rata-Rata */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums">
                          <span
                            className={
                              isRecentlyUpdated
                                ? 'text-emerald-700 font-extrabold text-sm'
                                : 'text-[#006495]'
                            }
                          >
                            {p.rataRataNilai.toFixed(2)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                              isRecentlyUpdated
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 font-bold animate-pulse'
                                : p.statusVerifikasi === 'Diverifikasi' || p.statusVerifikasi === 'Selesai'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.statusVerifikasi === 'Sebagian'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isRecentlyUpdated ? (
                              <Sparkles className="w-3 h-3 text-amber-300" />
                            ) : p.statusVerifikasi === 'Diverifikasi' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : null}
                            <span>{isRecentlyUpdated ? 'Baru Dinilai' : p.statusVerifikasi}</span>
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onSelectPesertaForScoring(p.id)}
                              className="px-2.5 py-1 text-[11px] font-medium rounded-lg text-[#006495] bg-[#cbe6ff] hover:bg-[#b2d9ff] transition-colors"
                              title="Nilai Peserta Ini"
                            >
                              Nilai
                            </button>
                            <button
                              onClick={() => setExpandedRowId(isExpanded ? null : p.id)}
                              className="p-1 text-[#72777f] hover:text-[#191c1e] rounded-lg hover:bg-slate-100 transition-colors"
                              title="Lihat Rincian Multi-Kriteria"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Breakdown Drawer */}
                      {isExpanded && (
                        <tr className="bg-[#f8f9fa] border-b border-[#e0e3e5]">
                          <td colSpan={11} className="p-4">
                            <div className="bg-white rounded-2xl p-4 border border-[#e0e3e5] space-y-4">
                              <div className="flex items-center justify-between border-b border-[#f2f4f6] pb-2">
                                <h4 className="font-bold text-xs text-[#191c1e] uppercase tracking-wide">
                                  Rincian Aspek Penilaian 3 Dewan Juri (No. Undian: {p.noUndian} - {p.nama})
                                </h4>
                                <span className="text-xs text-[#50606e]">
                                  Standar Rubrik FTBI ({activeCabang.kriteria.length} Aspek Penilaian)
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Juri 1 Card */}
                                <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#e0e3e5]">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-xs text-[#006495]">Juri I</span>
                                    <span className="font-mono text-xs font-bold tabular-nums">
                                      Total: {p.nilaiJuri1?.totalWeightedScore.toFixed(2) || '0.00'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#50606e] mb-2 truncate">
                                    {p.nilaiJuri1?.juryName || 'Belum diisi'}
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    {activeCabang.kriteria.map((k) => (
                                      <div key={k.id} className="flex justify-between text-[#50606e]">
                                        <span className="truncate pr-2">{k.nama}</span>
                                        <span className="font-mono font-medium text-[#191c1e] tabular-nums">
                                          {p.nilaiJuri1?.kriteriaScores[k.id] || 0}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  {p.nilaiJuri1?.catatan && (
                                    <div className="mt-2.5 pt-2 border-t border-[#e0e3e5] text-[11px] text-[#50606e] italic">
                                      "{p.nilaiJuri1.catatan}"
                                    </div>
                                  )}
                                </div>

                                {/* Juri 2 Card */}
                                <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#e0e3e5]">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-xs text-[#006495]">Juri II</span>
                                    <span className="font-mono text-xs font-bold tabular-nums">
                                      Total: {p.nilaiJuri2?.totalWeightedScore || '0'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#50606e] mb-2 truncate">
                                    {p.nilaiJuri2?.juryName || 'Belum diisi'}
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    {activeCabang.kriteria.map((k) => (
                                      <div key={k.id} className="flex justify-between text-[#50606e]">
                                        <span className="truncate pr-2">{k.nama}</span>
                                        <span className="font-mono font-medium text-[#191c1e] tabular-nums">
                                          {p.nilaiJuri2?.kriteriaScores[k.id] || 0}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  {p.nilaiJuri2?.catatan && (
                                    <div className="mt-2.5 pt-2 border-t border-[#e0e3e5] text-[11px] text-[#50606e] italic">
                                      "{p.nilaiJuri2.catatan}"
                                    </div>
                                  )}
                                </div>

                                {/* Juri 3 Card */}
                                <div className="p-3 bg-[#f8f9fa] rounded-xl border border-[#e0e3e5]">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-xs text-[#006495]">Juri III</span>
                                    <span className="font-mono text-xs font-bold tabular-nums">
                                      Total: {p.nilaiJuri3?.totalWeightedScore || '0'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#50606e] mb-2 truncate">
                                    {p.nilaiJuri3?.juryName || 'Belum diisi'}
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    {activeCabang.kriteria.map((k) => (
                                      <div key={k.id} className="flex justify-between text-[#50606e]">
                                        <span className="truncate pr-2">{k.nama}</span>
                                        <span className="font-mono font-medium text-[#191c1e] tabular-nums">
                                          {p.nilaiJuri3?.kriteriaScores[k.id] || 0}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  {p.nilaiJuri3?.catatan && (
                                    <div className="mt-2.5 pt-2 border-t border-[#e0e3e5] text-[11px] text-[#50606e] italic">
                                      "{p.nilaiJuri3.catatan}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
