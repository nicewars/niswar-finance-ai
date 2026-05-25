import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────
function idr(n) {
  if (!n && n !== 0) return '—'
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const BUDGET_TYPE_LABEL = {
  fixed_monthly: 'Tetap/Bulan',
  sinking_fund:  'Sinking Fund',
  savings_goal:  'Target Tabungan',
}

// Render markdown dasar: **bold**, *italic*, baris baru
function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, li) => {
    if (!line.trim()) return <br key={li} />
    const parts = line.split(/(\*\*.*?\*\*|\*[^*]+?\*)/g)
    const rendered = parts.map((part, pi) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={pi}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={pi}>{part.slice(1, -1)}</em>
      return <span key={pi}>{part}</span>
    })
    return <p key={li} className="mb-1 last:mb-0">{rendered}</p>
  })
}

// ─────────────────────────────────────────────────────
// BUBBLE PESAN
// ─────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isAI = message.role === 'assistant'

  if (isAI) {
    return (
      <div className="flex items-start gap-2.5 mb-4">
        {/* Avatar AI */}
        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: '#6366f1' }}>
          AI
        </div>
        {/* Bubble */}
        <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm shadow-sm px-4 py-3">
          <div className="text-sm text-gray-800 leading-relaxed">
            {renderMarkdown(message.content)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3"
        style={{ background: '#6366f1' }}>
        <p className="text-sm text-white leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 mb-4">
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ background: '#6366f1' }}>
        AI
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 flex items-center gap-1.5">
        <span className="animate-bounce w-2 h-2 bg-gray-400 rounded-full inline-block"
          style={{ animationDelay: '0ms' }} />
        <span className="animate-bounce w-2 h-2 bg-gray-400 rounded-full inline-block"
          style={{ animationDelay: '150ms' }} />
        <span className="animate-bounce w-2 h-2 bg-gray-400 rounded-full inline-block"
          style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// BUDGET SUMMARY CARD
