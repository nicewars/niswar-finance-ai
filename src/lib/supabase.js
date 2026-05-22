// Koneksi ke Supabase
// ─────────────────────────────────────────────────
// Setup: buat file .env.local di root project, lalu isi:
//   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGci...
//
// Cara cari nilai-nya:
//   Supabase Dashboard → Project Settings → API
//
// ⚠️  JANGAN pernah commit .env.local ke GitHub!
//     File ini sudah ada di .gitignore secara default.
// ─────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cek apakah kredensial sudah benar-benar diisi.
// URL asli Supabase selalu mulai "https://", kunci asli selalu mulai "eyJ" (JWT).
// Kalau belum diisi / masih placeholder → export null, bukan crash.
const isConfigured =
  typeof supabaseUrl === 'string'    && supabaseUrl.startsWith('https://') &&
  typeof supabaseAnonKey === 'string' && supabaseAnonKey.startsWith('eyJ')

if (!isConfigured) {
  console.warn(
    '\n[Niswar Finance AI] ⚠️  Supabase belum dikonfigurasi.\n' +
    '   Fitur simpan data & login tidak aktif.\n' +
    '   Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local\n' +
    '   (dapatkan dari supabase.com → Project Settings → API)\n'
  )
}

// Kalau belum dikonfigurasi, export null.
// Semua komponen yang pakai supabase harus cek "if (supabase)" sebelum memanggil.
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
