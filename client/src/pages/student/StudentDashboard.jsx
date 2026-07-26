import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, CheckCircle2, XCircle, Download, AlertCircle, ArrowRight, Sparkles,
    UploadCloud, Layout, X, AlertTriangle, Info, RefreshCw, CreditCard, ShieldCheck, BookOpen,
    User, Calendar, ClipboardList, GraduationCap, Clock, Trash2, ExternalLink, ChevronRight,
    Mail, Hash, Phone, MapPin, Camera, Search, Filter, ArrowUpDown, Eye, ThumbsDown, MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { SkeletonStats, SkeletonTable } from '../../components/Skeletons';
import EmptyState from '../../components/EmptyState';
import CourseMaterials from '../../components/CourseMaterials';
import AIChatBubble from '../../components/AIChatBubble';
import StudentProfile from './StudentProfile';
import StudentQueries from './StudentQueries';
import useStudentData from '../../hooks/useStudentData';
import toast from 'react-hot-toast';

const TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: Layout },
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'assignments', label: 'Assignments', icon: ClipboardList },
    { key: 'hallticket', label: 'Hall Ticket', icon: FileText },
    { key: 'exams', label: 'Exam Schedule', icon: Calendar },
    { key: 'queries', label: 'Queries', icon: MessageSquare },
];

export default function StudentDashboard() {
    const d = useStudentData();
    const [activeTab, setActiveTab] = useState('dashboard');

    const tabContent = useMemo(() => {
        switch (activeTab) {
            case 'profile': return <StudentProfile data={d.data} onUpdateProfile={d.handleUpdateProfile} onUploadSignature={d.handleUploadSignature} profileSaving={d.profileSaving} />;
            case 'assignments': return <AssignmentsView d={d} />;
            case 'hallticket': return <HallTicketView d={d} />;
            case 'exams': return <ExamsView d={d} />;
            case 'queries': return <StudentQueries />;
            default: return <DashboardView d={d} />;
        }
    }, [activeTab, d.data, d.handleUpdateProfile, d.handleUploadSignature, d.profileSaving, d.hallTicketStatus, d.assignments, d.examSchedule]);

    if (d.loading) return (
        <div className="space-y-8 p-4 max-w-6xl mx-auto">
            <SkeletonStats count={3} />
            <SkeletonTable rows={4} cols={4} />
        </div>
    );

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            {/* Tab Navigation */}
            <div role="tablist" aria-label="Student portal sections" className="flex items-center gap-1 sm:gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {TABS.map(tab => (
                    <button key={tab.key} role="tab" aria-selected={activeTab === tab.key} aria-controls={`panel-${tab.key}`}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${activeTab === tab.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                        <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                        <span className="hidden xs:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} role="tabpanel" id={`panel-${activeTab}`} aria-label={`${activeTab} section`}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {tabContent}
                </motion.div>
            </AnimatePresence>

            <TicketModal d={d} />
            <StudyPlanModal d={d} />
            <AIChatBubble />
        </div>
    );
}

/* ── Dashboard View (existing content) ── */
function DashboardView({ d }) {
    return (
        <div className="space-y-8">
            <HeaderSection d={d} />
            {d.canDownloadTicket && d.data.hallTicket?.qrCodeData && <HallTicketQR d={d} />}
            <PerformanceSection d={d} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <ClearanceTracker d={d} />
                    <AssignmentHub d={d} />
                </div>
                <div className="space-y-6">
                    <FeeTracking d={d} />
                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <CourseMaterials subjectId={d.subjects[0]?.subjectId} role="STUDENT" />
                    </div>
                    <AcademicInsights d={d} />
                </div>
            </div>
        </div>
    );
}