// ─────────────────────────────────────────────────────
function BudgetSummaryCard({ draft, bulanLabel, onRevise, onSave, isLoading }) {
  if (!draft) return null
  const items = draft.accounts_update || []
  const total = items.reduce((s, a) => s + (a.monthly_budget || 0), 0)

  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden border border-indigo-200 shadow-md"
      style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
        <p className="text-sm font-bold text-indigo-800">
          📊 Rencana Anggaran {bulanLabel}
        </p>
        <span className="text-xs text-indigo-500">{items.length} pos</span>
      </div>

      {/* Tabel */}
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'rgba(99,102,241,0.08)' }}
              className="border-b border-indigo-100">
              <th className="text-left px-4 py-2 text-indigo-600 font-semibold">Pos</th>
              <th className="text-right px-4 py-2 text-indigo-600 font-semibold">Budget/Bulan</th>
              <th className="text-left px-4 py-2 text-indigo-600 font-semibold">Tipe</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-indigo-50 last:border-0">
                <td className="px-4 py-1.5 text-gray-700">{item.name}</td>
                <td className="px-4 py-1.5 text-right font-mono text-gray-800">
                  {idr(item.monthly_budget)}
                </td>
                <td className="px-4 py-1.5 text-gray-500">
                  {BUDGET_TYPE_LABEL[item.budget_type] || item.budget_type || '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#4f46e5' }}>
              <td className="px-4 py-2 font-bold text-white text-xs">TOTAL</td>
              <td className="px-4 py-2 text-right font-mono font-bold text-white text-xs">
                {idr(total)}
              </td>
              <td className="px-4 py-2 text-xs text-indigo-200">
                {draft.ai_summary ? '✓ AI verified' : ''}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Tombol aksi */}
      <div className="px-4 py-3 flex gap-2 justify-end border-t border-indigo-100">
        <button
          type="button"
          onClick={onRevise}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold border border-indigo-300 text-indigo-600 bg-white cursor-pointer hover:bg-indigo-50 transition-colors"
        >
          Revisi
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-50 transition-opacity"
          style={{ background: '#22c55e' }}
        >
          {isLoading ? 'Menyimpan...' : 'Setujui & Simpan →'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// HALAMAN UTAMA — AI PERENCANA KEUANGAN
// ─────────────────────────────────────────────────────
function PerencanaanKeuangan() {
  const navigate = useNavigate()

  const [messages,    setMessages]    = useState([])
  const [inputText,   setInputText]   = useState('')
  const [isLoading,   setIsLoading]   = useState(false)
  const [profile,     setProfile]     = useState(null)
  const [session,     setSession]     = useState(null)
  const [budgetDraft, setBudgetDraft] = useState(null)
  const [showSummary, setShowSummary] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  const now        = new Date()
  const bulanLabel = `${BULAN_ID[now.getMonth()]} ${now.getFullYear()}`

  // Auto-scroll ke bawah saat messages atau loading berubah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Fungsi utama: kirim pesan ke Anthropic API ─────
  async function sendMessageToAI(userMessage, currentProfile) {
    const prof = currentProfile || profile
    if (!prof) return
    setIsLoading(true)

    // Tampilkan pesan user di chat (kecuali trigger awal)
    if (userMessage !== 'START_ONBOARDING') {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    }

    // ── Hitung data keuangan dari profil ─────────────
    const gajiPokok       = prof.gaji_pokok        || 0
    const tunjanganTetap  = prof.tunjangan_tetap    || 0
    const totalPendapatan = gajiPokok + tunjanganTetap
    const bpjsKes         = Math.min(totalPendapatan, 12_000_000) * 0.01
    const bpjsTK          = (totalPendapatan * 0.02)
                          + (Math.min(totalPendapatan, 11_086_300) * 0.01)

    // ── System prompt ─────────────────────────────────
    const systemPrompt = `Kamu adalah AI Perencana Keuangan dari Smart Finance AI. \
Tugasmu membantu ${prof.nama_lengkap || 'pengguna'} menyusun anggaran bulanan ${bulanLabel} \
yang realistis melalui percakapan yang hangat dan natural.

DATA PENGGUNA:
Nama: ${prof.nama_lengkap || '—'}
Gaji Pokok: Rp ${gajiPokok.toLocaleString('id-ID')}
Tunjangan Tetap: Rp ${tunjanganTetap.toLocaleString('id-ID')}
Total Pendapatan: Rp ${totalPendapatan.toLocaleString('id-ID')}
Total Potongan BPJS (estimasi): Rp ${Math.round(bpjsKes + bpjsTK).toLocaleString('id-ID')}
Total Cicilan: Rp ${(prof.total_cicilan || 0).toLocaleString('id-ID')}
Status: ${prof.status_pernikahan || '—'}, ${prof.jumlah_tanggungan || 0} tanggungan
Agama: ${prof.agama || '—'}
Domisili: ${prof.kota_kabupaten || '—'}, ${prof.provinsi || '—'}
Kepemilikan Kendaraan: ${JSON.stringify(prof.kepemilikan_kendaraan || [])}
Status Tempat Tinggal: ${prof.status_tempat || '—'}
Tujuan Keuangan: ${JSON.stringify(prof.tujuan_keuangan || [])}

PRINSIP YANG WAJIB KAMU IKUTI:

1. ATURAN 30% KEHATI-HATIAN:
   Tambahkan 30% ke SEMUA estimasi biaya masa depan yang diambil dari internet atau
   input pengguna untuk pengeluaran yang belum terjadi.
   TIDAK berlaku untuk tagihan bulanan yang sudah diketahui pasti (listrik, sewa, cicilan).

2. HIERARKI PRIORITAS (dari tertinggi ke terendah):
   Tier 1: BPJS, pajak, makan minimum, cicilan minimum
   Tier 2: Zakat wajib, target mendesak (deadline < 30 hari)
   Tier 3: Kebutuhan hidup penuh
   Tier 4: Target keuangan deadline < 60 hari
   Tier 5: Sinking fund keselamatan/kesehatan
   Tier 6: Dana darurat dan tabungan strategis
   Tier 7: Sinking fund rutin dan investasi
   Tier 8: Gaya hidup dan tersier

3. SINKING FUND:
   monthly = (biaya_per_kejadian × 130%) / bulan_antara_kejadian
   Contoh: servis motor Rp 500rb setiap 3 bulan = (500.000 × 130%) / 3 = Rp 216.667/bulan

4. TABUNGAN BERBASIS TARGET:
   monthly = (target - sudah_terkumpul) / bulan_tersisa
   Distribusikan berdasarkan urgensi deadline.

5. PERHITUNGAN ZAKAT (jika agama Islam):
   Zakat Profesi: 2.5% × (gaji_bruto - total_outstanding_utang) jika sudah nisab
   Nisab = 85g emas × harga emas terkini (FETCH!)
   Zakat Fitrah: harga_beras/kg × 2.7kg × jumlah_jiwa (FETCH harga beras terkini!)
   Qurban: (harga_kambing_terkini × 130%) / bulan_menuju_1bln_sebelum_idul_adha (FETCH!)

6. REALOKASI DINAMIS:
   Jika total kebutuhan > pendapatan, kurangi dari Tier 8 dulu, naik ke atas.
   Jangan kurangi Tier 1-2. Tampilkan apa yang dikurangi dan alasannya.

ALUR WAWANCARA — tanyakan SATU hal per pesan:

TAHAP A — PEMBUKAAN:
  Sapa hangat, sebut nama, jelaskan apa yang akan kita lakukan bersama.
  Tanyakan: "Gaji bersih yang masuk ke rekening bulan ini berapa?"

TAHAP B — PENDAPATAN:
  Konfirmasi nominal. Tanya penghasilan tambahan bulan ini.
  Tampilkan ringkasan pendapatan total.

TAHAP C — POTONGAN WAJIB:
  Tampilkan estimasi BPJS dan pajak.
  Jika Islam: hitung dan tampilkan zakat profesi.

TAHAP D — KEBUTUHAN TETAP:
  Tanya satu per satu secara natural:
  makan harian, tempat tinggal (sesuai status_tempat),
  listrik, air PAM, internet, transportasi, laundry.

TAHAP E — SINKING FUND:
  "Biasanya beli baju/sepatu seberapa sering? Sekali belanja habis berapa?"
  Jika punya kendaraan: "Servis berapa bulan sekali? Biasanya habis berapa?"
  Tanyakan item lain yang relevan (pajak kendaraan, PBB, dll).
  Hitung monthly sinking fund +30% dan tampilkan.

TAHAP F — QURBAN (jika Muslim):
  "Tahun ini rencananya mau qurban?"
  Jika ya: FETCH harga kambing terkini, hitung +30%, bagi per bulan.

TAHAP G — TUJUAN TABUNGAN:
  Berdasarkan tujuan_keuangan, tanya satu per satu:
  "Untuk [tujuan], sudah ada tabungannya berapa? Target kapan?"

TAHAP H — RINGKASAN:
  Tampilkan tabel ringkasan. Tunjukkan surplus/defisit.
  Jika defisit: tampilkan realokasi yang disarankan.
  Tanya apakah setuju.

TAHAP I — KONFIRMASI & OUTPUT JSON:
  Jika pengguna setuju, OUTPUT JSON PERSIS seperti ini (tidak ada teks lain):
  {"type":"BUDGET_PLAN","data":{"total_income":0,"accounts_update":[{"name":"nama akun","monthly_budget":0,"budget_type":"fixed_monthly","period_amount":null,"period_months":null,"next_occurrence_date":null,"target_amount":null,"target_date":null,"accumulated_amount":null,"priority_tier":1,"price_buffer_pct":0}],"ai_summary":"ringkasan"}}

GAYA KOMUNIKASI:
- Gunakan "kamu" bukan "Anda"
- Bahasa santai tapi informatif
- Berikan estimasi jika pengguna tidak tahu, tanyakan apakah setuju
- Selalu jelaskan MENGAPA kamu menanyakan sesuatu
- Berikan apresiasi singkat setelah pengguna menjawab
- Jangan tampilkan semua pertanyaan sekaligus

GUNAKAN WEB SEARCH untuk: harga emas terkini, harga beras/kg, harga kambing qurban.`

    // ── Bangun array messages untuk API ───────────────
    const apiMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }))

    if (userMessage !== 'START_ONBOARDING') {
      apiMessages.push({ role: 'user', content: userMessage })
    }

    // ── Cek API key ───────────────────────────────────
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ API key Anthropic belum dikonfigurasi.\n\nTambahkan baris berikut ke file .env.local kamu:\n\nVITE_ANTHROPIC_API_KEY=sk-ant-...\n\nLalu restart dev server dengan npm run dev.',
      }])
      setIsLoading(false)
      return
    }

    // ── Panggil Anthropic API ─────────────────────────
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':                    'application/json',
          'x-api-key':                       apiKey,
          'anthropic-version':               '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true',
          'anthropic-beta':                  'web-search-2025-03-05',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system:     systemPrompt,
          tools: [{
            type: 'web_search_20250305',
            name: 'web_search',
          }],
          messages: apiMessages.length > 0
            ? apiMessages
            : [{ role: 'user', content: 'Mulai.' }],
        }),
      })

      const data = await response.json()

      // Tangkap error dari API
      if (data.error) {
        throw new Error(data.error.message || 'Anthropic API error')
      }

      // Kumpulkan semua text block (bisa ada beberapa karena tool use)
      let aiText = ''
      if (Array.isArray(data.content)) {
        aiText = data.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n')
          .trim()
      }

      // ── Cek apakah ada BUDGET_PLAN JSON ──────────────
      // Pattern: cari JSON object yang dimulai dengan {"type":"BUDGET_PLAN"
      const jsonMatch = aiText.match(/(\{"type":"BUDGET_PLAN"[\s\S]*\})/)
      if (jsonMatch) {
        try {
          const budgetData = JSON.parse(jsonMatch[1])
          if (budgetData?.data) {
            setBudgetDraft(budgetData.data)
            setShowSummary(true)
            // Hapus JSON mentah dari teks yang ditampilkan
            aiText = aiText.replace(jsonMatch[1], '').trim()
            if (!aiText) {
              aiText = '✅ Rencana anggaran sudah siap! Silakan review dan setujui di bawah ya.'
            }
          }
        } catch (e) {
          console.error('JSON parse error:', e)
        }
      }

      // Tampilkan respons AI
      if (aiText) {
        setMessages(prev => [...prev, { role: 'assistant', content: aiText }])
      }

    } catch (error) {
      console.error('AI error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `😅 Maaf, ada kendala teknis: ${error.message || 'Unknown error'}.\n\nCoba kirim pesan lagi ya!`,
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // ── Simpan rencana anggaran ke Supabase ────────────
  async function saveBudgetPlan() {
    if (!budgetDraft || !session) return
    setIsLoading(true)

    try {
      const items = budgetDraft.accounts_update || []

      // Update monthly_budget untuk setiap akun yang ditemukan
      for (const item of items) {
        if (!item.name || !item.monthly_budget) continue

        const { data: account } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', session.user.id)
          .ilike('name', `%${item.name}%`)
          .maybeSingle()

        if (account?.id) {
          await supabase
            .from('accounts')
            .update({ monthly_budget: item.monthly_budget })
            .eq('id', account.id)
        }
      }

      // Tandai onboarding selesai di profil
      await supabase
        .from('profiles')
        .update({
          onboarding_completed:    true,
          last_budget_plan_date:   new Date().toISOString().split('T')[0],
        })
        .eq('id', session.user.id)

      // Redirect ke halaman anggaran
      navigate('/anggaran')

    } catch (error) {
      console.error('Save error:', error)
      alert('Gagal menyimpan rencana anggaran. Coba lagi ya.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── useEffect: inisialisasi saat mount ────────────
  useEffect(() => {
    async function init() {
      if (!supabase) return
      try {
        const { data: { session: sess } } = await supabase.auth.getSession()
        if (!sess) { navigate('/login'); return }
        setSession(sess)

        // Fetch profil dengan semua field yang dibutuhkan AI
        const { data: prof } = await supabase
          .from('profiles')
          .select(`
            nama_lengkap, gaji_pokok, tunjangan_tetap,
            total_cicilan, status_pernikahan, jumlah_tanggungan,
            agama, provinsi, kota_kabupaten,
            investasi_aktif, tujuan_keuangan,
            kepemilikan_kendaraan, status_tempat
          `)
          .eq('id', sess.user.id)
          .single()

        if (prof) {
          setProfile(prof)
          // Trigger pesan pembuka AI — pass prof langsung
          // untuk menghindari stale closure
          await sendMessageToAI('START_ONBOARDING', prof)
        }
      } catch (err) {
        console.error('Init error:', err)
        navigate('/login')
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Handle submit ──────────────────────────────────
  function handleSend() {
    const text = inputText.trim()
    if (!text || isLoading) return
    setInputText('')
    sendMessageToAI(text)
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── RENDER ─────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: '#f8fafc' }}>

      {/* ── Header ── */}
      <header className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
          <span className="text-sm font-bold text-gray-800">AI Perencana Keuangan</span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
            style={{ background: '#ede9fe', color: '#5b21b6' }}>
            {bulanLabel}
          </span>
        </div>
      </header>

      {/* ── Chat area + input ── */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-2xl mx-auto w-full">

        {/* Messages scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-5">

          {/* Empty state saat belum ada pesan */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{ background: '#ede9fe' }}>
                🤖
              </div>
              <p className="text-sm">AI Perencana sedang disiapkan...</p>
            </div>
          )}

          {/* Daftar pesan */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}

          {/* Anchor untuk auto-scroll ke bawah */}
          <div ref={messagesEndRef} />
        </div>

        {/* Budget summary card — muncul saat showSummary */}
        {showSummary && budgetDraft && (
          <BudgetSummaryCard
            draft={budgetDraft}
            bulanLabel={bulanLabel}
            onRevise={() => setShowSummary(false)}
            onSave={saveBudgetPlan}
            isLoading={isLoading}
          />
        )}

        {/* ── Area input ── */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'AI sedang memproses...' : 'Tulis pesanmu di sini...'}
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-2xl px-4 py-2.5 text-sm outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400"
              style={{ maxHeight: 120, overflowY: 'auto' }}
              onFocus={e => { e.target.style.borderColor = '#6366f1' }}
              onBlur={e => { e.target.style.borderColor = '#d1d5db' }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !inputText.trim()}
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#6366f1' }}
              aria-label="Kirim pesan"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Enter untuk kirim · Shift+Enter untuk baris baru
          </p>
        </div>

      </div>
    </div>
  )
}

export default PerencanaanKeuangan
