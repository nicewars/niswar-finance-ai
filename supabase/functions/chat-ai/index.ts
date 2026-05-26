// ─────────────────────────────────────────────────────────────────
// supabase/functions/chat-ai/index.ts
//
// Edge Function: proxy aman ke Anthropic API.
// Frontend memanggil fungsi ini lewat supabase.functions.invoke().
// API key Anthropic TIDAK pernah menyentuh browser — aman!
//
// Cara deploy:
//   supabase functions deploy chat-ai
//
// Cara set secret:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// ─────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// ── Header CORS — wajib agar browser tidak diblokir ──────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Tangani preflight request dari browser (selalu kirim dulu sebelum POST)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Ambil API key dari secret Supabase (aman, tidak terekspos ke browser)
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY belum di-set di Supabase secrets!')
      return new Response(
        JSON.stringify({ error: 'Konfigurasi server belum lengkap. Hubungi admin.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Ambil data yang dikirim frontend: { system, messages, tools }
    const { system, messages, tools } = await req.json()

    // Validasi input minimal
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages tidak boleh kosong.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // ── Forward ke Anthropic API ──────────────────────────────────
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: system || '',
        messages,
        tools: tools || [],
      }),
    })

    const data = await anthropicResponse.json()

    // Kalau Anthropic balik error, teruskan ke frontend
    if (!anthropicResponse.ok) {
      console.error('Anthropic API error:', data)
      return new Response(
        JSON.stringify({
          error: data?.error?.message || `Anthropic error: ${anthropicResponse.status}`,
        }),
        {
          status: anthropicResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Sukses — kembalikan respons Anthropic ke frontend
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    // Error tak terduga (network, JSON parse, dll)
    console.error('Edge Function error:', err)
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server. Coba lagi.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
