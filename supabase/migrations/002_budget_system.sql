-- ═══════════════════════════════════════════════════════════════
-- MIGRASI 002: Sistem Anggaran (Budget System)
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Tabel akun anggaran dengan struktur hierarki
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL
    CHECK (account_type IN ('income','expense','savings','debt')),
  category TEXT NOT NULL
    CHECK (category IN (
      'kebutuhan_pokok','zakat_agama',
      'tabungan_investasi','utang_cicilan','tersier'
    )),
  monthly_budget DECIMAL(15,2) DEFAULT 0,
  is_averaged BOOLEAN DEFAULT FALSE,
  period_months INTEGER DEFAULT 1,
  icon TEXT DEFAULT '💰',
  color TEXT DEFAULT '#6366f1',
  order_index INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel transaksi harian
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('income','expense','transfer')),
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS untuk accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own accounts"
  ON accounts FOR ALL USING (auth.uid() = user_id);

-- RLS untuk transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);

-- Trigger updated_at untuk accounts
CREATE TRIGGER trigger_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_accounts_user_id
  ON accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_parent_id
  ON accounts (parent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date
  ON transactions (user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id
  ON transactions (account_id);
