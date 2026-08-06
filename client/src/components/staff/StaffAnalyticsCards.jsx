import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle2, GraduationCap, AlertTriangle, Clock } from 'lucide-react';

function StaffAnalyticsCards({ avgMarks, approvedCount, evaluations, topScore, rejectedCount, pendingCount }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-border flex items-center gap-4 md:gap-6 shadow-sm">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                    <div className="text-[8px] md:text-[10px] text-primary/60 font-bold uppercase tracking-[0.2em]">Class Avg</div>
                    <div className="text-2xl md:text-4xl font-black tracking-tight text-foreground">{avgMarks.toFixed(1)}</div>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-border flex items-center gap-4 md:gap-6 shadow-sm">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                    <div className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Approved</div>
                    <div className="text-2xl md:text-4xl font-black tracking-tight text-foreground">{approvedCount} <span className="text-sm md:text-lg text-muted-foreground font-medium">/ {evaluations.length}</span></div>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-border flex items-center gap-4 md:gap-6 shadow-sm">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-500">
                    <Clock className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                    <div className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Pending</div>
                    <div className="text-2xl md:text-4xl font-black tracking-tight text-amber-500">{pendingCount}</div>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-border flex items-center gap-4 md:gap-6 shadow-sm">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-500">
                    <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                    <div className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Rejected</div>
                    <div className="text-2xl md:text-4xl font-black tracking-tight text-red-500">{rejectedCount}</div>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-border flex items-center gap-4 md:gap-6 shadow-sm">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                    <div className="text-[8px] md:text-[10px] text-primary/60 font-bold uppercase tracking-[0.2em]">Top Score</div>
                    <div className="text-2xl md:text-4xl font-black tracking-tight text-foreground">{topScore}</div>
                </div>
            </motion.div>
        </div>
    );
}

export default StaffAnalyticsCards;
