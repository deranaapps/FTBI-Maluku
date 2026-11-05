import React, { useState } from 'react';
import { GAS_CODE_GS, APPSSCRIPT_JSON, GAS_INDEX_HTML } from '../data/gasCodeTemplate';
import { Copy, Check, Download, ExternalLink, Link2, Terminal, FileCode, CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck, Globe } from 'lucide-react';

interface GasCodeHubProps {
  webAppUrl: string;
  setWebAppUrl: (url: string) => void;
  onTestConnection: (url: string) => Promise<boolean>;
  isConnecting: boolean;
  isConnected: boolean;
  connectionError: string | null;
  lastSyncTime: string | null;
}

export const GasCodeHub: React.FC<GasCodeHubProps> = ({
  webAppUrl,
  setWebAppUrl,
  onTestConnection,
  isConnecting,
  isConnected,
  connectionError,
  lastSyncTime,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'codegs' | 'html' | 'manifest' | 'structure'>('codegs');
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);

  const handleCopyGs = () => {
    navigator.clipboard.writeText(GAS_CODE_GS);
    setCopiedGs(true);
    setTimeout(() => setCopiedGs(false), 2500);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(GAS_INDEX_HTML);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(APPSSCRIPT_JSON);
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2500);
  };

  const handleDownloadGs = () => {
    const blob = new Blob([GAS_CODE_GS], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#50606e] mb-1">
              <span>Google Apps Script (GAS)</span>
              <span aria-hidden="true">·</span>
              <span>Spreadsheet Backend Engine</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#006495] font-semibold">V8 Runtime</span>
            </div>
            <h2 className="text-2xl font-bold text-[#191c1e] tracking-tight">
              Kode Backend Google Apps Script Lengkap
            </h2>
            <p className="text-sm text-[#50606e] mt-1 max-w-3xl">
              Salin kode berikut ke Google Spreadsheet Anda melalui menu{' '}
              <strong className="text-[#191c1e]">Extensions &gt; Apps Script</strong>. Kode ini mencakup
              pembuatan sheet otomatis, auto-routing pendaftaran, pembobotan multi-juri, tie-breaker,
              dan REST API Web App untuk sinkronisasi langsung dengan dashboard ini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyGs}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] rounded-2xl transition-all shadow-sm m3-button-press"
            >
              {copiedGs ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedGs ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode GAS'}</span>
            </button>
            <button
              onClick={handleDownloadGs}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#006495] bg-[#cbe6ff] hover:bg-[#b2d9ff] rounded-2xl transition-colors m3-button-press"
              title="Unduh file Code.gs"
            >
              <Download className="w-4 h-4" />
              <span>Unduh .gs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Web App Connector Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#e0e3e5] shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f4f6]">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#006495]" />
            <h3 className="font-bold text-sm text-[#191c1e]">
              Integrasi Langsung Web App Google Apps Script
            </h3>
          </div>
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terhubung dengan Spreadsheet</span>
            </span>
          ) : (
            <span className="text-xs text-[#72777f] bg-slate-100 px-3 py-1 rounded-full">
              Mode Simulasi Lokal
            </span>
          )}
        </div>

        <p className="text-xs text-[#50606e] mt-3">
          Jika Anda sudah mendeply kode Apps Script sebagai <strong>Web App</strong> (Akses: Anyone), masukkan URL Web App yang dihasilkan di bawah ini untuk mengambil data peserta dan mengirim nilai juri langsung ke Google Spreadsheet asli Anda.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="url"
            value={webAppUrl}
            onChange={(e) => setWebAppUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="flex-1 w-full px-4 py-2.5 text-xs font-mono bg-[#f2f4f6] border border-transparent focus:border-[#006495] focus:bg-white rounded-2xl outline-none transition-colors"
          />
          <button
            onClick={() => onTestConnection(webAppUrl)}
            disabled={isConnecting || !webAppUrl.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] disabled:opacity-50 rounded-2xl shadow-sm transition-all m3-button-press shrink-0"
          >
            {isConnecting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            <span>{isConnecting ? 'Menghubungkan...' : 'Hubungkan & Tarik Data'}</span>
          </button>
        </div>

        {connectionError && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#ba1a1a] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>Gagal Terhubung: Kendala Izin Akses atau Format URL</span>
            </div>
            <p className="leading-relaxed">{connectionError}</p>
          </div>
        )}

        {/* Failed to fetch Troubleshooting Card */}
        <div className="mt-4 p-4 rounded-2xl bg-[#f0f7ff] border border-[#cbe6ff] text-xs">
          <div className="flex items-center gap-2 font-bold text-[#006495] mb-2">
            <ShieldCheck className="w-4 h-4 text-[#006495]" />
            <span>Cara Cepat Mengatasi Kendala "Failed to fetch":</span>
          </div>
          <ul className="space-y-1.5 text-[#50606e] list-decimal list-inside pl-1">
            <li>
              <strong>Penyebab Paling Sering (90%):</strong> Pada Google Apps Script, pengaturan akses belum disetel ke <strong>"Anyone"</strong> (Siapa saja).
              <div className="mt-1 pl-5 text-[11px] text-[#191c1e] bg-white/70 p-2 rounded-xl border border-[#cbe6ff]">
                👉 <strong>Solusi:</strong> Di editor Apps Script, klik tombol biru <strong>Deploy &gt; Manage deployments</strong> &gt; klik <strong>ikon pensil (Edit)</strong> &gt; pada bagian <strong>Who has access</strong>, ganti dari <em>"Only myself"</em> menjadi <strong>"Anyone" (Siapa saja)</strong> &gt; klik <strong>Deploy</strong>.
              </div>
            </li>
            <li>
              <strong>Pastikan URL berakhiran <code>/exec</code>:</strong> URL harus berupa <code>https://script.google.com/macros/s/.../exec</code> (bukan link spreadsheet docs.google.com dan bukan link editor <code>/edit</code> atau <code>/dev</code>).
            </li>
            <li>
              <strong>Beri Izin Otorisasi:</strong> Saat pertama kali deploy atau menjalankan fungsi di Apps Script, klik <em>Review permissions</em> &gt; pilih akun Google Anda &gt; klik <em>Advanced</em> &gt; klik <em>Go to ... (unsafe)</em> &gt; <em>Allow</em>.
            </li>
          </ul>
        </div>

        {lastSyncTime && (
          <div className="mt-3 text-[11px] text-[#50606e]">
            Sinkronisasi terakhir: <span className="font-mono">{lastSyncTime}</span>
          </div>
        )}
      </div>

      {/* Code Viewer Container */}
      <div className="bg-white rounded-3xl border border-[#e0e3e5] shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex items-center justify-between p-3 bg-[#f8f9fa] border-b border-[#e0e3e5]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('codegs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                activeCodeTab === 'codegs'
                  ? 'bg-white text-[#006495] shadow-xs font-bold'
                  : 'text-[#50606e] hover:text-[#191c1e]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Code.gs (Backend Engine)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('html')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                activeCodeTab === 'html'
                  ? 'bg-white text-[#006495] shadow-xs font-bold'
                  : 'text-[#50606e] hover:text-[#191c1e]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Index.html (Web App M3)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('manifest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                activeCodeTab === 'manifest'
                  ? 'bg-white text-[#006495] shadow-xs font-bold'
                  : 'text-[#50606e] hover:text-[#191c1e]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>appsscript.json (Manifest)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('structure')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                activeCodeTab === 'structure'
                  ? 'bg-white text-[#006495] shadow-xs font-bold'
                  : 'text-[#50606e] hover:text-[#191c1e]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Struktur Sheet & Kolom</span>
            </button>
          </div>

          <div>
            {activeCodeTab === 'codegs' && (
              <button
                onClick={handleCopyGs}
                className="flex items-center gap-1 text-xs font-semibold text-[#006495] hover:text-[#004f76] px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {copiedGs ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGs ? 'Tersalin' : 'Salin Code.gs'}</span>
              </button>
            )}
            {activeCodeTab === 'html' && (
              <button
                onClick={handleCopyHtml}
                className="flex items-center gap-1 text-xs font-semibold text-[#006495] hover:text-[#004f76] px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHtml ? 'Tersalin' : 'Salin Index.html'}</span>
              </button>
            )}
            {activeCodeTab === 'manifest' && (
              <button
                onClick={handleCopyManifest}
                className="flex items-center gap-1 text-xs font-semibold text-[#006495] hover:text-[#004f76] px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {copiedManifest ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedManifest ? 'Tersalin' : 'Salin Manifest'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Code.gs Content */}
        {activeCodeTab === 'codegs' && (
          <div className="relative">
            <pre className="p-5 text-xs font-mono text-[#191c1e] bg-[#fdfdfd] overflow-x-auto max-h-[600px] leading-relaxed selection:bg-[#cbe6ff]">
              <code>{GAS_CODE_GS}</code>
            </pre>
          </div>
        )}

        {/* Tab 2: Index.html (Standalone M3 Web App) */}
        {activeCodeTab === 'html' && (
          <div className="p-5">
            <p className="text-xs text-[#50606e] mb-3">
              File ini dapat ditambahkan di Apps Script Editor melalui tombol <strong>+ (Tambahkan file) &gt; HTML</strong> dengan nama <strong className="text-[#191c1e]">Index</strong>. Menggunakan sintaks <code className="font-mono text-[#006495]">google.script.run</code> sehingga 100% bebas dari kendala CORS atau blokir browser.
            </p>
            <pre className="p-4 text-xs font-mono text-[#191c1e] bg-[#fdfdfd] rounded-2xl border border-[#e0e3e5] overflow-x-auto max-h-[600px] leading-relaxed selection:bg-[#cbe6ff]">
              <code>{GAS_INDEX_HTML}</code>
            </pre>
          </div>
        )}

        {/* Tab 3: Manifest appsscript.json */}
        {activeCodeTab === 'manifest' && (
          <div className="p-5">
            <p className="text-xs text-[#50606e] mb-3">
              Di Google Apps Script Editor, aktifkan <strong>Project Settings &gt; "Show appsscript.json manifest file in editor"</strong> lalu ganti isinya dengan kode di bawah ini:
            </p>
            <pre className="p-4 text-xs font-mono text-[#191c1e] bg-[#fdfdfd] rounded-2xl border border-[#e0e3e5] overflow-x-auto leading-relaxed">
              <code>{APPSSCRIPT_JSON}</code>
            </pre>
          </div>
        )}

        {/* Tab 4: Structure */}
        {activeCodeTab === 'structure' && (
          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-bold text-sm text-[#191c1e] mb-2">
                1. Sheet `Form Responses 1` (Pendaftaran Google Form)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-[#e0e3e5] rounded-xl overflow-hidden">
                  <thead className="bg-[#f8f9fa] border-b border-[#e0e3e5] font-semibold text-[#50606e]">
                    <tr>
                      <th className="p-2.5">Kolom</th>
                      <th className="p-2.5">Nama Header Kolom</th>
                      <th className="p-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f4f6]">
                    <tr><td className="p-2 font-mono">A</td><td className="p-2 font-medium">Timestamp</td><td className="p-2 text-[#50606e]">Waktu pengisian otomatis Google Form</td></tr>
                    <tr><td className="p-2 font-mono">B</td><td className="p-2 font-medium">Nomor Undian</td><td className="p-2 text-[#50606e]">Diisi otomatis oleh script (01, 02, 03...)</td></tr>
                    <tr><td className="p-2 font-mono">C</td><td className="p-2 font-medium">Nama Lengkap Peserta</td><td className="p-2 text-[#50606e]">Nama siswa peserta lomba</td></tr>
                    <tr><td className="p-2 font-mono">D</td><td className="p-2 font-medium">NISN</td><td className="p-2 text-[#50606e]">Nomor Induk Siswa Nasional</td></tr>
                    <tr><td className="p-2 font-mono">E</td><td className="p-2 font-medium">Asal Sekolah</td><td className="p-2 text-[#50606e]">Nama SD atau SMP asal</td></tr>
                    <tr><td className="p-2 font-mono">F</td><td className="p-2 font-medium">Kecamatan / Kabupaten</td><td className="p-2 text-[#50606e]">Kota Tual / Seram Bagian Barat</td></tr>
                    <tr><td className="p-2 font-mono">G</td><td className="p-2 font-medium">Jenjang (SD/SMP)</td><td className="p-2 text-[#50606e]">Penentu routing tab lomba (SD / SMP)</td></tr>
                    <tr><td className="p-2 font-mono">H</td><td className="p-2 font-medium">Cabang Lomba</td><td className="p-2 text-[#50606e]">Berpidato, Puisi, Cerpen, Dongeng, Menyanyi, Lawakan</td></tr>
                    <tr><td className="p-2 font-mono">I</td><td className="p-2 font-medium">Kategori (Putra/Putri)</td><td className="p-2 text-[#50606e]">Putra atau Putri</td></tr>
                    <tr><td className="p-2 font-mono">J</td><td className="p-2 font-medium">Nomor Kontak WhatsApp</td><td className="p-2 text-[#50606e]">Kontak guru pendamping untuk koordinasi lomba</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-[#191c1e] mb-2">
                2. Sheet Cabang Lomba (12 Sheet: `SD_Pidato`, `SMP_Puisi`, dll.)
              </h4>
              <p className="text-xs text-[#50606e] mb-3">
                Memuat identitas peserta, kolom kriteria nilai resmi (skala 50, 60, 70, 80) per juri, total per juri, serta Total Skor Akhir 3 Juri dengan penentuan Juara otomatis.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#e0e3e5]">
                  <span className="font-bold text-[#006495] block mb-1">Blok Juri I (Ketua)</span>
                  <p className="text-[#50606e] text-[11px]">
                    Nilai aspek multi-kriteria (50-80). Kolom total skor Juri I dihitung dengan formula penjumlahan otomatis seluruh aspek.
                  </p>
                </div>
                <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#e0e3e5]">
                  <span className="font-bold text-[#006495] block mb-1">Blok Juri II (Anggota)</span>
                  <p className="text-[#50606e] text-[11px]">
                    Nilai aspek multi-kriteria (50-80). Kolom total skor Juri II dihitung dengan formula penjumlahan otomatis seluruh aspek.
                  </p>
                </div>
                <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#e0e3e5]">
                  <span className="font-bold text-[#006495] block mb-1">Blok Juri III (Anggota)</span>
                  <p className="text-[#50606e] text-[11px]">
                    Nilai aspek multi-kriteria (50-80). Kolom total skor Juri III dihitung dengan formula penjumlahan otomatis seluruh aspek.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
