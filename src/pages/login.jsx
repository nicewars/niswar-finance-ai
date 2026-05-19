import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Eye, EyeOff } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import AuthBackground from '@/components/AuthBackground'

// SVG logo Google colorful
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

function Login() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <AuthBackground>
      <div
        className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-[420px]"
        style={{ padding: '40px' }}
      >

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Wallet size={48} className="text-indigo-500" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Selamat Datang Kembali
        </h1>

        {/* Subtext */}
        <p className="text-sm text-gray-500 text-center mb-6">
          Masuk ke akun Finance Smart AI Anda
        </p>

        {/* Field Email */}
        <div className="mb-4">
          <Label htmlFor="email" className="block mb-1.5 text-sm font-medium text-gray-700">
            Email atau Username
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="email@contoh.com"
            className="w-full"
          />
        </div>

        {/* Field Password — pakai native input untuk hindari toggle ganda */}
        <div className="mb-5">
          <Label htmlFor="password" className="block mb-1.5 text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password"
              autoComplete="new-password"
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Ingat saya + Lupa password */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="text-sm font-normal text-gray-600 cursor-pointer">
              Ingat saya
            </Label>
          </div>
          <a href="#" className="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
            Lupa password?
          </a>
        </div>

        {/* Tombol Masuk */}
        <button
          type="button"
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold text-base hover:opacity-90 active:opacity-80 transition-opacity mb-4 cursor-pointer"
        >
          Masuk
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">atau</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Tombol Google */}
        <button
          type="button"
          className="w-full py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium text-base hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2 mb-6 cursor-pointer"
        >
          <GoogleIcon />
          Masuk dengan Google
        </button>

        {/* Link Daftar */}
        <p className="text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link
            to="/register-type"
            className="text-indigo-500 font-bold hover:text-indigo-700 transition-colors"
          >
            Daftar sekarang
          </Link>
        </p>

      </div>
    </AuthBackground>
  )
}

export default Login
