import React, { useState, useMemo, useEffect } from 'react';
import { CABANG_LOMBA_LIST } from '../data/ftbiBranches';
import { PesertaFTBI, Jenjang, UndianSekolahItem, UndianStateMap } from '../types/ftbi';
import {
  Shuffle,
  RotateCw,
  Printer,
  CheckCircle2,
  AlertCircle,
  School,
  Sparkles,
  Award,
  Users,
  Search,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
  Save,
  Trash2,
  FileText
} from 'lucide-react';

interface UndianUrutanTampilViewProps {
  pesertaList: PesertaFTBI[];
  onApplyUndianToPeserta: (undianResults: UndianSekolahItem[], jenjang: Jenjang, cabangLombaId: string) => void;
  selectedJenjang: Jenjang;
  setSelectedJenjang: (lvl: Jenjang) => void;
  selectedCabangId: string;
  setSelectedCabangId: (id: string) => void;
}

// 19 Official Participating Schools for SD & SMP in Kota Tual & Seram Bagian Barat
export const DEFAULT_19_SEKOLAH_SD = [
  'SD Inpres Kairatu',
  'SDN 1 Piru',
  'SD Katolik Kairatu',
  'SD Kristen Waimital',
  'SDN Kamarian',
  'SD Laboratorium Unpatti',
  'SDN Ohoijang',
  'SD YPPK Fransiskus Xaverius',
  'SD Inpres Tiakur',
  'SDN 2 Tual',
  'SD Kristen Seram Barat',
  'SDN Luhu',
  'SD Al-Hilal Tual',
  'SDN Kaibobo',
  'SD Inpres Waisamu',
  'SD YPPK Tual',
  'SDN Hatusua',
  'SD Kristen Taar',
  'SD Negeri Dullah'
];

export const DEFAULT_19_SEKOLAH_SMP = [
  'SMPN 1 Kota Tual',
  'SMPN 1 Piru',
  'SMPN 1 Kairatu Barat',
  'SMPN 2 Seram Barat',
  'SMPN 3 Tual',
  'SMP Kristen Dobo',
  'SMP Katolik Tual',
  'SMPN 2 Kairatu',
  'SMP Negeri 4 Tual',
  'SMP Kristen Piru',
  'SMPN 1 Seram Barat',
  'SMP PGRI Tual',
  'SMPN 2 Huamual',
  'SMP YPPK Santo Paulus',
  'SMPN 5 Tual',
  'SMP Kristen Kairatu',
  'SMPN 3 Seram Barat',
  'SMP Al-Hilal Tual',
  'SMP Negeri Dullah Laut'
];

