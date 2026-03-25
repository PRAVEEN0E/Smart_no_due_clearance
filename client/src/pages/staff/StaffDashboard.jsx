import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Users,
    BookOpen,
    CheckCircle2,
    Search,
    ChevronRight,
    TrendingUp,
    AlertCircle,
    Save,
    FileDown,
    Eye,
    ChevronDown,
    FileText,
    ExternalLink,
    X,
    Sparkles,
    BarChart3,
    Trophy,
    GraduationCap,
    ShieldCheck,
    TrendingUp as TrendingUpIcon,
    LineChart as LineChartIcon,
    FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import api from '../../lib/api';
import CourseMaterials from '../../components/CourseMaterials';
import useAuthStore from '../../store/authStore';

export default function StaffDashboard() {
    const { token: authToken } = useAuthStore();
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [evaluations, setEvaluations] = useState([]);
    const [analytics, setAnalytics] = useState({ distribution: [], trends: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeStudent, setActiveStudent] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const getFullUrl = (url) => {
        if (!url) return '';
        
        let backendBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
        if (backendBase.endsWith('/')) backendBase = backendBase.slice(0, -1);

        // If it's a Cloudinary URL, wrap it with our proxy to bypass 401/CORS
        if (url.startsWith('https://res.cloudinary.com')) {
            // Append token as query param so the proxy route can authenticate (iframes don't send headers)
            return `${backendBase}/api/proxy?url=${encodeURIComponent(url)}&token=${authToken}`;
        }

        if (url.startsWith('http')) return url;
        
        let path = url;
        if (!path.startsWith('/') && !path.startsWith('uploads/')) {
            path = `/uploads/${path}`;
        } else if (!path.startsWith('/')) {
            path = `/${path}`;
        }
        
        return `${backendBase}${path}`;
    };

    const isImage = (url) => {
        if (!url) return false;
        const decodedUrl = decodeURIComponent(url);
        // Check extension first
        const path = decodedUrl.split('?')[0].toLowerCase();
        if (path.endsWith('.pdf')) return false;
        
        return /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(path) || decodedUrl.includes('image/upload');
    };

    const isPDF = (url) => {
        if (!url) return false;
        const decodedUrl = decodeURIComponent(url);
        return decodedUrl.split('?')[0].toLowerCase().endsWith('.pdf');
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/staff/subjects');
            const data = res.data || [];
            setSubjects(data);
            if (data.length > 0) {
                setSelectedSubject(data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch subjects", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedSubject) {
            fetchData();
        }
    }, [selectedSubject]);

    const fetchData = async () => {
        if (!selectedSubject) return;
        try {
            const [evalRes, analyticsRes] = await Promise.all([
                api.get('/staff/evaluations'),
                api.get('/staff/analytics')
            ]);

            const allEval = evalRes.data || [];
            const subjectEvaluations = allEval.filter(e => e.subjectId === selectedSubject.subjectId);

            setEvaluations(subjectEvaluations);
            setAnalytics(analyticsRes.data || { distribution: [], trends: [] });
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        }
    };

    const handleUpdateMark = async (evalId, field, value) => {
        const numericValue = value === '' ? null : (field === 'attendancePercent' ? parseFloat(value) : parseInt(value));

        const updated = evaluations.map(ev => {
            if (ev.id === evalId) return { ...ev, [field]: numericValue };
            return ev;
        });
        setEvaluations(updated);

        try {
            await api.put(`/staff/marks/${evalId}`, { [field]: numericValue });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update mark");
        }
    };

    const handleSignatureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            await api.post('/auth/signature', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Digital signature uploaded successfully!");
        } catch (err) {
            toast.error("Failed to upload signature.");
        }
    };

    const handleApprove = async (evalId) => {
        try {
            await api.post(`/staff/approve/${evalId}`);
            fetchData();
            toast.success("Student approved successfully!");
        } catch (err) {
            toast.error("Approval failed");
        }
    };

    const handleRegenerateFeedback = async (assignmentId) => {
        try {
            const res = await api.post(`/staff/regenerate-feedback/${assignmentId}`);
            const updatedEvaluations = evaluations.map(ev => ({
                ...ev,
                student: {
                    ...ev.student,
                    assignments: ev.student.assignments?.map(asgn =>
                        asgn.id === assignmentId ? { ...asgn, aiFeedback: res.data.aiFeedback } : asgn
                    )
                }
            }));
            setEvaluations(updatedEvaluations);
        } catch (err) {
            toast.error("Feedback regeneration failed");
        }
    };

    const handleExportExcel = async () => {
        if (!selectedSubject) return;
        try {
            const res = await api.get(`/staff/export/excel/${selectedSubject.subjectId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Marks_${selectedSubject.subject.code}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Excel exported successfully!");
        } catch (err) {
            toast.error("Export failed");
        }
    };

    const handleExportPDF = async () => {
        if (!selectedSubject) return;
        try {
            const res = await api.get(`/staff/export/pdf/${selectedSubject.subjectId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Marks_${selectedSubject.subject.code}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("PDF exported successfully!");
        } catch (err) {
            toast.error("Export failed");
        }
    };

    const isReadyToApprove = (ev) => {
        const type = selectedSubject?.subject.type;
        const isLab = type === 'FULL_LAB';
        const isHybrid = type === 'THEORY_WITH_LAB';
        
        if (isLab) {
            return ev.modelLabMarks !== null && 
                   ev.activity1 !== null && 
                   ev.activity2 !== null && 
                   ev.attendancePercent !== null;
        } else if (isHybrid) {
            return ev.cat1 !== null && 
                   ev.cat2 !== null && 
                   ev.cat3 !== null && 
                   ev.activity1 !== null && 
                   ev.activity2 !== null && 
                   ev.attendancePercent !== null &&
                   ev.modelLabMarks !== null &&
                   [1, 2, 3, 4, 5].every(n => ev[`assignment${n}`] !== null);
        } else {
            return ev.cat1 !== null && 
                   ev.cat2 !== null && 
                   ev.cat3 !== null && 
                   ev.activity1 !== null && 
                   ev.activity2 !== null && 
                   ev.attendancePercent !== null &&
                   [1, 2, 3, 4, 5].every(n => ev[`assignment${n}`] !== null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );

    const avgMarks = evaluations.length > 0
        ? evaluations.reduce((acc, curr) => acc + (curr.internalMarksTotal || 0), 0) / evaluations.length
        : 0;

    const approvedCount = evaluations.filter(e => e.staffApproved).length;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Faculty Portal
                    </h1>
                    <p className="text-muted-foreground mt-1">Review student performance and manage academic records.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-5 py-3 rounded-2xl border border-emerald-500/20 transition-all group"
                    >
                        <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">Export Excel</span>
                    </button>

                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-5 py-3 rounded-2xl border border-blue-500/20 transition-all group"
                    >
                        <FileDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">Export PDF</span>
                    </button>

                    <label className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 cursor-pointer transition-all">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium">Capture Signature</span>
                        <input type="file" className="hidden" onChange={(e) => handleSignatureUpload(e)} accept="image/*" />
                    </label>
                    <div className="glass px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium">Session Active</span>
                    </div>
                </div>
            </div>

            {/* Top Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-[10px] text-emerald-500/60 font-bold uppercase tracking-[0.2em]">Class Average</div>
                        <div className="text-4xl font-black tracking-tight">{avgMarks.toFixed(1)}</div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-[10px] text-teal-500/60 font-bold uppercase tracking-[0.2em]">Approved</div>
                        <div className="text-4xl font-black tracking-tight">{approvedCount} <span className="text-lg text-muted-foreground font-medium">/ {evaluations.length}</span></div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="text-[10px] text-primary/60 font-bold uppercase tracking-[0.2em]">Top Score</div>
                        <div className="text-4xl font-black tracking-tight">
                            {evaluations.length > 0 ? Math.max(...evaluations.map(e => e.internalMarksTotal || 0)).toFixed(1) : '0.0'}
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 glass rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold">Class Performance Trend</h3>
                                <p className="text-sm text-muted-foreground mt-1">Average scores across internal assessments</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                <LineChartIcon className="w-6 h-6 text-primary" />
                            </div>
                        </div>

                        <div className="flex-1 min-h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics.trends}>
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                                        domain={[0, 50]}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(20,20,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="avg"
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#lineGradient)"
                                        dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-1 glass rounded-[2.5rem] border border-white/10 p-8 shadow-2xl flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold">Top Achievers</h3>
                            <p className="text-xs text-muted-foreground mt-1">Leading {selectedSubject?.subject.name}</p>
                        </div>
                        <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                        {evaluations
                            .sort((a, b) => b.internalMarksTotal - a.internalMarksTotal)
                            .slice(0, 5)
                            .map((ev, i) => (
                                <div key={ev.id} className="group/item">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/30 group-hover/item:bg-primary/20 group-hover/item:text-primary transition-all">
                                                0{i + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold truncate max-w-[120px]">{ev.student.name}</div>
                                                <div className="text-[9px] text-muted-foreground font-mono">{ev.student?.email?.split('@')[0] || 'student'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-primary">{ev.internalMarksTotal.toFixed(1)}</div>
                                            <div className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Marks</div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(ev.internalMarksTotal / 40) * 100}%` }}
                                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                            className="h-full premium-gradient rounded-full"
                                        />
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                <div className="xl:col-span-3 space-y-8">
                    <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                        {subjects.map((subAssignment) => (
                            <button
                                key={subAssignment.id}
                                onClick={() => setSelectedSubject(subAssignment)}
                                className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all whitespace-nowrap min-w-[200px] ${selectedSubject?.subjectId === subAssignment.subjectId
                                    ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white'
                                    : 'glass border-white/5 text-muted-foreground hover:border-white/20'
                                    }`}
                            >
                                <BookOpen className="w-5 h-5 opacity-70" />
                                <div className="text-left">
                                    <div className="text-sm font-bold">{subAssignment.subject.name}</div>
                                    <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono">{subAssignment.subject.code}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Enrolled Students
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead>
                                    <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em] bg-white/[0.03] backdrop-blur-md">
                                        <th className="px-8 py-8 min-w-[240px] border-b border-white/5 rounded-tl-3xl">Student Information</th>
                                        <th className="px-4 py-8 text-center text-primary/80 w-[90px] border-b border-white/5">Files</th>
                                        {selectedSubject?.subject.type === 'FULL_LAB' ? (
                                            <>
                                                <th className="px-6 py-8 text-center w-[160px] border-l border-b border-white/5 bg-white/[0.01]">Model Lab</th>
                                                <th className="px-6 py-8 text-center w-[200px] border-l border-b border-white/5 bg-white/[0.01]">Lab Activities</th>
                                            </>
                                        ) : selectedSubject?.subject.type === 'THEORY_WITH_LAB' ? (
                                            <>
                                                <th className="px-6 py-8 text-center w-[180px] border-l border-b border-white/5 bg-white/[0.01]">CAT Assessments</th>
                                                <th className="px-6 py-8 text-center w-[240px] border-l border-b border-white/5 bg-white/[0.01]">Assignments</th>
                                                <th className="px-6 py-8 text-center w-[140px] border-l border-b border-white/5 bg-white/[0.01]">Activities</th>
                                                <th className="px-6 py-8 text-center w-[160px] border-l border-b border-white/5 bg-white/[0.01]">Model Lab</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-6 py-8 text-center w-[180px] border-l border-b border-white/5 bg-white/[0.01]">CAT Assessments</th>
                                                <th className="px-6 py-8 text-center w-[240px] border-l border-b border-white/5 bg-white/[0.01]">Assignments</th>
                                                <th className="px-6 py-8 text-center w-[140px] border-l border-b border-white/5 bg-white/[0.01]">Activities</th>
                                            </>
                                        )}
                                        <th className="px-4 py-8 text-center w-[110px] border-l border-b border-white/5 bg-emerald-500/[0.02]">Attend %</th>
                                        {selectedSubject?.subject.type !== 'FULL_LAB' && (
                                            <th className="px-6 py-8 text-center w-[180px] border-l border-b border-white/5 bg-orange-500/[0.02]">Remedial</th>
                                        )}
                                        <th className="px-4 py-8 text-center w-[100px] font-black text-white border-l border-b border-white/5 bg-primary/10">Final</th>
                                        <th className="px-8 py-8 text-right min-w-[180px] border-b border-white/5 rounded-tr-3xl">Verification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <AnimatePresence mode="popLayout">
                                        {evaluations.map((ev) => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={ev.id}
                                                className="hover:bg-white/[0.02] transition-colors group"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0 shadow-inner">
                                                            {ev.student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white text-sm group-hover:text-primary transition-all duration-300 tracking-tight">{ev.student.name}</div>
                                                            <div className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">{ev.student.email}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex justify-center">
                                                        {selectedSubject?.subject.type !== 'FULL_LAB' ? (
                                                            <button
                                                                onClick={() => setActiveStudent(ev.student)}
                                                                className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-all relative group/btn"
                                                            >
                                                                <FileText className="w-5 h-5" />
                                                                {ev.student.assignments?.length > 0 && (
                                                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#0a0a0a]" />
                                                                )}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-black text-[9px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
                                                                    View Assignments
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            <span className="text-muted-foreground/30 text-[10px] font-bold">N/A</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {selectedSubject?.subject.type === 'FULL_LAB' ? (
                                                     <>
                                                         <td className="px-6 py-6 border-l border-white/5">
                                                             <div className="flex justify-center">
                                                                 <input
                                                                     type="number"
                                                                     value={ev.modelLabMarks ?? ''}
                                                                     onChange={(e) => handleUpdateMark(ev.id, 'modelLabMarks', e.target.value)}
                                                                     className="w-24 h-12 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-sm font-bold focus:ring-2 focus:ring-primary focus:bg-primary/5 outline-none transition-all hover:bg-white/[0.05] hover:border-white/20"
                                                                     placeholder="00"
                                                                 />
                                                             </div>
                                                         </td>
                                                         <td className="px-6 py-6 border-l border-white/5">
                                                             <div className="flex gap-2.5 justify-center">
                                                                 {[1, 2].map(n => (
                                                                     <input
                                                                         key={n}
                                                                         type="number"
                                                                         value={ev[`activity${n}`] ?? ''}
                                                                         onChange={(e) => handleUpdateMark(ev.id, `activity${n}`, e.target.value)}
                                                                         className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-emerald-500/5 outline-none transition-all"
                                                                         placeholder="0"
                                                                     />
                                                                 ))}
                                                             </div>
                                                         </td>
                                                     </>
                                                 ) : selectedSubject?.subject.type === 'THEORY_WITH_LAB' ? (
                                                     <>
                                                         <td className="px-6 py-6 border-l border-white/5">
                                                             <div className="flex gap-2 justify-center">
                                                                 {[1, 2, 3].map(n => (
                                                                     <input
                                                                         key={n}
                                                                         type="number"
                                                                         value={ev[`cat${n}`] ?? ''}
                                                                         onChange={(e) => handleUpdateMark(ev.id, `cat${n}`, e.target.value)}
                                                                         className="w-14 h-12 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-xs font-bold focus:ring-2 focus:ring-primary focus:bg-primary/5 outline-none transition-all"
                                                                         placeholder={`#${n}`}
                                                                     />
                                                                 ))}
                                                             </div>
                                                         </td>
                                                         <td className="px-6 py-6 border-l border-white/5">
                                                             <div className="flex gap-1.5 justify-center">
                                                                 {[1, 2, 3, 4, 5].map(n => (
                                                                     <input
                                                                         key={n}
                                                                         type="number"
                                                                         value={ev[`assignment${n}`] ?? ''}
                                                                         onChange={(e) => handleUpdateMark(ev.id, `assignment${n}`, e.target.value)}
                                                                         className="w-10 h-10 bg-white/[0.02] border border-white/5 rounded-xl text-center text-[10px] focus:ring-2 focus:ring-blue-500 focus:bg-blue-500/5 outline-none transition-all"
                                                                         placeholder={n}
                                                                     />
                                                                 ))}
                                                             </div>
                                                         </td>
                                                         <td className="px-6 py-6 border-l border-white/5">
                                                             <div className="flex gap-2 justify-center">
                                                                 {[1, 2].map(n => (
                                                                     <input
                                                                         key={n}
                                                                         type="number"
                                                                         value={ev[`activity${n}`] ?? ''}
                                                                         onChange={(e) => handleUpdateMark(ev.id, `activity${n}`, e.target.value)}
                                                                         className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-emerald-500/5 outline-none transition-all"
                                                                         placeholder="0"
                                                                     />
                                                                 ))}
                                                             </div>
                                                         </td>
                                                         <td className="px-6 py-6 border-l border-white/5">
                                                             <div className="flex justify-center">
                                                                 <input
                                                                     type="number"
                                                                     value={ev.modelLabMarks ?? ''}
                                                                     onChange={(e) => handleUpdateMark(ev.id, 'modelLabMarks', e.target.value)}
                                                                     className="w-24 h-12 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-sm font-bold focus:ring-2 focus:ring-primary focus:bg-primary/5 outline-none transition-all hover:bg-white/[0.05] hover:border-white/20"
                                                                     placeholder="00"
                                                                 />
                                                             </div>
                                                         </td>
                                                     </>
                                                 ) : (
                                                     <>
                                                         <td className="px-6 py-6 border-l border-white/5">
                                                             <div className="flex gap-2 justify-center">
                                                                 {[1, 2, 3].map(n => (
                                                                     <input
                                                                         key={n}
                                                                         type="number"
                                                                         value={ev[`cat${n}`] ?? ''}
                                                                         onChange={(e) => handleUpdateMark(ev.id, `cat${n}`, e.target.value)}
                                                                         className="w-14 h-12 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-xs font-bold focus:ring-2 focus:ring-primary focus:bg-primary/5 outline-none transition-all"
                                                                         placeholder={`#${n}`}
                                                                     />
                                                                 ))}
                                                             </div>
                                                         </td>
                                                         <td className="px-6 py-6 border-l border-white/5">
                                                             <div className="flex gap-1.5 justify-center">
                                                                 {[1, 2, 3, 4, 5].map(n => (
                                                                     <input
                                                                         key={n}
                                                                         type="number"
                                                                         value={ev[`assignment${n}`] ?? ''}
                                                                         onChange={(e) => handleUpdateMark(ev.id, `assignment${n}`, e.target.value)}
                                                                         className="w-10 h-10 bg-white/[0.02] border border-white/5 rounded-xl text-center text-[10px] focus:ring-2 focus:ring-blue-500 focus:bg-blue-500/5 outline-none transition-all"
                                                                         placeholder={n}
                                                                     />
                                                                 ))}
                                                             </div>
                                                         </td>
                                                         <td className="px-6 py-6 border-l border-white/5">
                                                             <div className="flex gap-2 justify-center">
                                                                 {[1, 2].map(n => (
                                                                     <input
                                                                         key={n}
                                                                         type="number"
                                                                         value={ev[`activity${n}`] ?? ''}
                                                                         onChange={(e) => handleUpdateMark(ev.id, `activity${n}`, e.target.value)}
                                                                         className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-emerald-500/5 outline-none transition-all"
                                                                         placeholder="0"
                                                                     />
                                                                 ))}
                                                             </div>
                                                         </td>
                                                     </>
                                                 )}

                                                  <td className="px-6 py-6 border-l border-white/5 bg-emerald-500/[0.01]">
                                                      <div className="flex justify-center">
                                                          <input
                                                              type="number"
                                                              value={ev.attendancePercent ?? ''}
                                                              onChange={(e) => handleUpdateMark(ev.id, 'attendancePercent', e.target.value)}
                                                              className={`w-20 h-12 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${ev.attendancePercent < 75 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}`}
                                                              placeholder="%"
                                                          />
                                                      </div>
                                                  </td>

                                                  {selectedSubject?.subject.type !== 'FULL_LAB' && (
                                                  <td className="px-6 py-6 border-l border-white/5 bg-orange-500/[0.01]">
                                                      <div className="flex gap-2 justify-center">
                                                          {[1, 2, 3].map(n => (
                                                              <input
                                                                  key={n}
                                                                  type="number"
                                                                  disabled={!(ev.attendancePercent < 75 || (ev[`cat${n}`] !== null && ev[`cat${n}`] < 25))}
                                                                  value={ev[`remedial${n}`] ?? ''}
                                                                  onChange={(e) => handleUpdateMark(ev.id, `remedial${n}`, e.target.value)}
                                                                  className={`w-12 h-12 rounded-2xl text-center text-xs font-bold outline-none transition-all ${(ev.attendancePercent < 75 || (ev[`cat${n}`] !== null && ev[`cat${n}`] < 25)) 
                                                                    ? 'glass border-orange-500/50 border-2 bg-orange-500/10 text-orange-400' 
                                                                    : 'bg-white/5 border-white/5 opacity-10'
                                                                  }`}
                                                                  placeholder={`R${n}`}
                                                              />
                                                          ))}
                                                      </div>
                                                  </td>
                                                      )}

                                                  <td className="px-6 py-6 text-center border-l border-white/5 bg-primary/20 backdrop-blur-sm">
                                                      <div className="text-xl font-black text-white">
                                                          {Math.round(ev.internalMarksTotal)}
                                                      </div>
                                                  </td>

                                                 <td className="px-8 py-6 text-right whitespace-nowrap">
                                                     {ev.staffApproved ? (
                                                         <div className="flex items-center justify-end gap-3 text-emerald-400">
                                                             <ShieldCheck className="w-5 h-5" />
                                                             <span className="text-[10px] font-black uppercase tracking-widest">Finalized</span>
                                                         </div>
                                                     ) : (
                                                         <button
                                                             disabled={!isReadyToApprove(ev)}
                                                             onClick={() => handleApprove(ev.id)}
                                                             className={`px-6 py-2.5 rounded-xl border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest transition-all ${!isReadyToApprove(ev) ? 'opacity-30 cursor-not-allowed grayscale' : 'bg-primary/10 hover:bg-primary hover:text-white shadow-lg shadow-primary/10'}`}
                                                         >
                                                             Approve
                                                         </button>
                                                     )}
                                                 </td>
                                             </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass p-6 rounded-[2.5rem] border border-white/10 h-full">
                        <CourseMaterials subjectId={selectedSubject?.subjectId} role="STAFF" />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {activeStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setActiveStudent(null); setPreviewUrl(null); }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[40px] border border-white/10 relative z-10 shadow-2xl flex flex-col"
                        >
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                                        <Users className="w-7 h-7 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{activeStudent.name}'s Submissions</h2>
                                        <p className="text-muted-foreground text-sm font-mono opacity-60">{activeStudent.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setActiveStudent(null); setPreviewUrl(null); }} className="p-3 hover:bg-white/5 rounded-2xl border border-white/5 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                                <div className={`flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar transition-all duration-500 ${previewUrl ? 'md:w-1/2' : 'w-full'}`}>
                                    {(() => {
                                        const studentEval = evaluations.find(e => e.studentId === activeStudent.id);
                                        if (!studentEval) return null;

                                        const radarData = [
                                            { subject: 'CAT 1', value: studentEval.cat1 || 0, full: 50 },
                                            { subject: 'CAT 2', value: studentEval.cat2 || 0, full: 50 },
                                            { subject: 'CAT 3', value: studentEval.cat3 || 0, full: 50 },
                                            { subject: 'Assign.', value: ((studentEval.assignment1 + studentEval.assignment2 + studentEval.assignment3 + studentEval.assignment4 + studentEval.assignment5) / 5) * 5 || 0, full: 50 },
                                            { subject: 'Attend.', value: (studentEval.attendancePercent / 100) * 50 || 0, full: 50 },
                                        ];

                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                                <div className="glass p-6 rounded-[2rem] border border-white/10 flex flex-col justify-center items-center">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4">Performance Radar</h4>
                                                    <div className="h-[200px] w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                                                                <Radar
                                                                    name="Performance"
                                                                    dataKey="value"
                                                                    stroke="#3b82f6"
                                                                    fill="#3b82f6"
                                                                    fillOpacity={0.6}
                                                                />
                                                            </RadarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                                <div className="glass p-8 rounded-[2rem] border border-white/10 flex flex-col justify-center">
                                                    <div className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">Total Internal Marks</div>
                                                    <div className="text-6xl font-black tracking-tighter text-white">
                                                        {studentEval.internalMarksTotal.toFixed(1)}
                                                        <span className="text-xl text-muted-foreground ml-2 font-medium">/ 40</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {(!activeStudent.assignments || activeStudent.assignments.length === 0) ? (
                                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-40">
                                            <FileText className="w-12 h-12" />
                                            <p className="font-medium italic">No assignments submitted yet.</p>
                                        </div>
                                    ) : (
                                        activeStudent.assignments
                                            .filter(a => a.subjectId === selectedSubject.subjectId)
                                            .map((asgn, i) => (
                                                <motion.div
                                                    key={asgn.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="glass p-6 rounded-3xl border border-white/5 hover:border-white/20 transition-all flex flex-col gap-6"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                                                <FileText className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-lg flex items-center gap-2">
                                                                    Assignment Submission
                                                                    {(() => {
                                                                        const ext = asgn.fileUrl?.split('.').pop()?.toLowerCase();
                                                                        const isRealExt = ext && ext.length < 5 && !ext.includes('/');
                                                                        return (
                                                                            <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-black uppercase tracking-tighter text-muted-foreground border border-white/5">
                                                                                {isRealExt ? ext.toUpperCase() : 'FILE'}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                    {new Date(asgn.submittedAt).toLocaleDateString()} • {asgn.fileUrl?.split('/').pop()?.split('_')[0] || 'View Document'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setPreviewUrl(getFullUrl(asgn.fileUrl))}
                                                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-sm font-bold border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                Preview
                                                            </button>
                                                            <a
                                                                href={getFullUrl(asgn.fileUrl)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-bold border border-primary/20 hover:bg-primary/20 transition-all"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    </div>

                                                    <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-3 relative group/ai">
                                                        <div className="flex items-center gap-2 text-blue-400">
                                                            <Sparkles className="w-4 h-4" />
                                                            <span className="text-xs font-bold uppercase tracking-widest">AI Academic Review</span>
                                                        </div>
                                                        <div className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap font-medium">
                                                            {asgn.aiFeedback || "No AI feedback yet."}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                    )}
                                </div>

                                <AnimatePresence>
                                    {previewUrl && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 100 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 100 }}
                                            className="w-full md:w-1/2 border-l border-white/10 bg-black/40 backdrop-blur-md flex flex-col"
                                        >
                                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                                <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                    Document Preview
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <a 
                                                        href={previewUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-muted-foreground hover:text-white"
                                                        title="Open in new tab"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                    <button 
                                                        onClick={() => setPreviewUrl(null)}
                                                        className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-[#1a1a1a] relative overflow-hidden">
                                                {isImage(previewUrl) ? (
                                                    <div className="w-full h-full flex items-center justify-center p-8">
                                                        <img 
                                                            src={previewUrl} 
                                                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                                                            alt="Preview" 
                                                        />
                                                    </div>
                                                ) : isPDF(previewUrl) ? (
                                                    <iframe 
                                                        src={previewUrl} 
                                                        className="w-full h-full border-none bg-white"
                                                        title="PDF Preview"
                                                    />
                                                ) : (
                                                    <iframe 
                                                        src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`} 
                                                        className="w-full h-full border-none bg-white"
                                                        title="Document Preview"
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
