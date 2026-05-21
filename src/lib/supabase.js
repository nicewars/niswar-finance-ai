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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '\n⚠️  Supabase belum dikonfigurasi!\n' +
    '   Buat file .env.local di root project dan isi:\n' +
    '   VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    '   VITE_SUPABASE_ANON_KEY=eyJhbGci...\n'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
