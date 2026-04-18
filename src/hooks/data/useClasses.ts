import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export interface ClassWithTeacher {
  id: string;
  grade: string | null;
  section: string | null;
  teacher_id: string | null;
  room: string | null;
  created_at: string | null;
  teacher_name: string;
}

export function useClasses() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all classes (no FK join)
      let { data, error: fetchError } = await supabase.from('classes').select('*');

      if (fetchError) throw fetchError;

      if (!data) {
        setClasses([]);
        return;
      }

      // Filter for teachers
      if (profile?.role === 'teacher') {
        const filtered = data.filter((c: any) => c.teacher_id === profile.id);
        // Fallback: if teacher has no assigned classes, show all
        if (filtered.length > 0) {
          data = filtered;
        }
      }

      // 2. Fetch teacher names separately
      const teacherIds = [...new Set(data.map((c: any) => c.teacher_id).filter(Boolean))];
      let teacherMap: Record<string, string> = {};

      if (teacherIds.length > 0) {
        const { data: teachers } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', teacherIds);
        if (teachers) {
          teacherMap = Object.fromEntries(teachers.map((t: any) => [t.id, t.name]));
        }
      }

      // 3. Merge teacher names into class data
      const classesWithTeachers: ClassWithTeacher[] = data.map((c: any) => ({
        id: c.id,
        grade: c.grade,
        section: c.section,
        teacher_id: c.teacher_id,
        room: c.room || null,
        created_at: c.created_at,
        teacher_name: c.teacher_id ? (teacherMap[c.teacher_id] || 'Unknown') : 'TBD',
      }));

      setClasses(classesWithTeachers);
    } catch (err: any) {
      console.error('Fetch classes error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile?.role) return;
    fetchClasses();
  }, [profile]);

  const createClass = async (newClass: { grade: string; section: string; teacher_id: string; room?: string | null }) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert({
          grade: newClass.grade,
          section: newClass.section,
          teacher_id: newClass.teacher_id,
          room: newClass.room || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh to get teacher names
      await fetchClasses();
      return data;
    } catch (err: any) {
      console.error('Create class error:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateClass = async (id: string, updates: { grade?: string; section?: string; room?: string | null }) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Refresh to get updated data
      await fetchClasses();
    } catch (err: any) {
      console.error('Update class error:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      // First delete linked assignments to avoid FK constraint error
      const { error: assignError } = await supabase
        .from('assignments')
        .delete()
        .eq('class_id', id);

      if (assignError) {
        console.warn('Assignments delete warning:', assignError.message);
      }

      // Also delete linked grades if any
      const { error: gradesError } = await supabase
        .from('grades')
        .delete()
        .eq('class_id', id);

      if (gradesError) {
        console.warn('Grades delete warning:', gradesError.message);
      }

      // Now delete the class
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Delete class error:', err);
      setError(err.message);
      throw err;
    }
  };

  return { classes, loading, error, refetch: fetchClasses, createClass, updateClass, deleteClass };
}
