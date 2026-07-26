import { Megaphone, Upload, TrendingUp, FileDown } from 'lucide-react';

export default function MentorHeader({
    onAnnounce, onBulkUpload, onExportFees, onExportPDF, uploadLoading
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent italic uppercase">
                    System Overview
                </h1>
                <p className="text-muted-foreground font-medium italic">Manage institution records & faculty assignments.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <button onClick={onAnnounce} className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-xl border border-primary/20 transition-all font-bold text-sm shadow-sm">
                    <Megaphone className="w-4 h-4" /> Announcement
                </button>
                <div className="h-8 w-[1px] bg-border mx-1 hidden md:block" />
                <label className="flex items-center gap-2 bg-muted hover:bg-accent/10 px-4 py-2.5 rounded-xl border border-border cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold">Students Excel</span>
                    <input type="file" className="hidden" onChange={(e) => onBulkUpload('students', e)} accept=".xlsx,.csv" />
                </label>
                <label className="flex items-center gap-2 bg-muted hover:bg-accent/10 px-4 py-2.5 rounded-xl border border-border cursor-pointer transition-all shadow-sm">
                    <Upload className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold">Fees Excel</span>
                    <input type="file" className="hidden" onChange={(e) => onBulkUpload('fees', e)} accept=".xlsx,.csv" />
                </label>
                <button onClick={onExportFees} className="flex items-center gap-2 bg-muted hover:bg-accent/10 px-4 py-2.5 rounded-xl border border-border transition-all shadow-sm group" title="Export current fee balances">
                    <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-foreground">Export Report</span>
                </button>
                <button onClick={onExportPDF} className="flex items-center gap-2 bg-muted hover:bg-accent/10 px-4 py-2.5 rounded-xl border border-border transition-all shadow-sm group" title="Export PDF fee report">
                    <FileDown className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-foreground">Export PDF</span>
                </button>
            </div>
        </div>
    );
}
