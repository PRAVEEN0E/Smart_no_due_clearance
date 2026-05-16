import { motion } from 'framer-motion';
import { 
    ShieldCheck, 
    Zap, 
    Users, 
    Globe, 
    ChevronRight, 
    CheckCircle2, 
    ArrowRight,
    BarChart3,
    Clock,
    Smartphone
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    const features = [
        {
            title: 'Multi-Tenant Architecture',
            description: 'Scale infinitely with isolated institutional partitions and custom branding for every college.',
            icon: Globe,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        },
        {
            title: 'Automated Clearance',
            description: 'Eliminate paperwork. Mark dues as paid and clear students instantly with a single click.',
            icon: Zap,
            color: 'text-amber-500',
            bg: 'bg-amber-50'
        },
        {
            title: 'Support Mode 2.0',
            description: 'SuperAdmins can securely impersonate any user to provide instant troubleshooting and support.',
            icon: ShieldCheck,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
        }
    ];

    const steps = [
        { title: 'Initialize', desc: 'Set up your college partition in seconds.' },
        { title: 'Import', desc: 'Bulk upload students and faculty via Excel.' },
        { title: 'Clear', desc: 'Students track and clear dues in real-time.' }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-600">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Zap className="w-6 h-6 fill-current" />
                        </div>
                        <span className="text-xl font-black tracking-tighter uppercase italic">Smart NoDue</span>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-10 text-sm font-bold uppercase tracking-widest text-slate-400">
                        <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
                        <a href="#workflow" className="hover:text-indigo-600 transition-colors">Workflow</a>
                        <Link to="/login" className="bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10">
                            Launch App
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-50/50 rounded-full blur-[120px] -z-10" />
                
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-widest mb-8"
                    >
                        <Sparkles className="w-4 h-4" />
                        Next-Gen Institutional OS
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8"
                    >
                        The Future of <br />
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent italic">College Clearance.</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        Eliminate the chaos of physical forms. A unified, multi-tenant platform for students, mentors, and administrators to manage clearances with surgical precision.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/login" className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-2 group">
                            Get Started Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#features" className="w-full md:w-auto px-10 py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm hover:border-slate-300 transition-all">
                            Explore Features
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Engineered for Excellence.</h2>
                        <p className="text-slate-500 font-medium italic text-lg">Sophisticated tools for sophisticated institutions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <motion.div 
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group"
                            >
                                <div className={`w-16 h-16 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                    <f.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black mb-4 tracking-tight">{f.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">{f.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section id="workflow" className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-5xl font-black tracking-tighter leading-none mb-8">
                                Why Colleges <br />
                                <span className="text-indigo-600 italic">Love Smart NoDue.</span>
                            </h2>
                            <div className="space-y-8">
                                {[
                                    { title: 'Real-time Analytics', desc: 'Track clearance rates across every department live.', icon: BarChart3 },
                                    { title: 'Bulk Operations', desc: 'Process 10,000+ students in seconds via Excel.', icon: Zap },
                                    { title: 'Mobile First', desc: 'Students can clear dues from their phones anywhere.', icon: Smartphone }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                                            <p className="text-slate-500 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute -inset-4 bg-indigo-100/50 rounded-[4rem] blur-2xl -z-10" />
                            <div className="bg-slate-900 rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mb-2" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500 mb-2" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                </div>
                                <h3 className="text-white text-3xl font-black tracking-tight mb-6">Support Mode</h3>
                                <div className="space-y-4">
                                    <div className="h-12 w-full bg-white/5 rounded-2xl flex items-center px-4">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 mr-3 animate-pulse" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Impersonation Active</span>
                                    </div>
                                    <div className="h-40 w-full bg-white/5 rounded-2xl p-6">
                                        <div className="w-2/3 h-4 bg-white/10 rounded-full mb-4" />
                                        <div className="w-full h-4 bg-white/10 rounded-full mb-4" />
                                        <div className="w-1/2 h-4 bg-white/10 rounded-full" />
                                    </div>
                                </div>
                                <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mt-8 italic">SuperAdmin Terminal v4.0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="bg-indigo-600 rounded-[4rem] p-16 text-center text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <h2 className="text-5xl font-black tracking-tight mb-8">Ready to evolve?</h2>
                        <Link to="/login" className="inline-flex items-center gap-3 bg-white text-indigo-600 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-50 transition-all shadow-xl">
                            Launch Your Node
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">© 2026 Smart NoDue Systems. All Rights Reserved.</p>
                    <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Node</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Infrastructure</a>
                        <a href="#" className="hover:text-indigo-600 transition-colors">Security</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const Sparkles = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
    </svg>
);

export default LandingPage;
