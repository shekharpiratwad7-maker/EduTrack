import { useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { Bell, CheckCircle2, Info, AlertTriangle, X, Megaphone, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../../../hooks/data/useNotifications';

type NotificationType = 'attendance' | 'grade' | 'announcement' | 'leave' | 'alert' | 'webinar' | 'function';

export function NotificationsPage({ role }: { role: 'admin' | 'teacher' | 'student' | 'parent' }) {
  const { notifications, markRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const [filter, setFilter] = useState<string>('all');

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markAsReadHandler = (id: string) => {
    markRead(id);
    toast.success('Notification marked as read');
  };

  const markAllAsReadHandler = () => {
    markAllAsRead();
    toast.success('All notifications marked as read');
  };

  const deleteNotificationHandler = (id: string) => {
    deleteNotification(id);
    toast.success('Notification deleted');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <AlertTriangle size={20} className="text-[#ff9f43]" />;
      case 'grade':
        return <CheckCircle2 size={20} className="text-[#00d084]" />;
      case 'webinar':
        return <Megaphone size={20} className="text-[#ffd60a]" />;
      case 'function':
        return <Calendar size={20} className="text-[#ff9f43]" />;
      case 'leave':
        return <CheckCircle2 size={20} className="text-[#7c5cfc]" />;
      case 'alert':
        return <Bell size={20} className="text-[#ff4d6d]" />;
      default:
        return <Info size={20} className="text-[#4f8eff]" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read_at;
    return n.type === filter;
  });

  if (loading) {
    return (
      <DashboardLayout role={role}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Spinner className="w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              Notifications
            </h1>
            <p className="text-[#6b778f] text-base md:text-lg">Stay updated with the latest school activity.</p>
          </div>
          {unreadCount > 0 && (
            <div className="flex flex-row items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
              <Badge className="bg-[#ff4d6d]/10 text-[#ff4d6d] border border-[#ff4d6d]/20 px-3 py-1 rounded-full text-xs font-bold">
                {unreadCount} UNREAD
              </Badge>
              <Button onClick={markAllAsReadHandler} variant="outline" size="sm" className="border-[#6b778f]/20 text-white hover:bg-white/5 rounded-xl font-bold text-xs">
                Mark All Read
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-widest px-2">Filters</h3>
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 no-scrollbar">
              {[
                { id: 'all', label: 'All Updates', icon: Bell },
                { id: 'unread', label: 'Unread Only', icon: AlertTriangle },
                { id: 'webinar', label: 'Webinars', icon: Megaphone },
                { id: 'function', label: 'Functions', icon: Info },
                { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all whitespace-nowrap lg:whitespace-normal ${
                    filter === f.id 
                    ? 'bg-[#4f8eff] text-white shadow-lg shadow-[#4f8eff]/20' 
                    : 'bg-[#1e2840]/50 text-[#6b778f] hover:bg-[#1e2840] hover:text-white border border-[#6b778f]/10'
                  }`}
                >
                  <f.icon size={18} />
                  <span className="font-bold text-sm">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-3 space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card className="bg-[#1e2840]/30 border-dashed border-2 border-[#6b778f]/20 p-10 md:p-20 text-center rounded-3xl">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#1e2840] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Bell size={32} className="text-[#6b778f] opacity-30 md:size-[40px]" />
                </div>
                <h3 className="text-white font-bold text-lg md:text-xl mb-2">All Caught Up!</h3>
                <p className="text-[#6b778f] text-sm md:text-base">No notifications found for this category.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`group relative overflow-hidden transition-all duration-300 border-none rounded-3xl ${
                      !notification.read_at
                        ? 'bg-gradient-to-r from-[#1e2840] to-[#1a2035] shadow-xl'
                        : 'bg-[#1e2840]/30 opacity-80'
                    }`}
                  >
                    {!notification.read_at && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#4f8eff]" />
                    )}
                    <div className="p-6 md:p-8 flex items-start gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${
                        !notification.read_at ? 'bg-[#4f8eff]/10' : 'bg-[#1a2035]'
                      }`}>
                        {getIcon(notification.type || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2 gap-4">
                          <div>
                            <h3 className={`font-black text-lg md:text-xl leading-tight transition-colors ${
                              !notification.read_at ? 'text-white' : 'text-[#6b778f]'
                            }`}>
                              {notification.title}
                            </h3>
                            <p className="text-xs font-bold text-[#6b778f] uppercase tracking-widest mt-1">
                              {new Date(notification.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read_at && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsReadHandler(notification.id)}
                                className="w-10 h-10 rounded-xl bg-[#4f8eff]/10 text-[#4f8eff] hover:bg-[#4f8eff] hover:text-white transition-all"
                              >
                                <CheckCircle2 size={18} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotificationHandler(notification.id)}
                              className="w-10 h-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-[#6b778f] transition-all"
                            >
                              <X size={18} />
                            </Button>
                          </div>
                        </div>
                        <p className={`text-sm md:text-base leading-relaxed ${
                          !notification.read_at ? 'text-[#9fb0d6]' : 'text-[#6b778f]'
                        }`}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
