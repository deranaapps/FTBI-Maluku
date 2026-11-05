import React, { useState, useEffect, useMemo } from 'react';
import { CABANG_LOMBA_LIST, calculateWeightedJuryScore } from '../data/ftbiBranches';
import { PesertaFTBI, JuryId, Jenjang, NilaiJuriItem } from '../types/ftbi';
import { Check, User, ArrowLeft, ArrowRight, Save, CheckCircle2, MessageSquare, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

interface JuryScoringViewProps {
  pesertaList: PesertaFTBI[];
  activePesertaId: string | null;
  setActivePesertaId: (id: string | null) => void;
  onSaveScore: (
    pesertaId: string,
    juryId: JuryId,
    juryName: string,
    scores: Record<string, number>,
    catatan: string
  ) => Promise<boolean>;
  selectedJenjang: Jenjang;
  setSelectedJenjang: (lvl: Jenjang) => void;
  selectedCabangId: string;
  setSelectedCabangId: (id: string) => void;
  isSavingRemote?: boolean;
  onSyncSpreadsheet?: () => void;
  isSyncing?: boolean;
}

export const JuryScoringView: React.FC<JuryScoringViewProps> = ({
  pesertaList,
  activePesertaId,
  setActivePesertaId,
  onSaveScore,
  selectedJenjang,
  setSelectedJenjang,
  selectedCabangId,
  setSelectedCabangId,
  isSavingRemote = false,
  onSyncSpreadsheet,
  isSyncing = false,
}) => {
  const [activeJury, setActiveJury] = useState<JuryId>('Juri 1');
  const [juryNames, setJuryNames] = useState<Record<JuryId, string>>({
    'Juri 1': 'Drs. H. Maman Suryaman, M.Pd.',
    'Juri 2': 'Dra. Hj. Nining Sartika',
    'Juri 3': 'Asep Ridwan, S.Pd., M.Hum.',
  });

  const [scores, setScores] = useState<Record<string, number>>({});
  const [catatan, setCatatan] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');

  // Active Cabang Lomba
  const activeCabang = useMemo(() => {
    return CABANG_LOMBA_LIST.find((c) => c.id === selectedCabangId) || CABANG_LOMBA_LIST[0];
  }, [selectedCabangId]);

  // Unique list of schools for this branch & level
  const branchSchoolList = useMemo(() => {
    return Array.from(
      new Set(
        pesertaList
          .filter((p) => p.jenjang === selectedJenjang && p.cabangLombaId === selectedCabangId && p.asalSekolah)
          .map((p) => p.asalSekolah)
      )
    ).sort();
  }, [pesertaList, selectedJenjang, selectedCabangId]);

  // Peserta list for current branch and level, sorted by drawn appearance order (noUndian)
  const branchPeserta = useMemo(() => {
    return pesertaList
      .filter((p) => {
        const matchBranch = p.jenjang === selectedJenjang && p.cabangLombaId === selectedCabangId;
        const matchSchool = selectedSchoolFilter === 'all' || p.asalSekolah === selectedSchoolFilter;
        return matchBranch && matchSchool;
      })
      .sort((a, b) => {
        const numA = parseInt(a.noUndian, 10) || 999;
        const numB = parseInt(b.noUndian, 10) || 999;
        return numA - numB;
      });
  }, [pesertaList, selectedJenjang, selectedCabangId, selectedSchoolFilter]);

  // Current active participant
  const currentPeserta = useMemo(() => {
    if (activePesertaId) {
      const found = branchPeserta.find((p) => p.id === activePesertaId);
      if (found) return found;
    }
    return branchPeserta[0] || null;
  }, [branchPeserta, activePesertaId]);

  // Load existing scores when participant or jury changes
  useEffect(() => {
    if (!currentPeserta) {
      setScores({});
      setCatatan('');
      return;
    }

    let existingJuryData: NilaiJuriItem | undefined;
    if (activeJury === 'Juri 1') existingJuryData = currentPeserta.nilaiJuri1;
    if (activeJury === 'Juri 2') existingJuryData = currentPeserta.nilaiJuri2;
    if (activeJury === 'Juri 3') existingJuryData = currentPeserta.nilaiJuri3;

    if (existingJuryData) {
      setScores({ ...existingJuryData.kriteriaScores });
      setCatatan(existingJuryData.catatan || '');
    } else {
      // Default initial score 80 for easy grading
      const initialScores: Record<string, number> = {};
      activeCabang.kriteria.forEach((k) => {
        initialScores[k.id] = 80;
      });
      setScores(initialScores);
      setCatatan('');
    }
    setSaveSuccess(false);
  }, [currentPeserta?.id, activeJury, activeCabang]);

  // Calculate live weighted score for this judge
  const currentWeightedTotal = useMemo(() => {
    return calculateWeightedJuryScore(activeCabang.kriteria, scores);
  }, [activeCabang.kriteria, scores]);

  // Handlers
  const handleScoreChange = (kriteriaId: string, value: number) => {
    const clamped = Math.min(100, Math.max(0, value || 0));
    setScores((prev) => ({ ...prev, [kriteriaId]: clamped }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!currentPeserta) return;
    const ok = await onSaveScore(
      currentPeserta.id,
      activeJury,
      juryNames[activeJury],
      scores,
      catatan
    );
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Participant Navigation
  const currentIndex = branchPeserta.findIndex((p) => p.id === currentPeserta?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < branchPeserta.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      setActivePesertaId(branchPeserta[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setActivePesertaId(branchPeserta[currentIndex + 1].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Selection Strip */}
      <div className="bg-white rounded-3xl p-5 border border-[#e0e3e5] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Jenjang Filter */}
          <div className="md:col-span-3 flex items-center p-1 bg-[#eceeef] rounded-2xl">
            <input
              type="hidden"
              id="select-jenjang"
              value={selectedJenjang}
              readOnly
            />
            <button
              type="button"
              onClick={() => setSelectedJenjang('SD')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
                selectedJenjang === 'SD'
                  ? 'bg-white text-[#006495] shadow-sm font-bold'
                  : 'text-[#50606e] hover:text-[#191c1e]'
              }`}
            >
              Jenjang SD
            </button>
            <button
              type="button"
              onClick={() => setSelectedJenjang('SMP')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
                selectedJenjang === 'SMP'
                  ? 'bg-white text-[#006495] shadow-sm font-bold'
                  : 'text-[#50606e] hover:text-[#191c1e]'
              }`}
            >
              Jenjang SMP
            </button>
          </div>

          {/* Cabang Lomba Selection */}
          <div className="md:col-span-5">
            <select
              id="select-cabang"
              value={selectedCabangId}
              onChange={(e) => setSelectedCabangId(e.target.value)}
              className="w-full px-4 py-2 text-xs font-semibold bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-2xl outline-none transition-colors"
            >
              {CABANG_LOMBA_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama} ({c.namaSunda})
                </option>
              ))}
            </select>
          </div>

          {/* Active Jury Switcher (M3 Segmented) */}
          <div className="md:col-span-4 flex items-center p-1 bg-[#eceeef] rounded-2xl">
            {(['Juri 1', 'Juri 2', 'Juri 3'] as const).map((jury) => (
              <button
                key={jury}
                onClick={() => setActiveJury(jury)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
                  activeJury === jury
                    ? 'bg-[#006495] text-white shadow-sm font-bold'
                    : 'text-[#50606e] hover:text-[#191c1e]'
                }`}
              >
                {jury}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Contestant Picker (Left) & Scoring Sheet (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Contestant List / Queue */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-[#e0e3e5] shadow-sm flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#f2f4f6]">
            <div>
              <h3 className="font-bold text-sm text-[#191c1e]">Antrean Peserta</h3>
              <p className="text-[11px] text-[#50606e]">
                Pilih peserta untuk dinilai oleh {activeJury}
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#cbe6ff] text-[#001e30]">
              {branchPeserta.length} Peserta
            </span>
          </div>

          {/* Filter per Asal Sekolah */}
          <div className="mt-3">
            <label className="block text-[11px] font-bold text-[#50606e] mb-1">
              Filter Asal Sekolah:
            </label>
            <select
              value={selectedSchoolFilter}
              onChange={(e) => setSelectedSchoolFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-medium bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl outline-none transition-colors"
            >
              <option value="all">Semua Sekolah ({branchSchoolList.length})</option>
              {branchSchoolList.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Nomor Undian & Nama Peserta (select-peserta) */}
          <div className="mt-2.5">
            <label htmlFor="select-peserta" className="block text-[11px] font-bold text-[#50606e] mb-1">
              Pilih Peserta (Urutan Tampil 1-19):
            </label>
            <select
              id="select-peserta"
              value={currentPeserta?.noUndian || ''}
              onChange={(e) => {
                const targetUndian = e.target.value;
                const found = branchPeserta.find((p) => p.noUndian === targetUndian);
                if (found) {
                  setActivePesertaId(found.id);
                }
              }}
              className="w-full px-3 py-2 text-xs font-medium bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl outline-none transition-colors"
            >
              <option value="">-- Pilih Nomor Undian & Nama Peserta --</option>
              {branchPeserta.map((p) => (
                <option
                  key={p.id}
                  value={p.noUndian}
                  data-nama={p.nama}
                  data-sekolah={p.asalSekolah}
                  data-kabupaten={p.kecamatanKabupaten}
                  data-kategori={p.kategoriGender}
                >
                  No. {p.noUndian} - {p.nama} ({p.asalSekolah})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-y-auto flex-1 mt-3 space-y-2 pr-1">
            {branchPeserta.length === 0 ? (
              <div className="text-center py-10 px-3 text-xs text-[#50606e] space-y-3">
                <p>Belum ada peserta terdaftar di cabang ini.</p>
                {onSyncSpreadsheet && (
                  <button
                    onClick={onSyncSpreadsheet}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#006495] bg-[#cbe6ff] hover:bg-[#b2d9ff] rounded-xl transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Spreadsheet'}</span>
                  </button>
                )}
              </div>
            ) : (
              branchPeserta.map((p) => {
                const isSelected = p.id === currentPeserta?.id;
                // Has current jury scored this participant?
                let hasThisJuryScored = false;
                if (activeJury === 'Juri 1') hasThisJuryScored = Boolean(p.nilaiJuri1);
                if (activeJury === 'Juri 2') hasThisJuryScored = Boolean(p.nilaiJuri2);
                if (activeJury === 'Juri 3') hasThisJuryScored = Boolean(p.nilaiJuri3);

                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePesertaId(p.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#006495] bg-[#f0f7ff] shadow-xs'
                        : 'border-[#f2f4f6] hover:border-[#c2c7cf] hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#006495]">
                          #{p.noUndian}
                        </span>
                        <span className="font-bold text-xs text-[#191c1e] truncate">
                          {p.nama}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#50606e] truncate mt-0.5">
                        {p.asalSekolah}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {hasThisJuryScored ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>Dinilai</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#72777f] bg-slate-100 px-2 py-0.5 rounded-full">
                          Belum
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Contestant Scoring Rubric Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-sm flex flex-col justify-between">
          {currentPeserta ? (
            <div className="space-y-6">
              {/* Contestant Details Banner */}
              <div className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#e0e3e5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#006495] text-white flex flex-col items-center justify-center font-mono font-bold shadow-xs">
                    <span className="text-[10px] uppercase font-normal leading-none opacity-80">No</span>
                    <span id="display-undian" className="text-base leading-none">{currentPeserta.noUndian}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 id="display-nama" className="text-base font-bold text-[#191c1e]">{currentPeserta.nama}</h3>
                      <span id="display-kategori" className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#d3e4f5] text-[#0c1d29]">
                        {currentPeserta.kategoriGender}
                      </span>
                    </div>
                    <p className="text-xs text-[#50606e]">
                      <span id="display-sekolah">{currentPeserta.asalSekolah}</span> · <span id="display-kabupaten">{currentPeserta.kecamatanKabupaten}</span>
                    </p>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={handlePrev}
                    disabled={!hasPrev}
                    className="p-2 text-xs font-medium rounded-xl border border-[#c2c7cf] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    title="Peserta Sebelumnya"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-[#50606e] px-1">
                    {currentIndex + 1} / {branchPeserta.length}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={!hasNext}
                    className="p-2 text-xs font-medium rounded-xl border border-[#c2c7cf] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    title="Peserta Selanjutnya"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Judge Info */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#006495]">{activeJury}:</span>
                  <input
                    type="text"
                    value={juryNames[activeJury]}
                    onChange={(e) =>
                      setJuryNames((prev) => ({ ...prev, [activeJury]: e.target.value }))
                    }
                    placeholder="Nama Lengkap Juri..."
                    className="border-b border-[#c2c7cf] focus:border-[#006495] outline-none text-[#191c1e] font-medium bg-transparent px-1 py-0.5"
                  />
                </div>
                <div className="text-[#50606e]">
                  Rentang Nilai Resmi: <span className="font-mono font-bold text-[#006495]">50, 60, 70, 80</span> (Sesuai PDF FTBI)
                </div>
              </div>

              {/* Multi-aspect Criteria List */}
              <div className="space-y-4">
                {activeCabang.kriteria.map((k) => {
                  const scoreVal = scores[k.id] ?? 80;

                  return (
                    <div
                      key={k.id}
                      className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#e0e3e5] space-y-2 hover:border-[#c2c7cf] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#191c1e]">{k.nama}</span>
                          </div>
                          <p className="text-[11px] text-[#50606e] mt-0.5">
                            {k.deskripsi}
                          </p>
                        </div>

                        {/* Numeric input */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className="text-[11px] text-[#72777f] font-mono">
                            Skor: <strong className="text-[#006495]">{scoreVal}</strong>
                          </span>
                          <input
                            type="number"
                            min={50}
                            max={80}
                            value={scoreVal}
                            onChange={(e) => handleScoreChange(k.id, parseFloat(e.target.value))}
                            className="w-16 px-2.5 py-1 text-center font-mono font-bold text-sm bg-white border border-[#c2c7cf] focus:border-[#006495] rounded-xl outline-none"
                          />
                        </div>
                      </div>

                      {/* Quick Rating Chips per PDF: 50 Kurang, 60 Cukup, 70 Baik, 80 Sangat Baik */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-[#72777f] font-medium mr-1">Rentang Nilai:</span>
                        {[
                          { val: 50, label: '50 (Kurang)', color: 'bg-red-50 text-red-700 border-red-200' },
                          { val: 60, label: '60 (Cukup)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                          { val: 70, label: '70 (Baik)', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                          { val: 80, label: '80 (Sangat Baik)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        ].map((tier) => {
                          const isActive = scoreVal === tier.val;
                          return (
                            <button
                              key={tier.val}
                              type="button"
                              onClick={() => handleScoreChange(k.id, tier.val)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-xl border transition-all ${
                                isActive
                                  ? 'bg-[#006495] text-white border-[#006495] shadow-xs'
                                  : `${tier.color} hover:opacity-80`
                              }`}
                            >
                              {tier.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Range Slider for Fine Adjustment */}
                      <div className="pt-2 flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[#72777f]">50</span>
                        <input
                          type="range"
                          min={50}
                          max={80}
                          step={1}
                          value={scoreVal}
                          onChange={(e) => handleScoreChange(k.id, parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-[#e0e3e5] rounded-lg appearance-none cursor-pointer accent-[#006495]"
                        />
                        <span className="text-[10px] font-mono text-[#72777f]">80</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Catatan Juri */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#191c1e] mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#006495]" />
                  <span>Catatan Pembinaan & Masukan Teknis ({activeJury})</span>
                </label>
                <textarea
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Berikan masukan konstruktif untuk peserta (artikulasi, wirahma, penghayatan, dsb)..."
                  className="w-full p-3 text-xs bg-[#f8f9fa] border border-[#e0e3e5] focus:border-[#006495] focus:bg-white rounded-2xl outline-none resize-none transition-colors"
                />
              </div>

              {/* Action Bar & Total Summary */}
              <div className="p-4 bg-[#cbe6ff]/30 rounded-2xl border border-[#cbe6ff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-[#50606e] block">
                    Total Nilai {activeJury} (Penjumlahan {activeCabang.kriteria.length} Aspek):
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-[#006495] tabular-nums">
                      {currentWeightedTotal}
                    </span>
                    <span className="text-xs text-[#50606e]">/ {activeCabang.kriteria.length * 80} (Maks)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tersimpan!</span>
                    </span>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={isSavingRemote}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] disabled:opacity-50 rounded-2xl shadow-sm transition-all m3-button-press"
                  >
                    {isSavingRemote ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Simpan Nilai {activeJury}</span>
                  </button>

                  {hasNext && (
                    <button
                      onClick={() => {
                        handleSave();
                        handleNext();
                      }}
                      className="px-3.5 py-2.5 text-xs font-medium text-[#006495] bg-white border border-[#cbe6ff] hover:bg-[#f0f7ff] rounded-2xl transition-colors"
                    >
                      Simpan & Lanjut
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-[#50606e]">
              <AlertCircle className="w-12 h-12 mx-auto text-[#c2c7cf] mb-2" />
              <p className="font-semibold text-[#191c1e]">Pilih peserta dari daftar sebelah kiri.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
