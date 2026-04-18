import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import { AlertCircle, Calendar, UserCircle } from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { useChildren } from '../../../hooks/data/useChildren';

export function ParentDashboard() {
  const { children, loading } = useChildren();

  if (loading) {
    return (
      <DashboardLayout role="parent">
        <div className="p-6">
          <Spinner className="mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Parent Dashboard</h1>
          <p className="text-[#6b778f]">Monitor your child's academic progress</p>
        </div>

        {children.length === 0 ? (
          <Card className="text-center py-12">
            <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Children Enrolled</h3>
            <p className="text-muted-foreground">Your children will appear here once enrolled.</p>
          </Card>
        ) : children.map((child) => (
          <Card key={child.id} className="bg-gradient-to-br from-[#9b5de5]/20 to-[#1e2840] border-[#9b5de5]/30 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 text-center sm:text-left">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#1a2035] flex items-center justify-center flex-shrink-0">
                <UserCircle size={40} className="text-[#9b5de5]" />
              </div>
              <div className="flex-1 w-full">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 sm:mb-2">{child.name}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[#6b778f] text-sm">Class</p>
                    <p className="text-white font-semibold">{child.class_grade}-{child.class_section}</p>
                  </div>
                  <div>
                    <p className="text-[#6b778f] text-sm">Roll No</p>
                    <p className="text-white font-semibold">{child.roll_number}</p>
                  </div>
                  <div>
                    <p className="text-[#6b778f] text-sm">GPA</p>
                    <p className="text-[#00d084] font-semibold">3.7 (A)</p> {/* TODO: compute */}
                  </div>
                  <div>
                    <p className="text-[#6b778f] text-sm">Attendance</p>
                    <p className="text-[#4f8eff] font-semibold">{child.recentAttendance?.percentage || 'N/A'}%</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Low Attendance Alert */}
        <div className="bg-gradient-to-r from-[#ff4d6d]/20 to-transparent border-l-4 border-[#ff4d6d] p-4 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-[#ff4d6d] mt-0.5" />
          <div>
            <p className="text-white font-semibold">Attendance Alert</p>
            <p className="text-sm text-[#6b778f]">
              Aarjav was absent from Chemistry on Apr 9, 10:00 AM
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Grades */}
          <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Grades</h2>
            <div className="space-y-4">
              {children.flatMap(child => child.recentGrades?.map((grade, i) => (
                <div key={`${child.id}-${i}`} className="p-4 bg-[#1a2035] rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">{grade.subject}</p>
                      <p className="text-sm text-[#6b778f]">{child.name}</p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-lg font-bold text-sm"
                      style={{ backgroundColor: `${grade.score >= 80 ? '#00d084' : grade.score >= 60 ? '#4f8eff' : '#ff4d6d'}20`, color: grade.score >= 80 ? '#00d084' : grade.score >= 60 ? '#4f8eff' : '#ff4d6d' }}
                    >
                      {grade.grade || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={grade.score} className="flex-1 h-2" style={{ '--progress-color': grade.score >= 80 ? '#00d084' : grade.score >= 60 ? '#4f8eff' : '#ff4d6d' } as any} />
                    <span className="text-sm font-semibold text-white">{grade.score}%</span>
                  </div>
                </div>
              )))}
              {children.every(c => !c.recentGrades || c.recentGrades.length === 0) && (
                <p className="text-[#6b778f]">No recent grades available.</p>
              )}
            </div>
          </Card>

          {/* Attendance Overview */}
          <Card className="bg-[#1e2840] border-[#6b778f]/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Attendance Overview</h2>
            <div className="grid grid-cols-1 gap-4">
              {children.map((child) => (
                <div key={`att-${child.id}`} className="p-4 bg-[#1a2035] rounded-xl">
                  <p className="text-sm font-semibold text-white mb-2">{child.name}</p>
                  <div className="flex justify-between items-end">
                    <p className="text-3xl font-bold text-white mb-1">{child.recentAttendance?.percentage || 0}%</p>
                    <p className="text-xs text-[#6b778f] mb-2">{child.recentAttendance?.count_present || 0} Present / {child.recentAttendance?.count_absent || 0} Absent</p>
                  </div>
                  <Progress value={child.recentAttendance?.percentage || 0} className="h-2 mt-2" style={{ '--progress-color': (child.recentAttendance?.percentage || 0) >= 80 ? '#00d084' : '#ff9f43' } as any} />
                </div>
              ))}
              {children.length === 0 && (
                <p className="text-[#6b778f]">No attendance data available.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
