-- Supabase SQL Editor で一度だけ実行
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#64748b';
