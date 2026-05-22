// UMP (Upah Minimum Provinsi) 2026 Indonesia
// Sumber: Keputusan Gubernur masing-masing provinsi
// Update terakhir: Mei 2026 — semua nilai terverifikasi dari SK Gubernur resmi
// Satuan: Rupiah per bulan

export const UMP_2026 = {
  "Aceh":                        3_932_552,
  "Sumatera Utara":              3_228_949,
  "Sumatera Barat":              3_182_955,
  "Riau":                        3_780_495,
  "Jambi":                       3_471_497,
  "Sumatera Selatan":            3_942_963,
  "Bengkulu":                    2_827_250,
  "Lampung":                     3_047_734,
  "Kepulauan Bangka Belitung":   4_035_000,
  "Kepulauan Riau":              3_879_520,
  "DKI Jakarta":                 5_729_876,
  "Jawa Barat":                  2_317_601,
  "Jawa Tengah":                 2_327_386,
  "DI Yogyakarta":               2_417_495,
  "Jawa Timur":                  2_446_880,
  "Banten":                      3_100_881,
  "Bali":                        3_207_459,
  "Nusa Tenggara Barat":         2_673_861,
  "Nusa Tenggara Timur":         2_630_162,
  "Kalimantan Barat":            3_054_552,
  "Kalimantan Tengah":           3_686_138,
  "Kalimantan Selatan":          3_686_138,
  "Kalimantan Timur":            3_762_431,
  "Kalimantan Utara":            3_775_243,
  "Sulawesi Utara":              4_002_630,
  "Sulawesi Tengah":             3_179_565,
  "Sulawesi Selatan":            3_921_088,
  "Sulawesi Tenggara":           3_306_496,
  "Gorontalo":                   3_221_731,
  "Sulawesi Barat":              3_315_935,
  "Maluku":                      3_141_699,
  "Maluku Utara":                3_408_000,
  "Papua":                       4_436_283,
  "Papua Barat":                 3_840_947,
  "Papua Selatan":               4_508_850,
  "Papua Tengah":                4_295_848,
  "Papua Pegunungan":            4_508_714,
  "Papua Barat Daya":            3_766_000,
}

// Ambil UMP berdasarkan nama provinsi
export function getUMPbyProvinsi(namaProvinsi) {
  if (!namaProvinsi) return null
  return UMP_2026[namaProvinsi] || null
}

