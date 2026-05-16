import { useState, useEffect } from 'react';
import { 
    Building2, 
    Users, 
    GraduationCap, 
    Shield, 
    Plus, 
    Search, 
    Trash2, 
    Settings, 
    Edit,
    TrendingUp, 
    Megaphone,
    Palette,
    ExternalLink,
    ChevronRight,
    Globe,
    Layers,
    Monitor,
    Layout,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    UserPlus,
    CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AreaChart,
    Area,
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer
} from 'recharts';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import LoadingScreen from '../../components/LoadingScreen';

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ colleges: 0, users: 0, students: 0, mentors: 0, growthData: [] });
    const [colleges, setColleges] = useState([]);
    const [logs, setLogs] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInitModal, setShowInitModal] = useState(false);
    const [newCollege, setNewCollege] = useState({ name: '', domain: '', branding: { primaryColor: '#7c3aed' } });
    const [searchQuery, setSearchQuery] = useState('');
    const [isDepartmentView, setIsDepartmentView] = useState(true);
    const [activeTab, setActiveTab] = useState('institutions');

    useEffect(() => {
        fetchData();
        fetchLogs();
        fetchUsers();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, collegeRes] = await Promise.all([
                api.get('/superadmin/stats'),
                api.get('/superadmin/colleges')
            ]);
            setStats(statsRes.data);
            setColleges(collegeRes.data);
        } catch (err) {
            toast.error("Failed to sync system data.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await api.get('/superadmin/logs');
            setLogs(res.data);
        } catch (err) {
            console.error("Failed to fetch logs");
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/superadmin/users');
            setAllUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch global users");
        }
    };

    const handleImpersonate = async (userId) => {
        try {
            const res = await api.post(`/superadmin/impersonate/${userId}`);
            // Save admin session to restore later
            sessionStorage.setItem('adminToken', localStorage.getItem('token'));
            sessionStorage.setItem('adminUser', localStorage.getItem('user'));
            
            // Switch to impersonated user
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            toast.success(`Impersonating ${res.data.user.name}...`);
            window.location.href = '/'; // Refresh to apply new role
        } catch (err) {
            toast.error("Impersonation failed.");
        }
    };

    const handleDeleteCollege = async (id) => {
        if (!window.confirm("CRITICAL: This will delete the entire institutional container and all its data. Proceed?")) return;
        try {
            await api.delete(`/superadmin/colleges/${id}`);
            toast.success("Institutional partition purged.");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete container.");
        }
    };

    const handleInitialize = async (e) => {
        e.preventDefault();
        try {
            await api.post('/superadmin/colleges', newCollege);
            toast.success("New institutional partition deployed.");
            setShowInitModal(false);
            setNewCollege({ name: '', domain: '', branding: { primaryColor: '#7c3aed' } });
            fetchData();
        } catch (err) {
            toast.error("Deployment failed.");
        }
    };

    const filteredColleges = colleges.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.domain?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = allUsers.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.college?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <LoadingScreen message="Accessing Secure Terminal..." />;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Impersonation Banner */}
            {user?.isImpersonated && (
                <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-2xl animate-bounce border border-emerald-500/30">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-bold tracking-tight">SUPPORT MODE: Impersonating <span className="text-emerald-400 underline">{user.name}</span></span>
                    </div>
                    <button 
                        onClick={() => {
                            localStorage.setItem('token', sessionStorage.getItem('adminToken'));
                            localStorage.setItem('user', sessionStorage.getItem('adminUser'));
                            sessionStorage.removeItem('adminToken');
                            sessionStorage.removeItem('adminUser');
                            window.location.href = '/superadmin';
                        }}
                        className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Return to Admin
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent uppercase italic">
                        Control Center
                    </h1>
                    <p className="text-muted-foreground font-medium italic mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        System is operational. Multi-tenant node status: Healthy.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-sm">
                        {['institutions', 'users', 'logs'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setShowInitModal(true)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        Init Container
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Nodes', value: stats.colleges, icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Users', value: stats.users, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total Mentors', value: stats.mentors, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Total Students', value: stats.students, icon: UserPlus, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -5 }}
                        className="glass p-6 rounded-[2.5rem] border border-slate-200 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all"
                    >
                        <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-all duration-700`} />
                        <stat.icon className={`w-8 h-8 ${stat.color} mb-4 relative z-10`} />
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black relative z-10">{stat.label}</p>
                        <h2 className="text-4xl font-black mt-2 tabular-nums relative z-10 tracking-tighter">{stat.value}</h2>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {activeTab === 'institutions' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`flex p-1 bg-slate-100 rounded-xl border border-slate-200`}>
                                        <button 
                                            onClick={() => setIsDepartmentView(true)}
                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isDepartmentView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            Department View
                                        </button>
                                        <button 
                                            onClick={() => setIsDepartmentView(false)}
                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!isDepartmentView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            Institutional View
                                        </button>
                                    </div>
                                    <div className="h-4 w-[1px] bg-slate-200" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Showing {filteredColleges.length} Active Partitions
                                    </p>
                                </div>
                                <div className="relative group w-full md:w-64">
                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Search partitions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-12 pr-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {filteredColleges.map((college, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={college.id} 
                                        className="glass p-5 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between group hover:border-slate-400 hover:shadow-2xl transition-all bg-white/50 backdrop-blur-sm gap-4"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl group-hover:scale-110 transition-transform">
                                                {college.name[0]}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-slate-800 text-lg tracking-tight">
                                                        {isDepartmentView 
                                                            ? (college.users?.[0]?.department || college.name) 
                                                            : college.name}
                                                    </h4>
                                                    {isDepartmentView && college.users?.[0]?.department && (
                                                        <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                                                            {college.name}
                                                        </span>
                                                    )}
                                                    {!college.users?.[0]?.department && isDepartmentView && (
                                                        <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 border border-amber-100">
                                                            Dept Unassigned
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                                    <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> {college.domain || 'no-domain.com'}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1.5 text-primary"><Users className="w-3 h-3" /> {college._count.users} Users</span>
                                                </div>
                                            </div>
                                        </div>

                                            <div className="flex items-center gap-3 md:opacity-0 md:group-hover:opacity-100 transition-all justify-end">
                                                <div className="flex items-center gap-2 mr-4 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                                    <span className={`text-[8px] font-black uppercase tracking-tighter ${college.isMaintenanceMode ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {college.isMaintenanceMode ? 'Maintenance' : 'Live'}
                                                    </span>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            api.post(`/superadmin/colleges/${college.id}/maintenance`, { isMaintenanceMode: !college.isMaintenanceMode })
                                                                .then(() => {
                                                                    toast.success(`Node ${college.isMaintenanceMode ? 'Activated' : 'Locked'}`);
                                                                    fetchData();
                                                                });
                                                        }}
                                                        className={`w-8 h-4 rounded-full p-0.5 transition-all ${college.isMaintenanceMode ? 'bg-amber-500' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-all ${college.isMaintenanceMode ? 'translate-x-4' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const currentWorkflow = college.workflow || [];
                                                        const label = prompt("Enter new Clearance Step (e.g. Library, Lab):");
                                                        if (label) {
                                                            const newWorkflow = [...currentWorkflow, { id: Date.now().toString(), label, required: true }];
                                                            api.put(`/superadmin/colleges/${college.id}`, { workflow: newWorkflow })
                                                                .then(() => {
                                                                    toast.success("Workflow Logic Updated");
                                                                    fetchData();
                                                                });
                                                        }
                                                    }}
                                                    className="p-2.5 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm"
                                                    title="Configure Workflow"
                                                >
                                                    <Layers className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const newDept = prompt("Enter Department Name for this Mentor:", college.users?.[0]?.department || "");
                                                        if (newDept !== null && college.users?.[0]?.id) {
                                                            api.put(`/superadmin/users/${college.users[0].id}`, { department: newDept })
                                                                .then(() => {
                                                                    toast.success("Department updated!");
                                                                    fetchData();
                                                                })
                                                                .catch(() => toast.error("Update failed."));
                                                        }
                                                    }}
                                                    className="p-2.5 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-800 transition-all shadow-sm"
                                                    title="Edit Department"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                {college.users?.[0]?.id && (
                                                    <button 
                                                        onClick={() => handleImpersonate(college.users[0].id)}
                                                        className="p-2.5 hover:bg-emerald-50 rounded-xl border border-transparent hover:border-emerald-100 text-slate-400 hover:text-emerald-600 transition-all shadow-sm"
                                                        title="Impersonate Mentor"
                                                    >
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteCollege(college.id)}
                                                    className="p-2.5 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 text-slate-300 hover:text-red-500 transition-all shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className="w-[1px] h-6 bg-slate-200 mx-1" />
                                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                            </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="glass rounded-[2rem] border border-slate-200 overflow-hidden bg-white shadow-sm">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-primary" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Global User Directory</h3>
                                </div>
                                <div className="relative group w-64">
                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Filter users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2 text-xs focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            <th className="px-6 py-4">Identity</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Institutional Node</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredUsers.map((u, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-all group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            {u.name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-sm">{u.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                                                        u.role === 'SUPERADMIN' ? 'bg-slate-900 text-white' :
                                                        u.role === 'MENTOR' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-bold text-slate-600 italic">@{u.college?.name || 'ROOT'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button 
                                                        onClick={() => handleImpersonate(u.id)}
                                                        className="p-2 hover:bg-emerald-50 rounded-xl text-slate-300 hover:text-emerald-600 transition-all"
                                                        title="Impersonate"
                                                    >
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="glass rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm bg-white">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">System Activity Ledger</h3>
                                <button onClick={fetchLogs} className="text-[10px] font-black text-primary hover:underline">Refresh Logs</button>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
                                {logs.length > 0 ? logs.map((log, i) => (
                                    <div key={i} className="p-5 hover:bg-slate-50 transition-all group flex items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                <TrendingUp className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                                    <span className="text-sm font-bold text-slate-900">{log.userEmail}</span>
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 uppercase tracking-tighter">
                                                        {log.action}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-primary italic">
                                                        @{log.college?.name}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium font-mono">
                                                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-1 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-20 text-center text-slate-400 italic text-sm">No activity logs recorded yet.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Analytics & Tools */}
                <div className="space-y-6">
                    <div className="glass p-8 rounded-[2.5rem] border border-slate-200 bg-white">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                System Health
                            </h3>
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-tighter">Healthy</span>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.growthData || []}>
                                    <defs>
                                        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.2} />
                                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="val" stroke="#7c3aed" strokeWidth={3} fill="url(#growthGrad)" dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic mt-6 text-center">System-wide registration velocity over the last 30 days.</p>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border border-slate-200 bg-slate-900 text-white shadow-2xl">
                        <h3 className="font-bold mb-6 flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-emerald-400" />
                            Global Alert
                        </h3>
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">Broadcast a priority message to every user across all institutional nodes.</p>
                        <textarea 
                            placeholder="Maintenance alert..." 
                            className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-emerald-400/50 transition-all placeholder:text-slate-600 min-h-[100px]"
                        />
                        <button className="w-full mt-4 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                            Push Broadcast
                        </button>
                    </div>
                </div>
            </div>

            {/* Initialize Modal */}
            <AnimatePresence>
                {showInitModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInitModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-xl relative z-10 shadow-2xl border border-white/20"
                        >
                            <div className="flex items-center gap-6 mb-10">
                                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                                    <Monitor className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Initialize Container</h2>
                                    <p className="text-slate-500 font-medium italic">Provision a new institutional partition.</p>
                                </div>
                            </div>

                            <form onSubmit={handleInitialize} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Entity Name</label>
                                    <input 
                                        autoFocus
                                        required
                                        type="text" 
                                        placeholder="E.g. Tech University"
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-primary/30 transition-all font-bold"
                                        value={newCollege.name}
                                        onChange={e => setNewCollege({...newCollege, name: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Assigned Domain</label>
                                    <div className="relative">
                                        <Globe className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="institution.edu"
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-16 pr-6 py-4 text-lg focus:outline-none focus:border-primary/30 transition-all font-bold"
                                            value={newCollege.domain}
                                            onChange={e => setNewCollege({...newCollege, domain: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Primary Signature</label>
                                    <div className="flex items-center gap-4 p-2 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                        <input 
                                            type="color" 
                                            className="w-16 h-16 rounded-xl border-none cursor-pointer bg-transparent"
                                            value={newCollege.branding.primaryColor}
                                            onChange={e => setNewCollege({...newCollege, branding: { primaryColor: e.target.value }})}
                                        />
                                        <span className="text-slate-400 font-mono font-bold">{newCollege.branding.primaryColor}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setShowInitModal(false)}
                                        className="flex-1 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] bg-primary text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/30"
                                    >
                                        Deploy Infrastructure
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
