-- ============================================================
-- MIGRATION 001: Tambah kolom UMP/UMK ke tabel profiles
-- ============================================================
-- Cara pakai:
--   Buka Supabase Dashboard → SQL Editor → paste file ini → Run
-- Aman dijalankan berkali-kali (pakai IF NOT EXISTS)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS detected_ump  DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS detected_umk  DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS umk_manual    DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS umk_source    VARCHAR(20) DEFAULT 'ump_fallback';

-- Penjelasan tiap kolom:
-- ┌─────────────────┬────────────────────────────────────────────────────────┐
-- │ detected_ump    │ UMP provinsi yang terdeteksi otomatis saat registrasi  │
-- │ detected_umk    │ UMK kota dari tabel UMK_2026 (null jika kota tdk ada) │
-- │ umk_manual      │ Override manual user lewat /settings/profil            │
-- │ umk_source      │ Sumber aktif: 'umk_database' | 'umk_manual' |         │
-- │                 │               'ump_fallback'                           │
-- └─────────────────┴────────────────────────────────────────────────────────┘

-- Index opsional — mempercepat query filter by source
CREATE INDEX IF NOT EXISTS idx_profiles_umk_source ON profiles (umk_source);
