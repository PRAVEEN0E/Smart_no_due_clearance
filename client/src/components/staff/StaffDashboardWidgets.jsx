import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CheckCircle2, Users, GraduationCap, Brain, AlertCircle, Flame } from 'lucide-react';

export default function StaffDashboardWidgets({ analytics, evaluations }) {
    const { atRiskStudents = [], totalStudents = 0, passPercentage = 0, pendingCount = 0, approvedCount = 0, rejectedCount = 0 } = analytics;

    const atRiskFromMarks = evaluations.filter(e => !e.staffApproved && !e.staffRejected && e.internalMarksTotal < 15);
    const lowAttendance = evaluations.filter(e => !e.staffApproved && !e.staffRejected && e.attendancePercent < 75);

    const widgets = [
        {
            title: 'Pending Approvals',
            value: pendingCount,
            icon: Clock,
            color: 'bg-amber-100 text-amber-500',
            desc: 'Awaiting your review'
        },
        {
            title: 'Approved Today',
            value: approvedCount,
            icon: CheckCircle2,
            color: 'bg-emerald-100 text-emerald-500',
            desc: 'Finalized records'
        },
        {
            title: 'Rejected',
            value: rejectedCount,
            icon: AlertTriangle,
            color: 'bg-red-100 text-red-500',
            desc: 'Returned for revision'
        },
        {
            title: 'Total Students',
            value: totalStudents,
            icon: Users,
            color: 'bg-blue-100 text-blue-500',
            desc: 'Across all subjects'
        },
        {
            title: 'Pass %',
            value: `${passPercentage}%`,
            icon: GraduationCap,
            color: 'bg-purple-100 text-purple-500',
            desc: 'Scored ≥ 50%'
        },
        {
            title: 'At Risk (Marks)',
            value: atRiskFromMarks.length,
            icon: AlertCircle,
            color: 'bg-orange-100 text-orange-500',
            desc: 'Internal marks < 15'
        },
    ];

    return (
        <div className="space-y-6">
            {/* KPI Widget Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {widgets.map((w, i) => (
                    <motion.div key={w.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="glass p-4 md:p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
                        <div className={`w-10 h-10 rounded-xl ${w.color} flex items-center justify-center`}>
                            <w.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-foreground">{w.value}</div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{w.title}</div>
                            <div className="text-[8px] text-muted-foreground/60 mt-0.5">{w.desc}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* At-Risk Students Widget */}
            {atRiskStudents.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl border border-orange-500/20 p-5 md:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">At-Risk Students</h4>
                            <p className="text-xs text-muted-foreground">Students needing attention — low marks or attendance</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {atRiskStudents.slice(0, 5).map((s, i) => (
                            <div key={s.id || i} className="flex items-center justify-between py-2 px-3 bg-orange-500/5 rounded-xl border border-orange-500/10">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                                    <div>
                                        <div className="text-sm font-bold text-foreground">{s.student?.name || 'Unknown'}</div>
                                        <div className="text-[10px] text-muted-foreground">{s.subject}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-black ${s.internalMarksTotal < 15 ? 'text-red-500' : 'text-orange-500'}`}>{s.internalMarksTotal?.toFixed(1)}</div>
                                    <div className={`text-[10px] font-bold ${s.attendancePercent < 75 ? 'text-red-400' : 'text-orange-400'}`}>{s.attendancePercent}% att.</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Low Attendance Alert */}
            {lowAttendance.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl border border-red-500/20 p-5 md:p-6 bg-red-500/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">Low Attendance Alert</h4>
                            <p className="text-xs text-muted-foreground">{lowAttendance.length} student(s) have attendance below 75%</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}