import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useClasses } from '../../../hooks/data/useClasses';
import { useAssignments } from '../../../hooks/data/useAssignments';
import { useLeaves } from '../../../hooks/data/useLeaves';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { Plus, Calendar as CalendarIcon, FileText, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

type StudentLite = {
  id: string;
  name: string;
  class_grade: string | null;
  class_section: string | null;
};

type GradeRow = {
  id: string;
  student_id: string;
  subject: string;
  exam_type: string;
  score: number | null;
  max_score: number | null;
  grade: string | null;
  created_at: string;
};

export function MarksEntry() {
  const { classes, loading } = useClasses();
  const { profile } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('Class Test');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [saving, setSaving] = useState(false);
  const [recentGrades, setRecentGrades] = useState<GradeRow[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        setSelectedStudentId('');
        return;
      }

      let { data, error } = await supabase
        .from('profiles')
        .select('id, name, class_grade, class_section')
        .eq('role', 'student')
        .eq('class_grade', selectedClass.grade)
        .eq('class_section', selectedClass.section)
        .order('name', { ascending: true });

      if (error) {
        toast.error(error.message || 'Failed to load students');
        setStudents([]);
        return;
      }

      // Fallback: if class mapping fields are empty/missing in DB, show all students.
      if (!data || data.length === 0) {
        const fallback = await supabase
          .from('profiles')
          .select('id, name, class_grade, class_section')
          .eq('role', 'student')
          .order('name', { ascending: true });

        if (!fallback.error) {
          data = fallback.data;
        }
      }

      setStudents((data || []) as StudentLite[]);
      setSelectedStudentId('');
    };

    loadStudents();
  }, [selectedClass]);

  const loadRecentGrades = async () => {
    if (!profile?.id) return;
    setLoadingGrades(true);
    const { data, error } = await supabase
      .from('grades')
      .select('id, student_id, subject, exam_type, score, max_score, grade, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes("could not find the table 'public.grades'") || msg.includes('relation "public.grades" does not exist')) {
        setRecentGrades([]);
      } else {
        toast.error(error.message || 'Failed to load recent grades');
      }
      setLoadingGrades(false);
      return;
    }

    let rows = (data || []) as GradeRow[];
    if (rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0] as object, 'teacher_id')) {
      rows = rows.filter((r: any) => r.teacher_id === profile.id);
    }
    setRecentGrades(rows);
    setLoadingGrades(false);
  };

  const computeLetterGrade = (sc: number, max: number) => {
    const pct = (sc / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    return 'F';
  };

  const saveMarks = async () => {
    if (!profile?.id || !selectedClass || !selectedStudentId || !subject || !examType || !score || !maxScore) {
      toast.error('Please fill all marks fields');
      return;
    }

    const scoreNum = Number(score);
    const maxNum = Number(maxScore);
    if (Number.isNaN(scoreNum) || Number.isNaN(maxNum) || scoreNum < 0 || maxNum <= 0 || scoreNum > maxNum) {
      toast.error('Enter valid score and max score');
      return;
    }

    setSaving(true);
    const payload = {
      student_id: selectedStudentId,
      class_id: selectedClass.id,
      subject: subject.trim(),
      exam_type: examType.trim(),
      score: scoreNum,
      max_score: maxNum,
      grade: computeLetterGrade(scoreNum, maxNum),
      teacher_id: profile.id,
    };

    let { error } = await supabase.from('grades').insert(payload);

    // If grades table does not exist in this project, try legacy table name `marks`.
    const gradesTableMissing =
      String(error?.message || '').toLowerCase().includes("could not find the table 'public.grades'") ||
      String(error?.message || '').toLowerCase().includes('relation "public.grades" does not exist');
    if (gradesTableMissing) {
      const marksRetry = await supabase.from('marks').insert({
        student_id: selectedStudentId,
        class_id: selectedClass.id,
        subject: subject.trim(),
        exam_type: examType.trim(),
        score: scoreNum,
        max_score: maxNum,
        grade: computeLetterGrade(scoreNum, maxNum),
        teacher_id: profile.id,
      });
      error = marksRetry.error;
    }

    if (error) {
      // Backward-compatible insert if teacher_id/class_id not present in older schemas.
      const message = String(error.message || '').toLowerCase();
      if (message.includes('column') && (message.includes('teacher_id') || message.includes('class_id'))) {
        const retry = await supabase.from('grades').insert({
          student_id: selectedStudentId,
          subject: subject.trim(),
          exam_type: examType.trim(),
          score: scoreNum,
          max_score: maxNum,
          grade: computeLetterGrade(scoreNum, maxNum),
        });
        error = retry.error;
      }
    }

    if (error) {
      const msg = String(error?.message || '').toLowerCase();
      if (
        msg.includes("could not find the table 'public.grades'") ||
        msg.includes('relation "public.grades" does not exist') ||
        msg.includes("could not find the table 'public.marks'") ||
        msg.includes('relation "public.marks" does not exist')
      ) {
        toast.error('Marks table missing in database. Please run backend SQL migration.');
      } else {
        toast.error(error.message || 'Failed to save marks');
      }
      setSaving(false);
      return;
    }

    toast.success('Marks saved successfully');
    setScore('');
    setSubject('');
    await loadRecentGrades();
    setSaving(false);
  };

  return (
    <DashboardLayout role="teacher">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Marks Entry</h1>
          <p className="text-[#6b778f]">Enter and manage student marks</p>
        </div>

        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Classes</h2>
          {loading ? (
            <p className="text-[#6b778f]">Loading classes...</p>
          ) : classes.length === 0 ? (
            <p className="text-[#6b778f]">No classes assigned yet. Ask admin to assign your class first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <Badge key={c.id} className="bg-[#4f8eff]/20 text-[#4f8eff] border-[#4f8eff]/40">
                  {c.grade}-{c.section}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Enter Marks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.grade}-{c.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={!selectedClassId}>
                <SelectTrigger className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2">
                  <SelectValue placeholder={selectedClassId ? 'Select student' : 'Select class first'} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Mathematics"
                className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-white">Exam Type</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Class Test">Class Test</SelectItem>
                  <SelectItem value="Mid Term">Mid Term</SelectItem>
                  <SelectItem value="Final Exam">Final Exam</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Score</Label>
              <Input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="85"
                className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-white">Max Score</Label>
              <Input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="100"
                className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2"
              />
            </div>
          </div>
          <Button
            className="mt-6 bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90"
            disabled={saving}
            onClick={saveMarks}
          >
            {saving ? 'Saving...' : 'Save Marks'}
          </Button>
        </Card>

        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Marks Entries</h2>
          {loadingGrades ? (
            <p className="text-[#6b778f]">Loading grades...</p>
          ) : recentGrades.length === 0 ? (
            <p className="text-[#6b778f]">No marks entries yet. Save first mark to view recent records.</p>
          ) : (
            <div className="space-y-2">
              {recentGrades.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3 bg-[#1a2035] rounded-lg">
                  <div>
                    <p className="text-white font-medium">{g.subject} - {g.exam_type}</p>
                    <p className="text-[#6b778f] text-sm">{new Date(g.created_at).toLocaleString()}</p>
                  </div>
                  <Badge className="bg-[#00d084]/20 text-[#00d084] border-[#00d084]/40">
                    {g.score ?? '-'} / {g.max_score ?? '-'} ({g.grade || '-'})
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

export function Assignments() {
  const { profile } = useAuth();
  const { classes } = useClasses();
  const { assignments, loading, error, createAssignment } = useAssignments();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    class_id: '',
  });

  const handleCreate = async () => {
    if (!profile?.id || !formData.title || !formData.subject || !formData.due_date || !formData.class_id) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await createAssignment({
        title: formData.title,
        subject: formData.subject,
        description: formData.description,
        due_date: formData.due_date,
        class_id: formData.class_id,
        teacher_id: profile.id,
      });
      toast.success('Assignment created successfully');
      setShowAddDialog(false);
      setFormData({
        title: '',
        subject: '',
        description: '',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        class_id: '',
      });
      // Component will re-render and useAssignments will refetch
      window.location.reload(); // Quick way to refresh, though useAssignments should ideally have a refresh method
    } catch (err: any) {
      toast.error(err.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSubmissions = useMemo(() => {
    return assignments.reduce((acc, ass) => acc + (ass.submissionCount || 0), 0);
  }, [assignments]);

  return (
    <DashboardLayout role="teacher">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Assignments</h1>
            <p className="text-[#6b778f]">Manage class assignments and track student submissions</p>
          </div>
          
          <div className="flex gap-4">
            <Card className="bg-[#1e2840]/30 border-[#6b778f]/10 px-4 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4f8eff]/10 flex items-center justify-center text-[#4f8eff]">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-[10px] text-[#6b778f] uppercase font-bold">Total Posted</p>
                <p className="text-lg font-bold text-white leading-tight">{assignments.length}</p>
              </div>
            </Card>
            <Card className="bg-[#1e2840]/30 border-[#6b778f]/10 px-4 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00d084]/10 flex items-center justify-center text-[#00d084]">
                <CheckCircle size={16} />
              </div>
              <div>
                <p className="text-[10px] text-[#6b778f] uppercase font-bold">Submissions</p>
                <p className="text-lg font-bold text-white leading-tight">{totalSubmissions}</p>
              </div>
            </Card>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 shadow-lg shadow-[#4f8eff]/20">
                <Plus size={20} className="mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e2840] border-[#6b778f]/20 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">New Assignment</DialogTitle>
                <DialogDescription className="text-[#6b778f]">
                  Fill in the details below to create a new assignment for your students.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Class</Label>
                    <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
                      <SelectTrigger className="bg-[#1a2035] border-[#6b778f]/30 text-white">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.grade}-{c.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Subject</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Mathematics"
                      className="bg-[#1a2035] border-[#6b778f]/30 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Calculus Introduction"
                    className="bg-[#1a2035] border-[#6b778f]/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Description (Optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide details about the assignment..."
                    className="bg-[#1a2035] border-[#6b778f]/30 text-white min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Due Date</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="bg-[#1a2035] border-[#6b778f]/30 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="text-[#6b778f] hover:text-white">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90"
                >
                  {submitting ? 'Creating...' : 'Publish Assignment'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assignments List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="bg-[#1e2840]/50 border-[#6b778f]/20 p-6 animate-pulse">
                <div className="h-6 w-2/3 bg-[#1a2035] rounded mb-4" />
                <div className="h-4 w-1/2 bg-[#1a2035] rounded mb-2" />
                <div className="h-20 w-full bg-[#1a2035] rounded" />
              </Card>
            ))
          ) : error ? (
            <div className="col-span-full py-12 text-center">
              <AlertCircle size={48} className="mx-auto text-red-500 mb-4 opacity-50" />
              <p className="text-[#ff6b6b] font-medium">{error}</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-[#1e2840]/30 rounded-3xl border border-dashed border-[#6b778f]/20">
              <FileText size={64} className="mx-auto text-[#6b778f] mb-4 opacity-30" />
              <h3 className="text-xl font-bold text-white mb-2">No Assignments Yet</h3>
              <p className="text-[#6b778f] max-w-sm mx-auto">
                Create your first assignment to share homework and study material with your students.
              </p>
            </div>
          ) : (
            assignments.map((ass) => {
              const isPastDue = new Date(ass.due_date) < new Date();
              return (
                <Card key={ass.id} className="bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778d]/20 hover:border-[#4f8eff]/50 transition-all group overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge className="bg-[#4f8eff]/20 text-[#4f8eff] border-[#4f8eff]/20">
                        {ass.subject}
                      </Badge>
                      <Badge variant="outline" className={`${isPastDue ? 'border-red-500/50 text-red-400' : 'border-[#00d084]/50 text-[#00d084]'} flex items-center gap-1`}>
                        <Clock size={12} />
                        {isPastDue ? 'Past Due' : 'Active'}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#4f8eff] transition-colors line-clamp-1">{ass.title}</h3>
                    <p className="text-[#6b778f] text-sm line-clamp-3 mb-6 min-h-[3rem]">
                      {ass.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#6b778f]/10">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[#6b778f] text-xs">
                          <CalendarIcon size={14} />
                          <span>Due: {format(new Date(ass.due_date), 'MMM dd')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#00d084] text-xs font-bold">
                          <CheckCircle size={14} />
                          <span>{ass.submissionCount || 0} Submissions</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#4f8eff] hover:bg-[#4f8eff]/10 p-0 h-auto font-bold">
                        View List
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export function LeaveApproval() {
  const { leaves, loading, error, approveLeave, rejectLeave } = useLeaves('pending');

  return (
    <DashboardLayout role="teacher">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Leave Approval</h1>
          <p className="text-[#6b778f]">Review and approve student leave requests</p>
        </div>

        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
          {loading ? (
            <p className="text-[#6b778f]">Loading leave requests...</p>
          ) : error ? (
            <p className="text-[#ff6b6b]">{error}</p>
          ) : leaves.length === 0 ? (
            <p className="text-[#6b778f]">No pending leave requests.</p>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => (
                <div key={leave.id} className="p-4 bg-[#1a2035] rounded-lg border border-[#6b778f]/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-white font-semibold">{leave.profiles?.name || 'Student'}</p>
                      <p className="text-[#6b778f] text-sm">
                        {leave.start_date} to {leave.end_date}
                      </p>
                      <p className="text-[#9fb0d6] text-sm mt-1">{leave.reason || 'No reason provided'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-[#00d084] hover:bg-[#00d084]/90"
                        onClick={async () => {
                          try {
                            await approveLeave(leave.id);
                            toast.success('Leave approved');
                          } catch (e: any) {
                            toast.error(e?.message || 'Approve failed');
                          }
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#ff6b6b] text-[#ff6b6b] hover:bg-[#ff6b6b]/10"
                        onClick={async () => {
                          try {
                            await rejectLeave(leave.id);
                            toast.success('Leave rejected');
                          } catch (e: any) {
                            toast.error(e?.message || 'Reject failed');
                          }
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
