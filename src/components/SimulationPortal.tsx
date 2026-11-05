import React, { useState } from 'react';
import { CABANG_LOMBA_LIST } from '../data/ftbiBranches';
import { PesertaFTBI, Jenjang, KategoriGender } from '../types/ftbi';
import { Send, Sparkles, RefreshCw, PlusCircle, CheckCircle2, Database, Table, HelpCircle } from 'lucide-react';

interface SimulationPortalProps {
  onAddPeserta: (newPeserta: Omit<PesertaFTBI, 'id' | 'totalNilai' | 'rataRataNilai' | 'statusVerifikasi'>) => void;
  onAutoGradeAll: () => void;
  onResetData: () => void;
  pesertaCount: number;
}

export const SimulationPortal: React.FC<SimulationPortalProps> = ({
  onAddPeserta,
  onAutoGradeAll,
  onResetData,
  pesertaCount,
}) => {
  const [nama, setNama] = useState('');
  const [nisn, setNisn] = useState('');
  const [asalSekolah, setAsalSekolah] = useState('');
  const [kecamatanKabupaten, setKecamatanKabupaten] = useState('');
  const [jenjang, setJenjang] = useState<Jenjang>('SD');
  const [cabangLombaId, setCabangLombaId] = useState(CABANG_LOMBA_LIST[0].id);
  const [kategoriGender, setKategoriGender] = useState<KategoriGender>('Putra');
  const [wa, setWa] = useState('081234567890');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !asalSekolah.trim()) return;

    // Generate formatted no undian
    const nextNum = pesertaCount + 1;
    const noUndian = nextNum < 10 ? `0${nextNum}` : String(nextNum);

    onAddPeserta({
      noUndian,
      nama: nama.trim(),
      nisn: nisn.trim() || undefined,
      asalSekolah: asalSekolah.trim(),
      kecamatanKabupaten: kecamatanKabupaten.trim() || 'Kab. Bandung',
      jenjang,
      cabangLombaId,
      kategoriGender,
      timestampPendaftaran: new Date().toLocaleString('sv-SE').replace('T', ' '),
    });

    setSubmittedMessage(true);
    setNama('');
    setNisn('');
    setTimeout(() => setSubmittedMessage(false), 4000);
  };

  const handleQuickSeed = () => {
    const randomSchools = [
      { name: 'Rangga Daniswara', school: 'SD Inpres Kairatu', dist: 'Kec. Kairatu Barat, Kab. Seram Bagian Barat', gen: 'SD' as Jenjang, gender: 'Putra' as KategoriGender, branch: 'berpidato' },
      { name: 'Nayra Salsabila', school: 'SDN 1 Piru', dist: 'Kec. Seram Barat, Kab. Seram Bagian Barat', gen: 'SD' as Jenjang, gender: 'Putri' as KategoriGender, branch: 'mendongeng' },
      { name: 'Bintang Pratama', school: 'SMPN 1 Kairatu', dist: 'Kec. Kairatu, Kab. Seram Bagian Barat', gen: 'SMP' as Jenjang, gender: 'Putra' as KategoriGender, branch: 'menulis_membaca_puisi' },
      { name: 'Kania Puspita Dewi', school: 'SMPN 2 Seram Barat', dist: 'Kec. Seram Barat, Kab. Seram Bagian Barat', gen: 'SMP' as Jenjang, gender: 'Putri' as KategoriGender, branch: 'menyanyi' },
      { name: 'Zaky Al Ghifari', school: 'SMP Kristen Tiakur', dist: 'Kec. Tiakur, Kab. Seram Bagian Barat', gen: 'SMP' as Jenjang, gender: 'Putra' as KategoriGender, branch: 'stand_up_comedy' },
    ];

    randomSchools.forEach((s, idx) => {
      const num = pesertaCount + idx + 1;
      const noUndian = num < 10 ? `0${num}` : String(num);
      onAddPeserta({
        noUndian,
        nama: s.name,
        asalSekolah: s.school,
        kecamatanKabupaten: s.dist,
        jenjang: s.gen,
        cabangLombaId: s.branch,
        kategoriGender: s.gender,
        timestampPendaftaran: new Date().toLocaleString('sv-SE').replace('T', ' '),
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Simulation Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#50606e] mb-1">
              <span>Google Forms & Sheet Trigger Simulator</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#006495] font-semibold">onFormSubmit(e)</span>
            </div>
            <h2 className="text-2xl font-bold text-[#191c1e] tracking-tight">
              Simulasi Pendaftaran & Pengujian Otomatis
            </h2>
            <p className="text-sm text-[#50606e] mt-1 max-w-2xl">
              Uji coba bagaimana respons dari formulir pendaftaran Google Form masuk ke sheet{' '}
              <code className="text-xs font-mono font-semibold text-[#006495] bg-[#cbe6ff] px-1.5 py-0.5 rounded">
                Form Responses 1
              </code>{' '}
              dan secara otomatis didistribusikan ke sheet lomba yang sesuai dengan kalkulasi nomor undian.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleQuickSeed}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#006495] bg-[#cbe6ff] hover:bg-[#b2d9ff] rounded-2xl transition-colors m3-button-press"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+5 Peserta Uji Coba</span>
            </button>
            <button
              onClick={onAutoGradeAll}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-2xl transition-colors m3-button-press"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Beri Nilai Otomatis ke Semua</span>
            </button>
            <button
              onClick={onResetData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#ba1a1a] bg-red-50 hover:bg-red-100 rounded-2xl transition-colors m3-button-press"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Google Form Replica */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-sm">
          <div className="border-b border-[#f2f4f6] pb-4 mb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-[#006495]" />
              <h3 className="font-bold text-base text-[#191c1e]">
                Formulir Pendaftaran Peserta FTBI
              </h3>
            </div>
            <p className="text-xs text-[#50606e]">
              Simulasi input identik dengan Google Form resmi panitia tingkat kabupaten/kota.
            </p>
          </div>

          {submittedMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Berhasil!</strong> Peserta telah dicatat di <code>Form Responses 1</code> dan dialirkan ke sheet cabang lomba terkait.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Nama Lengkap Peserta *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan"
                  className="w-full px-3.5 py-2 text-xs bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  NISN Peserta
                </label>
                <input
                  type="text"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Contoh: 0123456789"
                  className="w-full px-3.5 py-2 text-xs bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Asal Sekolah *
                </label>
                <input
                  type="text"
                  required
                  value={asalSekolah}
                  onChange={(e) => setAsalSekolah(e.target.value)}
                  placeholder="Contoh: SDN 1 Cimahi"
                  className="w-full px-3.5 py-2 text-xs bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Kecamatan / Kabupaten
                </label>
                <input
                  type="text"
                  value={kecamatanKabupaten}
                  onChange={(e) => setKecamatanKabupaten(e.target.value)}
                  placeholder="Contoh: Kec. Cimahi Selatan, Kota Cimahi"
                  className="w-full px-3.5 py-2 text-xs bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Jenjang Pendidikan *
                </label>
                <select
                  value={jenjang}
                  onChange={(e) => setJenjang(e.target.value as Jenjang)}
                  className="w-full px-3 py-2 text-xs bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl outline-none transition-all"
                >
                  <option value="SD">SD (Sekolah Dasar)</option>
                  <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Kategori Gender *
                </label>
                <select
                  value={kategoriGender}
                  onChange={(e) => setKategoriGender(e.target.value as KategoriGender)}
                  className="w-full px-3 py-2 text-xs bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl outline-none transition-all"
                >
                  <option value="Putra">Putra (Pasanggiri Putra)</option>
                  <option value="Putri">Putri (Pasanggiri Putri)</option>
                  <option value="Campuran">Campuran / Terbuka</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                  Kontak WhatsApp
                </label>
                <input
                  type="text"
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191c1e] mb-1">
                Cabang Lomba FTBI *
              </label>
              <select
                value={cabangLombaId}
                onChange={(e) => setCabangLombaId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-xl outline-none transition-all font-medium"
              >
                {CABANG_LOMBA_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama} ({c.namaSunda})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] rounded-2xl shadow-sm transition-all m3-button-press"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Formulir (Simulasi Trigger onFormSubmit)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Architecture & Data Distribution Diagram */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#e0e3e5] shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f2f4f6]">
              <Database className="w-4 h-4 text-[#006495]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#191c1e]">
                Mekanisme Distribusi Data GAS
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#e0e3e5]">
                <div className="font-bold text-[#006495] mb-1">
                  1. Pendaftaran Masuk ke `Form Responses 1`
                </div>
                <p className="text-[11px] text-[#50606e]">
                  Data respons Google Form disimpan di tab utama dengan kolom lengkap (Timestamp, Nama, Sekolah, Jenjang, dsb).
                </p>
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#e0e3e5]">
                <div className="font-bold text-[#006495] mb-1">
                  2. Auto Routing ke Sheet Cabang Lomba
                </div>
                <p className="text-[11px] text-[#50606e]">
                  Trigger <code className="font-mono text-[#006495]">onFormSubmit(e)</code> memeriksa Jenjang & Cabang Lomba, membuat No Undian urut otomatis, lalu menyalin ke sheet seperti <code className="font-mono text-[#006495]">SD_Biantara</code> atau <code className="font-mono text-[#006495]">SMP_Ngedongeng</code>.
                </p>
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#e0e3e5]">
                <div className="font-bold text-[#006495] mb-1">
                  3. Injeksi Formula Multi-Juri Otomatis
                </div>
                <p className="text-[11px] text-[#50606e]">
                  Formula bobot kriteria juri 1, 2, dan 3 diinjeksikan secara dinamis beserta rumus total <code className="font-mono text-[#006495]">=SUM(L2, Q2, V2)</code> dan rata-rata.
                </p>
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#e0e3e5]">
                <div className="font-bold text-[#006495] mb-1">
                  4. Sinkronisasi Leaderboard & Tie-Breaker
                </div>
                <p className="text-[11px] text-[#50606e]">
                  Secara dinamis mengurutkan skor tertinggi, memecahkan nilai seri berdasarkan nilai Juri 1 atau kriteria prioritas, dan menuliskan 6 besar ke tab <code className="font-mono text-[#006495]">LEADERBOARD_REKAP</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
