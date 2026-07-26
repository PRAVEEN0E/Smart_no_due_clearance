import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, FileText, Eye, ExternalLink, Sparkles, Clock, CheckCircle2, AlertTriangle, BarChart3, Calendar, Target } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const isImage = (url) => {
    if (!url) return false;
    const decodedUrl = decodeURIComponent(url);
    const path = decodedUrl.split('?')[0].toLowerCase();
    if (path.endsWith('.pdf')) return false;
    return /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(path) || decodedUrl.includes('image/upload');
};

const CAT_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b'];

export default function StaffStudentModal({ activeStudent, previewUrl, onClose, onPreview, evaluations, selectedSubject, getFullUrl = (u) => u }) {
    const [activeTab, setActiveTab] = useState('overview');
    const studentEval = useMemo(() => evaluations.find(e => e.studentId === activeStudent?.id), [evaluations, activeStudent]);
    const assignments = useMemo(() => (activeStudent?.assignments || []).filter(a => a.subjectId === selectedSubject?.subjectId), [activeStudent, selectedSubject]);

    const radarData = useMemo(() => studentEval ? [
        { subject: 'CAT 1', value: studentEval.cat1 || 0 },
        { subject: 'CAT 2', value: studentEval.cat2 || 0 },
        { subject: 'CAT 3', value: studentEval.cat3 || 0 },
        { subject: 'Assign.', value: ((studentEval.assignment1 || 0) + (studentEval.assignment2 || 0) + (studentEval.assignment3 || 0) + (studentEval.assignment4 || 0) + (studentEval.assignment5 || 0)) / 5 * 5 || 0 },
        { subject: 'Attend.', value: (studentEval.attendancePercent / 100) * 50 || 0 },
    ] : [], [studentEval]);

    const barData = useMemo(() => studentEval ? [
        { name: 'CAT 1', value: studentEval.cat1 || 0, max: 50 },
        { name: 'CAT 2', value: studentEval.cat2 || 0, max: 50 },
        { name: 'CAT 3', value: studentEval.cat3 || 0, max: 50 },
        { name: 'A1', value: studentEval.assignment1 || 0, max: 10 },
        { name: 'A2', value: studentEval.assignment2 || 0, max: 10 },
        { name: 'A3', value: studentEval.assignment3 || 0, max: 10 },
        { name: 'A4', value: studentEval.assignment4 || 0, max: 10 },
        { name: 'A5', value: studentEval.assignment5 || 0, max: 10 },
        { name: 'Act1', value: studentEval.activity1 || 0, max: 10 },
        { name: 'Act2', value: studentEval.activity2 || 0, max: 10 },
    ] : [], [studentEval]);

    const status = studentEval?.staffApproved ? 'approved' : studentEval?.staffRejected ? 'rejected' : 'pending';
    const statusIcon = status === 'approved' ? CheckCircle2 : status === 'rejected' ? AlertTriangle : Clock;
    const statusColor = status === 'approved' ? 'text-emerald-500' : status === 'rejected' ? 'text-red-500' : 'text-amber-500';
    const StatusIcon = statusIcon;

    const timeline = useMemo(() => {
        const items = [];
        if (studentEval?.approvedAt) items.push({ label: 'Approved', date: studentEval.approvedAt, icon: CheckCircle2, color: 'text-emerald-500' });
        if (studentEval?.rejectedAt) items.push({ label: 'Rejected', date: studentEval.rejectedAt, icon: AlertTriangle, color: 'text-red-500' });
        if (studentEval?.rejectionReason) items.push({ label: 'Reason', date: null, icon: AlertTriangle, color: 'text-red-400', detail: studentEval.rejectionReason });
        if (assignments.length > 0) {
            assignments.forEach(a => items.push({ label: 'Assignment Submitted', date: a.submittedAt, icon: FileText, color: 'text-blue-500', detail: a.fileUrl?.split('/').pop() }));
        }
        items.sort((a, b) => a.date && b.date ? new Date(b.date) - new Date(a.date) : 0);
        return items;
    }, [studentEval, assignments]);

    // Prepare remedial info
    const remedials = useMemo(() => {
        if (!studentEval) return [];
        const items = [];
        for (let i = 1; i <= 3; i++) {
            const val = studentEval[`remedial${i}`];
            if (val !== null && val !== undefined) {
                items.push({ label: `Remedial ${i}`, value: val, max: 50 });
            }
        }
        return items;
    }, [studentEval]);

    return (
        <AnimatePresence>
            {activeStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => { onClose(null); }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[40px] border border-slate-200 relative z-10 shadow-2xl flex flex-col">
                        {/* Header */}
                        <div className="px-6 md:px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                                    <Users className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl md:text-2xl font-bold text-slate-800">{activeStudent.name}</h2>
                                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${statusColor} bg-current/5`}>
                                            <StatusIcon className="w-3 h-3" /> {status}
                                        </span>
                                    </div>
                                    <p className="text-xs md:text-sm text-slate-500 font-mono">{activeStudent.email}</p>
                                </div>
                            </div>
                            <button onClick={() => onClose(null)} className="p-3 hover:bg-slate-200 rounded-2xl border border-slate-200 transition-all text-slate-500 hover:text-slate-800">
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 px-6 md:px-8 pt-4 border-b border-slate-100">
                            {['overview', 'marks', 'timeline', 'assignments'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2.5 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all capitalize ${
                                        activeTab === tab ? 'bg-slate-50 text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'
                                    }`}>
                                    {tab === 'overview' && <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />}
                                    {tab === 'marks' && <Target className="w-3.5 h-3.5 inline mr-1.5" />}
                                    {tab === 'timeline' && <Calendar className="w-3.5 h-3.5 inline mr-1.5" />}
                                    {tab === 'assignments' && <FileText className="w-3.5 h-3.5 inline mr-1.5" />}
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 overflow-hidden flex flex-col md:flex-row ${previewUrl ? 'md:flex-row' : ''}`}>
                            <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar transition-all duration-500 ${previewUrl ? 'md:w-1/2' : 'w-full'}`}>
                                {activeTab === 'overview' && studentEval && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            <div className="bg-slate-50 p-5 md:p-6 rounded-[2rem] border border-slate-200 flex flex-col justify-center items-center shadow-lg">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Performance Radar</h4>
                                                <div className="h-[180px] md:h-[200px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                                            <PolarGrid stroke="#e2e8f0" />
                                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                                            <Radar name="Performance" dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-5 md:p-8 rounded-[2rem] border border-slate-200 flex flex-col justify-center shadow-lg">
                                                <div className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">Total Internal Marks</div>
                                                <div className="text-4xl md:text-6xl font-black tracking-tighter text-slate-800">
                                                    {studentEval.internalMarksTotal.toFixed(1)}<span className="text-lg md:text-xl text-slate-400 ml-2 font-medium">/ 40</span>
                                                </div>
                                                <div className="mt-4 space-y-2">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-500">Attendance</span>
                                                        <span className={`font-bold ${studentEval.attendancePercent < 75 ? 'text-red-500' : 'text-green-600'}`}>{studentEval.attendancePercent}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${studentEval.attendancePercent < 75 ? 'bg-red-500' : 'bg-green-500'}`}
                                                            style={{ width: `${Math.min(studentEval.attendancePercent, 100)}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {remedials.length > 0 && (
                                            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200">
                                                <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">Remedial Marks</h4>
                                                <div className="flex gap-4">
                                                    {remedials.map((r, i) => (
                                                        <div key={i} className="bg-white px-4 py-3 rounded-xl border border-orange-200">
                                                            <div className="text-[10px] text-orange-500 font-bold">{r.label}</div>
                                                            <div className="text-lg font-black text-orange-600">{r.value}<span className="text-xs text-orange-400">/{r.max}</span></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'marks' && studentEval && (
                                    <div className="space-y-6">
                                        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-lg">
                                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">CAT Assessments <span className="text-slate-400 font-normal">(max 50)</span></h4>
                                            <div className="h-[200px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={barData.slice(0, 3)}>
                                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                                                        <YAxis domain={[0, 50]} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                        <Tooltip />
                                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                            {barData.slice(0, 3).map((entry, idx) => (
                                                                <Cell key={idx} fill={CAT_COLORS[idx]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-lg">
                                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Assignments & Activities</h4>
                                            <div className="h-[200px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={barData.slice(3)}>
                                                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                                                        <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                        <Tooltip />
                                                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'timeline' && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary" /> Activity Timeline
                                        </h4>
                                        {timeline.length === 0 ? (
                                            <div className="text-center text-slate-400 py-8 text-sm">No activities recorded yet.</div>
                                        ) : (
                                            <div className="relative pl-8 border-l-2 border-slate-200 space-y-6">
                                                {timeline.map((item, i) => {
                                                    const Icon = item.icon;
                                                    return (
                                                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                                            className="relative">
                                                            <div className={`absolute -left-10 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center ${item.color}`}>
                                                                <Icon className="w-3 h-3" />
                                                            </div>
                                                            <div className="text-sm font-bold text-slate-700">{item.label}</div>
                                                            {item.date && <div className="text-xs text-slate-400">{new Date(item.date).toLocaleString()}</div>}
                                                            {item.detail && <div className="text-xs text-slate-500 mt-1 italic">{item.detail}</div>}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'assignments' && (
                                    <div className="space-y-4">
                                        {assignments.length === 0 ? (
                                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-40">
                                                <FileText className="w-12 h-12" /><p className="font-medium italic">No assignments submitted yet.</p>
                                            </div>
                                        ) : (
                                            assignments.map((asgn, i) => (
                                                <motion.div key={asgn.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                                    className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col gap-4 md:gap-6 shadow-xl">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-blue-50 rounded-xl text-primary"><FileText className="w-5 h-5 md:w-6 md:h-6" /></div>
                                                            <div>
                                                                <div className="font-bold text-sm md:text-lg text-slate-800 flex items-center gap-2">
                                                                    Assignment Submission
                                                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black uppercase tracking-tighter text-slate-500 border border-slate-200">
                                                                        {(() => { const ext = asgn.fileUrl?.split('.').pop()?.toLowerCase(); return ext && ext.length < 5 ? ext.toUpperCase() : 'FILE'; })()}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[10px] md:text-xs text-slate-500 flex items-center gap-2">
                                                                    {new Date(asgn.submittedAt).toLocaleDateString()} • {asgn.fileUrl?.split('/').pop()?.split('_')[0] || 'View Document'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => onPreview(getFullUrl(asgn.fileUrl))} className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-xs md:text-sm font-bold border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                                                                <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" /> Preview
                                                            </button>
                                                            <a href={getFullUrl(asgn.fileUrl)} target="_blank" rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-primary/10 text-primary rounded-xl text-xs md:text-sm font-bold border border-primary/20 hover:bg-primary/20 transition-all">
                                                                <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                    {asgn.aiFeedback && (
                                                        <div className="p-4 md:p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-3 relative group/ai">
                                                            <div className="flex items-center gap-2 text-primary">
                                                                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">AI Academic Review</span>
                                                            </div>
                                                            <div className="text-xs md:text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">{asgn.aiFeedback}</div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Preview Panel */}
                            {previewUrl && (
                                <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
                                    className="w-full md:w-1/2 border-l border-white/10 bg-black/40 backdrop-blur-md flex flex-col">
                                    <div className="p-3 md:p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Document Preview
                                        </span>
                                        <button onClick={() => onPreview(null)} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"><X className="w-4 h-4" /></button>
                                    </div>
                                    <div className="flex-1 bg-[#1a1a1a] relative overflow-hidden">
                                        {isImage(previewUrl) ? (
                                            <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
                                                <img src={previewUrl} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" alt="Preview" />
                                            </div>
                                        ) : previewUrl?.includes('.pdf') ? (
                                            <iframe src={previewUrl} className="w-full h-full border-none bg-white" title="PDF Preview" />
                                        ) : (
                                            <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`} className="w-full h-full border-none bg-white" title="Document Preview" />
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}