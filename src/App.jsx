import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import RegisterType from './pages/register-type'
import RegisterIndividu from './pages/register-individu'
import Dashboard from './pages/dashboard'
import SettingsProfil from './pages/settings-profil'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-type" element={<RegisterType />} />
        <Route path="/register/individu" element={<RegisterIndividu />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings/profil" element={<SettingsProfil />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
