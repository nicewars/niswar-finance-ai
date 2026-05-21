// UMP (Upah Minimum Provinsi) 2026 Indonesia
// Sumber: Keputusan Gubernur masing-masing provinsi
// Update setiap: Januari (setelah pengumuman Gubernur)
// Satuan: Rupiah per bulan

export const UMP_2026 = {
  "Aceh": 3_685_616,
  "Sumatera Utara": 2_992_599,
  "Sumatera Barat": 2_994_193,
  "Riau": 3_508_775,
  "Jambi": 3_234_535,
  "Sumatera Selatan": 3_681_570,
  "Bengkulu": 2_782_705,
  "Lampung": 2_893_069,
  "Kepulauan Bangka Belitung": 3_864_884,
  "Kepulauan Riau": 3_623_653,
  "DKI Jakarta": 5_396_761,
  "Jawa Barat": 2_191_232,
  "Jawa Tengah": 2_169_349,
  "DI Yogyakarta": 2_264_080,
  "Jawa Timur": 2_305_984,
  "Banten": 2_905_119,
  "Bali": 2_996_561,
  "Nusa Tenggara Barat": 2_627_900,
  "Nusa Tenggara Timur": 2_328_969,
  "Kalimantan Barat": 2_878_286,
  "Kalimantan Tengah": 3_473_621,
  "Kalimantan Selatan": 3_496_194,
  "Kalimantan Timur": 3_579_381,
  "Kalimantan Utara": 3_580_890,
  "Sulawesi Utara": 3_775_425,
  "Sulawesi Tengah": 3_050_304,
  "Sulawesi Selatan": 3_657_527,
  "Sulawesi Tenggara": 3_073_551,
  "Gorontalo": 3_221_731,
  "Sulawesi Barat": 3_104_430,
  "Maluku": 3_141_699,
  "Maluku Utara": 3_408_000,
  "Papua": 4_285_848,
  "Papua Barat": 3_837_951,
  "Papua Selatan": 4_285_848,
  "Papua Tengah": 4_285_848,
  "Papua Pegunungan": 4_285_848,
  "Papua Barat Daya": 3_837_951,
}

// Ambil UMP berdasarkan nama provinsi
export function getUMPbyProvinsi(namaProvinsi) {
  if (!namaProvinsi) return null
  return UMP_2026[namaProvinsi] || null
}

// ===================================================
// UMK (Upah Minimum Kabupaten/Kota) 2026
// Sumber: Keputusan Gubernur masing-masing provinsi
// Satuan: Rupiah per bulan
// ===================================================
export const UMK_2026 = {
  // JAWA BARAT
  "Kota Bekasi": 5_691_602,
  "Kabupaten Bekasi": 5_558_515,
  "Kabupaten Karawang": 5_599_593,
  "Kota Depok": 4_878_612,
  "Kota Bogor": 4_813_988,
  "Kabupaten Bogor": 4_877_946,
  "Kota Bandung": 4_482_914,
  "Kota Cimahi": 3_627_880,
  "Kabupaten Purwakarta": 4_792_252,
  "Kota Cirebon": 2_681_382,
  "Kabupaten Subang": 3_508_626,
  "Kabupaten Sukabumi": 3_523_163,

  // BANTEN
  "Kota Tangerang Selatan": 4_580_085,
  "Kota Tangerang": 4_580_085,
  "Kabupaten Tangerang": 4_454_556,
  "Kota Cilegon": 4_522_873,
  "Kabupaten Serang": 4_130_366,

  // DKI JAKARTA (sama dengan UMP)
  "Kota Jakarta Pusat": 5_396_761,
  "Kota Jakarta Selatan": 5_396_761,
  "Kota Jakarta Barat": 5_396_761,
  "Kota Jakarta Timur": 5_396_761,
  "Kota Jakarta Utara": 5_396_761,

  // JAWA TENGAH
  "Kota Semarang": 3_454_827,
  "Kabupaten Semarang": 2_750_136,
  "Kota Surakarta": 2_269_069,
  "Kabupaten Demak": 2_657_042,
  "Kabupaten Kendal": 2_843_852,
  "Kabupaten Cilacap": 2_306_650,

  // DI YOGYAKARTA
  "Kabupaten Sleman": 2_369_562,
  "Kabupaten Bantul": 2_360_533,
  "Kota Yogyakarta": 2_381_695,

  // JAWA TIMUR
  "Kota Surabaya": 4_826_072,
  "Kabupaten Gresik": 4_642_031,
  "Kabupaten Sidoarjo": 4_638_582,
  "Kabupaten Pasuruan": 4_635_945,
  "Kabupaten Mojokerto": 4_577_452,
  "Kota Malang": 3_505_797,
  "Kabupaten Malang": 3_368_104,

  // SUMATERA UTARA
  "Kota Medan": 3_922_066,
  "Kota Binjai": 3_098_780,
  "Kabupaten Deli Serdang": 3_709_936,

  // RIAU
  "Kota Pekanbaru": 3_737_427,

  // SUMATERA SELATAN
  "Kota Palembang": 3_825_000,

  // KALIMANTAN TIMUR
  "Kota Balikpapan": 3_740_000,
  "Kota Samarinda": 3_620_000,

  // SULAWESI SELATAN
  "Kota Makassar": 3_763_700,

  // BALI
  "Kota Denpasar": 3_213_672,
  "Kabupaten Badung": 3_460_599,
}

