import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Calendar, ClipboardList, Bell, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useClasses } from '../../../hooks/data/useClasses';
import { useLeaves } from '../../../hooks/data/useLeaves';
import { useAssignments, getAssignmentStats } from '../../../hooks/data/useAssignments';
import { useAuth } from '../../../contexts/AuthContext';

export function TeacherDashboard() {
  const { classes, loading: classesLoading, error: classesError, refetch: refetchClasses } = useClasses();
  const { leaves, loading: leavesLoading, error: leavesError, approveLeave, rejectLeave } = useLeaves('pending');
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignments();
  const { profile } = useAuth();
  
  // 🔧 DEBUG LOG (remove after fix)
  console.log('🧑‍🏫 TeacherDashboard DEBUG:', {
    profileId: profile?.id,
    profileRole: profile?.role,
    classesLoading,
    leavesLoading,
    assignmentsLoading,
    hasProfile: !!profile,
    classesCount: classes?.length,
    leavesCount: leaves?.length
  });
  
  const assignmentStatsData = getAssignmentStats(assignments || []);

  const todaySchedule = classes.slice(0,5).map((c, i) => ({
    period: `${i+1}`,
    subject: 'Mathematics', // TODO: from timetable
    class: `${c.grade}-${c.section}`,
    time: '08:00 - 08:45',
    room: c.room || 'R-101',
    status: i < 2 ? 'completed' : i === 2 ? 'current' : 'upcoming' as const
  }));

  const pendingLeavesData = leaves.map(l => ({
    id: l.id,
    student: l.profiles?.name || 'Unknown Student',
    class: l.profiles ? `${l.profiles.class_grade || ''}-${l.profiles.class_section || ''}` : 'N/A',
    dates: `${l.start_date || ''} - ${l.end_date || ''}`,
    reason: l.reason || 'N/A',
    docs: (l.documents || []).length > 0
  }));

  const loading = classesLoading || leavesLoading || assignmentsLoading;
  const hasError = !! (classesError || leavesError || assignmentsError);

  if (loading) {
    return (
      <DashboardLayout role="teacher">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (hasError || !profile) {
    return (
      <DashboardLayout role="teacher">
        <div className="p-6 space-y-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <AlertCircle className="h-8 w-8 text-red-400 inline mr-2" />
            <h2 className="text-xl font-bold text-red-400 mb-2 inline">Load Error</h2>
            <p className="text-red-300 mb-4">
              Profile: {!profile ? '❌ Missing' : `✅ ${profile.role || 'unknown'}`}
              <br/>
              Errors: {classesError || 'none'} | {leavesError || 'none'} | {assignmentsError || 'none'}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => {
                refetchClasses?.();
                toast.success('Retrying data load...');
              }} className="bg-red-500 hover:bg-red-600">
                Retry Data
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/signin'}>
                Re-login
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Teacher Dashboard</h1>
          <p className="text-[#6b778f]">Good morning, {profile?.name || 'Teacher'}!</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link to="/teacher/attendance">
            <Button className="w-full h-20 bg-gradient-to-br from-[#00d084] to-[#00d084]/80 hover:opacity-90 flex flex-col gap-1">
              <Calendar size={24} />
              <span className="font-semibold">Mark Attendance</span>
            </Button>
          </Link>
          <Link to="/teacher/marks">
            <Button className="w-full h-20 bg-gradient-to-br from-[#4f8eff] to-[#7c5cfc] hover:opacity-90 flex flex-col gap-1">
              <ClipboardList size={24} />
              <span className="font-semibold">Enter Marks</span>
            </Button>
          </Link>
          <Link to="/teacher/assignments">
            <Button className="w-full h-20 bg-gradient-to-br from-[#ff9f43] to-[#ff9f43]/80 hover:opacity-90 flex flex-col gap-1">
              <ClipboardList size={24} />
              <span className="font-semibold">Assignments</span>
            </Button>
          </Link>
          <Link to="/teacher/leave-approval">
            <Button className="w-full h-20 bg-gradient-to-br from-[#ff4d6d] to-[#ff4d6d]/80 hover:opacity-90 flex flex-col gap-1">
              <Bell size={24} />
              <span className="font-semibold">Leave Approvals</span>
            </Button>
          </Link>
        </div>

        {/* Today's Schedule */}
        <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Today's Schedule</h2>
            {classes.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Classes Assigned</h3>
                <p className="text-muted-foreground mb-4">
                  No classes found for you. 
                  <br/>🧑‍💻 Check: profile loaded? DB has your teacher_id classes?
                </p>
                <Button variant="outline" asChild>
                  <Link to="/admin/classes">Manage Classes</Link>
                </Button>
              </div>
            ) : (
              todaySchedule.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No schedule data available today
                </div>
              )
            ) || (
            <div className="space-y-3">
              {todaySchedule.map((schedule) => (
                <div
                  key={schedule.period}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    schedule.status === 'current'
                      ? 'bg-[#4f8eff]/20 border-2 border-[#4f8eff]'
                      : schedule.status === 'completed'
                      ? 'bg-[#1a2035] opacity-60'
                      : 'bg-[#1a2035]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{schedule.period}</p>
                      <p className="text-xs text-[#6b778f]">Period</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{schedule.subject}</p>
                      <p className="text-sm text-[#6b778f]">
                        {schedule.class} · {schedule.room}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{schedule.time}</p>
                    {schedule.status === 'current' && (
                      <Link to="/teacher/attendance">
                        <Button size="sm" className="mt-2 bg-[#4f8eff] hover:bg-[#7c5cfc]">
                          Quick Attendance
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Leave Requests */}
          <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Pending Leave Requests</h2>
              <span className="bg-[#ff4d6d] text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingLeavesData.length}
              </span>
            </div>
            {pendingLeavesData.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Pending Leaves</h3>
                <p className="text-muted-foreground">All leave requests up to date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeavesData.map((leave, i) => (
                  <div key={leave.id || i} className="p-4 bg-[#1a2035] rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-white">{leave.student}</p>
                        <p className="text-sm text-[#6b778f]">{leave.class}</p>
                      </div>
                      {leave.docs && (
                        <span className="text-xs bg-[#00d084]/20 text-[#00d084] px-2 py-1 rounded">
                          Docs
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white mb-1">{leave.dates}</p>
                    <p className="text-sm text-[#6b778f] mb-3">{leave.reason}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-[#00d084] hover:bg-[#00d084]/90" onClick={async () => {
                        try {
                          await approveLeave(leave.id);
                          toast.success('Leave approved');
                        } catch (e) {
                          toast.error(String(e));
                        }
                      }}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 border-[#ff4d6d] text-[#ff4d6d] hover:bg-[#ff4d6d]/10" onClick={async () => {
                        try {
                          await rejectLeave(leave.id);
                          toast.success('Leave rejected');
                        } catch (e) {
                          toast.error(String(e));
                        }
                      }}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Assignment Submissions */}
          <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Assignment Submissions</h2>
            {assignmentStatsData.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Assignments Yet</h3>
                <p className="text-muted-foreground">Create assignments for your classes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignmentStatsData.map((assignment, i) => (
                  <div key={i} className="p-4 bg-[#1a2035] rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-semibold text-white">{assignment.assignment}</p>
                      <span className="text-sm text-[#6b778f]">
                        {assignment.submitted}/{assignment.total}
                      </span>
                    </div>
                    <div className="relative h-2 bg-[#1a2035] rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#4f8eff] to-[#00d084] rounded-full transition-all"
                        style={{ width: `${(assignment.submitted / assignment.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#6b778f] mt-2">
                      {assignment.pending} pending
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

