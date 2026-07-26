import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
    const [offline, setOffline] = useState(!navigator.onLine);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const goOffline = () => { setOffline(true); setShow(true); };
        const goOnline = () => { setOffline(false); setTimeout(() => setShow(false), 3000); };
        window.addEventListener('offline', goOffline);
        window.addEventListener('online', goOnline);
        return () => {
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online', goOnline);
        };
    }, []);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    className={`fixed top-0 left-0 right-0 z-[200] px-4 py-3 flex items-center justify-center gap-3 text-sm font-bold shadow-xl ${offline ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
                >
                    {offline ? (
                        <>
                            <WifiOff className="w-4 h-4" />
                            You are offline — some features may be unavailable
                        </>
                    ) : (
                        <>
                            <Wifi className="w-4 h-4" />
                            Back online
                            <button onClick={() => window.location.reload()}
                                className="ml-2 px-3 py-1 bg-white/20 rounded-lg text-[10px] uppercase tracking-widest hover:bg-white/30 transition-all flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Refresh
                            </button>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
