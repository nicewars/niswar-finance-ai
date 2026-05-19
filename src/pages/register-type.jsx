import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Building2, ArrowLeft } from 'lucide-react'
import AuthBackground from '@/components/AuthBackground'

function RegisterType() {
  const navigate = useNavigate()
  const [showToast, setShowToast] = useState(false)

  function handleBisnis() {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <AuthBackground>

      {/* Tombol kembali */}
      <button
        type="button"
        onClick={() => navigate('/login')}
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-white hover:opacity-75 transition-opacity cursor-pointer"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Kembali</span>
      </button>

      {/* Konten utama */}
      <div className="relative z-10 w-full max-w-2xl text-center">

        {/* Heading */}
        <h1 className="text-3xl font-bold text-white mb-2">
          Daftar sebagai apa?
        </h1>
        <p className="text-white/70 text-base mb-10">
          Pilih jenis akun yang sesuai kebutuhanmu
        </p>

        {/* Dua kartu */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">

          {/* Kartu Individu */}
          <div
            onClick={() => navigate('/register/individu')}
            className="relative bg-white rounded-2xl shadow-lg p-8 flex-1 cursor-pointer hover:scale-105 hover:shadow-2xl transition-all duration-200 text-left"
          >
            <span className="absolute top-4 right-4 bg-indigo-100 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full">
              Paling populer
            </span>
            <User size={64} className="text-indigo-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Individu / Pribadi
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Untuk keuangan pribadi, rumah tangga, dan perencanaan finansial
            </p>
          </div>

          {/* Kartu Bisnis */}
          <div
            onClick={handleBisnis}
            className="bg-white rounded-2xl shadow-lg p-8 flex-1 cursor-pointer hover:scale-105 hover:shadow-2xl transition-all duration-200 text-left"
          >
            <Building2 size={64} className="text-blue-900 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Bisnis / Usaha
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Untuk UMKM, freelance, dan manajemen keuangan usaha
            </p>
          </div>

        </div>

        {/* Link ke login */}
        <p className="text-white/70 text-sm mt-8">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-white font-bold hover:underline">
            Masuk di sini
          </Link>
        </p>

      </div>

      {/* Toast notifikasi Coming Soon */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl text-sm font-medium whitespace-nowrap">
          🚧 Fitur Bisnis segera hadir!
        </div>
      )}

    </AuthBackground>
  )
}

export default RegisterType
