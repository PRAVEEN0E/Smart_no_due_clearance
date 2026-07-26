import { motion } from 'framer-motion';
import { GraduationCap, Users, BookOpen, CheckCircle2, TicketCheck, TicketX, Receipt, AlertTriangle } from 'lucide-react';

const STATS = [
    { key: 'studentCount', label: 'Total Students', icon: GraduationCap, color: 'text-primary', bg: 'bg-primary/10' },
    { key: 'staffCount', label: 'Staff Members', icon: Users, color: 'text-muted-foreground', bg: 'bg-muted' },
    { key: 'subjectCount', label: 'Total Subjects', icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
    { key: 'totalApprovals', label: 'Total Approvals', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { key: 'hallTicketsReady', label: 'Hall Tickets Ready', icon: TicketCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { key: 'hallTicketsBlocked', label: 'Hall Tickets Blocked', icon: TicketX, color: 'text-red-500', bg: 'bg-red-50' },
    { key: 'feesPending', label: 'Fees Pending', icon: Receipt, color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'pendingClearance', label: 'Pending Clearance', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
];

export default function MentorStatsGrid({ stats = {} }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 md:gap-4">
            {STATS.map((stat, i) => (
                <motion.div
                    key={stat.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass p-3 md:p-4 rounded-2xl border border-border relative overflow-hidden group hover:border-primary/30 transition-all cursor-default shadow-sm"
                >
                    <div className={`absolute -right-4 -top-4 w-16 h-16 ${stat.bg} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-all duration-500`} />
                    <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color} mb-2 relative z-10`} />
                    <p className="text-[8px] md:text-[9px] text-primary/60 uppercase tracking-[0.15em] font-bold relative z-10 truncate">{stat.label}</p>
                    <h2 className="text-lg md:text-xl font-black mt-0.5 tabular-nums relative z-10 tracking-tight text-foreground">{stats[stat.key] ?? 0}</h2>
                </motion.div>
            ))}
        </div>
    );
}
