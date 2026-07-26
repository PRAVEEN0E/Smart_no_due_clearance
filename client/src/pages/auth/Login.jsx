import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, GraduationCap, Users, Mail, Lock, ArrowRight } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../lib/api';
import toast from 'react-hot-toast';

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
            const user = data.data?.user || data.user;
            const token = data.data?.token || data.token;
            setAuth(user, token);

            if (user.role === 'SUPERADMIN') navigate('/superadmin');
            else if (user.role === 'MENTOR') navigate('/mentor');
            else if (user.role === 'STAFF') navigate('/staff');
            else navigate('/student');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 lg:p-8 font-['Inter'] selection:bg-primary/20 relative overflow-hidden">
            {/* Dynamic Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.3, 1],
                        rotate: [0, -90, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-secondary/20 blur-[120px] mix-blend-multiply" 
                />
            </div>

            <motion.main 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Glassmorphism Card */}
                <div className="glass rounded-[32px] shadow-2xl p-8 lg:p-10 relative overflow-hidden">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                    
                    <div className="flex flex-col items-center mb-10">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-primary/10 mb-6 shadow-lg shadow-primary/5"
                        >
                            <Shield className="w-8 h-8 text-primary" />
                        </motion.div>
                        <h2 className="text-3xl font-bold text-foreground font-['Outfit'] tracking-tight mb-2">Smart No Due</h2>
                        <p className="text-muted-foreground text-sm text-center">Enter your credentials to access the portal</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Email or Register No.</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground font-medium"
                                    placeholder="name@institution.edu or Reg No"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Password</label>
                                <button type="button" onClick={() => toast.error('Please contact your mentor or staff to reset your password.')} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Forgot Password?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-3 backdrop-blur-sm"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full premium-gradient text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Authenticate</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground text-sm">
                            New to the platform?{' '}
                            <button onClick={() => navigate('/register')} className="text-primary font-semibold hover:text-primary/80 transition-colors">
                                Request Access
                            </button>
                        </p>
                    </div>

                    {/* Roles Hint */}
                    <div className="mt-10 pt-8 border-t border-slate-200">
                        <div className="flex items-center justify-center gap-6">
                            {[
                                { icon: Shield, label: 'Mentor' },
                                { icon: Users, label: 'Staff' },
                                { icon: GraduationCap, label: 'Student' }
                            ].map((role, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 text-slate-500 hover:text-primary transition-colors cursor-default group">
                                    <role.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] uppercase tracking-widest font-semibold">{role.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


            </motion.main>
        </div>
    );
}

