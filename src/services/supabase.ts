/* ========================================

Supabaseとの接続設定

======================================== */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/* ========================================

環境変数の確認

======================================== */

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Supabaseの環境変数が設定されていません')
}

/* ========================================

Supabaseクライアント

======================================== */

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
)