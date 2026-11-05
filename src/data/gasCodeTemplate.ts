/**
 * Google Apps Script (GAS) Backend Template
 * Sistem Penilaian Otomatis & Leaderboard Festival Tunas Bahasa Ibu (FTBI)
 * Sesuai Dokumen Resmi Kriteria Penilaian Kabupaten Seram Bagian Barat / Kota Tual (PDF)
 */

export const GAS_CODE_GS = `/**
 * ==============================================================================
 * SISTEM PENILAIAN OTOMATIS & LEADERBOARD FESTIVAL TUNAS BAHASA IBU (FTBI)
 * Google Apps Script (GAS) Backend Engine
 * Kriteria Penilaian Resmi Berdasarkan Dokumen PDF:
 * 1. Lomba Berpidato (7 Aspek)
 * 2. Lomba Menulis dan Membaca Puisi (8 Aspek: 4 Menulis + 4 Membaca)
 * 3. Lomba Menulis Cerpen (7 Aspek)
 * 4. Lomba Mendongeng (6 Aspek)
 * 5. Lomba Menyanyi (5 Aspek)
 * 6. Lomba Lawakan Tunggal / Stand Up Comedy (6 Aspek)
 *
 * Rentang Nilai: 50 (Kurang), 60 (Cukup), 70 (Baik), 80 (Sangat Baik)
 * Total Skor Juri = Penjumlahan Skor Seluruh Aspek
 * TOTAL NILAI AKHIR = Nilai JURI I + Nilai JURI II + Nilai JURI III
 * ==============================================================================
 */

var FTBI_CONFIG = {
  branches: [
    {
      id: "berpidato",
      sheetPrefix: "Pidato",
      nama: "Lomba Berpidato",
      aspectCount: 7,
      kriteria: [
        "1. Orisinalitas (Karya sendiri/orisinal)",
        "2. Tema (Kesesuaian tema dengan judul dan isi)",
        "3. Kemampuan Vokal (Artikulasi, intonasi, tempo, dinamika)",
        "4. Kemampuan Penghayatan & Penjiwaan (Emosi/ekspresi wajah)",
        "5. Diksi (Pilihan kata sesuai konteks)",
        "6. Struktur Teks Pidato (Pembukaan, isi, penutup)",
        "7. Penampilan (Penguasaan panggung, gaya berbicara, gestur)"
      ]
    },
    {
      id: "menulis_membaca_puisi",
      sheetPrefix: "Puisi",
      nama: "Lomba Menulis dan Membaca Puisi",
      aspectCount: 8,
      kriteria: [
        "Menulis: 1. Orisinalitas (Karya sendiri/orisinal)",
        "Menulis: 2. Tema (Kesesuaian tema dengan puisi)",
        "Menulis: 3. Diksi dan Gaya Bahasa (Variasi kata dan majas)",
        "Menulis: 4. Rima (Ketepatan dan pola teratur rima)",
        "Membaca: 1. Vokal (Pelafalan, artikulasi, tempo, dinamika)",
        "Membaca: 2. Penghayatan & Penjiwaan (Kesesuaian emosi pembaca)",
        "Membaca: 3. Penafsiran (Pemahaman isi puisi kepada pendengar)",
        "Membaca: 4. Penampilan (Penguasaan panggung, mimik, gestur)"
      ]
    },
    {
      id: "menulis_cerpen",
      sheetPrefix: "Cerpen",
      nama: "Cerita Pendek",
      aspectCount: 7,
      kriteria: [
        "1. Orisinalitas (Karya sendiri, bukan saduran/terjemahan)",
        "2. Tema (Kesesuaian tema dengan cerpen)",
        "3. Diksi dan Gaya Bahasa (Variasi kata dan konteks)",
        "4. Alur Cerita (Alur menarik dan mengejutkan pembaca)",
        "5. Dialog (Memuat dialog dalam cerita)",
        "6. Konflik (Konflik mengejutkan pemikat cerita)",
        "7. Unsur Intrinsik (Tema, alur, latar, tokoh, watak, sudut pandang)"
      ]
    },
    {
      id: "mendongeng",
      sheetPrefix: "Mendongeng",
      nama: "Lomba Mendongeng",
      aspectCount: 6,
      kriteria: [
        "1. Kemampuan Vokal (Artikulasi, tempo, dinamika)",
        "2. Kemampuan Penghayatan & Penjiwaan (Ekspresi/mimik wajah)",
        "3. Diksi dan Gaya Bahasa (Kesesuaian alur dan gaya bahasa)",
        "4. Alur Cerita (Alur runut memudahkan pemahaman dongeng)",
        "5. Penafsiran (Pemahaman isi dongeng)",
        "6. Penampilan (Penguasaan panggung dan gestur)"
      ]
    },
    {
      id: "menyanyi",
      sheetPrefix: "Menyanyi",
      nama: "Menyanyi Nyanyian Rakyat",
      aspectCount: 5,
      kriteria: [
        "1. Teknik Vokal (Artikulasi, tempo, dinamika saat bernyanyi)",
        "2. Penghayatan & Penjiwaan (Kesesuaian lirik dengan penjiwaan)",
        "3. Materi Suara (Karakter vokal, merdu, dan indah didengar)",
        "4. Penafsiran (Pemahaman makna nyanyian kepada pendengar)",
        "5. Penampilan (Penguasaan panggung, mimik wajah, dan gestur)"
      ]
    },
    {
      id: "stand_up_comedy",
      sheetPrefix: "StandUp",
      nama: "Lawakan Tunggal",
      aspectCount: 6,
      kriteria: [
        "1. Orisinalitas (Karya sendiri/orisinal)",
        "2. Materi Lawakan (Lucu, bebas SARA, kekerasan, pornografi)",
        "3. Teknik (Sistematis: pembuka, isi, penutup)",
        "4. Penghayatan & Penjiwaan (Kesesuaian judul dan isi lawakan)",
        "5. Penafsiran (Penyampaian menimbulkan tawa penonton)",
        "6. Penampilan (Penguasaan panggung, mimik wajah, dan gestur)"
      ]
    }
  ],
  levels: ["SD", "SMP"],
  formSheetName: "Form Responses 1",
  rekapSheetName: "LEADERBOARD_REKAP"
};

/**
 * 1. Menu Khusus Spreadsheet saat Dibuka (onOpen)
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🎯 Sistem Penilaian FTBI")
    .addItem("1. Siapkan Seluruh Sheet Lomba (SD & SMP)", "setupFTBISpreadsheet")
    .addItem("2. Sinkronkan dari Form Responses 1", "syncFormResponses")
    .addItem("3. Hitung Leaderboard & Tentukan Juara", "calculateLeaderboard")
    .addItem("4. Perbaiki Peserta Cerita Pendek (Pindah dari Pidato ke Cerpen)", "repairMisplacedCerpenParticipants")
    .addSeparator()
    .addItem("ℹ️ Info Koneksi & Petunjuk Web App", "showWebAppUrlInfo")
    .addToUi();
}

/**
 * 2. Setup Otomatis Template Sheet Lomba Sesuai PDF
 */
function setupFTBISpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Buat Sheet Form Responses 1 jika belum ada
  var formSheet = ss.getSheetByName(FTBI_CONFIG.formSheetName);
  if (!formSheet) {
    formSheet = ss.insertSheet(FTBI_CONFIG.formSheetName, 0);
    var formHeaders = [
      "Timestamp",
      "Nomor Undian",
      "Nama Lengkap Peserta",
      "NISN",
      "Asal Sekolah",
      "Kecamatan / Kabupaten",
      "Jenjang (SD/SMP)",
      "Cabang Lomba",
      "Kategori (Putra/Putri)",
      "Nomor WhatsApp Pembimbing"
    ];
    formSheet.getRange(1, 1, 1, formHeaders.length).setValues([formHeaders]);
    formatHeaderRow(formSheet, formHeaders.length, "#006495");
  }

  // Buat Sheet LEADERBOARD_REKAP (Rekapitulasi Dewan Juri)
  var rekapSheet = ss.getSheetByName(FTBI_CONFIG.rekapSheetName);
  if (!rekapSheet) {
    rekapSheet = ss.insertSheet(FTBI_CONFIG.rekapSheetName);
  }
  rekapSheet.clear();
  var rekapHeaders = [
    "No", "Jenjang", "Cabang Lomba", "Peringkat", "Predikat", 
    "No Undian", "Nama Peserta", "Asal Sekolah", "Kecamatan/Kab", 
    "Nilai JURI I", "Nilai JURI II", "Nilai JURI III", "TOTAL NILAI", "RATA-RATA"
  ];
  rekapSheet.getRange(1, 1, 1, rekapHeaders.length).setValues([rekapHeaders]);
  formatHeaderRow(rekapSheet, rekapHeaders.length, "#004881");

  // Buat Sheet untuk setiap Cabang & Jenjang (SD & SMP)
  FTBI_CONFIG.levels.forEach(function(lvl) {
    FTBI_CONFIG.branches.forEach(function(branch) {
      var sheetName = lvl + "_" + branch.sheetPrefix;
      var branchSheet = ss.getSheetByName(sheetName);
      if (!branchSheet) {
        branchSheet = ss.insertSheet(sheetName);
      }
      branchSheet.clear();

      // Susun Kolom: Identitas, JURI I (Aspek 1..N + Total), JURI II, JURI III, Rekap Akhir
      var headers = [
        "No", "No Undian", "Nama Peserta", "NISN", "Asal Sekolah", "Kecamatan/Kab", "Kategori (Pa/Pi)",
        "JURI I", "JURI II", "JURI III",
        "TOTAL NILAI", "RATA-RATA", "PERINGKAT", "PREDIKAT", "STATUS VERIFIKASI", "CATATAN DEWAN JURI"
      ];

      branchSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeaderRow(branchSheet, headers.length, "#006495");
      branchSheet.setFrozenRows(1);
      branchSheet.setFrozenColumns(3);
    });
  });

  SpreadsheetApp.getUi().alert("✅ Template Sukses Disiapkan!", "Seluruh sheet cabang lomba SD & SMP sesuai format PDF resmi berhasil dibuat.", SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Helper: Mencari Sheet Respons Google Form Secara Dinamis
 * Mendukung berbagai penamaan: "Form Responses 1", "Respon Formulir 1", "Jawaban Formulir 1", dll.
 */
function findFormResponsesSheet(ss) {
  var candidateNames = [
    FTBI_CONFIG.formSheetName,
    "Form Responses 1",
    "Respon Formulir 1",
    "Jawaban Formulir 1",
    "Form Responses",
    "Respon Formulir",
    "Data Pendaftaran",
    "Pendaftaran",
    "Peserta"
  ];

  for (var i = 0; i < candidateNames.length; i++) {
    var sheet = ss.getSheetByName(candidateNames[i]);
    if (sheet) return sheet;
  }

  // Cari sheet yang memiliki kata kunci 'form', 'respon', 'jawaban', atau 'daftar'
  var allSheets = ss.getSheets();
  for (var j = 0; j < allSheets.length; j++) {
    var name = allSheets[j].getName().toLowerCase();
    if (name.indexOf("form") !== -1 || name.indexOf("respon") !== -1 || 
        name.indexOf("jawaban") !== -1 || name.indexOf("daftar") !== -1) {
      return allSheets[j];
    }
  }

  // Fallback: Jika ada sheet pertama yang bukan sheet cabang lomba (SD_ atau SMP_)
  if (allSheets.length > 0 && !allSheets[0].getName().match(/^(SD|SMP)_/)) {
    return allSheets[0];
  }

  return null;
}

/**
 * Helper: Mencari Sheet Cabang Lomba Secara Fleksibel
 * Mendukung variasi penamaan seperti: "SD_Menyanyi Nyanyian Rakyat", "SD_Nyanyian Rakyat", "SD_Menyanyi", dll.
 */
function findBranchSheetFlexibly(ss, lvl, br) {
  var exactName = lvl + "_" + br.sheetPrefix;
  var sheet = ss.getSheetByName(exactName);
  if (sheet) return sheet;

  var candidateNames = [
    lvl + "_" + br.nama,
    lvl + " " + br.nama,
    lvl + "_" + br.sheetPrefix,
    lvl + " " + br.sheetPrefix,
    br.nama + " (" + lvl + ")",
    br.nama + " " + lvl,
    br.sheetPrefix + " (" + lvl + ")",
    br.sheetPrefix + " " + lvl
  ];

  if (br.id === "menyanyi") {
    candidateNames.push(
      lvl + "_Menyanyi Nyanyian Rakyat",
      lvl + "_Nyanyian Rakyat",
      lvl + " Menyanyi Nyanyian Rakyat",
      "Menyanyi Nyanyian Rakyat (" + lvl + ")",
      "Nyanyian Rakyat (" + lvl + ")",
      lvl + "_Menyanyi",
      lvl + "_Lagu Daerah"
    );
  } else if (br.id === "menulis_cerpen") {
    candidateNames.push(
      lvl + "_Cerita Pendek",
      lvl + "_Cerpen",
      lvl + " Cerita Pendek",
      "Cerita Pendek (" + lvl + ")"
    );
  }

  for (var i = 0; i < candidateNames.length; i++) {
    var s = ss.getSheetByName(candidateNames[i]);
    if (s) return s;
  }

  // Jika belum ditemukan, scan seluruh sheet mencari kecocokan nama
  var allSheets = ss.getSheets();
  for (var j = 0; j < allSheets.length; j++) {
    var sName = allSheets[j].getName().toLowerCase();
    var hasLvl = sName.indexOf(lvl.toLowerCase()) !== -1;
    var hasBranch = sName.indexOf(br.sheetPrefix.toLowerCase()) !== -1 || sName.indexOf(br.nama.toLowerCase()) !== -1;
    if (br.id === "menyanyi") {
      hasBranch = hasBranch || sName.indexOf("nyanyi") !== -1 || sName.indexOf("rakyat") !== -1 || sName.indexOf("vokal") !== -1;
    }
    if (hasLvl && hasBranch) {
      return allSheets[j];
    }
  }

  return null;
}

/**
 * Helper: Deteksi Indeks Kolom Google Form Berdasarkan Header Teks
 * Mengakomodasi formulir yang punya atau tidak punya pertanyaan Nomor Undian
 */
function getFormColumnMapping(headers) {
  var mapping = {
    timestamp: 0,
    noUndian: -1,
    nama: -1,
    nisn: -1,
    sekolah: -1,
    kecKab: -1,
    jenjang: -1,
    cabang: -1,
    kategori: -1,
    whatsapp: -1
  };

  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || "").toLowerCase().trim();
    if (!h) continue;

    if (h.indexOf("waktu") !== -1 || h.indexOf("timestamp") !== -1) mapping.timestamp = c;
    else if (h.indexOf("undian") !== -1 || h.indexOf("nomor urut") !== -1 || h.indexOf("no urut") !== -1) mapping.noUndian = c;
    else if (h.indexOf("nama") !== -1 && mapping.nama === -1) mapping.nama = c;
    else if (h.indexOf("nisn") !== -1 || h.indexOf("induk") !== -1) mapping.nisn = c;
    else if (h.indexOf("sekolah") !== -1 || h.indexOf("instansi") !== -1 || h.indexOf("madrasah") !== -1) mapping.sekolah = c;
    else if (h.indexOf("kecamatan") !== -1 || h.indexOf("kabupaten") !== -1 || h.indexOf("kota") !== -1 || h.indexOf("daerah") !== -1 || h.indexOf("wilayah") !== -1) mapping.kecKab = c;
    else if (h.indexOf("jenjang") !== -1 || h.indexOf("tingkat") !== -1 || h.indexOf("kelas") !== -1) mapping.jenjang = c;
    else if (
      (h.indexOf("cabang") !== -1 || h.indexOf("mata lomba") !== -1 || h.indexOf("jenis lomba") !== -1 || h.indexOf("pilihan lomba") !== -1 || (h.indexOf("lomba") !== -1 && h.indexOf("jenjang") === -1 && h.indexOf("kategori") === -1 && h.indexOf("gender") === -1))
    ) mapping.cabang = c;
    else if (h.indexOf("gender") !== -1 || h.indexOf("kategori") !== -1 || h.indexOf("kelamin") !== -1 || h.indexOf("putra") !== -1) mapping.kategori = c;
    else if (h.indexOf("wa") !== -1 || h.indexOf("telepon") !== -1 || h.indexOf("hp") !== -1 || h.indexOf("kontak") !== -1) mapping.whatsapp = c;
  }

  // Fallback standar posisi kolom jika header tidak terdeteksi
  if (mapping.nama === -1) {
    if (mapping.noUndian !== -1) {
      mapping.nama = 2; mapping.nisn = 3; mapping.sekolah = 4; mapping.kecKab = 5;
      mapping.jenjang = 6; mapping.cabang = 7; mapping.kategori = 8;
    } else {
      // Standar Google Form tanpa input undian: A: Time, B: Nama, C: NISN, D: Sekolah, E: Wilayah, F: Jenjang, G: Cabang, H: Kategori
      mapping.nama = 1; mapping.nisn = 2; mapping.sekolah = 3; mapping.kecKab = 4;
      mapping.jenjang = 5; mapping.cabang = 6; mapping.kategori = 7;
    }
  }

  return mapping;
}

/**
 * Helper: Deteksi Cabang Lomba Secara Akurat & Luas
 * Memastikan peserta "Menyanyi Nyanyian Rakyat" dan "Cerita Pendek" terdeteksi secara akurat
 */
function detectBranchFromInput(cabangInput, rowValues) {
  var s = String(cabangInput || "")
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    .toLowerCase()
    .trim();

  // 1. Menyanyi Nyanyian Rakyat (Mencakup berbagai variasi istilah & penulisan)
  if (
    s.indexOf("nyanyi") !== -1 ||
    s.indexOf("rakyat") !== -1 ||
    s.indexOf("lagu") !== -1 ||
    s.indexOf("vokal") !== -1 ||
    s.indexOf("vocal") !== -1 ||
    s.indexOf("tembang") !== -1 ||
    s.indexOf("pupuh") !== -1 ||
    s.indexOf("sekar") !== -1 ||
    s.indexOf("kawih") !== -1 ||
    s.indexOf("singing") !== -1 ||
    s.indexOf("song") !== -1 ||
    s.indexOf("suara") !== -1
  ) {
    return FTBI_CONFIG.branches.find(function(b) { return b.id === "menyanyi"; });
  }

  // 2. Cerita Pendek (Menulis Cerpen)
  if (s.indexOf("cerita") !== -1 || s.indexOf("pendek") !== -1 || s.indexOf("cerpen") !== -1 || s.indexOf("carpon") !== -1) {
    return FTBI_CONFIG.branches.find(function(b) { return b.id === "menulis_cerpen"; });
  }

  // 3. Puisi (Menulis dan Membaca Puisi)
  if (s.indexOf("puisi") !== -1 || s.indexOf("sajak") !== -1) {
    return FTBI_CONFIG.branches.find(function(b) { return b.id === "menulis_membaca_puisi"; });
  }

  // 4. Mendongeng
  if (s.indexOf("dongeng") !== -1 || s.indexOf("ngedongeng") !== -1) {
    return FTBI_CONFIG.branches.find(function(b) { return b.id === "mendongeng"; });
  }

  // 5. Lawakan Tunggal (Stand Up Comedy)
  if (s.indexOf("stand") !== -1 || s.indexOf("comedy") !== -1 || s.indexOf("komedi") !== -1 || s.indexOf("lawak") !== -1 || s.indexOf("tunggal") !== -1 || s.indexOf("borangan") !== -1) {
    return FTBI_CONFIG.branches.find(function(b) { return b.id === "stand_up_comedy"; });
  }

  // 6. Berpidato (Biantara)
  if (s.indexOf("pidato") !== -1 || s.indexOf("biantara") !== -1) {
    return FTBI_CONFIG.branches.find(function(b) { return b.id === "berpidato"; });
  }

  // JIKA kolom cabang kosong atau tidak cocok, PINDAI SELURUH NILAI DALAM BARIS
  if (rowValues && rowValues.length) {
    var allRowText = rowValues
      .map(function(v) { return String(v || ""); })
      .join(" ")
      .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
      .toLowerCase();

    if (
      allRowText.indexOf("nyanyi") !== -1 ||
      allRowText.indexOf("rakyat") !== -1 ||
      allRowText.indexOf("lagu") !== -1 ||
      allRowText.indexOf("vokal") !== -1 ||
      allRowText.indexOf("vocal") !== -1 ||
      allRowText.indexOf("tembang") !== -1 ||
      allRowText.indexOf("pupuh") !== -1 ||
      allRowText.indexOf("suara") !== -1
    ) {
      return FTBI_CONFIG.branches.find(function(b) { return b.id === "menyanyi"; });
    }
    if (allRowText.indexOf("cerita") !== -1 || allRowText.indexOf("pendek") !== -1 || allRowText.indexOf("cerpen") !== -1 || allRowText.indexOf("carpon") !== -1) {
      return FTBI_CONFIG.branches.find(function(b) { return b.id === "menulis_cerpen"; });
    }
    if (allRowText.indexOf("puisi") !== -1 || allRowText.indexOf("sajak") !== -1) {
      return FTBI_CONFIG.branches.find(function(b) { return b.id === "menulis_membaca_puisi"; });
    }
    if (allRowText.indexOf("dongeng") !== -1 || allRowText.indexOf("ngedongeng") !== -1) {
      return FTBI_CONFIG.branches.find(function(b) { return b.id === "mendongeng"; });
    }
    if (allRowText.indexOf("lawak") !== -1 || allRowText.indexOf("stand up") !== -1 || allRowText.indexOf("komedi") !== -1 || allRowText.indexOf("borangan") !== -1) {
      return FTBI_CONFIG.branches.find(function(b) { return b.id === "stand_up_comedy"; });
    }
    if (allRowText.indexOf("pidato") !== -1 || allRowText.indexOf("biantara") !== -1) {
      return FTBI_CONFIG.branches.find(function(b) { return b.id === "berpidato"; });
    }
  }

  return FTBI_CONFIG.branches[0];
}

/**
 * 3. Sinkronkan Data dari Google Form (Form Responses 1) ke Sheet Lomba
 */
function syncFormResponses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var formSheet = findFormResponsesSheet(ss);
  if (!formSheet) {
    Logger.log("Sheet Form Responses tidak ditemukan di spreadsheet.");
    return { status: "warning", message: "Sheet respon form belum ditemukan", count: 0 };
  }

  var data = formSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { status: "success", message: "Belum ada respon peserta yang masuk", count: 0 };
  }

  var mapping = getFormColumnMapping(data[0]);
  var addedCount = 0;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var nama = mapping.nama !== -1 && row[mapping.nama] ? String(row[mapping.nama]).trim() : "";
    if (!nama) continue;

    var noUndian = mapping.noUndian !== -1 && row[mapping.noUndian] ? String(row[mapping.noUndian]).trim() : "";
    var nisn = mapping.nisn !== -1 && row[mapping.nisn] ? String(row[mapping.nisn]).trim() : "";
    var sekolah = mapping.sekolah !== -1 && row[mapping.sekolah] ? String(row[mapping.sekolah]).trim() : "-";
    var kecKab = mapping.kecKab !== -1 && row[mapping.kecKab] ? String(row[mapping.kecKab]).trim() : "Kota Tual / Seram Bagian Barat";
    var jenjangRaw = mapping.jenjang !== -1 && row[mapping.jenjang] ? String(row[mapping.jenjang]).trim().toUpperCase() : "SD";
    var jenjang = jenjangRaw.indexOf("SMP") !== -1 ? "SMP" : "SD";
    var cabangInput = mapping.cabang !== -1 && row[mapping.cabang] ? String(row[mapping.cabang]).trim() : "";
    var kategori = mapping.kategori !== -1 && row[mapping.kategori] ? String(row[mapping.kategori]).trim() : "Putra";

    // Cari cabang lomba yang cocok menggunakan deteksi akurat
    var matchedBranch = detectBranchFromInput(cabangInput, row);

    // PENCEGAHAN & PERBAIKAN: Jika cabang sebenarnya bukan Berpidato (misal Cerita Pendek),
    // hapus dari sheet Pidato jika sebelumnya pernah salah dimasukkan ke sana
    if (matchedBranch.id !== "berpidato") {
      var wrongPidatoSheet = ss.getSheetByName(jenjang + "_Pidato");
      if (wrongPidatoSheet) {
        var wrongData = wrongPidatoSheet.getDataRange().getValues();
        for (var w = wrongData.length - 1; w >= 1; w--) {
          if (String(wrongData[w][2]).toLowerCase() === nama.toLowerCase() &&
              String(wrongData[w][4]).toLowerCase() === sekolah.toLowerCase()) {
            wrongPidatoSheet.deleteRow(w + 1);
            Logger.log("Memperbaiki: Peserta " + nama + " dipindahkan dari Pidato ke " + matchedBranch.nama);
            break;
          }
        }
      }
    }

    var targetSheetName = jenjang + "_" + matchedBranch.sheetPrefix;
    var targetSheet = ss.getSheetByName(targetSheetName);

    // Jika sheet cabang belum ada, buat otomatis
    if (!targetSheet) {
      targetSheet = ss.insertSheet(targetSheetName);
      var headers = [
        "No", "No Undian", "Nama Peserta", "NISN", "Asal Sekolah", "Kecamatan/Kab", "Kategori (Pa/Pi)",
        "JURI I", "JURI II", "JURI III",
        "TOTAL NILAI", "RATA-RATA", "PERINGKAT", "PREDIKAT", "STATUS VERIFIKASI", "CATATAN DEWAN JURI"
      ];
      targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeaderRow(targetSheet, headers.length, "#006495");
      targetSheet.setFrozenRows(1);
      targetSheet.setFrozenColumns(3);
    }

    // Cek duplikasi di sheet cabang tujuan
    var targetData = targetSheet.getDataRange().getValues();
    var alreadyExists = false;
    for (var j = 1; j < targetData.length; j++) {
      if (String(targetData[j][2]).toLowerCase() === nama.toLowerCase() &&
          String(targetData[j][4]).toLowerCase() === sekolah.toLowerCase()) {
        alreadyExists = true;
        break;
      }
    }

    if (!alreadyExists) {
      var nextRow = targetSheet.getLastRow() + 1;
      var participantIndex = nextRow - 1;
      var autoUndian = noUndian || (participantIndex < 10 ? "0" + participantIndex : String(participantIndex));

      // Jika di sheet form ada kolom nomor undian tapi masih kosong, isi nomor undian otomatis
      if (mapping.noUndian !== -1 && !row[mapping.noUndian]) {
        formSheet.getRange(i + 1, mapping.noUndian + 1).setValue(autoUndian);
      }

      // Rumus TOTAL NILAI (Kolom K) = Juri I (H) + Juri II (I) + Juri III (J)
      var f_total = "=SUM(H" + nextRow + ":J" + nextRow + ")";
      var f_avg = "=ROUND(K" + nextRow + " / 3, 2)";

      var newRow = [
        participantIndex, autoUndian, nama, nisn, sekolah, kecKab, kategori,
        0, 0, 0, // Nilai Juri I, II, III
        f_total, f_avg, "", "", "Belum Dinilai", ""
      ];

      targetSheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
      addedCount++;
    }
  }

  calculateLeaderboard();
  Logger.log("Sinkronisasi Form Selesai. Peserta Baru: " + addedCount);
  return { status: "success", count: addedCount, message: "Berhasil mensinkronkan " + addedCount + " peserta baru." };
}

/**
 * 4. Trigger Otomatis saat Form Google Masuk
 */
function onFormSubmit(e) {
  try {
    syncFormResponses();
  } catch (err) {
    Logger.log("Error onFormSubmit: " + err.toString());
  }
}

/**
 * 5. Hitung Papan Peringkat (Pemenang I, II, III & Harapan) Sesuai PDF
 */
function calculateLeaderboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rekapSheet = ss.getSheetByName(FTBI_CONFIG.rekapSheetName);
  if (!rekapSheet) return;

  var allWinners = [];

  FTBI_CONFIG.levels.forEach(function(lvl) {
    FTBI_CONFIG.branches.forEach(function(branch) {
      var sheetName = lvl + "_" + branch.sheetPrefix;
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) return;

      var range = sheet.getRange(2, 1, lastRow - 1, 16);
      var values = range.getValues();

      // Urutkan nilai peserta: Total Skor Descending
      // Tie-breaker sesuai aturan: Nilai Juri I (Ketua Dewan Juri)
      values.sort(function(a, b) {
        var totalA = Number(a[10]) || 0;
        var totalB = Number(b[10]) || 0;
        if (totalB !== totalA) return totalB - totalA;

        var j1A = Number(a[7]) || 0;
        var j1B = Number(b[7]) || 0;
        return j1B - j1A;
      });

      // Tetapkan Predikat Pemenang Sesuai Lembar Rekap PDF
      for (var idx = 0; idx < values.length; idx++) {
        var rank = idx + 1;
        var predikat = "Peserta";
        if (rank === 1) predikat = "Pemenang I";
        else if (rank === 2) predikat = "Pemenang II";
        else if (rank === 3) predikat = "Pemenang III";
        else if (rank === 4) predikat = "Juara Harapan I";
        else if (rank === 5) predikat = "Juara Harapan II";
        else if (rank === 6) predikat = "Juara Harapan III";

        values[idx][12] = rank;     // Kolom PERINGKAT
        values[idx][13] = predikat; // Kolom PREDIKAT

        var j1 = Number(values[idx][7]) > 0;
        var j2 = Number(values[idx][8]) > 0;
        var j3 = Number(values[idx][9]) > 0;
        if (j1 && j2 && j3) {
          values[idx][14] = "Diverifikasi";
        } else if (j1 || j2 || j3) {
          values[idx][14] = "Sebagian";
        } else {
          values[idx][14] = "Belum Dinilai";
        }

        // Catat 3 Besar Pemenang ke Rekapitulasi
        if (rank <= 6 && (Number(values[idx][10]) > 0)) {
          allWinners.push([
            allWinners.length + 1,
            lvl,
            branch.nama,
            rank,
            predikat,
            values[idx][1], // No Undian
            values[idx][2], // Nama Peserta
            values[idx][4], // Sekolah
            values[idx][5], // Kecamatan/Kab
            values[idx][7], // Juri I
            values[idx][8], // Juri II
            values[idx][9], // Juri III
            values[idx][10], // Total Nilai
            values[idx][11]  // Rata-rata
          ]);
        }
      }

      range.setValues(values);
    });
  });

  // Tulis ke sheet LEADERBOARD_REKAP
  if (rekapSheet.getLastRow() > 1) {
    rekapSheet.getRange(2, 1, rekapSheet.getLastRow() - 1, 14).clearContent();
  }
  if (allWinners.length > 0) {
    rekapSheet.getRange(2, 1, allWinners.length, 14).setValues(allWinners);
  }
}

/**
 * 6. Web App API: HTTP GET (Leaderboard JSON & HTML Web App)
 */
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;

  // Jika diakses langsung via browser tanpa parameter action, tampilkan antarmuka HTML Web App
  if (!action) {
    try {
      return HtmlService.createHtmlOutputFromFile("Index")
        .setTitle("FTBI - Sistem Penilaian & Leaderboard M3")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag("viewport", "width=device-width, initial-scale=1");
    } catch (err) {
      // Fallback jika file Index.html belum dibuat di editor
      action = "getLeaderboard";
    }
  }

  var branch = e && e.parameter && e.parameter.branch;
  var level = (e && e.parameter && e.parameter.level) || "SD";

  if (action === "getAllBranches") {
    return createJsonResponse({ status: "success", data: FTBI_CONFIG.branches });
  }

  // Aksi Sinkronkan Langsung dari Google Form
  if (action === "syncFromForm") {
    var syncResult = syncFormResponses();
    return createJsonResponse(syncResult);
  }

  // Aksi Khusus: Perbaiki Peserta Cerita Pendek yang Salah Masuk ke Sheet Pidato
  if (action === "repairMisplacedCerpen" || action === "repairCerpen") {
    var repairRes = repairMisplacedCerpenParticipants();
    return createJsonResponse(repairRes);
  }

  // Aksi Membaca Leaderboard & Peserta
  if (action === "getLeaderboard" || action === "getParticipants" || action === "sync") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Jalankan auto-sinkronisasi respon form terbaru sebelum data ditarik
    try {
      syncFormResponses();
    } catch (errSync) {
      Logger.log("Auto sync warning: " + errSync.toString());
    }

    var results = [];

    FTBI_CONFIG.levels.forEach(function(lvl) {
      if (level && level !== "all" && lvl !== level) return;

      FTBI_CONFIG.branches.forEach(function(br) {
        if (branch && branch !== "all" && br.id !== branch) return;

        var sheetName = lvl + "_" + br.sheetPrefix;
        var sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
          sheet = findBranchSheetFlexibly(ss, lvl, br);
        }
        if (!sheet) return;

        var data = sheet.getDataRange().getValues();
        if (data.length <= 1) return;

        for (var r = 1; r < data.length; r++) {
          var row = data[r];
          if (!row[2]) continue;

          results.push({
            id: lvl + "_" + br.id + "_" + (row[1] || r),
            noUndian: String(row[1] || (r < 10 ? "0" + r : r)),
            nama: String(row[2]).trim(),
            nisn: String(row[3] || ""),
            asalSekolah: String(row[4] || "-"),
            kecamatanKabupaten: String(row[5] || ""),
            kategoriGender: String(row[6] || "Putra"),
            jenjang: lvl,
            cabangLombaId: br.id,
            cabangLombaNama: br.nama,
            nilaiJuri1: Number(row[7]) || 0,
            nilaiJuri2: Number(row[8]) || 0,
            nilaiJuri3: Number(row[9]) || 0,
            totalNilai: Number(row[10]) || 0,
            rataRataNilai: Number(row[11]) || 0,
            peringkat: Number(row[12]) || 0,
            predikat: row[13] || "Peserta",
            statusVerifikasi: row[14] || "Belum Dinilai",
            catatanJuri: row[15] || ""
          });
        }
      });
    });

    // Fallback: Jika sheet cabang lomba masih kosong, baca langsung dari Form Responses Sheet
    if (results.length === 0) {
      var fSheet = findFormResponsesSheet(ss);
      if (fSheet && fSheet.getLastRow() > 1) {
        var fData = fSheet.getDataRange().getValues();
        var fMap = getFormColumnMapping(fData[0]);

        for (var fr = 1; fr < fData.length; fr++) {
          var fRow = fData[fr];
          var fNama = fMap.nama !== -1 && fRow[fMap.nama] ? String(fRow[fMap.nama]).trim() : "";
          if (!fNama) continue;

          var fJenjangRaw = fMap.jenjang !== -1 && fRow[fMap.jenjang] ? String(fRow[fMap.jenjang]).toUpperCase() : "SD";
          var fJenjang = fJenjangRaw.indexOf("SMP") !== -1 ? "SMP" : "SD";
          var fCabangRaw = fMap.cabang !== -1 && fRow[fMap.cabang] ? String(fRow[fMap.cabang]) : "";

          // Gunakan deteksi akurat berbasis kata kunci cerita pendek
          var fBranch = detectBranchFromInput(fCabangRaw, fRow);

          var fUndian = fMap.noUndian !== -1 && fRow[fMap.noUndian] ? String(fRow[fMap.noUndian]) : (fr < 10 ? "0" + fr : String(fr));

          results.push({
            id: "form_" + fr,
            noUndian: fUndian,
            nama: fNama,
            nisn: fMap.nisn !== -1 && fRow[fMap.nisn] ? String(fRow[fMap.nisn]) : "",
            asalSekolah: fMap.sekolah !== -1 && fRow[fMap.sekolah] ? String(fRow[fMap.sekolah]) : "-",
            kecamatanKabupaten: fMap.kecKab !== -1 && fRow[fMap.kecKab] ? String(fRow[fMap.kecKab]) : "Kota Tual / Seram Bagian Barat",
            kategoriGender: fMap.kategori !== -1 && fRow[fMap.kategori] ? String(fRow[fMap.kategori]) : "Putra",
            jenjang: fJenjang,
            cabangLombaId: fBranch.id,
            cabangLombaNama: fBranch.nama,
            nilaiJuri1: 0,
            nilaiJuri2: 0,
            nilaiJuri3: 0,
            totalNilai: 0,
            rataRataNilai: 0,
            peringkat: fr,
            predikat: "Peserta",
            statusVerifikasi: "Belum Dinilai",
            catatanJuri: ""
          });
        }
      }
    }

    return createJsonResponse({
      status: "success",
      count: results.length,
      updatedAt: new Date().toISOString(),
      data: results
    });
  }

  return createJsonResponse({ status: "error", message: "Aksi tidak dikenali" });
}

/**
 * 7. Web App API: HTTP POST (Input Nilai Juri dari Antarmuka Web)
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    if (action === "syncFromForm" || action === "sync") {
      var syncRes = syncFormResponses();
      return createJsonResponse(syncRes);
    }

    if (action === "repairMisplacedCerpen" || action === "repairCerpen") {
      var repairResPost = repairMisplacedCerpenParticipants();
      return createJsonResponse(repairResPost);
    }

    if (action === "setupSheets") {
      setupFTBISpreadsheet();
      return createJsonResponse({ status: "success", message: "Template sheet berhasil diinisialisasi!" });
    }

    if (action === "submitScore") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var jenjang = payload.jenjang || "SD";
      var cabangId = payload.cabangLombaId;
      var noUndian = String(payload.noUndian);
      var juryId = payload.juryId; // "Juri 1", "Juri 2", "Juri 3"
      var totalScore = Number(payload.totalScore) || 0;
      var catatan = payload.catatan || "";

      var branch = FTBI_CONFIG.branches.find(function(b) { return b.id === cabangId; });
      if (!branch) throw new Error("Cabang lomba tidak valid");

      var sheetName = jenjang + "_" + branch.sheetPrefix;
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) throw new Error("Sheet lomba tidak ditemukan: " + sheetName);

      var data = sheet.getDataRange().getValues();
      var rowIndex = -1;
      for (var r = 1; r < data.length; r++) {
        if (String(data[r][1]) === noUndian) {
          rowIndex = r + 1;
          break;
        }
      }

      if (rowIndex === -1) throw new Error("Nomor undian " + noUndian + " tidak ditemukan");

      // Tentukan Kolom Nilai: JURI I (Kolom H = 8), JURI II (Kolom I = 9), JURI III (Kolom J = 10)
      var targetCol = 8;
      if (juryId === "Juri 2") targetCol = 9;
      if (juryId === "Juri 3") targetCol = 10;

      sheet.getRange(rowIndex, targetCol).setValue(totalScore);

      if (catatan) {
        var existingNote = sheet.getRange(rowIndex, 16).getValue();
        var updatedNote = (existingNote ? existingNote + "\\n" : "") + "[" + juryId + "] " + catatan;
        sheet.getRange(rowIndex, 16).setValue(updatedNote);
      }

      calculateLeaderboard();

      return createJsonResponse({
        status: "success",
        message: "Nilai " + juryId + " sebesar " + totalScore + " berhasil disimpan!"
      });
    }

    return createJsonResponse({ status: "error", message: "Aksi POST tidak valid" });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatHeaderRow(sheet, numCols, bgColor) {
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground(bgColor);
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 38);
}

/**
 * 8. Fungsi Pemulihan Otomatis: Memindahkan Peserta Cerita Pendek yang Salah Masuk ke Sheet Pidato
 * Dapat dijalankan dari menu "🎯 Sistem Penilaian FTBI > 4. Perbaiki Peserta Cerita Pendek"
 */
function repairMisplacedCerpenParticipants() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var formSheet = findFormResponsesSheet(ss);
  var movedCount = 0;

  if (!formSheet) {
    Logger.log("Sheet Form Responses tidak ditemukan.");
    return { status: "error", message: "Form sheet tidak ditemukan" };
  }

  var formData = formSheet.getDataRange().getValues();
  var formMap = getFormColumnMapping(formData[0]);

  // Periksa untuk masing-masing jenjang (SD & SMP)
  FTBI_CONFIG.levels.forEach(function(lvl) {
    var pidatoSheet = ss.getSheetByName(lvl + "_Pidato");
    var cerpenSheet = ss.getSheetByName(lvl + "_Cerpen");
    if (!pidatoSheet) return;

    if (!cerpenSheet) {
      cerpenSheet = ss.insertSheet(lvl + "_Cerpen");
      var headers = [
        "No", "No Undian", "Nama Peserta", "NISN", "Asal Sekolah", "Kecamatan/Kab", "Kategori (Pa/Pi)",
        "JURI I", "JURI II", "JURI III",
        "TOTAL NILAI", "RATA-RATA", "PERINGKAT", "PREDIKAT", "STATUS VERIFIKASI", "CATATAN DEWAN JURI"
      ];
      cerpenSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeaderRow(cerpenSheet, headers.length, "#006495");
      cerpenSheet.setFrozenRows(1);
      cerpenSheet.setFrozenColumns(3);
    }

    var pidatoData = pidatoSheet.getDataRange().getValues();
    // Loop dari bawah ke atas agar penghapusan baris tidak merusak indeks
    for (var r = pidatoData.length - 1; r >= 1; r--) {
      var pNama = String(pidatoData[r][2] || "").trim().toLowerCase();
      if (!pNama) continue;

      // Cari peserta ini di sheet respon formulir
      for (var f = 1; f < formData.length; f++) {
        var fNama = String(formData[f][formMap.nama] || "").trim().toLowerCase();
        if (fNama === pNama) {
          var fRowStr = formData[f].map(function(c) { return String(c || "").toLowerCase(); }).join(" ");
          var fCabang = formMap.cabang !== -1 ? String(formData[f][formMap.cabang] || "").toLowerCase() : "";

          // Jika di respon formulir aslinya memilih Cerita Pendek / Cerpen
          if (fCabang.indexOf("cerita") !== -1 || fCabang.indexOf("pendek") !== -1 || fCabang.indexOf("cerpen") !== -1 || fCabang.indexOf("carpon") !== -1 ||
              fRowStr.indexOf("cerita pendek") !== -1 || fRowStr.indexOf("cerpen") !== -1) {

            // Pindahkan baris ke sheet Cerpen
            var nextCerpenRow = cerpenSheet.getLastRow() + 1;
            var movedRowData = pidatoData[r].slice();
            movedRowData[0] = nextCerpenRow - 1; // update nomor urut
            cerpenSheet.getRange(nextCerpenRow, 1, 1, movedRowData.length).setValues([movedRowData]);

            // Hapus dari sheet Pidato
            pidatoSheet.deleteRow(r + 1);
            movedCount++;
            Logger.log("Berhasil memindahkan " + pNama + " dari Pidato ke Cerpen.");
            break;
          }
        }
      }
    }
  });

  calculateLeaderboard();

  var msg = "Berhasil memindahkan " + movedCount + " peserta Cerita Pendek yang sebelumnya salah masuk ke sheet Berpidato.";
  Logger.log(msg);
  try {
    SpreadsheetApp.getUi().alert("✅ Pemulihan Selesai!", msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch(e) {}
  return { status: "success", count: movedCount, message: msg };
}

function showWebAppUrlInfo() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    "Panduan Integrasi Web App",
    "Untuk menghubungkan antarmuka ini dengan Google Spreadsheet:\\n\\n" +
    "1. Buka Deploy > New deployment.\\n" +
    "2. Pilih Web app.\\n" +
    "3. Set 'Execute as: Me' dan 'Who has access: Anyone'.\\n" +
    "4. Salin URL Web App dan tempelkan di Dashboard FTBI pada tab Kode GAS.",
    ui.ButtonSet.OK
  );
}

// Helper RPC untuk HtmlService (bebas CORS)
function apiGetLeaderboard(level, branch) {
  var output = doGet({ parameter: { action: "getLeaderboard", level: level, branch: branch } });
  return JSON.parse(output.getContent());
}

function apiSubmitScore(payload) {
  var output = doPost({ postData: { contents: JSON.stringify(payload) } });
  return JSON.parse(output.getContent());
}
`;

