import React, { useState, useMemo } from 'react';
import { PesertaFTBI, Jenjang, KategoriGender } from '../types/ftbi';
import { CABANG_LOMBA_LIST } from '../data/ftbiBranches';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Database,
  SlidersHorizontal,
  ChevronRight,
  Download,
  Printer,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  BookOpen,
  Music,
  Mic,
  PenTool,
  Smile,
  FileText,
  School,
  MapPin,
  ExternalLink,
  X,
  Eye,
  Sparkles
} from 'lucide-react';

interface ParticipantRosterViewProps {
  pesertaList: PesertaFTBI[];
  onSelectPesertaForScoring: (peserta: PesertaFTBI) => void;
  onSyncSpreadsheet: () => void;
  isSyncing: boolean;
  onOpenSyncModal: () => void;
  isConnectedGas: boolean;
  lastSyncTime?: string | null;
  onAddPeserta?: (newPeserta: Omit<PesertaFTBI, 'id' | 'totalNilai' | 'rataRataNilai' | 'statusVerifikasi'>) => void;
  onUpdatePesertaCabang?: (pesertaId: string, newCabangId: string) => void;
}

// Icon and color mapper for the 6 official FTBI branches
const BRANCH_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; borderColor: string; shortName: string }> = {
  menyanyi: {
    icon: Music,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    shortName: 'Menyanyi Nyanyian Rakyat'
  },
  mendongeng: {
    icon: BookOpen,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    shortName: 'Mendongeng'
  },
  menulis_membaca_puisi: {
    icon: PenTool,
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    shortName: 'Menulis dan Membaca Puisi'
  },
  berpidato: {
    icon: Mic,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    shortName: 'Berpidato'
  },
  stand_up_comedy: {
    icon: Smile,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    shortName: 'Lawakan Tunggal'
  },
  menulis_cerpen: {
    icon: FileText,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    shortName: 'Cerita Pendek'
  }
};

