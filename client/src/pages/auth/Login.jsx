import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, GraduationCap, Users, Sparkles } from 'lucide-react';
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

            if (data.user.role === 'MENTOR' || data.user.role === 'SUPERADMIN') navigate('/mentor');
            else if (data.user.role === 'STAFF') navigate('/staff');
            else navigate('/student');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Animated Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-400/10 rounded-full blur-[140px]" />

            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                
                {/* Left Side: Branding/Intro */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:block space-y-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-primary/20 text-primary text-xs font-black tracking-widest uppercase">
                        <Sparkles className="w-3.5 h-3.5" /> Institutional Framework 2026
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter text-slate-900 leading-[0.9]">
                        Smart <span className="text-primary italic">No Due</span> <br /> 
                        Clearance.
                    </h1>
                    <p className="text-xl text-slate-500 max-w-md leading-relaxed">
                        Streamlining academic verification with automated marks tracking, fee clearance, and secure hall ticket generation.
                    </p>
                    
                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex -space-x-3">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm font-bold text-slate-600">Trusted by <span className="text-primary">2,400+</span> Students & Faculty</p>
                    </div>
                </motion.div>

                {/* Right Side: Login Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="glass p-10 rounded-[2.5rem] shadow-2xl shadow-primary/5 relative">
                        <div className="lg:hidden text-center mb-8">
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 italic uppercase">NO DUE</h1>
                            <p className="text-primary font-bold tracking-widest text-[10px] uppercase">Automation Framework</p>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-800">Welcome Back</h2>
                            <p className="text-slate-500 text-sm mt-1 font-medium">Please enter your institutional credentials.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Academic Email</label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-modern !pl-14"
                                        placeholder="id@institution.edu"
                                    />
                                    <Users className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors z-20" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                                <div className="relative group">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-modern !pl-14"
                                        placeholder="••••••••"
                                    />
                                    <LogIn className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors z-20" />
                                </div>
                            </div>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-xs font-bold text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full premium-gradient text-white font-bold py-4 rounded-2xl hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Sign Into Account <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                            
                            <div className="text-center pt-2">
                                <button type="button" onClick={() => navigate('/register')} className="text-xs font-bold text-slate-400 hover:text-primary transition-all">
                                    Need a mentor account? <span className="text-primary underline underline-offset-4">Register Here</span>
                                </button>
                            </div>
                        </form>

                        <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-3 gap-4">
                            {[
                                { icon: Shield, label: 'Mentor' },
                                { icon: Users, label: 'Staff' },
                                { icon: GraduationCap, label: 'Student' }
                            ].map((role, i) => (
                                <div key={i} className="text-center group">
                                    <div className="w-10 h-10 mx-auto rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all mb-2 border border-transparent group-hover:border-primary/20">
                                        <role.icon className="w-5 h-5" />
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{role.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
