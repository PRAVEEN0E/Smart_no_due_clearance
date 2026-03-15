import { useState, useEffect } from 'react';
import { Bell, Info, CheckCircle2, AlertTriangle, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            const data = res.data || [];
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/read/${id}`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { /* ignore */ }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) { /* ignore */ }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2.5 hover:bg-white/5 rounded-xl border border-white/10 transition-all relative"
            >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {showDropdown && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-80 glass rounded-3xl border border-white/10 shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-bold">Notifications</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={markAllRead}
                                        className="text-[10px] text-primary hover:text-white transition-colors uppercase font-black tracking-widest"
                                    >
                                        Mark all read
                                    </button>
                                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full">{unreadCount} New</span>
                                </div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                            <Bell className="w-6 h-6 opacity-20" />
                                        </div>
                                        <p className="text-sm">No new notifications</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => markAsRead(n.id)}
                                            className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors relative group ${!n.isRead ? 'bg-primary/5' : ''}`}
                                        >
                                            {!n.isRead && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                            )}
                                            <div className="flex gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${n.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20' :
                                                    n.type === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:bg-amber-500/20' :
                                                        n.type === 'URGENT' ? 'bg-red-500/10 text-red-400 border-red-500/20 group-hover:bg-red-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:bg-blue-500/20'
                                                    }`}>
                                                    {n.type === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> :
                                                        n.type === 'WARNING' ? <AlertTriangle className="w-5 h-5" /> :
                                                            n.type === 'URGENT' ? <AlertTriangle className="w-5 h-5 animate-pulse" /> :
                                                                <Info className="w-5 h-5" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate pr-4">{n.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                                                    <p className="text-[9px] text-muted-foreground/30 mt-2 uppercase tracking-widest font-black">
                                                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
