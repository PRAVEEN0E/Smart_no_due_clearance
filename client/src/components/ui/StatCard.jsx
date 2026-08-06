import { memo } from 'react';
import { motion } from 'framer-motion';

function StatCard({ icon: Icon, label, value, color = 'indigo', onClick }) {
    const colorMap = {
        indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-200/50 text-indigo-600',
        emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 text-emerald-600',
        amber: 'from-amber-500/10 to-amber-600/5 border-amber-200/50 text-amber-600',
        violet: 'from-violet-500/10 to-violet-600/5 border-violet-200/50 text-violet-600',
        rose: 'from-rose-500/10 to-rose-600/5 border-rose-200/50 text-rose-600',
        sky: 'from-sky-500/10 to-sky-600/5 border-sky-200/50 text-sky-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorMap[color] || colorMap.indigo} p-4 md:p-6 backdrop-blur-sm ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
        >
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                    <p className="text-xs md:text-sm font-medium opacity-70">{label}</p>
                    <p className="text-xl md:text-3xl font-black tracking-tight">{value ?? '—'}</p>
                </div>
            </div>
        </motion.div>
    );
}

export default StatCard;
