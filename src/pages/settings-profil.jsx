import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, MapPin, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import AuthBackground from '@/components/AuthBackground'
import { supabase } from '@/lib/supabase'
import { getUMPbyProvinsi, getUMKbyKota } from '@/lib/ump-data'

// ─── Format helpers ─────────────────────────────────────────
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

const inputClass =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 ' +
  'transition-colors outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

// ─── Badge sumber aktif ──────────────────────────────────────
function SourceBadge({ sumber }) {
  if (!sumber) return null
  const config = {
    umk_manual:   { label: '✏️ UMK Manual',   cls: 'bg-green-100 text-green-700' },
    umk_database: { label: '🔍 UMK Database', cls: 'bg-green-100 text-green-700' },
    ump_fallback: { label: '⚠️ UMP Fallback',  cls: 'bg-amber-100 text-amber-700' },
  }
  const { label, cls } = config[sumber] ?? config.ump_fallback
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

// ─── Main component ──────────────────────────────────────────
function SettingsProfil() {
  const navigate = useNavigate()
  const [profile, setProfile]           = useState(null)
  const [umkManualInput, setUmkManualInput] = useState('')
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [errorMsg, setErrorMsg]         = useState(null)

  // ── Fetch profil dari Supabase ───────────────────────────
  useEffect(() => {
    async function fetchProfile() {
      // Supabase belum dikonfigurasi — tampilkan pesan info, bukan error merah
      if (!supabase) {
        setErrorMsg(
          'Supabase belum dikonfigurasi. Halaman ini akan aktif setelah setup database (Minggu 4).'
        )
        setLoading(false)
        return
      }
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('provinsi, kota_kabupaten, detected_ump, detected_umk, umk_manual, umk_source')
          .eq('id', user.id)
          .single()
        if (error) throw error
        setProfile(data)
        if (data?.umk_manual) setUmkManualInput(String(data.umk_manual))
      } catch (err) {
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [navigate])

  // ── Simpan UMK manual ke Supabase ───────────────────────
  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setErrorMsg(null)
    try {
      if (!supabase) throw new Error('Supabase belum dikonfigurasi. Setup database dulu di Minggu 4.')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesi tidak ditemukan. Silakan login ulang.')

      const nilaiManual = umkManualInput ? parseInt(umkManualInput.replace(/\D/g, '')) : null
      const sumberBaru  = nilaiManual
        ? 'umk_manual'
        : profile?.detected_umk
        ? 'umk_database'
        : 'ump_fallback'

      const { error } = await supabase
        .from('profiles')
        .update({ umk_manual: nilaiManual || null, umk_source: sumberBaru })
        .eq('id', user.id)
      if (error) throw error

      setProfile((prev) => ({ ...prev, umk_manual: nilaiManual, umk_source: sumberBaru }))
      setSaved(true)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Reset ke default (hapus override manual) ─────────────
  function handleReset() {
    setUmkManualInput('')
    setSaved(false)
  }

  // ── Data untuk ditampilkan ───────────────────────────────
  const provinsi = profile?.provinsi
  const kota     = profile?.kota_kabupaten
  // Pakai detected_* dari DB kalau ada; fallback live lookup
  const ump  = provinsi ? (profile?.detected_ump  ?? getUMPbyProvinsi(provinsi)) : null
  const umkDb = kota    ? (profile?.detected_umk  ?? getUMKbyKota(kota))         : null

  return (
    <AuthBackground>
      <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-[480px] p-8 my-8">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Pengaturan UMK</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Override upah minimum untuk kalkulasi BPJS yang lebih akurat
            </p>
          </div>
        </div>

        {/* ── Loading ─────────────────────────────────────── */}
        {loading && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Memuat data profil...
          </div>
        )}

        {/* ── Error global ────────────────────────────────── */}
        {!loading && errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-4">
            ❌ {errorMsg}
          </div>
        )}

        {/* ── Konten utama ────────────────────────────────── */}
        {!loading && !errorMsg && (
          <>
            {/* Info domisili — read only */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <MapPin size={14} className="text-indigo-500" />
                <span className="text-xs font-semibold text-gray-700">Domisili Anda</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Provinsi</span>
                  <span className="text-xs font-medium text-gray-800">{provinsi || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">UMP {provinsi}</span>
                  <span className="text-xs font-semibold text-indigo-700 font-mono">
                    {ump ? displayIDR(ump) : '—'}
                  </span>
                </div>
                <div className="border-t border-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Kota / Kabupaten</span>
                  <span className="text-xs font-medium text-gray-800">{kota || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">UMK {kota}</span>
                  <span className="text-xs font-semibold text-indigo-700 font-mono">
                    {umkDb ? displayIDR(umkDb) : (
                      <span className="text-gray-400 font-normal">Belum ada di database</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Input override manual */}
            <div className="mb-5">
              <Label htmlFor="umk_manual" className="block mb-1.5 text-sm font-medium text-gray-700">
                UMK Manual (Override)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">
                  Rp
                </span>
                <input
                  id="umk_manual"
                  type="text"
                  inputMode="numeric"
                  value={formatRupiah(umkManualInput)}
                  onChange={(e) => {
                    setUmkManualInput(e.target.value.replace(/\D/g, ''))
                    setSaved(false)
                  }}
                  placeholder="Isi jika UMK Anda berbeda dari database"
                  className={inputClass + ' pl-10'}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-500">
                Gunakan ini jika UMK resmi kota Anda belum ada di database kami.
                Kosongkan untuk kembali ke UMK database / UMP provinsi.
              </p>
            </div>

            {/* Info priority chain */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <div className="text-[11px] text-blue-700 space-y-1">
                  <p className="font-semibold">Urutan prioritas kalkulasi BPJS Kesehatan:</p>
                  <p>1️⃣ UMK Manual (jika diisi) → 2️⃣ UMK Database → 3️⃣ UMP Provinsi</p>
                  <p className="text-blue-500">
                    BPJS Ketenagakerjaan selalu pakai UMP Provinsi (sesuai regulasi PP 44/2015).
                  </p>
                </div>
              </div>
            </div>

            {/* Status badge sumber aktif */}
            {profile?.umk_source && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[11px] text-gray-500">Sumber aktif saat ini:</span>
                <SourceBadge sumber={profile.umk_source} />
              </div>
            )}

            {/* Feedback sukses */}
            {saved && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 mb-4">
                ✅ UMK berhasil disimpan! Kalkulasi BPJS di form registrasi sudah diperbarui.
              </div>
            )}

            {/* Tombol aksi */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Reset ke Default
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                {saving ? 'Menyimpan...' : 'Simpan UMK'}
              </button>
            </div>
          </>
        )}
      </div>
    </AuthBackground>
  )
}

export default SettingsProfil
