import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wallet, LogOut, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Cek session saat halaman dibuka ─────────────────────
  useEffect(() => {
    async function checkSession() {
      // Supabase belum dikonfigurasi — tampilkan dashboard kosong tanpa redirect
      if (!supabase) {
        setLoading(false)
        return
      }
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          navigate('/login')
          return
        }
        setUser(session.user)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [navigate])

  // ── Keluar / Sign out ────────────────────────────────────
  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut()
    }
    navigate('/login')
  }

  // ── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Memuat dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Wallet size={24} className="text-indigo-500" />
            <span className="font-bold text-gray-800 text-lg">Niswar Finance AI</span>
          </div>

          {/* Aksi kanan */}
          <div className="flex items-center gap-2">
            <Link
              to="/settings/profil"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <Settings size={16} />
              Pengaturan UMK
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* ── Konten utama ────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Sapaan */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Selamat datang! 👋
          </h1>
          {user && (
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          )}
        </div>

        {/* Banner sukses registrasi */}
        <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6">
          <p className="text-indigo-700 font-bold text-lg mb-1">🎉 Registrasi berhasil!</p>
          <p className="text-sm text-indigo-600">
            Profil keuangan Anda sudah tersimpan. Fitur dashboard lengkap (grafik, transaksi, AI insights)
            akan hadir di fase berikutnya.
          </p>
        </div>

        {/* Placeholder cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { judul: '💰 Ringkasan Keuangan',  desc: 'Grafik pemasukan & pengeluaran bulanan' },
            { judul: '📋 Transaksi Terbaru',    desc: 'Riwayat transaksi otomatis dicatat' },
            { judul: '🎯 Target Keuangan',      desc: 'Progress menuju tujuan keuangan Anda' },
            { judul: '🤖 AI Insights',          desc: 'Rekomendasi cerdas berdasarkan pola keuangan' },
            { judul: '📊 Laporan Bulanan',      desc: 'Laporan otomatis setiap awal bulan' },
            { judul: '⚡ BPJS & Pajak',         desc: 'Kalkulasi potongan real-time' },
          ].map(({ judul, desc }) => (
            <div key={judul} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-1.5">{judul}</h3>
              <p className="text-xs text-gray-400">{desc}</p>
              <div className="mt-4 h-1.5 rounded-full bg-gray-100">
                <div className="h-1.5 w-0 rounded-full bg-indigo-300" />
              </div>
              <p className="mt-1 text-[10px] text-gray-300">Segera hadir</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}

export default Dashboard
