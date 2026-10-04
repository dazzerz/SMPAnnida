-- =====================================================================
-- 20261004_ppdb_status_machine.sql
--
-- Menyatukan mesin status PPDB dan menutup celah RLS (audit P0-1 + P0-3).
--
-- 1) Enum status_pendaftaran FINAL (satu-satunya sumber):
--      Draft       : terdaftar, menunggu bukti DP / validasi DP
--      Verifikasi  : DP tervalidasi, berkas diperiksa panitia
--      Revisi      : ada berkas ditolak, wali perlu unggah ulang
--      Seleksi     : berkas valid, tes tahfidz
--      Lulus       : lulus seleksi
--      Gugur       : tidak lulus (menggantikan 'Tidak Lulus')
--      Diterima    : sudah dikonversi menjadi siswa aktif
--    'Pembayaran' dan 'Tidak Lulus' dihapus (tidak pernah dipakai / diganti 'Gugur').
--    Jangan membuat constraint status tandingan di migrasi lain.
--
-- 2) Trigger penjaga: WALI MURID tidak boleh mengubah status_pendaftaran
--    dan tidak boleh menandai berkas 'approved' sendiri.
--      - INSERT oleh non-staf: status wajib 'Draft'.
--      - UPDATE oleh non-staf: status tidak boleh berubah, KECUALI
--        Revisi -> Verifikasi saat tidak ada lagi berkas berstatus 'rejected'
--        (alur unggah ulang di js/ppdb/db.js updateDocUploadStatus).
--      - Staf = get_my_role() IN ('admin','panitia_ppdb') atau is_admin().
--      - SQL Editor / service_role (current_user postgres/supabase_admin/service_role) lolos.
--    Policy RLS lama TIDAK diubah.
--
-- Dijalankan MANUAL oleh pemilik proyek (Supabase SQL Editor). Idempoten.
-- =====================================================================

BEGIN;

-- Rapikan data lama sebelum constraint baru dipasang.
UPDATE public.pendaftaran SET status_pendaftaran = 'Gugur'      WHERE status_pendaftaran = 'Tidak Lulus';
UPDATE public.pendaftaran SET status_pendaftaran = 'Verifikasi' WHERE status_pendaftaran = 'Pembayaran';

ALTER TABLE public.pendaftaran DROP CONSTRAINT IF EXISTS pendaftaran_status_pendaftaran_check;
ALTER TABLE public.pendaftaran ADD CONSTRAINT pendaftaran_status_pendaftaran_check CHECK (
  status_pendaftaran IN ('Draft','Verifikasi','Revisi','Seleksi','Lulus','Gugur','Diterima')
);

CREATE OR REPLACE FUNCTION public.guard_pendaftaran_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  k text;
  old_docs jsonb;
BEGIN
  -- SQL Editor, migrasi, dan service_role bebas.
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Staf PPDB bebas.
  IF public.get_my_role() IN ('admin', 'panitia_ppdb') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status_pendaftaran IS DISTINCT FROM 'Draft' THEN
      RAISE EXCEPTION 'Pendaftaran baru harus berstatus Draft.' USING ERRCODE = '42501';
    END IF;
    old_docs := '{}'::jsonb;
  ELSE
    IF NEW.status_pendaftaran IS DISTINCT FROM OLD.status_pendaftaran THEN
      IF NOT (
        OLD.status_pendaftaran = 'Revisi'
        AND NEW.status_pendaftaran = 'Verifikasi'
        AND NOT EXISTS (
          SELECT 1 FROM jsonb_each(CASE WHEN jsonb_typeof(NEW.document_verification) = 'object' THEN NEW.document_verification ELSE '{}'::jsonb END) d
          WHERE d.value ->> 'status' = 'rejected'
        )
      ) THEN
        RAISE EXCEPTION 'Status pendaftaran hanya dapat diubah oleh panitia.' USING ERRCODE = '42501';
      END IF;
    END IF;
    old_docs := CASE WHEN jsonb_typeof(OLD.document_verification) = 'object' THEN OLD.document_verification ELSE '{}'::jsonb END;
  END IF;

  -- Wali tidak boleh menyetujui berkas/DP sendiri.
  IF NEW.document_verification IS NOT NULL AND jsonb_typeof(NEW.document_verification) = 'object' THEN
    FOR k IN SELECT jsonb_object_keys(NEW.document_verification) LOOP
      IF NEW.document_verification -> k ->> 'status' = 'approved'
         AND COALESCE(old_docs -> k ->> 'status', '') <> 'approved' THEN
        RAISE EXCEPTION 'Persetujuan berkas hanya dapat dilakukan oleh panitia.' USING ERRCODE = '42501';
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_pendaftaran_status ON public.pendaftaran;
CREATE TRIGGER trg_guard_pendaftaran_status
  BEFORE INSERT OR UPDATE ON public.pendaftaran
  FOR EACH ROW EXECUTE FUNCTION public.guard_pendaftaran_status();

COMMIT;

-- Verifikasi setelah dijalankan:
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'pendaftaran_status_pendaftaran_check';
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.pendaftaran'::regclass AND NOT tgisinternal;
-- SELECT status_pendaftaran, count(*) FROM public.pendaftaran GROUP BY 1;
--
-- Uji manual (login sebagai wali murid, lewat aplikasi atau PostgREST):
--   UPDATE pendaftaran SET status_pendaftaran = 'Lulus' WHERE id = '<id sendiri>';  -- harus GAGAL (42501)
--
-- Rollback:
-- DROP TRIGGER IF EXISTS trg_guard_pendaftaran_status ON public.pendaftaran;
-- DROP FUNCTION IF EXISTS public.guard_pendaftaran_status();
-- (constraint lama bisa dipasang ulang dengan daftar 9 nilai sebelumnya)
