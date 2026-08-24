-- =========================================================================
-- PERBAIKAN P1: RPC FUNCTION UNTUK AGREGASI NILAI (REVISI PARAMETER)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_class_ranking(
    p_kelas text,
    p_tahun_ajaran text,
    p_semester text
)
RETURNS TABLE (
    student_id uuid,
    total_nilai numeric,
    count_nilai integer,
    avg_nilai numeric,
    rank bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH student_grades AS (
        SELECT 
            g.student_id,
            COALESCE(SUM(g.nilai), 0) AS total_nilai,
            COUNT(g.id) AS count_nilai,
            CASE WHEN COUNT(g.id) > 0 THEN (SUM(g.nilai) / COUNT(g.id)::numeric) ELSE 0 END AS avg_nilai
        FROM public.grades g
        JOIN public.students s ON s.id = g.student_id
        WHERE s.kelas = p_kelas
          AND g.tahun_ajaran = p_tahun_ajaran
          AND g.semester = p_semester
        GROUP BY g.student_id
    )
    SELECT 
        s.id AS student_id,
        COALESCE(sg.total_nilai, 0) AS total_nilai,
        COALESCE(sg.count_nilai, 0)::integer AS count_nilai,
        COALESCE(sg.avg_nilai, 0) AS avg_nilai,
        RANK() OVER (ORDER BY COALESCE(sg.avg_nilai, 0) DESC) AS rank
    FROM public.students s
    LEFT JOIN student_grades sg ON sg.student_id = s.id
    WHERE s.kelas = p_kelas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
