import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Users,
    GraduationCap,
    BookOpen,
    CheckCircle2,
    Upload,
    Plus,
    Search,
    MoreVertical,
    Trash2,
    Edit,
    TrendingUp,
    X,
    UserPlus,
    Link as LinkIcon,
    ShieldCheck,
    Megaphone,
    Sparkles,
    AlertCircle,
    Wallet
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import useAuth from '../../hooks/useAuth';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

export default function MentorDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ studentCount: 0, staffCount: 0, subjectCount: 0, totalApprovals: 0 });
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false); // For Staff mapping
    const [showStudentAssignModal, setShowStudentAssignModal] = useState(false); // For Student mapping
    const [showCommonFeeModal, setShowCommonFeeModal] = useState(false);
    const [commonFeeAmount, setCommonFeeAmount] = useState('');
    const [addingCommonFee, setAddingCommonFee] = useState(false);
    const [modalMode, setModalMode] = useState('student'); // 'student', 'subject', 'staff'
    const [formData, setFormData] = useState({ name: '', email: '', password: '', code: '', type: 'FULL_THEORY', syllabusText: '' });
    const [editingId, setEditingId] = useState(null);
    const [assignData, setAssignData] = useState({ staffId: '', subjectId: '' });
    const [activeStudent, setActiveStudent] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, studentsRes, subjectsRes, staffRes, auditRes, annRes] = await Promise.all([
                api.get('/mentor/analytics'),
                api.get('/mentor/students'),
                api.get('/mentor/subjects'),
                api.get('/mentor/staff'),
                api.get('/auth/audit-logs'),
                api.get('/mentor/announcements')
            ]);
            setStats(statsRes.data.stats);
            setStudents(studentsRes.data);
            setSubjects(subjectsRes.data);
            setStaff(staffRes.data);
            setAuditLogs(auditRes.data || []);
            setAnnouncements(annRes.data || []);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpload = async (type, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        setUploadLoading(true);
        try {
            const endpoint = type === 'students' ? '/mentor/bulk-students' : '/mentor/bulk-fees';
            await api.post(endpoint, uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchData();
            toast.success(`Bulk ${type} upload successful!`);
        } catch (err) {
            toast.error("Upload failed. Please check file format.");
        } finally {
            setUploadLoading(false);
        }
    };



    const handleSignatureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const res = await api.post('/auth/signature', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Digital signature uploaded successfully!");
        } catch (err) {
            toast.error("Failed to upload signature.");
        }
    };

    const handleEditClick = (mode, item) => {
        setModalMode(mode);
        setEditingId(item.id);
        if (mode === 'subject') {
            setFormData({ name: item.name, code: item.code, type: item.type, syllabusText: item.syllabusText || '' });
        } else {
            setFormData({ name: item.name, email: item.email, password: '' });
        }
        setShowAddModal(true);
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const isEditing = !!editingId;
            const method = isEditing ? 'put' : 'post';
            const idPath = isEditing ? `/${editingId}` : '';

            let endpoint = '';
            let payload = {};

            if (modalMode === 'student') {
                endpoint = `/mentor/students${idPath}`;
                payload = { name: formData.name, email: formData.email };
                if (formData.password) payload.password = formData.password;
            } else if (modalMode === 'staff') {
                endpoint = `/mentor/staff${idPath}`;
                payload = { name: formData.name, email: formData.email };
                if (formData.password) payload.password = formData.password;
            } else if (modalMode === 'announcement') {
                endpoint = `/mentor/announcements`;
                payload = { title: formData.name, content: formData.content, type: formData.type, priority: formData.priority };
            } else {
                endpoint = `/mentor/subjects${idPath}`;
                payload = { name: formData.name, code: formData.code, type: formData.type, syllabusText: formData.syllabusText };
            }

            await api[method](endpoint, payload);

            fetchData();
            setShowAddModal(false);
            setEditingId(null);
            setFormData({ name: '', email: '', password: '', code: '', type: 'FULL_THEORY', content: '', priority: 1, syllabusText: '' });
            toast.success(`${modalMode} ${isEditing ? 'updated' : 'added'} successfully!`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to process request");
        }
    };


    const handleDeleteItem = async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            let endpoint;
            if (type === 'student') endpoint = `/mentor/students/${id}`;
            else if (type === 'staff') endpoint = `/mentor/staff/${id}`;
            else if (type === 'subject') endpoint = `/mentor/subjects/${id}`;
            else if (type === 'announcement') endpoint = `/mentor/announcements/${id}`;

            await api.delete(endpoint);
            fetchData();
            toast.success(`${type} deleted successfully.`);
        } catch (err) {
            toast.error("Failed to delete item.");
        }
    };

    const handleToggleFee = async (studentId, currentStatus) => {
        try {
            await api.put(`/mentor/fees/${studentId}`, { feeClearedManual: !currentStatus });
            fetchData();
            toast.success("Fee status updated successfully.");
        } catch (err) {
            toast.error("Failed to update fee status.");
        }
    };

    const handleAssignStaff = async (e) => {
        e.preventDefault();
        try {
            await api.post('/mentor/assign/staff', assignData);
            fetchData();
            setShowAssignModal(false);
            setAssignData({ staffId: '', subjectId: '' });
            toast.success("Staff assigned to subject successfully!");
        } catch (err) {
            toast.error("Assignment failed. Check if mapping already exists.");
        }
    };

    const handleAssignStudent = async (subjectId) => {
        try {
            await api.post('/mentor/assign/student', {
                studentId: activeStudent.id,
                subjectId
            });
            fetchData();
            toast.success(`Student assigned to ${subjects.find(s => s.id === subjectId)?.name}`);
        } catch (err) {
            toast.error("Assignment failed or student already enrolled.");
        }
    };

    const closeModals = () => {
        setShowAddModal(false);
        setShowAssignModal(false);
        setShowStudentAssignModal(false);
        setShowCommonFeeModal(false);
        setEditingId(null);
        setFormData({ name: '', email: '', password: '', code: '', type: 'FULL_THEORY', content: '', priority: 1, syllabusText: '' });
        setCommonFeeAmount('');
    };

    const handleAssignCommonFee = async (e) => {
        e.preventDefault();
        if (!commonFeeAmount || isNaN(commonFeeAmount) || commonFeeAmount <= 0) {
            return toast.error("Please enter a valid amount");
        }
        try {
            setAddingCommonFee(true);
            const res = await api.post('/mentor/bulk-add-common-fee', { amount: commonFeeAmount });
            toast.success(res.data.message || "Fee added successfully");
            setCommonFeeAmount('');
            setShowCommonFeeModal(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add common fee");
        } finally {
            setAddingCommonFee(false);
        }
    };

    const getFilteredData = () => {
        let items =
            activeTab === 'students' ? students :
                activeTab === 'staff' ? staff :
                    activeTab === 'subjects' ? subjects :
                        activeTab === 'announcements' ? announcements :
                            auditLogs;

        if (!searchQuery) return items;

        const query = searchQuery.toLowerCase();
        return items.filter(item => {
            if (activeTab === 'students' || activeTab === 'staff') {
                return (item.name || '').toLowerCase().includes(query) || (item.email || '').toLowerCase().includes(query);
            }
            if (activeTab === 'subjects') {
                return (item.name || '').toLowerCase().includes(query) || (item.code || '').toLowerCase().includes(query);
            }
            if (activeTab === 'announcements') {
                return (item.title || '').toLowerCase().includes(query) || (item.content || '').toLowerCase().includes(query);
            }
            if (activeTab === 'audit') {
                return (item.action || '').toLowerCase().includes(query) || (item.userEmail || '').toLowerCase().includes(query);
            }
            return false;
        });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent italic uppercase">
                        System Overview
                    </h1>
                    <p className="text-muted-foreground font-medium italic">Manage institution records & faculty assignments.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => { setModalMode('announcement'); setShowAddModal(true); }}
                        className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-xl border border-primary/20 transition-all font-bold text-sm shadow-sm"
                    >
                        <Megaphone className="w-4 h-4" />
                        Announcement
                    </button>
                    <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer transition-all shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">Digital Signature</span>
                        <input type="file" className="hidden" onChange={(e) => handleSignatureUpload(e)} accept="image/*" />
                    </label>
                    <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block" />
                    <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer transition-all shadow-sm">
                        <Upload className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">Students Excel</span>
                        <input type="file" className="hidden" onChange={(e) => handleBulkUpload('students', e)} accept=".xlsx,.csv" />
                    </label>
                </div>

            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Students', value: stats.studentCount, icon: GraduationCap, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Staff Members', value: stats.staffCount, icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
                    { label: 'Total Subjects', value: stats.subjectCount, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Total Approvals', value: stats.totalApprovals, icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-100' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass p-6 rounded-[2rem] border border-border relative overflow-hidden group hover:border-primary/30 transition-all cursor-default shadow-sm"
                    >
                        <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-all duration-500`} />
                        <stat.icon className={`w-8 h-8 ${stat.color} mb-4 relative z-10`} />
                        <p className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-bold relative z-10">{stat.label}</p>
                        <h2 className="text-4xl font-black mt-2 tabular-nums relative z-10 tracking-tight text-foreground">{stat.value}</h2>
                    </motion.div>
                ))}
            </div>


            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Management Table */}
                <div className="lg:col-span-2 glass rounded-3xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 backdrop-blur-md">
                            {['students', 'staff', 'subjects', 'audit', 'announcements'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-slate-200'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-50 border-b border-border">
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground/50">{activeTab}</h2>
                            <div className="h-4 w-[1px] bg-slate-200" />
                            <div className="text-[10px] font-mono text-slate-400 uppercase opacity-80">
                                {getFilteredData().length} Records found
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder={`Filter ${activeTab}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all w-full md:w-[220px]"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const mode = activeTab === 'students' ? 'student' : (activeTab === 'staff' ? 'staff' : (activeTab === 'subjects' ? 'subject' : 'announcement'));
                                    setModalMode(mode);
                                    setShowAddModal(true);
                                }}
                                className="bg-primary/20 hover:bg-primary p-2 rounded-xl text-primary hover:text-white transition-all shadow-lg active:scale-95"
                                title={`Add ${activeTab}`}
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto text-sm">
                        {activeTab === 'audit' ? (
                            <div className="divide-y divide-border max-h-[600px] overflow-y-auto custom-scrollbar">
                                {getFilteredData().length > 0 ? getFilteredData().map((log, i) => (
                                    <div key={i} className="p-6 hover:bg-slate-50 transition-all group">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex gap-4">
                                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.action === 'MARK_UPDATE' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-primary shadow-[0_0_8px_rgba(37,99,235,0.3)]'}`} />
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="text-sm font-bold text-foreground">{log.userEmail}</span>
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${log.action === 'MARK_UPDATE' ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                                                            {log.action}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-600 leading-relaxed font-mono bg-slate-100 p-3 rounded-xl border border-slate-200 mt-2">
                                                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center flex flex-col items-center gap-4">
                                        <div className="p-4 bg-white/5 rounded-full"><AlertCircle className="w-8 h-8 opacity-20" /></div>
                                        <div className="text-muted-foreground italic text-xs">No audit signals detected.</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border bg-slate-50">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
                                            {activeTab === 'announcements' ? 'Title' : 'Identification'}
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
                                            {activeTab === 'subjects' ? 'Code' : (activeTab === 'announcements' ? 'Category' : 'Contact')}
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
                                            {activeTab === 'students' ? 'Subjects' : (activeTab === 'staff' ? 'Role' : (activeTab === 'announcements' ? 'Priority' : 'Faculty'))}
                                        </th>
                                        {activeTab === 'students' && (
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Finance</th>
                                        )}
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border font-medium">
                                    {getFilteredData().map((item, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="text-foreground font-bold">
                                                    {item.name || item.title}
                                                    {user?.id === item.id && <span className="text-[10px] text-primary ml-1 font-bold bg-primary/10 px-1 rounded">(You)</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground font-mono text-[11px]">
                                                {item.email || item.code || item.type}
                                            </td>
                                            <td className="px-6 py-4">
                                                {activeTab === 'students' ? (
                                                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                        {item.studentSubjects?.length > 0 ? (
                                                            item.studentSubjects.map((s, idx) => (
                                                                <span key={idx} className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-bold">{s.subject.code}</span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[9px] text-orange-600 font-bold">No Subjects</span>
                                                        )}
                                                    </div>
                                                ) : activeTab === 'staff' ? (
                                                    <span className="text-[10px] bg-blue-400/10 text-blue-400 px-2 py-1 rounded-lg border border-blue-400/20 uppercase font-bold">Faculty</span>
                                                ) : activeTab === 'announcements' ? (
                                                    <span className={`text-[10px] px-2 py-1 rounded-lg border uppercase font-bold ${item.priority === 3 ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                                                        item.priority === 2 ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' :
                                                            'bg-blue-400/10 text-blue-400 border-blue-400/20'
                                                        }`}>
                                                        {item.priority === 3 ? 'Critical' : item.priority === 2 ? 'Important' : 'Info'}
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.staffAssignments?.length > 0 ? (
                                                            item.staffAssignments.map((a, idx) => (
                                                                <span key={idx} className="text-[10px] bg-white/5 px-2 py-1 rounded-lg border border-white/10">{a.staff.name}</span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[10px] text-orange-400 italic">Unassigned</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            {activeTab === 'students' && (
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleToggleFee(item.id, item.feeRecord?.feeClearedManual)}
                                                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${(item.feeRecord?.feeClearedAuto || item.feeRecord?.feeClearedManual)
                                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'
                                                            }`}
                                                    >
                                                        {(item.feeRecord?.feeClearedAuto || item.feeRecord?.feeClearedManual) ? 'CLEARED' : 'MARK PAID'}
                                                    </button>
                                                    <div className="text-[10px] mt-1 text-muted-foreground font-mono">
                                                        Bal: ₹{(item.feeRecord?.feeClearedAuto || item.feeRecord?.feeClearedManual) ? 0 : (item.feeRecord?.feeBalance || 0)}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {activeTab === 'students' && (
                                                        <button
                                                            onClick={() => {
                                                                setActiveStudent(item);
                                                                setShowStudentAssignModal(true);
                                                            }}
                                                            className="p-1.5 hover:bg-slate-100 rounded-lg text-primary transition-all"
                                                            title="Enroll in Subject"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {activeTab === 'subjects' && (
                                                        <button
                                                            onClick={() => {
                                                                setAssignData({ ...assignData, subjectId: item.id });
                                                                setShowAssignModal(true);
                                                            }}
                                                            className="p-1.5 hover:bg-slate-100 rounded-lg text-primary transition-all"
                                                            title="Assign Staff"
                                                        >
                                                            <LinkIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {activeTab !== 'announcements' && (
                                                        <button
                                                            onClick={() => handleEditClick(activeTab === 'subjects' ? 'subject' : (activeTab === 'staff' ? 'staff' : 'student'), item)}
                                                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {(activeTab !== 'staff' || user?.id !== item.id) && (
                                                        <button
                                                            onClick={() => handleDeleteItem(activeTab === 'subjects' ? 'subject' : (activeTab === 'staff' ? 'staff' : (activeTab === 'students' ? 'student' : 'announcement')), item.id)}
                                                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-600 transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Analytics & Insights */}
                <div className="space-y-8 text-sm">
                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <div className="flex items-center gap-2 mb-6 font-bold">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                            <h3>Subject Distribution</h3>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'Theory', val: subjects.filter(s => s.type === 'FULL_THEORY').length },
                                    { name: 'Lab', val: subjects.filter(s => s.type === 'FULL_LAB').length },
                                    { name: 'Both', val: subjects.filter(s => s.type === 'THEORY_WITH_LAB').length },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#666" fontSize={10} />
                                    <YAxis stroke="#666" fontSize={10} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                                    <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <h3 className="font-bold mb-4 opacity-70 uppercase tracking-widest text-[10px]">Quick Management</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'New Student', icon: GraduationCap, type: 'student' },
                                { label: 'New Faculty', icon: UserPlus, type: 'staff' },
                                { label: 'New Subject', icon: BookOpen, type: 'subject' },
                                { label: 'Settings', icon: Trash2, type: 'settings' },
                            ].map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (link.type !== 'settings') {
                                            setModalMode(link.type);
                                            setShowAddModal(true);
                                        }
                                    }}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-left flex flex-col gap-3 group"
                                >
                                    <link.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-[11px]">{link.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <h3 className="font-bold mb-4 opacity-70 uppercase tracking-widest text-[10px]">Bulk Operations</h3>
                        <div className="space-y-3">
                            <label className="flex flex-col p-4 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-all">
                                        <Upload className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-slate-800">Import Students</div>
                                        <div className="text-[9px] text-slate-500">Excel/CSV Format</div>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => handleBulkUpload('students', e)}
                                    disabled={uploadLoading}
                                />
                            </label>

                        <label className="flex flex-col p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-all">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-slate-800">Update Fee Balances</div>
                                        <div className="text-[9px] text-slate-500">Sync Financial Records</div>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => handleBulkUpload('fees', e)}
                                    disabled={uploadLoading}
                                />
                            </label>

                            <button
                                onClick={() => setShowCommonFeeModal(true)}
                                className="flex flex-col p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-200/50 rounded-lg group-hover:bg-amber-200 transition-all">
                                        <Wallet className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-xs text-slate-800">Assign Common Fee</div>
                                        <div className="text-[9px] text-slate-500">Add fee to all your students</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Enrollment Modal */}
            <AnimatePresence>
                {showStudentAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModals} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass w-full max-w-md p-8 rounded-3xl border border-white/10 relative z-10 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-xl font-bold">Enroll Student</h1>
                                <button onClick={closeModals} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Enrolling</div>
                                <div className="text-lg font-bold text-primary">{activeStudent?.name}</div>
                                <div className="text-[10px] font-mono text-muted-foreground">{activeStudent?.email}</div>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {subjects.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => handleAssignStudent(sub.id)}
                                        className="w-full p-4 glass border-white/5 hover:border-primary/50 text-left rounded-2xl transition-all flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-bold text-sm">{sub.name}</div>
                                            <div className="text-[10px] font-mono opacity-60">{sub.code}</div>
                                        </div>
                                        <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Standard Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModals} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass w-full max-w-md p-8 rounded-3xl border border-white/10 relative z-10 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Update' : 'Create New'} {modalMode}</h2>
                            <form onSubmit={handleAddItem} className="space-y-4">
                                {modalMode === 'announcement' ? (
                                    <>
                                        <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Title</label><input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. End Semester Exams" className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 text-foreground" /></div>
                                        <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Content</label><textarea required value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Enter message details..." className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 min-h-[100px] outline-none focus:ring-2 focus:ring-primary/20 text-foreground" /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Notice Type</label>
                                                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-foreground outline-none">
                                                    <option value="EXAM">Exam</option>
                                                    <option value="FEE">Fee</option>
                                                    <option value="GENERAL">General</option>
                                                    <option value="HOLIDAY">Holiday</option>
                                                </select>
                                            </div>
                                            <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Priority Level</label>
                                                <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-foreground outline-none">
                                                    <option value="1">Information (Low)</option>
                                                    <option value="2">Important (Medium)</option>
                                                    <option value="3">Emergency (High)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </>
                                ) : modalMode !== 'subject' ? (
                                    <>
                                        <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">{modalMode === 'student' ? 'Student Name' : 'Faculty Name'}</label><input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20" /></div>
                                        <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">College Email</label><input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20" /></div>
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                                {editingId ? 'New Password (Optional)' : 'Password'}
                                            </label>
                                            <input
                                                required={!editingId}
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder={editingId ? "Leave blank to keep current" : "Enter password"}
                                                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Subject Name</label><input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3" /></div>
                                        <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Code</label><input required type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 font-mono" /></div>
                                        <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Category</label>
                                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3">
                                                <option value="FULL_THEORY">Full Theory</option>
                                                <option value="FULL_LAB">Practical/Lab</option>
                                                <option value="THEORY_WITH_LAB">Hybrid (Theory+Lab)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Syllabus Content (For AI Q&A)</label>
                                            <textarea 
                                                value={formData.syllabusText} 
                                                onChange={(e) => setFormData({ ...formData, syllabusText: e.target.value })} 
                                                placeholder="Paste subject units, topics or learning outcomes here..." 
                                                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 min-h-[150px] text-xs leading-relaxed" 
                                            />
                                        </div>
                                    </>
                                )}

                                <button type="submit" className="w-full premium-gradient py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all mt-6">
                                    {editingId ? 'Update Changes' : 'Confirm and Save'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Staff Mapping Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModals} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass w-full max-w-md p-8 rounded-3xl border border-white/10 relative z-10 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6">Subject Allocation</h2>
                            <form onSubmit={handleAssignStaff} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Faculty Member</label>
                                    <select required value={assignData.staffId} onChange={(e) => setAssignData({ ...assignData, staffId: e.target.value })} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 font-medium">
                                        <option value="">Select Faculty...</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
                                    <div>
                                        <div className="text-[10px] text-primary font-bold uppercase tracking-wider">Linking To</div>
                                        <div className="font-bold">{subjects.find(s => s.id === assignData.subjectId)?.name}</div>
                                    </div>
                                </div>
                                <button type="submit" className="w-full premium-gradient py-4 rounded-xl font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-all">Create Connection</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Common Fee Modal */}
            <AnimatePresence>
                {showCommonFeeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModals}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-xl relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-amber-500" />
                                    Assign Common Fee
                                </h3>
                                <button onClick={closeModals} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAssignCommonFee} className="p-6 space-y-6">
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p>This fee will be instantly added to the balance of <strong>every student</strong> under your mentorship and will automatically relock their hall tickets.</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2 text-left">Fee Amount (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={commonFeeAmount}
                                            onChange={(e) => setCommonFeeAmount(e.target.value)}
                                            required
                                            min="1"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-slate-800 font-bold outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                                            placeholder="e.g. 500"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={addingCommonFee || !commonFeeAmount}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                                >
                                    {addingCommonFee ? 'Applying Fee...' : 'Apply Common Fee'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
