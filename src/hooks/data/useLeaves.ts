import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../types/supabase';


type Leave = Database['public']['Tables']['leave_applications']['Row'] & {
  profiles: {
    name: string;
    class_grade: string | null;
    class_section: string | null;
  } | null;
};

export function useLeaves(status?: 'pending') {
  const { profile: authProfile } = useAuth();

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authProfile?.id) {
      setLeaves([]);
      setLoading(false);
      return;
    }

    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query leaves without relational joins first to avoid schema-cache/FK errors.
        let query: any = supabase
          .from('leave_applications')
          .select('*')
          .order('created_at', { ascending: false });

        let { data, error } = await query;

        if (error) {
          // Legacy fallback table name.
          const legacy = await supabase
            .from('leaves')
            .select('*')
            .order('created_at', { ascending: false });
          data = legacy.data as any;
          error = legacy.error;
        }

        if (error) throw error;

        let hydratedLeaves: any[] = (data ?? []) as any[];

        if (hydratedLeaves.length > 0) {
          const studentIds = Array.from(new Set((data as any[]).map((l) => l.student_id).filter(Boolean)));
          if (studentIds.length > 0) {
            const { data: profileRows } = await supabase
              .from('profiles')
              .select('id, name, class_grade, class_section')
              .in('id', studentIds);

            const profileMap = new Map((profileRows || []).map((p: any) => [p.id, p]));
            hydratedLeaves = (data as any[]).map((leave) => ({
              ...leave,
              profiles: profileMap.get(leave.student_id) || null,
            }));
          } else {
            hydratedLeaves = (data as any[]).map((leave) => ({ ...leave, profiles: null }));
          }
        }

        // Legacy-safe filtering: only filter by teacher_id if column exists in returned rows.
        if (authProfile.role !== 'admin') {
          const hasTeacherIdColumn = hydratedLeaves.length > 0 && Object.prototype.hasOwnProperty.call(hydratedLeaves[0], 'teacher_id');
          if (hasTeacherIdColumn) {
            hydratedLeaves = hydratedLeaves.filter(
              (leave: any) => leave.teacher_id === authProfile.id || leave.teacher_id === null
            );
          }
        }

        // Apply status filter client-side for mixed schemas where status might be null/missing.
        if (status === 'pending') {
          hydratedLeaves = hydratedLeaves.filter((leave: any) => {
            const s = String(leave?.status || '').toLowerCase();
            return s === '' || s === 'pending' || s === 'null';
          });
        }

        setLeaves(hydratedLeaves as any);

        console.log('🍃 Leaves fetched:', {
          count: hydratedLeaves.length,
          role: authProfile.role,
        });

      } catch (err: any) {
        console.error('🍃 useLeaves ERROR:', err);
        setError(err.message);
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();

  }, [authProfile?.id, authProfile?.role, status]);

  const approveLeave = async (id: string) => {
    let studentId: string | null = null;

    const leaveRow = await supabase
      .from('leave_applications')
      .select('id, student_id')
      .eq('id', id)
      .maybeSingle();

    let updateResult = await supabase
      .from('leave_applications')
      .update({ status: 'approved' })
      .eq('id', id);

    if (updateResult.error) {
      const legacyRow = await supabase
        .from('leaves')
        .select('id, student_id')
        .eq('id', id)
        .maybeSingle();
      if (!legacyRow.error) {
        studentId = (legacyRow.data as any)?.student_id || null;
      }
      updateResult = await supabase
        .from('leaves')
        .update({ status: 'approved' })
        .eq('id', id);
    } else {
      studentId = (leaveRow.data as any)?.student_id || null;
    }

    if (updateResult.error) throw updateResult.error;

    if (studentId) {
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('parent_id, name')
        .eq('id', studentId)
        .maybeSingle();
      const parentId = (studentProfile as any)?.parent_id;
      if (parentId) {
        await supabase.from('notifications').insert({
          recipient_id: parentId,
          title: 'Leave Approved',
          message: `Leave request for ${(studentProfile as any)?.name || 'your child'} has been approved.`,
          type: 'leave',
        } as any);
      }
    }
  };

  const rejectLeave = async (id: string) => {
    let studentId: string | null = null;

    const leaveRow = await supabase
      .from('leave_applications')
      .select('id, student_id')
      .eq('id', id)
      .maybeSingle();

    let updateResult = await supabase
      .from('leave_applications')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (updateResult.error) {
      const legacyRow = await supabase
        .from('leaves')
        .select('id, student_id')
        .eq('id', id)
        .maybeSingle();
      if (!legacyRow.error) {
        studentId = (legacyRow.data as any)?.student_id || null;
      }
      updateResult = await supabase
        .from('leaves')
        .update({ status: 'rejected' })
        .eq('id', id);
    } else {
      studentId = (leaveRow.data as any)?.student_id || null;
    }

    if (updateResult.error) throw updateResult.error;

    if (studentId) {
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('parent_id, name')
        .eq('id', studentId)
        .maybeSingle();
      const parentId = (studentProfile as any)?.parent_id;
      if (parentId) {
        await supabase.from('notifications').insert({
          recipient_id: parentId,
          title: 'Leave Rejected',
          message: `Leave request for ${(studentProfile as any)?.name || 'your child'} has been rejected.`,
          type: 'leave',
        } as any);
      }
    }
  };

  return { leaves, loading, error, approveLeave, rejectLeave };
}