-- Migration: Update status_pendaftaran check constraint and add document_verification column
-- Created: 2026-08-21

ALTER TABLE public.pendaftaran DROP CONSTRAINT IF EXISTS pendaftaran_status_pendaftaran_check;
ALTER TABLE public.pendaftaran ADD CONSTRAINT pendaftaran_status_pendaftaran_check 
    CHECK (status_pendaftaran IN ('Draft', 'Verifikasi', 'Pembayaran', 'Seleksi', 'Lulus', 'Gugur', 'Revisi'));

ALTER TABLE public.pendaftaran ADD COLUMN IF NOT EXISTS document_verification JSONB DEFAULT '{}'::jsonb;