export const APPSSCRIPT_JSON = `{
  "timeZone": "Asia/Jayapura",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  }
}`;

export const GAS_INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Penilaian Dewan Juri FTBI</title>
  <!-- Material 3 & Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8f9fa; color: #191c1e; }
  </style>
</head>
<body class="p-4 md:p-8">
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header M3 -->
    <header class="bg-white p-6 rounded-3xl border border-[#e0e3e5] shadow-sm flex items-center justify-between">
      <div>
        <span class="text-xs font-semibold text-[#006495] uppercase tracking-wider">Festival Tunas Bahasa Ibu (FTBI)</span>
        <h1 class="text-xl font-bold text-[#191c1e]">Lembar Penilaian Dewan Juri</h1>
        <p class="text-xs text-[#50606e]">Terhubung langsung dengan Google Spreadsheet</p>
      </div>
      <div class="flex items-center gap-2">
        <select id="select-juri" class="px-3 py-1.5 text-xs font-bold bg-[#cbe6ff] text-[#001e30] rounded-xl outline-none">
          <option value="Juri 1">Juri I (Ketua)</option>
          <option value="Juri 2">Juri II (Anggota)</option>
          <option value="Juri 3">Juri III (Anggota)</option>
        </select>
      </div>
    </header>

    <!-- Filter Jenjang & Cabang Lomba -->
    <div class="bg-white p-5 rounded-3xl border border-[#e0e3e5] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="select-jenjang" class="block text-xs font-bold text-[#191c1e] mb-1">Pilih Jenjang:</label>
        <select id="select-jenjang" class="w-full px-3.5 py-2 text-xs font-semibold bg-[#f2f4f6] rounded-xl outline-none">
          <option value="SD">Tingkat SD (Sekolah Dasar)</option>
          <option value="SMP">Tingkat SMP (Sekolah Menengah Pertama)</option>
        </select>
      </div>

      <div>
        <label for="select-cabang" class="block text-xs font-bold text-[#191c1e] mb-1">Pilih Cabang Lomba:</label>
        <select id="select-cabang" class="w-full px-3.5 py-2 text-xs font-semibold bg-[#f2f4f6] rounded-xl outline-none">
          <option value="berpidato">Lomba Berpidato (7 Aspek)</option>
          <option value="menulis_membaca_puisi">Lomba Menulis dan Membaca Puisi (8 Aspek)</option>
          <option value="menulis_cerpen">Lomba Menulis Cerpen (7 Aspek)</option>
          <option value="mendongeng">Lomba Mendongeng (6 Aspek)</option>
          <option value="menyanyi">Lomba Menyanyi (5 Aspek)</option>
          <option value="stand_up_comedy">Lomba Stand Up Comedy (6 Aspek)</option>
        </select>
      </div>
    </div>

    <!-- Dropdown Peserta & Autofill Identitas -->
    <div class="bg-white p-6 rounded-3xl border border-[#e0e3e5] shadow-sm space-y-4">
      <div>
        <label for="select-peserta" class="block text-xs font-bold text-[#191c1e] mb-1">
          Nomor Undian & Nama Peserta:
        </label>
        <select id="select-peserta" class="w-full px-3.5 py-2.5 text-xs font-bold bg-[#f0f7ff] border border-[#cbe6ff] focus:border-[#006495] rounded-2xl outline-none">
          <option value="">-- Memuat data peserta dari Google Sheet... --</option>
        </select>
      </div>

      <!-- Card Identitas Terpilih (Autofill) -->
      <div class="p-4 bg-[#f8f9fa] rounded-2xl border border-[#e0e3e5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-[#006495] text-white flex flex-col items-center justify-center font-mono font-bold">
            <span class="text-[9px] uppercase opacity-80">No</span>
            <span id="display-undian" class="text-base">-</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="display-nama" class="text-base font-bold text-[#191c1e]">Silakan Pilih Peserta</h2>
              <span id="display-kategori" class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#d3e4f5] text-[#0c1d29]">-</span>
            </div>
            <p class="text-xs text-[#50606e]">
              <span id="display-sekolah">-</span> · <span id="display-kabupaten">-</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Rubrik Nilai Resmi (50, 60, 70, 80) -->
      <div id="rubric-container" class="space-y-3 pt-2">
        <!-- Rendered dynamically -->
      </div>

      <!-- Catatan Juri -->
      <div class="pt-2">
        <label class="block text-xs font-bold text-[#191c1e] mb-1">Catatan Pembinaan / Masukan Teknis:</label>
        <textarea id="input-catatan" rows="2" class="w-full p-3 text-xs bg-[#f8f9fa] border border-[#e0e3e5] rounded-2xl outline-none" placeholder="Catatan untuk peserta..."></textarea>
      </div>

      <!-- Action Button -->
      <div class="pt-4 flex items-center justify-between border-t border-[#f2f4f6]">
        <div>
          <span class="text-xs text-[#50606e]">Total Skor Juri:</span>
          <span id="display-total" class="text-2xl font-bold font-mono text-[#006495] ml-2">0</span>
        </div>
        <button id="btn-simpan" class="px-6 py-2.5 text-xs font-bold text-white bg-[#006495] hover:bg-[#004f76] rounded-2xl shadow-sm transition-all">
          Simpan Nilai ke Spreadsheet
        </button>
      </div>
    </div>
  </div>

  <script>
    // Variabel global menampung seluruh data peserta dari Google Sheet
    let allParticipants = [];
    const GAS_API_URL = "<?= ScriptApp.getService().getUrl() ?>";

    // 1. Ambil data peserta dari Web App GAS saat aplikasi pertama kali dibuka
    async function fetchParticipants(jenjang, cabangId) {
      const selectDropdown = document.getElementById("select-peserta");
      selectDropdown.innerHTML = '<option value="">-- Mengambil data dari Google Sheet... --</option>';

      try {
        // Jika berjalan di dalam Google Apps Script HtmlService, gunakan google.script.run (bebas CORS)
        if (typeof google !== "undefined" && google.script && google.script.run) {
          google.script.run
            .withSuccessHandler(function(response) {
              if (response && response.status === "success") {
                allParticipants = response.data;
                populatePesertaDropdown(allParticipants);
              }
            })
            .apiGetLeaderboard(jenjang, cabangId);
        } else {
          // Fallback fetch API
          let apiUrl = GAS_API_URL + "?action=getLeaderboard&level=" + encodeURIComponent(jenjang) + "&branch=" + encodeURIComponent(cabangId);
          let result = await fetch(apiUrl);
          let json = await result.json();
          if (json.status === "success") {
            allParticipants = json.data;
            populatePesertaDropdown(allParticipants);
          }
        }
      } catch (error) {
        console.error("Gagal memuat data peserta:", error);
        selectDropdown.innerHTML = '<option value="">Gagal memuat peserta (Periksa koneksi)</option>';
      }
    }

    // 2. Masukkan data ke dalam Dropdown Nomor Undian / Nama Peserta
    function populatePesertaDropdown(participants) {
      let selectDropdown = document.getElementById("select-peserta");
      selectDropdown.innerHTML = '<option value="">-- Pilih Nomor Undian & Nama Peserta --</option>';

      if (!participants || participants.length === 0) {
        selectDropdown.innerHTML = '<option value="">-- Belum ada peserta terdaftar di cabang ini --</option>';
        return;
      }

      participants.forEach(p => {
        let option = document.createElement("option");
        option.value = p.noUndian;
        option.textContent = "No. " + p.noUndian + " - " + p.nama + " (" + p.asalSekolah + ")";

        // Simpan data detail peserta untuk autofill otomatis
        option.dataset.nama = p.nama;
        option.dataset.sekolah = p.asalSekolah;
        option.dataset.kabupaten = p.kecamatanKabupaten;
        option.dataset.kategori = p.kategoriGender;

        selectDropdown.appendChild(option);
      });
    }

    // 3. Event Listener ketika Juri mengganti pilihan Cabang Lomba atau Jenjang
    document.getElementById("select-jenjang").addEventListener("change", triggerReload);
    document.getElementById("select-cabang").addEventListener("change", triggerReload);

    function triggerReload() {
      let jenjang = document.getElementById("select-jenjang").value; // "SD" atau "SMP"
      let cabangId = document.getElementById("select-cabang").value; // misal "berpidato"
      if (jenjang && cabangId) {
        fetchParticipants(jenjang, cabangId);
      }
    }

    // 4. Autofill Identitas Peserta ketika Nomor Undian dipilih oleh Juri
    document.getElementById("select-peserta").addEventListener("change", function() {
      let selectedOption = this.options[this.selectedIndex];
      if (selectedOption && selectedOption.value) {
        document.getElementById("display-undian").innerText = selectedOption.value;
        document.getElementById("display-nama").innerText = selectedOption.dataset.nama || "-";
        document.getElementById("display-sekolah").innerText = selectedOption.dataset.sekolah || "-";
        document.getElementById("display-kategori").innerText = selectedOption.dataset.kategori || "-";
        document.getElementById("display-kabupaten").innerText = selectedOption.dataset.kabupaten || "-";
      } else {
        document.getElementById("display-undian").innerText = "-";
        document.getElementById("display-nama").innerText = "Silakan Pilih Peserta";
        document.getElementById("display-sekolah").innerText = "-";
        document.getElementById("display-kategori").innerText = "-";
        document.getElementById("display-kabupaten").innerText = "-";
      }
    });

    // Inisialisasi awal saat halaman dimuat
    window.addEventListener("DOMContentLoaded", function() {
      triggerReload();
    });
  </script>
</body>
</html>
`;

