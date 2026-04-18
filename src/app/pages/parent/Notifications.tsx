import { useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { Bell, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '../../../types/supabase';
import { useNotifications } from '../../../hooks/data/useNotifications';

type NotificationType = 'attendance' | 'grade' | 'announcement' | 'leave' | 'alert';

export default function ParentNotifications() {
  const { notifications, markRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const [filter, setFilter] = useState<NotificationType | 'all' | 'unread'>('all');

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

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'attendance':
        return <AlertTriangle size={20} className="text-[#ff9f43]" />;
      case 'grade':
        return <CheckCircle2 size={20} className="text-[#00d084]" />;
      case 'announcement':
        return <Info size={20} className="text-[#4f8eff]" />;
      case 'leave':
        return <CheckCircle2 size={20} className="text-[#7c5cfc]" />;
      case 'alert':
        return <Bell size={20} className="text-[#ff4d6d]" />;
      default:
        return <Bell size={20} className="text-muted-foreground" />;
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : filter === 'unread'
    ? notifications.filter((n) => !n.read_at)
    : notifications.filter((n) => n.type === filter);

  if (loading) {
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
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with school alerts</p>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
              <Badge className="bg-destructive text-destructive-foreground">
                {unreadCount} unread
              </Badge>
              <Button onClick={markAllAsReadHandler} variant="outline" className="text-xs md:text-sm">
                Mark All Read
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card className="p-2 md:p-4">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'unread', 'attendance', 'grade', 'announcement', 'leave', 'alert'] as (NotificationType | 'all' | 'unread')[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
                className="px-3 md:px-4 h-9 md:h-10 text-xs md:text-sm"
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </Card>

        {/* List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg">No notifications</p>
              <p className="text-muted-foreground text-sm">Check back later for updates</p>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-6 transition-all border-l-4 ${
                  !notification.read_at
                    ? 'bg-primary/5 border-primary shadow-sm'
                    : 'bg-card'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">{getIcon(notification.type as NotificationType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white truncate">{notification.title}</h3>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        {!notification.read_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadHandler(notification.id)}
                          >
                            <CheckCircle2 size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotificationHandler(notification.id)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                      {notification.priority === 'high' && (
                        <Badge className="bg-destructive/20 text-destructive text-xs">High</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
