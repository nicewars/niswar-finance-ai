import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Wallet, LogOut, Settings, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Minus, AlertCircle, Pencil,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarRadiusAxis,
  LineChart, Line,
  ComposedChart,
  ReferenceLine,
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
// GRAFIK 1 — ALOKASI GAJI (DONUT — bersih, tanpa label eksternal)
// ─────────────────────────────────────────────────────
function Chart1Alokasi({ calc }) {
  const bpjs     = Math.round(calc.bpjsKesKaryawan + calc.bpjsTKKaryawan)
  const cicilan  = Math.round(calc.cicilan)
  const tabungan = Math.round(calc.estimasiTabungan)
  const sisa     = Math.round(Math.max(0, calc.sisaGaji))
  const total    = bpjs + cicilan + tabungan + sisa || 1

  const data = [
    { name: 'BPJS & Potongan',   short: 'BPJS',     value: bpjs,     color: '#FDA4AF' },
    { name: 'Cicilan & Utang',   short: 'Cicilan',   value: cicilan,  color: '#FCA877' },
    { name: 'Target Tabungan',   short: 'Tabungan',  value: tabungan, color: '#6EE7B7' },
    { name: 'Sisa / Disposable', short: 'Sisa',      value: sisa,     color: '#93C5FD' },
  ].filter(d => d.value > 0)

  // Label Rp total di tengah lubang donut
  const CenterLabel = ({ viewBox }) => {
    const { cx, cy } = viewBox || {}
    return (
      <g>
        <text x={cx} y={cy - 7} textAnchor="middle" fill="#6B7280" fontSize={9} fontWeight="500">Total</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#6366F1" fontSize={11} fontWeight="700">
          {`${(calc.totalPendapatan / 1e6).toFixed(1)}jt`}
        </text>
      </g>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 220 }}>
      {/* Donut — mengisi sisa tinggi */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data} cx="50%" cy="50%"
              innerRadius="40%" outerRadius="62%"
              dataKey="value"
            >
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
              <CenterLabel />
            </Pie>
            <Tooltip formatter={(v, name) => [
              `${idr(v)} (${((v / total) * 100).toFixed(1)}%)`, name
            ]} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend horizontal — wrap ke 2 baris jika sempit */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pb-1 px-2 shrink-0">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-[10px] text-gray-500">{d.short}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 2 — DEBT-TO-INCOME RATIO (TIDAK BERUBAH)
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
// GRAFIK 3 — KETAHANAN DANA DARURAT (SPEEDOMETER)
// ─────────────────────────────────────────────────────
const DANA_DARURAT_BULAN = {
  'Belum ada': 0, 'Kurang dari 1 bulan': 0.5,
  '1 - 3 bulan': 2, '3 - 6 bulan': 4.5, 'Lebih dari 6 bulan': 7,
}

function Chart3Speedometer({ profile }) {
  // maxBulan: target dana darurat, disimpan di localStorage
  const [maxBulan, setMaxBulan] = useState(() => {
    try {
      const saved = localStorage.getItem('target_bulan_darurat')
      const val   = saved ? parseInt(saved, 10) : 24
      return isNaN(val) ? 24 : Math.max(6, Math.min(120, val))
    } catch { return 24 }
  })
  const [isEditing, setIsEditing] = useState(false)
  const [tempMax, setTempMax]     = useState(maxBulan)

  const nilai  = DANA_DARURAT_BULAN[profile?.dana_darurat] ?? 0
  const maxVal = maxBulan
  const warna  = nilai < 3 ? '#EF4444' : nilai < 6 ? '#EAB308' : '#22C55E'

  const cx = 100, cy = 90, r = 70
  const toRad = (deg) => (deg * Math.PI) / 180

  const arcPath = (startDeg, endDeg, radius, innerRadius) => {
    const s  = { x: cx + radius * Math.cos(toRad(startDeg)), y: cy + radius * Math.sin(toRad(startDeg)) }
    const e  = { x: cx + radius * Math.cos(toRad(endDeg)),   y: cy + radius * Math.sin(toRad(endDeg)) }
    const si = { x: cx + innerRadius * Math.cos(toRad(startDeg)), y: cy + innerRadius * Math.sin(toRad(startDeg)) }
    const ei = { x: cx + innerRadius * Math.cos(toRad(endDeg)),   y: cy + innerRadius * Math.sin(toRad(endDeg)) }
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    return `M${s.x},${s.y} A${radius},${radius} 0 ${large},1 ${e.x},${e.y} L${ei.x},${ei.y} A${innerRadius},${innerRadius} 0 ${large},0 ${si.x},${si.y} Z`
  }

  // Skala menyesuaikan maxVal; zona merah/kuning/hijau tetap absolut (3 & 6 bulan)
  const valToDeg = (v) => 180 - (Math.min(v, maxVal) / maxVal) * 180
  const zone3    = Math.min(3, maxVal)
  const zone6    = Math.min(6, maxVal)
  const jarum    = valToDeg(nilai)
  const jarumX   = cx + (r - 8) * Math.cos(toRad(jarum))
  const jarumY   = cy + (r - 8) * Math.sin(toRad(jarum))

  function saveMax(val) {
    const clamped = Math.max(6, Math.min(120, parseInt(val, 10) || 24))
    setMaxBulan(clamped)
    setTempMax(clamped)
    try { localStorage.setItem('target_bulan_darurat', String(clamped)) } catch {}
    setIsEditing(false)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <svg viewBox="0 0 200 110" width="100%" style={{ maxHeight: 148 }}>
        {/* Track abu-abu */}
        <path d={arcPath(180, 0, r, r - 16)} fill="#F3F4F6" />
        {/* Zona merah 0–3 bulan */}
        {zone3 > 0 && <path d={arcPath(180, valToDeg(zone3), r, r - 16)} fill="#FCA5A5" />}
        {/* Zona kuning 3–6 bulan */}
        {zone6 > zone3 && <path d={arcPath(valToDeg(zone3), valToDeg(zone6), r, r - 16)} fill="#FDE68A" />}
        {/* Zona hijau 6–max bulan */}
        {maxVal > 6 && <path d={arcPath(valToDeg(zone6), 0, r, r - 16)} fill="#A7F3D0" />}
        {/* Arc aktif */}
        {nilai > 0 && (
          <path d={arcPath(180, jarum, r, r - 16)} fill={warna} opacity={0.85} />
        )}
        {/* Jarum */}
        <line x1={cx} y1={cy} x2={jarumX} y2={jarumY}
          stroke="#374151" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="#374151" />
        {/* Nilai tengah */}
        <text x={cx} y={cy + 18} textAnchor="middle" fill={warna} fontSize={20} fontWeight="800">{nilai}</text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="#6B7280" fontSize={8}>bulan</text>
        {/* Tick labels: 0, 3, 6, maxVal (tanpa duplikat) */}
        {[0, zone3, zone6, maxVal].filter((v, i, a) => a.indexOf(v) === i).map((v) => {
          const deg = valToDeg(v)
          const tx  = cx + (r + 8) * Math.cos(toRad(deg))
          const ty  = cy + (r + 8) * Math.sin(toRad(deg))
          return <text key={v} x={tx} y={ty} textAnchor="middle" fill="#9CA3AF" fontSize={7}>{v}</text>
        })}
      </svg>

      {/* Baris target & tombol edit */}
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[10px] text-gray-400">Target:</span>
        {isEditing ? (
          <input
            type="number"
            value={tempMax}
            onChange={(e) => setTempMax(e.target.value)}
            onBlur={() => saveMax(tempMax)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  saveMax(tempMax)
              if (e.key === 'Escape') setIsEditing(false)
            }}
            min={6} max={120}
            className="w-12 text-[11px] text-center border border-indigo-300 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-indigo-200"
            autoFocus
          />
        ) : (
          <span className="text-[10px] font-semibold text-gray-600">{maxBulan} bulan</span>
        )}
        <button
          type="button"
          onClick={() => { setTempMax(maxBulan); setIsEditing(!isEditing) }}
          className="text-gray-300 hover:text-indigo-400 transition-colors cursor-pointer"
          aria-label="Edit target dana darurat"
        >
          <Pencil size={10} />
        </button>
      </div>

      <p className="text-[9px] text-gray-400 text-center mt-0.5">
        Estimasi awal · Akurasi meningkat setelah mengisi anggaran
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 4 — ALOKASI vs STANDAR IDEAL 50/30/20
// ─────────────────────────────────────────────────────
function Chart4AlokasiIdeal({ calc }) {
  const { totalPendapatan, totalPotonganKaryawan, estimasiTabungan } = calc
  const tp = totalPendapatan || 1

  const aktualKebutuhan  = (totalPotonganKaryawan / tp) * 100
  const aktualTabungan   = (estimasiTabungan / tp) * 100
  const aktualGayaHidup  = Math.max(0, 100 - aktualKebutuhan - aktualTabungan)

  const data = [
    { kategori: 'Kebutuhan Pokok', aktual: Math.round(aktualKebutuhan),  ideal: 50,  over: aktualKebutuhan > 50 },
    { kategori: 'Tabungan & Inv.', aktual: Math.round(aktualTabungan),   ideal: 20,  over: aktualTabungan < 20 },
    { kategori: 'Gaya Hidup',      aktual: Math.round(aktualGayaHidup),  ideal: 30,  over: aktualGayaHidup > 30 },
  ]

  const CustomBar = (props) => {
    const { x, y, width, height, over } = props
    return <rect x={x} y={y} width={width} height={height} fill={over ? '#F97316' : '#6366F1'} rx={4} />
  }

  const renderCustomLabel = ({ x, y, width, value }) => (
    <text x={x + width / 2} y={y - 4} textAnchor="middle" fill="#374151" fontSize={10} fontWeight="600">{value}%</text>
  )

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 12, left: 0, bottom: 4 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="kategori" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} width={32} />
        <Tooltip formatter={(v, name) => [`${v}%`, name === 'aktual' ? 'Aktual Anda' : 'Standar Ideal']}
          labelFormatter={(l) => l} />
        <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8}
          formatter={(value) => value === 'aktual' ? 'Aktual Anda' : 'Standar Ideal (50/30/20)'} />
        <Bar dataKey="aktual" name="aktual" shape={<CustomBar />} label={renderCustomLabel} />
        <Bar dataKey="ideal"  name="ideal"  fill="#D1D5DB" radius={[4, 4, 0, 0]} opacity={0.6} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 5 — DISTRIBUSI KONDISI KEUANGAN (RADAR + BADGE)
// ─────────────────────────────────────────────────────
function Chart5KondisiKeuangan({ calc }) {
  const data = [
    { subject: 'Likuiditas', A: Math.round(calc.healthScores.likuiditas) },
    { subject: 'Proteksi',   A: Math.round(calc.healthScores.proteksi) },
    { subject: 'Utang',      A: Math.round(calc.healthScores.utang) },
    { subject: 'Tabungan',   A: Math.round(calc.healthScores.tabungan) },
    { subject: 'Investasi',  A: Math.round(calc.healthScores.investasi) },
  ]
  const skor  = Math.round(calc.healthTotal)
  const badgeColor = skor < 40 ? '#EF4444' : skor <= 70 ? '#EAB308' : '#22C55E'

  return (
    <div className="relative h-full">
      {/* Badge skor pojok kanan atas */}
      <div className="absolute top-0 right-2 z-10 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow"
          style={{ background: badgeColor }}>{skor}</div>
        <span className="text-[9px] text-gray-400 mt-0.5">Skor</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280' }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="A" name="Skor" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
          <Tooltip formatter={(v) => [`${v} / 100`, 'Skor']} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// GENERATOR DATA CASHFLOW HARIAN (sample, seed-based)
// Seed dari bulan & tahun → data konsisten tiap render
// ─────────────────────────────────────────────────────
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function generateSampleCashflowData(year, month, gajiPokok) {
  const gaji        = gajiPokok || 5_000_000
  const seed        = month * 31 + year % 100
  const daysInMonth = new Date(year, month, 0).getDate() // month 1-based

  const data = []
  let saldo = 0

  for (let d = 1; d <= daysInMonth; d++) {
    let pemasukan   = 0
    let pengeluaran = 0

    // Tanggal 20: gaji masuk
    if (d === 20) {
      pemasukan = gaji
    }

    // Tanggal 1–5: kebutuhan awal bulan (sewa, listrik, dll) — ~30-40% gaji
    if (d >= 1 && d <= 5) {
      const totalAwal = gaji * (0.30 + seededRand(seed + d) * 0.10)
      const porsi     = 0.5 + seededRand(seed + d + 100) * 1.0
      pengeluaran     = Math.round((totalAwal / 5) * porsi)
    }

    // Tanggal 10 dan 25: belanja / kebutuhan mingguan (~5-10% gaji)
    if (d === 10 || d === 25) {
      pengeluaran += Math.round(gaji * (0.05 + seededRand(seed + d + 200) * 0.05))
    }

    // Hari lain: pengeluaran kecil acak (65% probabilitas, Rp 10rb–150rb)
    const isSpecial = d === 20 || (d >= 1 && d <= 5) || d === 10 || d === 25
    if (!isSpecial && seededRand(seed + d + 300) < 0.65) {
      pengeluaran += Math.round(10_000 + seededRand(seed + d + 400) * 140_000)
    }

    saldo += pemasukan - pengeluaran
    data.push({
      tanggal:     d,
      pemasukan:   Math.round(pemasukan),
      pengeluaran: Math.round(pengeluaran),
      saldo:       Math.round(saldo),
    })
  }
  return data
}

// Tooltip custom untuk cashflow harian
function CashflowTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const masuk  = payload.find(p => p.dataKey === 'pemasukan')?.value  || 0
  const keluar = payload.find(p => p.dataKey === 'pengeluaran')?.value || 0
  const saldo  = payload.find(p => p.dataKey === 'saldo')?.value
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">Tgl {label}</p>
      {masuk  > 0 && <p className="text-blue-500">Masuk: {idr(masuk)}</p>}
      {keluar > 0 && <p className="text-red-400">Keluar: {idr(keluar)}</p>}
      {saldo !== undefined && (
        <p className={`font-bold mt-0.5 ${saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          Saldo: {idr(saldo)}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 6 — CASHFLOW HARIAN BULAN INI (scrollable + drag)
// ─────────────────────────────────────────────────────
function Chart6Cashflow({ calc }) {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1 // 1-indexed

  const data        = generateSampleCashflowData(year, month, calc.totalPendapatan)
  const daysInMonth = data.length
  const chartWidth  = daysInMonth * 32 // 32px/hari → 30 hari = 960px

  const totalMasuk  = data.reduce((s, d) => s + d.pemasukan,   0)
  const totalKeluar = data.reduce((s, d) => s + d.pengeluaran, 0)
  const net         = totalMasuk - totalKeluar

  const BULAN     = ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember']
  const namaBulan = BULAN[month - 1]

  // Drag-to-scroll (mouse)
  const scrollRef   = useRef(null)
  const isDragging  = useRef(false)
  const startX      = useRef(0)
  const scrollStart = useRef(0)
  const [dragging, setDragging] = useState(false)

  const onMouseDown = (e) => {
    if (!scrollRef.current) return
    isDragging.current  = true
    setDragging(true)
    startX.current      = e.pageX - scrollRef.current.offsetLeft
    scrollStart.current = scrollRef.current.scrollLeft
  }
  const onMouseMove = (e) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x    = e.pageX - scrollRef.current.offsetLeft
    const walk = x - startX.current
    scrollRef.current.scrollLeft = scrollStart.current - walk
  }
  const stopDrag = () => { isDragging.current = false; setDragging(false) }

  return (
    <div className="flex flex-col h-full" style={{ gap: 4 }}>

      {/* Header + 3 badge ringkasan */}
      <div className="shrink-0 px-1">
        <p className="text-xs font-semibold text-gray-700 mb-1.5">
          Cashflow {namaBulan} {year}
        </p>
        <div className="flex gap-1.5">
          <div className="flex-1 bg-blue-50 rounded-lg px-1.5 py-1 text-center">
            <p className="text-[9px] text-blue-400">Total Masuk</p>
            <p className="text-[10px] font-bold text-blue-700 font-mono leading-tight">{idr(totalMasuk)}</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg px-1.5 py-1 text-center">
            <p className="text-[9px] text-red-400">Total Keluar</p>
            <p className="text-[10px] font-bold text-red-500 font-mono leading-tight">{idr(totalKeluar)}</p>
          </div>
          <div className={`flex-1 rounded-lg px-1.5 py-1 text-center ${net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={`text-[9px] ${net >= 0 ? 'text-green-500' : 'text-red-400'}`}>Net</p>
            <p className={`text-[10px] font-bold font-mono leading-tight ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {idr(net)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart scrollable + drag-to-scroll */}
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          width: '100%',
          cursor: dragging ? 'grabbing' : 'grab',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          flex: 1,
          minHeight: 0,
          userSelect: 'none',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div style={{ width: Math.max(chartWidth, 100) + 'px', minWidth: '100%' }}>
          <ComposedChart
            width={chartWidth} height={160} data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 2 }} barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="tanggal" tick={{ fontSize: 8 }} />
            <YAxis
              tickFormatter={(v) => v >= 1_000_000
                ? `${(v / 1e6).toFixed(1)}jt`
                : `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 8 }} width={28}
            />
            <Tooltip content={<CashflowTooltip />} />
            <ReferenceLine y={0} stroke="#E5E7EB" />
            <Bar dataKey="pemasukan"   fill="#93C5FD" barSize={10} name="Pemasukan" />
            <Bar dataKey="pengeluaran" fill="#FCA5A5" barSize={10} name="Pengeluaran" />
            <Line dataKey="saldo" type="monotone" stroke="#22C55E"
              strokeWidth={1.5} dot={false} name="Saldo" />
          </ComposedChart>
        </div>
      </div>

      {/* Scroll indicator */}
      <p className="text-[9px] text-gray-300 text-center shrink-0 select-none leading-none pb-0.5">
        ← Geser untuk lihat semua hari →
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// GRAFIK 7 — PROYEKSI PERTUMBUHAN TABUNGAN (Multi-line)
// ─────────────────────────────────────────────────────
const WARNA_INVESTASI = ['#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#6366F1']

function Chart7Proyeksi({ calc, profile }) {
  const instrumen = (profile?.investasi_aktif || [])
    .filter(v => v !== 'Belum berinvestasi')
    .slice(0, 4)

  const data = Array.from({ length: 12 }, (_, i) => {
    const bln    = i + 1
    const row    = { bulan: `Bln ${bln}`, 'Total Tabungan': Math.round(calc.estimasiTabungan * bln) }
    instrumen.forEach((ins) => {
      row[ins] = Math.round(calc.estimasiTabungan * 0.2 * bln)
    })
    return row
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="bulan" tick={{ fontSize: 10 }} />
        <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(1)}jt`} tick={{ fontSize: 10 }} width={36} />
        <Tooltip content={<RupiahTooltip />} />
        <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
        <Line dataKey="Total Tabungan" type="monotone" stroke="#6366F1"
          strokeWidth={2.5} dot={false} />
        {instrumen.map((ins, i) => (
          <Line key={ins} dataKey={ins} type="monotone"
            stroke={WARNA_INVESTASI[i + 1] || '#9CA3AF'}
            strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─────────────────────────────────────────────────────
// CHART CAROUSEL
// ─────────────────────────────────────────────────────
const CHART_META = [
  'Alokasi Gaji Bulanan',
  'Debt-to-Income Ratio',
  'Ketahanan Dana Darurat',
  'Rapor Alokasi Keuanganmu',
  'Distribusi Kondisi Keuangan',
  'Cashflow Bulanan',
  'Proyeksi Pertumbuhan Tabungan',
]

function ChartCarousel({ calc, profile }) {
  const [idx, setIdx]               = useState(0)
  const [showControls, setShowControls] = useState(false)
  const touchStartX                 = useRef(null)
  const total                       = 7

  const prev = () => setIdx((i) => Math.max(0, i - 1))
  const next = () => setIdx((i) => Math.min(total - 1, i + 1))

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (delta > 50) next()
    else if (delta < -50) prev()
    touchStartX.current = null
  }

  const charts = [
    <Chart1Alokasi         key={0} calc={calc} />,
    <Chart2Debt            key={1} calc={calc} />,
    <Chart3Speedometer     key={2} profile={profile} />,
    <Chart4AlokasiIdeal    key={3} calc={calc} />,
    <Chart5KondisiKeuangan key={4} calc={calc} />,
    <Chart6Cashflow        key={5} calc={calc} />,
    <Chart7Proyeksi        key={6} calc={calc} profile={profile} />,
  ]

  return (
    <div
      className="relative bg-white shadow-sm border-y border-gray-100"
      style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >

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

      {/* Tombol panah — desktop only, muncul via showControls state */}
      <button
        onClick={prev}
        aria-label="Grafik sebelumnya"
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 items-center justify-center rounded-full z-20 hover:scale-[1.08]"
        style={{
          left: 12,
          width: 44, height: 44,
          background: 'rgba(255,255,255,0.9)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: 'none',
          cursor: idx === 0 ? 'default' : 'pointer',
          opacity: showControls ? (idx === 0 ? 0.3 : 1) : 0,
          pointerEvents: showControls && idx > 0 ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <ChevronLeft size={20} color="#374151" />
      </button>
      <button
        onClick={next}
        aria-label="Grafik berikutnya"
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 items-center justify-center rounded-full z-20 hover:scale-[1.08]"
        style={{
          right: 12,
          width: 44, height: 44,
          background: 'rgba(255,255,255,0.9)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: 'none',
          cursor: idx === total - 1 ? 'default' : 'pointer',
          opacity: showControls ? (idx === total - 1 ? 0.3 : 1) : 0,
          pointerEvents: showControls && idx < total - 1 ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <ChevronRight size={20} color="#374151" />
      </button>

      {/* Tombol navigasi kiri */}
      <button
        onClick={() => setIdx(prev => Math.max(0, prev - 1))}
        style={{
          position: 'absolute',
          left: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 20,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: 'none',
          cursor: 'pointer',
          display: idx === 0 ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Tombol navigasi kanan */}
      <button
        onClick={() => setIdx(prev => Math.min(6, prev + 1))}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 20,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          border: 'none',
          cursor: 'pointer',
          display: idx === 6 ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronRight size={20} />
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
// TAB 3 — PAJAK (3 kartu besar + breakdown)
// ─────────────────────────────────────────────────────
function TabPajak({ calc }) {
  const statusLabel = calc.statusPajak === 'K'
    ? `K/${calc.tanggungan}`
    : `TK/${calc.tanggungan}`

  // Breakdown PTKP: Diri sendiri + tambahan kawin + tanggungan
  const ptkpDiri      = 54_000_000
  const ptkpKawin     = calc.statusPajak === 'K' ? 4_500_000 : 0
  const ptkpTanggunan = calc.tanggungan * 4_500_000

  return (
    <div className="space-y-4">
      {/* 3 Kartu ringkasan */}
      <div className="grid grid-cols-3 gap-3">

        {/* Kartu 1 — PPh Bulanan (pink) */}
        <div className="rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-1"
          style={{ background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)', border: '1px solid #FBCFE8' }}>
          <span className="text-[10px] font-semibold text-pink-600 leading-tight">PPh 21<br/>per Bulan</span>
          <span className="text-base font-bold text-pink-700 font-mono leading-tight">
            {calc.pphBulanan < 1000
              ? 'Rp 0'
              : `${(calc.pphBulanan / 1e6).toFixed(2)}jt`}
          </span>
          <span className="text-[9px] text-pink-400">dipotong pemberi kerja</span>
        </div>

        {/* Kartu 2 — Tarif Efektif (oranye) */}
        <div className="rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-1"
          style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1px solid #FDE68A' }}>
          <span className="text-[10px] font-semibold text-amber-600 leading-tight">Tarif<br/>Efektif</span>
          <span className="text-base font-bold text-amber-700 font-mono leading-tight">
            {pct(calc.efektifPajak)}
          </span>
          <span className="text-[9px] text-amber-400">dari penghasilan bruto</span>
        </div>

        {/* Kartu 3 — PTKP (hijau) */}
        <div className="rounded-2xl p-3 text-center flex flex-col items-center justify-center gap-1"
          style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', border: '1px solid #BBF7D0' }}>
          <span className="text-[10px] font-semibold text-green-700 leading-tight">Status<br/>PTKP</span>
          <span className="text-base font-bold text-green-700 font-mono leading-tight">{statusLabel}</span>
          <span className="text-[9px] text-green-500">
            {(calc.ptkp / 1e6).toFixed(1)}jt / thn
          </span>
        </div>
      </div>

      {/* Breakdown perhitungan */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-600">Rincian Perhitungan PPh 21</span>
        </div>
        {[
          ['Penghasilan Bruto Setahun',     idr(calc.penghasilanBruto), '#374151'],
          ['Biaya Jabatan (maks Rp 6 jt)',  idr(-(calc.penghasilanBruto - calc.penghasilanNeto - calc.bpjsTKJPKaryawan * 12)), '#EF4444'],
          ['Iuran JP Setahun (1%)',         idr(-calc.bpjsTKJPKaryawan * 12), '#EF4444'],
          ['Penghasilan Neto Setahun',      idr(calc.penghasilanNeto),  '#374151'],
          ['PTKP — Diri Sendiri',           idr(-ptkpDiri), '#EF4444'],
          ...(ptkpKawin > 0 ? [['PTKP — Tambahan Kawin', idr(-ptkpKawin), '#EF4444']] : []),
          ...(ptkpTanggunan > 0 ? [['PTKP — Tanggungan (' + calc.tanggungan + ' org)', idr(-ptkpTanggunan), '#EF4444']] : []),
          ['PKP (Penghasilan Kena Pajak)',  idr(calc.pkp), '#6366F1'],
          ['PPh 21 Setahun',               idr(calc.pphTahunan), '#EC4899'],
        ].map(([label, value, color], i, arr) => (
          <div key={i} className={`flex justify-between items-center px-4 py-2 text-xs ${i < arr.length - 1 ? 'border-b border-gray-50' : ''} ${i === arr.length - 1 ? 'bg-pink-50 font-semibold' : ''}`}>
            <span className="text-gray-500">{label}</span>
            <span className="font-mono font-semibold" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Catatan */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-[11px] text-amber-700">
        💡 Estimasi dari penghasilan tetap saja. PPh aktual dihitung ulang setiap bulan setelah kamu input insentif (bonus, lembur, komisi).
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
            <span className="font-bold text-gray-800 text-sm">Smart Finance AI</span>
          </div>
          <div className="flex items-center">
            <Link to="/settings"
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
