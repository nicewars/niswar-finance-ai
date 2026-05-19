# Niswar Finance AI — Context for Claude Code

## Tentang Project
Aplikasi web pencatat keuangan pribadi berbasis AI.
Nama: Niswar Finance AI
Owner: Niswar
Lokasi: C:\Users\LSTFMIPAUI\Projects\niswar-finance-ai\
Status: Fase 1 — Setup & Fondasi

## Profil User
- Pemula TOTAL di coding, tidak punya background programming
- Background: ekonomi/akuntansi (paham konsep keuangan)
- OS: Windows, Username: LSTFMIPAUI
- Subscription: Claude Pro
- SELALU gunakan Bahasa Indonesia santai
- SELALU jelaskan dengan analogi sehari-hari
- SELALU jelaskan APA yang akan dilakukan sebelum eksekusi
- Kalau ada error: jelaskan APA, KENAPA, dan cara FIX

## Tech Stack
- Frontend: React 18 + Vite
- Styling: Tailwind CSS + shadcn/ui
- Database & Auth: Supabase
- Charts: Recharts
- Routing: React Router DOM
- Hosting: Vercel (fase 7)
- Language: JavaScript (bukan TypeScript)

## Konvensi Kode
- File: kebab-case (contoh: dashboard-card.jsx)
- Component: PascalCase (contoh: DashboardCard)
- Variable: camelCase (contoh: totalExpense)
- Semua teks UI: Bahasa Indonesia santai
- Semua comment kode: Bahasa Indonesia
- Mobile-first: utamakan tampilan 375px

## Visual Style
- Warna primer: gradient ungu-biru (#6366F1 → #3B82F6)
- Rounded corners modern
- Tone Gen Z + behavioral finance

## Struktur Folder Target
src/
  pages/       → halaman (Login, Dashboard, Transaksi, dll)
  components/  → komponen UI reusable
  lib/         → koneksi Supabase & utility
  App.jsx      → routing utama
public/        → gambar, ikon
.env.local     → RAHASIA — jangan di-commit ke GitHub!

## Checklist Fase 1
- [x] Setup environment (Node, Git, Desktop App)
- [x] Folder project & CLAUDE.md
- [ ] Git init & push ke GitHub
- [ ] React project inisialisasi (React+Vite+Tailwind+shadcn)
- [ ] Halaman Login (/login)
- [ ] Halaman Pilih Tipe Akun (/register-type)
- [ ] Form Registrasi Individu 4-step (/register/individu)
- [ ] Supabase setup & Authentication
- [ ] Chart of Accounts database dengan hierarki
- [ ] Input Transaksi + sub-akun otomatis
- [ ] Dashboard dengan grafik

## Fitur Inti yang Akan Dibangun
1. Login & Registrasi (Individu & Bisnis)
2. Chart of Accounts hierarki parent-child otomatis
3. Input transaksi (manual, voice, scan struk — fase 2)
4. AI semantic matching untuk sub-akun baru
5. Dashboard dengan 17 grafik
6. Sistem peringatan 80% prediktif harian
7. Penyusutan aset otomatis (metode garis lurus)
8. Multi-currency + konversi real-time
9. 5 persona AI berbeda

## Catatan Penting
- Setiap membuat kode, jelaskan rencana dulu sebelum eksekusi
- Semua error message UI dalam Bahasa Indonesia
- Prioritaskan mobile-first responsive
- Hemat quota: gunakan Sonnet untuk task harian
