import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../types/supabase';

type Assignment = Database['public']['Tables']['assignments']['Row'] & {
  submissionCount?: number;
};

export function useAssignments(classId?: string) {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch assignments with submission counts
        const { data, error } = await supabase
          .from('assignments')
          .select(`
            *,
            submissions:submissions(count)
          `)
          .order('due_date');

        if (error) {
          const message = String(error?.message || '').toLowerCase();
          const isMissingAssignmentsTable =
            message.includes("could not find the table 'public.assignments'") ||
            message.includes('relation "public.assignments" does not exist');

          if (isMissingAssignmentsTable) {
            setAssignments([]);
            setError(null);
            return;
          }
          throw error;
        }

        let rows = (data || []) as any[];
        
        // Map submission count from the nested structure
        rows = rows.map(row => ({
          ...row,
          submissionCount: row.submissions?.[0]?.count || 0
        }));

        // Legacy-safe filter: only apply teacher filter when column exists.
        if (profile?.role === 'teacher' && rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], 'teacher_id')) {
          rows = rows.filter((row: any) => row.teacher_id === profile.id);
        }

        setAssignments(rows);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.id) fetchAssignments();
  }, [profile?.id, classId]);

  const createAssignment = async (newAssignment: Omit<Assignment, 'id' | 'created_at' | 'submissionCount'>) => {
    const { data, error } = await supabase
      .from('assignments')
      .insert(newAssignment)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  return { assignments, loading, error, createAssignment };
}

// Derived stats (todo: submission table later)
export function getAssignmentStats(assignments: Assignment[]) {
  // Mock stats for now, replace when submissions table added
  return assignments.map(ass => ({
    assignment: ass.title,
    total: 35,
    submitted: Math.floor(Math.random() * 10) + 25,
    pending: 35 - (Math.floor(Math.random() * 10) + 25)
  }));
}

