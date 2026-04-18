import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '../../types/supabase';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const markRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
      
    if (error) {
      // Revert on error
      console.error('Failed to mark read', error);
      toast.error('Failed to mark notification as read');
      fetchNotifications(); // reload
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })));
    
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('recipient_id', profile!.id)
      .is('read_at', null);

    if (error) {
      console.error('Failed to mark all read', error);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Failed to delete', error);
      toast.error('Failed to delete notification');
      fetchNotifications();
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', profile!.id)
        .order('created_at', { ascending: false });
      if (error) {
        if (error.message.includes('Could not find the table')) {
          setError('Table missing');
          setNotifications([]);
          return;
        }
        throw error;
      }
      setNotifications(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    fetchNotifications();
  }, [profile?.id]);

  return { notifications, loading, error, markRead, markAllAsRead, deleteNotification, refetch: fetchNotifications };
}

