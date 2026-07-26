import { Search, Plus, CheckCircle2, CreditCard, ShieldCheck, Edit, Trash2, Link as LinkIcon, AlertCircle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import EmptyState from '../EmptyState';
import TabNav from '../ui/TabNav';

const TABS = [
    { key: 'students', label: 'Students' }, { key: 'staff', label: 'Staff' },
    { key: 'subjects', label: 'Subjects' }, { key: 'workflow', label: 'Workflow' },
    { key: 'audit', label: 'Audit' }, { key: 'announcements', label: 'Announcements' },
];

export default function MentorTable({
    activeTab, setActiveTab, searchQuery, getFilteredData, user,
    onAddClick, onEditClick, onDeleteItem, onToggleFee, onEnrollStudent,
    onCustomClearance, onAssignStaff, onAuditLog, onSearch,
    studentPage, studentTotal, studentTotalPages, onPageChange,
    filterFeeStatus, onFilterChange, onRestoreItem,
}) {
    const handleSearchChange = (e) => {
        if (onSearch) {
            onSearch(e.target.value);
        }
    };

    return (
        <div className="lg:col-span-2 glass rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <TabNav tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
            </div>
            {activeTab !== 'workflow' && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-muted border-b border-border">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground/50">{activeTab}</h2>
                        <div className="h-4 w-[1px] bg-border" />
                        <div className="text-[10px] font-mono text-muted-foreground uppercase opacity-80">
                            {activeTab === 'students' ? `${studentTotal || 0} Records found` : `${getFilteredData.length} Records found`}
                        </div>
                        {activeTab === 'students' && studentTotalPages > 1 && (
                            <div className="text-[10px] font-mono text-muted-foreground">
                                Page {studentPage || 1} of {studentTotalPages || 1}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {activeTab === 'students' && (
                            <select value={filterFeeStatus} onChange={(e) => onFilterChange?.({ feeStatus: e.target.value })}
                                className="bg-muted border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary/50"
                                aria-label="Fee status filter">
                                <option value="all">All Fees</option>
                                <option value="cleared">Cleared</option>
                                <option value="pending">Pending</option>
                            </select>
                        )}
                        <div className="relative group">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input type="text" placeholder={`Filter ${activeTab}...`} aria-label={`Filter ${activeTab}...`}
                                defaultValue={searchQuery}
                                onChange={handleSearchChange}
                                className="bg-muted border border-border rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all w-full md:w-[200px]" />
                        </div>
                        <button onClick={() => {
                            const mode = activeTab === 'students' ? 'student' : activeTab === 'staff' ? 'staff' : activeTab === 'subjects' ? 'subject' : 'announcement';
                            onAddClick(mode);
                        }} className="bg-primary/20 hover:bg-primary p-2 rounded-xl text-primary hover:text-white transition-all shadow-lg active:scale-95" title={`Add ${activeTab}`} aria-label={`Add ${activeTab}`}>
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto text-sm">
                {activeTab === 'workflow' ? (
                    onAuditLog
                ) : activeTab === 'audit' ? (
                    <div className="divide-y divide-border max-h-[600px] overflow-y-auto custom-scrollbar">
                        {getFilteredData.length > 0 ? getFilteredData.map((log, i) => (
                            <div key={i} className="p-6 hover:bg-muted transition-all group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${log.action === 'MARK_UPDATE' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-primary shadow-[0_0_8px_rgba(37,99,235,0.3)]'}`} />
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-sm font-bold text-foreground">{log.userEmail}</span>
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${log.action === 'MARK_UPDATE' ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-primary/10 border-primary/20 text-primary'}`}>{log.action}</span>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground leading-relaxed font-mono bg-muted p-3 rounded-xl border border-border mt-2">
                                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">{new Date(log.createdAt).toLocaleString()}</div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <div className="p-4 bg-white/5 rounded-full"><AlertCircle className="w-8 h-8 opacity-20" /></div>
                                <div className="text-muted-foreground italic text-xs">No audit signals detected.</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border bg-muted">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">{activeTab === 'announcements' ? 'Title' : 'Identification'}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">{activeTab === 'subjects' ? 'Code' : activeTab === 'announcements' ? 'Category' : 'Contact'}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">{activeTab === 'students' ? 'Subjects' : activeTab === 'staff' ? 'Role' : activeTab === 'announcements' ? 'Priority' : 'Faculty'}</th>
                                    {activeTab === 'students' && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Finance</th>}
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-medium">
                                {getFilteredData.length === 0 ? (
                                    <tr><td colSpan={5}>
                                        <EmptyState title={`No ${activeTab} found`} description={searchQuery ? `No ${activeTab} match your search.` : `No ${activeTab} have been added yet.`} />
                                    </td></tr>
                                ) : getFilteredData.map((item, i) => (
                                    <tr key={i} className="hover:bg-muted transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-foreground font-bold">
                                                {item.name || item.title}
                                                {user?.id === item.id && <span className="text-[10px] text-primary ml-1 font-bold bg-primary/10 px-1 rounded">(You)</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground font-mono text-[11px]">
                                            {activeTab === 'students' ? (
                                                <div className="flex flex-col">
                                                    <span>{item.email}</span>
                                                    {item.registerNumber && <span className="text-[10px] text-muted-foreground">Reg: {item.registerNumber}</span>}
                                                </div>
                                            ) : item.email || item.code || item.type}
                                        </td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'students' ? (
                                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                    {item.studentSubjects?.length > 0 ? item.studentSubjects.map((s, idx) => (
                                                        <span key={idx} className="text-[9px] bg-muted px-2 py-0.5 rounded-md border border-border text-muted-foreground font-bold">{s.subject?.code || s.subjectCode}</span>
                                                    )) : <span className="text-[9px] text-orange-600 font-bold">No Subjects</span>}
                                                </div>
                                            ) : activeTab === 'staff' ? (
                                                <span className="text-[10px] bg-blue-400/10 text-blue-400 px-2 py-1 rounded-lg border border-blue-400/20 uppercase font-bold">Faculty</span>
                                            ) : activeTab === 'announcements' ? (
                                                <span className={`text-[10px] px-2 py-1 rounded-lg border uppercase font-bold ${
                                                    item.priority === 3 ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                                                    item.priority === 2 ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' :
                                                    'bg-blue-400/10 text-blue-400 border-blue-400/20'}`}>
                                                    {item.priority === 3 ? 'Critical' : item.priority === 2 ? 'Important' : 'Info'}
                                                </span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.staffAssignments?.length > 0 ? item.staffAssignments.map((a, idx) => (
                                                        <span key={idx} className="text-[10px] bg-white/5 px-2 py-1 rounded-lg border border-white/10">{a.staff?.name || a.staffName}</span>
                                                    )) : <span className="text-[10px] text-orange-400 italic">Unassigned</span>}
                                                </div>
                                            )}
                                        </td>
                                        {activeTab === 'students' && (
                                            <td className="px-6 py-4">
                                                <button onClick={() => onToggleFee(item.id, item.feeRecord?.feeClearedManual)}
                                                    className={`w-full max-w-[140px] flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all duration-300 font-bold text-[11px] tracking-tight whitespace-nowrap ${
                                                        (item.feeRecord?.feeClearedAuto || item.feeRecord?.feeClearedManual)
                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200/50 hover:bg-emerald-600'
                                                            : 'bg-card text-foreground border-2 border-foreground hover:bg-foreground hover:text-background shadow-sm'
                                                    }`}>
                                                    <span>{(item.feeRecord?.feeClearedAuto || item.feeRecord?.feeClearedManual) ? 'PAID' : 'PAY NOW'}</span>
                                                    {(item.feeRecord?.feeClearedAuto || item.feeRecord?.feeClearedManual) ? <CheckCircle2 className="w-4 h-4" /> : <CreditCard className="w-4 h-4 opacity-50" />}
                                                </button>
                                                <div className="text-[10px] mt-1 text-muted-foreground font-mono">Bal: ₹{(item.feeRecord?.feeClearedAuto || item.feeRecord?.feeClearedManual) ? 0 : (item.feeRecord?.feeBalance || 0)}</div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {activeTab === 'students' && (
                                                    <button onClick={() => onEnrollStudent(item)} className="p-1.5 hover:bg-accent/10 rounded-lg text-primary transition-all" title="Enroll in Subject" aria-label="Enroll in Subject">
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {activeTab === 'students' && (
                                                    <button onClick={() => onCustomClearance(item)} className="p-1.5 hover:bg-accent/10 rounded-lg text-violet-600 transition-all shadow-sm active:scale-95" title="Custom Clearance Checklist" aria-label="Custom Clearance Checklist">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {activeTab === 'subjects' && (
                                                    <button onClick={() => onAssignStaff(item)} className="p-1.5 hover:bg-accent/10 rounded-lg text-primary transition-all" title="Assign Staff" aria-label="Assign Staff">
                                                        <LinkIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {activeTab !== 'audit' && activeTab !== 'workflow' && (
                                                    <button onClick={() => onEditClick(activeTab === 'subjects' ? 'subject' : activeTab === 'staff' ? 'staff' : activeTab === 'announcements' ? 'announcement' : 'student', item)}
                                                        className="p-1.5 hover:bg-accent/10 rounded-lg text-muted-foreground hover:text-foreground transition-all" title="Edit" aria-label="Edit">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {onRestoreItem && item.deletedAt && (
                                                    <button onClick={() => onRestoreItem(activeTab === 'subjects' ? 'subject' : activeTab === 'staff' ? 'staff' : activeTab === 'students' ? 'student' : 'announcement', item.id)}
                                                        className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-500 hover:text-emerald-600 transition-all" title="Restore" aria-label="Restore">
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {(activeTab !== 'staff' || user?.id !== item.id) && !item.deletedAt && (
                                                    <button onClick={() => onDeleteItem(activeTab === 'subjects' ? 'subject' : activeTab === 'staff' ? 'staff' : activeTab === 'students' ? 'student' : 'announcement', item.id)}
                                                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-600 transition-all" title="Delete" aria-label="Delete">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {activeTab === 'students' && studentTotalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted">
                                <div className="text-[10px] font-mono text-muted-foreground">{studentTotal || 0} total students</div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onPageChange((studentPage || 1) - 1)}
                                        disabled={studentPage <= 1}
                                        className="p-1.5 hover:bg-accent/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        aria-label="Previous page">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: Math.min(studentTotalPages || 1, 5) }, (_, i) => {
                                        const page = Math.max(1, Math.min(studentPage - 2, studentTotalPages - 4)) + i;
                                        if (page > (studentTotalPages || 1)) return null;
                                        return (
                                            <button key={page} onClick={() => onPageChange(page)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === (studentPage || 1) ? 'bg-primary text-white shadow-sm' : 'hover:bg-accent/10 text-muted-foreground'}`}>
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button onClick={() => onPageChange((studentPage || 1) + 1)}
                                        disabled={studentPage >= (studentTotalPages || 1)}
                                        className="p-1.5 hover:bg-accent/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        aria-label="Next page">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
