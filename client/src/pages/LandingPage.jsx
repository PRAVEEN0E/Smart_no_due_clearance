import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, Users, ArrowRight, GraduationCap,
    Lock, Mail, AlertCircle, CheckCircle,
    Activity, Clock, FileCheck
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import api from '../lib/api';

const LandingPage = () => {
    const { setAuth, navigate } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setAuth(data.user, data.token);

            if (data.user.role === 'SUPERADMIN') navigate('/superadmin');
            else if (data.user.role === 'MENTOR') navigate('/mentor');
            else if (data.user.role === 'STAFF') navigate('/staff');
            else navigate('/student');
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-slate-50 selection:bg-indigo-500/30 selection:text-indigo-200 font-['Inter'] overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[128px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 border-b border-white/5 bg-black/20 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight font-['Outfit'] text-white">SmartClearance</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
                        <a href="#workflow" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Workflow</a>
                        <a href="#login" className="text-sm font-semibold px-5 py-2.5 bg-white text-black rounded-full hover:bg-slate-200 transition-colors">
                            Portal Login
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10">
                <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        
                        {/* Hero Content */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                Academic Year 2026-2027
                            </div>
                            
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-['Outfit'] leading-[1.1]">
                                Modernizing <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                    Student Clearance
                                </span>
                            </h1>
                            
                            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                                A unified platform that automates dues settlement, tracks course evaluations, and issues cryptographically verified hall tickets with zero friction.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <a href="#login" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all shadow-[0_0_40px_8px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_12px_rgba(79,70,229,0.4)]">
                                    Access Portal
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </a>
                                <a href="#workflow" className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all backdrop-blur-sm">
                                    View Instructions
                                </a>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/10">
                                {[
                                    { label: 'Time Saved', value: '85%' },
                                    { label: 'Paperless', value: '100%' },
                                    { label: 'Security', value: 'AES-256' }
                                ].map((stat, i) => (
                                    <div key={i}>
                                        <div className="text-3xl font-bold text-white font-['Outfit']">{stat.value}</div>
                                        <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Login Card */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            id="login"
                            className="relative w-full max-w-md mx-auto lg:ml-auto"
                        >
                            {/* Card Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur opacity-20 animate-pulse"></div>
                            
                            <div className="relative bg-[#0a0f1e]/80 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-bold text-white font-['Outfit']">Welcome Back</h2>
                                    <p className="text-slate-400 mt-2 text-sm">Sign in to your institutional account.</p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                                placeholder="username@institution.edu"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {loginError && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2"
                                            >
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                {loginError}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        type="submit"
                                        disabled={loginLoading}
                                        className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-2"
                                    >
                                        {loginLoading ? (
                                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            'Sign In securely'
                                        )}
                                    </button>
                                </form>

                                <div className="mt-8 text-center">
                                    <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">Forgot your password?</a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-24 bg-[#050b14] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold font-['Outfit'] mb-4 text-white">Smarter Clearance</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Designed to save time for students and staff while ensuring 100% accurate and secure clearance records.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Activity,
                                title: "Real-Time Sync",
                                desc: "Dues settled at the library, lab, or hostel are synchronized instantly, clearing your status without any manual intervention.",
                                color: "from-blue-500 to-cyan-400"
                            },
                            {
                                icon: ShieldCheck,
                                title: "Cryptographic QR",
                                desc: "Hall tickets are generated as cryptographically signed QR codes, ensuring zero forgery and instant verification at exam halls.",
                                color: "from-indigo-500 to-purple-500"
                            },
                            {
                                icon: Users,
                                title: "Role-Based Access",
                                desc: "Dedicated interfaces for Students, Mentors, and Staff ensure everyone only sees what they need to process clearances quickly.",
                                color: "from-purple-500 to-pink-500"
                            }
                        ].map((feat, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all hover:-translate-y-1"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} p-0.5 mb-6`}>
                                    <div className="w-full h-full bg-[#050b14] rounded-[14px] flex items-center justify-center">
                                        <feat.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 font-['Outfit']">{feat.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section id="workflow" className="relative z-10 py-24 bg-[#030712] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2 space-y-8">
                            <h2 className="text-3xl md:text-5xl font-bold font-['Outfit'] text-white">How it works</h2>
                            
                            <div className="space-y-6">
                                {[
                                    { icon: FileCheck, title: "1. Departments upload dues", desc: "Library, Hostel, and Admin upload Excel sheets or use our API to log outstanding dues." },
                                    { icon: Clock, title: "2. Students are notified", desc: "Automated emails notify students of their pending statuses before exams." },
                                    { icon: ShieldCheck, title: "3. Clear & Generate", desc: "Once dues are cleared, the system generates a secure, signed QR code pass." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1 shrink-0 w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1 font-['Outfit']">{step.title}</h4>
                                            <p className="text-slate-400">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-1/2 w-full">
                            <div className="relative rounded-[2rem] bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-white/10 p-2 overflow-hidden backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 opacity-50"></div>
                                <div className="relative bg-[#0a0f1e] rounded-[1.75rem] border border-white/5 p-6 shadow-2xl">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                                <GraduationCap className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">Student Dashboard</div>
                                                <div className="text-xs text-slate-500">Live Preview</div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                            Clearance: 100%
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { name: "Library Return", status: "Cleared", color: "emerald" },
                                            { name: "Hostel Fee", status: "Cleared", color: "emerald" },
                                            { name: "Lab Equipment", status: "Cleared", color: "emerald" }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                <span className="text-sm text-slate-300">{item.name}</span>
                                                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                                    <CheckCircle className="w-4 h-4" />
                                                    {item.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/20">
                                        Download Hall Ticket
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-12 bg-[#020408]">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-indigo-500" />
                        <span className="text-lg font-bold font-['Outfit'] text-white">SmartClearance</span>
                    </div>
                    <p className="text-sm text-slate-500">© 2026 Smart Clearance System. All rights reserved.</p>
                    <div className="flex gap-6 text-sm text-slate-500">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
