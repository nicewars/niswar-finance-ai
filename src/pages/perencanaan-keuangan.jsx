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
// HITUNG PERIODE ANGGARAN BERDASARKAN TANGGAL GAJIAN
// ─────────────────────────────────────────────────────
function hitungPeriodeAnggaran(tanggalGajian) {
  const tgl = tanggalGajian || 1
  const sekarang = new Date()
  const hari  = sekarang.getDate()
  const bulan = sekarang.getMonth()
  const tahun = sekarang.getFullYear()

  let periodeStart, periodeEnd
  if (hari >= tgl) {
    periodeStart = new Date(tahun, bulan, tgl)
    periodeEnd   = new Date(tahun, bulan + 1, tgl - 1)
  } else {
    periodeStart = new Date(tahun, bulan - 1, tgl)
    periodeEnd   = new Date(tahun, bulan, tgl - 1)
  }

  return {
    start: periodeStart.toISOString().split('T')[0],
    end:   periodeEnd.toISOString().split('T')[0],
  }
}

// ─────────────────────────────────────────────────────
// BUBBLE PESAN
// ─────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isAI = message.role === 'assistant'

  if (isAI) {
    return (
      <div className="flex items-start gap-2.5 mb-4">
        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: '#6366f1' }}>
          AI
        </div>
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
// SIMPAN BUDGET PLAN — fungsi murni, tidak sentuh state
// Menerima semua data via parameter eksplisit.
// Mengembalikan string pesan sukses, atau null jika gagal.
// ─────────────────────────────────────────────────────
async function saveBudgetPlan(draft, sessionData, periodeData, sb) {
  if (!draft || !sessionData || !periodeData) return null

  try {
    // Fetch semua akun milik user (data lengkap untuk keperluan create baru)
    const { data: semuaAkunRaw } = await sb
      .from('accounts')
      .select('id, name, category, parent_id, order_index')
      .eq('user_id', sessionData.user.id)

    // Buat array mutable — iterasi berikutnya bisa mencocokkan akun yang baru dibuat
    const semuaAkun = [...(semuaAkunRaw || [])]

    // Upsert budget_plan untuk periode ini
    await sb.from('budget_plans').upsert({
      user_id:         sessionData.user.id,
      plan_month:      periodeData.start,
      total_income:    draft.total_income || 0,
      total_allocated: (draft.accounts_update || [])
        .reduce((s, a) => s + (a.monthly_budget || 0), 0),
      status:          'approved',
      ai_summary:      draft.ai_summary || '',
    }, { onConflict: 'user_id,plan_month' })

    // Update akun yang ada ATAU buat akun baru jika belum ada
    for (const item of (draft.accounts_update || [])) {
      if (!item.name || !item.monthly_budget) continue

      const namaCari = item.name.toLowerCase()
        .replace(/^(tabungan|investasi|zakat|sinking fund):\s*/, '')
        .trim()

      // Cari akun yang paling cocok (exact match dulu, baru contains)
      const cocok = semuaAkun.find(a => {
        const n = a.name.toLowerCase()
        return n === namaCari || n.includes(namaCari) || namaCari.includes(n)
      })

      if (cocok) {
        // ── CASE 1: Akun sudah ada → UPDATE ──────────────────────────
        await sb.from('accounts').update({
          monthly_budget:       item.monthly_budget || 0,
          budget_type:          item.budget_type === 'one_time'
                                  ? 'fixed_monthly'
                                  : (item.budget_type || 'fixed_monthly'),
          period_amount:        item.period_amount || null,
          period_months:        item.period_months || null,
          next_occurrence_date: item.next_occurrence_date || null,
          target_amount:        item.target_amount || null,
          target_date:          item.target_date || null,
          priority_tier:        item.priority_tier || 6,
        }).eq('id', cocok.id)

      } else {
        // ── CASE 2: Akun belum ada → INSERT baru ─────────────────────
        // Cari parent berdasarkan parent_name dari AI
        let parentId = null
        if (item.parent_name) {
          const parentCari = item.parent_name.toLowerCase().trim()
          const parentCocok = semuaAkun.find(a => {
            const n = a.name.toLowerCase()
            return n === parentCari || n.includes(parentCari) || parentCari.includes(n)
          })
          parentId = parentCocok?.id || null
        }

        // order_index = max yang ada + 1
        const maxOrder = semuaAkun.reduce(
          (m, a) => Math.max(m, a.order_index || 0), 0
        )

        const { data: akunBaru } = await sb.from('accounts').insert({
          user_id:              sessionData.user.id,
          name:                 item.name,
          category:             item.category || 'expense',
          parent_id:            parentId,
          monthly_budget:       item.monthly_budget || 0,
          budget_type:          item.budget_type === 'one_time'
                                  ? 'fixed_monthly'
                                  : (item.budget_type || 'fixed_monthly'),
          period_amount:        item.period_amount || null,
          period_months:        item.period_months || null,
          next_occurrence_date: item.next_occurrence_date || null,
          target_amount:        item.target_amount || null,
          target_date:          item.target_date || null,
          priority_tier:        item.priority_tier || 6,
          order_index:          maxOrder + 1,
          is_active:            true,
        }).select('id, name, category, parent_id, order_index').single()

        // Tambahkan ke array lokal agar iterasi berikutnya bisa match
        if (akunBaru) semuaAkun.push(akunBaru)
      }
    }

    // Tandai onboarding selesai di profiles
    await sb.from('profiles').update({
      onboarding_completed:    true,
      onboarding_completed_at: new Date().toISOString(),
      last_budget_plan_date:   periodeData.start,
    }).eq('id', sessionData.user.id)

    return (
      '✅ Rencana anggaran periode ' + periodeData.start +
      ' hingga ' + periodeData.end + ' sudah tersimpan otomatis!\n\n' +
      'Mulai sekarang ceritakan saja pengeluaranmu dan saya akan mencatat ' +
      'semuanya. Atau ketik "ringkasan" kapan saja untuk melihat kondisi ' +
      'keuanganmu. 💪'
    )
  } catch (err) {
    console.error('saveBudgetPlan error:', err)
    return null
  }
}

