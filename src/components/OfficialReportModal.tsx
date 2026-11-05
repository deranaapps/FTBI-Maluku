import React from 'react';
import { CABANG_LOMBA_LIST } from '../data/ftbiBranches';
import { PesertaFTBI, Jenjang } from '../types/ftbi';
import { Printer, X, Award, Check } from 'lucide-react';

interface OfficialReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pesertaList: PesertaFTBI[];
  selectedJenjang: Jenjang;
  selectedCabangId: string;
}

export const OfficialReportModal: React.FC<OfficialReportModalProps> = ({
  isOpen,
  onClose,
  pesertaList,
  selectedJenjang,
  selectedCabangId,
}) => {
  if (!isOpen) return null;

  const activeCabang = CABANG_LOMBA_LIST.find((c) => c.id === selectedCabangId) || CABANG_LOMBA_LIST[0];

  // Get top 6 participants for official report
  const winners = pesertaList
    .filter((p) => p.jenjang === selectedJenjang && p.cabangLombaId === selectedCabangId)
    .sort((a, b) => {
      if (b.totalNilai !== a.totalNilai) return b.totalNilai - a.totalNilai;
      const j1A = a.nilaiJuri1?.totalWeightedScore || 0;
      const j1B = b.nilaiJuri1?.totalWeightedScore || 0;
      return j1B - j1A;
    })
    .slice(0, 6)
    .map((p, idx) => {
      const rank = idx + 1;
      let predikat = 'Peserta';
      if (rank === 1) predikat = 'Juara I';
      else if (rank === 2) predikat = 'Juara II';
      else if (rank === 3) predikat = 'Juara III';
      else if (rank === 4) predikat = 'Juara Harapan I';
      else if (rank === 5) predikat = 'Juara Harapan II';
      else if (rank === 6) predikat = 'Juara Harapan III';
      return { ...p, rank, predikat };
    });

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-[#e0e3e5] print:border-none print:shadow-none print:p-2 relative">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#f2f4f6] no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#006495]" />
            <h3 className="font-bold text-sm text-[#191c1e]">
              Pratinjau Cetak Berita Acara Dewan Juri FTBI
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] rounded-xl transition-all shadow-sm m3-button-press"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#72777f] hover:text-[#191c1e] rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Document */}
        <div className="text-[#191c1e] text-xs font-serif leading-relaxed px-2">
          {/* Official Letterhead */}
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
                BALAI BAHASA PROVINSI MALUKU & DINAS PENDIDIKAN
              </h3>
              <h2 className="text-lg font-black uppercase font-sans tracking-wider text-[#006495] print:text-black">
                FESTIVAL TUNAS BAHASA IBU (FTBI)
              </h2>
              <p className="text-[11px] font-sans text-gray-700 italic">
                KABUPATEN SERAM BAGIAN BARAT / KOTA TUAL
              </p>
            </div>
          </div>

          {/* Title Matching PDF */}
          <div className="text-center my-4 font-sans">
            <h3 className="text-base font-bold uppercase tracking-wider">
              TOTAL NILAI PESERTA {activeCabang.nama.toUpperCase()} TINGKAT {selectedJenjang}
            </h3>
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-800">
              KABUPATEN SERAM BAGIAN BARAT
            </h4>
          </div>

          {/* Body Text */}
          <div className="text-xs font-sans text-justify space-y-2 mb-4">
            <p>
              Pada hari ini, bertempat di lokasi pelaksanaan Festival Tunas Bahasa Ibu (FTBI), Dewan Juri yang bertanda tangan di bawah ini telah melaksanakan penilaian secara saksama, objektif, dan independen terhadap seluruh peserta <strong>{activeCabang.nama}</strong> tingkat <strong>{selectedJenjang}</strong> berdasarkan kriteria penilaian resmi multi-aspek (skala 50, 60, 70, 80).
            </p>
            <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold space-y-1">
              <div>Pemenang I &nbsp;&nbsp;: Nomor Undian {winners[0]?.noUndian || '.......'} ({winners[0]?.nama || '................................'})</div>
              <div>Pemenang II &nbsp;: Nomor Undian {winners[1]?.noUndian || '.......'} ({winners[1]?.nama || '................................'})</div>
              <div>Pemenang III : Nomor Undian {winners[2]?.noUndian || '.......'} ({winners[2]?.nama || '................................'})</div>
            </div>
          </div>

          {/* Winners Table */}
          <div className="overflow-x-auto my-4 font-sans">
            <table className="w-full text-left text-xs border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200 text-center font-bold">
                  <th className="border border-black p-2 w-24">Predikat</th>
                  <th className="border border-black p-2 w-14">No Undian</th>
                  <th className="border border-black p-2">Nama Lengkap Peserta</th>
                  <th className="border border-black p-2">Asal Sekolah</th>
                  <th className="border border-black p-2">Kecamatan/Kab</th>
                  <th className="border border-black p-2 w-16 text-right">Nilai J1</th>
                  <th className="border border-black p-2 w-16 text-right">Nilai J2</th>
                  <th className="border border-black p-2 w-16 text-right">Nilai J3</th>
                  <th className="border border-black p-2 w-20 text-right">Total Skor</th>
                </tr>
              </thead>
              <tbody>
                {winners.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-black p-4 text-center text-gray-500">
                      Belum ada data pemenang untuk cabang ini.
                    </td>
                  </tr>
                ) : (
                  winners.map((w) => (
                    <tr key={w.id} className="border-b border-black">
                      <td className="border border-black p-2 font-bold">{w.predikat}</td>
                      <td className="border border-black p-2 text-center font-mono font-bold">{w.noUndian}</td>
                      <td className="border border-black p-2 font-semibold">{w.nama}</td>
                      <td className="border border-black p-2">{w.asalSekolah}</td>
                      <td className="border border-black p-2">{w.kecamatanKabupaten}</td>
                      <td className="border border-black p-2 text-right font-mono tabular-nums">
                        {w.nilaiJuri1?.totalWeightedScore.toFixed(2) || '-'}
                      </td>
                      <td className="border border-black p-2 text-right font-mono tabular-nums">
                        {w.nilaiJuri2?.totalWeightedScore.toFixed(2) || '-'}
                      </td>
                      <td className="border border-black p-2 text-right font-mono tabular-nums">
                        {w.nilaiJuri3?.totalWeightedScore.toFixed(2) || '-'}
                      </td>
                      <td className="border border-black p-2 text-right font-mono font-bold tabular-nums">
                        {w.totalNilai.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs font-sans mt-3 text-justify">
            Keputusan Dewan Juri ini bersifat mutlak, mengikat, dan tidak dapat diganggu gugat. Demikian Berita Acara ini dibuat dan ditandatangani untuk dipergunakan sebagaimana mestinya.
          </p>

          {/* Signature Columns */}
          <div className="grid grid-cols-3 gap-4 text-center mt-12 font-sans text-xs">
            <div>
              <p className="font-semibold">Dewan Juri I (Ketua)</p>
              <div className="h-16 flex items-end justify-center">
                <span className="text-gray-400 italic text-[10px] print:hidden">(Tanda Tangan)</span>
              </div>
              <p className="font-bold underline">Drs. H. Maman Suryaman, M.Pd.</p>
              <p className="text-[10px] text-gray-600">NIP. 19680512 199303 1 004</p>
            </div>

            <div>
              <p className="font-semibold">Dewan Juri II (Anggota)</p>
              <div className="h-16 flex items-end justify-center">
                <span className="text-gray-400 italic text-[10px] print:hidden">(Tanda Tangan)</span>
              </div>
              <p className="font-bold underline">Dra. Hj. Nining Sartika</p>
              <p className="text-[10px] text-gray-600">NIP. 19710315 199802 2 001</p>
            </div>

            <div>
              <p className="font-semibold">Dewan Juri III (Anggota)</p>
              <div className="h-16 flex items-end justify-center">
                <span className="text-gray-400 italic text-[10px] print:hidden">(Tanda Tangan)</span>
              </div>
              <p className="font-bold underline">Asep Ridwan, S.Pd., M.Hum.</p>
              <p className="text-[10px] text-gray-600">NIP. 19780820 200501 1 008</p>
            </div>
          </div>

          <div className="text-center mt-8 font-sans text-xs">
            <p className="font-semibold">Mengetahui,</p>
            <p className="font-semibold">Ketua Panitia Pelaksana FTBI</p>
            <div className="h-14 flex items-end justify-center">
              <span className="text-gray-400 italic text-[10px] print:hidden">(Tanda Tangan & Cap)</span>
            </div>
            <p className="font-bold underline">Dr. H. Dadang Supriatna, M.Si.</p>
            <p className="text-[10px] text-gray-600">NIP. 19651114 199003 1 002</p>
          </div>
        </div>
      </div>
    </div>
  );
};