function HeaderSection({ d }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Academic Portal</h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 flex items-center gap-2"><Layout className="w-3.5 h-3.5" /> Keep track of your semester clearance.</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {d.data.user?.collegeName && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                            <span className="text-[10px] font-black uppercase tracking-widest">{d.data.user.collegeName}</span>
                        </motion.div>
                    )}
                    {d.data.user?.className && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                            <span className="text-[10px] font-black uppercase tracking-widest">{d.data.user.className}</span>
                        </motion.div>
                    )}
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                {!d.isFeeCleared && d.data.feeRecord?.feeBalance > 0 && (
                    <motion.button aria-label="Pay outstanding fees" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={d.handlePayFees}
                        disabled={d.paymentProcessing}
                        className="px-5 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl font-bold flex items-center justify-center gap-3 transition-all bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 disabled:opacity-50 text-sm md:text-base">
                        <CreditCard className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />{d.paymentProcessing ? 'Processing...' : `Pay Dues (₹${d.data.feeRecord.feeBalance})`}
                    </motion.button>
                )}
                <motion.button aria-label={d.canDownloadTicket ? 'Download hall ticket' : 'Hall ticket locked'} whileHover={d.canDownloadTicket ? { scale: 1.05 } : {}} whileTap={d.canDownloadTicket ? { scale: 0.95 } : {}}
                    disabled={!d.canDownloadTicket} onClick={d.handleDownloadTicket}
                    className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl font-bold flex items-center justify-center gap-3 transition-all text-sm md:text-base ${d.canDownloadTicket ? 'premium-gradient text-white shadow-xl shadow-primary/20' : 'bg-white/5 border border-slate-200 text-slate-500 cursor-not-allowed'}`}>
                    <Download className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />{d.canDownloadTicket ? 'Download Hall Ticket' : 'Hall Ticket Locked'}
                    {!d.canDownloadTicket && <AlertCircle className="w-3.5 h-3.5 ml-1 md:ml-2 opacity-40" aria-hidden="true" />}
                </motion.button>
            </div>
        </div>
    );
}

function HallTicketQR({ d }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass p-6 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-2xl shadow-xl shadow-emerald-500/10">
                <img src={d.data.hallTicket.qrCodeData} alt="QR" className="w-32 h-32" />
            </div>
            <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">SECURE HALL TICKET UNLOCKED</span>
                </div>
                <h4 className="text-xl font-bold text-slate-800">Your digital hall ticket is active.</h4>
                <p className="text-slate-500 text-sm mt-1 max-w-lg">The QR code above contains your encrypted verification data.</p>
            </div>
        </motion.div>
    );
}

function PerformanceSection({ d }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            <div className="lg:col-span-2 glass p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/10 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4 md:mb-8">
                    <div><h3 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 md:gap-3"><Sparkles className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />Performance Overview</h3></div>
                </div>
                <div className="h-[180px] sm:h-[220px] md:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={d.data.evaluations.map(e => ({
                            name: e.subject.code,
                            CAT1: (e.remedial1 !== undefined && e.remedial1 !== null) ? e.remedial1 : (e.cat1 || 0),
                            CAT2: (e.remedial2 !== undefined && e.remedial2 !== null) ? e.remedial2 : (e.cat2 || 0),
                            CAT3: (e.remedial3 !== undefined && e.remedial3 !== null) ? e.remedial3 : (e.cat3 || 0)
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: 700 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }} domain={[0, 50]} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '16px' }} itemStyle={{ fontWeight: 'bold' }} />
                            <Bar dataKey="CAT1" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="CAT2" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
                            <Bar dataKey="CAT3" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="glass p-6 md:p-8 rounded-2xl md:rounded-3xl border border-border flex flex-col justify-center items-center text-center shadow-sm">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 md:mb-6">
                    <CheckCircle2 className="w-6 h-6 md:w-10 md:h-10 text-primary" />
                </div>
                <h3 className="text-base md:text-xl font-bold">Clearance Progress</h3>
                <div className="mt-2 md:mt-4 text-3xl md:text-5xl font-black text-foreground">{d.data.evaluations.filter(e => e.staffApproved).length}/{d.data.evaluations.length}</div>
                <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-bold">Subjects Cleared</p>
                {d.data.evaluations.filter(e => e.staffRejected).length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest">
                        <ThumbsDown className="w-3 h-3" /> {d.data.evaluations.filter(e => e.staffRejected).length} Rejected
                    </div>
                )}
                <div className="w-full h-2 bg-slate-200 rounded-full mt-6 overflow-hidden flex">
                    <div className="h-full bg-primary transition-all duration-1000"
                        style={{ width: `${d.data.evaluations.length > 0 ? (d.data.evaluations.filter(e => e.staffApproved).length / d.data.evaluations.length) * 100 : 0}%` }} />
                    {d.data.evaluations.filter(e => e.staffRejected).length > 0 && (
                        <div className="h-full bg-red-400 transition-all duration-1000"
                            style={{ width: `${(d.data.evaluations.filter(e => e.staffRejected).length / d.data.evaluations.length) * 100}%` }} />
                    )}
                </div>
            </div>
        </div>
    );
}

function ClearanceTracker({ d }) {
    return (
        <div className="glass rounded-3xl border border-slate-200/50 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-white/50">
                <h3 className="font-bold flex items-center gap-2 text-slate-800"><CheckCircle2 className="w-5 h-5 text-emerald-500" />Subject Clearance Status</h3>
            </div>
            <div className="p-2">
                <div className="divide-y divide-slate-100">
                    {d.data.evaluations.length === 0 ? (
                        <EmptyState icon="subjects" title="No evaluations found" description="You have not been assigned to any subjects yet." />
                    ) : d.data.evaluations.map((ev, i) => (
                        <EvaluationRow key={i} ev={ev} d={d} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function EvaluationRow({ ev, d }) {
    const [showRejection, setShowRejection] = useState(false);
    let prediction = null;
    try { prediction = ev.aiPrediction ? JSON.parse(ev.aiPrediction) : null; } catch { prediction = null; }

    const isRejected = ev.staffRejected === true;
    const isApproved = ev.staffApproved === true;
    const isPending = !isApproved && !isRejected;

    const statusColor = isApproved ? 'bg-primary/10 text-primary border border-primary/20'
        : isRejected ? 'bg-red-500/10 text-red-600 border border-red-200'
            : 'bg-orange-500/10 text-orange-600 border border-orange-200';

    const borderColor = isApproved ? 'border-l-primary/40'
        : isRejected ? 'border-l-red-400'
            : 'border-l-orange-300';

    return (
        <div className={`flex flex-col p-4 hover:bg-primary/[0.03] transition-all rounded-2xl group border-l-4 border-transparent hover:${isRejected ? 'border-l-red-400' : 'border-l-primary/40'}`}
            style={{ borderLeftColor: isRejected ? '#f87171' : isApproved ? 'var(--primary)' : '#fcd34d' }}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-[10px] font-black ${statusColor}`}>
                        {ev.subject.code}
                    </div>
                    <div>
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{ev.subject.name}</div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
                            <span>Attendance: <span className={ev.attendancePercent < 75 ? 'text-red-500' : 'text-primary'}>{ev.attendancePercent}%</span></span>
                            <span>Internal: <span className="text-foreground">{ev.internalMarksTotal?.toFixed(1) || '0.0'}/40</span></span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isApproved ? (
                        <div className="text-[10px] bg-primary/10 text-primary py-1 px-2.5 rounded-lg border border-primary/20 font-black uppercase">Cleared</div>
                    ) : isRejected ? (
                        <div className="text-[10px] bg-red-500/10 text-red-600 py-1 px-2.5 rounded-lg border border-red-200 font-black uppercase">Rejected</div>
                    ) : (
                        <div className="text-[10px] bg-orange-500/10 text-orange-600 py-1 px-2.5 rounded-lg border border-orange-200 font-black uppercase animate-pulse">In Review</div>
                    )}
                </div>
            </div>

            {isRejected && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 ml-14 p-3 bg-red-500/5 rounded-xl border border-red-200">
                    <div className="flex items-start gap-2">
                        <ThumbsDown className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                        <div>
                            <div className="flex items-center gap-2 text-[9px] text-red-600 font-black uppercase tracking-widest">
                                <MessageSquare className="w-3 h-3" /> Staff Remark
                                {ev.rejectedAt && (
                                    <span className="font-normal lowercase opacity-60">
                                        {new Date(ev.rejectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-red-700 mt-1 leading-relaxed">{ev.rejectionReason || 'No reason provided.'}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {prediction ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 ml-14 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-[9px] text-primary font-black uppercase tracking-widest"><Sparkles className="w-3 h-3" /> AI Insight</div>
                        <button onClick={() => d.handleGeneratePrediction(ev.subjectId)} className="p-1 hover:bg-primary/20 rounded-md text-primary/40 hover:text-primary transition-all" title="Regenerate"><RefreshCw className="w-3 h-3" /></button>
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">"Predicted Grade: <span className="text-slate-800 font-bold">{prediction.predictedFinalGrade}</span>. {prediction.recommendation}"</p>
                </motion.div>
            ) : !isRejected && (
                <div className="mt-3 ml-14">
                    <button onClick={() => d.handleGeneratePrediction(ev.subjectId)}
                        className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white flex items-center gap-2 border border-primary/20 px-3 py-1 rounded-lg hover:bg-primary transition-all">
                        <Sparkles className="w-3 h-3" /> Generate Success Prediction
                    </button>
                </div>
            )}
            {!isRejected && (
                <div className="mt-3 ml-14 flex items-center gap-2">
                    <button onClick={() => d.handleGenerateStudyPlan(ev.subjectId, ev.subject.name)} disabled={d.generatingPlanId === ev.subjectId}
                        className="text-[9px] font-black uppercase tracking-widest text-violet-600 hover:text-white flex items-center gap-2 border border-violet-600/20 px-3 py-1.5 rounded-lg hover:bg-violet-600 transition-all disabled:opacity-50">
                        {d.generatingPlanId === ev.subjectId ? <RefreshCw className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
                        {d.generatingPlanId === ev.subjectId ? 'Generating Plan...' : 'Remedial Study Plan'}
                    </button>
                </div>
            )}
        </div>
    );
}

function AssignmentHub({ d }) {
    return (
        <div className="glass p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/10 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-[100px] pointer-events-none" />
            <div className="flex items-start justify-between">
                <div><h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 md:mb-2">Quick Upload</h3><p className="text-muted-foreground text-xs sm:text-sm max-w-md">Tap a subject to upload your assignment.</p></div>
                {d.uploading ? (
                    <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary animate-spin shrink-0" />
                ) : (
                    <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-slate-200 group-hover:text-primary transition-colors shrink-0" />
                )}
            </div>

            {/* Upload progress bar */}
            {d.uploading && (
                <div className="mt-4 space-y-2" role="progressbar" aria-valuenow={d.uploadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Assignment upload progress">
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${d.uploadProgress}%` }}
                            transition={{ duration: 0.3 }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-primary font-bold flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" aria-hidden="true" /> Uploading...
                        </span>
                        <span className="text-muted-foreground font-mono">{d.uploadProgress}%</span>
                    </div>
                </div>
            )}

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 ${d.uploading ? 'mt-4 opacity-50 pointer-events-none' : 'mt-4 md:mt-8'}`}>
                {d.subjects.map((ss, i) => (
                    <label key={i} className={`p-3 sm:p-4 md:p-6 bg-white/[0.03] border border-white/10 rounded-xl md:rounded-2xl cursor-pointer hover:border-primary/50 transition-all flex flex-col gap-1 md:gap-2 ${d.uploading ? 'cursor-not-allowed' : ''}`}>
                        <div className="flex justify-between items-center"><span className="text-[10px] md:text-xs uppercase font-bold tracking-widest text-primary">{ss.subject.code}</span><Sparkles className="w-3 h-3 md:w-4 md:h-4 text-blue-400" /></div>
                        <span className="font-semibold text-sm md:text-base line-clamp-1">{ss.subject.name}</span>
                        <p className="text-[8px] md:text-[10px] text-muted-foreground mt-1 md:mt-2">{d.uploading ? 'Upload in progress...' : 'TAP TO UPLOAD'}</p>
                        <input type="file" className="hidden" onChange={(e) => d.handleAssignmentUpload(ss.subjectId, e)} disabled={d.uploading} />
                    </label>
                ))}
            </div>
        </div>
    );
}

function FeeTracking({ d }) {
    return (
        <div className="glass p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex flex-col gap-3 md:gap-4">
            <h3 className="font-bold text-sm md:text-base">Fee Tracking</h3>
            <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl border ${d.isFeeCleared ? 'bg-green-400/5 border-green-400/10' : 'bg-red-400/5 border-red-400/10'}`}>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs md:text-sm text-muted-foreground">Outstanding Balance</span>
                    {d.isFeeCleared ? <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" /> : <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />}
                </div>
                <div className="text-xl md:text-3xl font-bold tracking-tighter">₹{d.data.feeRecord?.feeBalance || 0}</div>
                <p className="text-xs mt-4 opacity-60">{d.isFeeCleared ? 'All dues are cleared.' : 'Please clear your dues to unlock hall ticket.'}</p>
            </div>
        </div>
    );
}

function AcademicInsights({ d }) {
    return (
        <div className="glass p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex flex-col gap-3 md:gap-5">
            <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-1 md:gap-2 text-sm md:text-base"><Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />Academic Insights</h3>
                <div className="px-1.5 md:px-2 py-0.5 rounded-md bg-blue-500/10 text-[8px] md:text-[9px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/10">AI Powered</div>
            </div>
            <div className="space-y-2 md:space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                {d.data.suggestions?.map((sug, i) => {
                    const isCritical = sug.type === 'critical', isWarning = sug.type === 'warning', isSuccess = sug.type === 'success';
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className={`p-4 rounded-[1.25rem] border transition-all hover:scale-[1.02] ${isCritical ? 'bg-red-50 border-red-200 text-red-700' : isWarning ? 'bg-amber-50 border-amber-200 text-amber-700' : isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 p-1.5 rounded-lg ${isCritical ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {isCritical ? <AlertTriangle className="w-3.5 h-3.5" /> : isWarning ? <AlertCircle className="w-3.5 h-3.5" /> : isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{sug.subject}</div>
                                    <div className="text-xs leading-relaxed font-medium">{sug.message}</div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

/* ── Assignments View ── */
function AssignmentsView({ d }) {
    const [sortField, setSortField] = useState('createdAt');
    const [sortDir, setSortDir] = useState('desc');
    const [filterStatus, setFilterStatus] = useState('all');
    const [replacingId, setReplacingId] = useState(null);

    const filtered = useMemo(() => {
        let list = [...(d.assignments || [])];
        if (filterStatus === 'submitted') list = list.filter(a => a.status === 'SUBMITTED');
        else if (filterStatus === 'reviewed') list = list.filter(a => a.status === 'REVIEWED');
        else if (filterStatus === 'pending') list = list.filter(a => a.status === 'PENDING');
        list.sort((a, b) => {
            const aVal = sortField === 'createdAt' ? new Date(a.createdAt) : a[sortField] || '';
            const bVal = sortField === 'createdAt' ? new Date(b.createdAt) : b[sortField] || '';
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [d.assignments, filterStatus, sortField, sortDir]);

    const handleReplaceClick = (id) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.zip,.png,.jpg,.jpeg';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) { setReplacingId(id); await d.handleReplaceAssignment(id, file); setReplacingId(null); }
        };
        input.click();
    };

    const toggleSort = (field) => {
        if (sortField === field) setSortDir(p => p === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">My Assignments</h2>
                    <p className="text-sm text-muted-foreground">View, replace, or delete your submitted assignments</p>
                </div>
                <div className="flex items-center gap-2">
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary">
                        <option value="all">All Status</option>
                        <option value="submitted">Submitted</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>

            {d.assignments.length === 0 && !d.loading && (
                <div className="text-center py-16"><EmptyState icon="files" title="No assignments yet" description="Upload your first assignment from the Dashboard tab." /></div>
            )}

            <div className="glass rounded-3xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <th className="p-4 text-left">Subject</th>
                                <th className="p-4 text-left cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                                    <span className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></span>
                                </th>
                                <th className="p-4 text-left">Status</th>
                                <th className="p-4 text-left">AI Feedback</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.map((a) => (
                                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-sm">{a.subject?.name || 'Unknown'}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono">{a.subject?.code}</div>
                                    </td>
                                    <td className="p-4 text-xs text-muted-foreground">
                                        {new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${a.status === 'REVIEWED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : a.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                                            {a.status || 'SUBMITTED'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {a.aiFeedback ? (
                                            <div className="group relative">
                                                <span className="text-xs text-emerald-600 font-bold cursor-help border-b border-dashed border-emerald-300">View</span>
                                                <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                                    {a.aiFeedback}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Pending</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {a.fileUrl && (
                                                <a href={d.getFileUrl(a.fileUrl)} target="_blank" rel="noopener noreferrer" aria-label="View assignment file"
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                                                </a>
                                            )}
                                            <button onClick={() => handleReplaceClick(a.id)} disabled={replacingId === a.id} aria-label="Replace assignment file"
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                                                <RefreshCw className={`w-4 h-4 text-muted-foreground ${replacingId === a.id ? 'animate-spin' : ''}`} aria-hidden="true" />
                                            </button>
                                            <button onClick={() => d.handleDeleteAssignment(a.id)} aria-label="Delete assignment"
                                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none">
                                                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {d.assignments.length > 0 && (
                <p className="text-[10px] text-muted-foreground text-center">{d.assignments.length} assignment{d.assignments.length !== 1 ? 's' : ''}</p>
            )}
        </div>
    );
}

/* ── Hall Ticket View ── */
function HallTicketView({ d }) {
    const [status, setStatus] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(true);

    const fetchStatus = useCallback(async () => {
        setLoadingStatus(true);
        try {
            const res = await d.fetchHallTicketStatus();
            setStatus(res);
        } catch { } finally { setLoadingStatus(false); }
    }, [d.fetchHallTicketStatus]);

    useEffect(() => {
        if (d.hallTicketStatus) {
            setStatus(d.hallTicketStatus);
            setLoadingStatus(false);
        } else {
            fetchStatus();
        }
    }, [d.hallTicketStatus, fetchStatus]);

    const checklistItems = useMemo(() => {
        if (!status) return [];
        const items = [
            { key: 'subjects', label: 'Subject Assignments', passed: status.subjectsAssigned, detail: status.subjectsAssigned ? `${status.subjectCount} subjects assigned` : 'No subjects assigned' },
            { key: 'marks', label: 'Marks Entered', passed: status.marksEntered, detail: status.marksEntered ? 'All marks entered' : 'Some marks missing' },
            { key: 'attendance', label: 'Attendance ≥ 75%', passed: status.attendanceOk, detail: status.attendanceOk ? `Attendance: ${status.attendancePercent}%` : `Attendance: ${status.attendancePercent}% (below 75%)` },
            { key: 'rejected', label: 'No Rejections', passed: (status.rejectedSubjects || 0) === 0, detail: status.rejectedSubjects > 0 ? `${status.rejectedSubjects} subject(s) rejected` : 'No rejections' },
            { key: 'fee', label: 'Fee Cleared', passed: status.feeCleared, detail: status.feeCleared ? 'No dues' : 'Outstanding balance' },
            { key: 'signature', label: 'Signature Uploaded', passed: status.signatureUploaded, detail: status.signatureUploaded ? 'Signature on file' : 'Signature missing' },
        ];
        return items;
    }, [status]);

    const readyCount = checklistItems.filter(i => i.passed).length;
    const totalCount = checklistItems.length;
    const isReady = readyCount === totalCount;

    if (loadingStatus) return <SkeletonStats count={3} />;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Hall Ticket Center</h2>
                <p className="text-sm text-muted-foreground">Check your eligibility and download your hall ticket</p>
            </div>

            {/* Readiness Score */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className={`glass rounded-2xl md:rounded-[2.5rem] border p-6 md:p-8 text-center ${isReady ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                <div className="w-16 h-16 md:w-24 md:h-24 mx-auto rounded-full flex items-center justify-center border-[3px] md:border-4 mb-4 md:mb-6"
                    style={{ borderColor: isReady ? '#10b981' : '#f59e0b' }}>
                    <span className="text-2xl md:text-4xl font-black">{readyCount}/{totalCount}</span>
                </div>
                <h3 className="text-base md:text-xl font-bold mb-2">{isReady ? 'You\'re All Set!' : 'Not Ready Yet'}</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {isReady
                        ? 'All requirements are met. You can download your hall ticket below.'
                        : `${totalCount - readyCount} requirement${totalCount - readyCount !== 1 ? 's' : ''} need attention before you can download your hall ticket.`}
                </p>
                {isReady && (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={d.handleDownloadTicket}
                        className="mt-6 px-8 py-4 premium-gradient text-white rounded-2xl font-bold flex items-center gap-3 mx-auto shadow-xl shadow-primary/20">
                        <Download className="w-5 h-5" /> Download Hall Ticket
                    </motion.button>
                )}
            </motion.div>

            {/* Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checklistItems.map((item, i) => (
                    <motion.div key={item.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className={`glass rounded-2xl border p-5 flex items-center gap-4 ${item.passed ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.passed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                            {item.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="font-bold text-sm">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.detail}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Current Hall Ticket */}
            {status?.currentHallTicket && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="glass rounded-2xl md:rounded-[2.5rem] border border-white/10 p-4 md:p-8">
                    <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4 flex items-center gap-2"><FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" /> Current Hall Ticket</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 bg-primary/5 rounded-xl md:rounded-2xl border border-primary/10">
                        <div>
                            <div className="text-xs md:text-sm font-bold">Generated on {new Date(status.currentHallTicket.issuedAt || status.currentHallTicket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                            <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Valid for current semester examinations</div>
                        </div>
                        <button onClick={d.handleDownloadTicket}
                            className="px-3 md:px-4 py-2 bg-primary text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold flex items-center justify-center gap-1.5 md:gap-2 hover:bg-primary/90 transition-all shrink-0">
                            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Download
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/* ── Exams View ── */
function ExamsView({ d }) {
    const [viewMode, setViewMode] = useState('list'); // list | calendar

    useEffect(() => {
        d.fetchExamSchedule();
    }, []);

    const groupedByDate = useMemo(() => {
        const groups = {};
        (d.examSchedule || []).forEach(exam => {
            const date = exam.examDate?.split('T')[0] || 'unknown';
            if (!groups[date]) groups[date] = [];
            groups[date].push(exam);
        });
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [d.examSchedule]);

    const today = new Date().toISOString().split('T')[0];
    const nextExam = (d.examSchedule || []).find(e => (e.examDate?.split('T')[0] || '') >= today);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Exam Schedule</h2>
                    <p className="text-sm text-muted-foreground">Your upcoming examination timetable</p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
                    <button onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>List</button>
                    <button onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>Timeline</button>
                </div>
            </div>

            {d.examSchedule.length === 0 ? (
                <div className="text-center py-16"><EmptyState icon="default" title="No exams scheduled" description="Your exam schedule has not been published yet." /></div>
            ) : viewMode === 'list' ? (
                /* List View */
                <div className="space-y-6">
                    {groupedByDate.map(([date, exams]) => {
                        const dObj = new Date(date + 'T00:00:00');
                        const isToday = date === today;
                        const isPast = dObj < new Date(today);
                        return (
                            <motion.div key={date} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isToday ? 'bg-primary text-white' : isPast ? 'bg-slate-200 text-slate-500' : 'bg-primary/10 text-primary'}`}>
                                        {isToday ? 'Today' : isPast ? 'Past' : 'Upcoming'}
                                    </div>
                                    <span className="text-sm font-bold">{dObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {exams.map((exam, i) => (
                                        <div key={i} className={`glass rounded-2xl border p-5 ${isPast ? 'opacity-50' : 'border-white/10'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{exam.subject?.code}</span>
                                                {exam.examType && (
                                                    <span className="px-2 py-0.5 bg-primary/5 text-[9px] font-black uppercase tracking-widest rounded-md">{exam.examType}</span>
                                                )}
                                            </div>
                                            <div className="font-bold text-sm mb-1">{exam.subject?.name || 'Unknown Subject'}</div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="w-3.5 h-3.5" />
                                                {exam.startTime ? (
                                                    <span>{exam.startTime?.slice(0, 5)} - {exam.endTime?.slice(0, 5)}</span>
                                                ) : (
                                                    <span>Time TBD</span>
                                                )}
                                            </div>
                                            {exam.venue && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span>{exam.venue}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                /* Timeline View */
                <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-primary/50 to-transparent" />
                    <div className="space-y-8">
                        {(d.examSchedule || []).sort((a, b) => (a.examDate || '').localeCompare(b.examDate || '')).map((exam, i) => {
                            const dObj = new Date(exam.examDate + 'T00:00:00');
                            const isPast = dObj < new Date(today);
                            return (
                                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                    className="relative pl-16">
                                    <div className={`absolute left-5 w-6 h-6 rounded-full border-4 ${isPast ? 'bg-slate-200 border-slate-300' : 'bg-primary border-primary/20'} shadow-lg`} />
                                    <div className={`glass rounded-2xl border p-5 ${isPast ? 'opacity-50' : 'border-white/10'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold">{dObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                            <span className="text-[10px] font-mono text-primary/60">{exam.startTime?.slice(0, 5)}</span>
                                        </div>
                                        <div className="font-bold">{exam.subject?.name}</div>
                                        <div className="text-xs text-muted-foreground">{exam.subject?.code}</div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {nextExam && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="glass rounded-2xl md:rounded-[2rem] border border-primary/20 bg-primary/5 p-4 md:p-6 flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary">Next Exam</div>
                        <div className="font-bold">{nextExam.subject?.name}</div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(nextExam.examDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {nextExam.startTime && ` at ${nextExam.startTime.slice(0, 5)}`}
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary/40 ml-auto" />
                </motion.div>
            )}
        </div>
    );
}

/* ── Modals ── */
function TicketModal({ d }) {
    return (
        <AnimatePresence>
            {d.showTicketModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8" role="dialog" aria-modal="true" aria-label="Hall ticket preview">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => d.setShowTicketModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-5xl h-full md:h-[90vh] glass border-0 md:border border-white/10 rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-3 md:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg md:rounded-xl"><FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" aria-hidden="true" /></div>
                                <div><h2 className="font-bold text-sm md:text-lg">Hall Ticket Preview</h2></div>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2">
                                <a href={d.ticketUrl} download aria-label="Download hall ticket" className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"><Download className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" /></a>
                                <button onClick={() => d.setShowTicketModal(false)} aria-label="Close preview" className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"><X className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" /></button>
                            </div>
                        </div>
                        <div className="flex-1 bg-white">
                            <iframe src={`${d.ticketUrl}#toolbar=0`} className="w-full h-full border-none" title="Hall Ticket" />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function StudyPlanModal({ d }) {
    return (
        <AnimatePresence>
            {d.activeStudyPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true" aria-label="Study plan">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => d.setActiveStudyPlan(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl max-h-full md:max-h-[85vh] bg-white border-0 md:border border-white/10 rounded-none md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-3 md:p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="p-1.5 md:p-2 bg-violet-500/10 rounded-lg md:rounded-xl"><BookOpen className="w-4 h-4 md:w-5 md:h-5 text-violet-600" aria-hidden="true" /></div>
                                <div><h2 className="font-bold text-sm md:text-lg">AI Remedial Study Plan</h2><p className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-black">{d.activeStudyPlan.subjectName}</p></div>
                            </div>
                            <button onClick={() => d.setActiveStudyPlan(null)} aria-label="Close study plan" className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"><X className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" /></button>
                        </div>
                        <div className="p-4 md:p-6 overflow-y-auto prose prose-sm prose-slate max-w-none custom-scrollbar pb-10">
                            <ReactMarkdown>{d.activeStudyPlan.planText}</ReactMarkdown>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
