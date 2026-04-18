import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { toast } from 'sonner';
import {
  ShieldCheck,
  GraduationCap,
  UserCircle,
  Users,
  LayoutDashboard,
  Calendar,
  FileText,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'admin' | 'teacher' | 'student' | 'parent';
}

const roleConfig = {
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    color: '#ff4d6d',
    nav: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: Users, label: 'User Management', path: '/admin/users' },
      { icon: GraduationCap, label: 'Class Management', path: '/admin/classes' },
      { icon: Bell, label: 'Announcements', path: '/admin/announcements' },
    ],
  },
  teacher: {
    label: 'Teacher',
    icon: GraduationCap,
    color: '#00d084',
    nav: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher' },
      { icon: Calendar, label: 'Attendance', path: '/teacher/attendance' },
      { icon: FileText, label: 'Marks Entry', path: '/teacher/marks' },
      { icon: ClipboardList, label: 'Assignments', path: '/teacher/assignments' },
      { icon: Bell, label: 'Leave Approval', path: '/teacher/leave-approval' },
    ],
  },
  student: {
    label: 'Student',
    icon: UserCircle,
    color: '#ff9f43',
    nav: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
      { icon: Calendar, label: 'My Attendance', path: '/student/attendance' },
      { icon: FileText, label: 'My Grades', path: '/student/grades' },
      { icon: ClipboardList, label: 'Leave', path: '/student/leave' },
      { icon: UserCircle, label: 'Profile', path: '/student/profile' },
    ],
  },
  parent: {
    label: 'Parent',
    icon: Users,
    color: '#9b5de5',
    nav: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/parent' },
      { icon: Calendar, label: 'Attendance', path: '/parent/attendance' },
      { icon: Bell, label: 'Notifications', path: '/parent/notifications' },
      { icon: FileText, label: 'Feedback', path: '/parent/feedback' },
    ],
  },
};

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const config = roleConfig[role];
  const RoleIcon = config.icon;

  const { signOut, profile } = useAuth();
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="EduTrack Logo" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-sidebar-foreground text-xl tracking-tight">
            Edu<span className="text-[#4f8eff]">Track</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-sidebar-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <NotificationBell role={role} />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-sidebar-foreground">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-4 mb-6">
            <img src="/logo.png" alt="EduTrack Logo" className="w-12 h-12 rounded-xl object-cover shadow-lg" />
            <div>
              <h2 className="font-bold text-sidebar-foreground text-lg leading-tight">
                Edu<span className="text-[#4f8eff]">Track</span>
              </h2>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{config.label} Portal</p>
            </div>
          </div>
          
          {/* Mobile Profile Section */}
          <div className="flex items-center gap-3 p-3 bg-sidebar-accent/50 rounded-2xl border border-sidebar-border lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f8eff] to-[#7c5cfc] flex items-center justify-center text-white font-bold shadow-lg">
              {(profile?.name || 'U').charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-sidebar-foreground truncate">{profile?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">{role}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {config.nav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 w-full transition"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex sticky top-0 right-0 left-64 h-16 bg-sidebar/80 backdrop-blur-md border-b border-sidebar-border items-center justify-end px-8 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors text-sidebar-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <NotificationBell role={role} />
            <div className="h-8 w-px bg-sidebar-border mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-tight">{profile?.name || 'User'}</p>
                <p className="text-[10px] text-[#6b778f] uppercase font-medium">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f8eff] to-[#7c5cfc] flex items-center justify-center text-white font-bold shadow-lg shadow-[#4f8eff]/20">
                {(profile?.name || 'U').charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="relative">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
