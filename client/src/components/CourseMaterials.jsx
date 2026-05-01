import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FileText, Download, Trash2, UploadCloud, Plus, BookOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

export default function CourseMaterials({ subjectId, role = 'STUDENT' }) {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [formData, setFormData] = useState({ title: '', category: 'NOTES' });

    useEffect(() => {
        if (subjectId) fetchMaterials();
    }, [subjectId]);

    const fetchMaterials = async () => {
        if (!subjectId) return;
        try {
            const res = await api.get(`/materials/subject/${subjectId}`);
            setMaterials(res.data);
        } catch (err) {
            console.error("Failed to fetch materials");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !formData.title) return;

        const data = new FormData();
        data.append('file', file);
        data.append('title', formData.title);
        data.append('category', formData.category);
        data.append('subjectId', subjectId);

        setUploading(true);
        try {
            await api.post('/materials', data);
            setShowUpload(false);
            setFormData({ title: '', category: 'NOTES' });
            fetchMaterials();
            toast.success("Material uploaded successfully!");
        } catch (err) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this material?")) return;
        try {
            await api.delete(`/materials/${id}`);
            setMaterials(prev => prev.filter(m => m.id !== id));
            toast.success("Material deleted successfully.");
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    if (loading) return <div className="animate-pulse space-y-3"><div className="h-20 bg-slate-100 rounded-2xl" /></div>;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">
                            Resources
                        </h3>
                    </div>
                    {role !== 'STUDENT' && (
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className="bg-primary/10 hover:bg-primary transition-all p-1.5 rounded-lg text-primary hover:text-white"
                            title="Add Material"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Unit 1 Notes"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800"
                                >
                                    <option value="NOTES">Handout / Notes</option>
                                    <option value="SYLLABUS">Syllabus</option>
                                    <option value="QUESTION_PAPER">Prev Question Paper</option>
                                </select>
                            </div>
                        </div>
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-2xl transition-all cursor-pointer group">
                            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-primary mb-2" />
                            <span className="text-xs font-bold text-slate-500 group-hover:text-primary">Choose File to Upload</span>
                            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading || !formData.title} />
                            {uploading && <div className="mt-4 w-full h-1 bg-primary/20 rounded-full overflow-hidden"><div className="h-full bg-primary animate-progress" /></div>}
                        </label>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-3">
                {materials.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                        No academic resources available yet
                    </div>
                ) : (
                    materials.map(m => (
                        <div key={m.id} className="p-3 bg-white hover:bg-slate-50 rounded-[1.25rem] border border-slate-200 transition-all group shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary group-hover:scale-105 transition-transform font-bold">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-[11px] font-black text-slate-800 truncate uppercase tracking-wider">{m.title}</h4>
                                    <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary whitespace-nowrap">{m.category}</span>
                                        <span className="text-[8px] text-muted-foreground font-medium truncate opacity-60">• {m.fileType}</span>
                                    </div>
                                </div>
                                 <div className="flex items-center gap-0.5 ml-2">
                                    <a
                                        href={(() => {
                                            const url = m.fileUrl;
                                            if (!url) return '#';
                                            
                                            let backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : window.location.origin;
                                            if (backendBase.endsWith('/')) backendBase = backendBase.slice(0, -1);

                                            if (url.startsWith('https://res.cloudinary.com')) {
                                                const token = localStorage.getItem('token');
                                                return `${backendBase}/api/proxy?url=${encodeURIComponent(url)}&token=${token}`;
                                            }

                                            if (url.startsWith('http')) return url;
                                            return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
                                        })()}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-lg transition-all"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </a>
                                    {role !== 'STUDENT' && (
                                        <button
                                            onClick={() => handleDelete(m.id)}
                                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
