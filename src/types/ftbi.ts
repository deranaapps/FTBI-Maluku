export type Jenjang = 'SD' | 'SMP';
export type KategoriGender = 'Putra' | 'Putri' | 'Campuran';
export type JuryId = 'Juri 1' | 'Juri 2' | 'Juri 3';

export interface KriteriaPenilaian {
  id: string;
  nama: string;
  bobot: number; // percentage (e.g. 30)
  deskripsi: string;
  minScore?: number;
  maxScore?: number;
}

export interface CabangLomba {
  id: string;
  nama: string;
  namaSunda: string;
  deskripsi: string;
  jenjang: Jenjang[];
  kriteria: KriteriaPenilaian[];
}

export interface NilaiKriteria {
  kriteriaId: string;
  skor: number; // 0 - 100
}

export interface NilaiJuriItem {
  juryId: JuryId;
  juryName: string;
  kriteriaScores: Record<string, number>;
  totalWeightedScore: number;
  catatan?: string;
  timestamp: string;
}

export interface PesertaFTBI {
  id: string;
  noUndian: string;
  nama: string;
  nisn?: string;
  asalSekolah: string;
  kecamatanKabupaten: string;
  jenjang: Jenjang;
  cabangLombaId: string;
  kategoriGender: KategoriGender;
  timestampPendaftaran: string;
  
  // Nilai 3 Juri
  nilaiJuri1?: NilaiJuriItem;
  nilaiJuri2?: NilaiJuriItem;
  nilaiJuri3?: NilaiJuriItem;
  
  // Rekapitulasi
  totalNilai: number; // Sum of 3 juries
  rataRataNilai: number; // total / 3 (or count of active juries)
  peringkat?: number;
  predikat?: 'Juara 1' | 'Juara 2' | 'Juara 3' | 'Harapan 1' | 'Harapan 2' | 'Harapan 3' | 'Peserta';
  statusVerifikasi: 'Belum Dinilai' | 'Sebagian' | 'Selesai' | 'Diverifikasi';
}

export interface GasConfig {
  webAppUrl: string;
  spreadsheetId: string;
  spreadsheetName: string;
  lastSyncTime?: string;
  isConnected: boolean;
}

export interface UndianSekolahItem {
  nomorUndian: number; // 1 - 19
  asalSekolah: string;
  waktuUndi?: string;
  pesertaCount?: number;
  pesertaNames?: string[];
}

export interface UndianStateMap {
  // key: `${jenjang}_${cabangLombaId}` (e.g. 'SD_menyanyi')
  [key: string]: UndianSekolahItem[];
}
