import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Calendar } from '../../components/ui/calendar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Spinner } from '../../components/ui/spinner';
import { Bell, Calendar as CalendarIcon, Filter, UserCircle, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useChildren } from '../../../hooks/data/useChildren';
import { useAuth } from '../../../contexts/AuthContext';
import type { Database } from '../../../types/supabase';
import { format, addDays } from 'date-fns';

type AttendanceRecord = Database['public']['Tables']['attendance']['Row'] & {
  student_name?: string;
  subject?: string;
};

export default function ParentAttendance() {
  const { profile } = useAuth();
  const { children, loading: childrenLoading } = useChildren();
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [date, setDate] = useState(new Date());
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, attended: 0, percentage: 0 });

  const child = children.find(c => c.id === selectedChild);
  
  // Select first child by default
  useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  const subjects = ['all', 'Mathematics', 'Science', 'English', 'History'];

  const filteredRecords = useMemo(() => {
    let records = attendanceRecords;
    if (selectedSubject !== 'all') {
      records = records.filter(r => r.subject === selectedSubject);
    }
    return records;
  }, [attendanceRecords, selectedSubject]);

  const selectedDateRecord = useMemo(() => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendanceRecords.find(r => r.date === dateStr);
  }, [attendanceRecords, date]);

  const attendanceMap = useMemo(() => {
    const map: Record<string, string> = {};
    attendanceRecords.forEach(r => {
      map[r.date] = r.status;
    });
    return map;
  }, [attendanceRecords]);

  useEffect(() => {
    if (!selectedChild || !profile?.id) {
      setAttendanceRecords([]);
      setStats({ total: 0, attended: 0, percentage: 0 });
      return;
    }

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        // Fetch all records for the selected child to support calendar highlights and filtering
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', selectedChild)
          .order('date', { ascending: false });

        if (error) throw error;

        const records = data || [];
        setAttendanceRecords(records);

        // Calculate stats for the current selected month
        const currentMonthPrefix = format(date, 'yyyy-MM');
        const monthRecords = records.filter(r => r.date.startsWith(currentMonthPrefix));
        
        const total = monthRecords.length;
        const attended = monthRecords.filter((r: AttendanceRecord) => 
          r.status === 'present' || r.status === 'late'
        ).length;
        const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
        setStats({ total, attended, percentage });

      } catch (error: any) {
        toast.error(`Failed to load attendance: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedChild, profile?.id]); // Only refetch when child changes, filter locally for date

  if (childrenLoading) {
    return (
      <DashboardLayout role="parent">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Spinner className="w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Attendance</h1>
          <p className="text-muted-foreground">Monitor your child's attendance records</p>
        </div>

        {/* Child Selector */}
        {children.length === 0 ? (
          <Card className="text-center py-12">
            <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Children Enrolled</h3>
            <p className="text-muted-foreground mb-4">Your children will appear here once enrolled.</p>
            <p className="text-sm text-muted-foreground/80">
              Contact admin or run: <code>cd supabase-test && node seed-parent-child.js</code>
            </p>
          </Card>
        ) : (
          <Card className="p-6">
            <label className="text-white font-medium mb-3 block">Select Child</label>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} - Class {child.class_grade}-{child.class_section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        )}

        {selectedChild && child && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-[#00d084]/20 p-6 border-[#00d084]/30">
                <p className="text-muted-foreground mb-2">Total Classes</p>
                <p className="text-4xl font-bold text-[#00d084]">{stats.total}</p>
              </Card>
              <Card className="bg-gradient-to-br from-[#4f8eff]/20 p-6 border-[#4f8eff]/30">
                <p className="text-muted-foreground mb-2">Present</p>
                <p className="text-4xl font-bold text-[#4f8eff]">{stats.attended}</p>
              </Card>
              <Card className="bg-gradient-to-br from-[#ff9f43]/20 p-6 border-[#ff9f43]/30">
                <p className="text-muted-foreground mb-2">Attendance Rate</p>
                <p className="text-4xl font-bold text-[#ff9f43]">{stats.percentage}%</p>
              </Card>
            </div>

            {/* Filters */}
            <Card className="p-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={20} />
                  <span>Month: {format(date, 'MMMM yyyy')}</span>
                </div>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Calendar & Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778d]/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CalendarIcon size={20} className="text-[#4f8eff]" />
                    Attendance Calendar
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setDate(new Date())} className="text-[#4f8eff] hover:text-[#4f8eff]/80">Today</Button>
                </div>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(value) => value && setDate(value)}
                  className="rounded-xl border border-[#6b778d]/20 bg-[#1a2035]/50 p-4"
                  modifiers={{
                    present: (d) => attendanceMap[format(d, 'yyyy-MM-dd')] === 'present',
                    absent: (d) => attendanceMap[format(d, 'yyyy-MM-dd')] === 'absent',
                    late: (d) => attendanceMap[format(d, 'yyyy-MM-dd')] === 'late',
                  }}
                  modifiersStyles={{
                    present: { color: '#00d084', fontWeight: 'bold', borderBottom: '2px solid #00d084' },
                    absent: { color: '#ff4d6d', fontWeight: 'bold', borderBottom: '2px solid #ff4d6d' },
                    late: { color: '#ff9f43', fontWeight: 'bold', borderBottom: '2px solid #ff9f43' },
                  }}
                />
                <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#00d084]" />
                    <span className="text-[#6b778d]">Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#ff4d6d]" />
                    <span className="text-[#6b778d]">Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#ff9f43]" />
                    <span className="text-[#6b778d]">Late</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778d]/20">
                <h2 className="text-xl font-bold text-white mb-6">Day Details</h2>
                <div className="space-y-6">
                  <div className="p-4 bg-[#1a2035]/50 rounded-2xl border border-[#6b778d]/10">
                    <p className="text-[#6b778d] text-sm mb-1 uppercase tracking-wider font-semibold">Selected Date</p>
                    <p className="text-xl font-bold text-white">{format(date, 'EEEE, MMMM do, yyyy')}</p>
                  </div>

                  {selectedDateRecord ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="flex items-center justify-between p-4 bg-[#1a2035]/80 rounded-2xl border border-[#6b778d]/20">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-opacity-20 ${
                            selectedDateRecord.status === 'present' ? 'bg-[#00d084]/20 text-[#00d084]' :
                            selectedDateRecord.status === 'late' ? 'bg-[#ff9f43]/20 text-[#ff9f43]' : 'bg-[#ff4d6d]/20 text-[#ff4d6d]'
                          }`}>
                            <CheckCircle size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-white capitalize">{selectedDateRecord.status}</p>
                            <p className="text-sm text-[#6b778d]">{selectedDateRecord.subject || 'All Day'}</p>
                          </div>
                        </div>
                        <Badge className={`capitalize ${
                          selectedDateRecord.status === 'present' ? 'bg-[#00d084]/20 text-[#00d084] border-[#00d084]/30' :
                          selectedDateRecord.status === 'late' ? 'bg-[#ff9f43]/20 text-[#ff9f43] border-[#ff9f43]/30' : 'bg-[#ff4d6d]/20 text-[#ff4d6d] border-[#ff4d6d]/30'
                        }`}>
                          {selectedDateRecord.status}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-[#1a2035]/30 rounded-2xl border border-dashed border-[#6b778d]/20">
                      <AlertCircle size={40} className="text-[#6b778d] mb-4 opacity-50" />
                      <p className="text-[#6b778d]">No attendance record found for this date.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-[#1e2840]/50 backdrop-blur-xl border-[#6b778d]/20 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Recent Attendance ({child.name})</h2>
                {loading && <Spinner className="w-5 h-5" />}
              </div>
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon size={48} className="mx-auto mb-4 text-[#6b778d] opacity-50" />
                  <p className="text-[#6b778d]">No attendance records found for this selection.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <CalendarIcon size={20} />
                        <div>
                          <p className="font-semibold">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
                          <p className="text-sm text-muted-foreground">{record.subject}</p>
                        </div>
                      </div>
                      <Badge variant={
                        record.status === 'present' ? 'default' :
                        record.status === 'late' ? 'secondary' : 'destructive'
                      }>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
