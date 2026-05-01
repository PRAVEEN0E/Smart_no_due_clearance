import { useState, useEffect } from 'react';
import { Bell, Info, CheckCircle2, AlertTriangle, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!navigator.onLine) return;
        try {
            const res = await api.get('/notifications/');
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
                className="p-2.5 hover:bg-black/5 rounded-xl border border-black/5 transition-all relative group"
            >
                <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white animate-pulse" />
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
                            className="absolute right-0 mt-3 w-80 glass rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
                                <h3 className="font-bold text-slate-800">Notifications</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={markAllRead}
                                        className="text-[10px] text-primary hover:underline transition-all uppercase font-black tracking-widest"
                                    >
                                        Clear All
                                    </button>
                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-black">{unreadCount} New</span>
                                </div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <Bell className="w-6 h-6 opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium">All caught up!</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => markAsRead(n.id)}
                                            className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-primary/[0.02] transition-colors relative group ${!n.isRead ? 'bg-primary/[0.03]' : ''}`}
                                        >
                                            {!n.isRead && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                            )}
                                            <div className="flex gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                                                    n.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100' :
                                                    n.type === 'WARNING' ? 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100' :
                                                    n.type === 'URGENT' ? 'bg-red-50 text-red-600 border-red-100 group-hover:bg-red-100' :
                                                    'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100'
                                                }`}>
                                                    {n.type === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> :
                                                        n.type === 'WARNING' ? <AlertTriangle className="w-5 h-5" /> :
                                                            n.type === 'URGENT' ? <AlertTriangle className="w-5 h-5 animate-pulse" /> :
                                                                <Info className="w-5 h-5" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate pr-4">{n.title}</p>
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                                                    <p className="text-[9px] text-slate-300 mt-2 uppercase tracking-widest font-black">
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
