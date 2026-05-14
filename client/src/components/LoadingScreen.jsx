import { motion } from 'framer-motion';

export default function LoadingScreen({ message = "Booting System..." }) {
    return (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#fcfcfc]">
            {/* Animated Logo Placeholder */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                    scale: [0.8, 1.1, 1],
                    opacity: 1,
                    rotate: [0, 0, 10, -10, 0]
                }}
                transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
                className="w-20 h-20 bg-gradient-to-br from-primary to-purple-400 rounded-3xl shadow-2xl shadow-primary/20 mb-8"
            />

            {/* Pulsing Text */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex flex-col items-center gap-2"
            >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">
                    Smart No Due
                </span>
                <span className="text-sm font-bold text-slate-800">
                    {message}
                </span>
            </motion.div>

            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
}
