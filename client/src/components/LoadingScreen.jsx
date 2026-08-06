import { Shield } from 'lucide-react';

export default function LoadingScreen({ message = "Booting System..." }) {
    return (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl" role="status" aria-label="Loading">
            {/* Background elements for depth */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/50 rounded-full blur-[100px]" />
            </div>

            <div className="relative flex flex-col items-center">
                {/* Animated Logo Container */}
                <div className="relative mb-10 animate-[loading-pop_1s_ease-out]">
                    <div className="w-24 h-24 premium-gradient rounded-[2.5rem] shadow-[0_20px_50px_rgba(124,58,237,0.3)] flex items-center justify-center relative z-10">
                        <Shield className="w-10 h-10 text-white" />
                    </div>

                    {/* Ring animations */}
                    <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] animate-[loading-ring_2s_ease-out_infinite]" />
                    <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] animate-[loading-ring_2s_ease-out_infinite] [animation-delay:0.5s]" />
                </div>

                {/* Pulsing Text */}
                <div className="text-center">
                    <h3 className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-2 font-['Outfit'] animate-[loading-pulse_2s_ease-in-out_infinite]">
                        {message}
                    </h3>
                    <div className="flex gap-1 justify-center">
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-[loading-bounce_0.6s_ease-in-out_infinite]"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
