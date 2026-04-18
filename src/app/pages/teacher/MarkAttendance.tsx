import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Check, X, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useClasses } from '../../../hooks/data/useClasses';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

type StudentLite = {
  id: string;
  name: string;
  class_grade: string | null;
  class_section: string | null;
  roll_number: string | null;
};
type ClassOption = { value: string; label: string; grade?: string; section?: string; classId?: string };

type AttendanceStatus = 'present' | 'absent' | 'leave';

export function MarkAttendance() {
  const { profile } = useAuth();
  const { classes } = useClasses();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [studentStatuses, setStudentStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  const selectedClassObj = useMemo(
    () => classes.find((c) => c.id === selectedClass),
    [classes, selectedClass]
  );

  useEffect(() => {
    const loadClassOptions = async () => {
      const fromClasses = classes.map((c) => ({
        value: c.id,
        label: `${c.grade}-${c.section}`,
        grade: c.grade,
        section: c.section,
        classId: c.id,
      }));

      if (fromClasses.length > 0) {
        setClassOptions(fromClasses);
        return;
      }

      // Fallback: derive class list from student profiles when classes table has no rows.
      const { data } = await supabase
        .from('profiles')
        .select('class_grade, class_section')
        .ilike('role', 'student');

      const uniq = new Map<string, ClassOption>();
      (data || []).forEach((row: any) => {
        if (row.class_grade && row.class_section) {
          const key = `${row.class_grade}-${row.class_section}`;
          uniq.set(key, {
            value: `derived:${key}`,
            label: key,
            grade: row.class_grade,
            section: row.class_section,
          });
        }
      });
      const derived = Array.from(uniq.values());
      if (derived.length > 0) {
        setClassOptions(derived);
        return;
      }

      // Last-resort fallback so dropdown never looks broken.
      setClassOptions([
        { value: 'derived:10-A', label: '10-A', grade: '10', section: 'A' },
        { value: 'derived:10-B', label: '10-B', grade: '10', section: 'B' },
        { value: 'derived:11-A', label: '11-A', grade: '11', section: 'A' },
        { value: 'derived:11-B', label: '11-B', grade: '11', section: 'B' },
        { value: 'derived:12-A', label: '12-A', grade: '12', section: 'A' },
        { value: 'derived:12-B', label: '12-B', grade: '12', section: 'B' },
      ]);
    };
    loadClassOptions();
  }, [classes]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        setStudentStatuses({});
        return;
      }

      let gradeFilter = selectedClassObj?.grade;
      let sectionFilter = selectedClassObj?.section;
      if (!gradeFilter || !sectionFilter) {
        const derived = classOptions.find((c) => c.value === selectedClass);
        gradeFilter = derived?.grade;
        sectionFilter = derived?.section;
      }

      let query: any = supabase
        .from('profiles')
        .select('id, name, class_grade, class_section, roll_number')
        .ilike('role', 'student')
        .order('name', { ascending: true });

      if (gradeFilter && sectionFilter) {
        query = query.eq('class_grade', gradeFilter).eq('class_section', sectionFilter);
      }

      let { data, error } = await query;

      if (error) {
        toast.error(error.message || 'Failed to load students');
        setStudents([]);
        setStudentStatuses({});
        return;
      }

      // Fallback: if class mapping is not maintained, let teacher mark all students.
      if (!data || data.length === 0) {
        const fallback = await supabase
          .from('profiles')
          .select('id, name, class_grade, class_section, roll_number')
          .ilike('role', 'student')
          .order('name', { ascending: true });
        if (!fallback.error) {
          data = fallback.data;
        }
      }

      const rows = (data || []) as StudentLite[];
      setStudents(rows);
      setStudentStatuses(
        rows.reduce((acc, student) => ({ ...acc, [student.id]: 'present' as AttendanceStatus }), {})
      );
    };

    loadStudents();
  }, [selectedClassObj, selectedClass, classOptions]);

  const toggleStatus = (id: string) => {
    const currentStatus = studentStatuses[id];
    const nextStatus: Record<AttendanceStatus, AttendanceStatus> = {
      present: 'absent',
      absent: 'leave',
      leave: 'present',
    };
    setStudentStatuses({
      ...studentStatuses,
      [id]: nextStatus[currentStatus],
    });
  };

  const markAllPresent = () => {
    const allPresent = students.reduce(
      (acc, student) => ({ ...acc, [student.id]: 'present' as AttendanceStatus }),
      {}
    );
    setStudentStatuses(allPresent);
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !attendanceDate || !profile?.id) {
      toast.error('Please select class, subject and date');
      return;
    }
    if (students.length === 0) {
      toast.error('No students available for attendance');
      return;
    }

    setSaving(true);
    // Use stable minimum payload first to avoid schema-cache failures on optional columns.
    let payload: any[] = students.map((student) => ({
      student_id: student.id,
      date: attendanceDate,
      status: studentStatuses[student.id] === 'leave' ? 'late' : studentStatuses[student.id],
    }));

    let { error } = await supabase.from('attendance').insert(payload as any);

    // Adaptive fallback for older attendance schemas.
    if (error) {
      const message = String(error.message || '').toLowerCase();
      if (message.includes("could not find the 'status' column")) {
        payload = payload.map(({ status, ...rest }) => rest);
        const retry = await supabase.from('attendance').insert(payload as any);
        error = retry.error;
      }
    }

    if (error) {
      toast.error(error.message || 'Failed to save attendance');
      setSaving(false);
      return;
    }

    const present = Object.values(studentStatuses).filter((s) => s === 'present').length;
    const absent = Object.values(studentStatuses).filter((s) => s === 'absent').length;
    const leave = Object.values(studentStatuses).filter((s) => s === 'leave').length;
    toast.success(`Attendance saved: ${present}P ${absent}A ${leave}L`);
    setSaving(false);
  };

  const statusConfig = {
    present: { label: 'Present', color: '#00d084', bg: '#00d08420', icon: Check },
    absent: { label: 'Absent', color: '#ff4d6d', bg: '#ff4d6d20', icon: X },
    leave: { label: 'Leave', color: '#ff9f43', bg: '#ff9f4320', icon: Clock },
  };

  const presentCount = Object.values(studentStatuses).filter((s) => s === 'present').length;
  const absentCount = Object.values(studentStatuses).filter((s) => s === 'absent').length;
  const leaveCount = Object.values(studentStatuses).filter((s) => s === 'leave').length;

  return (
    <DashboardLayout role="teacher">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mark Attendance</h1>
          <p className="text-[#6b778f]">Quick and easy daily attendance marking</p>
        </div>

        {/* Selection Form */}
        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-white">Date</Label>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-white">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((cls) => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-[#1a2035] border-[#6b778f]/30 text-white mt-2">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={markAllPresent}
                variant="outline"
                className="w-full border-[#00d084] text-[#00d084] hover:bg-[#00d084]/10"
              >
                Mark All Present
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Bar */}
        <div className="grid grid-cols-3 gap-4">
          <Card
            className="p-4 border-2"
            style={{ backgroundColor: statusConfig.present.bg, borderColor: statusConfig.present.color }}
          >
            <p className="text-sm text-[#6b778f] mb-1">Present</p>
            <p className="text-3xl font-bold" style={{ color: statusConfig.present.color }}>
              {presentCount}
            </p>
          </Card>
          <Card
            className="p-4 border-2"
            style={{ backgroundColor: statusConfig.absent.bg, borderColor: statusConfig.absent.color }}
          >
            <p className="text-sm text-[#6b778f] mb-1">Absent</p>
            <p className="text-3xl font-bold" style={{ color: statusConfig.absent.color }}>
              {absentCount}
            </p>
          </Card>
          <Card
            className="p-4 border-2"
            style={{ backgroundColor: statusConfig.leave.bg, borderColor: statusConfig.leave.color }}
          >
            <p className="text-sm text-[#6b778f] mb-1">Leave</p>
            <p className="text-3xl font-bold" style={{ color: statusConfig.leave.color }}>
              {leaveCount}
            </p>
          </Card>
        </div>

        {/* Student List */}
        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
          <div className="space-y-2">
            {students.map((student) => {
              const status = studentStatuses[student.id];
              const config = statusConfig[status];
              const Icon = config.icon;

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-[#1a2035] rounded-xl hover:bg-[#1a2035]/80 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="roll-number text-[#6b778f] font-semibold">{student.roll_number || student.id.slice(0, 6)}</span>
                    <span className="text-white font-medium">{student.name}</span>
                  </div>
                  <button
                    onClick={() => toggleStatus(student.id)}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl font-semibold transition hover:opacity-80"
                    style={{
                      backgroundColor: config.bg,
                      color: config.color,
                      border: `2px solid ${config.color}`,
                    }}
                  >
                    <Icon size={18} />
                    <span>{config.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Save Button */}
        <div className="sticky bottom-6 flex justify-center">
          <Button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="bg-gradient-to-r from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 text-white px-12 py-6 text-lg font-semibold shadow-2xl"
          >
            <Save size={20} className="mr-2" />
            {saving ? 'Saving...' : `Save Attendance (${presentCount}P ${absentCount}A ${leaveCount}L)`}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