export const ParticipantRosterView: React.FC<ParticipantRosterViewProps> = ({
  pesertaList,
  onSelectPesertaForScoring,
  onSyncSpreadsheet,
  isSyncing,
  onOpenSyncModal,
  isConnectedGas,
  lastSyncTime,
  onAddPeserta,
  onUpdatePesertaCabang,
}) => {
  // Filter States
  const [selectedCabang, setSelectedCabang] = useState<string>('all');
  const [selectedJenjang, setSelectedJenjang] = useState<'ALL' | Jenjang>('ALL');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'Putra' | 'Putri'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'Diverifikasi' | 'Sebagian' | 'Belum Dinilai'>('ALL');
  const [selectedSekolah, setSelectedSekolah] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'noUndian' | 'nama' | 'nilai' | 'terbaru'>('noUndian');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // School list for dropdown
  const schoolList = useMemo(() => {
    return Array.from(
      new Set(
        pesertaList
          .map((p) => p.asalSekolah)
          .filter((s) => s && s !== '-')
      )
    ).sort();
  }, [pesertaList]);

  // Modal States
  const [selectedDetailPeserta, setSelectedDetailPeserta] = useState<PesertaFTBI | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form State for manual participant registration
  const [formData, setFormData] = useState({
    noUndian: '',
    nama: '',
    nisn: '',
    asalSekolah: '',
    kecamatanKabupaten: '',
    jenjang: 'SD' as Jenjang,
    cabangLombaId: 'menyanyi',
    kategoriGender: 'Putra' as KategoriGender
  });

  // Filter & Search Logic
  const filteredPeserta = useMemo(() => {
    return pesertaList.filter((p) => {
      // Cabang filter
      if (selectedCabang !== 'all' && p.cabangLombaId !== selectedCabang) {
        return false;
      }
      // Jenjang filter
      if (selectedJenjang !== 'ALL' && p.jenjang !== selectedJenjang) {
        return false;
      }
      // Gender filter
      if (selectedGender !== 'ALL' && p.kategoriGender !== selectedGender) {
        return false;
      }
      // School filter
      if (selectedSekolah !== 'ALL' && p.asalSekolah !== selectedSekolah) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && p.statusVerifikasi !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNama = p.nama.toLowerCase().includes(q);
        const matchNo = p.noUndian.toLowerCase().includes(q);
        const matchSekolah = p.asalSekolah.toLowerCase().includes(q);
        const matchWilayah = p.kecamatanKabupaten.toLowerCase().includes(q);
        const matchNisn = (p.nisn || '').toLowerCase().includes(q);
        if (!matchNama && !matchNo && !matchSekolah && !matchWilayah && !matchNisn) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'noUndian') {
        const numA = parseInt(a.noUndian, 10) || 0;
        const numB = parseInt(b.noUndian, 10) || 0;
        return numA - numB;
      }
      if (sortBy === 'nama') {
        return a.nama.localeCompare(b.nama);
      }
      if (sortBy === 'nilai') {
        return (b.totalNilai || 0) - (a.totalNilai || 0);
      }
      if (sortBy === 'terbaru') {
        return (b.timestampPendaftaran || '').localeCompare(a.timestampPendaftaran || '');
      }
      return 0;
    });
  }, [pesertaList, selectedCabang, selectedJenjang, selectedGender, selectedStatus, searchQuery, sortBy]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = pesertaList.length;
    const sdCount = pesertaList.filter((p) => p.jenjang === 'SD').length;
    const smpCount = pesertaList.filter((p) => p.jenjang === 'SMP').length;
    const verifiedCount = pesertaList.filter((p) => p.statusVerifikasi === 'Diverifikasi').length;
    const partialCount = pesertaList.filter((p) => p.statusVerifikasi === 'Sebagian').length;
    const pendingCount = pesertaList.filter((p) => p.statusVerifikasi === 'Belum Dinilai').length;

    // Per branch count
    const branchCounts: Record<string, number> = {};
    CABANG_LOMBA_LIST.forEach((c) => {
      branchCounts[c.id] = pesertaList.filter((p) => p.cabangLombaId === c.id).length;
    });

    return { total, sdCount, smpCount, verifiedCount, partialCount, pendingCount, branchCounts };
  }, [pesertaList]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No Undian',
      'Nama Peserta',
      'NISN',
      'Jenjang',
      'Cabang Lomba',
      'Kategori',
      'Asal Sekolah',
      'Kabupaten / Kota',
      'Nilai Juri 1',
      'Nilai Juri 2',
      'Nilai Juri 3',
      'Total Nilai',
      'Rata-rata',
      'Status'
    ];

    const rows = filteredPeserta.map((p) => {
      const cabang = CABANG_LOMBA_LIST.find((c) => c.id === p.cabangLombaId);
      return [
        `"${p.noUndian}"`,
        `"${p.nama}"`,
        `"${p.nisn || '-'}"`,
        `"${p.jenjang}"`,
        `"${cabang ? cabang.nama : p.cabangLombaId}"`,
        `"${p.kategoriGender}"`,
        `"${p.asalSekolah}"`,
        `"${p.kecamatanKabupaten}"`,
        p.nilaiJuri1?.totalWeightedScore || 0,
        p.nilaiJuri2?.totalWeightedScore || 0,
        p.nilaiJuri3?.totalWeightedScore || 0,
        p.totalNilai || 0,
        p.rataRataNilai || 0,
        `"${p.statusVerifikasi}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Peserta_FTBI_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Form Submit for new participant
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.asalSekolah.trim()) {
      alert('Mohon isi nama peserta dan asal sekolah.');
      return;
    }

    if (onAddPeserta) {
      onAddPeserta({
        noUndian: formData.noUndian.trim() || String(pesertaList.length + 1).padStart(2, '0'),
        nama: formData.nama.trim(),
        nisn: formData.nisn.trim() || undefined,
        asalSekolah: formData.asalSekolah.trim(),
        kecamatanKabupaten: formData.kecamatanKabupaten.trim() || 'Kab. Seram Bagian Barat',
        jenjang: formData.jenjang,
        cabangLombaId: formData.cabangLombaId,
        kategoriGender: formData.kategoriGender,
        timestampPendaftaran: new Date().toLocaleString('sv-SE').replace('T', ' ')
      });
    }

    // Reset and close
    setFormData({
      noUndian: '',
      nama: '',
      nisn: '',
      asalSekolah: '',
      kecamatanKabupaten: '',
      jenjang: 'SD',
      cabangLombaId: 'menyanyi',
      kategoriGender: 'Putra'
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Roster Header & Synchronization */}
      <section className="bg-white rounded-3xl p-6 lg:p-8 border border-[#e0e3e5] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e8def8] text-[#1d192b]">
                <Users className="w-3.5 h-3.5" />
                Master Data Peserta
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isConnectedGas
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isConnectedGas ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                {isConnectedGas ? 'Tersinkronisasi Spreadsheet' : 'Mode Offline / Data Lokal'}
              </span>
              {lastSyncTime && (
                <span className="text-xs text-[#50606e] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Terakhir sinkron: {lastSyncTime}
                </span>
              )}
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#191c1e] tracking-tight">
              Daftar Peserta & 6 Cabang Lomba FTBI
            </h2>
            <p className="text-sm text-[#50606e] max-w-3xl leading-relaxed">
              Data terpadu seluruh kontingen Festival Tunas Bahasa Ibu (Menyanyi Nyanyian Rakyat, Mendongeng, Menulis & Membaca Puisi, Berpidato, Lawakan Tunggal, dan Cerita Pendek) yang terhubung langsung dengan Google Spreadsheet respon formulir.
            </p>
          </div>

          {/* Sync & Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onSyncSpreadsheet}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#006495] hover:bg-[#004f76] text-white rounded-2xl font-semibold text-xs shadow-sm transition-all disabled:opacity-50 m3-button-press"
              title="Sinkronkan data peserta sekarang dari Spreadsheet"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Sheet'}</span>
            </button>

            <button
              onClick={onOpenSyncModal}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-[#f1f3f4] text-[#191c1e] border border-[#c2c7cf] rounded-2xl font-medium text-xs transition-colors m3-button-press"
              title="Kelola URL Google Apps Script atau Tautan Spreadsheet"
            >
              <Database className="w-4 h-4 text-[#006495]" />
              <span>Pengaturan Sheet</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-[#e8def8] hover:bg-[#d0bcff] text-[#1d192b] rounded-2xl font-medium text-xs transition-colors m3-button-press"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Peserta</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2.5 bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#3f3f46] rounded-2xl font-medium text-xs transition-colors"
              title="Unduh data dalam format CSV / Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* M3 Stat Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 mt-6 border-t border-[#e0e3e5]">
          <div className="bg-[#f8f9fa] rounded-2xl p-3.5 border border-[#e0e3e5]">
            <p className="text-[11px] font-medium text-[#50606e]">Total Peserta</p>
            <p className="text-2xl font-bold text-[#191c1e] mt-0.5">{stats.total}</p>
            <span className="text-[10px] text-[#50606e]">Terdaftar di sistem</span>
          </div>
          <div className="bg-[#eff6ff] rounded-2xl p-3.5 border border-blue-200">
            <p className="text-[11px] font-medium text-blue-700">Tingkat SD</p>
            <p className="text-2xl font-bold text-blue-900 mt-0.5">{stats.sdCount}</p>
            <span className="text-[10px] text-blue-700">Siswa SD</span>
          </div>
          <div className="bg-[#f5f3ff] rounded-2xl p-3.5 border border-violet-200">
            <p className="text-[11px] font-medium text-violet-700">Tingkat SMP</p>
            <p className="text-2xl font-bold text-violet-900 mt-0.5">{stats.smpCount}</p>
            <span className="text-[10px] text-violet-700">Siswa SMP</span>
          </div>
          <div className="bg-[#f0fdf4] rounded-2xl p-3.5 border border-emerald-200">
            <p className="text-[11px] font-medium text-emerald-700">Diverifikasi 3 Juri</p>
            <p className="text-2xl font-bold text-emerald-900 mt-0.5">{stats.verifiedCount}</p>
            <span className="text-[10px] text-emerald-700">Nilai lengkap</span>
          </div>
          <div className="bg-[#fffbeb] rounded-2xl p-3.5 border border-amber-200">
            <p className="text-[11px] font-medium text-amber-700">Sebagian Dinilai</p>
            <p className="text-2xl font-bold text-amber-900 mt-0.5">{stats.partialCount}</p>
            <span className="text-[10px] text-amber-700">1 - 2 Juri</span>
          </div>
          <div className="bg-[#f8fafc] rounded-2xl p-3.5 border border-slate-200">
            <p className="text-[11px] font-medium text-slate-600">Belum Dinilai</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.pendingCount}</p>
            <span className="text-[10px] text-slate-500">Antrean tampil</span>
          </div>
        </div>
      </section>

      {/* 6 Official Branch Filter Cards (User Requested Categories) */}
      <section className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#006495]" />
            <h3 className="font-bold text-base text-[#191c1e]">
              Filter Menurut 6 Jenis Lomba Resmi FTBI
            </h3>
          </div>
          <button
            onClick={() => setSelectedCabang('all')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
              selectedCabang === 'all'
                ? 'bg-[#006495] text-white shadow-sm'
                : 'bg-[#f1f3f4] text-[#50606e] hover:text-[#191c1e]'
            }`}
          >
            Tampilkan Semua ({pesertaList.length})
          </button>
        </div>

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {CABANG_LOMBA_LIST.map((cabang) => {
            const config = BRANCH_CONFIG[cabang.id] || {
              icon: Award,
              color: 'text-[#006495]',
              bgColor: 'bg-sky-50',
              borderColor: 'border-sky-200',
              shortName: cabang.nama
            };
            const Icon = config.icon;
            const count = stats.branchCounts[cabang.id] || 0;
            const isSelected = selectedCabang === cabang.id;

            return (
              <button
                key={cabang.id}
                onClick={() => setSelectedCabang(isSelected ? 'all' : cabang.id)}
                className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all text-left relative overflow-hidden group m3-button-press ${
                  isSelected
                    ? `${config.bgColor} ${config.borderColor} ring-2 ring-offset-1 ring-[#006495] shadow-sm`
                    : 'bg-[#fcfdfd] hover:bg-slate-50 border-[#e0e3e5]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white shadow-xs text-[#191c1e]' : 'bg-[#eceeef] text-[#50606e]'
                  }`}>
                    {count}
                  </span>
                </div>
                <p className="font-bold text-xs text-[#191c1e] line-clamp-2 leading-tight">
                  {config.shortName}
                </p>
                <span className="text-[10px] text-[#50606e] mt-1">
                  SD & SMP · {cabang.kriteria.length} Kriteria
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Search, Secondary Filters, and View Controls */}
      <section className="bg-white rounded-3xl p-5 border border-[#e0e3e5] shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#50606e] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama peserta, no undian, asal sekolah, NISN, atau kota/kabupaten..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-[#c2c7cf] rounded-2xl text-xs text-[#191c1e] placeholder:text-[#8e9192] focus:outline-none focus:border-[#006495] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#50606e] hover:text-[#191c1e]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills / Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Jenjang Segmented Button */}
            <div className="flex items-center p-1 bg-[#eceeef] rounded-xl text-xs">
              {(['ALL', 'SD', 'SMP'] as const).map((jenjang) => (
                <button
                  key={jenjang}
                  onClick={() => setSelectedJenjang(jenjang)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    selectedJenjang === jenjang
                      ? 'bg-white text-[#006495] shadow-xs font-semibold'
                      : 'text-[#50606e] hover:text-[#191c1e]'
                  }`}
                >
                  {jenjang === 'ALL' ? 'Semua Jenjang' : jenjang}
                </button>
              ))}
            </div>

            {/* Gender Filter */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value as any)}
              className="px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl text-xs text-[#191c1e] font-medium focus:outline-none focus:border-[#006495]"
            >
              <option value="ALL">Semua Gender</option>
              <option value="Putra">Putra</option>
              <option value="Putri">Putri</option>
            </select>

            {/* School Filter */}
            <select
              value={selectedSekolah}
              onChange={(e) => setSelectedSekolah(e.target.value)}
              className="px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl text-xs text-[#191c1e] font-medium focus:outline-none focus:border-[#006495] max-w-[200px] truncate"
            >
              <option value="ALL">Semua Sekolah ({schoolList.length})</option>
              {schoolList.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl text-xs text-[#191c1e] font-medium focus:outline-none focus:border-[#006495]"
            >
              <option value="ALL">Semua Status</option>
              <option value="Diverifikasi">Diverifikasi (3 Juri)</option>
              <option value="Sebagian">Sebagian Dinilai</option>
              <option value="Belum Dinilai">Belum Dinilai</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl text-xs text-[#191c1e] font-medium focus:outline-none focus:border-[#006495]"
            >
              <option value="noUndian">Urutkan No. Undian</option>
              <option value="nama">Urutkan Nama (A - Z)</option>
              <option value="nilai">Urutkan Skor Tertinggi</option>
              <option value="terbaru">Pendaftaran Terbaru</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-[#eceeef] rounded-xl text-xs ml-auto sm:ml-0">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'table' ? 'bg-white text-[#006495] shadow-xs' : 'text-[#50606e]'
                }`}
                title="Tampilan Tabel"
              >
                Tabel
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'grid' ? 'bg-white text-[#006495] shadow-xs' : 'text-[#50606e]'
                }`}
                title="Tampilan Kartu"
              >
                Kartu
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(selectedCabang !== 'all' || selectedJenjang !== 'ALL' || selectedGender !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#e0e3e5] text-xs">
            <span className="text-[#50606e] font-medium">Filter Aktif:</span>
            {selectedCabang !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#cbe6ff] text-[#001e30] font-medium">
                {BRANCH_CONFIG[selectedCabang]?.shortName || selectedCabang}
                <button onClick={() => setSelectedCabang('all')} className="hover:text-red-600">×</button>
              </span>
            )}
            {selectedJenjang !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-medium">
                Jenjang {selectedJenjang}
                <button onClick={() => setSelectedJenjang('ALL')} className="hover:text-red-600">×</button>
              </span>
            )}
            {selectedGender !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium">
                Kategori {selectedGender}
                <button onClick={() => setSelectedGender('ALL')} className="hover:text-red-600">×</button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus('ALL')} className="hover:text-red-600">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-medium">
                Pencarian: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-red-600">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedCabang('all');
                setSelectedJenjang('ALL');
                setSelectedGender('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-[#006495] font-semibold hover:underline ml-2"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </section>

      {/* Main Content: Table or Grid */}
      {filteredPeserta.length === 0 ? (
        <section className="bg-white rounded-3xl p-12 text-center border border-[#e0e3e5]">
          <div className="w-16 h-16 rounded-full bg-[#f8f9fa] border border-[#e0e3e5] flex items-center justify-center mx-auto text-[#50606e] mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#191c1e]">Tidak Ada Peserta yang Sesuai</h3>
          <p className="text-sm text-[#50606e] max-w-md mx-auto mt-1 mb-6">
            Tidak ditemukan data peserta untuk kombinasi filter atau pencarian saat ini. Anda dapat mereset filter atau menyinkronkan data terbaru dari Google Spreadsheet.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedCabang('all');
                setSelectedJenjang('ALL');
                setSelectedGender('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-xs font-semibold bg-[#eceeef] text-[#191c1e] hover:bg-[#dfe1e2] rounded-xl transition-colors"
            >
              Reset Filter
            </button>
            <button
              onClick={onSyncSpreadsheet}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#006495] text-white hover:bg-[#004f76] rounded-xl transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sinkronkan Spreadsheet Sekarang</span>
            </button>
          </div>
        </section>
      ) : viewMode === 'table' ? (
        /* M3 Spacious Data Table */
        <section className="bg-white rounded-3xl border border-[#e0e3e5] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#e0e3e5] text-[11px] font-bold text-[#50606e] tracking-wider uppercase">
                  <th className="py-3.5 px-4 text-center w-16">Undian</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Identitas Peserta</th>
                  <th className="py-3.5 px-4 min-w-[190px]">Jenis Lomba FTBI</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Asal Sekolah & Wilayah</th>
                  <th className="py-3.5 px-4 text-center min-w-[150px]">Nilai Juri (I / II / III)</th>
                  <th className="py-3.5 px-4 text-right min-w-[110px]">Total Skor</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Status</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceeef] text-xs">
                {filteredPeserta.map((peserta) => {
                  const branchCfg = BRANCH_CONFIG[peserta.cabangLombaId] || {
                    icon: Award,
                    color: 'text-[#006495]',
                    bgColor: 'bg-sky-50',
                    borderColor: 'border-sky-200',
                    shortName: peserta.cabangLombaId
                  };
                  const BranchIcon = branchCfg.icon;

                  const j1Score = peserta.nilaiJuri1?.totalWeightedScore;
                  const j2Score = peserta.nilaiJuri2?.totalWeightedScore;
                  const j3Score = peserta.nilaiJuri3?.totalWeightedScore;

                  return (
                    <tr
                      key={peserta.id}
                      className="hover:bg-[#f8fafc] transition-colors group"
                    >
                      {/* No. Undian Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#006495] text-white font-bold text-xs shadow-xs">
                          {peserta.noUndian}
                        </span>
                      </td>

                      {/* Identitas Peserta */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-[#191c1e] group-hover:text-[#006495] transition-colors">
                          {peserta.nama}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#50606e]">
                          <span className={`px-1.5 py-0.2 rounded font-medium ${
                            peserta.kategoriGender === 'Putri'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {peserta.kategoriGender}
                          </span>
                          {peserta.nisn && (
                            <span>NISN: {peserta.nisn}</span>
                          )}
                        </div>
                      </td>

                      {/* Cabang Lomba Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${branchCfg.bgColor} ${branchCfg.color} ${branchCfg.borderColor}`}>
                            <BranchIcon className="w-3.5 h-3.5" />
                            {branchCfg.shortName}
                          </span>
                        </div>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-[#50606e]">
                          Jenjang {peserta.jenjang}
                        </span>
                      </td>

                      {/* Asal Sekolah & Wilayah */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-[#191c1e]">
                          <School className="w-3.5 h-3.5 text-[#50606e] shrink-0" />
                          <span className="truncate max-w-[200px]" title={peserta.asalSekolah}>
                            {peserta.asalSekolah}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#50606e] mt-0.5">
                          <MapPin className="w-3 h-3 text-[#8e9192] shrink-0" />
                          <span className="truncate max-w-[200px]" title={peserta.kecamatanKabupaten}>
                            {peserta.kecamatanKabupaten}
                          </span>
                        </div>
                      </td>

                      {/* Nilai Juri I, II, III */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-[#f1f3f4] px-2.5 py-1 rounded-xl">
                          <span className={`font-mono font-bold ${j1Score !== undefined ? 'text-[#006495]' : 'text-slate-400'}`}>
                            {j1Score !== undefined ? j1Score : '-'}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className={`font-mono font-bold ${j2Score !== undefined ? 'text-[#006495]' : 'text-slate-400'}`}>
                            {j2Score !== undefined ? j2Score : '-'}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className={`font-mono font-bold ${j3Score !== undefined ? 'text-[#006495]' : 'text-slate-400'}`}>
                            {j3Score !== undefined ? j3Score : '-'}
                          </span>
                        </div>
                      </td>

                      {/* Total Skor & Rata-rata */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-extrabold text-sm text-[#191c1e] font-mono">
                          {peserta.totalNilai > 0 ? peserta.totalNilai.toLocaleString('id-ID') : '-'}
                        </div>
                        {peserta.totalNilai > 0 && (
                          <div className="text-[10px] text-[#50606e]">
                            Rata: {peserta.rataRataNilai.toFixed(1)}
                          </div>
                        )}
                      </td>

                      {/* Status Verifikasi Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {peserta.statusVerifikasi === 'Diverifikasi' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Lengkap 3 Juri
                          </span>
                        ) : peserta.statusVerifikasi === 'Sebagian' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Sebagian
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            Belum Dinilai
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectPesertaForScoring(peserta)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#cbe6ff] hover:bg-[#b2d9ff] text-[#001e30] font-semibold text-xs transition-colors shadow-xs m3-button-press"
                            title="Buka form penilaian untuk peserta ini"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Nilai</span>
                          </button>
                          <button
                            onClick={() => setSelectedDetailPeserta(peserta)}
                            className="p-1.5 rounded-xl text-[#50606e] hover:text-[#191c1e] hover:bg-[#f1f3f4] transition-colors"
                            title="Lihat Detail Biodata & Skor"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="p-4 bg-[#f8f9fa] border-t border-[#e0e3e5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#50606e]">
            <div>
              Menampilkan <span className="font-bold text-[#191c1e]">{filteredPeserta.length}</span> dari{' '}
              <span className="font-bold text-[#191c1e]">{pesertaList.length}</span> total peserta terdaftar
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Lengkap ({stats.verifiedCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Sebagian ({stats.partialCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Belum ({stats.pendingCount})
              </span>
            </div>
          </div>
        </section>
      ) : (
        /* M3 Elevated Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeserta.map((peserta) => {
            const branchCfg = BRANCH_CONFIG[peserta.cabangLombaId] || {
              icon: Award,
              color: 'text-[#006495]',
              bgColor: 'bg-sky-50',
              borderColor: 'border-sky-200',
              shortName: peserta.cabangLombaId
            };
            const BranchIcon = branchCfg.icon;

            return (
              <div
                key={peserta.id}
                className="bg-white rounded-3xl p-5 border border-[#e0e3e5] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: No Undian & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-[#006495] text-white font-bold text-sm shadow-xs">
                        {peserta.noUndian}
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-[#50606e] uppercase tracking-wider block">
                          No. Undian
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          peserta.jenjang === 'SD' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {peserta.jenjang}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${branchCfg.bgColor} ${branchCfg.color} ${branchCfg.borderColor}`}>
                      <BranchIcon className="w-3 h-3" />
                      {branchCfg.shortName}
                    </span>
                  </div>

                  {/* Participant Name & School */}
                  <div className="space-y-1 mb-4">
                    <h4 className="font-extrabold text-base text-[#191c1e] line-clamp-1">
                      {peserta.nama}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-[#50606e]">
                      <School className="w-3.5 h-3.5 shrink-0 text-[#8e9192]" />
                      <span className="truncate">{peserta.asalSekolah}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8e9192]">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{peserta.kecamatanKabupaten}</span>
                    </div>
                  </div>

                  {/* Jury Scores Pills */}
                  <div className="bg-[#f8f9fa] rounded-2xl p-3 border border-[#e0e3e5] mb-4">
                    <div className="flex items-center justify-between text-[11px] text-[#50606e] mb-1.5">
                      <span>Nilai 3 Dewan Juri:</span>
                      <span className="font-bold text-[#191c1e]">
                        Total: {peserta.totalNilai > 0 ? peserta.totalNilai : '-'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
                      <div className="p-1.5 rounded-xl bg-white border border-[#e0e3e5]">
                        <span className="block text-[9px] text-[#50606e] font-sans">Juri I</span>
                        <span className="font-bold text-[#006495]">
                          {peserta.nilaiJuri1?.totalWeightedScore || '-'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white border border-[#e0e3e5]">
                        <span className="block text-[9px] text-[#50606e] font-sans">Juri II</span>
                        <span className="font-bold text-[#006495]">
                          {peserta.nilaiJuri2?.totalWeightedScore || '-'}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white border border-[#e0e3e5]">
                        <span className="block text-[9px] text-[#50606e] font-sans">Juri III</span>
                        <span className="font-bold text-[#006495]">
                          {peserta.nilaiJuri3?.totalWeightedScore || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#eceeef]">
                  <button
                    onClick={() => onSelectPesertaForScoring(peserta)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#006495] hover:bg-[#004f76] text-white font-semibold text-xs transition-colors shadow-xs m3-button-press"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Input Penilaian Juri</span>
                  </button>
                  <button
                    onClick={() => setSelectedDetailPeserta(peserta)}
                    className="p-2 rounded-xl border border-[#c2c7cf] hover:bg-[#f1f3f4] text-[#50606e] transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Participant Detail Modal */}
      {selectedDetailPeserta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#e0e3e5] shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-[#e0e3e5]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#006495] text-white flex items-center justify-center text-lg font-bold">
                  {selectedDetailPeserta.noUndian}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#191c1e]">{selectedDetailPeserta.nama}</h3>
                  <p className="text-xs text-[#50606e]">
                    {selectedDetailPeserta.asalSekolah} · {selectedDetailPeserta.kecamatanKabupaten}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailPeserta(null)}
                className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[#50606e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Biodata Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 text-xs">
              <div className="p-2.5 bg-[#f8f9fa] rounded-xl border border-[#e0e3e5]">
                <span className="text-[10px] text-[#50606e] block">Jenjang</span>
                <span className="font-bold text-[#191c1e]">{selectedDetailPeserta.jenjang}</span>
              </div>
              <div className="p-2.5 bg-[#f8f9fa] rounded-xl border border-[#e0e3e5]">
                <span className="text-[10px] text-[#50606e] block">Kategori</span>
                <span className="font-bold text-[#191c1e]">{selectedDetailPeserta.kategoriGender}</span>
              </div>
              <div className="p-2.5 bg-[#f8f9fa] rounded-xl border border-[#e0e3e5]">
                <span className="text-[10px] text-[#50606e] block">Cabang Lomba</span>
                <span className="font-bold text-[#006495]">
                  {BRANCH_CONFIG[selectedDetailPeserta.cabangLombaId]?.shortName || selectedDetailPeserta.cabangLombaId}
                </span>
              </div>
              <div className="p-2.5 bg-[#f8f9fa] rounded-xl border border-[#e0e3e5]">
                <span className="text-[10px] text-[#50606e] block">Total Skor</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  {selectedDetailPeserta.totalNilai || '-'}
                </span>
              </div>
            </div>

            {/* Jury Scores Details */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold text-[#50606e] uppercase tracking-wider">
                Rincian Lembar Nilai Dewan Juri
              </h4>

              {[
                { title: 'Juri I (Ketua Dewan Juri)', data: selectedDetailPeserta.nilaiJuri1 },
                { title: 'Juri II (Anggota)', data: selectedDetailPeserta.nilaiJuri2 },
                { title: 'Juri III (Anggota)', data: selectedDetailPeserta.nilaiJuri3 }
              ].map((j, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e0e3e5] text-xs">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="text-[#191c1e]">{j.title}</span>
                    <span className="font-mono text-[#006495]">
                      {j.data ? `${j.data.totalWeightedScore} Poin` : 'Belum Dinilai'}
                    </span>
                  </div>
                  {j.data?.catatan && (
                    <p className="text-[11px] text-[#50606e] italic mt-1 bg-white p-2 rounded-xl border border-[#eceeef]">
                      "{j.data.catatan}"
                    </p>
                  )}
                  {j.data?.timestamp && (
                    <span className="text-[10px] text-[#8e9192] block mt-1">
                      Waktu penilaian: {j.data.timestamp}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Koreksi / Pindahkan Cabang Lomba */}
            {onUpdatePesertaCabang && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 mb-6 text-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-amber-900">Koreksi / Pindahkan Cabang Lomba</span>
                </div>
                <p className="text-[11px] text-amber-800 mb-2.5 leading-relaxed">
                  Jika peserta ini terdaftar salah cabang (misal seharusnya <strong>Cerita Pendek</strong> tetapi sebelumnya masuk Berpidato), Anda dapat langsung memindahkannya di sini:
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedDetailPeserta.cabangLombaId}
                    onChange={(e) => {
                      const newBranchId = e.target.value;
                      onUpdatePesertaCabang(selectedDetailPeserta.id, newBranchId);
                      setSelectedDetailPeserta({
                        ...selectedDetailPeserta,
                        cabangLombaId: newBranchId,
                      });
                    }}
                    className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-[#191c1e] focus:outline-none focus:border-[#006495]"
                  >
                    {CABANG_LOMBA_LIST.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama} ({c.jenjang.join('/')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e0e3e5]">
              <button
                onClick={() => setSelectedDetailPeserta(null)}
                className="px-4 py-2 text-xs font-medium text-[#50606e] hover:bg-[#f1f3f4] rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const p = selectedDetailPeserta;
                  setSelectedDetailPeserta(null);
                  onSelectPesertaForScoring(p);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#006495] hover:bg-[#004f76] text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Buka Lembar Penilaian Juri</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Participant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#e0e3e5] shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#e0e3e5]">
              <div>
                <h3 className="text-lg font-bold text-[#191c1e]">Tambah Peserta Baru FTBI</h3>
                <p className="text-xs text-[#50606e]">
                  Daftarkan peserta manual jika belum masuk otomatis dari Google Form
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[#50606e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 my-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#191c1e] mb-1">Nomor Undian</label>
                  <input
                    type="text"
                    placeholder="Contoh: 05"
                    value={formData.noUndian}
                    onChange={(e) => setFormData({ ...formData, noUndian: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl focus:outline-none focus:border-[#006495]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#191c1e] mb-1">NISN (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0123456789"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl focus:outline-none focus:border-[#006495]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#191c1e] mb-1">Nama Lengkap Peserta *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap siswa"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl focus:outline-none focus:border-[#006495]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#191c1e] mb-1">Jenjang Pendidikan *</label>
                  <select
                    value={formData.jenjang}
                    onChange={(e) => setFormData({ ...formData, jenjang: e.target.value as Jenjang })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl focus:outline-none focus:border-[#006495]"
                  >
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#191c1e] mb-1">Kategori Gender *</label>
                  <select
                    value={formData.kategoriGender}
                    onChange={(e) => setFormData({ ...formData, kategoriGender: e.target.value as KategoriGender })}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl focus:outline-none focus:border-[#006495]"
                  >
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#191c1e] mb-1">Jenis Cabang Lomba *</label>
                <select
                  value={formData.cabangLombaId}
                  onChange={(e) => setFormData({ ...formData, cabangLombaId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl focus:outline-none focus:border-[#006495]"
                >
                  {CABANG_LOMBA_LIST.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama} ({c.kriteria.length} Kriteria)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#191c1e] mb-1">Asal Sekolah *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SD Inpres Kairatu"
                  value={formData.asalSekolah}
                  onChange={(e) => setFormData({ ...formData, asalSekolah: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl focus:outline-none focus:border-[#006495]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#191c1e] mb-1">Kecamatan / Kabupaten / Kota</label>
                <input
                  type="text"
                  placeholder="Contoh: Kec. Kairatu, Kab. Seram Bagian Barat"
                  value={formData.kecamatanKabupaten}
                  onChange={(e) => setFormData({ ...formData, kecamatanKabupaten: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl focus:outline-none focus:border-[#006495]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e0e3e5]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#50606e] hover:bg-[#f1f3f4] rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006495] hover:bg-[#004f76] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
