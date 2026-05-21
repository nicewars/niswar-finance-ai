// REGULASI PAJAK & BPJS INDONESIA 2026
// Update terakhir: Mei 2026
// Sumber: PMK 168/2023, PP 58/2023, PP 45/2015,
//         Perpres 64/2020, surat BPJS B/1226/022026
//
// PANDUAN UPDATE:
// Kalau pemerintah update tarif/batas, EDIT FILE INI SAJA.
// Semua modul (form registrasi, Tax Center, dll) akan otomatis
// pakai angka baru tanpa perlu sentuh kode komponen.

export const REGULATIONS_2026 = {
  // ===================================================
  // BPJS KESEHATAN (Perpres 64/2020)
  // ===================================================
  bpjsKesehatan: {
    persenKaryawan: 0.01,
    persenPerusahaan: 0.04,
    batasAtasUpah: 12_000_000,
    batasBawahUpah: null, // pakai UMK/UMP daerah masing-masing
    persenTambahanKeluarga: 0.01,
    iuranMandiri: {
      kelas1: 150_000,
      kelas2: 100_000,
      kelas3: 35_000, // sudah dikurangi subsidi 7rb dari pemerintah
    },
  },

  // ===================================================
  // BPJS KETENAGAKERJAAN (PP 45/2015, update Maret 2026)
  // ===================================================
  bpjsKetenagakerjaan: {
    jht: {
      persenKaryawan: 0.02,
      persenPerusahaan: 0.037,
      batasAtasUpah: null, // tidak ada batas atas
    },
    jp: {
      persenKaryawan: 0.01,
      persenPerusahaan: 0.02,
      batasAtasUpah: 11_086_300, // efektif Maret 2026
      catatanRegulasi: 'BPJS Ketenagakerjaan No. B/1226/022026',
    },
    jkk: {
      // ditanggung perusahaan 100%
      tarifRisiko: {
        sangatRendah: 0.0024,
        rendah: 0.0054,
        sedang: 0.0089,
        tinggi: 0.0127,
        sangatTinggi: 0.0174,
      },
    },
    jkm: {
      persenPerusahaan: 0.003, // ditanggung perusahaan 100%
    },
    jkp: {
      // Tidak ada potongan tambahan dari karyawan/perusahaan
      // Sumber dana: 0.22% pemerintah + 0.14% rekomposisi JKK + 0.10% rekomposisi JKM
    },
  },

  // ===================================================
  // PPh 21 (UU HPP 7/2021, PMK 168/2023)
  // ===================================================
  pph21: {
    ptkp: {
      wpSendiri: 54_000_000,
      tambahanKawin: 4_500_000,
      tambahanTanggungan: 4_500_000,
      maksTanggungan: 3,
    },
    tarifProgresifTahunan: [
      { sampai: 60_000_000, tarif: 0.05 },
      { sampai: 250_000_000, tarif: 0.15 },
      { sampai: 500_000_000, tarif: 0.25 },
      { sampai: 5_000_000_000, tarif: 0.30 },
      { sampai: Infinity, tarif: 0.35 },
    ],
    // Tabel TER bulanan akan ditambahkan di Fase 5 (Tax Center)
  },

  // ===================================================
  // BATAS MINIMUM UPAH (PP 36/2021 tentang Pengupahan)
  // ===================================================
  batasMinimum: {
    catatan:
      'UMK/UMP ditetapkan tiap daerah oleh gubernur/bupati/walikota. ' +
      'BPJS dihitung dari upah aktual ATAU UMK/UMP, mana yang LEBIH BESAR ' +
      '(PP 44/2015 tentang Program JHT & JP, SE Menaker tentang pelaporan upah).',
    referensi: 'PP 36/2021 tentang Pengupahan, PP 44/2015 tentang BPJS TK',
    // Nilai UMK tidak disimpan di sini karena beda-beda tiap daerah.
    // Pengguna mengisi UMK daerahnya di Step 3 (Lokasi).
  },
}

// ===================================================
// CATATAN
// ===================================================
// Data UMP/UMK per provinsi ada di src/lib/ump-data.js
// Update nilai UMP setiap Januari sesuai Keputusan Gubernur
// getEffectiveWageForBPJS() juga ada di ump-data.js