export const UndianUrutanTampilView: React.FC<UndianUrutanTampilViewProps> = ({
  pesertaList,
  onApplyUndianToPeserta,
  selectedJenjang,
  setSelectedJenjang,
  selectedCabangId,
  setSelectedCabangId
}) => {
  // Local storage key helper
  const storageKey = `ftbi_undian_v2_${selectedJenjang}_${selectedCabangId}`;

  // State: results of undian for currently selected jenjang + cabangLomba
  const [undianItems, setUndianItems] = useState<UndianSekolahItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore error
    }
    return [];
  });

  // Re-load undian items when tab switches jenjang or cabang
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setUndianItems(JSON.parse(saved));
        return;
      }
    } catch {
      // ignore
    }
    setUndianItems([]);
  }, [selectedJenjang, selectedCabangId, storageKey]);

  // Save to localStorage when changed
  const saveUndianItems = (items: UndianSekolahItem[]) => {
    setUndianItems(items);
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  // Active Cabang object
  const activeCabang = useMemo(() => {
    return CABANG_LOMBA_LIST.find((c) => c.id === selectedCabangId) || CABANG_LOMBA_LIST[0];
  }, [selectedCabangId]);

  // Dynamic list of schools: combining default 19 schools with schools appearing in participant list
  const availableSchools = useMemo(() => {
    const defaultList = selectedJenjang === 'SD' ? DEFAULT_19_SEKOLAH_SD : DEFAULT_19_SEKOLAH_SMP;
    
    // Schools from current participants
    const participantSchools = Array.from(
      new Set(
        pesertaList
          .filter((p) => p.jenjang === selectedJenjang && p.asalSekolah && p.asalSekolah !== '-')
          .map((p) => p.asalSekolah)
      )
    );

    // Merge and preserve order, keeping maximum of 19 or user count
    const merged = Array.from(new Set([...defaultList, ...participantSchools]));
    // Take the top 19 schools
    return merged.slice(0, 19);
  }, [selectedJenjang, pesertaList]);

  // Map of participants by school for active jenjang & cabang
  const participantsBySchool = useMemo(() => {
    const map: Record<string, PesertaFTBI[]> = {};
    pesertaList
      .filter((p) => p.jenjang === selectedJenjang && p.cabangLombaId === selectedCabangId)
      .forEach((p) => {
        if (!map[p.asalSekolah]) map[p.asalSekolah] = [];
        map[p.asalSekolah].push(p);
      });
    return map;
  }, [pesertaList, selectedJenjang, selectedCabangId]);

  // Filter school state
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [searchSchoolQuery, setSearchSchoolQuery] = useState<string>('');

  // Animation States for single school lottery modal
  const [isSpinningModalOpen, setIsSpinningModalOpen] = useState(false);
  const [spinningSchool, setSpinningSchool] = useState<string | null>(null);
  const [animatedNumber, setAnimatedNumber] = useState<number>(1);
  const [finalDrawnNumber, setFinalDrawnNumber] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (appliedToast) {
      const t = setTimeout(() => setAppliedToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [appliedToast]);

  // Currently assigned numbers
  const usedNumbers = useMemo(() => {
    return new Set(undianItems.map((u) => u.nomorUndian));
  }, [undianItems]);

  // Remaining available numbers from 1 to 19
  const remainingNumbers = useMemo(() => {
    const list: number[] = [];
    for (let i = 1; i <= 19; i++) {
      if (!usedNumbers.has(i)) list.push(i);
    }
    return list;
  }, [usedNumbers]);

  // 19 slots list (Slot 1 to 19)
  const slotList = useMemo(() => {
    const slots: Array<{
      nomor: number;
      item?: UndianSekolahItem;
      peserta: PesertaFTBI[];
    }> = [];

    for (let num = 1; num <= 19; num++) {
      const match = undianItems.find((u) => u.nomorUndian === num);
      const peserta = match ? participantsBySchool[match.asalSekolah] || [] : [];
      slots.push({
        nomor: num,
        item: match,
        peserta
      });
    }

    return slots;
  }, [undianItems, participantsBySchool]);

  // ACTION 1: Undi Acak Semua Sekolah Sekaligus (Shuffle 19 Slots)
  const handleShuffleAll = () => {
    if (
      undianItems.length > 0 &&
      !window.confirm('Undi acak ulang seluruh 19 nomor urut tampil untuk mata lomba ini?')
    ) {
      return;
    }

    // Numbers 1 to 19 shuffled randomly (Fisher-Yates)
    const numbers = Array.from({ length: 19 }, (_, i) => i + 1);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newItems: UndianSekolahItem[] = availableSchools.map((sekolah, idx) => {
      const peserta = participantsBySchool[sekolah] || [];
      return {
        nomorUndian: numbers[idx],
        asalSekolah: sekolah,
        waktuUndi: now,
        pesertaCount: peserta.length,
        pesertaNames: peserta.map((p) => p.nama)
      };
    });

    saveUndianItems(newItems);
    setAppliedToast(`🎉 Berhasil mengundi 19 nomor urut tampil untuk ${newItems.length} sekolah!`);
  };

  // ACTION 2: Open single school spin modal
  const handleStartSpinForSchool = (sekolah: string) => {
    if (remainingNumbers.length === 0) {
      alert('Semua 19 nomor undian sudah terisi!');
      return;
    }
    setSpinningSchool(sekolah);
    setFinalDrawnNumber(null);
    setIsSpinning(true);
    setIsSpinningModalOpen(true);

    // Pick random available number
    const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
    const chosenNumber = remainingNumbers[randomIndex];

    // Rapid shuffle animation
    let count = 0;
    const interval = setInterval(() => {
      const randDisplay = Math.floor(Math.random() * 19) + 1;
      setAnimatedNumber(randDisplay);
      count++;
      if (count > 22) {
        clearInterval(interval);
        setAnimatedNumber(chosenNumber);
        setFinalDrawnNumber(chosenNumber);
        setIsSpinning(false);

        // Save
        const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const peserta = participantsBySchool[sekolah] || [];
        const updated = undianItems.filter((u) => u.asalSekolah !== sekolah);
        updated.push({
          nomorUndian: chosenNumber,
          asalSekolah: sekolah,
          waktuUndi: now,
          pesertaCount: peserta.length,
          pesertaNames: peserta.map((p) => p.nama)
        });
        saveUndianItems(updated);
      }
    }, 90);
  };

  // ACTION 3: Manual Assign or Change slot for a school
  const handleManualAssign = (nomor: number, sekolah: string) => {
    if (!sekolah) {
      // Remove assignment for this number
      const updated = undianItems.filter((u) => u.nomorUndian !== nomor);
      saveUndianItems(updated);
      return;
    }

    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const peserta = participantsBySchool[sekolah] || [];

    // Remove if school already had a number, or if slot had a school
    const updated = undianItems
      .filter((u) => u.nomorUndian !== nomor && u.asalSekolah !== sekolah)
      .concat({
        nomorUndian: nomor,
        asalSekolah: sekolah,
        waktuUndi: now,
        pesertaCount: peserta.length,
        pesertaNames: peserta.map((p) => p.nama)
      });

    saveUndianItems(updated);
  };

  // ACTION 4: Apply to participants
  const handleApplyToPeserta = () => {
    if (undianItems.length === 0) {
      alert('Belum ada hasil undian untuk diterapkan.');
      return;
    }
    onApplyUndianToPeserta(undianItems, selectedJenjang, selectedCabangId);
    setAppliedToast('✅ Hasil undian nomor urut tampil berhasil disinkronkan ke seluruh data peserta & papan penilaian!');
  };

  // ACTION 5: Reset Active Branch
  const handleReset = () => {
    if (window.confirm(`Kosongkan hasil undian untuk ${activeCabang.nama} Tingkat ${selectedJenjang}?`)) {
      saveUndianItems([]);
      setAppliedToast('Hasil undian telah direset.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {appliedToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-md flex items-center justify-between text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{appliedToast}</span>
          </div>
          <button onClick={() => setAppliedToast(null)} className="text-white/80 hover:text-white underline text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-[#006495] text-white rounded-2xl shrink-0 mt-0.5 shadow-sm">
              <Shuffle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#006495] bg-[#cbe6ff] px-2.5 py-0.5 rounded-full">
                  Sistem Pengundian 19 Nomor Tampil
                </span>
                <span className="text-xs text-[#50606e]">
                  {undianItems.length} dari 19 Slot Terisi
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#191c1e] tracking-tight mt-1">
                Pengundian Urutan Tampil Sekolah
              </h2>
              <p className="text-xs sm:text-sm text-[#50606e] mt-1 max-w-2xl">
                Undi urutan tampil per sekolah (19 nomor undian) untuk setiap mata lomba dan jenjang. Hasil undian akan otomatis menyinkronkan nomor peserta pada papan peringkat (*Leaderboard*) dan formulir penilaian juri.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleShuffleAll}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] rounded-2xl transition-all shadow-sm m3-button-press"
              title="Undi acak langsung seluruh 19 nomor untuk semua sekolah"
            >
              <Shuffle className="w-4 h-4" />
              <span>Undi Acak Semua (19 Slot)</span>
            </button>

            <button
              onClick={handleApplyToPeserta}
              disabled={undianItems.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#006495] bg-[#cbe6ff] hover:bg-[#b2d9ff] disabled:opacity-50 rounded-2xl transition-colors m3-button-press"
              title="Terapkan hasil undian ini ke nomor undian peserta pada Leaderboard"
            >
              <Save className="w-4 h-4" />
              <span>Terapkan ke Peserta</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#191c1e] bg-[#eceeef] hover:bg-slate-200 rounded-2xl transition-colors m3-button-press"
              title="Cetak Berita Acara Hasil Pengundian Urutan Tampil"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Berita Acara</span>
            </button>

            {undianItems.length > 0 && (
              <button
                onClick={handleReset}
                className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors"
                title="Reset hasil undian cabang ini"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Level & Branch Selection Bar */}
        <div className="mt-6 pt-5 border-t border-[#e0e3e5] flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Level Filter (SD / SMP) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#50606e]">Jenjang:</span>
            <div className="inline-flex p-1 bg-[#eceeef] rounded-2xl">
              <button
                onClick={() => setSelectedJenjang('SD')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  selectedJenjang === 'SD'
                    ? 'bg-[#006495] text-white shadow-xs'
                    : 'text-[#50606e] hover:text-[#191c1e]'
                }`}
              >
                SD (Sekolah Dasar)
              </button>
              <button
                onClick={() => setSelectedJenjang('SMP')}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  selectedJenjang === 'SMP'
                    ? 'bg-[#006495] text-white shadow-xs'
                    : 'text-[#50606e] hover:text-[#191c1e]'
                }`}
              >
                SMP (Sekolah Menengah Pertama)
              </button>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 text-xs text-[#50606e]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>{undianItems.length} Sudah Diundi</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span>{remainingNumbers.length} Tersedia</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-[#191c1e]">{availableSchools.length} Sekolah</span>
          </div>
        </div>

        {/* Horizontal Cabang Lomba Tabs */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CABANG_LOMBA_LIST.map((cabang) => {
            const isSelected = selectedCabangId === cabang.id;
            return (
              <button
                key={cabang.id}
                onClick={() => setSelectedCabangId(cabang.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-2xl transition-all whitespace-nowrap shrink-0 m3-button-press ${
                  isSelected
                    ? 'bg-[#006495] text-white shadow-sm'
                    : 'bg-[#f0f2f5] text-[#50606e] hover:bg-[#e4e7ea] hover:text-[#191c1e]'
                }`}
              >
                <span>{cabang.nama}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: 19 Lottery Slots & School Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 19 Numbered Slots (Grid of Cards) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#191c1e] flex items-center gap-2">
                  <span>Papan 19 Nomor Urut Tampil</span>
                  <span className="text-xs font-semibold text-[#006495] bg-[#cbe6ff] px-2 py-0.5 rounded-full">
                    {activeCabang.nama}
                  </span>
                </h3>
                <p className="text-xs text-[#50606e] mt-0.5">
                  Setiap kotak mewakili urutan tampil peserta dari sekolah yang bersangkutan.
                </p>
              </div>

              {/* Filter School Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value={filterSchool}
                  onChange={(e) => setFilterSchool(e.target.value)}
                  className="bg-[#f8f9fa] border border-[#c2c7cf] text-xs font-semibold rounded-xl px-2.5 py-1.5 text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#006495]"
                >
                  <option value="all">Tampilkan Semua (1-19)</option>
                  <option value="filled">Sudah Terisi Saja</option>
                  <option value="empty">Slot Kosong Saja</option>
                  {availableSchools.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 19 Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {slotList
                .filter(({ item, nomor }) => {
                  if (filterSchool === 'all') return true;
                  if (filterSchool === 'filled') return Boolean(item);
                  if (filterSchool === 'empty') return !item;
                  return item?.asalSekolah === filterSchool;
                })
                .map(({ nomor, item, peserta }) => {
                  const isFilled = Boolean(item);
                  return (
                    <div
                      key={nomor}
                      className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between min-h-[135px] ${
                        isFilled
                          ? 'bg-white border-[#006495]/30 shadow-xs hover:border-[#006495]'
                          : 'bg-[#fafafa] border-dashed border-[#c2c7cf] hover:border-slate-400'
                      }`}
                    >
                      {/* Top Header inside Slot */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                            isFilled
                              ? 'bg-[#006495] text-white shadow-xs'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {nomor < 10 ? `0${nomor}` : nomor}
                        </span>

                        {isFilled ? (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Terisi</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Tersedia
                          </span>
                        )}
                      </div>

                      {/* Slot Body Content */}
                      <div className="my-2">
                        {isFilled && item ? (
                          <div>
                            <h4 className="text-xs font-bold text-[#191c1e] line-clamp-1" title={item.asalSekolah}>
                              {item.asalSekolah}
                            </h4>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] text-[#50606e]">
                                {peserta.length > 0 ? (
                                  <span className="font-medium text-[#006495]">
                                    {peserta.map((p) => p.nama).join(', ')}
                                  </span>
                                ) : (
                                  <span className="italic text-slate-400">Belum ada peserta terdaftar</span>
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-1">
                            <p className="text-[11px] text-slate-400 italic">Nomor belum diambil</p>
                          </div>
                        )}
                      </div>

                      {/* Slot Footer Action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        {isFilled ? (
                          <button
                            onClick={() => handleManualAssign(nomor, '')}
                            className="text-rose-600 hover:text-rose-800 hover:underline text-[11px]"
                          >
                            Lepas Undian
                          </button>
                        ) : (
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleManualAssign(nomor, e.target.value);
                            }}
                            defaultValue=""
                            className="w-full text-[11px] bg-white border border-[#c2c7cf] rounded-lg px-2 py-1 text-slate-700"
                          >
                            <option value="">Pilih Sekolah...</option>
                            {availableSchools
                              .filter((s) => !undianItems.some((u) => u.asalSekolah === s))
                              .map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Col: Daftar Sekolah & Tombol Undi Satuan */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-1.5">
                <School className="w-4 h-4 text-[#006495]" />
                <span>Status Undian per Sekolah</span>
              </h3>
              <span className="text-xs font-semibold text-[#50606e]">
                {availableSchools.length} Sekolah
              </span>
            </div>

            {/* Search School */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama sekolah..."
                value={searchSchoolQuery}
                onChange={(e) => setSearchSchoolQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#f8f9fa] border border-[#c2c7cf] rounded-xl text-xs text-[#191c1e] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006495]"
              />
            </div>

            {/* School List */}
            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto pr-1">
              {availableSchools
                .filter((s) =>
                  s.toLowerCase().includes(searchSchoolQuery.toLowerCase().trim())
                )
                .map((sekolah, idx) => {
                  const assigned = undianItems.find((u) => u.asalSekolah === sekolah);
                  const peserta = participantsBySchool[sekolah] || [];

                  return (
                    <div key={sekolah} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-400 w-4">
                            {idx + 1}.
                          </span>
                          <p className="text-xs font-semibold text-[#191c1e] truncate" title={sekolah}>
                            {sekolah}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-5 truncate">
                          {peserta.length > 0
                            ? `${peserta.length} Peserta (${peserta.map((p) => p.nama).join(', ')})`
                            : '0 Peserta Terdaftar'}
                        </p>
                      </div>

                      {/* Badge / Button */}
                      <div className="shrink-0">
                        {assigned ? (
                          <div className="flex items-center gap-1">
                            <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-mono font-bold text-xs flex items-center justify-center">
                              {assigned.nomorUndian < 10
                                ? `0${assigned.nomorUndian}`
                                : assigned.nomorUndian}
                            </span>
                            <button
                              onClick={() => handleStartSpinForSchool(sekolah)}
                              className="p-1 text-slate-400 hover:text-[#006495] rounded-lg transition-colors"
                              title="Undi ulang sekolah ini"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartSpinForSchool(sekolah)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-[#006495] hover:bg-[#004f76] rounded-xl transition-all shadow-xs m3-button-press"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Undi</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Live Roulette Spinning Draw for a Single School */}
      {isSpinningModalOpen && spinningSchool && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#006495]">
                Pengundian Urutan Tampil
              </span>
              <button
                onClick={() => setIsSpinningModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6">
              <h3 className="text-sm font-semibold text-slate-600 mb-1">Undian untuk Sekolah:</h3>
              <h2 className="text-lg font-bold text-[#191c1e] px-4">{spinningSchool}</h2>
              <p className="text-xs text-[#006495] font-medium mt-1">
                {activeCabang.nama} · Tingkat {selectedJenjang}
              </p>

              {/* Number Wheel / Box */}
              <div className="my-6 flex justify-center">
                <div
                  className={`w-28 h-28 rounded-3xl flex flex-col items-center justify-center shadow-lg transition-all transform ${
                    isSpinning
                      ? 'bg-amber-400 text-amber-950 scale-105 animate-bounce'
                      : 'bg-[#006495] text-white scale-110 ring-4 ring-emerald-400'
                  }`}
                >
                  <span className="text-[10px] font-semibold tracking-wider uppercase opacity-80">
                    Nomor Undian
                  </span>
                  <span className="font-mono text-5xl font-black mt-1">
                    {animatedNumber < 10 ? `0${animatedNumber}` : animatedNumber}
                  </span>
                </div>
              </div>

              {isSpinning ? (
                <p className="text-xs font-semibold text-slate-500 animate-pulse">
                  Mengundi nomor acak (1 s.d. 19)...
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Resmi Memperoleh Nomor {finalDrawnNumber}!</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Sekolah akan tampil di urutan ke-{finalDrawnNumber} pada mata lomba {activeCabang.nama}.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                disabled={isSpinning}
                onClick={() => setIsSpinningModalOpen(false)}
                className="w-full py-2.5 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] disabled:opacity-50 rounded-xl transition-colors"
              >
                Simpan & Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cetak Berita Acara Pengundian Nomor Urut Tampil */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 print:p-0 print:bg-white overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-[#e0e3e5] print:border-none print:shadow-none print:p-2 relative my-6">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#f2f4f6] no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#006495]" />
                <h3 className="font-bold text-sm text-[#191c1e]">
                  Pratinjau Cetak Berita Acara Pengundian Nomor Urut Tampil
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] rounded-xl transition-all shadow-sm m3-button-press"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-[#72777f] hover:text-[#191c1e] rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Printable Document */}
            <div className="text-[#191c1e] text-xs font-serif leading-relaxed px-2">
              {/* Kop Surat Kemendikdasmen */}
              <div className="flex items-center justify-center gap-4 border-b-2 border-black pb-3 mb-4">
                <img
                  src="/logo-kemendikdasmen.svg"
                  alt="Logo Kemendikdasmen"
                  className="w-16 h-16 object-contain shrink-0"
                />
                <div className="text-center">
                  <h4 className="text-sm font-bold tracking-wider uppercase font-sans">
                    KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH
                  </h4>
                  <h3 className="text-base font-extrabold uppercase font-sans tracking-wide">
                    PANITIA FESTIVAL TUNAS BAHASA IBU (FTBI)
                  </h3>
                  <h2 className="text-lg font-black uppercase font-sans tracking-wider text-[#006495] print:text-black">
                    BERITA ACARA PENGUNDIAN NOMOR URUT TAMPIL
                  </h2>
                  <p className="text-[11px] font-sans text-gray-700 italic">
                    KOTA TUAL & KABUPATEN SERAM BAGIAN BARAT PROVINSI MALUKU
                  </p>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="text-center my-4 font-sans">
                <h3 className="text-base font-bold uppercase tracking-wider">
                  HASIL PENGUNDIAN NOMOR URUT TAMPIL (19 UNDIAN)
                </h3>
                <h4 className="text-sm font-bold uppercase tracking-wide text-gray-800">
                  MATA LOMBA: {activeCabang.nama.toUpperCase()} · TINGKAT {selectedJenjang}
                </h4>
              </div>

              <p className="font-sans text-xs text-justify mb-4">
                Pada hari ini telah dilaksanakan pengundian nomor urut tampil bagi seluruh kontingen / sekolah peserta Festival Tunas Bahasa Ibu (FTBI) tingkat {selectedJenjang} untuk cabang lomba <strong>{activeCabang.nama}</strong>. Berikut adalah daftar resmi 19 nomor urut tampil hasil pengundian:
              </p>

              {/* Table of 19 Slots */}
              <table className="w-full border-collapse border border-black text-xs font-sans mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-2 text-center w-14">No. Tampil</th>
                    <th className="border border-black px-3 py-2 text-left">Asal Sekolah</th>
                    <th className="border border-black px-3 py-2 text-left">Nama Peserta Terdaftar</th>
                    <th className="border border-black px-3 py-2 text-center w-28">Kategori</th>
                    <th className="border border-black px-3 py-2 text-center w-36">Tanda Tangan Pendamping</th>
                  </tr>
                </thead>
                <tbody>
                  {slotList.map(({ nomor, item, peserta }) => (
                    <tr key={nomor} className="border-b border-black">
                      <td className="border border-black px-2 py-2 text-center font-bold font-mono">
                        {nomor < 10 ? `0${nomor}` : nomor}
                      </td>
                      <td className="border border-black px-3 py-2 font-semibold">
                        {item ? item.asalSekolah : <span className="text-gray-400 italic">(Belum terisi)</span>}
                      </td>
                      <td className="border border-black px-3 py-2">
                        {peserta.length > 0 ? (
                          peserta.map((p) => p.nama).join(', ')
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="border border-black px-3 py-2 text-center">
                        {peserta.length > 0 ? peserta.map((p) => p.kategoriGender).join(', ') : '-'}
                      </td>
                      <td className="border border-black px-3 py-2 text-center text-gray-400 font-mono text-[10px]">
                        {nomor}. ........................
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="mt-8 grid grid-cols-2 gap-8 text-center font-sans text-xs pt-4">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-bold">Ketua Panitia Pelaksana FTBI</p>
                  <div className="h-16" />
                  <p className="font-bold underline">___________________________</p>
                  <p className="text-[10px] text-gray-600">NIP. ....................................</p>
                </div>
                <div>
                  <p>Kota Tual / Piru, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold">Ketua Dewan Juri ({activeCabang.nama})</p>
                  <div className="h-16" />
                  <p className="font-bold underline">___________________________</p>
                  <p className="text-[10px] text-gray-600">NIP. ....................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
