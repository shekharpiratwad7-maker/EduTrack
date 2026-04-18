import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Calendar, FileText, ClipboardList, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useEffect, useMemo, useState } from 'react';

type GradeRow = { id: string; subject: string; exam_type: string; score: number | null; max_score: number | null; grade: string | null };
type MarkRow = { id: string; subject: string; marks: number | null };
type AttendanceRow = { id: string; date: string; status: string };
type AssignmentRow = { id: string; title: string; description: string | null; due_date: string | null; class_id: string | null };

const gradeColors: Record<string, string> = {
  'A+': '#00d084',
  A: '#00d084',
  'B+': '#4f8eff',
  B: '#4f8eff',
  'C+': '#ff9f43',
  C: '#ff9f43',
  F: '#ff4d6d',
};

function getGradeLetter(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  return 'F';
}

export function StudentDashboard() {
  const { profile } = useAuth();
  const [recentGrades, setRecentGrades] = useState<GradeRow[]>([]);
  const [marks, setMarks] = useState<MarkRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return localStorage.getItem('studentAttendanceSelectedDate') || new Date().toISOString().slice(0, 10);
  });
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentRow | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;
      const [gradesRes, marksRes, attendanceRes, assignmentsRes] = await Promise.all([
        supabase
          .from('grades')
          .select('id, subject, exam_type, score, max_score, grade')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('marks')
          .select('id, subject, marks')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('attendance')
          .select('id, date, status')
          .eq('student_id', profile.id),
        supabase
          .from('assignments')
          .select('id, title, description, due_date, class_id')
          .order('due_date', { ascending: true }),
      ]);
      if (!gradesRes.error) setRecentGrades((gradesRes.data || []) as GradeRow[]);
      if (!marksRes.error) setMarks((marksRes.data || []) as MarkRow[]);
      if (!attendanceRes.error) setAttendance((attendanceRes.data || []) as AttendanceRow[]);
      if (!assignmentsRes.error) setAssignments((assignmentsRes.data || []) as AssignmentRow[]);

      // Check for existing submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assignment_id')
        .eq('student_id', profile.id);

      if (submissions) {
        const submissionMap: Record<string, boolean> = {};
        submissions.forEach(s => {
          submissionMap[s.assignment_id] = true;
        });
        setHasSubmitted(submissionMap);
      }
    };
    fetchData();
  }, [profile?.id]);

  useEffect(() => {
    const syncSelectedDate = () => {
      const d = localStorage.getItem('studentAttendanceSelectedDate');
      if (d) setSelectedDate(d);
    };
    window.addEventListener('focus', syncSelectedDate);
    window.addEventListener('storage', syncSelectedDate);
    return () => {
      window.removeEventListener('focus', syncSelectedDate);
      window.removeEventListener('storage', syncSelectedDate);
    };
  }, []);

  const selectedDateAttendance = useMemo(() => {
    return attendance.filter((a: any) => {
      const dateStr = String((a as any).date || '');
      return dateStr.startsWith(selectedDate);
    });
  }, [attendance, selectedDate]);

  // Combine grades + marks for display
  const displayGrades = useMemo(() => {
    if (recentGrades.length > 0) return recentGrades;
    // Convert marks to grade-like format
    return marks.map((m) => ({
      id: m.id,
      subject: m.subject,
      exam_type: 'Exam',
      score: m.marks,
      max_score: 100,
      grade: getGradeLetter(m.marks || 0),
    }));
  }, [recentGrades, marks]);

  const stats = useMemo(() => {
    const allScores = displayGrades.filter((g) => g.score !== null && g.max_score && g.max_score > 0);
    const avg = allScores.length
      ? Math.round(allScores.reduce((a, g) => a + ((g.score || 0) / (g.max_score || 1)) * 100, 0) / allScores.length)
      : 0;
    const classesTotal = attendance.length;
    const classesAttended = attendance.filter((a) => a.status?.toLowerCase() !== 'absent').length;
    const attendancePct = classesTotal ? Math.round((classesAttended / classesTotal) * 100) : 0;
    return [
      { label: 'Average Score', value: allScores.length > 0 ? `${avg}%` : 'N/A', subtext: allScores.length > 0 ? `${allScores.length} subjects` : 'No scores yet', color: '#00d084' },
      { label: 'Attendance', value: classesTotal > 0 ? `${attendancePct}%` : 'N/A', subtext: classesTotal > 0 ? `${classesAttended}/${classesTotal} days` : 'No records', color: '#4f8eff' },
      { label: 'Assignments', value: assignments.length.toString(), subtext: 'Total assigned', color: '#ff9f43' },
      { label: 'Subjects', value: `${displayGrades.length}`, subtext: displayGrades.length > 0 ? 'With scores' : 'No data', color: '#7c5cfc' },
    ];
  }, [displayGrades, attendance, assignments]);

  return (
    <DashboardLayout role="student">
      <div className="p-4 md:p-8 space-y-6 md:space-y-10 max-w-[1600px] mx-auto">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-2 md:mb-4">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc]">Dashboard</span>
          </h1>
          <p className="text-[#6b778f] text-sm md:text-lg max-w-2xl leading-relaxed">
            Welcome back, {profile?.name || 'Student'}! You are currently in Class {profile?.class_grade || '-'}-{profile?.class_section || '-'} · Roll No: {profile?.roll_number || '-'}
          </p>
        </div>

        {/* Attendance Alert */}
        <div className="bg-gradient-to-r from-[#ffd60a]/20 to-transparent border-l-4 border-[#ffd60a] p-4 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-[#ffd60a] mt-0.5" />
          <div>
            <p className="text-white font-semibold">Attendance Notice</p>
            <p className="text-sm text-[#6b778f]">
              Selected date: {selectedDate}. Records found: {selectedDateAttendance.length}.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, idx) => (
            <Card key={stat.label} className={`bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778f]/20 p-5 md:p-8 hover:border-[${stat.color}]/50 transition-all duration-300 group animate-in zoom-in-95 duration-500 delay-[${idx * 100}ms]`}>
              <p className="text-[#6b778f] text-xs md:text-sm font-semibold uppercase tracking-wider mb-2 md:mb-4">{stat.label}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl md:text-4xl font-black text-white mb-1 md:mb-2">{stat.value}</p>
                  <p className="text-[10px] md:text-sm font-medium" style={{ color: stat.color }}>
                    {stat.subtext}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Attendance Summary */}
          <Card className="lg:col-span-5 bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778f]/20 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="text-[#4f8eff]" />
                Attendance Summary
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {attendance.length === 0 ? (
                  <p className="col-span-2 text-[#6b778f] text-center py-8">No attendance records found.</p>
                ) : (
                  <>
                    {[
                      { label: 'Total Days', value: attendance.length, color: 'white', bg: '#1a2035' },
                      { label: 'Present', value: attendance.filter(a => a.status?.toLowerCase() === 'present').length, color: '#00d084', bg: '#00d084/10' },
                      { label: 'Absent', value: attendance.filter(a => a.status?.toLowerCase() === 'absent').length, color: '#ff4d6d', bg: '#ff4d6d/10' },
                      { label: 'Late', value: attendance.filter(a => a.status?.toLowerCase() === 'late').length, color: '#ff9f43', bg: '#ff9f43/10' },
                    ].map((item) => (
                      <div key={item.label} className="p-4 rounded-2xl border border-[#6b778f]/10 flex flex-col items-center justify-center text-center" style={{ backgroundColor: item.bg.includes('/') ? undefined : item.bg }}>
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#6b778f] mb-1">{item.label}</p>
                        <p className="text-2xl font-black" style={{ color: item.color === 'white' ? 'white' : item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            <Button variant="ghost" className="mt-8 w-full border border-[#6b778f]/20 text-white hover:bg-white/5">
              Full Attendance History
            </Button>
          </Card>

          {/* Recent Grades / Marks */}
          <Card className="lg:col-span-7 bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778f]/20 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-[#00d084]" />
              My Recent Scores
            </h2>
            <div className="space-y-4 md:space-y-6">
              {displayGrades.map((grade, i) => (
                <div key={i} className="p-4 md:p-5 bg-[#1a2035]/80 rounded-2xl border border-[#6b778f]/10 hover:border-[#4f8eff]/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-opacity-10" style={{ backgroundColor: `${gradeColors[grade.grade || 'B']}20`, color: gradeColors[grade.grade || 'B'] }}>
                        <ClipboardList size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-white md:text-lg">{grade.subject}</p>
                        <p className="text-xs text-[#6b778f]">{grade.exam_type}</p>
                      </div>
                    </div>
                    <div
                      className="px-4 py-1.5 rounded-xl font-black text-sm"
                      style={{
                        backgroundColor: `${gradeColors[grade.grade || 'B']}20`,
                        color: gradeColors[grade.grade || 'B'],
                        border: `1px solid ${gradeColors[grade.grade || 'B']}30`
                      }}
                    >
                      {grade.grade || '-'}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress
                        value={grade.max_score ? ((grade.score || 0) / grade.max_score) * 100 : 0}
                        className="h-2 md:h-2.5 rounded-full"
                        style={
                          {
                            '--progress-color': gradeColors[grade.grade || 'B'],
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <p className="text-sm font-black text-white min-w-[60px] text-right">
                      {grade.score || 0}<span className="text-[#6b778f] font-normal mx-0.5">/</span>{grade.max_score || 0}
                    </p>
                  </div>
                </div>
              ))}
              {displayGrades.length === 0 && <p className="text-[#6b778f] text-center py-8">No scores available yet.</p>}
            </div>
          </Card>
        </div>

        {/* Assignments Section */}
        <Card className="bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778f]/20 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="text-[#ff9f43]" />
              My Assignments
            </h2>
            <Badge variant="outline" className="w-fit text-[#4f8eff] border-[#4f8eff]/20 px-4 py-1">
              {assignments.length} Tasks Pending
            </Badge>
          </div>

          {assignments.length === 0 ? (
            <div className="py-12 text-center bg-[#1a2035]/50 rounded-2xl border border-dashed border-[#6b778f]/20">
              <ClipboardList size={40} className="mx-auto text-[#6b778f] mb-4 opacity-50" />
              <p className="text-[#6b778f]">No assignments assigned to you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {assignments.map((a, i) => {
                const dueDate = a.due_date ? new Date(a.due_date) : null;
                const today = new Date();
                const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                const isOverdue = daysLeft !== null && daysLeft < 0;

                return (
                  <Card key={i} className="bg-[#1a2035] border-[#6b778f]/20 p-5 hover:border-[#4f8eff]/50 transition-all group overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#4f8eff]/10 flex items-center justify-center text-[#4f8eff]">
                          <FileText size={20} />
                        </div>
                        {dueDate && (
                          <Badge variant="outline" className={`${isOverdue ? 'border-red-500/50 text-red-400' : 'border-[#ff9f43]/50 text-[#ff9f43]'} text-[10px]`}>
                            {isOverdue ? 'Overdue' : 'Due Soon'}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-white mb-2 line-clamp-1 group-hover:text-[#4f8eff] transition-colors">{a.title}</h3>
                      <p className="text-xs text-[#6b778f] mb-4 line-clamp-2 min-h-[2rem]">
                        {a.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {dueDate && (
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar size={14} className={isOverdue ? 'text-red-400' : 'text-[#ff9f43]'} />
                          <span className={isOverdue ? 'text-red-400 font-semibold' : 'text-[#ff9f43] font-semibold'}>
                            {isOverdue
                              ? `Overdue by ${Math.abs(daysLeft)} days`
                              : daysLeft === 0 ? 'Due today!' : `${daysLeft} days left`}
                          </span>
                        </div>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className={`w-full ${hasSubmitted[a.id] ? 'bg-[#00d084]/20 text-[#00d084]' : 'bg-[#1e2840] hover:bg-[#4f8eff] hover:text-white'} border-[#6b778f]/20 transition-all`}
                        onClick={() => {
                          setSelectedAssignment(a);
                          setSubmissionContent('');
                          setShowDetails(true);
                        }}
                      >
                        {hasSubmitted[a.id] ? 'Submitted' : 'View & Submit'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Details Dialog */}
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="bg-[#1e2840] border-[#6b778f]/20 text-white max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="text-[#4f8eff]" />
                  {selectedAssignment?.title}
                </DialogTitle>
                <DialogDescription className="text-[#6b778f]">
                  Assignment Details & Instructions
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#1a2035] rounded-2xl border border-[#6b778f]/10">
                    <p className="text-[#6b778f] text-xs mb-1 uppercase tracking-wider font-semibold">Due Date</p>
                    <p className="text-sm font-bold text-white">
                      {selectedAssignment?.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-[#1a2035] rounded-2xl border border-[#6b778f]/10">
                    <p className="text-[#6b778f] text-xs mb-1 uppercase tracking-wider font-semibold">Status</p>
                    <Badge className={hasSubmitted[selectedAssignment?.id || ''] ? 'bg-[#00d084]/20 text-[#00d084] border-[#00d084]/30' : 'bg-[#4f8eff]/20 text-[#4f8eff] border-[#4f8eff]/30'}>
                      {hasSubmitted[selectedAssignment?.id || ''] ? 'Submitted' : 'Pending'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Instructions</p>
                  <div className="p-4 bg-[#1a2035]/50 rounded-2xl border border-[#6b778f]/10">
                    <p className="text-[#9fb0d6] text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedAssignment?.description || 'No detailed instructions provided.'}
                    </p>
                  </div>
                </div>

                {!hasSubmitted[selectedAssignment?.id || ''] && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-sm font-semibold text-white">Submit Your Work</p>
                    <textarea
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder="Paste your submission link (Drive/GitHub) or type your answer here..."
                      className="w-full h-32 bg-[#1a2035] border border-[#6b778f]/30 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-[#4f8eff] outline-none transition-all resize-none"
                    />
                    <Button
                      onClick={async () => {
                        if (!profile?.id || !selectedAssignment || !submissionContent) {
                          toast.error('Please enter your submission content');
                          return;
                        }
                        setIsSubmitting(true);
                        try {
                          const { error } = await supabase
                            .from('submissions')
                            .insert({
                              assignment_id: selectedAssignment.id,
                              student_id: profile.id,
                              content: submissionContent
                            });

                          if (error) throw error;

                          toast.success('Assignment submitted successfully!');
                          setHasSubmitted(prev => ({ ...prev, [selectedAssignment.id]: true }));
                          setShowDetails(false);
                        } catch (err: any) {
                          toast.error(err.message || 'Submission failed');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 shadow-lg shadow-[#4f8eff]/20"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                    </Button>
                  </div>
                )}

                {hasSubmitted[selectedAssignment?.id || ''] && (
                  <div className="p-4 bg-[#00d084]/10 rounded-2xl border border-[#00d084]/20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00d084]/20 flex items-center justify-center text-[#00d084]">
                      <CheckCircle size={18} />
                    </div>
                    <p className="text-sm text-[#00d084] font-medium">You have already submitted this assignment.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-[#6b778f]/10">
                <Button variant="ghost" onClick={() => setShowDetails(false)} className="text-[#6b778f] hover:text-white">
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </DashboardLayout>
  );
}
