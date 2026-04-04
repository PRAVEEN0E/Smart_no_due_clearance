import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Download,
    AlertCircle,
    ArrowRight,
    Sparkles,
    UploadCloud,
    Layout,
    X,
    AlertTriangle,
    Info,
    RefreshCw,
    CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
    LineChart,
    Line
} from 'recharts';
import api from '../../lib/api';
import CourseMaterials from '../../components/CourseMaterials';
import AIChatBubble from '../../components/AIChatBubble';
import useAuthStore from '../../store/authStore';
import { DashboardSkeleton } from '../../components/Skeleton';

export default function StudentDashboard() {
    const { token: authToken } = useAuthStore();
    const [data, setData] = useState({ evaluations: [], feeRecord: null, hallTicket: null });
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketUrl, setTicketUrl] = useState('');
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    const getFullUrl = (url) => {
        if (!url) return '';
        
        let backendBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        if (backendBase.endsWith('/')) backendBase = backendBase.slice(0, -1);

        // If it's a Cloudinary URL, wrap it with our proxy to bypass 401/CORS
        if (url.startsWith('https://res.cloudinary.com')) {
            return `${backendBase}/api/proxy?url=${encodeURIComponent(url)}&token=${authToken}`;
        }

        if (url.startsWith('http')) return url;
        return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const [statusRes, subRes] = await Promise.all([
                api.get('/student/status'),
                api.get('/student/subjects')
            ]);
            setData(statusRes.data);
            setSubjects(subRes.data);
        } catch (err) {
            console.error("Failed to fetch student dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignmentUpload = async (subId, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('subjectId', subId);
        formData.append('file', file);

        setUploading(true);
        try {
            const { data: assignment } = await api.post('/student/assignments', formData);
            toast.success("Assignment submitted! AI feedback is being generated.");
            fetchDashboard();
        } catch (err) {
            toast.error("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleGeneratePrediction = async (subjectId) => {
        try {
            await api.post(`/student/predict/${subjectId}`);
            fetchDashboard();
            toast.success("Prediction generated successfully!");
        } catch (err) {
            toast.error("Failed to generate prediction. Ensure marks are entered.");
        }
    };

    const handleDownloadTicket = async () => {
        try {
            const res = await api.get('/student/hallticket');
            if (res.data.pdfUrl) {
                setTicketUrl(getFullUrl(res.data.pdfUrl));
                setShowTicketModal(true);
            } else {
                toast.error("Hall ticket generated but URL not found. Please try again.");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to download hall ticket.");
        }
    };

    const handlePayFees = async () => {
        setPaymentProcessing(true);
        try {
            const res = await api.post('/student/pay-fees');
            toast.success(res.data.message || 'Payment processed successfully!');
            fetchDashboard();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Payment failed.');
        } finally {
            setPaymentProcessing(false);
        }
    };

    if (loading) return <DashboardSkeleton />;

    const isAllApproved = data.evaluations.length > 0 && data.evaluations.every(e => e.staffApproved);
    const isFeeCleared = data.feeRecord?.feeClearedAuto || data.feeRecord?.feeClearedManual;
    const canDownloadTicket = isAllApproved && isFeeCleared;

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">Academic Portal</h1>
                    <p className="text-muted-foreground mt-2 flex items-center gap-2">
                        <Layout className="w-4 h-4" /> Keep track of your semester clearance.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {!isFeeCleared && data.feeRecord?.feeBalance > 0 && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePayFees}
                            disabled={paymentProcessing}
                            className={`px-6 py-4 rounded-3xl font-bold flex items-center gap-3 transition-all bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50`}
                        >
                            <CreditCard className="w-5 h-5" />
                            {paymentProcessing ? 'Processing...' : `Pay Dues (₹${data.feeRecord.feeBalance})`}
                        </motion.button>
                    )}

                    <motion.button
                        whileHover={canDownloadTicket ? { scale: 1.05 } : {}}
                        whileTap={canDownloadTicket ? { scale: 0.95 } : {}}
                        disabled={!canDownloadTicket}
                        onClick={handleDownloadTicket}
                        className={`px-8 py-4 rounded-3xl font-bold flex items-center gap-3 transition-all ${canDownloadTicket
                            ? 'premium-gradient text-white shadow-xl shadow-primary/20 cursor-pointer'
                            : 'bg-white/5 border border-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <Download className="w-5 h-5" />
                        {canDownloadTicket ? 'Download Hall Ticket' : 'Hall Ticket Locked'}
                        {!canDownloadTicket && <AlertCircle className="w-4 h-4 ml-2 opacity-40" />}
                    </motion.button>
                </div>
            </div>

            {/* Performance Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                                Performance Overview
                            </h3>
                            <p className="text-muted-foreground text-sm mt-1">CAT Progress tracking for the current semester.</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.evaluations.map(e => ({
                                name: e.subject.code,
                                CAT1: (e.remedial1 !== undefined && e.remedial1 !== null) ? e.remedial1 : (e.cat1 || 0),
                                CAT2: (e.remedial2 !== undefined && e.remedial2 !== null) ? e.remedial2 : (e.cat2 || 0),
                                CAT3: (e.remedial3 !== undefined && e.remedial3 !== null) ? e.remedial3 : (e.cat3 || 0)
                            }))}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 10 }}
                                    domain={[0, 50]}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{
                                        backgroundColor: '#ffffff',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Bar dataKey="CAT1" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="CAT2" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
                                <Bar dataKey="CAT3" fill="#60a5fa" radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass p-8 rounded-3xl border border-border flex flex-col justify-center items-center text-center shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Clearance Progress</h3>
                    <div className="mt-4 text-5xl font-black text-foreground">
                        {data.evaluations.filter(e => e.staffApproved).length}/{data.evaluations.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-bold">Subjects Cleared</p>

                    <div className="w-full h-2 bg-slate-200 rounded-full mt-8 overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-1000"
                            style={{ width: `${(data.evaluations.filter(e => e.staffApproved).length / data.evaluations.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Clearance Tracker */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass rounded-3xl border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                            <h3 className="font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                Subject Clearance Status
                            </h3>
                        </div>
                        <div className="p-2">
                            <div className="divide-y divide-white/5">
                                {data.evaluations.map((ev, i) => {
                                    const prediction = ev.aiPrediction ? JSON.parse(ev.aiPrediction) : null;
                                    return (
                                        <div key={i} className="flex flex-col p-4 hover:bg-white/[0.01] transition-all rounded-2xl group border-l-4 border-transparent hover:border-l-primary/40">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-[10px] font-black ${ev.staffApproved ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-orange-500/10 text-orange-600 border border-orange-200'
                                                        }`}>
                                                        {ev.subject.code}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">{ev.subject.name}</div>
                                                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
                                                            <span>Attendance: <span className={ev.attendancePercent < 75 ? 'text-red-500' : 'text-primary'}>{ev.attendancePercent}%</span></span>
                                                            <span className="hidden md:inline">•</span>
                                                            <span>Activities: {((ev.activity1 || 0) + (ev.activity2 || 0))} </span>
                                                            <span className="hidden md:inline">•</span>
                                                            <span>Internal: <span className="text-foreground">{ev.internalMarksTotal?.toFixed(1) || '0.0'}/40</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {ev.staffApproved ? (
                                                        <div className="text-[10px] bg-primary/10 text-primary py-1 px-2.5 rounded-lg border border-primary/20 font-black uppercase tracking-tighter">Cleared</div>
                                                    ) : (
                                                        <div className="text-[10px] bg-orange-500/10 text-orange-600 py-1 px-2.5 rounded-lg border border-orange-200 font-black uppercase tracking-tighter animate-pulse">In Review</div>
                                                    )}
                                                </div>
                                            </div>

                                            {prediction ? (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-3 ml-14 p-3 bg-primary/5 rounded-xl border border-primary/10"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2 text-[9px] text-primary font-black uppercase tracking-widest">
                                                            <Sparkles className="w-3 h-3" /> AI Insight
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${prediction.successProbability === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                prediction.successProbability === 'Medium' || prediction.successProbability === 'Moderate' ? 'bg-orange-500/20 text-orange-400' :
                                                                    'bg-red-500/20 text-red-400'
                                                                }`}>
                                                                Success: {prediction.successProbability}
                                                            </div>
                                                            <button
                                                                onClick={() => handleGeneratePrediction(ev.subjectId)}
                                                                className="p-1 hover:bg-primary/20 rounded-md text-primary/40 hover:text-primary transition-all"
                                                                title="Regenerate Prediction"
                                                            >
                                                                <RefreshCw className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-600 italic leading-relaxed">
                                                        "Predicted Grade: <span className="text-slate-800 font-bold">{prediction.predictedFinalGrade}</span>. {prediction.recommendation}"
                                                    </p>
                                                </motion.div>
                                            ) : (
                                                <div className="mt-3 ml-14">
                                                    <button
                                                        onClick={() => handleGeneratePrediction(ev.subjectId)}
                                                        className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white flex items-center gap-2 border border-primary/20 px-3 py-1 rounded-lg hover:bg-primary transition-all"
                                                    >
                                                        <Sparkles className="w-3 h-3" /> Generate Success Prediction
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                            </div>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-[100px] pointer-events-none" />
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-2">Assignment Hub</h3>
                                <p className="text-muted-foreground text-sm max-w-md">Submit your work to receive real-time constructive feedback powered by Google Gemini AI.</p>
                            </div>
                            <UploadCloud className="w-10 h-10 text-slate-200 group-hover:text-primary transition-colors" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                            {subjects.map((ss, i) => (
                                <label
                                    key={i}
                                    className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl cursor-pointer hover:border-primary/50 transition-all flex flex-col gap-2"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs uppercase font-bold tracking-widest text-primary">{ss.subject.code}</span>
                                        <Sparkles className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <span className="font-semibold line-clamp-1">{ss.subject.name}</span>
                                    <p className="text-[10px] text-muted-foreground mt-2">TAP TO UPLOAD .PDF / .JPG</p>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleAssignmentUpload(ss.subjectId, e)}
                                    />
                                    {uploading && <div className="h-1 w-full bg-primary/20 rounded-full mt-2 overflow-hidden"><div className="h-full bg-primary animate-progress" /></div>}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Fee Record */}
                    <div className="glass p-6 rounded-3xl border border-white/10 flex flex-col gap-4">
                        <h3 className="font-bold">Fee Tracking</h3>
                        <div className={`p-6 rounded-2xl border ${isFeeCleared ? 'bg-green-400/5 border-green-400/10' : 'bg-red-400/5 border-red-400/10'
                            }`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                                {isFeeCleared ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-500" />}
                            </div>
                            <div className="text-3xl font-bold tracking-tighter">₹{data.feeRecord?.feeBalance || 0}</div>
                            <p className="text-xs mt-4 opacity-60">
                                {isFeeCleared
                                    ? 'All dues are cleared. No further action needed.'
                                    : 'Please clear your dues at the accounts office to unlock hall ticket.'}
                            </p>
                        </div>
                    </div>

                    {/* NEW: Course Materials Repository */}
                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <CourseMaterials subjectId={subjects[0]?.subjectId} role="STUDENT" />
                    </div>

                    {/* Academic Suggestions */}
                    <div className="glass p-6 rounded-3xl border border-white/10 flex flex-col gap-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-400" />
                                Academic Insights
                            </h3>
                            <div className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[9px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/10">
                                AI Powered
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {data.suggestions?.map((sug, i) => {
                                const isCritical = sug.type === 'critical';
                                const isWarning = sug.type === 'warning';
                                const isSuccess = sug.type === 'success';

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={i}
                                        className={`p-4 rounded-[1.25rem] border transition-all hover:scale-[1.02] ${isCritical ? 'bg-red-50 border-red-200 text-red-700' :
                                            isWarning ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                    'bg-blue-50 border-blue-200 text-blue-700'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 p-1.5 rounded-lg ${isCritical ? 'bg-red-500/20 text-red-400' :
                                                isWarning ? 'bg-amber-500/20 text-amber-400' :
                                                    isSuccess ? 'bg-emerald-500/20 text-emerald-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {isCritical ? <AlertTriangle className="w-3.5 h-3.5" /> :
                                                    isWarning ? <AlertCircle className="w-3.5 h-3.5" /> :
                                                        isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                                            <Info className="w-3.5 h-3.5" />
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                                                    {sug.subject}
                                                </div>
                                                <div className="text-xs leading-relaxed font-medium">
                                                    {sug.message}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl border border-yellow-500/10 bg-yellow-500/5 space-y-4">
                        <div className="flex items-center gap-2 text-yellow-500">
                            <AlertCircle className="w-5 h-5" />
                            <h4 className="font-bold">Internal Deadlines</h4>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'CAT 3 Entry', date: 'Oct 24, 2026' },
                                { label: 'Evaluation Lock', date: 'Oct 30, 2026' },
                            ].map((d, i) => (
                                <div key={i} className="flex justify-between text-xs border-b border-white/5 pb-2">
                                    <span className="text-muted-foreground">{d.label}</span>
                                    <span className="font-mono">{d.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showTicketModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTicketModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-5xl h-[90vh] glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl">
                                        <FileText className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg">Hall Ticket Preview</h2>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Examination Authorization</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={ticketUrl}
                                        download
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-primary"
                                        title="Download PDF"
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>
                                    <button
                                        onClick={() => setShowTicketModal(false)}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-primary"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-white">
                                <iframe
                                    src={`${ticketUrl}#toolbar=0`}
                                    className="w-full h-full border-none"
                                    title="Hall Ticket"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AIChatBubble />
        </div>
    );
}
