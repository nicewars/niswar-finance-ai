import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import './App.css'

function PlaceholderPage({ judul }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400 text-lg">{judul} — Coming Soon</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-type" element={<PlaceholderPage judul="Halaman Pilih Tipe Akun" />} />
        <Route path="/dashboard" element={<PlaceholderPage judul="Dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
