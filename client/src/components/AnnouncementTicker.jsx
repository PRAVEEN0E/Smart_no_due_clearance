import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

export default function AnnouncementTicker() {
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await api.get('/auth/announcements');
                setAnnouncements(res.data);
            } catch (err) { /* ignore */ }
        };
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        if (announcements.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % announcements.length);
            }, 6000);
            return () => clearInterval(timer);
        }
    }, [announcements]);

    if (!isVisible || announcements.length === 0) return null;

    const current = announcements[currentIndex];

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-primary/10 border-b border-primary/20 backdrop-blur-md relative overflow-hidden"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${current.priority === 3 ? 'bg-red-500' : current.priority === 2 ? 'bg-orange-500' : 'bg-primary'
                }`} />

            <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                    <Megaphone className={`w-4 h-4 shrink-0 ${current.priority === 3 ? 'text-red-400 animate-pulse' : 'text-primary'
                        }`} />
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex items-center gap-2 whitespace-nowrap"
                        >
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-primary/20 text-primary">
                                {current.type}
                            </span>
                            <span className="text-xs font-medium tracking-wide">
                                <span className="font-bold">{current.title}:</span> {current.content}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-white/5 rounded-full text-muted-foreground transition-all"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
}
