import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Table, Pencil, Plus, ChevronRight,
  ArrowLeft, Save, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateAccountTemplates } from '@/lib/accountTemplates'

// ─────────────────────────────────────────────────────
// FORMAT HELPER
// ─────────────────────────────────────────────────────
function idr(n) {
  if (n === null || n === undefined) return '—'
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

const BULAN_LABEL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const KATEGORI_BADGE = {
  kebutuhan_pokok:    { label: 'Kebutuhan Pokok',     bg: '#EFF6FF', text: '#1D4ED8' },
  zakat_agama:        { label: 'Zakat & Agama',        bg: '#F0FDF4', text: '#166534' },
  tabungan_investasi: { label: 'Tabungan & Investasi', bg: '#F5F3FF', text: '#5B21B6' },
  utang_cicilan:      { label: 'Utang & Cicilan',      bg: '#FEF2F2', text: '#991B1B' },
  tersier:            { label: 'Tersier',               bg: '#FFFBEB', text: '#92400E' },
}

// Warna progress bar berdasarkan persentase
function barColor(pct) {
  if (pct >= 90) return '#ef4444'
  if (pct >= 70) return '#f59e0b'
  return '#22c55e'
}

// ─────────────────────────────────────────────────────
// HALAMAN ANGGARAN
// ─────────────────────────────────────────────────────
function Anggaran() {
  const navigate = useNavigate()

  const [session,        setSession]        = useState(null)
  const [profile,        setProfile]        = useState(null)
  const [accounts,       setAccounts]       = useState([])
  const [transactions,   setTransactions]   = useState([])
  const [loading,        setLoading]        = useState(true)
  const [viewMode,       setViewMode]       = useState('card')
  const [editingId,      setEditingId]      = useState(null)
  const [editValue,      setEditValue]      = useState('')
  const [addingParentId, setAddingParentId] = useState(null)
  const [newSubName,     setNewSubName]     = useState('')
  const [newSubBudget,   setNewSubBudget]   = useState(0)

  // Guard: mencegah initTemplate dijalankan dua kali
  // (React Strict Mode memanggil useEffect dua kali di development)
  const isInitializing = useRef(false)

  // ── Fetch accounts ─────────────────────────────────
  const fetchAccounts = useCallback(async (userId) => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true })
    if (data) setAccounts(data)
    return data || []
  }, [])

  // ── Fetch transactions bulan ini ───────────────────
  const fetchTransactions = useCallback(async (userId) => {
    const now      = new Date()
    const y        = now.getFullYear()
    const m        = now.getMonth() + 1
    const firstDay = `${y}-${String(m).padStart(2, '0')}-01`
    const lastDay  = new Date(y, m, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('transaction_date', firstDay)
      .lte('transaction_date', lastDay)
    if (data) setTransactions(data)
  }, [])

  // ── Init template (Chart of Accounts otomatis) ─────
  async function initTemplate(prof, userId) {
    // Guard: jika sudah berjalan (misal karena React Strict Mode), langsung keluar
    if (isInitializing.current) return
    isInitializing.current = true

    const templates = generateAccountTemplates(prof)
    const nameToId  = new Map()

    // TAHAP 1: Insert semua akun root (parent_name === null)
    const roots = templates.filter(t => t.parent_name === null)
    if (roots.length > 0) {
      const records = roots.map(t => ({
        user_id:        userId,
        name:           t.name,
        category:       t.category,
        account_type:   t.account_type,
        icon:           t.icon,
        color:          t.color,
        monthly_budget: t.monthly_budget,
        parent_id:      null,
        is_averaged:    t.is_averaged,
        period_months:  t.period_months,
        notes:          t.notes || null,
        order_index:    t.order_index,
        is_system:      t.is_system,
      }))
      const { data } = await supabase
        .from('accounts').insert(records).select('id, name')
      if (data) data.forEach(d => nameToId.set(d.name, d.id))
    }

    // TAHAP 2+: Insert akun anak secara iteratif
    // (mendukung hierarki lebih dari 2 level)
    let remaining = templates.filter(t => t.parent_name !== null)
    let maxPasses = 5

    while (remaining.length > 0 && maxPasses-- > 0) {
      const canInsert   = remaining.filter(t => nameToId.has(t.parent_name))
      const stillPending = remaining.filter(t => !nameToId.has(t.parent_name))
      if (canInsert.length === 0) break

      const records = canInsert.map(t => ({
        user_id:        userId,
        name:           t.name,
        category:       t.category,
        account_type:   t.account_type,
        icon:           t.icon,
        color:          t.color,
        monthly_budget: t.monthly_budget,
        parent_id:      nameToId.get(t.parent_name),
        is_averaged:    t.is_averaged,
        period_months:  t.period_months,
        notes:          t.notes || null,
        order_index:    t.order_index,
        is_system:      t.is_system,
      }))
      const { data } = await supabase
        .from('accounts').insert(records).select('id, name')
      if (data) data.forEach(d => nameToId.set(d.name, d.id))

      remaining = stillPending
    }

    await fetchAccounts(userId)
    // Selesai — reset flag agar bisa diinisialisasi ulang jika diperlukan
    isInitializing.current = false
  }

  // ── useEffect: init saat mount ─────────────────────
  useEffect(() => {
    async function init() {
      if (!supabase) { setLoading(false); return }
      try {
        const { data: { session: sess } } = await supabase.auth.getSession()
        if (!sess) { navigate('/login'); return }
        setSession(sess)

        // Fetch profil
        const { data: prof } = await supabase
          .from('profiles').select('*').eq('id', sess.user.id).single()
        if (prof) setProfile(prof)

        // Fetch akun + transaksi secara paralel
        const [accs] = await Promise.all([
          fetchAccounts(sess.user.id),
          fetchTransactions(sess.user.id),
        ])

        // Jika belum ada akun sama sekali DAN tidak sedang diinisialisasi
        if (accs.length === 0 && prof && !isInitializing.current) {
          await initTemplate(prof, sess.user.id)
        }
      } catch (err) {
        console.error('Anggaran init error:', err)
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Computed ───────────────────────────────────────
  const now        = new Date()
  const bulanLabel = `${BULAN_LABEL[now.getMonth()]} ${now.getFullYear()}`

  // Pengeluaran terpakai per account_id bulan ini
  const spentByAccount = {}
  transactions.forEach(t => {
    if (t.transaction_type === 'expense' && t.account_id) {
      spentByAccount[t.account_id] =
        (spentByAccount[t.account_id] || 0) + Number(t.amount || 0)
    }
  })

  const rootAccounts = accounts.filter(a => !a.parent_id)

  function getSubAccounts(parentId) {
    return accounts.filter(a => a.parent_id === parentId)
  }
  function getTotalBudget(parentId) {
    return getSubAccounts(parentId)
      .reduce((s, a) => s + Number(a.monthly_budget || 0), 0)
  }
  function getTotalSpent(parentId) {
    return getSubAccounts(parentId)
      .reduce((s, a) => s + (spentByAccount[a.id] || 0), 0)
  }

  // Ringkasan global
  const totalDianggarkan = accounts
    .reduce((s, a) => s + Number(a.monthly_budget || 0), 0)
  const totalTerpakai = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalSisa = totalDianggarkan - totalTerpakai

  // ── Simpan budget ──────────────────────────────────
  async function saveBudget(id) {
    const val = Number(editValue) || 0
    await supabase.from('accounts').update({ monthly_budget: val }).eq('id', id)
    const userId = session?.user?.id
    if (userId) await fetchAccounts(userId)
    setEditingId(null)
  }

  // ── Tambah sub-akun baru ───────────────────────────
  async function handleAddSub(parentAccount) {
    if (!newSubName.trim() || !session) return
    const subs = getSubAccounts(parentAccount.id)
    await supabase.from('accounts').insert({
      user_id:        session.user.id,
      parent_id:      parentAccount.id,
      name:           newSubName.trim(),
      category:       parentAccount.category,
      account_type:   parentAccount.account_type,
      icon:           '💰',
      color:          parentAccount.color || '#6366f1',
      monthly_budget: Number(newSubBudget) || 0,
      order_index:    subs.length,
      is_system:      false,
      is_averaged:    false,
      period_months:  1,
    })
    await fetchAccounts(session.user.id)
    setAddingParentId(null)
    setNewSubName('')
    setNewSubBudget(0)
  }

  // ── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat anggaran...</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── Navigasi ── */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {/* ── Judul + toggle view ── */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Anggaran Bulanan</h1>
            <p className="text-sm text-gray-500 mt-0.5">{bulanLabel}</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={viewMode === 'card'
                ? { background: '#6366f1', color: 'white' }
                : { color: '#6b7280' }}
            >
              <LayoutGrid size={15} />
              Kartu
            </button>
            <button
              type="button"
              onClick={() => setViewMode('spreadsheet')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={viewMode === 'spreadsheet'
                ? { background: '#6366f1', color: 'white' }
                : { color: '#6b7280' }}
            >
              <Table size={15} />
              Tabel
            </button>
          </div>
        </div>

        {/* ── 3 Kartu ringkasan ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Total Dianggarkan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1.5" style={{ background: '#3b82f6' }} />
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-1">Total Dianggarkan</p>
              <p className="text-lg font-bold text-gray-800 font-mono">{idr(totalDianggarkan)}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">per bulan</p>
            </div>
          </div>
          {/* Sudah Terpakai */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1.5" style={{ background: '#f59e0b' }} />
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-1">Sudah Terpakai</p>
              <p className="text-lg font-bold text-gray-800 font-mono">{idr(totalTerpakai)}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{bulanLabel}</p>
            </div>
          </div>
          {/* Sisa Anggaran */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1.5" style={{ background: totalSisa < 0 ? '#ef4444' : '#22c55e' }} />
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-1">Sisa Anggaran</p>
              <p className="text-lg font-bold font-mono"
                style={{ color: totalSisa < 0 ? '#ef4444' : '#16a34a' }}>
                {idr(Math.abs(totalSisa))}
              </p>
              <p className="text-[11px] mt-0.5"
                style={{ color: totalSisa < 0 ? '#ef4444' : '#9ca3af' }}>
                {totalSisa < 0 ? 'Defisit ⚠️' : 'masih tersedia'}
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* CARD VIEW                               */}
        {/* ════════════════════════════════════════ */}
        {viewMode === 'card' && (
          <div>
            {rootAccounts.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-sm">Belum ada akun anggaran.</p>
                <p className="text-xs mt-1">Silakan lengkapi profil terlebih dahulu.</p>
              </div>
            )}

            {rootAccounts.map(root => {
              const subs        = getSubAccounts(root.id)
              const totalBudget = getTotalBudget(root.id)
              const badge       = KATEGORI_BADGE[root.category] || {}

              return (
                <div key={root.id} style={{
                  marginBottom: 32,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                }}>
                  {/* Header section induk */}
                  <div style={{ background: '#f9fafb', padding: '16px' }}
                    className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{root.icon}</span>
                      <span className="text-base font-bold text-gray-800">{root.name}</span>
                      {badge.label && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                          style={{ background: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-600 shrink-0">
                      {idr(totalBudget)} / bln
                    </span>
                  </div>

                  {/* Grid kartu sub-akun */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3"
                    style={{ background: 'white' }}>
                    {subs.length === 0 && (
                      <p className="text-xs text-gray-400 col-span-2 py-2 text-center">
                        Belum ada sub-akun.
                      </p>
                    )}

                    {subs.map(akun => {
                      const spent    = spentByAccount[akun.id] || 0
                      const budget   = Number(akun.monthly_budget || 0)
                      const sisa     = budget - spent
                      const pct      = budget > 0
                        ? Math.min((spent / budget) * 100, 100) : 0
                      const isEditing = editingId === akun.id

                      return (
                        <div key={akun.id} style={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: 10,
                          padding: 14,
                        }}>
                          {/* Baris atas: icon + nama + tombol edit */}
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="text-base shrink-0">{akun.icon}</span>
                              <span className="text-sm font-medium text-gray-800 truncate">
                                {akun.name}
                              </span>
                            </div>
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(akun.id)
                                  setEditValue(String(akun.monthly_budget || 0))
                                }}
                                className="text-gray-300 hover:text-indigo-400 transition-colors cursor-pointer shrink-0 ml-2"
                                aria-label="Edit anggaran"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </div>

                          {/* Badge rata-rata */}
                          {akun.is_averaged && (
                            <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 mb-1.5">
                              rata-rata {akun.period_months} bln
                            </span>
                          )}

                          {/* Form edit inline */}
                          {isEditing ? (
                            <div className="mt-1">
                              <input
                                type="number"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter')  saveBudget(akun.id)
                                  if (e.key === 'Escape') setEditingId(null)
                                }}
                                className="w-full border border-indigo-300 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-indigo-200 mb-2"
                                placeholder="0"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveBudget(akun.id)}
                                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white cursor-pointer"
                                  style={{ background: '#22c55e' }}
                                >
                                  <Save size={12} /> Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 cursor-pointer"
                                >
                                  <X size={12} /> Batal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Nominal anggaran */}
                              {budget === 0 ? (
                                <p className="text-xs text-gray-400 mb-1">Belum dianggarkan</p>
                              ) : (
                                <p className="text-sm font-semibold text-gray-800 mb-1">
                                  {idr(budget)}
                                </p>
                              )}

                              {/* Info rata-rata */}
                              {budget > 0 && akun.is_averaged && (
                                <p className="text-[10px] text-gray-400 mb-1">
                                  (total: {idr(budget * akun.period_months)} per {akun.period_months} bln)
                                </p>
                              )}

                              {/* Progress bar */}
                              {budget > 0 && (
                                <div className="mb-2"
                                  style={{ height: 6, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
                                  <div style={{
                                    height: 6, borderRadius: 999,
                                    width: `${pct}%`,
                                    background: barColor(pct),
                                    transition: 'width 0.4s ease',
                                  }} />
                                </div>
                              )}

                              {/* Baris bawah: terpakai & sisa */}
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-gray-400">{idr(spent)} terpakai</span>
                                {budget > 0 && (
                                  <span style={{ color: sisa < 0 ? '#ef4444' : '#16a34a' }}>
                                    {sisa < 0
                                      ? `${idr(-sisa)} lebih`
                                      : `${idr(sisa)} sisa`}
                                  </span>
                                )}
                              </div>
                            </>
                          )}

                          {/* Notes */}
                          {akun.notes && !isEditing && (
                            <p className="text-[10px] text-gray-400 italic mt-1.5 border-t border-gray-50 pt-1.5">
                              {akun.notes}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Tombol tambah sub-akun */}
                  <div className="px-4 pb-4" style={{ background: 'white' }}>
                    {addingParentId === root.id ? (
                      <div className="border border-dashed border-indigo-200 rounded-xl p-3"
                        style={{ background: '#f5f3ff' }}>
                        <p className="text-xs font-semibold text-indigo-700 mb-2">
                          Sub-akun baru di "{root.name}"
                        </p>
                        <input
                          type="text"
                          value={newSubName}
                          onChange={e => setNewSubName(e.target.value)}
                          placeholder="Nama sub-akun"
                          className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 mb-2 bg-white"
                          autoFocus
                        />
                        <input
                          type="number"
                          value={newSubBudget || ''}
                          onChange={e => setNewSubBudget(e.target.value)}
                          placeholder="Anggaran per bulan (Rp)"
                          className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 mb-2 bg-white"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddSub(root)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                            style={{ background: '#22c55e' }}
                          >
                            <Save size={12} /> Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingParentId(null)
                              setNewSubName('')
                              setNewSubBudget(0)
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-600 border border-gray-200 cursor-pointer"
                          >
                            <X size={12} /> Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingParentId(root.id)
                          setNewSubName('')
                          setNewSubBudget(0)
                        }}
                        className="w-full py-2 px-4 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                        style={{ color: '#6366f1', border: '1px dashed #6366f1' }}
                      >
                        + Tambah Sub-akun
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* SPREADSHEET VIEW                        */}
        {/* ════════════════════════════════════════ */}
        {viewMode === 'spreadsheet' && (
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 680 }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6' }}
                      className="border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">
                        Nama Pos
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">
                        Anggaran/Bulan
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">
                        Terpakai
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">
                        Sisa
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs w-28">
                        %
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">
                        Keterangan
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rootAccounts.map(root => {
                      const subs             = getSubAccounts(root.id)
                      const totalBudgetRoot  = getTotalBudget(root.id)
                      const totalSpentRoot   = getTotalSpent(root.id)
                      const sisaRoot         = totalBudgetRoot - totalSpentRoot
                      const pctRoot          = totalBudgetRoot > 0
                        ? Math.min((totalSpentRoot / totalBudgetRoot) * 100, 100) : 0
                      const badge            = KATEGORI_BADGE[root.category] || {}

                      return (
                        <Fragment key={root.id}>
                          {/* Baris induk */}
                          <tr style={{ background: '#f3f4f6' }}
                            className="border-b border-gray-200">
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-2 font-bold text-gray-800">
                                <span>{root.icon}</span>
                                {root.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">
                              {idr(totalBudgetRoot)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-gray-700">
                              {idr(totalSpentRoot)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold"
                              style={{ color: sisaRoot < 0 ? '#ef4444' : '#374151' }}>
                              {idr(Math.abs(sisaRoot))}{sisaRoot < 0 ? ' ⚠️' : ''}
                            </td>
                            <td className="px-4 py-3">
                              {totalBudgetRoot > 0 && (
                                <div className="flex items-center gap-1.5 justify-center">
                                  <div style={{
                                    width: 60, height: 6,
                                    background: '#e5e7eb', borderRadius: 999, overflow: 'hidden',
                                  }}>
                                    <div style={{
                                      width: `${pctRoot}%`, height: 6,
                                      background: barColor(pctRoot), borderRadius: 999,
                                    }} />
                                  </div>
                                  <span className="text-xs text-gray-500 tabular-nums">
                                    {Math.round(pctRoot)}%
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {badge.label && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: badge.bg, color: badge.text }}>
                                  {badge.label}
                                </span>
                              )}
                            </td>
                          </tr>

                          {/* Baris sub-akun */}
                          {subs.map(akun => {
                            const spent        = spentByAccount[akun.id] || 0
                            const budget       = Number(akun.monthly_budget || 0)
                            const sisa         = budget - spent
                            const pct          = budget > 0
                              ? Math.min((spent / budget) * 100, 100) : 0
                            const isTersier    = akun.category === 'tersier'
                            const isEditingThis = editingId === akun.id

                            return (
                              <tr key={akun.id}
                                style={{ background: isTersier ? '#fffbeb' : 'white' }}
                                className="border-b border-gray-100 hover:brightness-95 transition-all">
                                {/* Nama */}
                                <td className="px-4 py-2.5">
                                  <span className="flex items-center gap-2 text-gray-700"
                                    style={{ paddingLeft: 24 }}>
                                    <span className="text-sm shrink-0">{akun.icon}</span>
                                    <span>{akun.name}</span>
                                    {akun.is_averaged && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                        ÷{akun.period_months}bln
                                      </span>
                                    )}
                                  </span>
                                </td>

                                {/* Anggaran — klik untuk edit */}
                                <td className="px-4 py-2.5 text-right">
                                  {isEditingThis ? (
                                    <input
                                      type="number"
                                      value={editValue}
                                      onChange={e => setEditValue(e.target.value)}
                                      onBlur={() => saveBudget(akun.id)}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter')  saveBudget(akun.id)
                                        if (e.key === 'Escape') setEditingId(null)
                                      }}
                                      className="w-28 border border-indigo-300 rounded-lg px-2 py-0.5 text-right text-sm outline-none focus:ring-1 focus:ring-indigo-200"
                                      autoFocus
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingId(akun.id)
                                        setEditValue(String(budget))
                                      }}
                                      className="font-mono hover:text-indigo-600 cursor-pointer transition-colors text-right w-full"
                                      style={{ color: budget === 0 ? '#9ca3af' : '#1f2937' }}
                                    >
                                      {budget === 0 ? '— set' : idr(budget)}
                                    </button>
                                  )}
                                </td>

                                {/* Terpakai */}
                                <td className="px-4 py-2.5 text-right font-mono text-gray-600">
                                  {idr(spent)}
                                </td>

                                {/* Sisa */}
                                <td className="px-4 py-2.5 text-right font-mono"
                                  style={{ color: sisa < 0 ? '#ef4444' : '#374151' }}>
                                  {budget > 0 ? idr(sisa) : '—'}
                                </td>

                                {/* % mini bar */}
                                <td className="px-4 py-2.5">
                                  {budget > 0 ? (
                                    <div className="flex items-center gap-1.5 justify-center">
                                      <div style={{
                                        width: 60, height: 5,
                                        background: '#e5e7eb', borderRadius: 999, overflow: 'hidden',
                                      }}>
                                        <div style={{
                                          width: `${pct}%`, height: 5,
                                          background: barColor(pct), borderRadius: 999,
                                        }} />
                                      </div>
                                      <span className="text-[10px] text-gray-400 tabular-nums">
                                        {Math.round(pct)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-300 text-xs text-center block">—</span>
                                  )}
                                </td>

                                {/* Keterangan */}
                                <td className="px-4 py-2.5 text-xs text-gray-400 italic">
                                  {akun.notes || ''}
                                </td>
                              </tr>
                            )
                          })}
                        </Fragment>
                      )
                    })}

                    {/* Baris TOTAL */}
                    <tr style={{ background: '#1f2937' }}>
                      <td className="px-4 py-3 font-bold text-white text-sm">
                        TOTAL KESELURUHAN
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {idr(totalDianggarkan)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {idr(totalTerpakai)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold"
                        style={{ color: totalSisa < 0 ? '#fca5a5' : '#86efac' }}>
                        {idr(Math.abs(totalSisa))}{totalSisa < 0 ? ' ⚠️' : ''}
                      </td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Catatan baris tersier */}
            <p className="text-xs text-gray-400 mt-3 italic">
              * Baris berlatar kuning adalah pengeluaran tersier (tidak masuk perhitungan dana darurat)
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default Anggaran
