import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function LoadingScreen({ message = "Booting System..." }) {
    return (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl">
            {/* Background elements for depth */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/50 rounded-full blur-[100px]" />
            </div>

            <div className="relative flex flex-col items-center">
                {/* Animated Logo Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ 
                        scale: [0.9, 1.05, 1],
                        opacity: 1
                    }}
                    transition={{ 
                        duration: 1,
                        ease: "easeOut"
                    }}
                    className="relative mb-10"
                >
                    <div className="w-24 h-24 premium-gradient rounded-[2.5rem] shadow-[0_20px_50px_rgba(124,58,237,0.3)] flex items-center justify-center relative z-10">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    
                    {/* Ring animations */}
                    <motion.div 
                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 bg-primary/20 rounded-[2.5rem]"
                    />
                    <motion.div 
                        animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                        transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 bg-primary/20 rounded-[2.5rem]"
                    />
                </motion.div>

                {/* Pulsing Text */}
                <div className="text-center">
                    <motion.h3 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-2 font-['Outfit']"
                    >
                        {message}
                    </motion.h3>
                    <div className="flex gap-1 justify-center">
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                                className="w-1.5 h-1.5 rounded-full bg-primary/40"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
