import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';

type AttendanceRow = { date: string; status: string };

export function MyAttendance() {
  const { profile } = useAuth();
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!profile?.id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', profile.id)
        .order('date', { ascending: false });
      if (!error) {
        setAttendanceRows((data || []) as AttendanceRow[]);
      }
      setLoading(false);
    };
    fetchAttendance();
  }, [profile?.id]);

  // Build a map: date string -> status
  const attendanceMap = useMemo(() => {
    const map: Record<string, string> = {};
    attendanceRows.forEach((r) => {
      // If duplicate entries, keep last one
      map[r.date] = r.status?.toLowerCase() || 'present';
    });
    return map;
  }, [attendanceRows]);

  // Get all unique dates with data
  const datesWithData = useMemo(() => {
    return [...new Set(attendanceRows.map(r => r.date))].sort();
  }, [attendanceRows]);

  // Get unique months from data
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    datesWithData.forEach(d => {
      months.add(d.substring(0, 7)); // "2026-04"
    });
    // Also include current month
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    return [...months].sort().reverse();
  }, [datesWithData]);

  // Parse selected month
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Generate calendar days for selected month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0=Sun

    const days: { day: number; dateStr: string; status: string | null }[] = [];

    // Add empty slots for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: 0, dateStr: '', status: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        status: attendanceMap[dateStr] || null,
      });
    }

    return days;
  }, [year, month, attendanceMap]);

  // Filter attendance for selected month
  const monthRows = useMemo(() => {
    const prefix = selectedMonth;
    return attendanceRows.filter(r => r.date.startsWith(prefix));
  }, [attendanceRows, selectedMonth]);

  // Stats for selected month
  const stats = useMemo(() => {
    const uniqueDates = [...new Set(monthRows.map(r => r.date))];
    const total = uniqueDates.length;
    const present = uniqueDates.filter(d => attendanceMap[d] === 'present').length;
    const absent = uniqueDates.filter(d => attendanceMap[d] === 'absent').length;
    const late = uniqueDates.filter(d => attendanceMap[d] === 'late').length;
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, absent, late, pct };
  }, [monthRows, attendanceMap]);

  // Overall stats
  const overallStats = useMemo(() => {
    const uniqueDates = [...new Set(attendanceRows.map(r => r.date))];
    const total = uniqueDates.length;
    const present = uniqueDates.filter(d => attendanceMap[d] === 'present').length;
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);
    return { total, present, pct };
  }, [attendanceRows, attendanceMap]);

  const handlePrevMonth = () => {
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    const d = new Date(year, month, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDate(null);
  };

  const statusColor = (status: string | null) => {
    switch (status) {
      case 'present': return '#00d084';
      case 'absent': return '#ff4d6d';
      case 'late': return '#ff9f43';
      default: return 'transparent';
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle size={16} className="text-[#00d084]" />;
      case 'absent': return <XCircle size={16} className="text-[#ff4d6d]" />;
      case 'late': return <Clock size={16} className="text-[#ff9f43]" />;
      default: return null;
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My Attendance</h1>
          <p className="text-[#6b778f]">Track your attendance record</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#4f8eff]/10 border-2 border-[#4f8eff]/30 p-4 md:p-6 text-center sm:text-left">
            <p className="text-[#6b778f] text-xs md:text-sm mb-1">Overall Attendance</p>
            <p className="text-3xl md:text-4xl font-bold text-[#4f8eff]">{overallStats.pct}%</p>
            <p className="text-[10px] md:text-xs text-[#6b778f] mt-1">{overallStats.present}/{overallStats.total} days</p>
          </Card>
          <Card className="bg-[#00d084]/10 border-2 border-[#00d084]/30 p-4 md:p-6 text-center sm:text-left">
            <p className="text-[#6b778f] text-xs md:text-sm mb-1">{monthNames[month - 1]} Present</p>
            <p className="text-3xl md:text-4xl font-bold text-[#00d084]">{stats.present}</p>
            <p className="text-[10px] md:text-xs text-[#6b778f] mt-1">days</p>
          </Card>
          <Card className="bg-[#ff4d6d]/10 border-2 border-[#ff4d6d]/30 p-4 md:p-6 text-center sm:text-left">
            <p className="text-[#6b778f] text-xs md:text-sm mb-1">{monthNames[month - 1]} Absent</p>
            <p className="text-3xl md:text-4xl font-bold text-[#ff4d6d]">{stats.absent}</p>
            <p className="text-[10px] md:text-xs text-[#6b778f] mt-1">days</p>
          </Card>
          <Card className="bg-[#ff9f43]/10 border-2 border-[#ff9f43]/30 p-4 md:p-6 text-center sm:text-left">
            <p className="text-[#6b778f] text-xs md:text-sm mb-1">{monthNames[month - 1]} Late</p>
            <p className="text-3xl md:text-4xl font-bold text-[#ff9f43]">{stats.late}</p>
            <p className="text-[10px] md:text-xs text-[#6b778f] mt-1">days</p>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
          {/* Month Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft size={20} />
              </Button>
              <h2 className="text-xl font-bold text-white whitespace-nowrap">
                {monthNames[month - 1]} {year}
              </h2>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                <ChevronRight size={20} />
              </Button>
            </div>
            {availableMonths.length > 1 && (
              <Select value={selectedMonth} onValueChange={(v) => { setSelectedMonth(v); setSelectedDate(null); }}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((m) => {
                    const [y, mo] = m.split('-').map(Number);
                    return (
                      <SelectItem key={m} value={m}>
                        {monthNames[mo - 1]} {y}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs text-[#6b778f] font-semibold py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              if (day.day === 0) {
                return <div key={`empty-${idx}`} />;
              }
              const isSelected = selectedDate === day.dateStr;
              const hasData = day.status !== null;
              const today = new Date().toISOString().slice(0, 10);
              const isToday = day.dateStr === today;

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr === selectedDate ? null : day.dateStr)}
                  className={`
                    relative p-2 rounded-lg text-center transition-all cursor-pointer
                    ${isSelected ? 'ring-2 ring-[#4f8eff] bg-[#4f8eff]/20' : 'hover:bg-[#1a2035]'}
                    ${isToday ? 'border border-[#7c5cfc]' : ''}
                  `}
                >
                  <span className={`text-sm font-semibold ${hasData ? 'text-white' : 'text-[#6b778f]'}`}>
                    {day.day}
                  </span>
                  {hasData && (
                    <div
                      className="w-2 h-2 rounded-full mx-auto mt-1"
                      style={{ backgroundColor: statusColor(day.status) }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 md:gap-6 mt-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-[#00d084]" />
              <span className="text-[10px] md:text-sm text-[#6b778f]">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-[#ff4d6d]" />
              <span className="text-[10px] md:text-sm text-[#6b778f]">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-[#ff9f43]" />
              <span className="text-[10px] md:text-sm text-[#6b778f]">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 md:w-3 h-2 md:h-3 rounded-full border border-[#7c5cfc]" />
              <span className="text-[10px] md:text-sm text-[#6b778f]">Today</span>
            </div>
          </div>
        </Card>

        {/* Selected Date Detail */}
        {selectedDate && (
          <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
            {attendanceMap[selectedDate] ? (
              <div className="flex items-center gap-3 p-4 bg-[#1a2035] rounded-xl">
                {statusIcon(attendanceMap[selectedDate])}
                <span className="text-white font-semibold capitalize">{attendanceMap[selectedDate]}</span>
              </div>
            ) : (
              <p className="text-[#6b778f]">No attendance record for this date.</p>
            )}
          </Card>
        )}

        {/* Monthly Attendance List */}
        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {monthNames[month - 1]} {year} — Attendance Records
          </h2>
          {loading ? (
            <p className="text-[#6b778f]">Loading...</p>
          ) : [...new Set(monthRows.map(r => r.date))].sort().reverse().length === 0 ? (
            <p className="text-[#6b778f]">No attendance records for this month.</p>
          ) : (
            <div className="space-y-2">
              {[...new Set(monthRows.map(r => r.date))].sort().reverse().map((dateStr) => {
                const status = attendanceMap[dateStr] || 'present';
                const dayName = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
                return (
                  <div key={dateStr} className="flex items-center justify-between p-3 bg-[#1a2035] rounded-lg">
                    <div className="flex items-center gap-3">
                      {statusIcon(status)}
                      <span className="text-white">{dayName}</span>
                    </div>
                    <Badge
                      className={
                        status === 'present'
                          ? 'bg-[#00d084]/20 text-[#00d084] border-[#00d084]/30'
                          : status === 'absent'
                          ? 'bg-[#ff4d6d]/20 text-[#ff4d6d] border-[#ff4d6d]/30'
                          : 'bg-[#ff9f43]/20 text-[#ff9f43] border-[#ff9f43]/30'
                      }
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
