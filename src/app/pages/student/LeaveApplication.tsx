import { useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useRef } from 'react';

export function LeaveApplication() {
  const { profile } = useAuth();
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || profile.role !== 'student') {
      toast.error('Please sign in as student to submit leave.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: classInfo } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('grade', profile.class_grade || '')
        .eq('section', profile.class_section || '')
        .maybeSingle();

      let teacherId = classInfo?.teacher_id || null;
      if (!teacherId) {
        // Fallback for incomplete class mapping: route leave to any teacher account.
        const fallbackTeacher = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'teacher')
          .limit(1)
          .maybeSingle();
        teacherId = (fallbackTeacher.data as any)?.id || null;
      }

      const basePayload = {
        student_id: profile.id,
        type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
        status: 'pending',
        teacher_id: teacherId,
        documents: documents.map((f) => f.name),
      };

      const { error } = await supabase.from('leave_applications').insert(basePayload as any);

      if (error) throw error;

      toast.success('Leave application submitted successfully!');
      setLeaveType('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setDocuments([]);
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes("could not find the")) {
        toast.error('Leave table schema mismatch. Please run leave backend migration SQL.');
      } else {
        toast.error(error.message || 'Failed to submit leave application');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Apply for Leave</h1>
          <p className="text-[#6b778f]">Submit your leave application</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Leave Application Form</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="text-white">Leave Type</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="family">Family Event</SelectItem>
                      <SelectItem value="exam">Examination</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-white">End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white">Reason (min 20 characters)</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain the reason for your leave..."
                    className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2 min-h-32"
                  />
                  <p className="text-sm text-[#6b778f] mt-1">{reason.length} / 500 characters</p>
                </div>

                <div>
                  <Label className="text-white">Supporting Document (Optional)</Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 border-2 border-dashed border-[#6b778f]/30 rounded-xl p-8 text-center hover:border-[#4f8eff]/50 transition cursor-pointer"
                  >
                    <Upload size={32} className="text-[#6b778f] mx-auto mb-2" />
                    <p className="text-sm text-[#6b778f]">Click to upload or drag and drop</p>
                    <p className="text-xs text-[#6b778f] mt-1">PDF, JPG, PNG (Max 5MB)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setDocuments(files);
                      }}
                    />
                  </div>
                  {documents.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {documents.map((f) => (
                        <p key={f.name} className="text-xs text-[#9fb0d6]">{f.name}</p>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!leaveType || !startDate || !endDate || reason.length < 20 || submitting}
                  className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 py-6"
                >
                  {submitting ? 'Submitting...' : 'Submit Leave Application'}
                </Button>
              </form>
            </Card>
          </div>

          <div>
            <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Application Status</h2>
              <div className="space-y-3">
                <div className="p-4 bg-[#1a2035] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white">Apr 8-9</p>
                    <span className="text-xs bg-[#ffd60a]/20 text-[#ffd60a] px-2 py-1 rounded">Pending</span>
                  </div>
                  <p className="text-xs text-[#6b778f]">Medical leave</p>
                </div>
                <div className="p-4 bg-[#1a2035] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white">Apr 1-2</p>
                    <span className="text-xs bg-[#00d084]/20 text-[#00d084] px-2 py-1 rounded">Approved</span>
                  </div>
                  <p className="text-xs text-[#6b778f]">Family function</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