// ===================================================
// UMK (Upah Minimum Kabupaten/Kota) 2026
// Sumber: SK Gubernur masing-masing provinsi (terverifikasi)
// Satuan: Rupiah per bulan
// ===================================================
export const UMK_2026 = {
  // JAWA BARAT — SK Gubernur No.561.7/Kep.862-Kesra/2025 (24 Des 2025)
  "Kota Bekasi":              5_992_931,
  "Kabupaten Bekasi":         5_938_885,
  "Kabupaten Karawang":       5_886_852,
  "Kota Depok":               5_522_662,
  "Kota Bogor":               5_437_203,
  "Kabupaten Bogor":          5_161_769,
  "Kabupaten Purwakarta":     5_052_856,
  "Kota Bandung":             4_737_678,
  "Kota Cimahi":              4_090_568,
  "Kabupaten Bandung Barat":  3_984_711,
  "Kabupaten Bandung":        3_972_202,
  "Kabupaten Sumedang":       3_949_856,
  "Kabupaten Sukabumi":       3_831_926,
  "Kabupaten Subang":         3_737_482,
  "Kabupaten Indramayu":      2_910_254,
  "Kabupaten Cianjur":        3_316_191,
  "Kota Sukabumi":            3_192_807,
  "Kota Tasikmalaya":         2_980_336,
  "Kabupaten Tasikmalaya":    2_871_874,
  "Kabupaten Cirebon":        2_880_798,
  "Kota Cirebon":             2_878_646,
  "Kabupaten Majalengka":     2_595_368,
  "Kabupaten Garut":          2_472_227,
  "Kabupaten Ciamis":         2_373_644,
  "Kota Banjar":              2_361_241,
  "Kabupaten Pangandaran":    2_351_250,
  "Kabupaten Kuningan":       2_369_380,

  // BANTEN — SK Gubernur Banten No.703 Tahun 2025
  "Kota Cilegon":             5_469_922,
  "Kota Tangerang":           5_399_405,
  "Kota Tangerang Selatan":   5_247_870,
  "Kabupaten Tangerang":      5_210_377,
  "Kabupaten Serang":         5_178_521,
  "Kota Serang":              4_665_927,
  "Kabupaten Pandeglang":     3_360_078,
  "Kabupaten Lebak":          3_330_010,

  // DKI JAKARTA — sama dengan UMP
  "Kota Jakarta Pusat":       5_729_876,
  "Kota Jakarta Selatan":     5_729_876,
  "Kota Jakarta Barat":       5_729_876,
  "Kota Jakarta Timur":       5_729_876,
  "Kota Jakarta Utara":       5_729_876,

  // JAWA TENGAH — SK Gubernur Jateng
  "Kota Semarang":            3_701_709,
  "Kabupaten Demak":          3_122_805,
  "Kabupaten Kendal":         2_992_994,
  "Kabupaten Semarang":       2_940_088,
  "Kabupaten Kudus":          2_818_585,
  "Kabupaten Cilacap":        2_773_184,
  "Kabupaten Jepara":         2_756_501,
  "Kota Salatiga":            2_698_273,
  "Kota Pekalongan":          2_700_926,
  "Kabupaten Batang":         2_708_520,
  "Kabupaten Pekalongan":     2_633_700,
  "Kabupaten Karanganyar":    2_592_154,
  "Kabupaten Magelang":       2_607_790,
  "Kota Surakarta":           2_570_000,
  "Kabupaten Klaten":         2_538_691,
  "Kabupaten Boyolali":       2_537_949,
  "Kota Tegal":               2_526_510,
  "Kabupaten Sukoharjo":      2_500_000,
  "Kabupaten Pati":           2_485_000,
  "Kabupaten Tegal":          2_484_162,
  "Kabupaten Banyumas":       2_474_598,
  "Kabupaten Purbalingga":    2_474_721,
  "Kabupaten Pemalang":       2_433_254,
  "Kota Magelang":            2_429_285,
  "Kabupaten Wonosobo":       2_455_038,
  "Kabupaten Kebumen":        2_400_000,
  "Kabupaten Brebes":         2_400_350,
  "Kabupaten Purworejo":      2_401_961,
  "Kabupaten Grobogan":       2_399_186,
  "Kabupaten Temanggung":     2_397_000,
  "Kabupaten Rembang":        2_386_305,
  "Kabupaten Banjarnegara":   2_327_813,
  "Kabupaten Blora":          2_345_695,
  "Kabupaten Sragen":         2_337_700,
  "Kabupaten Wonogiri":       2_335_126,

  // DI YOGYAKARTA — SK Gubernur DIY No.443/2025
  "Kota Yogyakarta":          2_827_593,
  "Kabupaten Sleman":         2_624_387,
  "Kabupaten Bantul":         2_509_001,
  "Kabupaten Kulon Progo":    2_504_520,
  "Kabupaten Gunungkidul":    2_468_378,

  // JAWA TIMUR — SK Gubernur Jatim No.100.3.3.1/937/013/2025
  "Kota Surabaya":            5_288_796,
  "Kabupaten Gresik":         5_195_401,
  "Kabupaten Sidoarjo":       5_191_541,
  "Kabupaten Pasuruan":       5_187_681,
  "Kabupaten Mojokerto":      5_176_101,
  "Kabupaten Malang":         3_802_862,
  "Kota Malang":              3_736_101,
  "Kota Batu":                3_562_484,
  "Kota Pasuruan":            3_555_301,
  "Kabupaten Jombang":        3_320_770,
  "Kabupaten Tuban":          3_229_092,
  "Kota Mojokerto":           3_208_556,
  "Kabupaten Lamongan":       3_196_328,
  "Kabupaten Probolinggo":    3_164_526,
  "Kota Probolinggo":         3_045_172,
  "Kabupaten Jember":         3_012_197,
  "Kabupaten Banyuwangi":     2_989_145,
  "Kota Kediri":              2_742_806,
  "Kabupaten Bojonegoro":     2_685_983,
  "Kabupaten Kediri":         2_651_603,
  "Kota Blitar":              2_639_518,
  "Kabupaten Tulungagung":    2_628_190,
  "Kota Madiun":              2_588_794,
  "Kabupaten Lumajang":       2_578_320,
  "Kabupaten Blitar":         2_567_744,
  "Kabupaten Nganjuk":        2_564_627,
  "Kabupaten Ngawi":          2_556_815,
  "Kabupaten Magetan":        2_553_866,
  "Kabupaten Sumenep":        2_553_688,
  "Kabupaten Madiun":         2_553_221,
  "Kabupaten Bangkalan":      2_550_274,
  "Kabupaten Ponorogo":       2_549_876,
  "Kabupaten Trenggalek":     2_530_313,
  "Kabupaten Pamekasan":      2_528_004,
  "Kabupaten Pacitan":        2_514_892,
  "Kabupaten Bondowoso":      2_496_886,
  "Kabupaten Sampang":        2_484_443,
  "Kabupaten Situbondo":      2_483_962,

  // BALI — SK Gubernur Bali No.1021/03-M/HK/2025
  "Kabupaten Badung":         3_791_002,
  "Kota Denpasar":            3_499_878,
  "Kabupaten Gianyar":        3_316_798,
  "Kabupaten Tabanan":        3_287_678,

  // ACEH — SK Gubernur Aceh
  "Kota Banda Aceh":          4_162_965,
  "Kabupaten Aceh Tamiang":   3_978_204,

  // SUMATERA UTARA — SK Gubernur No.188.44/908/KPTS/2025
  "Kota Medan":               4_335_198,
  "Kabupaten Deli Serdang":   4_041_543,
  "Kabupaten Karo":           3_843_153,

  // RIAU — SK Gubernur Riau No.Kpts.1164/XII/2025
  "Kota Pekanbaru":           3_998_179,
  "Kota Dumai":               4_431_174,
  "Kabupaten Bengkalis":      4_155_317,
  "Kabupaten Siak":           4_001_327,
  "Kabupaten Rokan Hulu":     3_988_406,
  "Kabupaten Kuantan Singingi": 3_949_466,
  "Kabupaten Indragiri Hulu": 3_898_210,
  "Kabupaten Pelalawan":      3_894_260,
  "Kabupaten Rokan Hilir":    3_783_052,
  "Kabupaten Kampar":         3_819_353,

  // KEPULAUAN RIAU — SK Gubernur Kepri
  "Kota Batam":               5_357_982,
  "Kabupaten Bintan":         4_583_221,
  "Kota Tanjungpinang":       3_879_520,

  // SULAWESI SELATAN — SK Gubernur Sulsel No.2142/XII/2025
  "Kota Makassar":            4_148_179,

  // SULAWESI TENGAH — SK Gubernur Sulteng
  "Kota Palu":                3_619_466,

  // KALIMANTAN SELATAN — SK Gubernur Kalsel
  "Kota Banjarmasin":         3_855_894,
  "Kota Banjarbaru":          3_843_037,
  "Kabupaten Kotabaru":       3_904_645,
  "Kabupaten Tabalong":       3_827_935,
  "Kabupaten Tanah Bumbu":    3_736_000,

  // BENGKULU — SK Gubernur Bengkulu
  "Kabupaten Mukomuko":       3_217_086,
  "Kota Bengkulu":            3_089_218,
  "Kabupaten Bengkulu Tengah": 2_945_142,
  "Kabupaten Bengkulu Utara": 2_906_158,
  "Kabupaten Rejang Lebong":  2_841_749,
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
//   { upahEfektif: 5_522_662, sumber: 'umk_database',
//     nilaiMinimum: 5_522_662, label: 'UMK Kota Depok' }
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
