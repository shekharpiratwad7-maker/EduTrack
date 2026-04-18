import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import { Users, GraduationCap, Calendar, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { useClasses } from '../../../hooks/data/useClasses';
import { useLeaves } from '../../../hooks/data/useLeaves';
import type { Database } from '../../../types/supabase';

type Leave = Database['public']['Tables']['leave_applications']['Row'] & {
  profiles: {
    name: string;
    class_grade: string | null;
    class_section: string | null;
  }[];
};

interface Stat {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: any;
  color: string;
}

interface RecentActivity {
  type: string;
  message: string;
  time: string;
}

const initialStats: Stat[] = [];

export function AdminDashboard() {

  const { classes, loading: classesLoading } = useClasses();
  const { leaves: pendingLeaves, loading: leavesLoading } = useLeaves('pending');
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>(initialStats);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);

        // Fetch actual rows (just IDs) to count reliably — head:true returns null under RLS
        const [studentsRes, teachersRes, parentsRes] = await Promise.all([
          supabase.from('profiles').select('id').eq('role', 'student'),
          supabase.from('profiles').select('id').eq('role', 'teacher'),
          supabase.from('profiles').select('id').eq('role', 'parent'),
        ]);

        const totalStudents = studentsRes.data?.length ?? 0;
        const totalTeachers = teachersRes.data?.length ?? 0;
        const totalParents = parentsRes.data?.length ?? 0;
        const classesCount = classes.length;
        const pendingLeavesCount = pendingLeaves?.length ?? 0;

        // Today's attendance
        const today = new Date().toISOString().split('T')[0];
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('status')
          .eq('date', today);
        let todaysAttendance = 0;
        if (attendanceData && attendanceData.length > 0) {
          const present = attendanceData.filter((a: any) => a.status?.toLowerCase() === 'present').length;
          todaysAttendance = Math.round((present / attendanceData.length) * 100);
        }

        setStats([
          { label: 'Total Students', value: totalStudents.toString(), trend: '', trendUp: true, icon: Users, color: '#ff9f43' },
          { label: 'Total Teachers', value: totalTeachers.toString(), trend: '', trendUp: true, icon: GraduationCap, color: '#00d084' },
          { label: 'Active Classes', value: classesCount.toString(), trend: '', trendUp: true, icon: Calendar, color: '#4f8eff' },
          { label: "Today's Attendance", value: attendanceData && attendanceData.length > 0 ? `${todaysAttendance}%` : 'N/A', trend: '', trendUp: todaysAttendance >= 80, icon: Calendar, color: '#7c5cfc' },
          { label: 'Pending Leaves', value: pendingLeavesCount.toString(), trend: '', trendUp: pendingLeavesCount === 0, icon: Bell, color: '#ff4d6d' },
          { label: 'Total Parents', value: totalParents.toString(), trend: '', trendUp: true, icon: Users, color: '#ffd60a' },
        ]);

      } catch (error) {
        console.error('Dashboard stats error:', error);
        toast.error('Failed to load stats');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [classes, pendingLeaves]);

  // Populate recent activity from pending leaves ✅
  useEffect(() => {
    if (pendingLeaves && pendingLeaves.length > 0) {
      setRecentActivity(pendingLeaves.map((leave: Leave) => ({
        type: 'leave',
        message: `${leave.profiles?.[0]?.name || 'Unknown Student'} applied for leave - ${leave.reason || 'No reason'}`,
        time: new Date(leave.created_at).toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
        }),
      })));
    } else {
      setRecentActivity([]);
    }
  }, [pendingLeaves]);

  const loading = classesLoading || leavesLoading || statsLoading;


  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="p-6 space-y-6">
          <Spinner className="mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-[#6b778f]">Welcome back! Here's your system overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-[#1e2840] border-[#6b778f]/20 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[#6b778f] text-sm mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      {stat.trendUp ? (
                        <TrendingUp size={16} className="text-[#00d084]" />
                      ) : (
                        <TrendingDown size={16} className="text-[#ff4d6d]" />
                      )}
                      <span
                        className={`text-sm font-semibold ${
                          stat.trendUp ? 'text-[#00d084]' : 'text-[#ff4d6d]'
                        }`}
                      >
                        {stat.trend}
                      </span>
                      <span className="text-sm text-[#6b778f]">vs last month</span>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[${stat.color}20]`}
                  >
                    <Icon size={24} className={`text-[${stat.color}]`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>  

        {/* Recent Activity */}
        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          {(recentActivity || []).length === 0 ? (

            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-[#1a2035] rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-[#4f8eff] mt-2" />
                  <div className="flex-1">
                    <p className="text-white">{activity.message}</p>
                    <p className="text-sm text-[#6b778f] mt-1">{activity.time}</p>
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
