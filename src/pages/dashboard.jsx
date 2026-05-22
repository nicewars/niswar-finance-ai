import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Wallet, LogOut, Settings, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Minus, AlertCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarRadiusAxis,
  AreaChart, Area,
} from 'recharts'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────────────
function idr(n) {
  if (n === null || n === undefined) return '—'
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}
function pct(n) { return (n || 0).toFixed(1) + '%' }

// ─────────────────────────────────────────────────────
// KALKULASI KEUANGAN — sumber tunggal semua angka
// ─────────────────────────────────────────────────────
const TARGET_PERSEN_MAP = {
  'Kurang dari 5% pendapatan':    5,
  '5% - 10% pendapatan':          7.5,
  '10% - 20% pendapatan':         15,
  '20% - 30% pendapatan':         25,
  'Lebih dari 30% pendapatan':    35,
}
const DANA_DARURAT_NILAI = {
  'Belum ada': 0, 'Kurang dari 1 bulan': 1,
  '1 - 3 bulan': 2, '3 - 6 bulan': 4, 'Lebih dari 6 bulan': 6,
}
const DANA_DARURAT_SKOR = {
  'Belum ada': 0, 'Kurang dari 1 bulan': 20,
  '1 - 3 bulan': 50, '3 - 6 bulan': 80, 'Lebih dari 6 bulan': 100,
}

function calcFinancial(profile) {
  if (!profile?.gaji_pokok) return null

  const gaji       = profile.gaji_pokok || 0
  const tunjangan  = profile.tunjangan_tetap || 0
  const totalPendapatan = gaji + tunjangan

  // BPJS Kesehatan
  const bpjsKesBase         = Math.min(totalPendapatan, 12_000_000)
  const bpjsKesKaryawan     = bpjsKesBase * 0.01
  const bpjsKesPerusahaan   = bpjsKesBase * 0.04

  // BPJS Ketenagakerjaan
  const bpjsJPBase          = Math.min(totalPendapatan, 11_086_300)
  const bpjsTKJHTKaryawan   = totalPendapatan * 0.02
  const bpjsTKJHTPerusahaan = totalPendapatan * 0.037
  const bpjsTKJPKaryawan    = bpjsJPBase * 0.01
  const bpjsTKJPPerusahaan  = bpjsJPBase * 0.02
  const bpjsTKJKM           = totalPendapatan * 0.003
  const bpjsTKKaryawan      = bpjsTKJHTKaryawan + bpjsTKJPKaryawan

  const cicilan = profile.total_cicilan || 0
  const totalPotonganKaryawan   = bpjsKesKaryawan + bpjsTKKaryawan + cicilan
  const totalPotonganPerusahaan = bpjsKesPerusahaan + bpjsTKJHTPerusahaan + bpjsTKJPPerusahaan + bpjsTKJKM

  const targetPersen     = TARGET_PERSEN_MAP[profile.target_tabungan] ?? 20
  const estimasiTabungan = totalPendapatan * (targetPersen / 100)
  const debtRatio        = totalPendapatan > 0 ? (cicilan / totalPendapatan) * 100 : 0
  const sisaGaji         = totalPendapatan - totalPotonganKaryawan - estimasiTabungan

  // PPh 21
  const tanggungan  = Math.min(parseInt(profile.jumlah_tanggungan) || 0, 3)
  const statusPajak = profile.status_pernikahan === 'Menikah' ? 'K' : 'TK'
  let ptkp = 54_000_000
  if (statusPajak === 'K') ptkp += 4_500_000
  ptkp += tanggungan * 4_500_000

  const penghasilanBruto = totalPendapatan * 12
  const biayaJabatan     = Math.min(penghasilanBruto * 0.05, 6_000_000)
  const penghasilanNeto  = penghasilanBruto - biayaJabatan - bpjsTKJPKaryawan * 12
  const pkp              = Math.max(penghasilanNeto - ptkp, 0)

  let pphTahunan = 0
  if      (pkp <= 60_000_000)        pphTahunan = pkp * 0.05
  else if (pkp <= 250_000_000)       pphTahunan = 3_000_000         + (pkp - 60_000_000)  * 0.15
  else if (pkp <= 500_000_000)       pphTahunan = 31_500_000        + (pkp - 250_000_000) * 0.25
  else if (pkp <= 5_000_000_000)     pphTahunan = 94_000_000        + (pkp - 500_000_000) * 0.30
  else                               pphTahunan = 1_444_000_000     + (pkp - 5_000_000_000) * 0.35
  const pphBulanan    = pphTahunan / 12
  const efektifPajak  = totalPendapatan > 0 ? (pphBulanan / totalPendapatan) * 100 : 0

  // Health scores
  const punya_jiwa = profile.asuransi_jiwa === 'Ya, punya'
  const punya_kes  = profile.asuransi_kesehatan === 'Ya, punya'
  const investasiArr = profile.investasi_aktif || []
  const jumlahInvestasi = Array.isArray(investasiArr) ? investasiArr.filter(v => v !== 'Belum berinvestasi').length : 0

  const healthScores = {
    likuiditas: DANA_DARURAT_SKOR[profile.dana_darurat] ?? 0,
    proteksi:   punya_jiwa && punya_kes ? 100 : punya_jiwa || punya_kes ? 50 : 20,
    utang:      Math.max(0, Math.min(100, 100 - debtRatio)),
    tabungan:   Math.min(100, (estimasiTabungan / totalPendapatan) * 100 * 3),
    investasi:  jumlahInvestasi === 0 ? 10 : jumlahInvestasi === 1 ? 40 : jumlahInvestasi === 2 ? 60 : 90,
  }
  const healthTotal = Object.values(healthScores).reduce((a, b) => a + b, 0) / 5

  return {
    totalPendapatan, cicilan, targetPersen, estimasiTabungan, debtRatio, sisaGaji,
    bpjsKesKaryawan, bpjsKesPerusahaan,
    bpjsTKJHTKaryawan, bpjsTKJHTPerusahaan,
    bpjsTKJPKaryawan, bpjsTKJPPerusahaan,
    bpjsTKJKM, bpjsTKKaryawan,
    totalPotonganKaryawan, totalPotonganPerusahaan,
    statusPajak, tanggungan, ptkp,
    penghasilanBruto, penghasilanNeto, pkp,
    pphTahunan, pphBulanan, efektifPajak,
    healthScores, healthTotal,
  }
}

