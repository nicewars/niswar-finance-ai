import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import AuthBackground from '@/components/AuthBackground'
import { REGULATIONS_2026 } from '@/lib/regulations'
import { getUMPbyProvinsi, getUMKbyKota, getEffectiveWageForBPJS, getEffectiveWageForBPJSTK } from '@/lib/ump-data'
import { supabase } from '@/lib/supabase'

// Shortcut alias supaya pemakaian regulasi di kode lebih singkat
const BPJS_KES = REGULATIONS_2026.bpjsKesehatan
const BPJS_TK = REGULATIONS_2026.bpjsKetenagakerjaan

// =========================================================
// KONSTANTA UI (bukan regulasi)
// =========================================================
const STORAGE_KEY = 'register_individu_form'
const STEP_LABELS = ['Identitas & Domisili', 'Karir', 'Aset & Proteksi', 'Target']
const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya']
const STATUS_OPTIONS = ['Lajang', 'Menikah', 'Cerai', 'Janda/Duda']
const PENDIDIKAN_OPTIONS = ['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3']
const FREKUENSI_OPTIONS = ['Bulanan', 'Mingguan', 'Per Proyek']
const PROVINSI_OPTIONS = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi',
  'Sumatera Selatan', 'Bengkulu', 'Lampung', 'Kepulauan Bangka Belitung',
  'Kepulauan Riau', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah',
  'DI Yogyakarta', 'Jawa Timur', 'Banten', 'Bali', 'Nusa Tenggara Barat',
  'Nusa Tenggara Timur', 'Kalimantan Barat', 'Kalimantan Tengah',
  'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan',
  'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat',
  'Maluku', 'Maluku Utara', 'Papua Barat', 'Papua Barat Daya',
  'Papua', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan',
]

// BPJS Kesehatan — opsi UI
const BPJS_KES_PESERTA_OPTIONS = ['Ya, peserta', 'Belum', 'Tidak akan ikut']
const BPJS_KES_STATUS_OPTIONS = [
  { value: 'PPU', label: 'PPU - Pekerja Penerima Upah', desc: 'Potongan dari gaji' },
  { value: 'PBPU', label: 'PBPU - Peserta Mandiri', desc: 'Bayar sendiri' },
  { value: 'PBI', label: 'PBI - Penerima Bantuan Iuran', desc: 'Gratis dari pemerintah' },
  { value: 'BP', label: 'BP - Bukan Pekerja', desc: 'Pensiunan, investor' },
]
const BPJS_KES_KELAS_OPTIONS = ['Kelas 1', 'Kelas 2', 'Kelas 3']
// Mapping label kelas ke key di regulations.js
const KELAS_TO_KEY = { 'Kelas 1': 'kelas1', 'Kelas 2': 'kelas2', 'Kelas 3': 'kelas3' }

// BPJS Ketenagakerjaan — opsi UI
const BPJS_TK_PESERTA_OPTIONS = ['Ya', 'Belum', 'Tidak relevan (bukan karyawan)']
const BPJS_TK_PROGRAM_OPTIONS = [
  { value: 'JHT', label: 'JHT - Jaminan Hari Tua', defaultChecked: true },
  { value: 'JP', label: 'JP - Jaminan Pensiun', defaultChecked: true },
  { value: 'JKK', label: 'JKK - Jaminan Kecelakaan Kerja', defaultChecked: true },
  { value: 'JKM', label: 'JKM - Jaminan Kematian', defaultChecked: true },
  { value: 'JKP', label: 'JKP - Jaminan Kehilangan Pekerjaan', defaultChecked: false },
]
const BPJS_TK_PROGRAM_DEFAULT = ['JHT', 'JP', 'JKK', 'JKM']
// Opsi risiko — tarif diambil dari regulations.js lewat key
const BPJS_TK_RISIKO_OPTIONS = [
  { value: 'Sangat Rendah', key: 'sangatRendah', desc: 'admin, guru, dosen, IT' },
  { value: 'Rendah', key: 'rendah', desc: 'sales, retail, customer service' },
  { value: 'Sedang', key: 'sedang', desc: 'teknisi, supir, lapangan ringan' },
  { value: 'Tinggi', key: 'tinggi', desc: 'pekerja pabrik, mekanik berat' },
  { value: 'Sangat Tinggi', key: 'sangatTinggi', desc: 'konstruksi, tambang, kelautan' },
]

// Step 3 — Aset & Proteksi
const STATUS_TEMPAT_OPTIONS = [
  'Rumah Sendiri (lunas)',
  'KPR / Kredit Rumah',
  'Sewa / Kontrak Bulanan',
  'Kost',
  'Tinggal dengan Orang Tua / Keluarga',
  'Lainnya',
]
const KENDARAAN_OPTIONS = [
  'Motor (tidak ada cicilan)',
  'Motor (masih kredit)',
  'Mobil (tidak ada cicilan)',
  'Mobil (masih kredit)',
  'Tidak punya kendaraan bermotor',
]
const DANA_DARURAT_OPTIONS = [
  'Belum ada',
  'Kurang dari 1 bulan',
  '1 - 3 bulan',
  '3 - 6 bulan',
  'Lebih dari 6 bulan',
]
const INVESTASI_OPTIONS = [
  'Deposito / Tabungan Berjangka',
  'Reksa Dana',
  'Saham',
  'Emas / Logam Mulia',
  'Obligasi / SBN',
  'Properti (selain tempat tinggal)',
  'Kripto',
  'Belum berinvestasi',
]

const inputClass = 'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 transition-colors outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

