import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Spinner } from '../../components/ui/spinner';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import type { Database } from '../../../types/supabase';

type FeedbackCategory = 'academic' | 'behavior' | 'attendance' | 'homework' | 'appreciation' | 'other';

export default function ParentFeedback() {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    recipient_id: '',
    recipient_name: '',
    category: undefined as FeedbackCategory | undefined,
    subject: '',
    message: '',
  });
  const [teachers, setTeachers] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);

  const categories: FeedbackCategory[] = ['academic', 'behavior', 'attendance', 'homework', 'appreciation', 'other'];

  // Load teachers
  // Load recent feedback
  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // Fetch teachers (profiles where role = 'teacher')
      const { data: teacherData } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('role', 'teacher')
        .order('name');
      setTeachers(teacherData || []);

      // Fetch recent feedback for parent
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select(`
          *,
          profiles!recipient_id (name)
        `)
        .eq('sender_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentFeedback(feedbackData || []);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipient_id || !formData.category || !formData.subject || !formData.message.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        sender_id: profile!.id,
        recipient_id: formData.recipient_id,
        category: formData.category,
        subject: formData.subject,
        message: formData.message,
      });

      if (error) throw error;

    toast.success('Feedback sent successfully!');
    setFormData({ recipient_id: '', recipient_name: '', category: undefined, subject: '', message: '' });
      loadData(); // Refresh recent
    } catch (error: any) {
      toast.error(error.message || 'Failed to send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="parent">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Spinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Feedback</h1>
          <p className="text-muted-foreground">Communicate with teachers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="lg:col-span-2 p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-bold mb-6">Send Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-white">Teacher</label>
                <Select 
                  value={formData.recipient_id} 
                  onValueChange={(value) => {
                    const teacher = teachers.find(t => t.id === value);
                    setFormData({...formData, recipient_id: value, recipient_name: teacher?.name || ''});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.recipient_name && (
                  <p className="text-sm text-muted-foreground">{formData.recipient_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-white">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value as FeedbackCategory})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/([A-Z])/g, ' $1')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-white">Subject</label>
                <Input
                  placeholder="Brief subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-white">Message</label>
                <Textarea
                  placeholder="Detailed feedback..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={6}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? <Spinner className="w-4 h-4 mr-2" /> : null}
                  {submitting ? 'Sending...' : 'Send Feedback'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setFormData({ recipient_id: '', recipient_name: '', category: undefined, subject: '', message: '' })}>
                  Clear
                </Button>
              </div>
            </form>
          </Card>

          {/* Recent */}
          <div>
            <Card className="p-6">
              <h3 className="font-bold mb-4">Recent Feedback</h3>
              <div className="space-y-3">
                {recentFeedback.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No recent feedback</p>
                ) : (
                  recentFeedback.map((fb) => (
                    <div key={fb.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="secondary">{fb.category}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-semibold">{fb.subject}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{fb.message}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

