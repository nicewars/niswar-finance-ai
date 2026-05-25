import { useNavigate, Link } from 'react-router-dom'
import {
  Wallet, ChevronRight, ChevronLeft,
  User, Bell, FileText, Info, LogOut,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Item menu tunggal ───────────────────────────────
function MenuItem({ icon: Icon, label, sub, to, onClick, danger }) {
  const baseClass =
    'flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-100 last:border-0 ' +
    'active:bg-gray-50 cursor-pointer transition-colors select-none'

  const inner = (
    <>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-50' : 'bg-indigo-50'}`}>
        <Icon size={18} className={danger ? 'text-red-500' : 'text-indigo-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-800'}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
      {!danger && <ChevronRight size={16} className="text-gray-300 shrink-0" />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={baseClass}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={`${baseClass} w-full text-left`}>
      {inner}
    </button>
  )
}

// ─── Halaman Settings ────────────────────────────────
function Settings() {
  const navigate = useNavigate()

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
    navigate('/login')
  }

  function handleComingSoon(fitur) {
    alert(`Fitur "${fitur}" akan segera hadir di update berikutnya! 🚀`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3.5 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Kembali"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-indigo-500" />
            <span className="font-bold text-gray-800 text-sm">Pengaturan</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Grup: Akun */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Akun</p>
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <MenuItem
              icon={User}
              label="Data Diri & Keuangan"
              sub="Edit profil, gaji, BPJS, dan target keuangan"
              to="/settings/profil"
            />
            <MenuItem
              icon={Bell}
              label="Notifikasi"
              sub="Peringatan anggaran, laporan bulanan, pengingat"
              onClick={() => handleComingSoon('Notifikasi')}
            />
          </div>
        </div>

        {/* Grup: Lainnya */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Lainnya</p>
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <MenuItem
              icon={FileText}
              label="Syarat & Ketentuan"
              sub="Kebijakan privasi dan penggunaan data"
              onClick={() => handleComingSoon('Syarat & Ketentuan')}
            />
            <MenuItem
              icon={Info}
              label="Tentang Smart Finance AI"
              sub="Versi 1.0.0 · Fase 1 — Setup & Fondasi"
              onClick={() => handleComingSoon('Tentang Aplikasi')}
            />
          </div>
        </div>

        {/* Tombol Keluar */}
        <div>
          <div className="rounded-2xl overflow-hidden border border-red-100 shadow-sm">
            <MenuItem
              icon={LogOut}
              label="Keluar"
              danger
              onClick={handleLogout}
            />
          </div>
        </div>

        {/* Footer versi */}
        <p className="text-center text-xs text-gray-300 pt-2">
          Smart Finance AI · v1.0.0
        </p>

      </main>
    </div>
  )
}

export default Settings
