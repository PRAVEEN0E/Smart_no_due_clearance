import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck,
    Users,
    ChevronRight,
    ArrowRight,
    GraduationCap,
    Lock,
    BookOpen,
    Mail,
    Calendar,
    AlertCircle,
    Phone,
    CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../lib/api';

const LandingPage = () => {
    // Navigation & Auth Hooks
    const { setAuth, navigate } = useAuth();

    // Login Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Accordion State for FAQs
    const [openFaq, setOpenFaq] = useState(0);

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
            setLoginError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
        } finally {
            setLoginLoading(false);
        }
    };

    const notices = [
        {
            id: 1,
            title: "Dues Clearance Deadline Extended",
            date: "May 25, 2026",
            type: "CRITICAL",
            desc: "The final deadline to settle library and hostel dues has been extended to May 30, 2026. Please complete your clearance to ensure your exam registration is unlocked."
        },
        {
            id: 2,
            title: "Automated Library Return Sync",
            date: "May 24, 2026",
            type: "GENERAL",
            desc: "The Library database now syncs automatically every 3 hours. Returned books will be updated on your dashboard within this window without manual requests."
        },
        {
            id: 3,
            title: "Digital Hall Ticket Verification Guidelines",
            date: "May 20, 2026",
            type: "GUIDE",
            desc: "Examiners will scan the QR code on your cryptographic hall ticket at the entrance. Ensure your portal status is marked green before entering the examination hall."
        }
    ];

    const faqs = [
        {
            q: "What do I do if a cleared due still shows as pending?",
            a: "Automatic payments are synchronized immediately. For physical item returns (e.g. library books or laboratory equipment), please allow up to 3 hours for the database to sync. If it is urgent, contact the respective department coordinator with your return receipt."
        },
        {
            q: "Can I download my hall ticket if my fee status is pending?",
            a: "No. The system requires 100% completion of both your course evaluations and fee records before the cryptographic QR code is signed and issued as your exam hall ticket."
        },
        {
            q: "How does the QR verification protect against forgery?",
            a: "Every hall ticket contains a cryptographically signed JSON Web Token (JWT). When checked by the examiner using the built-in scanner, the portal authenticates the digital signature directly with the university database, rendering forged copies invalid."
        },
        {
            q: "Who is my assigned Mentor or Advisor?",
            a: "Your Mentor is assigned based on your course registration and batch. You can view your Mentor's profile and contact details directly in the top panel of your Student Dashboard."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-primary/20 selection:text-primary relative overflow-hidden font-['Inter']">
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none -z-10" />

            {/* Glowing Mesh Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px] pointer-events-none -z-10" />
            <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

            {/* Navigation Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 relative group overflow-hidden">
                            <GraduationCap className="w-5 h-5 relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-800 font-['Outfit'] uppercase">Smart Clearance</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider text-slate-500">
                        <a href="#portal-intro" className="hover:text-primary transition-colors">About</a>
                        <a href="#notice-board" className="hover:text-primary transition-colors">Notices</a>
                        <a href="#instructions" className="hover:text-primary transition-colors">Instructions</a>
                        <a href="#faq" className="hover:text-primary transition-colors">FAQs</a>
                        
                        <div className="w-[1px] h-5 bg-slate-200" />
                        
                        <a href="#login-box" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-primary hover:shadow-lg hover:shadow-primary/25 transition-all text-xs font-black uppercase tracking-widest">
                            Portal Login
                        </a>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION - SPLIT LAYOUT */}
            <section id="portal-intro" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* LEFT PANEL: Notice Board & Status */}
                    <div className="lg:col-span-7 space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Academic Year 2026 - Active
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-slate-900 font-['Outfit']"
                        >
                            Student & Staff <br />
                            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent italic">Clearance Portal</span>
                        </motion.h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl font-medium"
                        >
                            A unified institutional platform designed to automate semester clearance, dues settlement, course evaluations, and secure QR-coded hall ticket generation.
                        </motion.p>

                        {/* Bulletin/Notice Board */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white border border-slate-200/80 rounded-[28px] p-6 shadow-sm space-y-4"
                        >
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                                <AlertCircle className="w-4 h-4 text-primary" />
                                <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Official Notice Board</h3>
                            </div>
                            
                            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                {notices.map((notice) => (
                                    <div key={notice.id} className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider ${
                                                notice.type === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                notice.type === 'GUIDE' ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-slate-200 text-slate-700'
                                            }`}>
                                                {notice.type}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {notice.date}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-xs">{notice.title}</h4>
                                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{notice.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Small Stat Badges */}
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            {[
                                { title: 'Dues Cleared', value: '98.4%', sub: 'Instant sync' },
                                { title: 'Uptime Status', value: '100%', sub: 'Operational' },
                                { title: 'Verification', value: 'Secure QR', sub: 'Signed tokens' }
                            ].map((s, idx) => (
                                <div key={idx} className="p-3 bg-slate-100/50 border border-slate-200/40 rounded-2xl text-center">
                                    <span className="block text-lg font-black text-slate-800 font-['Outfit']">{s.value}</span>
                                    <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">{s.title}</span>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* RIGHT PANEL: Embedded Login Card */}
                    <div id="login-box" className="lg:col-span-5">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="glass p-8 rounded-[36px] border border-slate-200 shadow-2xl relative"
                        >
                            <div className="mb-8 text-center lg:text-left">
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary px-3 py-1 bg-primary/10 rounded-full">Secure Gateway</span>
                                <h2 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight mt-3">Portal Authentication</h2>
                                <p className="text-slate-500 text-xs font-semibold mt-1">Sign in with your academic credentials.</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all text-xs font-semibold text-slate-800 placeholder:text-slate-400"
                                            placeholder="username@institution.edu"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Password</label>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all text-xs font-semibold text-slate-800 placeholder:text-slate-400"
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
                                            className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2"
                                        >
                                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                            <span>{loginError}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={loginLoading}
                                    className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed text-xs uppercase tracking-widest mt-6"
                                >
                                    {loginLoading ? 'Authenticating...' : 'Sign In'}
                                    {!loginLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-slate-200/60 text-center">
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Authorized Access Only</p>
                                <p className="text-[9px] text-slate-400 mt-1">If you need login credentials, please contact your department registrar.</p>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </section>

            {/* PORTAL INSTRUCTIONS & USER GUIDANCE */}
            <section id="instructions" className="py-20 bg-white relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary px-3.5 py-1 bg-primary/10 rounded-full">Usage Guide</span>
                        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-['Outfit'] text-slate-900">
                            Clearance workflow, simplified.
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">
                            Follow the clear procedures outlined below to access dashboards and generate clearance certificates.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                role: "Students",
                                desc: "Review your active dues, complete required course evaluations, pay fees online, and download your cryptographically verified QR hall ticket.",
                                list: [
                                    "Real-time due status alerts",
                                    "Direct link to online fee payments",
                                    "Verify subject approvals live",
                                    "Download security QR code passes"
                                ],
                                icon: BookOpen
                            },
                            {
                                role: "Faculty Advisors",
                                desc: "Supervise clearance pipelines of assigned student cohorts. Monitor class clearances and issue academic/course evaluations.",
                                list: [
                                    "Cohort analytics dashboards",
                                    "Verify department dues lists",
                                    "Log student performance trends",
                                    "Track course evaluation completions"
                                ],
                                icon: Users
                            },
                            {
                                role: "Department Clerks",
                                desc: "Log outstanding library, laboratory, hostel, or tuition dues. Scan cryptographically signed QR codes at exam hall entrances.",
                                list: [
                                    "Import outstanding due sheets via Excel",
                                    "Clear student dues in one-click",
                                    "Secure QR scanner validation tool",
                                    "Track department-wide clearance rates"
                                ],
                                icon: ShieldCheck
                            }
                        ].map((guide, idx) => (
                            <div key={idx} className="bg-slate-50/50 border border-slate-200/60 p-8 rounded-[32px] space-y-6 flex flex-col justify-between hover:border-slate-300 hover:bg-white transition-all shadow-sm">
                                <div className="space-y-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        <guide.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 font-['Outfit']">{guide.role}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">{guide.desc}</p>
                                </div>
                                <div className="h-px bg-slate-200/50" />
                                <ul className="space-y-3">
                                    {guide.list.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-semibold">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PORTAL SYSTEM FEATURES */}
            <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                        
                        <div className="lg:col-span-5 space-y-6">
                            <span className="inline-flex px-3 py-1 bg-primary/20 border border-primary/40 text-primary text-[10px] font-black uppercase tracking-widest rounded-md">
                                Platform Security
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-['Outfit'] text-white">
                                Cryptographic <br />
                                Verification.
                            </h2>
                            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
                                The portal guarantees security by replacing traditional paper clearance chits with digital tokens encoded inside QR codes. Security guards and examiners verify authentic passes using webcam cameras on their laptops or mobile devices.
                            </p>
                            <div className="pt-2">
                                <a href="#faq" className="inline-flex items-center gap-2 text-xs font-black text-primary hover:text-purple-400 uppercase tracking-widest">
                                    <span>Learn more about security</span>
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { title: 'Zero Paper waste', value: '100% Digital', sub: 'Eco-Friendly', desc: 'No physical clearance forms, stamping queues, or document storage bins.' },
                                { title: 'Processing speed', value: '4.2 Hours', sub: 'Average completion', desc: 'Students resolve outstanding dues in hours rather than running across campuses.' },
                                { title: 'Auditing ledger', value: 'Audit Logged', sub: 'Full accountability', desc: 'Every due modification, approval override, and payout is permanently timestamped.' },
                                { title: 'Tenant separation', value: 'Isolated Nodes', sub: 'Campus Isolation', desc: 'University departments operate on secure sandbox scopes to maintain confidentiality.' }
                            ].map((metric, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{metric.sub}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white tracking-tight">{metric.value}</h4>
                                        <h5 className="text-xs font-bold text-slate-300 font-['Outfit'] mt-1">{metric.title}</h5>
                                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed font-semibold">{metric.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section id="faq" className="py-20 bg-slate-50 relative">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary px-3.5 py-1 bg-primary/10 rounded-full">Help Center</span>
                        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-['Outfit'] text-slate-900">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium">
                            Quick answers to common questions about clearances, hall tickets, and database synchronization.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div 
                                key={index} 
                                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                                    className="w-full px-6 py-5 text-left flex justify-between items-center font-bold text-slate-800 text-sm sm:text-base focus:outline-none"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronRight 
                                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                                            openFaq === index ? 'rotate-90 text-primary' : ''
                                        }`} 
                                    />
                                </button>

                                <AnimatePresence initial={false}>
                                    {openFaq === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="px-6 pb-6 text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold border-t border-slate-100 pt-4">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION CONTAINER */}
            <section className="py-16 bg-white relative border-t border-slate-100">
                <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto">
                        <Phone className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit'] text-slate-900">Need Portal Support?</h2>
                    <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto font-medium">
                        If you encounter technical issues or system errors while settling dues, please reach out to the college registrar helpdesk.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <a href="mailto:support@institution.edu" className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all text-xs uppercase tracking-widest shadow-xl shadow-slate-950/10">
                            Email Registrar Helpdesk
                        </a>
                        <a href="tel:+1234567890" className="w-full sm:w-auto px-8 py-4 border border-slate-200 hover:border-slate-800 text-slate-700 hover:text-slate-900 font-bold rounded-2xl transition-all text-xs uppercase tracking-widest">
                            Call IT Hotline
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 bg-slate-50 border-t border-slate-200/60 relative z-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">© 2026 Smart Clearance Portal. All Rights Reserved.</p>
                    <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Security Audit</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
