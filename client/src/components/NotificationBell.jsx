import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

export default function NotificationBell() {
    const { token } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [sseConnected, setSseConnected] = useState(false);
    const eventSourceRef = useRef(null);
    const pollingRef = useRef(null);

    const iconForType = (type) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle2 className="w-5 h-5" />;
            case 'WARNING': return <AlertTriangle className="w-5 h-5" />;
            case 'URGENT': return <AlertTriangle className="w-5 h-5 animate-pulse" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const colorForType = (type) => {
        switch (type) {
            case 'SUCCESS': return { bg: 'bg-success/10 text-success border-success/20 hover:bg-success/20' };
            case 'WARNING': return { bg: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20' };
            case 'URGENT': return { bg: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20' };
            default: return { bg: 'bg-info/10 text-info border-info/20 hover:bg-info/20' };
        }
    };

    const fetchNotifications = useCallback(async () => {
        if (!navigator.onLine) return;
        try {
            const res = await api.get('/notifications/');
            const data = res.data || [];
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch { /* ignore */ }
    }, []);

    const setupSSE = useCallback(() => {
        if (!token || !navigator.onLine) return;
        const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
        const url = `${baseUrl.replace(/\/api$/, '')}/api/notifications/stream?token=${encodeURIComponent(token)}`;
        try {
            const es = new EventSource(url);
            es.onopen = () => setSseConnected(true);
            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'CONNECTED') {
                        setSseConnected(true);
                        fetchNotifications();
                    } else if (data.type === 'NEW_NOTIFICATION') {
                        setNotifications(prev => [data.notification, ...prev].slice(0, 50));
                        setUnreadCount(prev => prev + 1);
                        toast.custom((t) => (
                            <div onClick={() => toast.dismiss(t.id)}
                                className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex items-start gap-3 cursor-pointer max-w-sm">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorForType(data.notification.type).bg}`}>
                                    {iconForType(data.notification.type)}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-800">{data.notification.title}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{data.notification.message}</div>
                                </div>
                            </div>
                        ), { duration: 5000 });
                    }
                } catch { /* ignore */ }
            };
            es.onerror = () => {
                setSseConnected(false);
                es.close();
            };
            eventSourceRef.current = es;
        } catch { setSseConnected(false); }
    }, [token, fetchNotifications]);

    useEffect(() => {
        fetchNotifications();
        setupSSE();
        const pollInterval = setInterval(() => {
            if (!sseConnected) fetchNotifications();
        }, 15000);
        pollingRef.current = pollInterval;
        return () => {
            clearInterval(pollInterval);
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, [fetchNotifications, setupSSE, sseConnected]);

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/read/${id}`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* ignore */ }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
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
                {sseConnected && (
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
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
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    Notifications
                                    {sseConnected && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Live" />}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button onClick={markAllRead}
                                        className="text-[10px] text-primary hover:underline transition-all uppercase font-black tracking-widest">Clear All</button>
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
                                        <div key={n.id} onClick={() => markAsRead(n.id)}
                                            className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-primary/[0.02] transition-colors relative group ${!n.isRead ? 'bg-primary/[0.03]' : ''}`}>
                                            {!n.isRead && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
                                            <div className="flex gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${colorForType(n.type).bg}`}>
                                                    {iconForType(n.type)}
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