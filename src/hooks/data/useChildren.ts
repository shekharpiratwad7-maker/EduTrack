import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../types/supabase';

type Child = Database['public']['Tables']['profiles']['Row'] & {
  recentAttendance?: { count_present: number; count_absent: number; percentage: number };
  recentGrades?: Array<{ subject: string; score: number; grade: string }>;
};

export function useChildren() {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id || profile.role !== 'parent') return;

    const fetchChildren = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('parent_id', profile.id);

        if (error) throw error;

        const childrenRows = (data || []) as Child[];
        if (childrenRows.length === 0) {
          setChildren([]);
          setLoading(false);
          return;
        }

        const childIds = childrenRows.map((c) => c.id);

        const [attendanceRes, gradesRes] = await Promise.all([
          supabase
            .from('attendance')
            .select('student_id, status')
            .in('student_id', childIds),
          supabase
            .from('grades')
            .select('student_id, subject, score, grade, created_at')
            .in('student_id', childIds)
            .order('created_at', { ascending: false }),
        ]);

        const attendanceRows = attendanceRes.error ? [] : (attendanceRes.data || []);
        const gradesRows = gradesRes.error ? [] : (gradesRes.data || []);

        const enhancedChildren = childrenRows.map((child) => {
          const childAttendance = attendanceRows.filter((a: any) => a.student_id === child.id);
          const presentCount = childAttendance.filter((a: any) => a.status === 'present' || a.status === 'late').length;
          const absentCount = childAttendance.filter((a: any) => a.status === 'absent').length;
          const total = childAttendance.length;
          const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

          const childGrades = gradesRows
            .filter((g: any) => g.student_id === child.id)
            .slice(0, 5)
            .map((g: any) => ({
              subject: g.subject,
              score: g.score,
              grade: g.grade,
            }));

          return {
            ...child,
            recentAttendance: { count_present: presentCount, count_absent: absentCount, percentage },
            recentGrades: childGrades,
          };
        });

        setChildren(enhancedChildren);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [profile?.id]);

  const refetch = () => {/* impl refetch */};

  return { children, loading, error, refetch };
}