// ─────────────────────────────────────────────────────
// HALAMAN UTAMA — AI PERENCANA KEUANGAN
// ─────────────────────────────────────────────────────
function PerencanaanKeuangan() {
  const navigate = useNavigate()

  const [messages,  setMessages]  = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [profile,   setProfile]   = useState(null)
  const [session,   setSession]   = useState(null)
  const [periode,   setPeriode]   = useState(null)
  const [chatMode,  setChatMode]  = useState(null)
  // chatMode: null | 'interview' | 'review' | 'daily'

  const messagesEndRef  = useRef(null)
  const inputRef        = useRef(null)
  const hasInitialized  = useRef(false)  // guard agar initChat hanya berjalan sekali

  const now        = new Date()
  const bulanLabel = `${BULAN_ID[now.getMonth()]} ${now.getFullYear()}`

  // ── Auto-scroll ke bawah ──────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── useEffect 1: Fetch data (session, profile, periode, history) ──
  useEffect(() => {
    async function init() {
      if (!supabase) return
      try {
        const { data: { session: sess } } = await supabase.auth.getSession()
        if (!sess) { navigate('/login'); return }
        setSession(sess)

        const { data: prof } = await supabase
          .from('profiles')
          .select(`
            nama_lengkap, gaji_pokok, tunjangan_tetap,
            total_cicilan, status_pernikahan, jumlah_tanggungan,
            agama, provinsi, kota_kabupaten,
            investasi_aktif, tujuan_keuangan,
            kepemilikan_kendaraan, status_tempat,
            tanggal_gajian, current_period_start,
            onboarding_completed
          `)
          .eq('id', sess.user.id)
          .single()

        if (!prof) { navigate('/login'); return }
        setProfile(prof)

        const per = hitungPeriodeAnggaran(prof.tanggal_gajian)
        setPeriode(per)

        if (!prof.current_period_start) {
          await supabase.from('profiles').update({
            current_period_start: per.start,
            current_period_end:   per.end,
          }).eq('id', sess.user.id)
        }
        // Chat history & mode detection dilakukan di useEffect 2

      } catch (err) {
        console.error('Init error:', err)
        navigate('/login')
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── useEffect 2: Inisialisasi chat (ref guard — hanya sekali) ─────
  useEffect(() => {
    if (!session || !profile || !periode || !supabase
        || hasInitialized.current) return

    async function initChat() {
      hasInitialized.current = true

      // 1. Load riwayat chat dari database
      const { data: riwayat } = await supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', session.user.id)
        .eq('period_start', periode.start)
        .order('created_at', { ascending: true })

      if (riwayat && riwayat.length > 0) {
        // Ada riwayat → tampilkan, tidak mulai percakapan baru
        setMessages(riwayat.map(m => ({ role: m.role, content: m.content })))
        setChatMode('daily')
        return
      }

      // 2. Tidak ada riwayat → cek apakah ada anggaran bulan ini
      const { data: planBulanIni } = await supabase
        .from('budget_plans')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('plan_month', periode.start)
        .eq('status', 'approved')
        .maybeSingle()

      if (planBulanIni) {
        // Anggaran ada, chat baru (misal: hapus history) → sapaan harian
        setChatMode('daily')
        await sendMessageToAI('DAILY_GREETING', 'daily')
        return
      }

      // 3. Belum ada anggaran bulan ini → cek data bulan sebelumnya
      const { data: planLalu } = await supabase
        .from('budget_plans')
        .select('id, ai_summary')
        .eq('user_id', session.user.id)
        .eq('status', 'approved')
        .order('plan_month', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (planLalu) {
        setChatMode('review')
        await sendMessageToAI('START_REVIEW', 'review')
      } else {
        setChatMode('interview')
        await sendMessageToAI('START_ONBOARDING', 'interview')
      }
    }

    initChat()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, profile, periode])

  // ── Simpan pesan ke tabel chat_messages ──────────────────────────
  async function simpanPesan(role, content) {
    if (!session?.user?.id || !periode?.start) {
      console.warn('simpanPesan: session atau periode belum siap, skip simpan')
      return
    }
    try {
      await supabase.from('chat_messages').insert({
        user_id:      session.user.id,
        period_start: periode.start,
        period_end:   periode.end,
        role,
        content,
      })
    } catch (err) {
      console.error('simpanPesan error:', err)
      // Tidak throw — gagal simpan tidak boleh menghentikan alur chat
    }
  }

  // ── Simpan transaksi dari AI ke tabel transactions ───────────────
  async function simpanTransaksi(txData) {
    if (!session?.user?.id) return
    try {
      const { data: akun } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('user_id', session.user.id)
        .ilike('name', '%' + txData.account_name + '%')
        .maybeSingle()

      await supabase.from('transactions').insert({
        user_id:          session.user.id,
        account_id:       akun?.id || null,
        amount:           txData.amount,
        transaction_type: txData.transaction_type || 'expense',
        description:      txData.description,
        transaction_date: txData.transaction_date ||
          new Date().toISOString().split('T')[0],
      })
    } catch (err) {
      console.error('Gagal simpan transaksi:', err)
    }
  }

  // ── Fungsi utama: kirim pesan ke AI ──────────────────────────────
  // modeParam diteruskan dari tentukanMode() secara eksplisit
  // karena setChatMode() bersifat async — state belum terbaca
  // di siklus render yang sama.
  async function sendMessageToAI(userMessage, modeParam) {
    if (!supabase) {
      console.error('Supabase client belum siap')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Koneksi belum siap, coba refresh halaman ini.',
      }])
      return
    }
    if (!profile) return

    const currentMode = modeParam || chatMode || 'interview'
    setIsLoading(true)

    // Tampilkan pesan user (kecuali trigger internal)
    const isInternal = ['START_ONBOARDING', 'START_REVIEW', 'DAILY_GREETING']
      .includes(userMessage)

    if (!isInternal) {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    }

    // Simpan pesan user (try-catch terpisah — tidak boleh hentikan AI)
    if (!isInternal) {
      try { await simpanPesan('user', userMessage) } catch (e) {
        console.warn('Gagal simpan pesan user:', e)
      }
    }

    // ── Fetch akun dengan budget untuk system prompt ──
    let ringkasanAnggaran = 'Belum ada data anggaran'
    try {
      const { data: akunTerisi } = await supabase
        .from('accounts')
        .select('name, monthly_budget, budget_type, category, priority_tier')
        .eq('user_id', session.user.id)
        .gt('monthly_budget', 0)
        .order('priority_tier', { ascending: true })

      if (akunTerisi?.length > 0) {
        ringkasanAnggaran = akunTerisi
          .map(a => a.name + ': Rp ' + a.monthly_budget.toLocaleString('id-ID'))
          .join('\n')
      }
    } catch (e) {
      console.warn('Gagal fetch akun untuk prompt:', e)
    }

    // ── Fetch struktur akun untuk aturan pengelolaan ─
    let akunLeaf  = 'Belum ada akun'
    let akunInduk = 'Belum ada kategori'
    try {
      const { data: daftarAkun } = await supabase
        .from('accounts')
        .select('id, name, category, parent_id')
        .eq('user_id', session.user.id)
        .order('order_index', { ascending: true })

      if (daftarAkun?.length > 0) {
        const leafList  = daftarAkun.filter(a => a.parent_id !== null).map(a => a.name)
        const indukList = daftarAkun.filter(a => a.parent_id === null)
          .map(a => a.name + ' (kategori: ' + a.category + ')')
        akunLeaf  = leafList.join(', ')  || 'Belum ada akun'
        akunInduk = indukList.join(', ') || 'Belum ada kategori'
      }
    } catch (e) {
      console.warn('Gagal fetch struktur akun:', e)
    }

    // ── Hitung data keuangan dari profil ──────────────
    const gajiPokok       = profile.gaji_pokok      || 0
    const tunjanganTetap  = profile.tunjangan_tetap  || 0
    const totalPendapatan = gajiPokok + tunjanganTetap
    const bpjsKes         = Math.min(totalPendapatan, 12_000_000) * 0.01
    const bpjsTK          = (totalPendapatan * 0.02)
                          + (Math.min(totalPendapatan, 11_086_300) * 0.01)

    // ── System prompt ─────────────────────────────────
    const systemPrompt = `Kamu adalah AI Perencana Keuangan dari Smart Finance AI. \
Tugasmu membantu ${profile.nama_lengkap || 'pengguna'} menyusun anggaran bulanan ${bulanLabel} \
yang realistis melalui percakapan yang hangat dan natural.

MODE CHAT SAAT INI: ${currentMode}

JIKA MODE = 'interview':
  Lakukan wawancara lengkap sesuai alur yang sudah didefinisikan di bawah.

JIKA MODE = 'review':
  Ini adalah pergantian periode baru. Pengguna sudah pernah membuat anggaran
  sebelumnya. JANGAN lakukan wawancara dari nol.

  Alur review:
  1. Sambut dengan hangat, sebutkan bahwa periode baru sudah dimulai
  2. SELALU tanya gaji bulan ini PERTAMA:
     "Gaji bulan ini berapa? Termasuk semua komponen ya — gaji pokok, tunjangan tetap,
     dan insentif tidak tetap kalau ada (seperti transport, makan, atau lainnya
     yang tergantung kehadiran)"
  3. Setelah gaji dikonfirmasi, tampilkan daftar anggaran bulan lalu per kategori
     dan tanya: "Untuk [nama pos] yang bulan lalu Rp X, bulan ini ada perubahan?"
  4. Jika pengguna bilang tidak ada perubahan untuk semua pos, langsung finalisasi
     dengan nilai yang sama
  5. Output BUDGET_PLAN JSON seperti biasa

  Data anggaran bulan lalu:
${ringkasanAnggaran}

JIKA MODE = 'daily':
  Kamu adalah asisten keuangan harian. JANGAN tanya soal perencanaan anggaran lagi
  karena sudah selesai bulan ini.

  Tugasmu:
  1. Catat pengeluaran yang disebutkan pengguna dalam format TRANSACTION JSON
  2. Jawab pertanyaan tentang kondisi keuangan
  3. Berikan peringatan jika ada pos yang hampir habis anggarannya
  4. Gunakan bahasa singkat dan hangat

  Sapaan harian yang natural, contoh:
  "Halo ${profile.nama_lengkap || 'kamu'}! Ada yang mau dicatat hari ini,
  atau ada yang ingin kamu tanyakan soal keuanganmu? 😊"

  Data anggaran aktif:
${ringkasanAnggaran}

DATA PENGGUNA:
Nama: ${profile.nama_lengkap || '—'}
Gaji Pokok: Rp ${gajiPokok.toLocaleString('id-ID')}
Tunjangan Tetap: Rp ${tunjanganTetap.toLocaleString('id-ID')}
Total Pendapatan: Rp ${totalPendapatan.toLocaleString('id-ID')}
Total Potongan BPJS (estimasi): Rp ${Math.round(bpjsKes + bpjsTK).toLocaleString('id-ID')}
Total Cicilan: Rp ${(profile.total_cicilan || 0).toLocaleString('id-ID')}
Status: ${profile.status_pernikahan || '—'}, ${profile.jumlah_tanggungan || 0} tanggungan
Agama: ${profile.agama || '—'}
Domisili: ${profile.kota_kabupaten || '—'}, ${profile.provinsi || '—'}
Kepemilikan Kendaraan: ${JSON.stringify(profile.kepemilikan_kendaraan || [])}
Status Tempat Tinggal: ${profile.status_tempat || '—'}
Tujuan Keuangan: ${JSON.stringify(profile.tujuan_keuangan || [])}

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

ALUR WAWANCARA (hanya untuk mode 'interview') — tanyakan SATU hal per pesan:

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
  {"type":"BUDGET_PLAN","data":{"total_income":0,"accounts_update":[{"name":"nama akun (pakai nama persis jika sudah ada, atau nama baru)","parent_name":"nama akun induk (isi HANYA jika akun baru, kosongkan jika sudah ada)","category":"expense","monthly_budget":0,"budget_type":"fixed_monthly","period_amount":null,"period_months":null,"next_occurrence_date":null,"target_amount":null,"target_date":null,"accumulated_amount":null,"priority_tier":1,"price_buffer_pct":0}],"ai_summary":"ringkasan"}}

GAYA KOMUNIKASI:
- Gunakan "kamu" bukan "Anda"
- Bahasa santai tapi informatif
- Berikan estimasi jika pengguna tidak tahu, tanyakan apakah setuju
- Selalu jelaskan MENGAPA kamu menanyakan sesuatu
- Berikan apresiasi singkat setelah pengguna menjawab
- Jangan tampilkan semua pertanyaan sekaligus

GUNAKAN WEB SEARCH untuk: harga emas terkini, harga beras/kg, harga kambing qurban.

ATURAN PENGELOLAAN AKUN ANGGARAN:
Daftar akun yang SUDAH ADA milik pengguna:
- Sub-akun (leaf): ${akunLeaf}
- Akun induk (kategori): ${akunInduk}

Ketika membuat BUDGET_PLAN JSON, WAJIB ikuti aturan ini:
1. Jika nama akun SUDAH ADA di daftar sub-akun → gunakan nama yang PERSIS SAMA (tidak diubah).
2. Jika belum ada → buat akun baru, sertakan field "parent_name" (nama akun induk yang paling cocok dari daftar akun induk) dan "category" (income | expense | savings | investment | debt).
3. JANGAN buat duplikat — cek dulu sebelum membuat akun baru.
4. Nilai "budget_type" hanya boleh: "fixed_monthly", "sinking_fund", atau "savings_goal". JANGAN gunakan "one_time".

MODE ASISTEN HARIAN — mencatat pengeluaran:
Ketika pengguna berkata "tadi beli bensin 50rb" atau "habis makan siang 35 ribu",
langsung ekstrak dan output format JSON:
{"type":"TRANSACTION","data":{"description":"nama pengeluaran","amount":nominal_angka,"account_name":"nama akun yang paling cocok","transaction_date":"YYYY-MM-DD","transaction_type":"expense"}}`

    // ── Bangun array messages untuk API ───────────────
    const apiMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }))

    if (!isInternal) {
      apiMessages.push({ role: 'user', content: userMessage })
    }

    // ── Panggil Supabase Edge Function ────────────────
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          system: systemPrompt,
          messages: apiMessages.length > 0
            ? apiMessages
            : [{ role: 'user', content: 'Mulai.' }],
          tools: [{
            type: 'web_search_20250305',
            name: 'web_search',
          }],
        },
      })

      if (error) throw error

      let aiText = ''
      if (data?.content) {
        aiText = data.content
          .filter(block => block.type === 'text')
          .map(block => block.text)
          .join('\n')
          .trim()
      }

      // ── Deteksi dan auto-save BUDGET_PLAN JSON ──────
      // Coba markdown code block dulu, lalu JSON mentah
      const bpMdRegex  = /```(?:json)?\s*(\{[\s\S]*?"type"\s*:\s*"BUDGET_PLAN"[\s\S]*?\})\s*```/
      const bpRawRegex = /(\{[\s\S]*?"type"\s*:\s*"BUDGET_PLAN"[\s\S]*?\})/
      const bpMdMatch  = aiText.match(bpMdRegex)
      const bpRawMatch = aiText.match(bpRawRegex)
      const bpJsonStr  = bpMdMatch ? bpMdMatch[1] : bpRawMatch ? bpRawMatch[1] : null

      if (bpJsonStr) {
        try {
          const budgetData = JSON.parse(bpJsonStr)
          if (budgetData.type === 'BUDGET_PLAN') {
            const pesanSukses = await saveBudgetPlan(
              budgetData.data, session, periode, supabase
            )
            setChatMode('daily')
            // Hapus seluruh blok JSON (termasuk code fence) dari teks AI
            aiText = aiText
              .replace(bpMdMatch ? bpMdMatch[0] : bpJsonStr, '')
              .trim()
            // Gabungkan pesan sukses ke dalam aiText yang sama
            if (pesanSukses) {
              aiText = aiText ? aiText + '\n\n' + pesanSukses : pesanSukses
            }
          }
        } catch (e) {
          console.error('Budget JSON parse error:', e)
        }
      }

      // ── Deteksi TRANSACTION JSON (markdown atau raw) ─
      const txAllMatches = []
      const txMdRegex = /```(?:json)?\s*(\{[\s\S]*?"type"\s*:\s*"TRANSACTION"[\s\S]*?\})\s*```/g
      let txMd
      while ((txMd = txMdRegex.exec(aiText)) !== null) {
        txAllMatches.push({ full: txMd[0], json: txMd[1] })
      }
      // Kalau tidak ada markdown block, coba JSON mentah
      if (txAllMatches.length === 0) {
        const txRawRegex = /\{[\s\S]*?"type"\s*:\s*"TRANSACTION"[\s\S]*?\}/g
        let txRaw
        while ((txRaw = txRawRegex.exec(aiText)) !== null) {
          txAllMatches.push({ full: txRaw[0], json: txRaw[0] })
        }
      }
      for (const match of txAllMatches) {
        try {
          const txData = JSON.parse(match.json)
          if (txData.type === 'TRANSACTION') {
            await simpanTransaksi(txData.data)
            aiText = aiText.replace(match.full, '').trim()
          }
        } catch (e) {
          console.error('TX parse error:', e)
        }
      }

      // Tampilkan respons AI (pesanSukses sudah digabung ke aiText di atas)
      if (aiText) {
        setMessages(prev => [...prev, { role: 'assistant', content: aiText }])
        try { await simpanPesan('assistant', aiText) } catch (e) {
          console.warn('Gagal simpan respons AI:', e)
        }
      }

    } catch (error) {
      console.error('AI invoke error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Error [' + (error?.code || error?.status || 'unknown') + ']: ' +
          (error?.message || 'unknown').slice(0, 80),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // ── Handle submit ────────────────────────────────────────────────
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

  // ── RENDER ───────────────────────────────────────────────────────
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
          <div className="flex items-center gap-2 shrink-0">
            {/* Badge mode aktif */}
            {chatMode && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: chatMode === 'daily' ? '#dcfce7' : '#ede9fe',
                  color:      chatMode === 'daily' ? '#166534' : '#5b21b6',
                }}>
                {chatMode === 'daily'    ? '💬 Harian'
                  : chatMode === 'review'  ? '🔄 Review'
                  : '📋 Wawancara'}
              </span>
            )}
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: '#ede9fe', color: '#5b21b6' }}>
              {bulanLabel}
            </span>
          </div>
        </div>
      </header>

      {/* ── Chat area + input ── */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-2xl mx-auto w-full">

        <div className="flex-1 overflow-y-auto px-4 py-5">

          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{ background: '#ede9fe' }}>
                🤖
              </div>
              <p className="text-sm">AI Perencana sedang disiapkan...</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

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
