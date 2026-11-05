import React, { useState, useEffect } from 'react';
import { CABANG_LOMBA_LIST, INITIAL_PESERTA, calculateWeightedJuryScore } from './data/ftbiBranches';
import { PesertaFTBI, JuryId, Jenjang, UndianSekolahItem } from './types/ftbi';
import { Header } from './components/Header';
import { LeaderboardView } from './components/LeaderboardView';
import { ParticipantRosterView } from './components/ParticipantRosterView';
import { UndianUrutanTampilView } from './components/UndianUrutanTampilView';
import { JuryScoringView } from './components/JuryScoringView';
import { SimulationPortal } from './components/SimulationPortal';
import { GasCodeHub } from './components/GasCodeHub';
import { InstallationGuide } from './components/InstallationGuide';
import { OfficialReportModal } from './components/OfficialReportModal';
import { SyncModal } from './components/SyncModal';
import {
  CheckCircle2,
  AlertTriangle,
  Bug,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export interface BranchDebugEntry {
  id: string;
  rawString: string;
  length: number;
  sanitizedString: string;
  charCodesSummary: string;
  charHexCodes: string;
  hasSpecialWhitespace: boolean;
  specialCharsFound: string[];
  matchedAs: string;
  rowContext: string;
  timestamp: string;
}

// ============================================================================
// PERBAIKAN 1: Konstanta URL + reset data lama di browser (sekali saja)
// ============================================================================

// Default Google Apps Script Web App Endpoint (URL /exec dari Deploy)
const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbyrGkxzq1j6tHHed4RR27pTbbnTYcer1qwqx8v2VsRscUZqpMKF9hK3JzJ8r8sE9wvJ/exec';

// Naikkan angka ini jika suatu saat ingin memaksa semua browser membuang data lama.
const APP_DATA_VERSION = '2';

// Dijalankan sekali saat file dimuat: buang cache lama (data peserta usang & URL lama)
try {
  if (localStorage.getItem('ftbi_data_version') !== APP_DATA_VERSION) {
    localStorage.removeItem('ftbi_peserta_data');
    localStorage.removeItem('ftbi_gas_url');
    localStorage.removeItem('ftbi_sheet_url');
    localStorage.removeItem('ftbi_sheet_name');
    localStorage.setItem('ftbi_data_version', APP_DATA_VERSION);
  }
} catch {
  // localStorage tidak tersedia (mis. mode privat tertentu) - abaikan
}

// ============================================================================
// PERBAIKAN 2: Helper fetch langsung ke Apps Script (tanpa /api/gas-proxy)
// ============================================================================

// Bangun URL + parameter + anti-cache (_=timestamp)
const buildGasUrl = (base: string, params: Record<string, string>): string => {
  const u = new URL(base);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  u.searchParams.set('_', String(Date.now()));
  return u.toString();
};

// Ambil JSON dari Apps Script, tidak di-cache, dengan pesan error yang jelas
const fetchGasJson = async (url: string): Promise<any> => {
  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      'Respons dari Google Apps Script bukan JSON. Pastikan deployment diatur "Who has access: Anyone", ' +
        'memakai URL yang berakhiran /exec, dan sudah di-deploy ulang dengan "New version".'
    );
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'peserta' | 'undian' | 'scoring' | 'simulation' | 'gas_code' | 'guide'>('leaderboard');
  const [selectedJenjang, setSelectedJenjang] = useState<Jenjang>('SD');
  const [selectedCabangId, setSelectedCabangId] = useState<string>(CABANG_LOMBA_LIST[0].id);
  const [activePesertaId, setActivePesertaId] = useState<string | null>(null);

  // Participants Data State with auto-healing for misplaced Menyanyi & Cerita Pendek
  const healPesertaData = (list: PesertaFTBI[]): PesertaFTBI[] => {
    return list.map((p) => {
      if (p.cabangLombaId === 'berpidato') {
        const checkStr = `${p.nama} ${p.asalSekolah} ${p.kecamatanKabupaten} ${p.id}`.toLowerCase();
        const notes = `${p.nilaiJuri1?.catatan || ''} ${p.nilaiJuri2?.catatan || ''} ${p.nilaiJuri3?.catatan || ''}`.toLowerCase();

        // Cek Menyanyi Nyanyian Rakyat
        if (
          checkStr.includes('nyanyi') ||
          checkStr.includes('rakyat') ||
          checkStr.includes('lagu') ||
          checkStr.includes('vokal') ||
          checkStr.includes('vocal') ||
          checkStr.includes('tembang') ||
          checkStr.includes('pupuh') ||
          checkStr.includes('sekar') ||
          checkStr.includes('kawih') ||
          checkStr.includes('suara') ||
          notes.includes('nyanyi') ||
          notes.includes('rakyat') ||
          notes.includes('lagu') ||
          notes.includes('vokal')
        ) {
          return {
            ...p,
            cabangLombaId: 'menyanyi',
          };
        }

        // Cek Cerita Pendek
        if (
          checkStr.includes('cerita') ||
          checkStr.includes('pendek') ||
          checkStr.includes('cerpen') ||
          checkStr.includes('carpon') ||
          notes.includes('cerpen') ||
          notes.includes('cerita')
        ) {
          return {
            ...p,
            cabangLombaId: 'menulis_cerpen',
          };
        }

        // Cek Puisi
        if (checkStr.includes('puisi') || checkStr.includes('sajak') || notes.includes('puisi')) {
          return {
            ...p,
            cabangLombaId: 'menulis_membaca_puisi',
          };
        }

        // Cek Dongeng
        if (checkStr.includes('dongeng') || checkStr.includes('ngedongeng') || notes.includes('dongeng')) {
          return {
            ...p,
            cabangLombaId: 'mendongeng',
          };
        }

        // Cek Lawakan Tunggal
        if (checkStr.includes('lawak') || checkStr.includes('stand') || checkStr.includes('komedi') || notes.includes('lawak')) {
          return {
            ...p,
            cabangLombaId: 'stand_up_comedy',
          };
        }
      }
      return p;
    });
  };

  const [pesertaList, setPesertaList] = useState<PesertaFTBI[]>(() => {
    const saved = localStorage.getItem('ftbi_peserta_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return healPesertaData(parsed);
      } catch {
        return healPesertaData(INITIAL_PESERTA);
      }
    }
    return healPesertaData(INITIAL_PESERTA);
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('ftbi_peserta_data', JSON.stringify(pesertaList));
  }, [pesertaList]);

  // Google Apps Script Connection State
  const [webAppUrl, setWebAppUrl] = useState<string>(() => {
    return localStorage.getItem('ftbi_gas_url') || DEFAULT_GAS_URL;
  });
  const [isConnectedGas, setIsConnectedGas] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSavingRemote, setIsSavingRemote] = useState<boolean>(false);

  // Recently updated / scored participants for visual pulse and highlight effect
  const [recentlyUpdatedPesertaIds, setRecentlyUpdatedPesertaIds] = useState<string[]>([]);

  const markPesertaAsRecentlyUpdated = (pesertaId: string) => {
    setRecentlyUpdatedPesertaIds((prev) => Array.from(new Set([...prev, pesertaId])));
    setTimeout(() => {
      setRecentlyUpdatedPesertaIds((prev) => prev.filter((id) => id !== pesertaId));
    }, 6000);
  };

  // Real-time Auto-Refresh / Live Sync State
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState<boolean>(true);

  // Background Live Sync: pembaruan otomatis berkala setiap 20 detik
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const timer = setInterval(() => {
      const urlToSync = webAppUrl.trim() || DEFAULT_GAS_URL;
      syncFromGas(urlToSync, true);
    }, 20000);

    return () => clearInterval(timer);
  }, [isAutoRefreshEnabled, webAppUrl]);

  // Official Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Recalculate totals and rankings helper
  const recalculateData = (currentList: PesertaFTBI[]): PesertaFTBI[] => {
    return currentList.map((p) => {
      const j1 = p.nilaiJuri1?.totalWeightedScore || 0;
      const j2 = p.nilaiJuri2?.totalWeightedScore || 0;
      const j3 = p.nilaiJuri3?.totalWeightedScore || 0;

      const total = Math.round((j1 + j2 + j3) * 100) / 100;
      let countJuries = 0;
      if (p.nilaiJuri1) countJuries++;
      if (p.nilaiJuri2) countJuries++;
      if (p.nilaiJuri3) countJuries++;

      const avg = countJuries > 0 ? Math.round((total / 3) * 100) / 100 : 0;

      let statusVerifikasi: PesertaFTBI['statusVerifikasi'] = 'Belum Dinilai';
      if (countJuries === 3) statusVerifikasi = 'Diverifikasi';
      else if (countJuries > 0) statusVerifikasi = 'Sebagian';

      return {
        ...p,
        totalNilai: total,
        rataRataNilai: avg,
        statusVerifikasi,
      };
    });
  };

  // ==========================================================================
  // PERBAIKAN 3: Simpan skor juri langsung ke Apps Script (tanpa proxy)
  // ==========================================================================
  const handleSaveScore = async (
    pesertaId: string,
    juryId: JuryId,
    juryName: string,
    scores: Record<string, number>,
    catatan: string
  ): Promise<boolean> => {
    const activeCabang = CABANG_LOMBA_LIST.find((c) => c.id === selectedCabangId) || CABANG_LOMBA_LIST[0];
    const weightedScore = calculateWeightedJuryScore(activeCabang.kriteria, scores);

    const now = new Date().toLocaleString('sv-SE').replace('T', ' ');

    setPesertaList((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== pesertaId) return p;

        const juryItem = {
          juryId,
          juryName,
          kriteriaScores: scores,
          totalWeightedScore: weightedScore,
          catatan,
          timestamp: now,
        };

        const newP = { ...p };
        if (juryId === 'Juri 1') newP.nilaiJuri1 = juryItem;
        if (juryId === 'Juri 2') newP.nilaiJuri2 = juryItem;
        if (juryId === 'Juri 3') newP.nilaiJuri3 = juryItem;

        return newP;
      });

      return recalculateData(updated);
    });

    // Trigger visual pulse & highlight on this participant
    markPesertaAsRecentlyUpdated(pesertaId);

    // Kirim skor ke Google Apps Script via POST langsung
    const targetUrl = webAppUrl.trim() || DEFAULT_GAS_URL;
    if (targetUrl) {
      setIsSavingRemote(true);
      try {
        const targetPeserta = pesertaList.find((p) => p.id === pesertaId);
        if (targetPeserta) {
          const payload = {
            action: 'submitScore',
            jenjang: targetPeserta.jenjang,
            cabangLombaId: targetPeserta.cabangLombaId,
            noUndian: targetPeserta.noUndian,
            nama: targetPeserta.nama,
            asalSekolah: targetPeserta.asalSekolah,
            kecamatanKabupaten: targetPeserta.kecamatanKabupaten,
            juryId,
            juryName,
            scores,
            totalScore: weightedScore,
            catatan,
            timestamp: now,
          };

          // mode 'no-cors' hanya mengizinkan content-type sederhana, jadi pakai text/plain.
          // Di Apps Script, tetap baca dengan JSON.parse(e.postData.contents).
          await fetch(targetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
          });

          const timeNow = new Date().toLocaleTimeString('id-ID');
          setLastSyncTime(timeNow);
          setIsConnectedGas(true);
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi remote GAS via POST:', err);
      } finally {
        setIsSavingRemote(false);
      }
    }

    return true;
  };

  // Handler: Add Participant (Simulation of onFormSubmit)
  const handleAddPeserta = (
    newPeserta: Omit<PesertaFTBI, 'id' | 'totalNilai' | 'rataRataNilai' | 'statusVerifikasi'>
  ) => {
    const newId = `p-${Date.now()}`;
    const fullPeserta: PesertaFTBI = {
      ...newPeserta,
      id: newId,
      totalNilai: 0,
      rataRataNilai: 0,
      statusVerifikasi: 'Belum Dinilai',
    };

    setPesertaList((prev) => recalculateData([...prev, fullPeserta]));
  };

  // Handler: Auto Grade All for demo & tie-breaker testing
  const handleAutoGradeAll = () => {
    const updated = pesertaList.map((p) => {
      const cabang = CABANG_LOMBA_LIST.find((c) => c.id === p.cabangLombaId) || CABANG_LOMBA_LIST[0];

      const generateRandomScores = () => {
        const s: Record<string, number> = {};
        const options = [60, 70, 80, 80, 70];
        cabang.kriteria.forEach((k) => {
          s[k.id] = options[Math.floor(Math.random() * options.length)];
        });
        return s;
      };

      const s1 = generateRandomScores();
      const s2 = generateRandomScores();
      const s3 = generateRandomScores();

      const w1 = calculateWeightedJuryScore(cabang.kriteria, s1);
      const w2 = calculateWeightedJuryScore(cabang.kriteria, s2);
      const w3 = calculateWeightedJuryScore(cabang.kriteria, s3);

      const now = new Date().toLocaleString('sv-SE').replace('T', ' ');

      return {
        ...p,
        nilaiJuri1: {
          juryId: 'Juri 1' as const,
          juryName: 'Juri I (Ketua Dewan Juri)',
          kriteriaScores: s1,
          totalWeightedScore: w1,
          catatan: 'Penguasaan panggung sangat baik, artikulasi jelas.',
          timestamp: now,
        },
        nilaiJuri2: {
          juryId: 'Juri 2' as const,
          juryName: 'Juri II (Anggota)',
          kriteriaScores: s2,
          totalWeightedScore: w2,
          catatan: 'Penghayatan dan vokal mantap.',
          timestamp: now,
        },
        nilaiJuri3: {
          juryId: 'Juri 3' as const,
          juryName: 'Juri III (Anggota)',
          kriteriaScores: s3,
          totalWeightedScore: w3,
          catatan: 'Penampilan meyakinkan dan orisinalitas tinggi.',
          timestamp: now,
        },
      };
    });

    setPesertaList(recalculateData(updated));
  };

  // Handler: Reset Data
  const handleResetData = () => {
    if (window.confirm('Reset seluruh data peserta dan penilaian ke contoh awal FTBI?')) {
      setPesertaList(INITIAL_PESERTA);
      localStorage.removeItem('ftbi_peserta_data');
    }
  };

  // Debug State for Unmatched / Ambiguous Branch Strings
  const [debugUnmatchedBranches, setDebugUnmatchedBranches] = useState<BranchDebugEntry[]>([]);
  const [isDebugPanelExpanded, setIsDebugPanelExpanded] = useState<boolean>(true);
  const [copiedDebugId, setCopiedDebugId] = useState<string | null>(null);

  // Helper: Catat & cetak log debug detail karakter, kode Unicode, hex, dan spasi khusus
  const recordUnmatchedBranchDebug = (
    rawStr: string,
    cleanStr: string,
    matchedAs: string,
    rowOrItem?: any
  ) => {
    const specialCharsFound: string[] = [];
    const charCodesArr: string[] = [];
    const hexCodesArr: string[] = [];

    for (let i = 0; i < rawStr.length; i++) {
      const char = rawStr[i];
      const code = char.charCodeAt(0);
      const hex = `0x${code.toString(16).toUpperCase().padStart(4, '0')}`;

      if (code === 160) specialCharsFound.push(`NBSP (\\u00A0 non-breaking space pada indeks ${i})`);
      else if (code === 8203) specialCharsFound.push(`Zero-Width Space (\\u200B pada indeks ${i})`);
      else if (code === 65279) specialCharsFound.push(`BOM / ZWNBSP (\\uFEFF pada indeks ${i})`);
      else if (code === 8239) specialCharsFound.push(`Narrow NBSP (\\u202F pada indeks ${i})`);
      else if (code === 9) specialCharsFound.push(`Tab (\\t pada indeks ${i})`);
      else if (code === 13) specialCharsFound.push(`Carriage Return (\\r pada indeks ${i})`);
      else if (code === 10) specialCharsFound.push(`Line Feed (\\n pada indeks ${i})`);

      charCodesArr.push(`${char === ' ' ? '[SPASI]' : char}: ${code}`);
      hexCodesArr.push(`${char === ' ' ? '[SPASI]' : char}: ${hex}`);
    }

    const hasSpecialWhitespace = specialCharsFound.length > 0;

    console.warn(
      `🔍 [FTBI Debug normalizeCabangId] Peringatan: String cabang "${rawStr}" (panjang: ${rawStr.length}) tidak cocok secara langsung!\n` +
      `  • Raw string        : "${rawStr}"\n` +
      `  • Sanitized string  : "${cleanStr}"\n` +
      `  • Kode Karakter     : ${charCodesArr.slice(0, 30).join(', ')}${rawStr.length > 30 ? ' ...' : ''}\n` +
      `  • Kode Hex Unicode  : ${hexCodesArr.slice(0, 30).join(', ')}${rawStr.length > 30 ? ' ...' : ''}\n` +
      `  • Anomali Spasi     : ${hasSpecialWhitespace ? specialCharsFound.join('; ') : 'Tidak ada (karakter normal)'}\n` +
      `  • Hasil Fallback ke : "${matchedAs}"\n` +
      `  • Konteks Baris/Item:`,
      rowOrItem
    );

    const newEntry: BranchDebugEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      rawString: rawStr.length === 0 ? '(String Kosong / Empty)' : rawStr,
      length: rawStr.length,
      sanitizedString: cleanStr || '(Kosong setelah pembersihan)',
      charCodesSummary: charCodesArr.slice(0, 25).join(' | '),
      charHexCodes: hexCodesArr.slice(0, 25).join(' | '),
      hasSpecialWhitespace,
      specialCharsFound,
      matchedAs,
      rowContext: rowOrItem
        ? typeof rowOrItem === 'object'
          ? JSON.stringify(rowOrItem).slice(0, 200)
          : String(rowOrItem)
        : 'Tidak ada data objek baris',
      timestamp: new Date().toLocaleTimeString('id-ID'),
    };

    setDebugUnmatchedBranches((prev) => {
      if (prev.some((p) => p.rawString === newEntry.rawString && p.matchedAs === newEntry.matchedAs)) {
        return prev;
      }
      return [newEntry, ...prev.slice(0, 19)];
    });
  };

  // Normalization Helpers for Spreadsheet Data
  const normalizeCabangId = (str: string, rowOrItem?: any): string => {
    const rawStr = String(str || '');

    const cleanStr = rawStr
      .normalize('NFKD')
      .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    // Cabang Menyanyi Nyanyian Rakyat
    if (
      cleanStr.includes('nyanyi') ||
      cleanStr.includes('rakyat') ||
      cleanStr.includes('lagu') ||
      cleanStr.includes('vokal') ||
      cleanStr.includes('vocal') ||
      cleanStr.includes('tembang') ||
      cleanStr.includes('pupuh') ||
      cleanStr.includes('sekar') ||
      cleanStr.includes('kawih') ||
      cleanStr.includes('singing') ||
      cleanStr.includes('song') ||
      cleanStr.includes('suara') ||
      cleanStr.includes('solis') ||
      cleanStr.includes('menyanyi')
    ) {
      return 'menyanyi';
    }

    // Cabang Cerita Pendek (Menulis Cerpen)
    if (
      cleanStr.includes('cerita') ||
      cleanStr.includes('pendek') ||
      cleanStr.includes('cerpen') ||
      cleanStr.includes('carpon')
    ) {
      return 'menulis_cerpen';
    }

    // Cabang Menulis dan Membaca Puisi
    if (cleanStr.includes('puisi') || cleanStr.includes('sajak')) {
      return 'menulis_membaca_puisi';
    }

    // Cabang Mendongeng
    if (cleanStr.includes('dongeng') || cleanStr.includes('ngedongeng')) {
      return 'mendongeng';
    }

    // Cabang Lawakan Tunggal (Stand Up Comedy)
    if (
      cleanStr.includes('stand') ||
      cleanStr.includes('comedy') ||
      cleanStr.includes('komedi') ||
      cleanStr.includes('lawak') ||
      cleanStr.includes('tunggal') ||
      cleanStr.includes('borangan')
    ) {
      return 'stand_up_comedy';
    }

    // Cabang Berpidato (Biantara)
    if (cleanStr.includes('pidato') || cleanStr.includes('biantara')) {
      return 'berpidato';
    }

    // Pemindaian Mendalam pada seluruh data baris jika kolom cabang tidak langsung cocok
    if (rowOrItem) {
      const allText = (typeof rowOrItem === 'object'
        ? Object.values(rowOrItem).map((v) => String(v || '')).join(' ')
        : String(rowOrItem)
      )
        .normalize('NFKD')
        .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
        .toLowerCase();

      if (
        allText.includes('nyanyi') ||
        allText.includes('rakyat') ||
        allText.includes('lagu') ||
        allText.includes('vokal') ||
        allText.includes('vocal') ||
        allText.includes('tembang') ||
        allText.includes('pupuh') ||
        allText.includes('suara')
      ) {
        return 'menyanyi';
      }
      if (allText.includes('cerita') || allText.includes('pendek') || allText.includes('cerpen') || allText.includes('carpon')) {
        return 'menulis_cerpen';
      }
      if (allText.includes('puisi') || allText.includes('sajak')) {
        return 'menulis_membaca_puisi';
      }
      if (allText.includes('dongeng') || allText.includes('ngedongeng')) {
        return 'mendongeng';
      }
      if (allText.includes('lawak') || allText.includes('stand') || allText.includes('komedi') || allText.includes('borangan')) {
        return 'stand_up_comedy';
      }
      if (allText.includes('pidato') || allText.includes('biantara')) {
        return 'berpidato';
      }
    }

    // Cabang tidak ditemukan: catat debug & fallback
    const fallbackId = CABANG_LOMBA_LIST[0].id;
    recordUnmatchedBranchDebug(rawStr, cleanStr, fallbackId, rowOrItem);

    return fallbackId;
  };

  const normalizeJenjang = (str: string): Jenjang => {
    const s = String(str || '').toUpperCase();
    if (s.includes('SMP') || s.includes('MENENGAH')) return 'SMP';
    return 'SD';
  };

  const normalizeGender = (str: string): 'Putra' | 'Putri' => {
    const s = String(str || '').toLowerCase();
    if (s.includes('putri') || s.includes('pi') || s.includes('perempuan') || s.includes('wanita')) return 'Putri';
    return 'Putra';
  };

  // State for Sync Modal & Toast
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (syncSuccessMessage) {
      const timer = setTimeout(() => setSyncSuccessMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [syncSuccessMessage]);

  // ==========================================================================
  // PERBAIKAN 4: Sinkronisasi dari Google Apps Script (fetch langsung)
  // ==========================================================================
  const syncFromGas = async (url: string, isSilent: boolean = false): Promise<boolean> => {
    const rawUrl = url.trim();
    if (!rawUrl) return false;

    // Jika user menempelkan URL Spreadsheet, arahkan ke sinkronisasi sheet langsung
    if (rawUrl.includes('docs.google.com/spreadsheets/d/')) {
      return syncFromDirectSheet(rawUrl, 'Form Responses 1', isSilent);
    }

    if (!isSilent) {
      setIsConnecting(true);
      setConnectionError(null);
    }

    try {
      localStorage.setItem('ftbi_gas_url', rawUrl);

      // Ambil data langsung dari Apps Script (anti-cache, tanpa proxy)
      const dataUrl = buildGasUrl(rawUrl, { action: 'getLeaderboard', branch: 'all', level: 'all' });
      const gasData = await fetchGasJson(dataUrl);

      let dataArray: any[] = [];
      if (gasData && gasData.status === 'success') {
        dataArray = Array.isArray(gasData.data) ? gasData.data : [];
      } else if (gasData && gasData.message) {
        throw new Error(gasData.message);
      }

      // Jika sheet cabang kosong, picu syncFromForm lalu ambil ulang
      if (dataArray.length === 0) {
        try {
          await fetchGasJson(buildGasUrl(rawUrl, { action: 'syncFromForm' }));
          const retryData = await fetchGasJson(
            buildGasUrl(rawUrl, { action: 'getLeaderboard', branch: 'all', level: 'all' })
          );
          if (retryData.status === 'success' && Array.isArray(retryData.data)) {
            dataArray = retryData.data;
          }
        } catch (retryErr) {
          console.warn('Retry syncFromForm gagal:', retryErr);
        }
      }

      if (dataArray.length > 0) {
        const syncedList: PesertaFTBI[] = dataArray.map((item: any, idx: number) => {
          const jenjang = normalizeJenjang(item.jenjang);
          let cabangLombaId = normalizeCabangId(item.cabangLombaId || item.cabangLombaNama || item.cabang || item.namaLomba || item.lomba, item);

          // Pencegahan: item terdata berpidato padahal sebenarnya menyanyi / cerita pendek
          if (cabangLombaId === 'berpidato') {
            const allItemStr = JSON.stringify(item).toLowerCase();
            if (
              allItemStr.includes('nyanyi') ||
              allItemStr.includes('rakyat') ||
              allItemStr.includes('lagu') ||
              allItemStr.includes('vokal') ||
              allItemStr.includes('vocal') ||
              allItemStr.includes('tembang') ||
              allItemStr.includes('pupuh') ||
              allItemStr.includes('sekar') ||
              allItemStr.includes('kawih') ||
              allItemStr.includes('suara')
            ) {
              cabangLombaId = 'menyanyi';
            } else if (
              allItemStr.includes('cerita') ||
              allItemStr.includes('pendek') ||
              allItemStr.includes('cerpen') ||
              allItemStr.includes('carpon')
            ) {
              cabangLombaId = 'menulis_cerpen';
            }
          }

          const kategoriGender = normalizeGender(item.kategoriGender || item.kategori);
          const noUndian = String(item.noUndian || (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`));

          return {
            id: item.id || `gas-${jenjang}-${cabangLombaId}-${noUndian}`,
            noUndian,
            nama: String(item.nama || '').trim(),
            nisn: item.nisn ? String(item.nisn) : undefined,
            asalSekolah: String(item.asalSekolah || '-'),
            kecamatanKabupaten: String(item.kecamatanKabupaten || 'Kota Tual / Seram Bagian Barat'),
            jenjang,
            cabangLombaId,
            kategoriGender,
            timestampPendaftaran: gasData?.updatedAt || new Date().toLocaleString('id-ID'),
            totalNilai: Number(item.totalNilai) || 0,
            rataRataNilai: Number(item.rataRataNilai) || 0,
            peringkat: Number(item.peringkat) || idx + 1,
            predikat: item.predikat || 'Peserta',
            statusVerifikasi: item.statusVerifikasi || 'Belum Dinilai',
            nilaiJuri1: item.nilaiJuri1 ? {
              juryId: 'Juri 1' as const,
              juryName: 'Juri 1',
              kriteriaScores: {},
              totalWeightedScore: Number(item.nilaiJuri1) || 0,
              timestamp: '',
            } : undefined,
            nilaiJuri2: item.nilaiJuri2 ? {
              juryId: 'Juri 2' as const,
              juryName: 'Juri 2',
              kriteriaScores: {},
              totalWeightedScore: Number(item.nilaiJuri2) || 0,
              timestamp: '',
            } : undefined,
            nilaiJuri3: item.nilaiJuri3 ? {
              juryId: 'Juri 3' as const,
              juryName: 'Juri 3',
              kriteriaScores: {},
              totalWeightedScore: Number(item.nilaiJuri3) || 0,
              timestamp: '',
            } : undefined,
          };
        });

        const recalculated = recalculateData(syncedList);

        // Deteksi peserta yang berubah untuk efek visual
        setPesertaList((prevList) => {
          const changedIds: string[] = [];
          recalculated.forEach((newP) => {
            const oldP = prevList.find(
              (p) =>
                p.noUndian === newP.noUndian &&
                p.jenjang === newP.jenjang &&
                p.cabangLombaId === newP.cabangLombaId
            );
            if (
              !oldP ||
              oldP.totalNilai !== newP.totalNilai ||
              oldP.statusVerifikasi !== newP.statusVerifikasi
            ) {
              changedIds.push(newP.id);
            }
          });

          if (changedIds.length > 0 && prevList.length > 0) {
            setRecentlyUpdatedPesertaIds((prev) => Array.from(new Set([...prev, ...changedIds])));
            setTimeout(() => {
              setRecentlyUpdatedPesertaIds((prev) => prev.filter((id) => !changedIds.includes(id)));
            }, 6000);
          }

          return recalculated;
        });

        setIsConnectedGas(true);
        const timeNow = new Date().toLocaleTimeString('id-ID');
        setLastSyncTime(timeNow);
        if (!isSilent) {
          setSyncSuccessMessage(`Berhasil menyinkronkan ${syncedList.length} peserta dari spreadsheet via Google Apps Script.`);
        }
        return true;
      } else {
        setIsConnectedGas(true);
        // Pesan hanya ditampilkan untuk sinkronisasi manual (bukan polling 20 detik)
        if (!isSilent) {
          setSyncSuccessMessage('Terhubung dengan Google Apps Script. Namun respon Google Form belum memiliki data pendaftaran peserta.');
        }
        return true;
      }
    } catch (err: any) {
      // Error sekarang selalu dicatat di console agar mudah didiagnosis
      console.error('Sinkronisasi Google Apps Script gagal:', err);
      if (!isSilent) {
        setConnectionError(err.message || 'Gagal terhubung ke Google Apps Script.');
      }
      setIsConnectedGas(false);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Handler: Sync directly from Google Sheet (GViz API)
  // CATATAN: memakai /api/sheet-proxy yang hanya ada jika Anda punya backend / Vercel Function.
  // Jika tidak ada, fungsi ini akan menampilkan pesan error yang jelas (bukan gagal diam-diam).
  const syncFromDirectSheet = async (urlOrId: string, sheetName: string = 'Form Responses 1', isSilent: boolean = false): Promise<boolean> => {
    if (!urlOrId.trim()) return false;
    if (!isSilent) {
      setIsConnecting(true);
      setConnectionError(null);
    }

    try {
      localStorage.setItem('ftbi_sheet_url', urlOrId.trim());
      localStorage.setItem('ftbi_sheet_name', sheetName.trim());

      const proxyUrl = `/api/sheet-proxy?url=${encodeURIComponent(urlOrId.trim())}&sheet=${encodeURIComponent(sheetName.trim())}`;
      const res = await fetch(proxyUrl, { cache: 'no-store' });
      const rawText = await res.text();

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          'Endpoint /api/sheet-proxy tidak tersedia di hosting ini (Vercel hanya menyajikan file statis). ' +
            'Gunakan URL Google Apps Script (/exec) untuk sinkronisasi.'
        );
      }

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Gagal membaca Google Sheet.');
      }

      const rows: any[] = data.data || [];
      if (rows.length === 0) {
        throw new Error(`Sheet "${sheetName}" ditemukan namun belum memiliki baris data peserta.`);
      }

      const convertedList: PesertaFTBI[] = [];

      rows.forEach((row, idx) => {
        const keys = Object.keys(row);
        const findVal = (regex: RegExp, excludeRegex?: RegExp) => {
          const matchedKey = keys.find((k) => regex.test(k) && (!excludeRegex || !excludeRegex.test(k)));
          return matchedKey !== undefined ? String(row[matchedKey] || '').trim() : '';
        };

        const nama = findVal(/nama/i);
        if (!nama) return;

        const jenjang = normalizeJenjang(findVal(/jenjang|tingkat|kelas/i));

        let rawCabang = findVal(
          /cabang|mata\s*lomba|jenis\s*lomba|bidang\s*lomba/i,
          /jenjang|tingkat|kelas|gender|putra|putri|kategori\s*peserta/i
        );

        if (!rawCabang) {
          rawCabang = findVal(/lomba|pilihan/i, /jenjang|tingkat|kelas|gender|putra|putri|kategori/i);
        }

        if (!rawCabang && sheetName) {
          rawCabang = sheetName;
        }

        let cabangLombaId = normalizeCabangId(rawCabang, row);

        if (cabangLombaId === 'berpidato' && !rawCabang.toLowerCase().includes('pidato')) {
          const rowText = Object.values(row)
            .map((v) => String(v || ''))
            .join(' ')
            .normalize('NFKD')
            .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
            .toLowerCase();

          if (
            rowText.includes('nyanyi') ||
            rowText.includes('rakyat') ||
            rowText.includes('lagu') ||
            rowText.includes('vokal') ||
            rowText.includes('vocal') ||
            rowText.includes('tembang') ||
            rowText.includes('pupuh') ||
            rowText.includes('sekar') ||
            rowText.includes('kawih') ||
            rowText.includes('suara')
          ) {
            cabangLombaId = 'menyanyi';
          } else if (
            rowText.includes('cerita') ||
            rowText.includes('pendek') ||
            rowText.includes('cerpen') ||
            rowText.includes('carpon')
          ) {
            cabangLombaId = 'menulis_cerpen';
          }
        }
        const kategoriGender = normalizeGender(findVal(/gender|kategori|kelamin|putra/i));
        const asalSekolah = findVal(/sekolah|instansi|madrasah/i) || '-';
        const kecKab = findVal(/kecamatan|kabupaten|kota|daerah|wilayah/i) || 'Kota Tual / Seram Bagian Barat';
        const nisn = findVal(/nisn|induk/i);
        const undianRaw = findVal(/undian|nomor urut|no urut/i);
        const noUndian = undianRaw || (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`);

        convertedList.push({
          id: `sheet-${idx + 1}-${Date.now()}`,
          noUndian,
          nama,
          nisn: nisn || undefined,
          asalSekolah,
          kecamatanKabupaten: kecKab,
          jenjang,
          cabangLombaId,
          kategoriGender,
          timestampPendaftaran: findVal(/timestamp|waktu/i) || new Date().toLocaleString('id-ID'),
          totalNilai: 0,
          rataRataNilai: 0,
          peringkat: idx + 1,
          predikat: 'Peserta',
          statusVerifikasi: 'Belum Dinilai',
        });
      });

      if (convertedList.length > 0) {
        setPesertaList(recalculateData(convertedList));
        setIsConnectedGas(true);
        const timeNow = new Date().toLocaleTimeString('id-ID');
        setLastSyncTime(timeNow);
        setSyncSuccessMessage(`Berhasil menarik ${convertedList.length} peserta langsung dari Google Sheet!`);
        return true;
      } else {
        throw new Error('Tidak ditemukan baris peserta dengan kolom "Nama" pada sheet tersebut.');
      }
    } catch (err: any) {
      console.error('Sinkronisasi Google Sheet gagal:', err);
      if (!isSilent) {
        setConnectionError(err.message || 'Gagal membaca data dari Google Spreadsheet.');
      }
      setIsConnectedGas(false);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto-sync saat komponen dimuat memakai endpoint Apps Script
  useEffect(() => {
    const urlToUse = webAppUrl.trim() || DEFAULT_GAS_URL;
    syncFromGas(urlToUse, true).then((success) => {
      if (!success) {
        const savedSheetUrl = localStorage.getItem('ftbi_sheet_url');
        if (savedSheetUrl) {
          const savedName = localStorage.getItem('ftbi_sheet_name') || 'Form Responses 1';
          syncFromDirectSheet(savedSheetUrl, savedName, true);
        }
      }
    });
  }, []);

  // Quick Sync Handler for manual refresh & polling
  const handleQuickSync = async (isSilent: boolean = false) => {
    const urlToUse = webAppUrl.trim() || DEFAULT_GAS_URL;
    if (urlToUse) {
      return await syncFromGas(urlToUse, isSilent);
    } else {
      const savedSheet = localStorage.getItem('ftbi_sheet_url');
      if (savedSheet) {
        const savedName = localStorage.getItem('ftbi_sheet_name') || 'Form Responses 1';
        return await syncFromDirectSheet(savedSheet, savedName, isSilent);
      } else {
        setIsSyncModalOpen(true);
        return false;
      }
    }
  };

  // Jump from Leaderboard to Scoring tab for specific participant
  const handleSelectPesertaForScoring = (pesertaId: string) => {
    const target = pesertaList.find((p) => p.id === pesertaId);
    if (target) {
      setSelectedJenjang(target.jenjang);
      setSelectedCabangId(target.cabangLombaId);
      setActivePesertaId(target.id);
      setActiveTab('scoring');
    }
  };

  // Handler to manually update a participant's branch if misclassified
  const handleUpdatePesertaCabang = (pesertaId: string, newCabangId: string) => {
    setPesertaList((prev) => {
      const updated = prev.map((p) => {
        if (p.id === pesertaId) {
          return {
            ...p,
            cabangLombaId: newCabangId,
          };
        }
        return p;
      });
      return recalculateData(updated);
    });
    const targetBranch = CABANG_LOMBA_LIST.find((c) => c.id === newCabangId);
    setSyncSuccessMessage(`Cabang lomba peserta berhasil diubah ke "${targetBranch ? targetBranch.nama : newCabangId}"!`);
  };

  // Handler: Apply drawn 19 lottery numbers per school to participants
  const handleApplyUndianToPeserta = (
    undianResults: UndianSekolahItem[],
    jenjang: Jenjang,
    cabangLombaId: string
  ) => {
    const schoolToNumber: Record<string, string> = {};
    undianResults.forEach((u) => {
      const formatted = u.nomorUndian < 10 ? `0${u.nomorUndian}` : String(u.nomorUndian);
      schoolToNumber[u.asalSekolah] = formatted;
    });

    const changedIds: string[] = [];

    setPesertaList((prev) => {
      const updated = prev.map((p) => {
        if (p.jenjang === jenjang && p.cabangLombaId === cabangLombaId && schoolToNumber[p.asalSekolah]) {
          const newNo = schoolToNumber[p.asalSekolah];
          if (p.noUndian !== newNo) {
            changedIds.push(p.id);
            return {
              ...p,
              noUndian: newNo,
            };
          }
        }
        return p;
      });
      return recalculateData(updated);
    });

    if (changedIds.length > 0) {
      setRecentlyUpdatedPesertaIds((prev) => Array.from(new Set([...prev, ...changedIds])));
      setTimeout(() => {
        setRecentlyUpdatedPesertaIds((prev) => prev.filter((id) => !changedIds.includes(id)));
      }, 6000);
    }

    const branch = CABANG_LOMBA_LIST.find((c) => c.id === cabangLombaId);
    setSyncSuccessMessage(
      `🎉 Hasil undian urutan tampil (1 s.d. 19) dari ${undianResults.length} sekolah berhasil diterapkan pada peserta ${branch ? branch.nama : cabangLombaId} tingkat ${jenjang}!`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-[#191c1e]">
      {/* M3 Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReport={() => setIsReportModalOpen(true)}
        isConnectedGas={isConnectedGas}
        onOpenConnectModal={() => setIsSyncModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onQuickSync={handleQuickSync}
        isSyncing={isConnecting}
        lastSyncTime={lastSyncTime}
        isAutoRefreshEnabled={isAutoRefreshEnabled}
        onToggleAutoRefresh={() => setIsAutoRefreshEnabled((prev) => !prev)}
      />

      {/* Sync Success / Info Toast */}
      {syncSuccessMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{syncSuccessMessage}</span>
            </div>
            <button
              onClick={() => setSyncSuccessMessage(null)}
              className="text-white/80 hover:text-white text-xs underline ml-4"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Banner error sinkronisasi: sebelumnya error disembunyikan saat sync otomatis */}
      {!isConnectedGas && connectionError && (
        <div className="bg-red-600 text-white px-4 py-2.5 text-xs font-semibold shadow-md">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{connectionError}</span>
          </div>
        </div>
      )}

      {/* Material 3 Debug Alert Banner for Unmatched / Ambiguous Branch Strings */}
      {debugUnmatchedBranches.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 w-full">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-200/80 text-amber-900 rounded-2xl shrink-0 mt-0.5">
                  <Bug className="w-5 h-5 text-amber-900" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-amber-950 text-sm md:text-base">
                      Log Debug: Karakter & Spasi Cabang Lomba Perlu Diperiksa
                    </h3>
                    <span className="bg-amber-200 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {debugUnmatchedBranches.length} data
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/80 mt-0.5">
                    String nama cabang di bawah tidak cocok secara langsung dengan kata kunci dan dialihkan ke cabang default. Periksa rincian kode karakter dan adanya Non-Breaking Space (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">\u00A0</code> / 160).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => {
                    const text = JSON.stringify(debugUnmatchedBranches, null, 2);
                    navigator.clipboard.writeText(text);
                    setCopiedDebugId('all');
                    setTimeout(() => setCopiedDebugId(null), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-xl text-xs font-semibold transition-colors"
                >
                  {copiedDebugId === 'all' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Log JSON</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsDebugPanelExpanded(!isDebugPanelExpanded)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-200/60 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-semibold transition-colors"
                >
                  {isDebugPanelExpanded ? (
                    <>
                      <span>Sembunyikan</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Lihat Rincian</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDebugUnmatchedBranches([])}
                  className="p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-200/60 rounded-xl transition-colors"
                  title="Bersihkan Log Debug"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Detailed Table */}
            {isDebugPanelExpanded && (
              <div className="mt-4 pt-4 border-t border-amber-200 space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white rounded-2xl overflow-hidden border border-amber-200 shadow-xs">
                    <thead className="bg-amber-100/70 text-amber-950 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Waktu</th>
                        <th className="py-2.5 px-3">String Mentah (Raw)</th>
                        <th className="py-2.5 px-3">Panjang</th>
                        <th className="py-2.5 px-3">Anomali Spasi</th>
                        <th className="py-2.5 px-3">Kode Karakter (ASCII & Hex)</th>
                        <th className="py-2.5 px-3">Dialihkan Ke</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {debugUnmatchedBranches.map((item) => (
                        <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {item.timestamp}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-rose-900 bg-rose-50/40">
                            "{item.rawString}"
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-mono whitespace-nowrap">
                            {item.length} char
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {item.hasSpecialWhitespace ? (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                {item.specialCharsFound.join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Spasi Normal</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 max-w-xs truncate" title={item.charCodesSummary}>
                            {item.charCodesSummary}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              {CABANG_LOMBA_LIST.find((c) => c.id === item.matchedAs)?.nama || item.matchedAs}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-[11px] text-amber-900/70 pt-1">
                  <span>💡 Tips: Sistem kini telah menyaring Non-Breaking Space (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">\u00A0</code> / 160) dan sinonim Menyanyi Nyanyian Rakyat secara otomatis.</span>
                  <button
                    onClick={() => setDebugUnmatchedBranches([])}
                    className="text-amber-900 underline hover:text-amber-950 font-semibold"
                  >
                    Bersihkan Daftar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            pesertaList={pesertaList}
            onSelectPesertaForScoring={handleSelectPesertaForScoring}
            onOpenReport={() => setIsReportModalOpen(true)}
            selectedJenjang={selectedJenjang}
            setSelectedJenjang={setSelectedJenjang}
            selectedCabangId={selectedCabangId}
            setSelectedCabangId={setSelectedCabangId}
            onSyncSpreadsheet={handleQuickSync}
            isSyncing={isConnecting}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            recentlyUpdatedPesertaIds={recentlyUpdatedPesertaIds}
            isAutoRefreshEnabled={isAutoRefreshEnabled}
            onToggleAutoRefresh={() => setIsAutoRefreshEnabled((prev) => !prev)}
            onNavigateToUndian={() => setActiveTab('undian')}
          />
        )}

        {activeTab === 'peserta' && (
          <ParticipantRosterView
            pesertaList={pesertaList}
            onSelectPesertaForScoring={(p) => handleSelectPesertaForScoring(p.id)}
            onSyncSpreadsheet={handleQuickSync}
            isSyncing={isConnecting}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            isConnectedGas={isConnectedGas}
            lastSyncTime={lastSyncTime}
            onAddPeserta={handleAddPeserta}
            onUpdatePesertaCabang={handleUpdatePesertaCabang}
          />
        )}

        {activeTab === 'undian' && (
          <UndianUrutanTampilView
            pesertaList={pesertaList}
            onApplyUndianToPeserta={handleApplyUndianToPeserta}
            selectedJenjang={selectedJenjang}
            setSelectedJenjang={setSelectedJenjang}
            selectedCabangId={selectedCabangId}
            setSelectedCabangId={setSelectedCabangId}
          />
        )}

        {activeTab === 'scoring' && (
          <JuryScoringView
            pesertaList={pesertaList}
            activePesertaId={activePesertaId}
            setActivePesertaId={setActivePesertaId}
            onSaveScore={handleSaveScore}
            selectedJenjang={selectedJenjang}
            setSelectedJenjang={setSelectedJenjang}
            selectedCabangId={selectedCabangId}
            setSelectedCabangId={setSelectedCabangId}
            isSavingRemote={isSavingRemote}
            onSyncSpreadsheet={handleQuickSync}
            isSyncing={isConnecting}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationPortal
            onAddPeserta={handleAddPeserta}
            onAutoGradeAll={handleAutoGradeAll}
            onResetData={handleResetData}
            pesertaCount={pesertaList.length}
          />
        )}

        {activeTab === 'gas_code' && (
          <GasCodeHub
            webAppUrl={webAppUrl}
            setWebAppUrl={setWebAppUrl}
            onTestConnection={syncFromGas}
            isConnecting={isConnecting}
            isConnected={isConnectedGas}
            connectionError={connectionError}
            lastSyncTime={lastSyncTime}
          />
        )}

        {activeTab === 'guide' && <InstallationGuide />}
      </main>

      {/* Sync Management Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        webAppUrl={webAppUrl}
        setWebAppUrl={setWebAppUrl}
        onSyncGas={syncFromGas}
        onSyncDirectSheet={syncFromDirectSheet}
        isSyncing={isConnecting}
        syncError={connectionError}
        syncSuccessMessage={syncSuccessMessage}
        lastSyncTime={lastSyncTime}
        isConnected={isConnectedGas}
        pesertaList={pesertaList}
      />

      {/* Official Printable Report Modal */}
      <OfficialReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        pesertaList={pesertaList}
        selectedJenjang={selectedJenjang}
        selectedCabangId={selectedCabangId}
      />

      {/* Material 3 Footer */}
      <footer className="mt-12 border-t border-[#e0e3e5] bg-white py-6 px-4 lg:px-8 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#50606e]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#191c1e]">
              Festival Tunas Bahasa Ibu (FTBI)
            </span>
            <span aria-hidden="true">·</span>
            <span>Sistem Penilaian 3 Dewan Juri & Papan Peringkat Otomatis</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span>Standar Google Material 3</span>
            <span aria-hidden="true">·</span>
            <span>Google Apps Script V8 Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
