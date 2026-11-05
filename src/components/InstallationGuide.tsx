import React from 'react';
import { CheckCircle2, ArrowRight, ExternalLink, ShieldCheck, Zap, HelpCircle, FileSpreadsheet, Users, Terminal, Play } from 'lucide-react';

export const InstallationGuide: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Buat Google Spreadsheet & Formulir Pendaftaran',
      desc: 'Buka Google Drive dan buat satu Google Spreadsheet baru (misal: "PENILAIAN_FTBI_2026"). Jika menggunakan Google Form, buka tab Formulir > Buat Formulir dan hubungkan respons ke sheet ini agar tab `Form Responses 1` otomatis tercipta.',
      badge: 'Langkah Awal',
    },
    {
      num: '02',
      title: 'Buka Editor Google Apps Script',
      desc: 'Di Google Spreadsheet Anda, klik menu atas: Extensions (Ekstensi) > Apps Script. Jendela editor skrip Google Apps Script akan terbuka dalam tab baru.',
      badge: 'Editor GAS',
    },
    {
      num: '03',
      title: 'Tempelkan Seluruh Kode `Code.gs`',
      desc: 'Hapus kode bawaan `function myFunction() {}` di file Code.gs. Buka tab "Kode GAS" di aplikasi ini, klik tombol "Salin Seluruh Kode GAS", lalu tempelkan ke editor Apps Script. Jangan lupa klik ikon Disket (Save/Simpan) atau tekan Ctrl+S.',
      badge: 'Salin Kode',
    },
    {
      num: '04',
      title: 'Jalankan Fungsi Inisialisasi Sheet `setupFTBISpreadsheet`',
      desc: 'Pada dropdown pilihan fungsi di atas editor skrip, pilih `setupFTBISpreadsheet`, lalu klik tombol Run (Jalankan). Saat pertama kali dijalankan, Google akan meminta Otorisasi Izin Akses ("Review permissions" > pilih akun > "Advanced" > "Go to... (unsafe)" > "Allow"). Setelah selesai, seluruh sheet lomba (SD & SMP 7 cabang) dan LEADERBOARD_REKAP akan langsung terbuat rapi!',
      badge: 'Eksekusi Awal',
    },
    {
      num: '05',
      title: 'Pasang Trigger Otomatis Formulir (`onFormSubmit`)',
      desc: 'Di menu samping kiri Apps Script, klik ikon Jam (Triggers / Pemicu) > klik "+ Add Trigger" (Tambahkan Pemicu di kanan bawah). Atur: Pilih fungsi yang akan dijalankan = `onFormSubmit`; Sumber peristiwa = "From spreadsheet" (Dari spreadsheet); Jenis peristiwa = "On form submit" (Saat mengirim formulir). Simpan. Mulai saat ini, setiap kali ada peserta mendaftar lewat Google Form, datanya akan otomatis masuk ke sheet lomba terkait secara real-time!',
      badge: 'Automasi Real-Time',
    },
    {
      num: '06',
      title: 'Deploy sebagai Web App (Opsional untuk Dashboard Online)',
      desc: 'Di pojok kanan atas Apps Script, klik tombol biru "Deploy" > "New deployment". Klik ikon gerigi di samping "Select type" > pilih "Web app". Isi keterangan (misal: "FTBI v1.0"), atur Execute as: "Me", dan yang terpenting Who has access: "Anyone" (Siapa saja). Klik Deploy, lalu salin URL Web App yang berakhiran `/exec`.',
      badge: 'Deploy API',
    },
    {
      num: '07',
      title: 'Hubungkan URL Web App ke Dashboard Ini',
      desc: 'Salin URL Web App Anda, buka tab "Kode GAS" di aplikasi ini, tempelkan di kotak "Integrasi Langsung Web App Google Apps Script", lalu klik "Hubungkan & Tarik Data". Data juri dan peserta akan langsung sinkron bolak-balik antara spreadsheet dan tampilan Material 3 ini!',
      badge: 'Koneksi Terpadu',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-sm">
        <div className="flex items-center gap-2 text-xs text-[#50606e] mb-1">
          <span>Panduan Pemasangan & Integrasi</span>
          <span aria-hidden="true">·</span>
          <span>Google Sheets & Apps Script</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#006495] font-semibold">Step-by-Step</span>
        </div>
        <h2 className="text-2xl font-bold text-[#191c1e] tracking-tight">
          Panduan Lengkap Pemasangan Sistem Penilaian FTBI
        </h2>
        <p className="text-sm text-[#50606e] mt-1 max-w-3xl">
          Ikuti langkah-langkah di bawah ini untuk menyatukan backend Google Spreadsheet dengan antarmuka frontend berbasis Material 3 secara sempurna.
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((s) => (
          <div
            key={s.num}
            className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-sm flex flex-col md:flex-row gap-5 items-start transition-all hover:border-[#c2c7cf]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#f0f7ff] border border-[#cbe6ff] text-[#006495] flex items-center justify-center font-mono font-bold text-lg shrink-0">
              {s.num}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="font-bold text-base text-[#191c1e]">{s.title}</h3>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#cbe6ff] text-[#001e30]">
                  {s.badge}
                </span>
              </div>
              <p className="text-xs text-[#50606e] leading-relaxed">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Best Practices & Rules of Jury */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#e0e3e5] shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#f2f4f6]">
            <ShieldCheck className="w-5 h-5 text-[#006495]" />
            <h4 className="font-bold text-sm text-[#191c1e]">
              Aturan Dewan Juri & Penanganan Nilai Seri (Tie-Breaker)
            </h4>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-[#50606e] list-disc list-inside">
            <li>
              Penilaian dilakukan secara independen oleh <strong>3 Orang Juri</strong> dengan skala nilai 0 - 100 per kriteria.
            </li>
            <li>
              Total Nilai akhir adalah penjumlahan dari nilai bobot terhitung Juri I + Juri II + Juri III.
            </li>
            <li>
              <strong>Aturan Pemecah Seri (Tie-Breaker):</strong> Jika dua peserta memiliki Total Nilai yang persis sama, penentuan peringkat dilakukan berdasarkan:
              <ol className="list-decimal list-inside pl-4 mt-1 font-medium text-[#191c1e]">
                <li>Nilai total yang lebih tinggi dari Juri 1 (Ketua Dewan Juri).</li>
                <li>Nilai skor pada Aspek/Kriteria 1 (aspek utama dengan bobot terbesar).</li>
                <li>Rapat musyawarah mufakat tertutup dewan juri.</li>
              </ol>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#e0e3e5] shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#f2f4f6]">
            <Zap className="w-5 h-5 text-[#006495]" />
            <h4 className="font-bold text-sm text-[#191c1e]">
              Keunggulan Sistem Berbasis Material 3 & GAS
            </h4>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-[#50606e] list-disc list-inside">
            <li>
              <strong>Tanpa Biaya Server:</strong> Menggunakan Google Sheets gratis sebagai database dan Google Apps Script sebagai serverless backend.
            </li>
            <li>
              <strong>Pembaruan Otomatis:</strong> Integrasi langsung dengan Google Form tanpa perlu mengetik ulang nama peserta.
            </li>
            <li>
              <strong>Tampilan Responsif M3:</strong> Nyaman dibuka di laptop dewan juri maupun tablet / smartphone di meja juri.
            </li>
            <li>
              <strong>Berita Acara Siap Cetak:</strong> Menghasilkan dokumen resmi bertanda tangan dewan juri sesuai kaidah dinas pendidikan.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
