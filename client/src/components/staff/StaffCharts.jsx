import { motion } from 'framer-motion';
import { TrendingUp, LineChart as LineChartIcon, Trophy, BarChart3, PieChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart as RePieChart, Pie, Sector } from 'recharts';

const DIST_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
const ATTEND_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

function renderActiveShape(props) {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
        <g>
            <text x={cx} y={cy - 10} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight="bold">{payload.name}</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="#333" fontSize={18} fontWeight="black">{value}</text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        </g>
    );
}

export default function StaffCharts({ analytics, selectedSubject, evaluations }) {
    const top5 = [...evaluations].sort((a, b) => b.internalMarksTotal - a.internalMarksTotal).slice(0, 5);
    const { distribution = [], attendanceDistribution = [] } = analytics;

    return (
        <div className="space-y-6">
            {/* Row 1: Class Performance Trend + Top Achievers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className="lg:col-span-2 glass rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp className="w-32 h-32" /></div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold">Class Performance Trend</h3>
                                <p className="text-xs md:text-sm text-muted-foreground mt-1">Average scores across internal assessments</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><LineChartIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" /></div>
                        </div>
                        <div className="flex-1 min-h-[250px] md:min-h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.trends}>
                                    <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient></defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }} domain={[0, 50]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '16px' }} itemStyle={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }} />
                                    <Area type="monotone" dataKey="avg" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#lg)" dot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                    className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg md:text-xl font-bold">Top Achievers</h3>
                            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Leading {selectedSubject?.subject.name}</p>
                        </div>
                        <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20"><Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" /></div>
                    </div>
                    <div className="flex-1 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar pr-2">
                        {top5.map((ev, i) => (
                            <div key={ev.id} className="group/item">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover/item:bg-primary/20 group-hover/item:text-primary transition-all">0{i + 1}</div>
                                        <div>
                                            <div className="text-xs md:text-sm font-bold truncate max-w-[100px] md:max-w-[120px] text-foreground">{ev.student.name}</div>
                                            <div className="text-[8px] md:text-[9px] text-muted-foreground font-mono">{ev.student?.email?.split('@')[0] || 'student'}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs md:text-sm font-black text-primary">{ev.internalMarksTotal.toFixed(1)}</div>
                                        <div className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Marks</div>
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(ev.internalMarksTotal / 40) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }} className="h-full premium-gradient rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Row 2: Distribution Charts */}
            {distribution.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg md:text-xl font-bold">Marks Distribution</h3>
                                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Internal marks spread</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><BarChart3 className="w-5 h-5 text-primary" /></div>
                        </div>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={distribution} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} width={120} />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                                        {distribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {attendanceDistribution.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                            className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg md:text-xl font-bold">Attendance Distribution</h3>
                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Student attendance spread</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><PieChart className="w-5 h-5 text-primary" /></div>
                            </div>
                            <div className="h-[250px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie data={attendanceDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                                            dataKey="count" activeShape={renderActiveShape} activeIndex={0}>
                                            {attendanceDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}