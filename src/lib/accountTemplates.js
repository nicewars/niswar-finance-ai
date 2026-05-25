// ─────────────────────────────────────────────────────────────────
// accountTemplates.js
// Menghasilkan array template akun (Chart of Accounts) berdasarkan
// data profil pengguna dari registrasi.
//
// Cara pakai:
//   import { generateAccountTemplates } from '@/lib/accountTemplates'
//   const templates = generateAccountTemplates(profile)
// ─────────────────────────────────────────────────────────────────

export function generateAccountTemplates(profile) {
  const accounts = []
  let order = 0

  // Helper untuk membuat objek akun
  const akun = (
    name, category, type, icon, color,
    budget = 0, parentName = null, isAveraged = false,
    periodMonths = 1, notes = ''
  ) => ({
    name,
    category,
    account_type: type,
    icon,
    color,
    monthly_budget: budget,
    parent_name: parentName,   // dipakai saat insert untuk resolve parent_id
    is_averaged: isAveraged,
    period_months: periodMonths,
    notes,
    order_index: order++,
    is_system: true,
  })

  // ══════════════════════════════════════════════════════════
  // INDUK 1: KEBUTUHAN POKOK
  // ══════════════════════════════════════════════════════════
  accounts.push(
    akun('Kebutuhan Pokok', 'kebutuhan_pokok', 'expense', '🏠', '#3b82f6')
  )

  // — Pangan —
  accounts.push(
    akun('Pangan', 'kebutuhan_pokok', 'expense', '🍚', '#3b82f6', 0, 'Kebutuhan Pokok')
  )
  accounts.push(
    akun('Makan Harian', 'kebutuhan_pokok', 'expense', '🍽️', '#3b82f6', 0, 'Pangan')
  )
  accounts.push(
    akun('Air Minum Galon', 'kebutuhan_pokok', 'expense', '💧', '#3b82f6', 0, 'Pangan')
  )

  // — Sandang —
  accounts.push(
    akun('Sandang', 'kebutuhan_pokok', 'expense', '👕', '#3b82f6', 0, 'Kebutuhan Pokok')
  )
  accounts.push(
    akun('Pakaian', 'kebutuhan_pokok', 'expense', '👔', '#3b82f6', 0, 'Sandang',
      true, 12, 'Anggaran tahunan dibagi 12 bulan')
  )

  // — Tempat Tinggal — sesuaikan berdasarkan status_tempat
  accounts.push(
    akun('Tempat Tinggal', 'kebutuhan_pokok', 'expense', '🏡', '#3b82f6', 0, 'Kebutuhan Pokok')
  )

  const statusTempat = profile.status_tempat || ''
  if (statusTempat.includes('Sewa') || statusTempat.includes('Kost')) {
    accounts.push(
      akun('Biaya Sewa/Kost', 'kebutuhan_pokok', 'expense', '🏠', '#3b82f6',
        profile.biaya_sewa || 0, 'Tempat Tinggal')
    )
  } else if (statusTempat.includes('Sendiri') || statusTempat.includes('KPR')) {
    accounts.push(
      akun('PBB', 'kebutuhan_pokok', 'expense', '📋', '#3b82f6', 0, 'Tempat Tinggal',
        true, 12, 'Pajak tahunan dibagi 12 bulan')
    )
    accounts.push(
      akun('Dana Renovasi', 'kebutuhan_pokok', 'expense', '🔨', '#3b82f6', 0, 'Tempat Tinggal',
        true, 12, 'Anggaran renovasi tahunan dibagi 12 bulan')
    )
    accounts.push(
      akun('Asuransi Properti', 'kebutuhan_pokok', 'expense', '🛡️', '#3b82f6', 0, 'Tempat Tinggal',
        true, 12, 'Premi asuransi tahunan dibagi 12 bulan')
    )
  }
  accounts.push(
    akun('Biaya Keamanan', 'kebutuhan_pokok', 'expense', '🔒', '#3b82f6', 0, 'Tempat Tinggal')
  )
  accounts.push(
    akun('Biaya Kebersihan', 'kebutuhan_pokok', 'expense', '🧹', '#3b82f6', 0, 'Tempat Tinggal')
  )
  accounts.push(
    akun('Iuran Sosial Lingkungan', 'kebutuhan_pokok', 'expense', '🤝', '#3b82f6', 0, 'Tempat Tinggal')
  )

  // — Transportasi —
  accounts.push(
    akun('Transportasi', 'kebutuhan_pokok', 'expense', '🚗', '#3b82f6', 0, 'Kebutuhan Pokok')
  )

  const kendaraan = profile.kepemilikan_kendaraan || []
  const punyaKendaraan = Array.isArray(kendaraan)
    ? kendaraan.some(k => k && !k.includes('Tidak punya'))
    : false

  if (punyaKendaraan) {
    accounts.push(
      akun('Bensin', 'kebutuhan_pokok', 'expense', '⛽', '#3b82f6', 0, 'Transportasi')
    )
    accounts.push(
      akun('Parkir', 'kebutuhan_pokok', 'expense', '🅿️', '#3b82f6', 0, 'Transportasi')
    )
    accounts.push(
      akun('Tol', 'kebutuhan_pokok', 'expense', '🛣️', '#3b82f6', 0, 'Transportasi')
    )
    accounts.push(
      akun('Cuci Kendaraan', 'kebutuhan_pokok', 'expense', '🚿', '#3b82f6', 0, 'Transportasi')
    )
    accounts.push(
      akun('Dana Darurat Perjalanan', 'kebutuhan_pokok', 'expense', '🆘', '#3b82f6', 50000,
        'Transportasi', false, 1, 'Rp50rb/bln untuk keadaan darurat di jalan')
    )
    accounts.push(
      akun('Servis Kendaraan', 'kebutuhan_pokok', 'expense', '🔧', '#3b82f6', 0, 'Transportasi',
        true, 3, 'Biaya servis dibagi periode servis dalam bulan')
    )
    accounts.push(
      akun('Pajak Kendaraan', 'kebutuhan_pokok', 'expense', '📝', '#3b82f6', 0, 'Transportasi',
        true, 12, 'Pajak tahunan dibagi 12 bulan')
    )
    accounts.push(
      akun('STNK & Plat Nomor', 'kebutuhan_pokok', 'expense', '📄', '#3b82f6', 0, 'Transportasi',
        true, 60, 'Biaya 5 tahunan dibagi 60 bulan')
    )
    accounts.push(
      akun('Asuransi Kendaraan', 'kebutuhan_pokok', 'expense', '🛡️', '#3b82f6', 0, 'Transportasi',
        true, 12, 'Premi asuransi tahunan dibagi 12 bulan')
    )
  } else {
    accounts.push(
      akun('Transportasi Umum', 'kebutuhan_pokok', 'expense', '🚌', '#3b82f6', 0, 'Transportasi')
    )
  }

  // — Kesehatan —
  accounts.push(
    akun('Kesehatan', 'kebutuhan_pokok', 'expense', '🏥', '#3b82f6', 0, 'Kebutuhan Pokok')
  )
  if (profile.asuransi_kesehatan === 'Ya, punya') {
    accounts.push(
      akun('Premi Asuransi Kesehatan', 'kebutuhan_pokok', 'expense', '💊', '#3b82f6', 0, 'Kesehatan')
    )
  }
  accounts.push(
    akun('Obat-obatan & Apotek', 'kebutuhan_pokok', 'expense', '💉', '#3b82f6', 0, 'Kesehatan',
      false, 1, 'Dana kesehatan rutin dan obat')
  )

  // — Komunikasi —
  accounts.push(
    akun('Komunikasi', 'kebutuhan_pokok', 'expense', '📱', '#3b82f6', 0, 'Kebutuhan Pokok')
  )
  accounts.push(
    akun('Internet WiFi Rumah', 'kebutuhan_pokok', 'expense', '🌐', '#3b82f6', 0, 'Komunikasi')
  )
  accounts.push(
    akun('Internet Ponsel', 'kebutuhan_pokok', 'expense', '📶', '#3b82f6', 0, 'Komunikasi')
  )

  // — Utilitas —
  accounts.push(
    akun('Utilitas', 'kebutuhan_pokok', 'expense', '⚡', '#3b82f6', 0, 'Kebutuhan Pokok')
  )
  accounts.push(
    akun('Listrik', 'kebutuhan_pokok', 'expense', '💡', '#3b82f6', 0, 'Utilitas')
  )
  accounts.push(
    akun('Air PAM', 'kebutuhan_pokok', 'expense', '🚿', '#3b82f6', 0, 'Utilitas')
  )
  accounts.push(
    akun('Laundry', 'kebutuhan_pokok', 'expense', '👗', '#3b82f6', 0, 'Utilitas')
  )

  // — Pendidikan Anak — hanya jika menikah dan punya tanggungan
  if (profile.status_pernikahan === 'Menikah' && profile.jumlah_tanggungan > 0) {
    accounts.push(
      akun('Pendidikan Anak', 'kebutuhan_pokok', 'expense', '📚', '#3b82f6', 0, 'Kebutuhan Pokok')
    )
    accounts.push(
      akun('Biaya Sekolah', 'kebutuhan_pokok', 'expense', '🏫', '#3b82f6', 0, 'Pendidikan Anak',
        true, 6, 'Biaya semesteran dibagi 6 bulan')
    )
  }

  // ══════════════════════════════════════════════════════════
  // INDUK 2: ZAKAT & KEWAJIBAN AGAMA (khusus Islam)
  // ══════════════════════════════════════════════════════════
  if (profile.agama === 'Islam') {
    accounts.push(
      akun('Zakat & Kewajiban Agama', 'zakat_agama', 'expense', '🌙', '#10b981')
    )
    accounts.push(
      akun('Zakat Wajib', 'zakat_agama', 'expense', '🕌', '#10b981', 0, 'Zakat & Kewajiban Agama')
    )
    accounts.push(
      akun('Zakat Profesi/Penghasilan', 'zakat_agama', 'expense', '💼', '#10b981', 0, 'Zakat Wajib',
        false, 1, '2.5% dari penghasilan jika sudah nisab')
    )
    accounts.push(
      akun('Zakat Maal', 'zakat_agama', 'expense', '💰', '#10b981', 0, 'Zakat Wajib',
        true, 12, 'Zakat harta tahunan dibagi 12 bulan')
    )
    accounts.push(
      akun('Zakat Fitrah', 'zakat_agama', 'expense', '🌟', '#10b981', 0, 'Zakat Wajib',
        true, 12, 'Zakat Ramadan tahunan dibagi 12 bulan')
    )
    accounts.push(
      akun('Qurban', 'zakat_agama', 'expense', '🐄', '#10b981', 0, 'Zakat Wajib',
        true, 12, 'Biaya qurban tahunan dibagi 12 bulan')
    )
    accounts.push(
      akun('Infaq & Sedekah', 'zakat_agama', 'expense', '🤲', '#10b981', 0, 'Zakat & Kewajiban Agama')
    )
  }

  // ══════════════════════════════════════════════════════════
  // INDUK 3: TABUNGAN & INVESTASI
  // ══════════════════════════════════════════════════════════
  accounts.push(
    akun('Tabungan & Investasi', 'tabungan_investasi', 'savings', '📈', '#8b5cf6')
  )
  accounts.push(
    akun('Dana Darurat', 'tabungan_investasi', 'savings', '🆘', '#8b5cf6', 0, 'Tabungan & Investasi')
  )

  // Sub-akun tujuan keuangan dari registrasi
  const tujuan = profile.tujuan_keuangan || []
  if (Array.isArray(tujuan)) {
    tujuan.forEach(t => {
      if (t && t !== 'Lainnya' && !t.includes('dana darurat')) {
        accounts.push(
          akun(`Tabungan: ${t}`, 'tabungan_investasi', 'savings', '🎯', '#8b5cf6', 0,
            'Tabungan & Investasi')
        )
      }
    })
  }

  // Sub-akun investasi aktif dari registrasi
  const investasi = profile.investasi_aktif || []
  if (Array.isArray(investasi) && !investasi.includes('Belum berinvestasi')) {
    investasi.forEach(inv => {
      if (inv) {
        accounts.push(
          akun(`Investasi: ${inv}`, 'tabungan_investasi', 'savings', '📊', '#8b5cf6', 0,
            'Tabungan & Investasi')
        )
      }
    })
  }

  // ══════════════════════════════════════════════════════════
  // INDUK 4: UTANG & CICILAN
  // ══════════════════════════════════════════════════════════
  accounts.push(
    akun('Utang & Cicilan', 'utang_cicilan', 'debt', '🏦', '#ef4444')
  )
  if (profile.status_tempat === 'KPR / Kredit Rumah') {
    accounts.push(
      akun('Cicilan KPR', 'utang_cicilan', 'debt', '🏠', '#ef4444',
        profile.cicilan_kpr || 0, 'Utang & Cicilan')
    )
  }
  const punyaCicilanKendaraan = Array.isArray(kendaraan)
    ? kendaraan.some(k => k && k.includes('kredit'))
    : false
  if (punyaCicilanKendaraan) {
    accounts.push(
      akun('Cicilan Kendaraan', 'utang_cicilan', 'debt', '🚗', '#ef4444',
        profile.cicilan_kendaraan || 0, 'Utang & Cicilan')
    )
  }
  if (profile.punya_kartu_kredit) {
    accounts.push(
      akun('Kartu Kredit', 'utang_cicilan', 'debt', '💳', '#ef4444', 0, 'Utang & Cicilan')
    )
  }

  // ══════════════════════════════════════════════════════════
  // INDUK 5: PENGELUARAN TERSIER
  // ══════════════════════════════════════════════════════════
  accounts.push(
    akun('Pengeluaran Tersier', 'tersier', 'expense', '🎮', '#f59e0b',
      0, null, false, 1, 'Tidak masuk perhitungan dana darurat')
  )
  accounts.push(
    akun('Hiburan & Entertainment', 'tersier', 'expense', '🎬', '#f59e0b', 0, 'Pengeluaran Tersier')
  )
  accounts.push(
    akun('Makan di Luar & Ngopi', 'tersier', 'expense', '☕', '#f59e0b', 0, 'Pengeluaran Tersier')
  )
  accounts.push(
    akun('Gaya Hidup & Perawatan', 'tersier', 'expense', '💄', '#f59e0b', 0, 'Pengeluaran Tersier')
  )

  return accounts
}
