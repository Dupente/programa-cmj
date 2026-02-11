-- Execute este script no Editor SQL do Supabase para criar as colunas necessárias para o módulo de Impressoras

-- Adiciona coluna 'model'
ALTER TABLE printers ADD COLUMN IF NOT EXISTS "model" text;

-- Adiciona coluna 'type' (PB ou Color)
ALTER TABLE printers ADD COLUMN IF NOT EXISTS "type" text;

-- Adiciona coluna 'initialCounter' (CamelCase para compatibilidade direta com o código)
ALTER TABLE printers ADD COLUMN IF NOT EXISTS "initialCounter" numeric DEFAULT 0;

-- Adiciona coluna 'readings' para histórico de leituras (Formato JSON)
ALTER TABLE printers ADD COLUMN IF NOT EXISTS "readings" jsonb DEFAULT '[]'::jsonb;

-- (Opcional) Verifica se Location e SubLocation existem, caso contrário cria
ALTER TABLE printers ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS "subLocation" text;

-- NOVAS COLUNAS PARA VALE TRANSPORTE
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "vtEntitled" boolean DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "vtDailyValue" numeric DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS "vtDays" numeric DEFAULT NULL;

-- TABELA PARA CONTROLE DE BLOQUEIO DE MESES (VALE TRANSPORTE)
CREATE TABLE IF NOT EXISTS transport_locks (
  month_key text PRIMARY KEY, -- Ex: 'Janeiro-2025'
  is_locked boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- TABELA PARA CONTROLE DE BLOQUEIO DE MESES (INVENTARIO TI)
CREATE TABLE IF NOT EXISTS inventory_locks (
  month_key text PRIMARY KEY, -- Ex: '2025-02'
  is_locked boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- HABILITAR PERMISSÕES (IMPORTANTE: Executar para corrigir erro de acesso)
ALTER TABLE transport_locks DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_locks DISABLE ROW LEVEL SECURITY;