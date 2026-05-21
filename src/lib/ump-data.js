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

// Hitung upah efektif untuk dasar perhitungan BPJS.
// Menerapkan aturan "lantai" UMK/UMP:
// Jika gaji di bawah UMK/UMP, pakai UMK/UMP sebagai dasar.
// Prioritas: UMK kota (lebih spesifik) > UMP provinsi > gaji aktual.
export function getEffectiveWageForBPJS(gajiPokok, provinsi, umkKota = null) {
  const ump = getUMPbyProvinsi(provinsi)

  // Pakai UMK kota jika ada; kalau tidak, pakai UMP provinsi
  const minimumWage = umkKota || ump || 0

  // Ambil yang lebih besar: gaji aktual vs upah minimum
  return Math.max(gajiPokok, minimumWage)
}
