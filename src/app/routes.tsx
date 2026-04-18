import { createBrowserRouter } from 'react-router-dom';
import { Root } from './components/Root';
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { AdminDashboard } from './pages/admin/Dashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { ClassManagement } from './pages/admin/ClassManagement';
import { Announcements } from './pages/admin/Announcements';
import { TeacherDashboard } from './pages/teacher/Dashboard';
import { MarkAttendance } from './pages/teacher/MarkAttendance';
import { MarksEntry } from './pages/teacher/MarksEntry';
import { Assignments } from './pages/teacher/Assignments';
import { LeaveApproval } from './pages/teacher/LeaveApproval';
import { StudentDashboard } from './pages/student/Dashboard';
import { MyAttendance } from './pages/student/MyAttendance';
import { MyGrades } from './pages/student/MyGrades';
import { LeaveApplication } from './pages/student/LeaveApplication';
import { StudentProfile } from './pages/student/Profile';
import { ParentDashboard } from './pages/parent/Dashboard';
import ParentAttendance from './pages/parent/Attendance';
import { NotificationsPage } from './pages/shared/NotificationsPage';
import Feedback from './pages/parent/Feedback';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        Component: SignIn,
      },
      {
        path: 'signin',
        Component: SignIn,
      },
      {
        path: 'signup',
        Component: SignUp,
      },
      {
        path: 'forgot-password',
        Component: ForgotPassword,
      },
      {
        path: 'admin',
        children: [
          {
            index: true,
            Component: AdminDashboard,
          },
          {
            path: 'users',
            Component: UserManagement,
          },
          {
            path: 'classes',
            Component: ClassManagement,
          },
          {
            path: 'announcements',
            Component: Announcements,
          },
          {
            path: 'notifications',
            element: <NotificationsPage role="admin" />,
          },
        ],
      },
      {
        path: 'teacher',
        children: [
          {
            index: true,
            Component: TeacherDashboard,
          },
          {
            path: 'attendance',
            Component: MarkAttendance,
          },
          {
            path: 'marks',
            Component: MarksEntry,
          },
          {
            path: 'assignments',
            Component: Assignments,
          },
          {
            path: 'leave-approval',
            Component: LeaveApproval,
          },
          {
            path: 'notifications',
            element: <NotificationsPage role="teacher" />,
          },
        ],
      },
      {
        path: 'student',
        children: [
          {
            index: true,
            Component: StudentDashboard,
          },
          {
            path: 'attendance',
            Component: MyAttendance,
          },
          {
            path: 'grades',
            Component: MyGrades,
          },
          {
            path: 'leave',
            Component: LeaveApplication,
          },
          {
            path: 'profile',
            Component: StudentProfile,
          },
          {
            path: 'notifications',
            element: <NotificationsPage role="student" />,
          },
        ],
      },
      {
        path: 'parent',
        children: [
          {
            index: true,
            Component: ParentDashboard,
          },
          {
            path: 'attendance',
            Component: ParentAttendance,
          },
          {
            path: 'notifications',
            element: <NotificationsPage role="parent" />,
          },
          {
            path: 'feedback',
            Component: Feedback,
          },
        ],
      },
      {
        path: '*',
        Component: NotFound,
      },
    ],
  },
]);

