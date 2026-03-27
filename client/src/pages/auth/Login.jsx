import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, GraduationCap, Users } from 'lucide-react';
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

            // Redirect based on role
            if (data.user.role === 'MENTOR') navigate('/mentor');
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
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass p-8 rounded-[2rem] relative z-10 shadow-xl border border-border"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6 border border-primary/20">
                        <Shield className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent italic uppercase">NO DUE</h1>
                    <p className="text-primary font-bold tracking-widest text-[10px] uppercase mt-1">Automation Framework</p>
                </div>


                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground/80 ml-1">Academic Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 transition-all pl-11 text-foreground"
                                placeholder="mentor@college.edu"
                            />
                            <Users className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground/80 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 transition-all pl-11 text-foreground"
                                placeholder="••••••••"
                            />
                            <LogIn className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full premium-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Sign In <LogIn className="w-4 h-4" /></>
                        )}
                    </button>
                    <div className="text-center mt-3">
                        <button type="button" onClick={() => navigate('/register')} className="text-xs font-semibold text-muted-foreground hover:text-primary transition-all">
                            No account? <span className="text-primary underline">Register new Mentor</span>
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-4">
                    <div className="text-center p-2">
                        <Shield className="w-4 h-4 mx-auto text-primary/60 mb-1" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Mentor</p>
                    </div>
                    <div className="text-center p-2">
                        <Users className="w-4 h-4 mx-auto text-primary/60 mb-1" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Staff</p>
                    </div>
                    <div className="text-center p-2">
                        <GraduationCap className="w-4 h-4 mx-auto text-primary/60 mb-1" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Student</p>
                    </div>
                </div>

                
            </motion.div>
        </div>
    );
}
