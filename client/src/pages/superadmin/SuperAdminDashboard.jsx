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
    CreditCard,
    BookOpen,
    Trophy,
    Home,
    Activity
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { getPageTitle, getCanonical } from '../../lib/seo';
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
import { SkeletonStats, SkeletonTable } from '../../components/Skeletons';

export default function SuperAdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ colleges: 0, users: 0, students: 0, mentors: 0, staff: 0, pendingClearances: 0, completedClearances: 0, growthData: [], collegeStats: [] });
    const [colleges, setColleges] = useState([]);
    const [logs, setLogs] = useState([]);
    const [logPagination, setLogPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [allUsers, setAllUsers] = useState([]);
    const [userPagination, setUserPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [userFilters, setUserFilters] = useState({ search: '', role: '', collegeId: '', sortBy: 'createdAt', sortOrder: 'desc' });
    const [loginHistory, setLoginHistory] = useState([]);
    const [loginHistoryPagination, setLoginHistoryPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [loginHistoryFilters, setLoginHistoryFilters] = useState({ success: '', email: '', dateFrom: '', dateTo: '' });
    const [loginStats, setLoginStats] = useState(null);
    const [apiKeys, setApiKeys] = useState([]);
    const [apiKeyPagination, setApiKeyPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [newApiKey, setNewApiKey] = useState({ name: '', collegeId: '', permissions: ['READ'], expiresInDays: '' });
    const [createdApiKey, setCreatedApiKey] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [showInitModal, setShowInitModal] = useState(false);
    const [newCollege, setNewCollege] = useState({ name: '', domain: '', branding: { primaryColor: '#7c3aed' } });
    
    // Workflow configurator states
    const [selectedCollegeForWorkflow, setSelectedCollegeForWorkflow] = useState(null);
    const [workflowSteps, setWorkflowSteps] = useState([]);
    const [newStepLabel, setNewStepLabel] = useState('');
    const [newStepCategory, setNewStepCategory] = useState('other');
    const [newStepRequired, setNewStepRequired] = useState(true);

    // Edit branding states
    const [selectedCollegeForEdit, setSelectedCollegeForEdit] = useState(null);
    const [editCollegeForm, setEditCollegeForm] = useState({ name: '', domain: '', logoUrl: '', primaryColor: '#7c3aed', secondaryColor: '#a855f7', department: '', affiliationText: '', controllerName: '', principalName: '' });

    // Global Alert broadcast states
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastContent, setBroadcastContent] = useState('');
    const [broadcastPriority, setBroadcastPriority] = useState('1');
    const [broadcasting, setBroadcasting] = useState(false);
    const [broadcasts, setBroadcasts] = useState([]);
    const [broadcastPagination, setBroadcastPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

    const [searchQuery, setSearchQuery] = useState('');
    const [isDepartmentView, setIsDepartmentView] = useState(true);
    const [activeTab, setActiveTab] = useState('institutions');

    // RBAC states
    const [roles, setRoles] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', description: '', collegeId: '', permissions: [] });

    useEffect(() => {
        fetchData();
        fetchLogs(1);
        fetchUsers(1);
        fetchRoles();
        fetchLoginHistory(1);
        fetchLoginStats();
        fetchApiKeys(1);
        fetchSettings();
        fetchBroadcasts(1);
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

    const fetchLogs = async (page = 1) => {
        try {
            const params = { page, limit: logPagination.limit };
            const res = await api.get('/superadmin/logs', { params });
            setLogs(res.data.data);
            setLogPagination(prev => ({ ...prev, page: res.data.page, total: res.data.total, totalPages: res.data.totalPages }));
        } catch (err) {
            toast.error("Failed to fetch activity logs.");
        }
    };

    const fetchUsers = async (page = 1) => {
        try {
            const params = { ...userFilters, page, limit: userPagination.limit };
            const res = await api.get('/superadmin/users', { params });
            setAllUsers(res.data.data);
            setUserPagination(prev => ({ ...prev, page: res.data.page, total: res.data.total, totalPages: res.data.totalPages }));
        } catch (err) {
            toast.error("Failed to fetch global users.");
        }
    };

    const fetchLoginHistory = async (page = 1) => {
        try {
            const params = { ...loginHistoryFilters, page, limit: loginHistoryPagination.limit };
            const res = await api.get('/superadmin/login-history', { params });
            setLoginHistory(res.data.data);
            setLoginHistoryPagination(prev => ({ ...prev, page: res.data.page, total: res.data.total, totalPages: res.data.totalPages }));
        } catch (err) {
            toast.error("Failed to fetch login history.");
        }
    };

    const fetchLoginStats = async () => {
        try {
            const res = await api.get('/superadmin/login-stats');
            setLoginStats(res.data);
        } catch (err) {
            toast.error("Failed to fetch login statistics.");
        }
    };

    const fetchApiKeys = async (page = 1) => {
        try {
            const res = await api.get('/superadmin/api-keys', { params: { page, limit: apiKeyPagination.limit } });
            setApiKeys(res.data.data);
            setApiKeyPagination(prev => ({ ...prev, page: res.data.page, total: res.data.total, totalPages: res.data.totalPages }));
        } catch (err) {
            toast.error("Failed to fetch API keys.");
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/superadmin/settings');
            setSettings(res.data);
        } catch (err) {
            toast.error("Failed to fetch system settings.");
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await api.get('/superadmin/roles');
            setRoles(res.data);
        } catch (err) {
            toast.error("Failed to fetch roles.");
        }
    };

    const fetchBroadcasts = async (page = 1) => {
        try {
            const params = { page, limit: broadcastPagination.limit };
            const res = await api.get('/superadmin/broadcasts', { params });
            setBroadcasts(res.data.data);
            setBroadcastPagination(prev => ({ ...prev, page: res.data.page, total: res.data.total, totalPages: res.data.totalPages }));
        } catch (err) {
            toast.error("Failed to fetch broadcast history.");
        }
    };

    const handleAssignRole = async (userId, customRoleId) => {
        try {
            await api.post(`/superadmin/users/${userId}/assign-role`, { customRoleId: customRoleId || null });
            toast.success(customRoleId ? 'Custom role assigned' : 'Custom role removed');
            fetchUsers(userPagination.page);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to assign role.");
        }
    };

    const handleImpersonate = async (userId) => {
        try {
            const res = await api.post(`/superadmin/impersonate/${userId}`);
            const { token, user: impersonatedUser } = res.data;
            
            sessionStorage.setItem('adminToken', localStorage.getItem('token'));
            sessionStorage.setItem('adminUser', localStorage.getItem('user'));
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(impersonatedUser));
            
            toast.success(`Assuming session of ${impersonatedUser.name}`);
            
            if (impersonatedUser.role === 'MENTOR') {
                window.location.href = '/mentor';
            } else if (impersonatedUser.role === 'STAFF') {
                window.location.href = '/staff';
            } else if (impersonatedUser.role === 'STUDENT') {
                window.location.href = '/student';
            } else {
                window.location.href = '/';
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to impersonate user");
        }
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        try {
            await api.post('/superadmin/roles', newRole);
            toast.success("Custom role deployed successfully!");
            setShowRoleModal(false);
            setNewRole({ name: '', description: '', collegeId: '', permissions: [] });
            fetchRoles();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create role.");
        }
    };

    const handleDeleteRole = async (id) => {
        if (!window.confirm("Delete this custom role?")) return;
        try {
            await api.delete(`/superadmin/roles/${id}`);
            toast.success("Role purged.");
            fetchRoles();
        } catch (err) {
            toast.error("Failed to delete role.");
        }
    };

    // Handler for saving clearance workflow steps
    const handleSaveWorkflow = async () => {
        try {
            await api.put(`/superadmin/colleges/${selectedCollegeForWorkflow.id}`, { workflow: workflowSteps });
            toast.success("Institutional clearance workflow pipeline saved!");
            setSelectedCollegeForWorkflow(null);
            fetchData();
        } catch (err) {
            toast.error("Failed to apply new clearance workflow.");
        }
    };

    const handleAddWorkflowStep = () => {
        if (!newStepLabel.trim()) {
            toast.error("Clearance step label cannot be empty.");
            return;
        }
        const newStep = {
            id: Date.now().toString(),
            label: newStepLabel.trim(),
            type: newStepCategory,
            required: newStepRequired
        };
        setWorkflowSteps([...workflowSteps, newStep]);
        setNewStepLabel('');
        setNewStepCategory('other');
        setNewStepRequired(true);
    };

    const handleRemoveWorkflowStep = (stepId) => {
        setWorkflowSteps(workflowSteps.filter(s => s.id !== stepId));
    };

    const handleToggleStepRequired = (stepId) => {
        setWorkflowSteps(workflowSteps.map(s => s.id === stepId ? { ...s, required: !s.required } : s));
    };

    // Handler for saving college branding & basic configuration
    const handleSaveCollegeEdit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/superadmin/colleges/${selectedCollegeForEdit.id}`, editCollegeForm);
            toast.success("Visual branding & college parameters updated successfully!");
            setSelectedCollegeForEdit(null);
            fetchData();
        } catch (err) {
            toast.error("Failed to update institutional container.");
        }
    };

    // Handler for pushing global alert/broadcast
    const handlePushBroadcast = async () => {
        if (!broadcastTitle.trim() || !broadcastContent.trim()) {
            toast.error("Please provide both alert header and descriptive message body.");
            return;
        }
        setBroadcasting(true);
        try {
            await api.post('/superadmin/broadcast', {
                title: broadcastTitle.trim(),
                content: broadcastContent.trim(),
                priority: parseInt(broadcastPriority),
                type: 'SYSTEM'
            });
            toast.success("Priority system-wide alert broadcasted to all node partitions.");
            setBroadcastTitle('');
            setBroadcastContent('');
            setBroadcastPriority('1');
            fetchLogs();
        } catch (err) {
            toast.error("Failed to submit broadcast payload.");
        } finally {
            setBroadcasting(false);
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

    if (loading) return (
        <div className="space-y-8 p-4 bg-slate-950 min-h-screen text-slate-100">
            <SkeletonStats count={3} />
            <SkeletonTable rows={4} cols={4} />
        </div>
    );

    return (
        <>
            <Helmet>
                <title>{getPageTitle('Super Admin Dashboard')}</title>
                <meta name="description" content="Super admin panel for managing institutions, users, system settings, broadcasts, API keys, and monitoring NoDueNest." />
                <meta property="og:title" content={getPageTitle('Super Admin Dashboard')} />
                <meta name="twitter:title" content={getPageTitle('Super Admin Dashboard')} />
                <link rel="canonical" href={getCanonical('/superadmin')} />
                <meta name="robots" content="noindex" />
            </Helmet>
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
                    <div className="text-muted-foreground font-medium italic mt-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        System is operational. Multi-tenant node status: Healthy.
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-sm flex-wrap">
                        {['institutions', 'users', 'logs', 'login', 'api-keys', 'settings', 'rbac'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab === 'rbac' ? 'Access' : tab === 'api-keys' ? 'API Keys' : tab === 'login' ? 'Logins' : tab}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Total Nodes', value: stats.colleges, icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Users', value: stats.users, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Mentors', value: stats.mentors, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Students', value: stats.students, icon: UserPlus, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Staff', value: stats.staff, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Cleared', value: stats.completedClearances, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
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

                                            <div className="flex items-center gap-2.5 justify-end">
                                                {/* Maintenance Toggle */}
                                                <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                                    <span className={`text-[8px] font-black uppercase tracking-tighter ${college.isMaintenanceMode ? 'text-amber-600 animate-pulse' : 'text-emerald-600'}`}>
                                                        {college.isMaintenanceMode ? 'Locked' : 'Live'}
                                                    </span>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            api.post(`/superadmin/colleges/${college.id}/maintenance`, { isMaintenanceMode: !college.isMaintenanceMode })
                                                                .then(() => {
                                                                    toast.success(`Node ${college.isMaintenanceMode ? 'Activated & Opened' : 'Locked for Maintenance'}`);
                                                                    fetchData();
                                                                });
                                                        }}
                                                        className={`w-7 h-4 rounded-full p-0.5 transition-all ${college.isMaintenanceMode ? 'bg-amber-500' : 'bg-slate-300'}`}
                                                    >
                                                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-all ${college.isMaintenanceMode ? 'translate-x-3' : 'translate-x-0'}`} />
                                                    </button>
                                                </div>

                                                {/* Workflow configurator button */}
                                                <button 
                                                    onClick={() => {
                                                        setSelectedCollegeForWorkflow(college);
                                                        setWorkflowSteps(college.workflow || []);
                                                    }}
                                                    className="p-2 bg-slate-50 hover:bg-violet-50 rounded-xl border border-slate-200/60 hover:border-violet-200 text-slate-500 hover:text-primary transition-all shadow-sm flex items-center justify-center"
                                                    title="Configure Clearance Workflow Node"
                                                >
                                                    <Layers className="w-4 h-4" />
                                                </button>

                                                {/* Edit branding & details button */}
                                                <button 
                                                    onClick={() => {
                                                        setSelectedCollegeForEdit(college);
                                                        setEditCollegeForm({
                                                            name: college.name,
                                                            domain: college.domain || '',
                                                            logoUrl: college.logoUrl || '',
                                                            primaryColor: college.primaryColor || '#7c3aed',
                                                            secondaryColor: college.secondaryColor || '#a855f7',
                                                            department: college.users?.[0]?.department || '',
                                                            affiliationText: college.affiliationText || '',
                                                            controllerName: college.controllerName || '',
                                                            principalName: college.principalName || ''
                                                        });
                                                    }}
                                                    className="p-2 bg-slate-50 hover:bg-amber-50 rounded-xl border border-slate-200/60 hover:border-amber-200 text-slate-500 hover:text-amber-600 transition-all shadow-sm flex items-center justify-center"
                                                    title="Configure Branding & Settings"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                {/* Delete button */}
                                                <button 
                                                    onClick={() => handleDeleteCollege(college.id)}
                                                    className="p-2 bg-slate-50 hover:bg-red-50 rounded-xl border border-slate-200/60 hover:border-red-100 text-slate-400 hover:text-red-600 transition-all shadow-sm flex items-center justify-center"
                                                    title="Purge College Node"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="glass rounded-[2rem] border border-slate-200 overflow-hidden bg-white shadow-sm">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-primary" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Global User Directory</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{userPagination.total} users</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Search name or email..."
                                            value={userFilters.search}
                                            onChange={(e) => setUserFilters(f => ({ ...f, search: e.target.value }))}
                                            onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
                                            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2 text-xs focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                        />
                                    </div>
                                    <select
                                        value={userFilters.role}
                                        onChange={(e) => { setUserFilters(f => ({ ...f, role: e.target.value })); fetchUsers(1); }}
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none"
                                    >
                                        <option value="">All Roles</option>
                                        <option value="STUDENT">Student</option>
                                        <option value="STAFF">Staff</option>
                                        <option value="MENTOR">Mentor</option>
                                    </select>
                                    <select
                                        value={userFilters.collegeId}
                                        onChange={(e) => { setUserFilters(f => ({ ...f, collegeId: e.target.value })); fetchUsers(1); }}
                                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none"
                                    >
                                        <option value="">All Colleges</option>
                                        {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button
                                        onClick={() => fetchUsers(1)}
                                        className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all"
                                    >
                                        Filter
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            <th className="px-6 py-4">Identity</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Institutional Node</th>
                                            <th className="px-6 py-4">Custom Role</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {allUsers.length > 0 ? allUsers.map((u, i) => (
                                            <tr key={u.id || i} className="hover:bg-slate-50 transition-all group">
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
                                                        u.role === 'STAFF' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-bold text-slate-600 italic">@{u.college?.name || 'ROOT'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={u.customRoleId || ''}
                                                        onChange={(e) => handleAssignRole(u.id, e.target.value)}
                                                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-bold text-slate-600 outline-none max-w-[130px]"
                                                    >
                                                        <option value="">No Role</option>
                                                        {roles.filter(r => !u.collegeId || r.collegeId === u.collegeId).map(r => (
                                                            <option key={r.id} value={r.id}>{r.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${u.disabled ? 'bg-red-500' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${u.disabled ? 'text-red-600' : 'text-emerald-600'}`}>{u.disabled ? 'Disabled' : 'Active'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => handleImpersonate(u.id)}
                                                            className="p-2 hover:bg-emerald-50 rounded-xl text-slate-300 hover:text-emerald-600 transition-all"
                                                            title="Impersonate"
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={async () => {
                                                                const newStatus = !u.disabled;
                                                                try {
                                                                    await api.patch(`/superadmin/users/${u.id}/status`, { disabled: newStatus });
                                                                    toast.success(newStatus ? 'User disabled' : 'User enabled');
                                                                    fetchUsers(userPagination.page);
                                                                } catch (err) {
                                                                    toast.error(err.response?.data?.message || 'Failed to update status');
                                                                }
                                                            }}
                                                            className={`p-2 rounded-xl transition-all ${u.disabled ? 'hover:bg-emerald-50 text-slate-300 hover:text-emerald-600' : 'hover:bg-red-50 text-slate-300 hover:text-red-600'}`}
                                                            title={u.disabled ? 'Enable' : 'Disable'}
                                                        >
                                                            {u.disabled ? <CheckCircle2 className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 italic">No users found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {userPagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 font-medium">Page {userPagination.page} of {userPagination.totalPages}</span>
                                    <div className="flex items-center gap-2">
                                        <button disabled={userPagination.page <= 1} onClick={() => fetchUsers(userPagination.page - 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-all">Prev</button>
                                        {Array.from({ length: Math.min(5, userPagination.totalPages) }, (_, i) => {
                                            const start = Math.max(1, userPagination.page - 2);
                                            const p = start + i;
                                            if (p > userPagination.totalPages) return null;
                                            return (
                                                <button key={p} onClick={() => fetchUsers(p)} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${p === userPagination.page ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{p}</button>
                                            );
                                        })}
                                        <button disabled={userPagination.page >= userPagination.totalPages} onClick={() => fetchUsers(userPagination.page + 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-all">Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="glass rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm bg-white">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">System Activity Ledger</h3>
                                <button onClick={() => fetchLogs(logPagination.page)} className="text-[10px] font-black text-primary hover:underline">Refresh</button>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
                                {logs.length > 0 ? logs.map((log, i) => (
                                    <div key={log.id || i} className="p-5 hover:bg-slate-50 transition-all group flex items-start justify-between gap-4">
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
                            {logPagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 font-medium">Page {logPagination.page} of {logPagination.totalPages}</span>
                                    <div className="flex items-center gap-2">
                                        <button disabled={logPagination.page <= 1} onClick={() => fetchLogs(logPagination.page - 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-all">Prev</button>
                                        {Array.from({ length: Math.min(5, logPagination.totalPages) }, (_, i) => {
                                            const start = Math.max(1, logPagination.page - 2);
                                            const p = start + i;
                                            if (p > logPagination.totalPages) return null;
                                            return (
                                                <button key={p} onClick={() => fetchLogs(p)} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${p === logPagination.page ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{p}</button>
                                            );
                                        })}
                                        <button disabled={logPagination.page >= logPagination.totalPages} onClick={() => fetchLogs(logPagination.page + 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-all">Next</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'login' && (
                        <div className="space-y-6">
                            {/* Login Stats Cards */}
                            {loginStats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total Attempts', value: loginStats.totalAttempts, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { label: 'Today Success', value: loginStats.successToday, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { label: 'Today Failed', value: loginStats.failedToday, icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
                                        { label: '24h Volume', value: loginStats.last24h, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
                                    ].map((stat, i) => (
                                        <div key={i} className="glass p-5 rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                                            <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{stat.label}</p>
                                            <h3 className="text-2xl font-black mt-1 tabular-nums">{stat.value}</h3>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Login History Table */}
                            <div className="glass rounded-[2rem] border border-slate-200 overflow-hidden bg-white shadow-sm">
                                <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Login Activity</h3>
                                        <span className="text-[10px] font-bold text-slate-400">{loginHistoryPagination.total} events</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <select
                                            value={loginHistoryFilters.success}
                                            onChange={(e) => { setLoginHistoryFilters(f => ({ ...f, success: e.target.value })); fetchLoginHistory(1); }}
                                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none"
                                        >
                                            <option value="">All Status</option>
                                            <option value="true">Success</option>
                                            <option value="false">Failed</option>
                                        </select>
                                        <input type="date" value={loginHistoryFilters.dateFrom} onChange={(e) => { setLoginHistoryFilters(f => ({ ...f, dateFrom: e.target.value })); fetchLoginHistory(1); }} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none" title="From date" />
                                        <input type="date" value={loginHistoryFilters.dateTo} onChange={(e) => { setLoginHistoryFilters(f => ({ ...f, dateTo: e.target.value })); fetchLoginHistory(1); }} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none" title="To date" />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">IP / Browser</th>
                                                <th className="px-6 py-4">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {loginHistory.length > 0 ? loginHistory.map((lh, i) => (
                                                <tr key={lh.id || i} className="hover:bg-slate-50 transition-all">
                                                    <td className="px-6 py-4 font-bold text-sm text-slate-800">{lh.user?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">{lh.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${lh.role === 'SUPERADMIN' ? 'bg-slate-900 text-white' : lh.role === 'MENTOR' ? 'bg-purple-100 text-purple-600' : lh.role === 'STAFF' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{lh.role || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${lh.success ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{lh.success ? 'Success' : 'Failed'}</span>
                                                        {lh.reason && <span className="ml-1.5 text-[9px] text-slate-400 italic">{lh.reason}</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] text-slate-500 font-mono">
                                                        {lh.ip || '-'} {lh.browser && <span className="text-slate-300">| {lh.browser}</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] text-slate-400 font-mono whitespace-nowrap">{new Date(lh.createdAt).toLocaleString()}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 italic">No login events recorded yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {loginHistoryPagination.totalPages > 1 && (
                                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400 font-medium">Page {loginHistoryPagination.page} of {loginHistoryPagination.totalPages}</span>
                                        <div className="flex items-center gap-2">
                                            <button disabled={loginHistoryPagination.page <= 1} onClick={() => fetchLoginHistory(loginHistoryPagination.page - 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-all">Prev</button>
                                            {Array.from({ length: Math.min(5, loginHistoryPagination.totalPages) }, (_, i) => {
                                                const start = Math.max(1, loginHistoryPagination.page - 2);
                                                const p = start + i;
                                                if (p > loginHistoryPagination.totalPages) return null;
                                                return (
                                                    <button key={p} onClick={() => fetchLoginHistory(p)} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${p === loginHistoryPagination.page ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{p}</button>
                                                );
                                            })}
                                            <button disabled={loginHistoryPagination.page >= loginHistoryPagination.totalPages} onClick={() => fetchLoginHistory(loginHistoryPagination.page + 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-all">Next</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'api-keys' && (
                        <div className="space-y-6">
                            <div className="glass rounded-[2rem] border border-slate-200 overflow-hidden bg-white shadow-sm">
                                <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-primary" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">API Key Management</h3>
                                    </div>
                                    <button onClick={() => { setCreatedApiKey(null); setShowApiKeyModal(true); }} className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> Generate Key
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                <th className="px-6 py-4">Name</th>
                                                <th className="px-6 py-4">Key Prefix</th>
                                                <th className="px-6 py-4">Created By</th>
                                                <th className="px-6 py-4">College</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Last Used</th>
                                                <th className="px-6 py-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {apiKeys.length > 0 ? apiKeys.map((k, i) => (
                                                <tr key={k.id || i} className="hover:bg-slate-50 transition-all">
                                                    <td className="px-6 py-4 font-bold text-sm text-slate-800">{k.name}</td>
                                                    <td className="px-6 py-4"><code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">{k.keyPrefix}...</code></td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">{k.user?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4 text-xs text-slate-500">{k.college?.name || 'Global'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${k.active ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{k.active ? 'Active' : 'Revoked'}</span>
                                                        {k.expiresAt && new Date(k.expiresAt) < new Date() && <span className="ml-1 text-[9px] text-red-400">Expired</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] text-slate-400 font-mono">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={async () => { try { await api.patch(`/superadmin/api-keys/${k.id}/status`, { active: !k.active }); toast.success(k.active ? 'Key revoked' : 'Key activated'); fetchApiKeys(apiKeyPagination.page); } catch (e) { toast.error('Failed'); } }} className={`p-2 rounded-xl transition-all ${k.active ? 'hover:bg-red-50 text-slate-300 hover:text-red-600' : 'hover:bg-emerald-50 text-slate-300 hover:text-emerald-600'}`} title={k.active ? 'Revoke' : 'Activate'}>
                                                                {k.active ? <Trash2 className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400 italic">No API keys generated yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {apiKeyPagination.totalPages > 1 && (
                                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400 font-medium">Page {apiKeyPagination.page} of {apiKeyPagination.totalPages}</span>
                                        <div className="flex items-center gap-2">
                                            <button disabled={apiKeyPagination.page <= 1} onClick={() => fetchApiKeys(apiKeyPagination.page - 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-all">Prev</button>
                                            <button disabled={apiKeyPagination.page >= apiKeyPagination.totalPages} onClick={() => fetchApiKeys(apiKeyPagination.page + 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-all">Next</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* API Key Creation Modal */}
                            <AnimatePresence>
                                {showApiKeyModal && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!createdApiKey) setShowApiKeyModal(false); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[3rem] p-8 md:p-10 w-full max-w-lg relative z-10 shadow-2xl border border-slate-200/50">
                                            {createdApiKey ? (
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                                    </div>
                                                    <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">API Key Generated</h2>
                                                    <p className="text-sm text-slate-500 mb-6">Copy this key now. It will not be shown again.</p>
                                                    <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 mb-6">
                                                        <code className="text-xs font-mono break-all text-slate-800 select-all">{createdApiKey.fullKey}</code>
                                                    </div>
                                                    <button onClick={() => { navigator.clipboard.writeText(createdApiKey.fullKey); toast.success('Copied!'); }} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all mb-3">
                                                        Copy to Clipboard
                                                    </button>
                                                    <button onClick={() => { setShowApiKeyModal(false); setCreatedApiKey(null); fetchApiKeys(1); }} className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
                                                        Done
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-5 mb-8">
                                                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                                                            <Shield className="w-7 h-7 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h2 className="text-2xl font-black tracking-tight text-slate-900">Generate API Key</h2>
                                                            <p className="text-slate-500 text-sm italic">Create a secure API access credential.</p>
                                                        </div>
                                                    </div>
                                                    <form onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        try {
                                                            const payload = { name: newApiKey.name, permissions: newApiKey.permissions };
                                                            if (newApiKey.collegeId) payload.collegeId = newApiKey.collegeId;
                                                            if (newApiKey.expiresInDays) payload.expiresInDays = parseInt(newApiKey.expiresInDays);
                                                            const res = await api.post('/superadmin/api-keys', payload);
                                                            setCreatedApiKey(res.data);
                                                            toast.success('API key generated!');
                                                        } catch (err) {
                                                            toast.error(err.response?.data?.message || 'Failed');
                                                        }
                                                    }} className="space-y-5">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Key Name</label>
                                                            <input required type="text" placeholder="e.g. CI/CD Pipeline" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/30 transition-all font-bold" value={newApiKey.name} onChange={e => setNewApiKey({ ...newApiKey, name: e.target.value })} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Scope (College)</label>
                                                            <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/30 transition-all font-bold text-slate-700" value={newApiKey.collegeId} onChange={e => setNewApiKey({ ...newApiKey, collegeId: e.target.value })}>
                                                                <option value="">Global Access</option>
                                                                {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expires In (Days)</label>
                                                            <input type="number" min="1" max="365" placeholder="Leave empty for no expiry" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/30 transition-all font-bold" value={newApiKey.expiresInDays} onChange={e => setNewApiKey({ ...newApiKey, expiresInDays: e.target.value })} />
                                                        </div>
                                                        <div className="flex gap-4 pt-4">
                                                            <button type="button" onClick={() => setShowApiKeyModal(false)} className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                                                            <button type="submit" className="flex-[2] py-4 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">Generate</button>
                                                        </div>
                                                    </form>
                                                </>
                                            )}
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            {settings && (
                                <>
                                    <div className="glass rounded-[2rem] border border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Rate Limiting</h3>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {settings.rateLimits.map((rl, i) => (
                                                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                                    <div>
                                                        <span className="text-sm font-bold text-slate-800">{rl.name}</span>
                                                        <span className="ml-3 text-[9px] text-slate-400 font-mono">{rl.key}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs font-bold text-slate-500">{rl.max} req / {rl.timeWindow}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="glass rounded-[2rem] border border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">System Configuration</h3>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {[
                                                { label: 'Environment', value: settings.system.nodeEnv },
                                                { label: 'JWT Expiry', value: settings.system.jwtExpiry },
                                                { label: 'Bcrypt Rounds', value: settings.system.bcryptRounds },
                                                { label: 'Max Upload', value: `${(settings.system.maxUploadBytes / 1048576).toFixed(0)} MB` },
                                            ].map((s, i) => (
                                                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                                    <span className="text-sm font-bold text-slate-800">{s.label}</span>
                                                    <span className="text-xs font-mono text-slate-500">{s.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="glass rounded-[2rem] border border-slate-200 overflow-hidden bg-white shadow-sm">
                                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Feature Flags</h3>
                                        </div>
                                        <div className="divide-y divide-slate-50">
                                            {Object.entries(settings.features).map(([key, val]) => (
                                                <div key={key} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                                    <span className="text-sm font-bold capitalize text-slate-800">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${val ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{val ? 'Enabled' : 'Disabled'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                            {!settings && <div className="text-center py-16 text-slate-400 italic">Loading settings...</div>}
                        </div>
                    )}

                    {activeTab === 'rbac' && (
                        <div className="glass rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm bg-white">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-primary" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Role-Based Access Control</h3>
                                </div>
                                <button 
                                    onClick={() => setShowRoleModal(true)}
                                    className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Custom Role
                                </button>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto">
                                {roles.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-slate-400">
                                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-bold">No custom roles defined yet.</p>
                                    </div>
                                ) : roles.map(role => (
                                    <div key={role.id} className="p-5 border border-slate-200 rounded-2xl hover:border-primary/30 transition-all bg-slate-50 group flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-slate-900">{role.name}</h4>
                                                    <p className="text-xs text-slate-500">{role.description || 'No description'}</p>
                                                </div>
                                                <button onClick={() => handleDeleteRole(role.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="mb-4">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assigned to Node:</span>
                                                <div className="text-xs font-medium text-slate-700 mt-0.5">{role.college?.name}</div>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {role.permissions?.map((p, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[9px] font-black text-slate-600 uppercase tracking-tighter shadow-sm">
                                                        {p.replace('_', ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            <span>Users Assigned:</span>
                                            <span className="text-primary">{role._count?.users || 0}</span>
                                        </div>
                                    </div>
                                ))}
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
                        <p className="text-[11px] text-muted-foreground italic mt-6 text-center">System-wide registration velocity over the last 6 months.</p>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border border-slate-800 bg-slate-950 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-emerald-400">
                            <Megaphone className="w-5 h-5 text-emerald-400" />
                            Global System Alert
                        </h3>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">Broadcast an urgent marquee notice to every user across all institutional nodes.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Alert Header</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. Server Upgrade Notice"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-400/50 transition-all text-white placeholder:text-slate-600"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Urgency Priority</label>
                                <select 
                                    value={broadcastPriority}
                                    onChange={(e) => setBroadcastPriority(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-400/50 transition-all text-white"
                                >
                                    <option value="1">🔵 Informational (Low Priority)</option>
                                    <option value="2">🟡 Important Warning (Medium)</option>
                                    <option value="3">🔴 Critical Shutdown (High Priority)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1.5 ml-1">Notice Description</label>
                                <textarea 
                                    placeholder="Enter your priority announcement details..." 
                                    value={broadcastContent}
                                    onChange={(e) => setBroadcastContent(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs outline-none focus:border-emerald-400/50 transition-all placeholder:text-slate-600 min-h-[100px] text-white"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handlePushBroadcast}
                            disabled={broadcasting}
                            className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {broadcasting ? 'Transmitting Alert...' : 'Deploy Global Alert'}
                        </button>

                        {broadcasts.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5" />
                                    Recent Broadcasts
                                </h4>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {broadcasts.slice(0, 5).map((b, i) => (
                                        <div key={b.id || i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-white/90 truncate">{b.title}</span>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                                                    b.priority >= 3 ? 'bg-red-500/20 text-red-400' :
                                                    b.priority >= 2 ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                    P{b.priority}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 truncate">{b.content}</p>
                                            <p className="text-[8px] text-slate-600 mt-1">{new Date(b.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                                {broadcastPagination.totalPages > 1 && (
                                    <button onClick={() => fetchBroadcasts(1)} className="w-full mt-2 text-[9px] font-black text-emerald-400/70 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                                        View All ({broadcastPagination.total})
                                    </button>
                                )}
                            </div>
                        )}
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

                {/* RBAC Role Creation Modal */}
                {showRoleModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowRoleModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-2xl relative z-10 shadow-2xl border border-slate-200/50"
                        >
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <Shield className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Define Custom Role</h2>
                                    <p className="text-slate-500 font-medium italic text-sm">Create granular access permissions for a specific partition.</p>
                                </div>
                            </div>
                            <form onSubmit={handleCreateRole} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Role Title</label>
                                        <input required type="text" placeholder="e.g. Financial Auditor" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary/30 transition-all font-bold" value={newRole.name} onChange={e => setNewRole({...newRole, name: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assign to Node</label>
                                        <select required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary/30 transition-all font-bold text-slate-700" value={newRole.collegeId} onChange={e => setNewRole({...newRole, collegeId: e.target.value})}>
                                            <option value="">Select an Institution...</option>
                                            {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description (Optional)</label>
                                    <input type="text" placeholder="What can this role do?" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary/30 transition-all font-medium" value={newRole.description} onChange={e => setNewRole({...newRole, description: e.target.value})} />
                                </div>
                                <div className="space-y-3 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center justify-between">
                                        <span>System Privileges</span>
                                        <span className="text-primary">{newRole.permissions.length} Selected</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-[200px] overflow-y-auto">
                                        {['MANAGE_FEES', 'APPROVE_CLEARANCE', 'MANAGE_USERS', 'VIEW_REPORTS', 'MANAGE_SUBJECTS', 'OVERRIDE_PREDICTIONS'].map(perm => (
                                            <label key={perm} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${newRole.permissions.includes(perm) ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded text-primary focus:ring-primary/50"
                                                    checked={newRole.permissions.includes(perm)}
                                                    onChange={(e) => {
                                                        const current = newRole.permissions;
                                                        setNewRole({
                                                            ...newRole,
                                                            permissions: e.target.checked ? [...current, perm] : current.filter(p => p !== perm)
                                                        });
                                                    }}
                                                />
                                                <span className="text-[10px] font-black uppercase tracking-tight">{perm.replace('_', ' ')}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowRoleModal(false)} className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                                    <button type="submit" className="flex-[2] py-4 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">Deploy Role</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Interactive Clearance Workflow Pipeline Configurator Modal */}
                {selectedCollegeForWorkflow && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCollegeForWorkflow(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-8 md:p-10 w-full max-w-4xl relative z-10 shadow-2xl border border-slate-200/50 flex flex-col md:flex-row gap-8 overflow-hidden max-h-[90vh]"
                        >
                            {/* Left Column: List of Current pipeline steps */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="mb-6">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Pipeline Configurator</span>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">{selectedCollegeForWorkflow.name}</h2>
                                    <p className="text-slate-400 text-xs mt-1">Configure individual department clearance steps required for hall ticket release.</p>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                                    {workflowSteps.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-slate-50/50">
                                            <Layers className="w-10 h-10 mb-2 opacity-55 animate-pulse" />
                                            <span className="text-xs font-bold uppercase tracking-widest">No Active Nodes</span>
                                            <p className="text-[10px] text-slate-400 text-center px-6 mt-1">Add a department node using the form to start building the clearance pipeline.</p>
                                        </div>
                                    ) : (
                                        workflowSteps.map((step) => {
                                            const CategoryIcon = 
                                                step.type === 'library' ? BookOpen :
                                                step.type === 'fees' || step.type === 'financial' ? CreditCard :
                                                step.type === 'hostel' ? Home :
                                                step.type === 'sports' ? Trophy :
                                                step.type === 'academic' ? GraduationCap : Layers;

                                            return (
                                                <div key={step.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl group hover:border-slate-300 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white border border-slate-200/60 rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
                                                            <CategoryIcon className="w-5 h-5 text-slate-500" />
                                                        </div>
                                                        <div>
                                                            <h5 className="font-bold text-sm text-slate-800 tracking-tight">{step.label}</h5>
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{step.type}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleToggleStepRequired(step.id)}
                                                            className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${
                                                                step.required 
                                                                    ? 'bg-purple-50 border-purple-200 text-purple-600' 
                                                                    : 'bg-slate-100 border-slate-200 text-slate-400'
                                                            }`}
                                                        >
                                                            {step.required ? 'Required' : 'Optional'}
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoveWorkflowStep(step.id)}
                                                            className="p-2 hover:bg-red-50 rounded-xl text-slate-300 hover:text-red-500 transition-all border border-transparent hover:border-red-100 shadow-sm bg-white"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Vertical line on desktop */}
                            <div className="hidden md:block w-[1px] bg-slate-200" />

                            {/* Right Column: Node parameters builder */}
                            <div className="w-full md:w-[320px] flex flex-col justify-between min-h-0 gap-6">
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Add Clearance Step</h3>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Step Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Sports Equipment Department"
                                                value={newStepLabel}
                                                onChange={(e) => setNewStepLabel(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/20 transition-all font-bold text-slate-800"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Step Category</label>
                                            <select 
                                                value={newStepCategory}
                                                onChange={(e) => setNewStepCategory(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/20 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                                            >
                                                <option value="other">Layers - General/Other</option>
                                                <option value="library">BookOpen - Library Clearance</option>
                                                <option value="fees">CreditCard - Fees/Financial Dues</option>
                                                <option value="hostel">Home - Hostel & Mess Dues</option>
                                                <option value="sports">Trophy - Sports & Gym Dues</option>
                                                <option value="academic">GraduationCap - Academic Clearance</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-800">Lock Release Process</div>
                                                <p className="text-[9px] text-slate-400 mt-0.5">Hall ticket requires 100% completion.</p>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => setNewStepRequired(!newStepRequired)}
                                                className={`w-10 h-6 rounded-full p-0.5 transition-all ${newStepRequired ? 'bg-primary' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all ${newStepRequired ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        <button 
                                            type="button"
                                            onClick={handleAddWorkflowStep}
                                            className="w-full py-4 bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5"
                                        >
                                            <Plus className="w-4 h-4" /> Add Node to Pipeline
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6 mt-auto border-t border-slate-100">
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedCollegeForWorkflow(null)}
                                        className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-[0.98] transition-all"
                                    >
                                        Dismiss
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleSaveWorkflow}
                                        className="flex-1 bg-primary text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                                    >
                                        Save Pipeline
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* College Branding Visual Customization & Parameters Editor Modal */}
                {selectedCollegeForEdit && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCollegeForEdit(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-2xl relative z-10 shadow-2xl border border-white/20 overflow-hidden"
                        >
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-14 h-14 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-500 shadow-sm">
                                    <Settings className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Institutional Configuration</h2>
                                    <p className="text-slate-400 text-xs mt-0.5">Customize basic parameters and brand colors of {selectedCollegeForEdit.name}.</p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveCollegeEdit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Entity Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={editCollegeForm.name}
                                            onChange={e => setEditCollegeForm({...editCollegeForm, name: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/20 transition-all font-bold text-slate-800"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Domain</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={editCollegeForm.domain}
                                            onChange={e => setEditCollegeForm({...editCollegeForm, domain: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/20 transition-all font-bold text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department Name (e.g. CSE, AIML, ECE)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter department name for the Mentor..."
                                        value={editCollegeForm.department}
                                        onChange={e => setEditCollegeForm({...editCollegeForm, department: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/20 transition-all font-bold text-slate-800"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Institution Logo URL (Optional)</label>
                                    <input 
                                        type="url" 
                                        placeholder="https://example.com/logo.png"
                                        value={editCollegeForm.logoUrl}
                                        onChange={e => setEditCollegeForm({...editCollegeForm, logoUrl: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/20 transition-all font-bold text-slate-800"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Primary Theme Color</label>
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm">
                                            <input 
                                                type="color" 
                                                value={editCollegeForm.primaryColor}
                                                onChange={e => setEditCollegeForm({...editCollegeForm, primaryColor: e.target.value})}
                                                className="w-10 h-10 rounded-lg border-none cursor-pointer bg-transparent"
                                            />
                                            <span className="text-slate-600 font-mono font-bold text-xs uppercase">{editCollegeForm.primaryColor}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Secondary Accent Color</label>
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200/60 shadow-sm">
                                            <input 
                                                type="color" 
                                                value={editCollegeForm.secondaryColor}
                                                onChange={e => setEditCollegeForm({...editCollegeForm, secondaryColor: e.target.value})}
                                                className="w-10 h-10 rounded-lg border-none cursor-pointer bg-transparent"
                                            />
                                            <span className="text-slate-600 font-mono font-bold text-xs uppercase">{editCollegeForm.secondaryColor}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Affiliation Text</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. (An Autonomous Institution, affiliated to Anna University)"
                                        value={editCollegeForm.affiliationText}
                                        onChange={e => setEditCollegeForm({...editCollegeForm, affiliationText: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/20 transition-all font-bold text-slate-800"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Controller Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. M. Arulselvan"
                                            value={editCollegeForm.controllerName}
                                            onChange={e => setEditCollegeForm({...editCollegeForm, controllerName: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/20 transition-all font-bold text-slate-800"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Principal Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. P. Velavan"
                                            value={editCollegeForm.principalName}
                                            onChange={e => setEditCollegeForm({...editCollegeForm, principalName: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/20 transition-all font-bold text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedCollegeForEdit(null)}
                                        className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/30"
                                    >
                                        Save Configuration
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
        </>
    );
}
