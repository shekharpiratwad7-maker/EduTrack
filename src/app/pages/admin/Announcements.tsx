import { useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Bell, Send, Users, GraduationCap, UserCheck, Megaphone } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

export function Announcements() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('webinar'); // 'webinar', 'function', 'general'
  const [targetRole, setTargetRole] = useState<'all' | 'student' | 'teacher' | 'parent'>('all');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch recipient IDs based on role
      let query = supabase.from('profiles').select('id');
      if (targetRole !== 'all') {
        query = query.eq('role', targetRole);
      }

      const { data: users, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      if (!users || users.length === 0) {
        toast.error('No recipients found for the selected role');
        return;
      }

      // 2. Prepare notification rows
      const notifications = users.map(user => ({
        recipient_id: user.id,
        title: `[${type.toUpperCase()}] ${title}`,
        message,
        type,
      }));

      // 3. Batch insert notifications
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) throw insertError;

      toast.success(`Announcement sent successfully to ${users.length} recipients!`);
      setTitle('');
      setMessage('');
    } catch (error: any) {
      console.error('Announcement error:', error);
      toast.error(error.message || 'Failed to send announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Announcements & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd60a] to-[#ff9f43]">Webinars</span>
          </h1>
          <p className="text-[#6b778f] text-lg">
            Broadcast important updates, webinar links, or school functions to students, teachers, and parents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778f]/20 p-6 md:p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Announcement Title</label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Annual Science Webinar 2024"
                  className="bg-[#1a2035] border-[#6b778f]/30 text-white h-12 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Message Content</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your announcement or webinar link here..."
                  className="w-full h-40 bg-[#1a2035] border border-[#6b778f]/30 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-[#ffd60a] outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={handleSend}
                disabled={loading}
                className="flex-1 h-12 bg-gradient-to-r from-[#ffd60a] to-[#ff9f43] text-[#1e2840] font-bold text-lg hover:opacity-90 shadow-lg shadow-[#ffd60a]/20"
              >
                {loading ? 'Sending...' : (
                  <>
                    <Send size={20} className="mr-2" />
                    Broadcast Announcement
                  </>
                )}
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778f]/20 p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Megaphone size={18} className="text-[#ffd60a]" />
                Category
              </h3>
              <div className="space-y-2">
                {['webinar', 'function', 'general'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`w-full p-3 rounded-xl border transition-all text-left capitalize ${
                      type === t 
                      ? 'bg-[#ffd60a]/10 border-[#ffd60a] text-[#ffd60a]' 
                      : 'bg-[#1a2035] border-[#6b778f]/10 text-[#6b778f] hover:border-[#6b778f]/30'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778f]/20 p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Users size={18} className="text-[#4f8eff]" />
                Target Audience
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Users', icon: Megaphone },
                  { id: 'teacher', label: 'Teachers Only', icon: GraduationCap },
                  { id: 'student', label: 'Students Only', icon: UserCheck },
                  { id: 'parent', label: 'Parents Only', icon: Users },
                ].map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setTargetRole(role.id as any)}
                    className={`w-full p-3 rounded-xl border transition-all text-left flex items-center gap-3 ${
                      targetRole === role.id 
                      ? 'bg-[#4f8eff]/10 border-[#4f8eff] text-[#4f8eff]' 
                      : 'bg-[#1a2035] border-[#6b778f]/10 text-[#6b778f] hover:border-[#6b778f]/30'
                    }`}
                  >
                    <role.icon size={16} />
                    <span className="text-sm font-medium">{role.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
