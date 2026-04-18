import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Award, BookOpen } from 'lucide-react';

type GradeRow = {
  id: string;
  subject: string;
  exam_type: string;
  score: number | null;
  max_score: number | null;
  grade: string | null;
};

type MarkRow = {
  id: string;
  subject: string;
  marks: number | null;
  created_at: string | null;
};

// Unified display type
interface SubjectScore {
  id: string;
  subject: string;
  exam_type: string;
  score: number;
  max_score: number;
  grade: string;
  percentage: number;
}

function getGradeLetter(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  return 'F';
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A+': case 'A': return '#00d084';
    case 'B+': case 'B': return '#4f8eff';
    case 'C+': case 'C': return '#ff9f43';
    case 'F': return '#ff4d6d';
    default: return '#6b778f';
  }
}

export function MyGrades() {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [marks, setMarks] = useState<MarkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;
      setLoading(true);

      const [gradesRes, marksRes] = await Promise.all([
        supabase
          .from('grades')
          .select('id, subject, exam_type, score, max_score, grade')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('marks')
          .select('id, subject, marks, created_at')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false }),
      ]);

      if (!gradesRes.error) setGrades((gradesRes.data || []) as GradeRow[]);
      if (!marksRes.error) setMarks((marksRes.data || []) as MarkRow[]);
      setLoading(false);
    };
    fetchData();
  }, [profile?.id]);

  // Combine grades + marks into unified scores
  const allScores: SubjectScore[] = useMemo(() => {
    const scores: SubjectScore[] = [];

    // Add from grades table
    grades.forEach((g) => {
      const pct = g.max_score && g.max_score > 0 ? Math.round(((g.score || 0) / g.max_score) * 100) : 0;
      scores.push({
        id: g.id,
        subject: g.subject,
        exam_type: g.exam_type || 'Exam',
        score: g.score || 0,
        max_score: g.max_score || 100,
        grade: g.grade || getGradeLetter(pct),
        percentage: pct,
      });
    });

    // Add from marks table (if not already covered by grades)
    const gradedSubjects = new Set(grades.map(g => g.subject.toLowerCase()));
    marks.forEach((m) => {
      if (!gradedSubjects.has(m.subject.toLowerCase())) {
        const pct = m.marks || 0;
        scores.push({
          id: m.id,
          subject: m.subject,
          exam_type: 'Exam',
          score: m.marks || 0,
          max_score: 100,
          grade: getGradeLetter(pct),
          percentage: pct,
        });
      }
    });

    return scores;
  }, [grades, marks]);

  // Summary stats
  const summary = useMemo(() => {
    const total = allScores.length;
    const avg = total === 0 ? 0 : Math.round(allScores.reduce((a, s) => a + s.percentage, 0) / total);
    const highest = total === 0 ? null : allScores.reduce((best, s) => s.percentage > best.percentage ? s : best, allScores[0]);
    const lowest = total === 0 ? null : allScores.reduce((worst, s) => s.percentage < worst.percentage ? s : worst, allScores[0]);
    return { total, avg, highest, lowest };
  }, [allScores]);

  // Chart data
  const chartData = allScores.map((s) => ({
    name: s.subject,
    score: s.percentage,
    fill: gradeColor(s.grade),
  }));

  return (
    <DashboardLayout role="student">
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My Grades</h1>
          <p className="text-[#6b778f]">View your academic performance</p>
        </div>

        {loading ? (
          <p className="text-[#6b778f]">Loading grades...</p>
        ) : allScores.length === 0 ? (
          <Card className="bg-[#1e2840] border-[#6b778f]/20 p-12 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-[#6b778f] opacity-50" />
            <p className="text-xl text-white font-semibold mb-2">No Grades Yet</p>
            <p className="text-[#6b778f]">Your grades will appear here once your teachers enter them.</p>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-[#4f8eff]/10 border-2 border-[#4f8eff]/30 p-4 md:p-6 text-center sm:text-left">
                <p className="text-[#6b778f] text-xs md:text-sm mb-1">Average Score</p>
                <p className="text-3xl md:text-4xl font-bold text-[#4f8eff]">{summary.avg}%</p>
                <Badge className="mt-2" style={{ backgroundColor: `${gradeColor(getGradeLetter(summary.avg))}20`, color: gradeColor(getGradeLetter(summary.avg)) }}>
                  Grade {getGradeLetter(summary.avg)}
                </Badge>
              </Card>
              <Card className="bg-[#7c5cfc]/10 border-2 border-[#7c5cfc]/30 p-4 md:p-6 text-center sm:text-left">
                <p className="text-[#6b778f] text-xs md:text-sm mb-1">Total Subjects</p>
                <p className="text-3xl md:text-4xl font-bold text-[#7c5cfc]">{summary.total}</p>
                <p className="text-[10px] md:text-xs text-[#6b778f] mt-2">Exams taken</p>
              </Card>
              <Card className="bg-[#00d084]/10 border-2 border-[#00d084]/30 p-4 md:p-6 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <TrendingUp size={14} className="text-[#00d084]" />
                  <p className="text-[#6b778f] text-xs md:text-sm">Highest</p>
                </div>
                <p className="text-3xl md:text-4xl font-bold text-[#00d084]">{summary.highest?.percentage || 0}%</p>
                <p className="text-[10px] md:text-xs text-[#6b778f] mt-2 truncate">{summary.highest?.subject || '-'}</p>
              </Card>
              <Card className="bg-[#ff4d6d]/10 border-2 border-[#ff4d6d]/30 p-4 md:p-6 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <TrendingDown size={14} className="text-[#ff4d6d]" />
                  <p className="text-[#6b778f] text-xs md:text-sm">Lowest</p>
                </div>
                <p className="text-3xl md:text-4xl font-bold text-[#ff4d6d]">{summary.lowest?.percentage || 0}%</p>
                <p className="text-[10px] md:text-xs text-[#6b778f] mt-2 truncate">{summary.lowest?.subject || '-'}</p>
              </Card>
            </div>

            {/* Subject-wise Scores */}
            <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Subject Performance</h2>
              <div className="space-y-4">
                {allScores.map((subject) => (
                  <div key={subject.id} className="p-4 bg-[#1a2035] rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-white">{subject.subject}</p>
                        <p className="text-xs md:text-sm text-[#6b778f]">{subject.exam_type}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-xl md:text-2xl font-bold text-white">{subject.score}/{subject.max_score}</span>
                        <span
                          className="px-2 md:px-3 py-1 rounded-lg font-bold text-[10px] md:text-sm"
                          style={{
                            backgroundColor: `${gradeColor(subject.grade)}20`,
                            color: gradeColor(subject.grade),
                          }}
                        >
                          {subject.grade}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Progress
                          value={subject.percentage}
                          className="h-2"
                          style={{ '--progress-color': gradeColor(subject.grade) } as React.CSSProperties}
                        />
                      </div>
                      <span className="text-sm font-semibold text-[#6b778f] w-12 text-right">
                        {subject.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Performance Chart */}
            <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Performance Chart</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#6b778f30" />
                  <XAxis dataKey="name" stroke="#6b778f" />
                  <YAxis stroke="#6b778f" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a2035', border: '1px solid #6b778f50', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <rect key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Grade Scale Reference */}
            <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award size={20} className="text-[#ffd60a]" />
                <h2 className="text-xl font-bold text-white">Grade Scale</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                {[
                  { grade: 'A+', range: '90-100%' },
                  { grade: 'A', range: '80-89%' },
                  { grade: 'B+', range: '70-79%' },
                  { grade: 'B', range: '60-69%' },
                  { grade: 'C+', range: '50-59%' },
                  { grade: 'C', range: '40-49%' },
                  { grade: 'F', range: '0-39%' },
                ].map((g) => (
                  <div
                    key={g.grade}
                    className="p-3 rounded-lg text-center"
                    style={{ backgroundColor: `${gradeColor(g.grade)}15`, border: `1px solid ${gradeColor(g.grade)}30` }}
                  >
                    <p className="font-bold text-lg" style={{ color: gradeColor(g.grade) }}>{g.grade}</p>
                    <p className="text-xs text-[#6b778f]">{g.range}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
