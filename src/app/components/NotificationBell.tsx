import { useState } from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useNotifications } from '../../hooks/data/useNotifications';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Link } from 'react-router-dom';

export function NotificationBell({ role }: { role: string }) {
  const { notifications, unreadCount, markRead, loading } = useNotifications() as any;
  const unreads = notifications?.filter((n: any) => !n.read_at) || [];
  const count = unreads.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-white/10 transition-colors group">
          <Bell size={24} className="text-[#6b778f] group-hover:text-white transition-colors" />
          {count > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-[#ff4d6d] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1e2840] animate-in zoom-in-50 duration-300">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-32px)] sm:w-96 p-0 bg-[#1e2840] border-[#6b778f]/20 shadow-2xl z-[100] mx-4 sm:mx-0" align="end" sideOffset={8}>
        <div className="p-4 border-b border-[#6b778f]/10 flex items-center justify-between bg-gradient-to-r from-[#1e2840] to-[#1a2035]">
          <h3 className="font-bold text-white">Notifications</h3>
          {count > 0 && <Badge variant="secondary" className="bg-[#ff4d6d]/20 text-[#ff4d6d] border-none">{count} New</Badge>}
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-[#6b778f] text-sm italic">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell size={40} className="mx-auto mb-3 text-[#6b778f] opacity-20" />
              <p className="text-[#6b778f] text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-[#6b778f]/5">
              {notifications.slice(0, 5).map((n: any) => (
                <div key={n.id} className={`p-4 hover:bg-white/5 transition-colors cursor-pointer relative group ${!n.read_at ? 'bg-[#4f8eff]/5' : ''}`} onClick={() => !n.read_at && markRead(n.id)}>
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      n.type === 'webinar' ? 'bg-[#ffd60a]/20 text-[#ffd60a]' : 
                      n.type === 'function' ? 'bg-[#ff9f43]/20 text-[#ff9f43]' : 
                      'bg-[#4f8eff]/20 text-[#4f8eff]'
                    }`}>
                      <Info size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${!n.read_at ? 'text-white' : 'text-[#6b778f]'}`}>{n.title}</p>
                      <p className="text-xs text-[#6b778f] line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-[#6b778f]/50 mt-2 uppercase tracking-tighter">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                    {!n.read_at && <div className="w-2 h-2 rounded-full bg-[#4f8eff] mt-1.5" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-[#6b778f]/10 bg-[#1a2035]/50">
          <Link to={`/${role}/notifications`} className="block w-full text-center py-2 text-xs font-bold text-[#4f8eff] hover:text-white transition-colors">
            View All Notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
