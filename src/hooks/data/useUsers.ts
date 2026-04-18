import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import type { Database } from '../../types/supabase';
import { toast } from 'sonner';

type User = Database['public']['Tables']['profiles']['Row'] & {
  roleDisplay: string;
  status: 'Active' | 'Inactive';
  email?: string;
};

const roleDisplayMap: Record<string, string> = {
  'admin': 'Admin',
  'teacher': 'Teacher',
  'student': 'Student',
  'parent': 'Parent',
};

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const userList = (data || []).map((profile: any) => ({
        ...profile,
        email: profile.email || 'N/A',
        roleDisplay: roleDisplayMap[profile.role] || profile.role,
        status: 'Active' as const,
        created_at: profile.updated_at, // Use updated_at as fallback
      }));

      setUsers(userList);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (data: { name: string; email: string; password: string; role: string }) => {
    try {
      // Check if admin role already exists if trying to create an admin
      if (data.role === 'admin') {
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');
        
        if (countError) throw countError;
        if (count && count > 0) {
          throw new Error('Only one administrator is allowed in the system.');
        }
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { name: data.name, role: data.role } },
      });
      if (authError) throw authError;

      if (!authData.user) throw new Error('No user returned from auth');

      // Insert profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        name: data.name,
        role: data.role as any,
      });
      if (profileError) throw profileError;

      toast.success('User created successfully');
      await refreshUsers();
      return authData.user;
    } catch (err: any) {
      toast.error(`Create failed: ${err.message}`);
      throw err;
    }
  };

  const updateUser = async (id: string, updates: { name?: string; role?: string }) => {
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('User updated');
      await refreshUsers();
    } catch (err: any) {
      console.error('Update User Error:', err);
      toast.error(`Update failed: ${err.message}`);
      throw err;
    }
  };

  const deleteUser = async (id: string, email: string) => {
    try {
      // Soft delete or hard? For now, delete profile, admin can delete auth separately
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast.success('User deleted');
      await refreshUsers();
    } catch (err: any) {
      console.error('Delete User Error:', err);
      toast.error(`Delete failed: ${err.message}`);
      throw err;
    }
  };

  const refreshUsers = fetchUsers;

  return { 
    users, loading, error, refreshUsers, 
    createUser, updateUser, deleteUser 
  };
}