// Cari UMK berdasarkan nama kota/kabupaten.
// Mendukung exact match dan partial match (misal "Depok" → "Kota Depok").
export function getUMKbyKota(namaKota) {
  if (!namaKota) return null
  // Coba exact match dulu
  if (UMK_2026[namaKota]) return UMK_2026[namaKota]
  // Coba partial match
  const lower = namaKota.toLowerCase()
  const key = Object.keys(UMK_2026).find((k) => {
    const kLower = k.toLowerCase()
    return (
      kLower.includes(lower) ||
      lower.includes(kLower.replace('kota ', '').replace('kabupaten ', ''))
    )
  })
  return key ? UMK_2026[key] : null
}

// ===================================================
// EFEKTIF WAGE — 2 fungsi terpisah sesuai aturan BPJS
// ===================================================

// BPJS Ketenagakerjaan: lantai = UMP Provinsi
// (tidak ada aturan UMK per kota untuk BPJS TK)
export function getEffectiveWageForBPJSTK(gajiPokok, provinsi) {
  const ump = getUMPbyProvinsi(provinsi) || 0
  return Math.max(gajiPokok, ump)
}

// BPJS Kesehatan: lantai = UMK Kota jika ada, fallback ke UMP Provinsi
// (Pasal 5 Perpres 64/2020: dasar iuran PPU = gaji/upah)
export function getEffectiveWageForBPJSKes(gajiPokok, provinsi, kotaKabupaten) {
  const umk = getUMKbyKota(kotaKabupaten)
  const ump = getUMPbyProvinsi(provinsi) || 0
  const minimum = umk || ump   // UMK diprioritaskan; fallback UMP
  return Math.max(gajiPokok, minimum)
}

// ===================================================
// PRIORITY CHAIN — getEffectiveWageForBPJS (versi baru)
// ===================================================
// Dipakai oleh calcBPJSKesehatan untuk dasar iuran yang transparan.
// Mengembalikan OBJECT (bukan number) agar komponen bisa tampilkan sumber data.
//
// Priority: umkManual > UMK_2026 database > UMP provinsi
//
// Contoh return:
//   { upahEfektif: 5_000_000, sumber: 'umk_database',
//     nilaiMinimum: 4_878_612, label: 'UMK Kota Depok' }
//
// Nilai sumber:
//   'umk_manual'   → user override manual di /settings/profil
//   'umk_database' → UMK ditemukan di tabel UMK_2026
//   'ump_fallback' → UMK kota tidak ada, pakai UMP provinsi
export function getEffectiveWageForBPJS(gajiPokok, provinsi, kotaKabupaten, umkManual = null) {
  const ump = getUMPbyProvinsi(provinsi) || 0
  const umkDb = getUMKbyKota(kotaKabupaten)

  let nilaiMinimum, sumber, label

  if (umkManual && Number(umkManual) > 0) {
    nilaiMinimum = Number(umkManual)
    sumber = 'umk_manual'
    label = 'UMK Manual (override)'
  } else if (umkDb) {
    nilaiMinimum = umkDb
    sumber = 'umk_database'
    label = `UMK ${kotaKabupaten}`
  } else if (ump) {
    nilaiMinimum = ump
    sumber = 'ump_fallback'
    label = `UMP ${provinsi}`
  } else {
    nilaiMinimum = 0
    sumber = 'ump_fallback'
    label = 'Data tidak tersedia'
  }

  const upahEfektif = Math.max(gajiPokok, nilaiMinimum)
  return { upahEfektif, sumber, nilaiMinimum, label }
}
