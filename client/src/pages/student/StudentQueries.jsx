import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { SkeletonTable } from '../../components/Skeletons';
import EmptyState from '../../components/EmptyState';
import useStudentData from '../../hooks/useStudentData';

export default function StudentQueries() {
    const { subjects } = useStudentData();
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [form, setForm] = useState({ subjectId: '', message: '' });
    const [sending, setSending] = useState(false);

    useEffect(() => { fetchQueries(); }, []);

    const fetchQueries = async () => {
        try {
            const res = await api.get('/queries');
            setQueries(res.data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.subjectId || !form.message.trim()) return;
        setSending(true);
        try {
            await api.post('/queries', form);
            toast.success('Query sent!');
            setForm({ subjectId: '', message: '' });
            setShowNew(false);
            fetchQueries();
        } catch { toast.error('Failed to send query'); }
        finally { setSending(false); }
    };

    if (loading) return <SkeletonTable rows={3} cols={3} />;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Subject Queries</h2>
                    <p className="text-sm text-muted-foreground">Ask your instructors questions per subject</p>
                </div>
                <button onClick={() => setShowNew(!showNew)}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-primary/90 transition-all">
                    <Send className="w-4 h-4" /> New Query
                </button>
            </div>

            {showNew && (
                <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit} className="glass rounded-2xl border border-white/10 p-6 space-y-4">
                    <select value={form.subjectId} onChange={(e) => setForm(p => ({ ...p, subjectId: e.target.value }))} required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Select subject...</option>
                        {subjects.map(s => (
                            <option key={s.subjectId} value={s.subjectId}>{s.subject.name} ({s.subject.code})</option>
                        ))}
                    </select>
                    <textarea value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} required rows={3} placeholder="Describe your query..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
                    <div className="flex items-center gap-3">
                        <button type="submit" disabled={sending}
                            className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all disabled:opacity-50">
                            {sending ? 'Sending...' : 'Send Query'}
                        </button>
                        <button type="button" onClick={() => setShowNew(false)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-all">Cancel</button>
                    </div>
                </motion.form>
            )}

            <div className="space-y-4">
                {queries.length === 0 ? (
                    <EmptyState icon="default" title="No queries yet" description="Ask your instructors questions about your subjects." />
                ) : queries.map((q, i) => (
                    <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="glass rounded-2xl border border-white/10 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">{q.subject?.name || 'Unknown'}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{q.subject?.code}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {q.isResolved ? (
                                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">
                                        <CheckCircle2 className="w-3 h-3" /> Resolved
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-500/10 px-2 py-1 rounded-lg">
                                        <Clock className="w-3 h-3" /> Pending
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="ml-11">
                            <p className="text-sm text-foreground mb-3">{q.message}</p>
                            {q.response && (
                                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Staff Response</div>
                                    <p className="text-sm text-foreground">{q.response}</p>
                                </div>
                            )}
                            <div className="text-[9px] text-muted-foreground mt-2">
                                {new Date(q.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
