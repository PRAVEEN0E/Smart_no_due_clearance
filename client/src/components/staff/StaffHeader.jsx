import { FileSpreadsheet, FileDown, TrendingUp, Camera } from 'lucide-react';

export default function StaffHeader({ activeTab, setActiveTab, onExportExcel, onExportPDF }) {
    return (
        <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent italic uppercase">
                        Faculty Portal
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium italic">Review performance & finalize records.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    {activeTab === 'performance' && (
                        <>
                            <button onClick={onExportExcel} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-5 py-3 rounded-2xl border border-slate-200 transition-all group shadow-sm">
                                <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
                                <span className="text-sm font-bold">Export Excel</span>
                            </button>
                            <button onClick={onExportPDF} className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-5 py-3 rounded-2xl border border-primary/20 transition-all group shadow-sm">
                                <FileDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold">Export PDF</span>
                            </button>
                        </>
                    )}
                    <div className="glass px-6 py-3 rounded-2xl border border-border flex items-center gap-3 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm font-bold">Session Active</span>
                    </div>
                </div>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 max-w-md shadow-sm">
                <button onClick={() => setActiveTab('performance')}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'performance' ? 'bg-white text-primary shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
                    <TrendingUp className="w-4 h-4" /> Academic Approvals
                </button>
                <button onClick={() => setActiveTab('scanner')}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'scanner' ? 'bg-white text-primary shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
                    <Camera className="w-4 h-4" /> QR Exam Scanner
                </button>
            </div>
        </>
    );
}
