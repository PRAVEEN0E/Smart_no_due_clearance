
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    School, 
    Users, 
    Activity, 
    ShieldAlert, 
    Plus, 
    Trash2, 
    Search, 
    TrendingUp, 
    BarChart3, 
    Globe, 
    Settings,
    MoreVertical,
    CheckCircle2,
    X,
    Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('colleges');
    const [colleges, setColleges] = useState([]); // Will now contain {id, name, domain, logoUrl, primaryColor, secondaryColor}
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [stats, setStats] = useState({ colleges: 0, users: 0, students: 0, mentors: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddCollege, setShowAddCollege] = useState(false);
    const [editingCollege, setEditingCollege] = useState(null);
    const [newCollege, setNewCollege] = useState({ name: '', domain: '', logoUrl: '', primaryColor: '#7c3aed', secondaryColor: '#a855f7' });
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [broadcast, setBroadcast] = useState({ title: '', content: '', type: 'SYSTEM', priority: 1 });
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const token = localStorage.getItem('token');
    const API = axios.create({
        baseURL: '/api/superadmin',
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'colleges') {
                const res = await API.get('/colleges');
                setColleges(res.data);
            } else if (activeTab === 'users') {
                const res = await API.get('/users');
                setUsers(res.data);
            } else if (activeTab === 'audit') {
                const res = await API.get('/audit');
                setAuditLogs(res.data);
            } else if (activeTab === 'stats') {
                const res = await API.get('/stats');
                setStats(res.data);
            }
        } catch (error) {
            toast.error('Failed to sync system data');
        } finally {
            setLoading(false);
        }
    };

    const handleOmniSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await API.get(`/search?q=${query}`);
            setSearchResults(res.data);
        } catch (err) { /* ignore */ }
        finally { setSearching(false); }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        try {
            await API.post('/broadcast', broadcast);
            toast.success('Global broadcast transmitted');
            setShowBroadcastModal(false);
            setBroadcast({ title: '', content: '', type: 'SYSTEM', priority: 1 });
        } catch (error) {
            toast.error('Broadcast failed');
        }
    };

    const handleCreateCollege = async (e) => {
        e.preventDefault();
        try {
            await API.post('/colleges', newCollege);
            toast.success('New institution integrated');
            setShowAddCollege(false);
            setNewCollege({ name: '', domain: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Integration failed');
        }
    };

    const handleUpdateCollege = async (e) => {
        e.preventDefault();
        try {
            await API.put(`/colleges/${editingCollege.id}`, editingCollege);
            toast.success('Institution profile updated');
            setEditingCollege(null);
            fetchData();
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const handleDeleteCollege = async (id) => {
        if (!window.confirm('This will permanently delete the college and ALL associated data. Proceed?')) return;
        try {
            await API.delete(`/colleges/${id}`);
            toast.success('Institution offboarded');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete college');
        }
    };

    const filteredData = () => {
        const query = searchQuery.toLowerCase();
        if (activeTab === 'colleges') return colleges.filter(c => c.name.toLowerCase().includes(query) || (c.domain || '').toLowerCase().includes(query));
        if (activeTab === 'users') return users.filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query));
        return [];
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent italic uppercase">
                        System Control
                    </h1>
                    <p className="text-muted-foreground font-medium italic">Global infrastructure management & multi-tenant oversight.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowBroadcastModal(true)}
                        className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all shadow-lg active:scale-95"
                        title="Global Broadcast"
                    >
                        <Megaphone className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setActiveTab('stats')}
                        className={`p-3 rounded-2xl border transition-all ${activeTab === 'stats' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white border-black/5 hover:bg-slate-50'}`}
                    >
                        <BarChart3 className="w-5 h-5" />
                    </button>
                    {activeTab === 'colleges' && (
                        <button 
                            onClick={() => setShowAddCollege(true)}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Integrate College
                        </button>
                    )}
                </div>
            </div>

            {/* Omni-Search Area */}
            <div className="relative z-40">
                <div className="glass p-2 rounded-3xl border border-border shadow-2xl flex items-center gap-4">
                    <div className="pl-4">
                        <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Global Omni-Search: Find any user, college, or record across the entire platform..."
                        value={searchQuery}
                        onChange={(e) => handleOmniSearch(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none py-4 font-bold text-slate-700 placeholder:text-slate-400"
                    />
                </div>

                <AnimatePresence>
                    {searchQuery.length >= 2 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-4 glass rounded-[2rem] border border-border shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto z-50 p-4"
                        >
                            {searching ? (
                                <div className="p-8 text-center opacity-30"><Activity className="w-8 h-8 animate-spin mx-auto" /></div>
                            ) : searchResults.length > 0 ? (
                                <div className="space-y-2">
                                    {searchResults.map(user => (
                                        <div key={user.id} className="p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase">{user.name[0]}</div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{user.name}</div>
                                                    <div className="text-[10px] font-mono text-slate-400">{user.email} • {user.college?.name || 'Central'}</div>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded-lg bg-slate-100 text-[9px] font-black uppercase text-slate-500">{user.role}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400 font-medium italic">No matches found in the global index.</div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active Colleges', value: stats.colleges || colleges.length, icon: School, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Global Admins', value: stats.mentors || users.length, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'System Audit', value: 'Live', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Cloud Status', value: 'Optimal', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="glass p-6 rounded-[2rem] border border-border relative overflow-hidden group hover:border-primary/30 transition-all cursor-default shadow-sm">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-all duration-500`} />
                        <stat.icon className={`w-8 h-8 ${stat.color} mb-4 relative z-10`} />
                        <p className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-bold relative z-10">{stat.label}</p>
                        <h2 className="text-4xl font-black mt-2 tabular-nums relative z-10 tracking-tight text-foreground">{stat.value}</h2>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { id: 'colleges', label: 'Institutions', icon: School },
                        { id: 'users', label: 'Administrative Users', icon: Users },
                        { id: 'audit', label: 'Global Logs', icon: ShieldAlert },
                        { id: 'stats', label: 'Growth & Analytics', icon: TrendingUp },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-xl shadow-primary/20 translate-x-2' : 'hover:bg-white/50 text-slate-500'}`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-sm">{item.label}</span>
                        </button>
                    ))}
                    
                    <div className="pt-8 px-6">
                        <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-sm mb-2">System Version</h3>
                                <p className="text-[10px] text-white/50 mb-4 font-mono">v2.4.0-Stable</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">All Services Operational</span>
                                </div>
                            </div>
                            <Settings className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
                        </div>
                    </div>
                </div>

                {/* Content Pane */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="glass rounded-[2.5rem] border border-border shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                        {/* Pane Header */}
                        <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-widest text-foreground/80">{activeTab}</h2>
                                <p className="text-xs text-muted-foreground mt-1 font-medium">Manage and monitor global infrastructure.</p>
                            </div>
                            {(activeTab === 'colleges' || activeTab === 'users') && (
                                <div className="relative group">
                                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Search records..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-slate-100 border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-full md:w-[300px] font-medium"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Pane Body */}
                        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="flex items-center justify-center h-full opacity-30">
                                    <Activity className="w-12 h-12 animate-spin" />
                                </div>
                            ) : activeTab === 'colleges' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredData().map((college) => (
                                        <div key={college.id} className="p-6 rounded-3xl bg-white border border-slate-100 hover:border-primary/20 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                    <School className="w-6 h-6" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => setEditingCollege(college)}
                                                        className="p-2 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                        title="Edit Branding"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteCollege(college.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete College"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <h3 className="font-black text-lg text-slate-800">{college.name}</h3>
                                            <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">{college.domain || 'No domain set'}</p>
                                            
                                            <div className="grid grid-cols-2 gap-3 mt-6">
                                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Users</p>
                                                    <p className="text-lg font-black text-slate-700">{college._count?.users || 0}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Courses</p>
                                                    <p className="text-lg font-black text-slate-700">{college._count?.subjects || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activeTab === 'users' ? (
                                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User Details</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Affiliation</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 font-medium">
                                            {filteredData().map((user) => (
                                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="text-sm font-bold text-slate-800">{user.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono mt-1">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="text-[11px] font-bold text-slate-600">{user.college?.name || 'Central Admin'}</div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase ${user.role === 'SUPERADMIN' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-primary/5 text-primary border-primary/20'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <button className="p-2 text-slate-300 hover:text-primary transition-all"><MoreVertical className="w-4 h-4" /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : activeTab === 'audit' ? (
                                <div className="space-y-4">
                                    {auditLogs.map((log) => (
                                        <div key={log.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-start gap-5 hover:bg-white transition-all group">
                                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-all shrink-0 shadow-sm">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black px-2 py-1 bg-slate-200 rounded-lg uppercase tracking-widest">{log.action}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-slate-700 leading-relaxed font-medium truncate">{log.details}</p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                                    <span className="text-[10px] text-slate-400 font-bold">{log.userEmail}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center justify-center gap-6 h-full opacity-40">
                                    <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center"><CheckCircle2 className="w-10 h-10" /></div>
                                    <div>
                                        <h3 className="font-black text-xl text-slate-800">System Analytics</h3>
                                        <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs mx-auto">Detailed growth tracking and institutional reports will appear here as the system scales.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Broadcast Modal */}
            <AnimatePresence>
                {showBroadcastModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowBroadcastModal(false)} 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 relative z-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Compose Global Broadcast</h2>
                                <button onClick={() => setShowBroadcastModal(false)} className="p-2 hover:bg-black/5 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleBroadcast} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-3 ml-1">Title</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={broadcast.title}
                                        onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                                        placeholder="System-wide Announcement..."
                                        className="w-full bg-slate-100 border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-3 ml-1">Priority</label>
                                    <select 
                                        value={broadcast.priority}
                                        onChange={(e) => setBroadcast({ ...broadcast, priority: parseInt(e.target.value) })}
                                        className="w-full bg-slate-100 border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                    >
                                        <option value={1}>Low / Info</option>
                                        <option value={2}>Medium / Important</option>
                                        <option value={3}>High / Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-3 ml-1">Content</label>
                                    <textarea 
                                        required 
                                        value={broadcast.content}
                                        onChange={(e) => setBroadcast({ ...broadcast, content: e.target.value })}
                                        placeholder="Enter the message body..."
                                        className="w-full bg-slate-100 border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[120px]" 
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full bg-amber-500 py-5 rounded-[1.25rem] font-black text-white shadow-xl shadow-amber-500/20 active:scale-95 transition-all mt-4"
                                >
                                    Transmit Broadcast
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit College Branding Modal */}
            <AnimatePresence>
                {editingCollege && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setEditingCollege(null)} 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass w-full max-w-lg p-8 rounded-[2.5rem] border border-white/10 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Customize Institutional Identity</h2>
                                <button onClick={() => setEditingCollege(null)} className="p-2 hover:bg-black/5 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleUpdateCollege} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-full">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-3 ml-1">College Name</label>
                                        <input 
                                            required 
                                            type="text" 
                                            value={editingCollege.name}
                                            onChange={(e) => setEditingCollege({ ...editingCollege, name: e.target.value })}
                                            className="w-full bg-slate-100 border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-3 ml-1">Logo URL</label>
                                        <input 
                                            type="text" 
                                            value={editingCollege.logoUrl || ''}
                                            onChange={(e) => setEditingCollege({ ...editingCollege, logoUrl: e.target.value })}
                                            placeholder="https://link-to-logo.png"
                                            className="w-full bg-slate-100 border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-3 ml-1">Domain</label>
                                        <input 
                                            type="text" 
                                            value={editingCollege.domain || ''}
                                            onChange={(e) => setEditingCollege({ ...editingCollege, domain: e.target.value })}
                                            className="w-full bg-slate-100 border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-3 ml-1">Primary Color</label>
                                        <div className="flex gap-3">
                                            <input 
                                                type="color" 
                                                value={editingCollege.primaryColor || '#7c3aed'}
                                                onChange={(e) => setEditingCollege({ ...editingCollege, primaryColor: e.target.value })}
                                                className="w-14 h-14 rounded-xl border-none cursor-pointer bg-transparent" 
                                            />
                                            <input 
                                                type="text" 
                                                value={editingCollege.primaryColor || '#7c3aed'}
                                                onChange={(e) => setEditingCollege({ ...editingCollege, primaryColor: e.target.value })}
                                                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 text-xs font-mono font-bold uppercase" 
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-3 ml-1">Secondary Color</label>
                                        <div className="flex gap-3">
                                            <input 
                                                type="color" 
                                                value={editingCollege.secondaryColor || '#a855f7'}
                                                onChange={(e) => setEditingCollege({ ...editingCollege, secondaryColor: e.target.value })}
                                                className="w-14 h-14 rounded-xl border-none cursor-pointer bg-transparent" 
                                            />
                                            <input 
                                                type="text" 
                                                value={editingCollege.secondaryColor || '#a855f7'}
                                                onChange={(e) => setEditingCollege({ ...editingCollege, secondaryColor: e.target.value })}
                                                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 text-xs font-mono font-bold uppercase" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Workflow Builder */}
                                <div className="p-6 bg-slate-900 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <TrendingUp className="w-16 h-16 text-white" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                                        Clearance Workflow Sequence
                                    </h3>
                                    
                                    <div className="space-y-3 relative z-10">
                                        {(editingCollege.workflow || [
                                            { id: 'FEES', label: 'Financial Dues', type: 'FEE', required: true },
                                            { id: 'ACADEMICS', label: 'Academic Approvals', type: 'STAFF_APPROVAL', required: true }
                                        ]).map((step, idx) => (
                                            <div key={step.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl group hover:border-emerald-500/30 transition-all">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-400">{idx + 1}</div>
                                                <div className="flex-1">
                                                    <div className="text-xs font-bold text-white">{step.label}</div>
                                                    <div className="text-[9px] text-white/40 uppercase font-black tracking-widest">{step.type}</div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const wf = [...(editingCollege.workflow || [])];
                                                            if (idx > 0) {
                                                                [wf[idx], wf[idx-1]] = [wf[idx-1], wf[idx]];
                                                                setEditingCollege({...editingCollege, workflow: wf});
                                                            }
                                                        }}
                                                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"
                                                    >↑</button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const wf = [...(editingCollege.workflow || [])];
                                                            if (idx < wf.length - 1) {
                                                                [wf[idx], wf[idx+1]] = [wf[idx+1], wf[idx]];
                                                                setEditingCollege({...editingCollege, workflow: wf});
                                                            }
                                                        }}
                                                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"
                                                    >↓</button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const wf = (editingCollege.workflow || []).filter(s => s.id !== step.id);
                                                            setEditingCollege({...editingCollege, workflow: wf});
                                                        }}
                                                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400"
                                                    ><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const newStep = { id: `STEP_${Date.now()}`, label: 'New Custom Step', type: 'STAFF_APPROVAL', required: true };
                                                setEditingCollege({...editingCollege, workflow: [...(editingCollege.workflow || []), newStep]});
                                            }}
                                            className="w-full py-2 border-2 border-dashed border-white/10 rounded-xl text-[10px] font-black text-white/40 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-3 h-3" /> Add Workflow Node
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-100 overflow-hidden">
                                        {editingCollege.logoUrl ? (
                                            <img src={editingCollege.logoUrl} alt="Preview" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <School className="w-6 h-6 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Live Brand Preview</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: editingCollege.primaryColor }} />
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: editingCollege.secondaryColor }} />
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{editingCollege.name} Branding</span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full premium-gradient py-5 rounded-[1.25rem] font-black text-white shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4"
                                >
                                    Save Institutional Theme
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add College Modal */}
            <AnimatePresence>
                {showAddCollege && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowAddCollege(false)} 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 relative z-10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Integrate Institutional Tenant</h2>
                                <button onClick={() => setShowAddCollege(false)} className="p-2 hover:bg-black/5 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleCreateCollege} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-3 ml-1">College Name</label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={newCollege.name}
                                        onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                                        placeholder="e.g. Stanford University"
                                        className="w-full bg-slate-100 border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary block mb-3 ml-1">Domain Handle (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={newCollege.domain}
                                        onChange={(e) => setNewCollege({ ...newCollege, domain: e.target.value })}
                                        placeholder="e.g. stanford.edu"
                                        className="w-full bg-slate-100 border border-slate-200 rounded-[1.25rem] px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full premium-gradient py-5 rounded-[1.25rem] font-black text-white shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4"
                                >
                                    Confirm Integration
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SuperAdminDashboard;
