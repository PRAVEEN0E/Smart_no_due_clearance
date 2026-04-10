import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../lib/api';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { setAuth, logout, navigate } = useAuth();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Step 1: Register the new mentor account (Defaulting college name to ensure backend success)
            await api.post('/auth/register-mentor', { 
                name, 
                email, 
                password, 
                collegeName: name ? `${name}'s Institution` : "My College" 
            });

            // Step 2: Clear any stale session (old admin token) from localStorage
            logout();

            // Step 3: Auto-login as the newly created mentor so the correct JWT is set
            const { data } = await api.post('/auth/login', { email, password });
            setAuth(data.user, data.token);

            setSuccess(true);
            // Step 4: Go directly to the mentor dashboard — already authenticated as new mentor
            setTimeout(() => navigate('/mentor'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background text-foreground">
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
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent italic uppercase">JOIN US</h1>
                    <p className="text-primary font-bold tracking-widest text-[10px] uppercase mt-1">Mentor Registration</p>
                </div>


                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center p-8 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-600 space-y-3"
                    >
                        <CheckCircle2 className="w-12 h-12 mx-auto" />
                        <h3 className="font-bold text-xl">Account Created!</h3>
                        <p className="text-sm text-green-600/70">Logging you in automatically...</p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80 ml-1">Full Name</label>
                            <input
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                                placeholder="Dr. John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80 ml-1">College Email</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                                placeholder="mentor@college.edu"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/80 ml-1">Password</label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/30 transition-all text-foreground"
                                placeholder="••••••••"
                            />
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
                            {loading
                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <><Shield className="w-4 h-4" /> Create Mentor Account</>
                            }
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        Already have an account? <span className="text-primary font-bold">Sign In</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