// ─────────────────────────────────────────────────────
// TOOLTIP RUPIAH CUSTOM
// ─────────────────────────────────────────────────────
function RupiahTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs max-w-[200px]">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5 mt-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500 truncate">{p.name}:</span>
          <span className="font-semibold text-gray-800 whitespace-nowrap">{idr(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 1 — ALOKASI GAJI
// ─────────────────────────────────────────────────────
function Chart1Alokasi({ calc }) {
  const data = [{
    name: 'Gaji',
    BPJS:     Math.round(calc.bpjsKesKaryawan + calc.bpjsTKKaryawan),
    Cicilan:  Math.round(calc.cicilan),
    Tabungan: Math.round(calc.estimasiTabungan),
    Sisa:     Math.round(Math.max(0, calc.sisaGaji)),
  }]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <XAxis type="number" tickFormatter={(v) => `${(v / 1e6).toFixed(1)}jt`} tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey="name" hide />
        <Tooltip content={<RupiahTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
        <Bar dataKey="BPJS"     stackId="a" fill="#FDA4AF" name="BPJS" />
        <Bar dataKey="Cicilan"  stackId="a" fill="#FCA877" name="Cicilan" />
        <Bar dataKey="Tabungan" stackId="a" fill="#6EE7B7" name="Tabungan" />
        <Bar dataKey="Sisa"     stackId="a" fill="#93C5FD" name="Sisa" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 2 — DEBT-TO-INCOME RATIO
// ─────────────────────────────────────────────────────
function Chart2Debt({ calc }) {
  const ratio = Math.min(calc.debtRatio, 100)
  const color = ratio < 30 ? '#22C55E' : ratio < 40 ? '#EAB308' : '#EF4444'
  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      <ResponsiveContainer width="100%" height="85%">
        <RadialBarChart innerRadius="60%" outerRadius="85%"
          data={[{ value: ratio, fill: color }]} startAngle={180} endAngle={-180}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#F3F4F6' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
        <span className="text-3xl font-bold" style={{ color }}>{pct(ratio)}</span>
        <span className="text-xs text-gray-500">Debt Ratio</span>
      </div>
      <p className="text-[11px] text-gray-400 text-center">Standar sehat: di bawah 30%</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 3 — DANA DARURAT
// ─────────────────────────────────────────────────────
function Chart3DanaDarurat({ profile }) {
  const nilai = DANA_DARURAT_NILAI[profile?.dana_darurat] ?? 0
  const color = nilai >= 3 ? '#22C55E' : '#EF4444'
  const data  = [{ name: 'Dana Darurat', nilai }]
  return (
    <div className="flex flex-col h-full">
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 40, left: 8, bottom: 4 }}>
          <XAxis type="number" domain={[0, 6]} ticks={[0, 1, 2, 3, 4, 5, 6]}
            tickFormatter={(v) => `${v}bln`} tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow text-xs">
                <p className="font-semibold">{profile?.dana_darurat || 'Belum ada'}</p>
                <p className="text-gray-500">≈ {payload[0].value} bulan</p>
              </div>
            ) : null
          } />
          <Bar dataKey="nilai" fill={color} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-gray-400 text-center mt-1">
        Target minimum: 3 bulan · Kondisi: {profile?.dana_darurat || 'Belum ada'}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 4 — BPJS BREAKDOWN
// ─────────────────────────────────────────────────────
function Chart4BPJS({ calc }) {
  const data = [
    { name: 'BPJS Kes (Karyawan)',   value: Math.round(calc.bpjsKesKaryawan),   color: '#FDA4AF' },
    { name: 'BPJS Kes (Perusahaan)', value: Math.round(calc.bpjsKesPerusahaan), color: '#FB7185' },
    { name: 'BPJS TK (Karyawan)',    value: Math.round(calc.bpjsTKKaryawan),    color: '#93C5FD' },
    { name: 'BPJS TK (Perusahaan)',  value: Math.round(calc.bpjsTKJHTPerusahaan + calc.bpjsTKJPPerusahaan + calc.bpjsTKJKM), color: '#3B82F6' },
  ].filter(d => d.value > 0)

  const renderLabel = ({ cx, cy, midAngle, outerRadius, value }) => {
    const RADIAN = Math.PI / 180
    const r = outerRadius + 18
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} fill="#9CA3AF" fontSize={10}>{`${(value / 1000).toFixed(0)}rb`}</text>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="45%" innerRadius="35%" outerRadius="60%"
          dataKey="value" labelLine={false} label={renderLabel}>
          {data.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Pie>
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        <Tooltip content={<RupiahTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 5 — PPH 21
// ─────────────────────────────────────────────────────
function Chart5Pajak({ calc }) {
  const data = [
    { name: 'Penghasilan', nilai: Math.round(calc.totalPendapatan) },
    { name: 'Est. PPh/bln', nilai: Math.round(calc.pphBulanan) },
  ]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}jt`} tick={{ fontSize: 10 }} />
        <Tooltip content={<RupiahTooltip />} />
        <Bar dataKey="nilai" name="Nominal" radius={[6, 6, 0, 0]}>
          <Cell fill="#818CF8" />
          <Cell fill="#F472B6" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 6 — FINANCIAL HEALTH RADAR
// ─────────────────────────────────────────────────────
function Chart6Health({ calc }) {
  const data = [
    { subject: 'Likuiditas', A: Math.round(calc.healthScores.likuiditas) },
    { subject: 'Proteksi',   A: Math.round(calc.healthScores.proteksi) },
    { subject: 'Utang',      A: Math.round(calc.healthScores.utang) },
    { subject: 'Tabungan',   A: Math.round(calc.healthScores.tabungan) },
    { subject: 'Investasi',  A: Math.round(calc.healthScores.investasi) },
  ]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280' }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="A" name="Skor" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
        <Tooltip formatter={(v) => [`${v} / 100`, 'Skor']} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 7 — PROYEKSI TABUNGAN 12 BULAN
// ─────────────────────────────────────────────────────
function Chart7Proyeksi({ calc }) {
  const data = Array.from({ length: 12 }, (_, i) => ({
    bulan: `Bln ${i + 1}`,
    tabungan: Math.round(calc.estimasiTabungan * (i + 1)),
  }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="gradTabungan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="bulan" tick={{ fontSize: 10 }} />
        <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}jt`} tick={{ fontSize: 10 }} />
        <Tooltip content={<RupiahTooltip />} />
        <Area dataKey="tabungan" name="Akumulasi Tabungan" type="monotone"
          stroke="#6366F1" strokeWidth={2} fill="url(#gradTabungan)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────
// CHART CAROUSEL
// ─────────────────────────────────────────────────────
const CHART_META = [
  'Alokasi Gaji Bulanan',
  'Debt-to-Income Ratio',
  'Kecukupan Dana Darurat',
  'BPJS Breakdown',
  'Estimasi PPh 21 Bulanan',
  'Financial Health Score',
  'Proyeksi Tabungan 12 Bulan',
]

function ChartCarousel({ calc, profile }) {
  const [idx, setIdx]       = useState(0)
  const touchStartX         = useRef(null)
  const total               = 7

  const prev = () => setIdx((i) => (i - 1 + total) % total)
  const next = () => setIdx((i) => (i + 1) % total)

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (delta > 50) next()
    else if (delta < -50) prev()
    touchStartX.current = null
  }

  const charts = [
    <Chart1Alokasi    key={0} calc={calc} />,
    <Chart2Debt       key={1} calc={calc} />,
    <Chart3DanaDarurat key={2} profile={profile} />,
    <Chart4BPJS       key={3} calc={calc} />,
    <Chart5Pajak      key={4} calc={calc} />,
    <Chart6Health     key={5} calc={calc} />,
    <Chart7Proyeksi   key={6} calc={calc} />,
  ]

  return (
    <div className="relative bg-white shadow-sm border-y border-gray-100"
      style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>

      {/* Label + nomor */}
      <div className="flex items-center justify-between px-5 pt-4 pb-1 max-w-5xl mx-auto">
        <span className="text-sm font-semibold text-gray-700">{CHART_META[idx]}</span>
        <span className="text-xs text-gray-400 tabular-nums">{idx + 1} / {total}</span>
      </div>

      {/* Area slide */}
      <div className="overflow-hidden" style={{ height: 'clamp(220px, 38vw, 272px)' }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="flex h-full"
          style={{
            width: `${total * 100}%`,
            transform: `translateX(-${idx * (100 / total)}%)`,
            transition: 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}>
          {charts.map((chart, i) => (
            <div key={i} style={{ width: `${100 / total}%`, flexShrink: 0 }} className="px-5 pb-2">
              {chart}
            </div>
          ))}
        </div>
      </div>

      {/* Tombol panah — desktop only */}
      <button onClick={prev}
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow border border-gray-200 items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer z-10">
        <ChevronLeft size={18} />
      </button>
      <button onClick={next}
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow border border-gray-200 items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer z-10">
        <ChevronRight size={18} />
      </button>

      {/* Dot indicator */}
      <div className="flex items-center justify-center gap-1.5 py-3">
        {Array.from({ length: total }, (_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Grafik ${i + 1}`}
            className="rounded-full cursor-pointer transition-all duration-300"
            style={{ width: i === idx ? 10 : 6, height: i === idx ? 10 : 6,
              background: i === idx ? '#6366F1' : '#D1D5DB' }} />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────
function Sk({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />
}
function CarouselSkeleton() {
  return (
    <div className="bg-white border-y border-gray-100 py-5 px-5"
      style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
      <Sk className="h-4 w-44 mb-4" />
      <Sk className="h-52 w-full" />
      <div className="flex justify-center gap-1.5 mt-4">
        {[...Array(7)].map((_, i) => <Sk key={i} className="w-2 h-2 rounded-full" />)}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// TAB 1 — RINGKASAN
// ─────────────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, trend }) {
  const trendColor  = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
  const TrendIcon   = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{icon}</span>
        <TrendIcon size={15} className={trendColor} />
      </div>
      <p className="text-[11px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-base font-bold text-gray-800 font-mono leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function TabRingkasan({ calc }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard icon="💰" label="Total Penghasilan Tetap"
        value={idr(calc.totalPendapatan)} sub="per bulan" trend="up" />
      <MetricCard icon="✂️" label="Total Potongan Bulanan"
        value={idr(calc.totalPotonganKaryawan)} sub="BPJS + cicilan" trend="down" />
      <MetricCard icon="🏦" label="Estimasi Tabungan/Bln"
        value={idr(calc.estimasiTabungan)} sub={`${calc.targetPersen}% pendapatan`} trend="up" />
      <MetricCard icon="💸" label="Sisa Penghasilan"
        value={idr(Math.max(0, calc.sisaGaji))}
        sub={calc.sisaGaji < 0 ? '⚠️ Defisit!' : 'setelah potongan & tabungan'}
        trend={calc.sisaGaji < 0 ? 'down' : 'neutral'} />
    </div>
  )
}

// ─────────────────────────────────────────────────────
// TAB 2 — BPJS & POTONGAN
// ─────────────────────────────────────────────────────
function TabBPJS({ calc }) {
  const rows = [
    { label: 'BPJS Kes — Karyawan (1%)',        k: calc.bpjsKesKaryawan,     p: null },
    { label: 'BPJS Kes — Perusahaan (4%)',       k: null,                     p: calc.bpjsKesPerusahaan },
    { label: 'BPJS TK JHT — Karyawan (2%)',      k: calc.bpjsTKJHTKaryawan,   p: null },
    { label: 'BPJS TK JHT — Perusahaan (3.7%)',  k: null,                     p: calc.bpjsTKJHTPerusahaan },
    { label: 'BPJS TK JP — Karyawan (1%)',        k: calc.bpjsTKJPKaryawan,   p: null },
    { label: 'BPJS TK JP — Perusahaan (2%)',      k: null,                     p: calc.bpjsTKJPPerusahaan },
    { label: 'BPJS TK JKM — Perusahaan (0.3%)',  k: null,                     p: calc.bpjsTKJKM },
    ...(calc.cicilan > 0 ? [{ label: 'Cicilan / Hutang', k: calc.cicilan, p: null }] : []),
  ]
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Komponen</th>
              <th className="text-right px-3 py-2.5 font-semibold text-red-500">Potong Gaji</th>
              <th className="text-right px-3 py-2.5 font-semibold text-blue-500">Perusahaan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 text-gray-700">{r.label}</td>
                <td className="px-3 py-2 text-right font-mono text-red-500">{r.k !== null ? idr(Math.round(r.k)) : '—'}</td>
                <td className="px-3 py-2 text-right font-mono text-blue-500">{r.p !== null ? idr(Math.round(r.p)) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td className="px-3 py-2.5 text-gray-800">Total</td>
              <td className="px-3 py-2.5 text-right font-mono text-red-600">{idr(Math.round(calc.totalPotonganKaryawan))}</td>
              <td className="px-3 py-2.5 text-right font-mono text-blue-600">{idr(Math.round(calc.totalPotonganPerusahaan))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        * JKK tidak ditampilkan — tarif bergantung tingkat risiko pekerjaan.
        Batas atas BPJS Kes: Rp 12 jt · Batas atas JP: Rp 11.086.300.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// TAB 3 — PAJAK
// ─────────────────────────────────────────────────────
function TabPajak({ calc, profile }) {
  const statusLabel = calc.statusPajak === 'K'
    ? `K/${calc.tanggungan} (Kawin, ${calc.tanggungan} tanggungan)`
    : `TK/${calc.tanggungan}`
  const rows = [
    ['Status PTKP',                  statusLabel],
    ['Nilai PTKP Setahun',           idr(calc.ptkp)],
    ['Penghasilan Bruto Setahun',    idr(calc.penghasilanBruto)],
    ['Penghasilan Neto Setahun',     idr(calc.penghasilanNeto)],
    ['PKP (Penghasilan Kena Pajak)', idr(calc.pkp)],
    ['Est. PPh 21 Setahun',          idr(calc.pphTahunan)],
    ['Est. PPh 21 Per Bulan',        idr(calc.pphBulanan)],
    ['Tarif Efektif',                pct(calc.efektifPajak)],
  ]
  return (
    <div>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {rows.map(([label, value], i) => (
          <div key={i} className={`flex justify-between items-center px-4 py-2.5 text-xs ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-800 font-mono">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-[11px] text-amber-700">
        💡 Estimasi berdasarkan penghasilan tetap. PPh aktual dihitung ulang tiap bulan setelah input insentif.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// TAB 4 — PROFIL & TARGET
// ─────────────────────────────────────────────────────
function TabProfil({ calc, profile }) {
  const proyeksi1thn = calc.estimasiTabungan * 12
  const proyeksi5thn = calc.estimasiTabungan * 60
  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">🎯 Tujuan Keuangan</h4>
        <div className="flex flex-wrap gap-2">
          {(profile?.tujuan_keuangan || []).map((t) => (
            <span key={t} className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full border border-indigo-100">{t}</span>
          ))}
          {!profile?.tujuan_keuangan?.length && <span className="text-xs text-gray-400">Belum diisi</span>}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-1">⚖️ Profil Risiko</h4>
        <p className="text-sm text-gray-700">{profile?.profil_risiko || '—'}</p>
        {profile?.profil_risiko === 'Konservatif' && <p className="text-xs text-gray-400 mt-0.5">Cocok: deposito, obligasi pemerintah, reksa dana pasar uang</p>}
        {profile?.profil_risiko === 'Moderat'     && <p className="text-xs text-gray-400 mt-0.5">Cocok: reksa dana campuran, obligasi korporat, saham blue chip</p>}
        {profile?.profil_risiko === 'Agresif'     && <p className="text-xs text-gray-400 mt-0.5">Cocok: saham, reksa dana saham, aset alternatif</p>}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-1">🚀 Prioritas Saat Ini</h4>
        <p className="text-sm text-gray-600">{profile?.prioritas_keuangan || '—'}</p>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
        <h4 className="text-sm font-semibold text-indigo-800 mb-3">📈 Proyeksi Tabungan</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['Per Bulan', calc.estimasiTabungan], ['1 Tahun', proyeksi1thn], ['5 Tahun', proyeksi5thn]].map(([label, val]) => (
            <div key={label}>
              <p className="text-[10px] text-indigo-500">{label}</p>
              <p className="text-sm font-bold text-indigo-800 font-mono">{idr(val)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// TAB 5 — KESEHATAN FINANSIAL
// ─────────────────────────────────────────────────────
const HEALTH_META = {
  likuiditas: {
    label: 'Likuiditas',
    color: (s) => s >= 80 ? '#22C55E' : s >= 50 ? '#EAB308' : '#EF4444',
    desc:  (s) => s < 50 ? 'Dana darurat masih kurang. Targetkan minimal 3 bulan pengeluaran.' : 'Dana darurat dalam kondisi baik.',
  },
  proteksi: {
    label: 'Proteksi',
    color: (s) => s === 100 ? '#22C55E' : s === 50 ? '#EAB308' : '#EF4444',
    desc:  (s) => s < 100 ? 'Pertimbangkan asuransi jiwa & kesehatan swasta sebagai backup BPJS.' : 'Perlindungan lengkap.',
  },
  utang: {
    label: 'Manajemen Utang',
    color: (s) => s >= 70 ? '#22C55E' : s >= 60 ? '#EAB308' : '#EF4444',
    desc:  (s) => s < 60 ? 'Cicilan terlalu tinggi. Targetkan di bawah 30% penghasilan.' : 'Cicilan dalam batas aman.',
  },
  tabungan: {
    label: 'Tabungan',
    color: (s) => s >= 60 ? '#22C55E' : s >= 30 ? '#EAB308' : '#EF4444',
    desc:  (s) => s < 60 ? 'Tingkatkan porsi tabungan. Target minimal 20% penghasilan.' : 'Porsi tabungan sudah baik.',
  },
  investasi: {
    label: 'Investasi',
    color: (s) => s >= 60 ? '#22C55E' : s >= 40 ? '#EAB308' : '#EF4444',
    desc:  (s) => s < 60 ? 'Mulai diversifikasi investasi untuk pertumbuhan aset jangka panjang.' : 'Portofolio cukup terdiversifikasi.',
  },
}

function TabKesehatan({ calc }) {
  const total = calc.healthTotal
  const { label, color } =
    total >= 86 ? { label: 'Sangat Baik 🌟', color: 'text-green-600' }
    : total >= 71 ? { label: 'Baik 👍',        color: 'text-green-500' }
    : total >= 41 ? { label: 'Cukup ⚠️',       color: 'text-amber-500' }
    :               { label: 'Perlu Perhatian 🚨', color: 'text-red-500' }

  return (
    <div className="space-y-4">
      {Object.entries(calc.healthScores).map(([key, score]) => {
        const meta  = HEALTH_META[key]
        const clr   = meta.color(score)
        return (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-700">{meta.label}</span>
              <span className="text-xs font-bold font-mono" style={{ color: clr }}>{Math.round(score)} / 100</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${score}%`, background: clr }} />
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">{meta.desc(score)}</p>
          </div>
        )
      })}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">Skor Total</span>
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-800 font-mono">{total.toFixed(0)}</span>
          <span className="text-gray-400 text-sm"> / 100</span>
          <p className={`text-xs font-semibold ${color}`}>{label}</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// DASHBOARD TABS WRAPPER
// ─────────────────────────────────────────────────────
const TAB_LIST = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'bpjs',      label: 'BPJS & Potongan' },
  { id: 'pajak',     label: 'Pajak' },
  { id: 'profil',    label: 'Profil & Target' },
  { id: 'kesehatan', label: 'Kesehatan Finansial' },
]

function DashboardTabs({ calc, profile }) {
  const [active, setActive]   = useState('ringkasan')
  const [visible, setVisible] = useState(true)

  function switchTab(id) {
    if (id === active) return
    setVisible(false)
    setTimeout(() => { setActive(id); setVisible(true) }, 150)
  }

  const content = {
    ringkasan: <TabRingkasan calc={calc} />,
    bpjs:      <TabBPJS calc={calc} />,
    pajak:     <TabPajak calc={calc} profile={profile} />,
    profil:    <TabProfil calc={calc} profile={profile} />,
    kesehatan: <TabKesehatan calc={calc} />,
  }

  return (
    <div>
      {/* Tab header — scroll horizontal di mobile */}
      <div className="overflow-x-auto border-b border-gray-200 mb-5" style={{ scrollbarWidth: 'none' }}>
        <div className="flex min-w-max">
          {TAB_LIST.map((t) => (
            <button key={t.id} onClick={() => switchTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                active === t.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Konten dengan fade */}
      <div key={active} style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}>
        {content[active]}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────
function Dashboard() {
  const navigate              = useNavigate()
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      if (!supabase) { setLoading(false); return }
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { navigate('/login'); return }
        setUser(session.user)
        const { data } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(data)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [navigate])

  async function handleLogout() {
    if (supabase) await supabase.auth.signOut()
    navigate('/login')
  }

  const calc = calcFinancial(profile)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header sticky */}
      <header className="bg-white border-b border-gray-200 px-4 py-3.5 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-indigo-500" />
            <span className="font-bold text-gray-800 text-sm">Niswar Finance AI</span>
          </div>
          <div className="flex items-center">
            <Link to="/settings/profil"
              className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
              <Settings size={14} /><span className="hidden sm:inline ml-0.5">Pengaturan</span>
            </Link>
            <button type="button" onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
              <LogOut size={14} /><span className="hidden sm:inline ml-0.5">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 overflow-x-hidden">
        {/* Sapaan */}
        <div className="mb-5">
          {loading
            ? <Sk className="h-6 w-44" />
            : <h1 className="text-xl font-bold text-gray-800">
                Halo{profile?.nama_lengkap ? ', ' + profile.nama_lengkap.split(' ')[0] : ''}! 👋
              </h1>}
          {user && !loading && <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>}
        </div>

        {/* Banner profil belum lengkap */}
        {!loading && profile && !profile.gaji_pokok && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">Lengkapi profil untuk analisis yang akurat</p>
              <p className="text-xs text-amber-600 mt-0.5">Data gaji belum terisi — grafik & kalkulasi belum bisa tampil.</p>
            </div>
            <Link to="/register/individu"
              className="text-xs font-bold text-amber-700 underline whitespace-nowrap">Lengkapi →</Link>
          </div>
        )}

        {/* Carousel */}
        {loading
          ? <CarouselSkeleton />
          : calc && <ChartCarousel calc={calc} profile={profile} />}

        {/* Tabs */}
        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              <Sk className="h-10 w-full" />
              <Sk className="h-36 w-full" />
            </div>
          ) : calc ? (
            <DashboardTabs calc={calc} profile={profile} />
          ) : null}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
