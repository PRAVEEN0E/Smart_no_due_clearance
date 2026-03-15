import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Clock, User, BookOpen, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function VerificationPage() {
    const { studentId } = useParams();
    const [status, setStatus] = useState('loading'); // 'loading', 'valid', 'invalid'
    const [data, setData] = useState(null);

    useEffect(() => {
        const verifyTicket = async () => {
            try {
                // Public endpoint or one that doesn't need student login
                const res = await api.get(`/student/verify/${studentId}`);
                setData(res.data);
                setStatus('valid');
            } catch (err) {
                setStatus('invalid');
            }
        };
        verifyTicket();
    }, [studentId]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#020c0c] flex items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020c0c] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg glass p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    {status === 'valid' ? <ShieldCheck className="w-32 h-32" /> : <ShieldAlert className="w-32 h-32" />}
                </div>

                <div className="text-center relative z-10">
                    <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border ${status === 'valid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {status === 'valid' ? <ShieldCheck className="w-10 h-10" /> : <ShieldAlert className="w-10 h-10" />}
                    </div>

                    <h1 className="text-3xl font-black italic tracking-tighter mb-2">
                        {status === 'valid' ? 'AUTHENTIC TICKET' : 'INVALID TICKET'}
                    </h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-[0.3em] font-bold">
                        Institutional Verification System
                    </p>
                </div>

                {status === 'valid' && data && (
                    <div className="mt-8 space-y-6 relative z-10">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-primary" />
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Student Name</div>
                                    <div className="text-lg font-bold">{data.studentName}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-primary" />
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Issued On</div>
                                    <div className="text-sm font-bold text-white/80">{new Date(data.generatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-2">
                                <BookOpen className="w-3 h-3" /> Approved Subjects
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {data.subjects.map((sub, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                        <span className="text-sm font-semibold text-emerald-100">{sub.name}</span>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 text-center">
                            <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Validation ID</div>
                            <div className="text-xs font-mono text-primary font-bold">{data.verificationCode}</div>
                        </div>
                    </div>
                )}

                {status === 'invalid' && (
                    <div className="mt-8 text-center space-y-4 relative z-10">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            We could not find a record for this Hall Ticket. This may be due to an expired link or an unofficial document.
                        </p>
                        <Link to="/login" className="inline-block text-primary text-sm font-bold hover:underline">
                            Return to Portal
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
