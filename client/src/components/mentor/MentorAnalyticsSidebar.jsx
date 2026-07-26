import { TrendingUp, GraduationCap, UserPlus, BookOpen, Settings, Upload, ShieldCheck, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function MentorAnalyticsSidebar({
    subjects, onAddClick, onBulkUpload, uploadLoading, onCommonFee
}) {
    const chartData = [
        { name: 'Theory', val: subjects.filter(s => s.type === 'FULL_THEORY').length },
        { name: 'Lab', val: subjects.filter(s => s.type === 'FULL_LAB').length },
        { name: 'Both', val: subjects.filter(s => s.type === 'THEORY_WITH_LAB').length },
    ];

    return (
        <div className="space-y-8 text-sm">
            <div className="glass p-6 rounded-3xl border border-white/10">
                <div className="flex items-center gap-2 mb-6 font-bold">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3>Subject Distribution</h3>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                            <XAxis dataKey="name" stroke="#666" fontSize={10} />
                            <YAxis stroke="#666" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                            <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass p-6 rounded-3xl border border-white/10">
                <h3 className="font-bold mb-4 opacity-70 uppercase tracking-widest text-[10px]">Quick Management</h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'New Student', icon: GraduationCap, type: 'student' },
                        { label: 'New Faculty', icon: UserPlus, type: 'staff' },
                        { label: 'New Subject', icon: BookOpen, type: 'subject' },
                        { label: 'Settings', icon: Settings, type: 'settings' },
                    ].map((link, i) => (
                        <button key={i} onClick={() => { if (link.type === 'settings') toast('Settings available in the Super Admin panel.'); else onAddClick(link.type); }}
                            className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all text-left flex flex-col gap-3 group">
                            <link.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-[11px]">{link.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass p-6 rounded-3xl border border-white/10">
                <h3 className="font-bold mb-4 opacity-70 uppercase tracking-widest text-[10px]">Bulk Operations</h3>
                <div className="space-y-3">
                    <label className="flex flex-col p-4 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-all"><Upload className="w-4 h-4 text-primary" /></div>
                            <div><div className="font-bold text-xs text-foreground">Import Students</div><div className="text-[9px] text-muted-foreground">Excel/CSV Format</div></div>
                        </div>
                        <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => onBulkUpload('students', e)} disabled={uploadLoading} />
                    </label>
                    <label className="flex flex-col p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-all"><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
                            <div><div className="font-bold text-xs text-foreground">Update Fee Balances</div><div className="text-[9px] text-muted-foreground">Sync Financial Records</div></div>
                        </div>
                        <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => onBulkUpload('fees', e)} disabled={uploadLoading} />
                    </label>
                    <button onClick={onCommonFee} className="flex flex-col p-4 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all text-left group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-200/50 rounded-lg group-hover:bg-amber-200 transition-all"><Wallet className="w-4 h-4 text-amber-600" /></div>
                            <div><div className="font-bold text-xs text-foreground">Assign Common Fee</div><div className="text-[9px] text-muted-foreground">Add fee to all your students</div></div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
