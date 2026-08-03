-- 1. Tambahkan kolom class_id yang kurang di attendance_students
ALTER TABLE public.attendance_students 
ADD COLUMN IF NOT EXISTS class_id UUID;

-- 2. Hapus semua data akademik (dummy) agar Migration Center bisa mulai dari nol
-- Kita menggunakan DELETE dan bukan TRUNCATE CASCADE agar tidak merusak data Finance/PPDB 
-- secara tidak sengaja (jika kebetulan terelasi).
DELETE FROM public.teacher_journals;
DELETE FROM public.teacher_attendance;
DELETE FROM public.grades;
DELETE FROM public.attendance_students;
DELETE FROM public.class_schedules;
DELETE FROM public.classes;
DELETE FROM public.subjects;
DELETE FROM public.students;
DELETE FROM public.teachers;
DELETE FROM public.academic_years;

-- Selesai