// =========================================================
// FORMAT HELPERS
// =========================================================
function formatRupiah(value) {
  if (value === '' || value === null || value === undefined) return ''
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function displayIDR(num) {
  const n = parseInt(num) || 0
  return 'Rp ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Format decimal (0.037) jadi persen Indonesia ("3,7%")
function formatPercent(decimal) {
  const num = decimal * 100
  const formatted = num.toFixed(2).replace(/\.?0+$/, '').replace('.', ',')
  return formatted + '%'
}

// Hitung label opsi risiko (dengan persen dari regulasi)
function getRisikoLabel(risiko) {
  const tarif = BPJS_TK.jkk.tarifRisiko[risiko.key]
  return `${risiko.value} (${formatPercent(tarif)}) - ${risiko.desc}`
}

// =========================================================
// CALCULATION HELPERS — semua angka dari REGULATIONS_2026
// =========================================================
export function calcPenghasilanTetap(formData) {
  const gaji = parseInt(formData.gaji_pokok || 0)
  const tunjangan = parseInt(formData.tunjangan_tetap || 0)
  return gaji + tunjangan
}

export function calcBPJSKesehatan(formData, umkManual = null) {
  if (formData.bpjs_kes_peserta !== 'Ya, peserta') return null

  const totalGajiTetap = calcPenghasilanTetap(formData)
  // BPJS Kesehatan: priority chain — umkManual > UMK database > UMP provinsi
  const wageInfo = getEffectiveWageForBPJS(
    totalGajiTetap,
    formData.provinsi,
    formData.kotaKabupaten,
    umkManual,
  )
  const upahEfektif = wageInfo.upahEfektif
  const sedangDiterapkanMinimum = upahEfektif > totalGajiTetap
  // Info sumber dasar perhitungan untuk ditampilkan di kartu (termasuk sumber/badge)
  const infoMinimum = wageInfo.nilaiMinimum > 0
    ? { label: wageInfo.label, nilai: wageInfo.nilaiMinimum, sumber: wageInfo.sumber }
    : null
  const status = formData.bpjs_kes_status

  if (status === 'PPU') {
    const upahDasar = Math.min(upahEfektif, BPJS_KES.batasAtasUpah)
    const tambahanJml = parseInt(formData.bpjs_kes_tambahan_keluarga || 0)
    const potonganGaji = Math.round(upahDasar * BPJS_KES.persenKaryawan)
    const dariPerusahaan = Math.round(upahDasar * BPJS_KES.persenPerusahaan)
    const tambahanKeluarga = Math.round(tambahanJml * BPJS_KES.persenTambahanKeluarga * upahDasar)
    const total = potonganGaji + dariPerusahaan + tambahanKeluarga
    return {
      jenis: 'PPU',
      upahDasar,
      tambahanJml,
      potonganGaji,
      dariPerusahaan,
      tambahanKeluarga,
      total,
      sedangDiterapkanMinimum,
      infoMinimum,
    }
  }

  if (status === 'PBPU') {
    const kelas = formData.bpjs_kes_kelas
    if (!kelas) return null
    const key = KELAS_TO_KEY[kelas]
    return {
      jenis: 'PBPU',
      kelas,
      iuran: BPJS_KES.iuranMandiri[key] || 0,
    }
  }

  if (status === 'PBI') return { jenis: 'PBI', total: 0 }
  if (status === 'BP') return { jenis: 'BP' }

  return null
}

export function calcBPJSKetenagakerjaan(formData) {
  if (formData.bpjs_tk_peserta !== 'Ya') return null

  const totalGajiTetap = calcPenghasilanTetap(formData)
  // BPJS Ketenagakerjaan: lantai = UMP Provinsi (tidak pakai UMK kota)
  const upahEfektif = getEffectiveWageForBPJSTK(totalGajiTetap, formData.provinsi)
  const sedangDiterapkanMinimum = upahEfektif > totalGajiTetap
  // Info sumber dasar untuk ditampilkan di kartu
  const umpProvinsi = getUMPbyProvinsi(formData.provinsi)
  const infoMinimum = umpProvinsi
    ? { label: `UMP ${formData.provinsi}`, nilai: umpProvinsi }
    : null

  const programs = formData.bpjs_tk_program ?? BPJS_TK_PROGRAM_DEFAULT
  const risikoData = BPJS_TK_RISIKO_OPTIONS.find((r) => r.value === formData.bpjs_tk_risiko)
  const tarifJKK = risikoData ? BPJS_TK.jkk.tarifRisiko[risikoData.key] : 0

  const result = { programs, totalPotonganGaji: 0, totalPerusahaan: 0, sedangDiterapkanMinimum, infoMinimum }

  if (programs.includes('JHT')) {
    result.jhtGaji = Math.round(upahEfektif * BPJS_TK.jht.persenKaryawan)
    result.jhtPerusahaan = Math.round(upahEfektif * BPJS_TK.jht.persenPerusahaan)
    result.totalPotonganGaji += result.jhtGaji
    result.totalPerusahaan += result.jhtPerusahaan
  }
  if (programs.includes('JP')) {
    const upahJP = Math.min(upahEfektif, BPJS_TK.jp.batasAtasUpah)
    result.jpGaji = Math.round(upahJP * BPJS_TK.jp.persenKaryawan)
    result.jpPerusahaan = Math.round(upahJP * BPJS_TK.jp.persenPerusahaan)
    result.jpUpahDasar = upahJP
    result.totalPotonganGaji += result.jpGaji
    result.totalPerusahaan += result.jpPerusahaan
  }
  if (programs.includes('JKK')) {
    result.jkk = Math.round(upahEfektif * tarifJKK)
    result.jkkTarif = tarifJKK
    result.totalPerusahaan += result.jkk
  }
  if (programs.includes('JKM')) {
    result.jkm = Math.round(upahEfektif * BPJS_TK.jkm.persenPerusahaan)
    result.totalPerusahaan += result.jkm
  }
  // JKP: iuran ditanggung pemerintah + rekomposisi, tidak nambah ke karyawan/perusahaan

  return result
}

// =========================================================
// LOAD FROM LOCALSTORAGE
// =========================================================
function loadFormData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

// =========================================================
// PROGRESS BAR
// =========================================================
function ProgressBar({ currentStep }) {
  return (
    <div className="flex items-start justify-between mb-8">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = idx + 1
        const isDone = stepNum < currentStep
        const isActive = stepNum === currentStep

        return (
          <div key={label} className="flex-1 flex flex-col items-center relative">
            {idx < STEP_LABELS.length - 1 && (
              <div className={`absolute top-4 left-1/2 w-full h-0.5 ${isDone ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
            <div
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                isDone ? 'bg-green-500 text-white' : isActive ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isDone ? <Check size={18} /> : stepNum}
            </div>
            <span
              className={`mt-2 text-xs font-medium text-center ${
                isActive ? 'text-indigo-600' : isDone ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// =========================================================
// SHARED UI HELPERS
// =========================================================
function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-500">{message}</p>
}

function PillGroup({ id, options, value, onChange }) {
  return (
    <div id={id} className="flex flex-col sm:flex-row gap-2">
      {options.map((option) => {
        const isSelected = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
              isSelected
                ? 'bg-indigo-500 text-white border-indigo-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mt-8 mb-3 pb-2 border-b border-gray-200">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function CalcRow({ label, amount, bold }) {
  return (
    <div className={`flex justify-between items-center py-1 ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
      <span className="text-xs sm:text-sm">{label}</span>
      <span className="text-xs sm:text-sm font-mono whitespace-nowrap ml-2">{amount}</span>
    </div>
  )
}

// Info card UMP/UMK — muncul otomatis setelah user memilih provinsi
function UMPInfoCard({ provinsi, kotaKabupaten }) {
  const ump = getUMPbyProvinsi(provinsi)
  const umk = getUMKbyKota(kotaKabupaten)
  const kotaLabel = kotaKabupaten?.trim() || null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-1.5">
      <p className="text-xs font-semibold text-blue-800 mb-1">
        📊 Upah Minimum yang terdeteksi otomatis dari domisili Anda:
      </p>

      {/* Baris BPJS Ketenagakerjaan — selalu pakai UMP provinsi */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-blue-700 flex-1">BPJS Ketenagakerjaan — UMP {provinsi}:</span>
        <span className="text-xs font-semibold text-blue-900 whitespace-nowrap font-mono">
          {ump ? displayIDR(ump) : '—'}
        </span>
      </div>

      {/* Baris BPJS Kesehatan — UMK kota jika ada, fallback UMP */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-blue-700 flex-1">
          {umk && kotaLabel
            ? `BPJS Kesehatan — UMK ${kotaLabel}:`
            : `BPJS Kesehatan — ${kotaLabel ? `UMK ${kotaLabel} belum tersedia, pakai UMP ${provinsi}:` : `UMP ${provinsi} (isi kota untuk cek UMK):`}`}
        </span>
        <span className="text-xs font-semibold text-blue-900 whitespace-nowrap font-mono">
          {umk ? displayIDR(umk) : ump ? displayIDR(ump) : '—'}
        </span>
      </div>

      <p className="text-[10px] text-blue-500 pt-0.5">
        Terdeteksi otomatis dari domisili Anda · Data UMP/UMK 2026
      </p>
    </div>
  )
}

// =========================================================
// STEP 1 — IDENTITAS DIRI
// =========================================================
function Step1({ formData, updateField, errors, today }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Identitas & Domisili</h2>

      <div>
        <Label htmlFor="nama_lengkap" className="block mb-1.5 text-sm font-medium text-gray-700">Nama Lengkap</Label>
        <input id="nama_lengkap" type="text" value={formData.nama_lengkap || ''}
          onChange={(e) => updateField('nama_lengkap', e.target.value)}
          placeholder="Masukkan nama lengkap" className={inputClass} />
        <FieldError message={errors.nama_lengkap} />
      </div>

      <div>
        <Label htmlFor="tanggal_lahir" className="block mb-1.5 text-sm font-medium text-gray-700">Tanggal Lahir</Label>
        <input id="tanggal_lahir" type="date" max={today} value={formData.tanggal_lahir || ''}
          onChange={(e) => updateField('tanggal_lahir', e.target.value)} className={inputClass} />
        <FieldError message={errors.tanggal_lahir} />
      </div>

      <div>
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">Jenis Kelamin</Label>
        <PillGroup id="jenis_kelamin" options={['Pria', 'Wanita']} value={formData.jenis_kelamin}
          onChange={(val) => updateField('jenis_kelamin', val)} />
        <FieldError message={errors.jenis_kelamin} />
      </div>

      <div>
        <Label htmlFor="agama" className="block mb-1.5 text-sm font-medium text-gray-700">Agama</Label>
        <select id="agama" value={formData.agama || ''} onChange={(e) => updateField('agama', e.target.value)} className={inputClass}>
          <option value="">Pilih agama...</option>
          {AGAMA_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <FieldError message={errors.agama} />
      </div>

      <div>
        <Label htmlFor="status_pernikahan" className="block mb-1.5 text-sm font-medium text-gray-700">Status Pernikahan</Label>
        <select id="status_pernikahan" value={formData.status_pernikahan || ''}
          onChange={(e) => updateField('status_pernikahan', e.target.value)} className={inputClass}>
          <option value="">Pilih status...</option>
          {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <FieldError message={errors.status_pernikahan} />
      </div>

      <div>
        <Label htmlFor="jumlah_tanggungan" className="block mb-1.5 text-sm font-medium text-gray-700">Jumlah Tanggungan</Label>
        <input id="jumlah_tanggungan" type="number" min="0" max="10" value={formData.jumlah_tanggungan ?? ''}
          onChange={(e) => updateField('jumlah_tanggungan', e.target.value)} placeholder="0" className={inputClass} />
        <p className="mt-1 text-xs text-gray-500">Jumlah anggota keluarga yang Anda biayai</p>
        <FieldError message={errors.jumlah_tanggungan} />
      </div>

      {/* ─────────────────────────────────────────────────── */}
      {/* DOMISILI — diisi di sini agar perhitungan BPJS     */}
      {/* sudah akurat sejak Step 2                          */}
      {/* ─────────────────────────────────────────────────── */}
      <SectionHeader
        title="Domisili"
        subtitle="Dipakai untuk UMP/UMK dan fitur lokasi. Provinsi wajib diisi."
      />

      <div>
        <Label htmlFor="provinsi" className="block mb-1.5 text-sm font-medium text-gray-700">
          Provinsi Domisili
        </Label>
        <select
          id="provinsi"
          value={formData.provinsi || ''}
          onChange={(e) => updateField('provinsi', e.target.value)}
          className={inputClass}
        >
          <option value="">Pilih provinsi tempat tinggal</option>
          {PROVINSI_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <FieldError message={errors.provinsi} />
      </div>

      <div>
        <Label htmlFor="kotaKabupaten" className="block mb-1.5 text-sm font-medium text-gray-700">
          Kabupaten / Kota Domisili
        </Label>
        <input
          id="kotaKabupaten"
          type="text"
          value={formData.kotaKabupaten || ''}
          onChange={(e) => updateField('kotaKabupaten', e.target.value)}
          placeholder="Contoh: Kota Depok, Kabupaten Bogor"
          className={inputClass}
        />
        <FieldError message={errors.kotaKabupaten} />
      </div>

      <div>
        <Label htmlFor="kodePos" className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700">
          Kode Pos
          <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">Opsional</span>
        </Label>
        <input
          id="kodePos"
          type="text"
          inputMode="numeric"
          value={formData.kodePos || ''}
          onChange={(e) => updateField('kodePos', e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="Contoh: 16412"
          maxLength={5}
          className={inputClass}
        />
      </div>

      {/* Info card UMP/UMK — muncul otomatis setelah provinsi dipilih */}
      {formData.provinsi && (
        <UMPInfoCard provinsi={formData.provinsi} kotaKabupaten={formData.kotaKabupaten} />
      )}
    </div>
  )
}

// =========================================================
// SECTION: PENGHASILAN BULANAN
// =========================================================
function PenghasilanSection({ formData, updateField, errors, umkManual }) {
  const totalTetap = calcPenghasilanTetap(formData)

  return (
    <>
      <SectionHeader title="Penghasilan Bulanan" subtitle="Penghasilan tetap yang Anda terima setiap bulan" />

      <div>
        <Label htmlFor="gaji_pokok" className="block mb-1.5 text-sm font-medium text-gray-700">Gaji Pokok</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">Rp</span>
          <input
            id="gaji_pokok"
            type="text"
            inputMode="numeric"
            value={formatRupiah(formData.gaji_pokok)}
            onChange={(e) => updateField('gaji_pokok', e.target.value.replace(/\D/g, ''))}
            placeholder="0"
            className={inputClass + ' pl-10'}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">Gaji dasar tanpa tunjangan apapun</p>
        <FieldError message={errors.gaji_pokok} />
      </div>

      <div>
        <Label htmlFor="tunjangan_tetap" className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700">
          Total Tunjangan Tetap
          <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">Opsional</span>
          <span
            title="Tunjangan dengan nominal tetap setiap bulan, bukan yang berubah-ubah seperti lembur"
            className="inline-flex items-center cursor-help"
          >
            <Info size={14} className="text-gray-400" />
          </span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">Rp</span>
          <input
            id="tunjangan_tetap"
            type="text"
            inputMode="numeric"
            value={formatRupiah(formData.tunjangan_tetap)}
            onChange={(e) => updateField('tunjangan_tetap', e.target.value.replace(/\D/g, ''))}
            placeholder="0"
            className={inputClass + ' pl-10'}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Tunjangan jabatan, keluarga, transport tetap, makan tetap, dll yang nominalnya sama setiap bulan
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-indigo-900">Total Penghasilan Bulanan Tetap</span>
          <span className="text-lg font-bold text-indigo-600 font-mono">{displayIDR(totalTetap)}</span>
        </div>
        <p className="text-[11px] text-indigo-700/70 mt-2 leading-relaxed">
          💡 Insentif tidak tetap (lembur, bonus, komisi) tidak ditanyakan di sini. AI akan menanyakannya di awal setiap bulan.
        </p>
      </div>
    </>
  )
}

// =========================================================
// SECTION: BPJS KESEHATAN
// =========================================================
function BPJSKesehatanSection({ formData, updateField, errors, umkManual }) {
  const calc = calcBPJSKesehatan(formData, umkManual)
  const isPeserta = formData.bpjs_kes_peserta === 'Ya, peserta'

  return (
    <>
      <SectionHeader title="BPJS Kesehatan" subtitle="Jaminan kesehatan nasional" />

      <div>
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">Apakah Anda peserta BPJS Kesehatan?</Label>
        <PillGroup
          id="bpjs_kes_peserta"
          options={BPJS_KES_PESERTA_OPTIONS}
          value={formData.bpjs_kes_peserta}
          onChange={(val) => updateField('bpjs_kes_peserta', val)}
        />
      </div>

      {isPeserta && (
        <>
          <div>
            <Label htmlFor="bpjs_kes_status" className="block mb-1.5 text-sm font-medium text-gray-700">
              Status Kepesertaan
            </Label>
            <select
              id="bpjs_kes_status"
              value={formData.bpjs_kes_status || ''}
              onChange={(e) => updateField('bpjs_kes_status', e.target.value)}
              className={inputClass}
            >
              <option value="">Pilih status...</option>
              {BPJS_KES_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.desc})
                </option>
              ))}
            </select>
            <FieldError message={errors.bpjs_kes_status} />
          </div>

          {formData.bpjs_kes_status === 'PBPU' && (
            <div>
              <Label className="block mb-1.5 text-sm font-medium text-gray-700">Kelas</Label>
              <PillGroup
                id="bpjs_kes_kelas"
                options={BPJS_KES_KELAS_OPTIONS}
                value={formData.bpjs_kes_kelas}
                onChange={(val) => updateField('bpjs_kes_kelas', val)}
              />
              <FieldError message={errors.bpjs_kes_kelas} />
            </div>
          )}

          <div>
            <Label htmlFor="bpjs_kes_tambahan_keluarga" className="block mb-1.5 text-sm font-medium text-gray-700">
              Jumlah Anggota Keluarga Tambahan
            </Label>
            <input
              id="bpjs_kes_tambahan_keluarga"
              type="number"
              min="0"
              max="10"
              value={formData.bpjs_kes_tambahan_keluarga ?? ''}
              onChange={(e) => updateField('bpjs_kes_tambahan_keluarga', e.target.value)}
              placeholder="0"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">
              Di luar 5 default (peserta + pasangan + 3 anak). Misalnya orang tua atau anak ke-4 yang ditanggung
            </p>
          </div>

          {calc && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-sky-900 mb-3">💙 Estimasi Iuran BPJS Kesehatan Anda</h4>

              {calc.jenis === 'PPU' && (
                <div className="space-y-1">
                  {/* Badge sumber data UMK/UMP */}
                  {calc.infoMinimum && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        calc.infoMinimum.sumber === 'ump_fallback'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {calc.infoMinimum.sumber === 'umk_manual'   && '✏️ UMK Manual'}
                        {calc.infoMinimum.sumber === 'umk_database' && '🔍 UMK Database'}
                        {calc.infoMinimum.sumber === 'ump_fallback' && '⚠️ UMP Fallback'}
                      </span>
                      {calc.infoMinimum.sumber === 'ump_fallback' && (
                        <a
                          href="/settings/profil"
                          className="text-[10px] text-amber-600 underline hover:text-amber-800"
                        >
                          Override manual di Settings
                        </a>
                      )}
                    </div>
                  )}
                  {calc.sedangDiterapkanMinimum && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-2">
                      ⚠️ Iuran dihitung dari UMP/UMK karena gaji di bawah upah minimum. Ini sesuai ketentuan BPJS.
                    </p>
                  )}
                  <p className="text-xs text-sky-700 mb-2">
                    {calc.infoMinimum ? (
                      <>
                        Dasar BPJS Kes:{' '}
                        <span className="font-medium">{calc.infoMinimum.label}</span>{' '}
                        {displayIDR(calc.infoMinimum.nilai)}
                        {' — '}upah dasar: {displayIDR(calc.upahDasar)}
                        {calc.upahDasar === BPJS_KES.batasAtasUpah && ' (batas maksimal)'}
                      </>
                    ) : (
                      <>Dasar perhitungan: {displayIDR(calc.upahDasar)}{calc.upahDasar === BPJS_KES.batasAtasUpah && ' (batas maksimal)'}</>
                    )}
                  </p>
                  <CalcRow
                    label={`Potongan dari gaji (${formatPercent(BPJS_KES.persenKaryawan)})`}
                    amount={displayIDR(calc.potonganGaji)}
                  />
                  <CalcRow
                    label={`Ditanggung perusahaan (${formatPercent(BPJS_KES.persenPerusahaan)})`}
                    amount={displayIDR(calc.dariPerusahaan)}
                  />
                  {calc.tambahanJml > 0 && (
                    <CalcRow
                      label={`Tambahan keluarga (${calc.tambahanJml} × ${formatPercent(BPJS_KES.persenTambahanKeluarga)})`}
                      amount={displayIDR(calc.tambahanKeluarga)}
                    />
                  )}
                  <div className="border-t border-sky-200 mt-2 pt-2">
                    <CalcRow label="Total iuran bulanan" amount={displayIDR(calc.total)} bold />
                  </div>
                </div>
              )}

              {calc.jenis === 'PBPU' && (
                <div className="space-y-1">
                  <p className="text-xs text-sky-700 mb-2">Iuran tetap sesuai kelas ({calc.kelas})</p>
                  <CalcRow label="Iuran bulanan (bayar mandiri)" amount={displayIDR(calc.iuran)} bold />
                  {calc.kelas === 'Kelas 3' && (
                    <p className="text-[11px] text-sky-600 mt-2">* Sudah dikurangi subsidi pemerintah Rp 7.000</p>
                  )}
                </div>
              )}

              {calc.jenis === 'PBI' && (
                <p className="text-sm text-sky-800">
                  ✨ Iuran ditanggung sepenuhnya oleh pemerintah. Anda tidak perlu membayar.
                </p>
              )}

              {calc.jenis === 'BP' && (
                <p className="text-sm text-sky-800">
                  Iuran tergantung kategori (pensiunan/investor). Cek di laman BPJS untuk detail tarif.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}

// =========================================================
// SECTION: BPJS KETENAGAKERJAAN
// =========================================================
function BPJSKetenagakerjaanSection({ formData, updateField, errors }) {
  const isPeserta = formData.bpjs_tk_peserta === 'Ya'

  useEffect(() => {
    if (isPeserta && formData.bpjs_tk_program === undefined) {
      updateField('bpjs_tk_program', [...BPJS_TK_PROGRAM_DEFAULT])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPeserta])

  const programs = formData.bpjs_tk_program ?? BPJS_TK_PROGRAM_DEFAULT
  const calc = calcBPJSKetenagakerjaan(formData)

  function toggleProgram(programValue) {
    const next = programs.includes(programValue)
      ? programs.filter((p) => p !== programValue)
      : [...programs, programValue]
    updateField('bpjs_tk_program', next)
  }

  return (
    <>
      <SectionHeader title="BPJS Ketenagakerjaan" subtitle="Jaminan sosial tenaga kerja" />

      <div>
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">Apakah Anda peserta BPJS Ketenagakerjaan?</Label>
        <PillGroup
          id="bpjs_tk_peserta"
          options={BPJS_TK_PESERTA_OPTIONS}
          value={formData.bpjs_tk_peserta}
          onChange={(val) => updateField('bpjs_tk_peserta', val)}
        />
      </div>

      {isPeserta && (
        <>
          <div>
            <Label className="block mb-1.5 text-sm font-medium text-gray-700">Program yang Diikuti</Label>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              {BPJS_TK_PROGRAM_OPTIONS.map((prog) => (
                <label
                  key={prog.value}
                  className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
                >
                  <Checkbox
                    id={`bpjs_tk_prog_${prog.value}`}
                    checked={programs.includes(prog.value)}
                    onCheckedChange={() => toggleProgram(prog.value)}
                  />
                  <span className="text-sm text-gray-700">{prog.label}</span>
                  {!prog.defaultChecked && (
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">Opsional</span>
                  )}
                </label>
              ))}
            </div>
            <FieldError message={errors.bpjs_tk_program} />
          </div>

          {programs.includes('JKK') && (
            <div>
              <Label htmlFor="bpjs_tk_risiko" className="block mb-1.5 text-sm font-medium text-gray-700">
                Tingkat Risiko Pekerjaan (untuk JKK)
              </Label>
              <select
                id="bpjs_tk_risiko"
                value={formData.bpjs_tk_risiko || ''}
                onChange={(e) => updateField('bpjs_tk_risiko', e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih tingkat risiko...</option>
                {BPJS_TK_RISIKO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{getRisikoLabel(opt)}</option>
                ))}
              </select>
              <FieldError message={errors.bpjs_tk_risiko} />
            </div>
          )}

          {calc && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-emerald-900 mb-3">💚 Estimasi Iuran BPJS Ketenagakerjaan Bulanan</h4>

              <div className="space-y-2">
                {programs.includes('JHT') && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 mb-0.5">JHT (Jaminan Hari Tua)</p>
                    <CalcRow
                      label={`Potongan gaji (${formatPercent(BPJS_TK.jht.persenKaryawan)})`}
                      amount={displayIDR(calc.jhtGaji)}
                    />
                    <CalcRow
                      label={`Ditanggung perusahaan (${formatPercent(BPJS_TK.jht.persenPerusahaan)})`}
                      amount={displayIDR(calc.jhtPerusahaan)}
                    />
                  </div>
                )}

                {programs.includes('JP') && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 mb-0.5 mt-2">JP (Jaminan Pensiun)</p>
                    <CalcRow
                      label={`Potongan gaji ${formatPercent(BPJS_TK.jp.persenKaryawan)} ${
                        calc.jpUpahDasar === BPJS_TK.jp.batasAtasUpah
                          ? `(max upah ${displayIDR(BPJS_TK.jp.batasAtasUpah)})`
                          : ''
                      }`}
                      amount={displayIDR(calc.jpGaji)}
                    />
                    <CalcRow
                      label={`Ditanggung perusahaan (${formatPercent(BPJS_TK.jp.persenPerusahaan)})`}
                      amount={displayIDR(calc.jpPerusahaan)}
                    />
                  </div>
                )}

                {programs.includes('JKK') && calc.jkkTarif > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 mb-0.5 mt-2">JKK (Jaminan Kecelakaan Kerja)</p>
                    <CalcRow
                      label={`Ditanggung perusahaan (${formatPercent(calc.jkkTarif)})`}
                      amount={displayIDR(calc.jkk)}
                    />
                  </div>
                )}

                {programs.includes('JKM') && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 mb-0.5 mt-2">JKM (Jaminan Kematian)</p>
                    <CalcRow
                      label={`Ditanggung perusahaan (${formatPercent(BPJS_TK.jkm.persenPerusahaan)})`}
                      amount={displayIDR(calc.jkm)}
                    />
                  </div>
                )}

                {programs.includes('JKP') && (
                  <p className="text-[11px] text-emerald-700 mt-1">
                    JKP: iuran ditanggung pemerintah (realokasi dari JHT &amp; JKK), tidak menambah potongan
                  </p>
                )}
              </div>

              <div className="border-t border-emerald-200 mt-3 pt-3">
                {calc.infoMinimum && (
                  <p className="text-[11px] text-emerald-700 mb-2">
                    Dasar BPJS TK:{' '}
                    <span className="font-medium">{calc.infoMinimum.label}</span>{' '}
                    {displayIDR(calc.infoMinimum.nilai)}
                  </p>
                )}
                {calc.sedangDiterapkanMinimum && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-2">
                    ⚠️ Iuran dihitung dari UMP/UMK karena gaji di bawah upah minimum. Ini sesuai ketentuan BPJS.
                  </p>
                )}
                <CalcRow label="Total potongan dari gaji Anda" amount={displayIDR(calc.totalPotonganGaji)} bold />
                <CalcRow label="Total dibayar perusahaan" amount={displayIDR(calc.totalPerusahaan)} bold />
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

// =========================================================
// STEP 2 — KARIR & FINANSIAL
// =========================================================
function Step2({ formData, updateField, errors, umkManual }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Karir & Finansial</h2>

      <div>
        <Label htmlFor="pekerjaan" className="block mb-1.5 text-sm font-medium text-gray-700">Pekerjaan</Label>
        <input id="pekerjaan" type="text" value={formData.pekerjaan || ''}
          onChange={(e) => updateField('pekerjaan', e.target.value)}
          placeholder="Contoh: Karyawan Swasta, Wiraswasta, PNS, Freelancer" className={inputClass} />
        <FieldError message={errors.pekerjaan} />
      </div>

      <div>
        <Label htmlFor="pendidikan" className="block mb-1.5 text-sm font-medium text-gray-700">Tingkat Pendidikan</Label>
        <select id="pendidikan" value={formData.pendidikan || ''}
          onChange={(e) => updateField('pendidikan', e.target.value)} className={inputClass}>
          <option value="">Pilih pendidikan...</option>
          {PENDIDIKAN_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <FieldError message={errors.pendidikan} />
      </div>

      <PenghasilanSection formData={formData} updateField={updateField} errors={errors} umkManual={umkManual} />

      <div className="pt-2">
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">Frekuensi Gajian</Label>
        <PillGroup
          id="frekuensi_gajian"
          options={FREKUENSI_OPTIONS}
          value={formData.frekuensi_gajian}
          onChange={(val) => updateField('frekuensi_gajian', val)}
        />
        <FieldError message={errors.frekuensi_gajian} />
      </div>

      {formData.frekuensi_gajian === 'Bulanan' && (
        <div>
          <Label htmlFor="tanggal_gajian" className="block mb-1.5 text-sm font-medium text-gray-700">
            Tanggal gajian setiap bulan
          </Label>
          <input id="tanggal_gajian" type="number" min="1" max="31" value={formData.tanggal_gajian || ''}
            onChange={(e) => updateField('tanggal_gajian', e.target.value)} placeholder="25" className={inputClass} />
          <FieldError message={errors.tanggal_gajian} />
        </div>
      )}

      <div>
        <Label htmlFor="total_cicilan" className="block mb-1.5 text-sm font-medium text-gray-700">
          Total Cicilan per Bulan
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">Rp</span>
          <input
            id="total_cicilan"
            type="text"
            inputMode="numeric"
            value={formatRupiah(formData.total_cicilan)}
            onChange={(e) => updateField('total_cicilan', e.target.value.replace(/\D/g, ''))}
            placeholder="0"
            className={inputClass + ' pl-10'}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">Kosongkan jika tidak ada cicilan</p>
      </div>

      <div>
        <Label htmlFor="npwp" className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700">
          NPWP
          <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">Opsional</span>
        </Label>
        <input id="npwp" type="text" value={formData.npwp || ''}
          onChange={(e) => updateField('npwp', e.target.value)}
          placeholder="XX.XXX.XXX.X-XXX.XXX" className={inputClass} />
      </div>

      <BPJSKesehatanSection formData={formData} updateField={updateField} errors={errors} umkManual={umkManual} />
      <BPJSKetenagakerjaanSection formData={formData} updateField={updateField} errors={errors} />
    </div>
  )
}

// =========================================================
// STEP 3 — ASET & PROTEKSI
// =========================================================
function Step3({ formData, updateField, errors }) {
  const kendaraan = formData.kepemilikanKendaraan ?? []
  const adaKreditKendaraan = kendaraan.some((k) => k.includes('masih kredit'))
  const investasi = formData.investasiAktif ?? []

  function toggleKendaraan(opsi) {
    const next = kendaraan.includes(opsi)
      ? kendaraan.filter((k) => k !== opsi)
      : [...kendaraan, opsi]
    updateField('kepemilikanKendaraan', next)
  }

  function toggleInvestasi(opsi) {
    const next = investasi.includes(opsi)
      ? investasi.filter((i) => i !== opsi)
      : [...investasi, opsi]
    updateField('investasiAktif', next)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Aset &amp; Proteksi</h2>
      <p className="text-sm text-gray-500 mb-2">
        Membantu kami memahami kondisi keuangan Anda saat ini untuk analisis yang lebih akurat.
      </p>

      {/* ── Section 1: Tempat Tinggal ── */}
      <SectionHeader title="Tempat Tinggal" />

      <div>
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">
          Status Tempat Tinggal
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STATUS_TEMPAT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => updateField('statusTempat', opt)}
              className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer text-left ${
                formData.statusTempat === opt
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <FieldError message={errors.statusTempat} />
      </div>

      {formData.statusTempat === 'KPR / Kredit Rumah' && (
        <div>
          <Label htmlFor="cicilanKPR" className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700">
            Cicilan KPR per bulan
            <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">Opsional</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">Rp</span>
            <input
              id="cicilanKPR"
              type="text"
              inputMode="numeric"
              value={formatRupiah(formData.cicilanKPR)}
              onChange={(e) => updateField('cicilanKPR', e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className={inputClass + ' pl-10'}
            />
          </div>
        </div>
      )}

      {formData.statusTempat === 'Sewa / Kontrak Bulanan' && (
        <div>
          <Label htmlFor="biayaSewa" className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700">
            Biaya sewa / kontrak per bulan
            <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">Opsional</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">Rp</span>
            <input
              id="biayaSewa"
              type="text"
              inputMode="numeric"
              value={formatRupiah(formData.biayaSewa)}
              onChange={(e) => updateField('biayaSewa', e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className={inputClass + ' pl-10'}
            />
          </div>
        </div>
      )}

      {/* ── Section 2: Kendaraan ── */}
      <SectionHeader title="Kendaraan" />

      <div>
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">
          Kepemilikan Kendaraan
          <span className="ml-1.5 bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">Boleh pilih lebih dari satu</span>
        </Label>
        <div className="space-y-2 rounded-lg border border-gray-200 p-3">
          {KENDARAAN_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
              <Checkbox
                checked={kendaraan.includes(opt)}
                onCheckedChange={() => toggleKendaraan(opt)}
              />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {adaKreditKendaraan && (
        <div>
          <Label htmlFor="cicilanKendaraan" className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700">
            Total cicilan kendaraan per bulan
            <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">Opsional</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">Rp</span>
            <input
              id="cicilanKendaraan"
              type="text"
              inputMode="numeric"
              value={formatRupiah(formData.cicilanKendaraan)}
              onChange={(e) => updateField('cicilanKendaraan', e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className={inputClass + ' pl-10'}
            />
          </div>
        </div>
      )}

      {/* ── Section 3: Dana Darurat & Investasi ── */}
      <SectionHeader title="Dana Darurat &amp; Investasi" />

      <div>
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">
          Kalau penghasilanmu tiba-tiba berhenti bulan ini, keuanganmu bisa bertahan berapa lama?
        </Label>
        <div className="flex flex-col gap-2">
          {DANA_DARURAT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => updateField('danaDarurat', opt)}
              className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer text-left ${
                formData.danaDarurat === opt
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-gray-500">
          💡 Dana darurat idealnya 3–6 bulan pengeluaran bulanan. Data ini digunakan untuk rekomendasi AI.
        </p>
        <FieldError message={errors.danaDarurat} />
      </div>

      <div>
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">
          Instrumen investasi yang sedang Anda miliki:
          <span className="ml-1.5 bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">Opsional</span>
        </Label>
        <div className="space-y-2 rounded-lg border border-gray-200 p-3">
          {INVESTASI_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
              <Checkbox
                checked={investasi.includes(opt)}
                onCheckedChange={() => toggleInvestasi(opt)}
              />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Section 4: Proteksi ── */}
      <SectionHeader title="Proteksi" subtitle="Di luar BPJS yang sudah diisi di Step 2" />

      <div>
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">
          Apakah Anda memiliki asuransi jiwa swasta?{' '}
          <span className="text-[11px] font-normal text-gray-400">(di luar BPJS Ketenagakerjaan)</span>
        </Label>
        <PillGroup
          id="asuransiJiwa"
          options={['Ya, punya', 'Belum punya']}
          value={formData.asuransiJiwa}
          onChange={(val) => updateField('asuransiJiwa', val)}
        />
      </div>

      <div>
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">
          Apakah Anda memiliki asuransi kesehatan swasta?{' '}
          <span className="text-[11px] font-normal text-gray-400">(di luar BPJS Kesehatan)</span>
        </Label>
        <PillGroup
          id="asuransiKesehatan"
          options={['Ya, punya', 'Belum punya']}
          value={formData.asuransiKesehatan}
          onChange={(val) => updateField('asuransiKesehatan', val)}
        />
      </div>

      <div>
        <Label className="block mb-1.5 text-sm font-medium text-gray-700">
          Apakah Anda memiliki kartu kredit?
        </Label>
        <PillGroup
          id="punyaKartuKredit"
          options={['Ya', 'Tidak']}
          value={formData.punyaKartuKredit}
          onChange={(val) => updateField('punyaKartuKredit', val)}
        />
      </div>

      {formData.punyaKartuKredit === 'Ya' && (
        <div>
          <Label htmlFor="jumlahKartuKredit" className="flex items-center gap-2 mb-1.5 text-sm font-medium text-gray-700">
            Berapa kartu?
            <span className="bg-gray-100 text-gray-500 text-[10px] font-medium px-1.5 py-0.5 rounded">Opsional</span>
          </Label>
          <input
            id="jumlahKartuKredit"
            type="number"
            min="1"
            max="10"
            value={formData.jumlahKartuKredit ?? ''}
            onChange={(e) => updateField('jumlahKartuKredit', e.target.value)}
            placeholder="1"
            className={inputClass}
          />
        </div>
      )}
    </div>
  )
}

// =========================================================
// STEP PLACEHOLDER (step 4)
// =========================================================
function PlaceholderStep({ title }) {
  return (
    <div className="py-8 text-center">
      <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500 text-sm">Form step ini akan diimplementasi di tahap selanjutnya.</p>
    </div>
  )
}

// =========================================================
// MAIN COMPONENT
// =========================================================
function RegisterIndividu() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState(loadFormData)
  const [errors, setErrors] = useState({})
  // UMK manual — diambil dari Supabase jika user pernah override di /settings/profil
  const [umkManual, setUmkManual] = useState(null)
  // State loading saat submit di step terakhir
  const [submitting, setSubmitting] = useState(false)

  // Auto-save form ke localStorage setiap ada perubahan
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
  }, [formData])

  // Fetch umkManual dari Supabase (kalau user sudah pernah override di Settings)
  useEffect(() => {
    async function fetchUmkManual() {
      // Supabase belum dikonfigurasi — skip, app tetap jalan normal
      if (!supabase) return
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('profiles')
          .select('umk_manual')
          .eq('id', user.id)
          .single()
        if (data?.umk_manual) setUmkManual(data.umk_manual)
      } catch {
        // User belum login atau error jaringan — tidak apa-apa
      }
    }
    fetchUmkManual()
  }, [])

  function updateField(name, value) {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  function validateStep1() {
    const e = {}
    if (!formData.nama_lengkap?.trim()) e.nama_lengkap = 'Nama lengkap wajib diisi'
    if (!formData.tanggal_lahir) e.tanggal_lahir = 'Tanggal lahir wajib diisi'
    if (!formData.jenis_kelamin) e.jenis_kelamin = 'Pilih jenis kelamin'
    if (!formData.agama) e.agama = 'Pilih agama'
    if (!formData.status_pernikahan) e.status_pernikahan = 'Pilih status pernikahan'
    if (formData.jumlah_tanggungan === undefined || formData.jumlah_tanggungan === '') {
      e.jumlah_tanggungan = 'Isi jumlah tanggungan (boleh 0)'
    }
    if (!formData.provinsi) e.provinsi = 'Pilih provinsi domisili'
    if (!formData.kotaKabupaten?.trim()) e.kotaKabupaten = 'Isi kabupaten/kota domisili Anda'
    return e
  }

  function validateStep2() {
    const e = {}
    if (!formData.pekerjaan?.trim()) e.pekerjaan = 'Pekerjaan wajib diisi'
    if (!formData.pendidikan) e.pendidikan = 'Pilih tingkat pendidikan'
    if (!formData.gaji_pokok || parseInt(formData.gaji_pokok) <= 0) {
      e.gaji_pokok = 'Gaji pokok wajib diisi'
    }
    if (!formData.frekuensi_gajian) e.frekuensi_gajian = 'Pilih frekuensi gajian'
    if (formData.frekuensi_gajian === 'Bulanan' && !formData.tanggal_gajian) {
      e.tanggal_gajian = 'Isi tanggal gajian'
    }

    if (formData.bpjs_kes_peserta === 'Ya, peserta') {
      if (!formData.bpjs_kes_status) e.bpjs_kes_status = 'Pilih status kepesertaan'
      if (formData.bpjs_kes_status === 'PBPU' && !formData.bpjs_kes_kelas) {
        e.bpjs_kes_kelas = 'Pilih kelas'
      }
    }

    if (formData.bpjs_tk_peserta === 'Ya') {
      const programs = formData.bpjs_tk_program ?? BPJS_TK_PROGRAM_DEFAULT
      if (programs.length === 0) e.bpjs_tk_program = 'Pilih minimal 1 program'
      if (programs.includes('JKK') && !formData.bpjs_tk_risiko) {
        e.bpjs_tk_risiko = 'Pilih tingkat risiko pekerjaan'
      }
    }

    return e
  }

  function validateStep3() {
    const e = {}
    if (!formData.statusTempat) e.statusTempat = 'Pilih status tempat tinggal'
    if (!formData.danaDarurat)  e.danaDarurat  = 'Pilih estimasi dana darurat'
    return e
  }

  function scrollToFirstError(errs) {
    const first = Object.keys(errs)[0]
    if (first) {
      const el = document.getElementById(first)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function handleNext() {
    let errs = {}
    if (currentStep === 1) errs = validateStep1()
    else if (currentStep === 2) errs = validateStep2()
    else if (currentStep === 3) errs = validateStep3()

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      scrollToFirstError(errs)
      return
    }

    setErrors({})
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleSubmit()
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      // Supabase belum dikonfigurasi — beri tahu user dan tetap lanjut ke dashboard
      if (!supabase) {
        alert(
          'Database belum terhubung (Supabase belum dikonfigurasi).\n\n' +
          'Data Anda sudah tersimpan di perangkat ini. Koneksi database akan disetup di Minggu 4.'
        )
        navigate('/dashboard')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Sesi tidak ditemukan. Silakan login ulang.')
        navigate('/login')
        return
      }

      // Hitung deteksi UMP/UMK berdasarkan domisili yang diisi
      const detectedUmp = getUMPbyProvinsi(formData.provinsi) || null
      const detectedUmk = getUMKbyKota(formData.kotaKabupaten) || null
      const umkSource   = umkManual
        ? 'umk_manual'
        : detectedUmk
        ? 'umk_database'
        : 'ump_fallback'

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        // Data pribadi
        nama_lengkap:        formData.nama_lengkap,
        tanggal_lahir:       formData.tanggal_lahir,
        jenis_kelamin:       formData.jenis_kelamin,
        agama:               formData.agama,
        status_pernikahan:   formData.status_pernikahan,
        jumlah_tanggungan:   parseInt(formData.jumlah_tanggungan) || 0,
        // Domisili
        provinsi:            formData.provinsi,
        kota_kabupaten:      formData.kotaKabupaten,
        kode_pos:            formData.kodePos || null,
        // Karir
        pekerjaan:           formData.pekerjaan,
        pendidikan:          formData.pendidikan,
        frekuensi_gajian:    formData.frekuensi_gajian,
        tanggal_gajian:      parseInt(formData.tanggal_gajian) || null,
        // Finansial
        gaji_pokok:          parseInt(formData.gaji_pokok) || 0,
        tunjangan_tetap:     parseInt(formData.tunjangan_tetap) || 0,
        total_cicilan:       parseInt(formData.total_cicilan) || 0,
        npwp:                formData.npwp || null,
        // BPJS Kesehatan
        bpjs_kes_peserta:           formData.bpjs_kes_peserta,
        bpjs_kes_status:            formData.bpjs_kes_status || null,
        bpjs_kes_kelas:             formData.bpjs_kes_kelas || null,
        bpjs_kes_tambahan_keluarga: parseInt(formData.bpjs_kes_tambahan_keluarga) || 0,
        // BPJS Ketenagakerjaan
        bpjs_tk_peserta:  formData.bpjs_tk_peserta,
        bpjs_tk_program:  formData.bpjs_tk_program || null,
        bpjs_tk_risiko:   formData.bpjs_tk_risiko || null,
        // Deteksi UMP/UMK
        detected_ump: detectedUmp,
        detected_umk: detectedUmk,
        umk_manual:   umkManual || null,
        umk_source:   umkSource,
      })

      if (error) throw error

      // Hapus draft lokal setelah berhasil simpan
      localStorage.removeItem(STORAGE_KEY)
      navigate('/dashboard')
    } catch (err) {
      alert(`Gagal menyimpan data: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  function handlePrev() {
    if (currentStep === 1) {
      navigate('/register-type')
    } else {
      setCurrentStep(currentStep - 1)
      setErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const isLastStep = currentStep === 4

  return (
    <AuthBackground>
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-[560px] p-8 my-8">
        <ProgressBar currentStep={currentStep} />

        {currentStep === 1 && <Step1 formData={formData} updateField={updateField} errors={errors} today={today} />}
        {currentStep === 2 && <Step2 formData={formData} updateField={updateField} errors={errors} umkManual={umkManual} />}
        {currentStep === 3 && <Step3 formData={formData} updateField={updateField} errors={errors} />}
        {currentStep === 4 && <PlaceholderStep title="Target Finansial" />}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Sebelumnya
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-bold hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastStep ? (submitting ? 'Menyimpan...' : 'Daftar') : 'Lanjut'}
            {!isLastStep && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </AuthBackground>
  )
}

export default RegisterIndividu
