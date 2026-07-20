import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, User, Mail, Lock, Building2, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import api from '../../lib/api';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { setAuth, logout, navigate } = useAuth();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/register-mentor', { 
                name, 
                email, 
                password, 
                collegeName: collegeName.trim() || `${name}'s Institution`,
                department: department || null
            });

            logout();

            const { data } = await api.post('/auth/login', { email, password });
            setAuth(data.user);

            setSuccess(true);
            setTimeout(() => navigate('/mentor'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => navigate('/login')}
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
                            Join the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Mentor Network</span>
                        </motion.h1>
                        <p className="text-slate-400 text-lg max-w-md">
                            Empower your institution with smart automated clearance and student management tools.
                        </p>
                        
                        <div className="space-y-4 pt-4">
                            {[
                                { title: 'Manage Departments', desc: 'Full control over student groups.', icon: Sparkles },
                                { title: 'Automated Flow', desc: 'No more manual signatures.', icon: CheckCircle2 }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + (i * 0.1) }}
                                    className="flex items-start gap-4"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                        <item.icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                                        <p className="text-slate-500 text-xs">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-20">
                         <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} className="w-8 h-8 rounded-full border-2 border-[#0a0a0b]" alt="user" />
                            ))}
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold border-2 border-[#0a0a0b]">+50</div>
                        </div>
                        <p className="text-slate-500 text-[10px] mt-2 font-medium uppercase tracking-widest">Trusted by 50+ Departments</p>
                    </div>
                </div>

                {/* Right Section: Form */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-12"
                            >
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-900 font-['Outfit'] mb-2">Registration Successful!</h3>
                                <p className="text-slate-500">Redirecting you to your dashboard...</p>
                            </motion.div>
                        ) : (
                            <>
                                <div className="mb-8 text-center lg:text-left">
                                    <h2 className="text-3xl font-bold text-slate-900 font-['Outfit'] tracking-tight">Create Mentor Account</h2>
                                    <p className="text-slate-500 mt-2">Get started with Smart No Due platform.</p>
                                </div>

                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                                            <div className="relative group">
                                                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <input
                                                    required
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all text-slate-800 text-sm font-medium"
                                                    placeholder="Dr. John Doe"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 ml-1">Department Name</label>
                                            <div className="relative group">
                                                <Building2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <input
                                                    required
                                                    type="text"
                                                    value={collegeName}
                                                    onChange={(e) => setCollegeName(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all text-slate-800 text-sm font-medium"
                                                    placeholder="E.g. Vellalar College of Engineering (VCET)"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 ml-1">Your Department</label>
                                        <div className="relative group">
                                            <BookOpen className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                                            <select
                                                required
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all text-slate-800 text-sm font-medium appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Your Department</option>
                                                <option value="CSE">CSE - Computer Science</option>
                                                <option value="ECE">ECE - Electronics & Communication</option>
                                                <option value="EEE">EEE - Electrical & Electronics</option>
                                                <option value="MECH">MECH - Mechanical</option>
                                                <option value="CIVIL">CIVIL - Civil Engineering</option>
                                                <option value="IT">IT - Information Technology</option>
                                                <option value="AIDS">AIDS - AI & Data Science</option>
                                                <option value="AIML">AIML - AI & Machine Learning</option>
                                                <option value="BME">BME - Biomedical</option>
                                                <option value="MBA">MBA - Business Administration</option>
                                                <option value="MCA">MCA - Computer Applications</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 ml-1">Department Email</label>
                                        <div className="relative group">
                                            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                required
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all text-slate-800 text-sm font-medium"
                                                placeholder="mentor@department.edu"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
                                        <div className="relative group">
                                            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                required
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-white transition-all text-slate-800 text-sm font-medium"
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
                                                className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2"
                                            >
                                                <div className="w-1 h-1 rounded-full bg-red-600" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Create Account</span>
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-8 text-center">
                                    <p className="text-slate-500 text-sm">
                                        Already have an account?{' '}
                                        <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline transition-all">
                                            Sign In
                                        </button>
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

