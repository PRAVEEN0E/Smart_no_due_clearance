import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Shield, GraduationCap, Users, Sparkles, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../lib/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { setAuth, navigate } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setAuth(data.user, data.token);

            if (data.user.role === 'SUPERADMIN') navigate('/superadmin');
            else if (data.user.role === 'MENTOR') navigate('/mentor');
            else if (data.user.role === 'STAFF') navigate('/staff');
            else navigate('/student');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 lg:p-8 font-['Inter'] selection:bg-primary/20">
            {/* Dynamic Mesh Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        x: [0, 100, 0],
                        y: [0, 50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.1, 1],
                        x: [0, -50, 0],
                        y: [0, 100, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-400/10 rounded-full blur-[120px]" 
                />
            </div>

            <main className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden relative z-10 border border-slate-100">
                
                {/* Left Section: Visual & Marketing */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0a0a0b] relative overflow-hidden group">
                    {/* Abstract pattern background */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent mix-blend-overlay" />
                        <img 
                            src="/login_abstract_background_1778942746051.png" 
                            alt="Abstract" 
                            className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[10s]"
                        />
                    </div>

                    <div className="relative z-20">
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-white font-bold tracking-tight text-xl font-['Outfit']">Smart No Due</span>
                        </motion.div>
                    </div>

                    <div className="relative z-20 space-y-6">
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-5xl font-extrabold text-white leading-[1.1] font-['Outfit']"
                        >
                            The Future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Academic Clearance</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-slate-400 text-lg max-w-md"
                        >
                            Experience the seamless way to manage academic verification and hall ticket generation.
                        </motion.p>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            {[
                                { label: 'Automated', icon: Sparkles },
                                { label: 'Secure', icon: Shield },
                                { label: 'Real-time', icon: CheckCircle2 },
                                { label: 'Intuitive', icon: Users }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className="flex items-center gap-2 text-slate-300 text-sm font-medium"
                                >
                                    <item.icon className="w-4 h-4 text-primary" />
                                    {item.label}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-20">
                        <p className="text-slate-500 text-xs font-medium">© 2026 Institutional Framework. All rights reserved.</p>
                    </div>
                </div>

                {/* Right Section: Form */}
                <div className="p-8 lg:p-16 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        <div className="lg:hidden flex justify-center mb-8">
                             <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                        </div>

                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-slate-900 font-['Outfit'] tracking-tight">Welcome Back</h2>
                            <p className="text-slate-500 mt-2">Sign in to your account to continue.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                                        placeholder="name@institution.edu"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-semibold text-slate-700">Password</label>
                                    <button type="button" className="text-xs font-bold text-primary hover:underline transition-all">Forgot?</button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold flex items-center gap-2"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-slate-500 text-sm">
                                Don't have an account?{' '}
                                <button onClick={() => navigate('/register')} className="text-primary font-bold hover:underline transition-all">
                                    Register Here
                                </button>
                            </p>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100">
                             <div className="flex items-center justify-between mb-4">
                                <span className="h-px bg-slate-100 flex-1" />
                                <span className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Access</span>
                                <span className="h-px bg-slate-100 flex-1" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { icon: Shield, label: 'Mentor' },
                                    { icon: Users, label: 'Staff' },
                                    { icon: GraduationCap, label: 'Student' }
                                ].map((role, i) => (
                                    <div key={i} className="text-center group cursor-default">
                                        <div className="w-12 h-12 mx-auto rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all mb-2 border border-slate-100 group-hover:border-primary/20">
                                            <role.icon className="w-5 h-5" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{role.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center">
                             <button 
                                type="button" 
                                onClick={async () => {
                                    try {
                                        await api.post('/auth/bootstrap');
                                        alert('System Bootstrapped!');
                                    } catch (err) {
                                        alert('System already initialized.');
                                    }
                                }} 
                                className="text-[10px] font-bold text-slate-300 hover:text-slate-400 uppercase tracking-widest transition-all"
                            >
                                Admin Bootstrap
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

