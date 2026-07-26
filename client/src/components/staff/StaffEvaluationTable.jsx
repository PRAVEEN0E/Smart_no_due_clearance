import { useState, useRef, Fragment, useMemo, useCallback } from 'react';
import { Users, FileText, CheckCircle2, ShieldCheck, Sparkles, Eye, ExternalLink, X, Search, AlertTriangle, Undo2, RotateCcw, ChevronUp, ChevronDown, CheckCheck, Ban, Download, ArrowUpDown, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../EmptyState';

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
];

export default function StaffEvaluationTable({
    selectedSubject, evaluations, onUpdateMark, onApprove, onReject, onClearRejection,
    isReadyToApprove, onViewStudent, searchQuery, onSearchChange,
    statusFilter, onStatusFilterChange, selectedEvals, onToggleSelect, onToggleSelectAll,
    onBulkApprove, onBulkReject
}) {
    const type = selectedSubject?.subject.type;
    const [rejectModal, setRejectModal] = useState({ open: false, evalId: null });
    const [bulkRejectModal, setBulkRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [approveConfirm, setApproveConfirm] = useState({ open: false, evalId: null });
    const [sortField, setSortField] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [savingField, setSavingField] = useState(null);
    const inputRefs = useRef({});

    const allSelected = evaluations.length > 0 && selectedEvals.size === evaluations.length;
    const someSelected = selectedEvals.size > 0 && selectedEvals.size < evaluations.length;

    const sortedEvals = useMemo(() => {
        if (!sortField) return evaluations;
        return [...evaluations].sort((a, b) => {
            let aVal, bVal;
            if (sortField === 'name') { aVal = a.student.name; bVal = b.student.name; }
            else if (sortField === 'marks') { aVal = a.internalMarksTotal || 0; bVal = b.internalMarksTotal || 0; }
            else if (sortField === 'attendance') { aVal = a.attendancePercent || 0; bVal = b.attendancePercent || 0; }
            else if (sortField === 'status') { aVal = a.staffApproved ? 2 : a.staffRejected ? 1 : 0; bVal = b.staffApproved ? 2 : b.staffRejected ? 1 : 0; }
            else return 0;
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [evaluations, sortField, sortDir]);

    const handleSort = (field) => {
        if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-30" />;
        return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
    };

    const handleApproveClick = (evalId) => setApproveConfirm({ open: true, evalId });
    const handleApproveConfirm = () => { if (approveConfirm.evalId) onApprove(approveConfirm.evalId); setApproveConfirm({ open: false, evalId: null }); };

    const handleRejectClick = (evalId) => { setRejectModal({ open: true, evalId }); setRejectReason(''); };
    const handleRejectConfirm = () => { if (rejectModal.evalId && rejectReason.trim()) { onReject(rejectModal.evalId, rejectReason.trim()); } setRejectModal({ open: false, evalId: null }); setRejectReason(''); };

    const handleBulkRejectConfirm = () => { if (rejectReason.trim() && onBulkReject) { onBulkReject(rejectReason.trim()); } setBulkRejectModal(false); setRejectReason(''); };

    const handleFieldUpdate = useCallback((evalId, field, value) => {
        setSavingField(`${evalId}-${field}`);
        onUpdateMark(evalId, field, value);
        setTimeout(() => setSavingField(null), 600);
    }, [onUpdateMark]);

    const handleKeyDown = useCallback((e, evId, field, nextField, prevField) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextId = `${evId}-${nextField}`;
            if (inputRefs.current[nextId]) { inputRefs.current[nextId].focus(); }
        }
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            const nextId = `${evId}-${nextField}`;
            if (inputRefs.current[nextId]) { inputRefs.current[nextId].focus(); }
        }
        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            const prevId = `${evId}-${prevField}`;
            if (inputRefs.current[prevId]) { inputRefs.current[prevId].focus(); }
        }
    }, []);

    const statusCounts = useMemo(() => {
        const approved = evaluations.filter(e => e.staffApproved).length;
        const rejected = evaluations.filter(e => e.staffRejected).length;
        const pending = evaluations.filter(e => !e.staffApproved && !e.staffRejected).length;
        return { approved, rejected, pending, total: evaluations.length };
    }, [evaluations]);

    const pendingEvals = useMemo(() => evaluations.filter(e => !e.staffApproved && !e.staffRejected), [evaluations]);

    return (
        <>
            {/* Status Filter Tabs + Bulk Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex gap-2">
                    {STATUS_TABS.map(tab => (
                        <button key={tab.key} onClick={() => onStatusFilterChange(tab.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                                statusFilter === tab.key
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10'
                            }`}>
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded-lg text-[10px] ${
                                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>{statusCounts[tab.key] || statusCounts.total}</span>
                        </button>
                    ))}
                </div>
                {selectedEvals.size > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground mr-2">{selectedEvals.size} selected</span>
                        <button onClick={onBulkApprove} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                            <CheckCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => { setBulkRejectModal(true); setRejectReason(''); }} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 transition-all border border-red-500/20">
                            <Ban className="w-3.5 h-3.5" /> Reject
                        </button>
                    </div>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-xs mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50" />
            </div>

            <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] md:tracking-[0.25em] bg-white/[0.03] backdrop-blur-md sticky top-0 z-10">
                                <th className="px-2 md:px-4 py-4 md:py-8 w-10 border-b border-border">
                                    <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }}
                                        onChange={onToggleSelectAll}
                                        className="w-4 h-4 rounded border-white/20 accent-primary cursor-pointer" />
                                </th>
                                <th className="px-2 md:px-4 py-4 md:py-8 min-w-[200px] md:min-w-[240px] border-b border-border rounded-tl-2xl md:rounded-tl-3xl cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                    Student <SortIcon field="name" />
                                </th>
                                <th className="px-2 md:px-4 py-4 md:py-8 text-center text-primary/80 w-[70px] md:w-[90px] border-b border-border">Files</th>
                                {type === 'FULL_LAB' ? (
                                    <>
                                        <th className="px-4 md:px-6 py-4 md:py-8 text-center w-[120px] md:w-[160px] border-l border-b border-white/10 bg-white/[0.02]">Model Lab<span className="block text-[8px] font-normal">/100</span></th>
                                        <th className="px-4 md:px-6 py-4 md:py-8 text-center w-[160px] md:w-[200px] border-l border-b border-white/10 bg-white/[0.02]">Activities<span className="block text-[8px] font-normal">/10</span></th>
                                    </>
                                ) : type === 'THEORY_WITH_LAB' ? (
                                    <>
                                        <th className="px-4 md:px-6 py-4 md:py-8 text-center w-[140px] md:w-[180px] border-l border-b border-white/10 bg-white/[0.02]">CAT<span className="block text-[8px] font-normal">/50 each</span></th>
                                        <th className="px-4 md:px-6 py-4 md:py-8 text-center w-[200px] md:w-[240px] border-l border-b border-white/10 bg-white/[0.02]">Assign<span className="block text-[8px] font-normal">/10</span></th>
                                        <th className="px-4 md:px-6 py-4 md:py-8 text-center w-[110px] md:w-[140px] border-l border-b border-white/10 bg-white/[0.02]">Activity<span className="block text-[8px] font-normal">/10</span></th>
                                        <th className="px-4 md:px-6 py-4 md:py-8 text-center w-[120px] md:w-[160px] border-l border-b border-white/10 bg-white/[0.02]">Lab<span className="block text-[8px] font-normal">/100</span></th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-4 md:px-6 py-4 md:py-8 text-center w-[140px] md:w-[180px] border-l border-b border-white/10 bg-white/[0.02]">CAT<span className="block text-[8px] font-normal">/50</span></th>
                                        <th className="px-4 md:px-6 py-4 md:py-8 text-center w-[200px] md:w-[240px] border-l border-b border-white/10 bg-white/[0.02]">Assign<span className="block text-[8px] font-normal">/10</span></th>
                                        <th className="px-4 md:px-6 py-4 md:py-8 text-center w-[110px] md:w-[140px] border-l border-b border-white/10 bg-white/[0.02]">Activity<span className="block text-[8px] font-normal">/10</span></th>
                                    </>
                                )}
                                <th className="px-2 md:px-4 py-4 md:py-8 text-center w-[80px] md:w-[110px] border-l border-b border-white/10 bg-primary/5 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('attendance')}>
                                    Att % <SortIcon field="attendance" />
                                </th>
                                {type !== 'FULL_LAB' && (
                                    <th className="px-4 md:px-6 py-4 md:py-8 text-center w-[140px] md:w-[180px] border-l border-b border-white/10 bg-orange-500/5">Remedial</th>
                                )}
                                <th className="px-2 md:px-4 py-4 md:py-8 text-center w-[80px] md:w-[100px] font-black text-foreground border-l border-b border-white/10 bg-primary/10 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('marks')}>
                                    Final <SortIcon field="marks" />
                                </th>
                                <th className="px-4 md:px-8 py-4 md:py-8 text-right min-w-[200px] md:min-w-[240px] border-b border-border rounded-tr-2xl md:rounded-tr-3xl">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence mode="popLayout">
                                {sortedEvals.length === 0 ? (
                                    <tr><td colSpan={12}><EmptyState icon="users" title="No students match" description={searchQuery ? 'Try a different search term.' : 'No students assigned for this subject.'} /></td></tr>
                                ) : sortedEvals.map((ev) => {
                                    const isPending = !ev.staffApproved && !ev.staffRejected;
                                    const statusColor = ev.staffApproved ? 'text-emerald-400' : ev.staffRejected ? 'text-red-400' : 'text-amber-400';
                                    const statusLabel = ev.staffApproved ? 'Approved' : ev.staffRejected ? 'Rejected' : 'Pending';
                                    return (
                                    <motion.tr layout key={ev.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-4 py-6">
                                            <input type="checkbox" checked={selectedEvals.has(ev.id)} onChange={() => onToggleSelect(ev.id)}
                                                disabled={!isPending}
                                                className="w-4 h-4 rounded border-white/20 accent-primary cursor-pointer disabled:opacity-30" />
                                        </td>
                                        <td className="px-4 md:px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0 shadow-inner">{ev.student.name.charAt(0)}</div>
                                                <div>
                                                    <div className="font-bold text-foreground text-sm group-hover:text-primary transition-all duration-300 tracking-tight flex items-center gap-2">
                                                        {ev.student.name}
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${statusColor} bg-current/5`}>{statusLabel}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ev.student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center">
                                                {type !== 'FULL_LAB' ? (
                                                    <button onClick={() => onViewStudent(ev.student)} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-all relative group/btn">
                                                        <FileText className="w-5 h-5" />
                                                        {ev.student.assignments?.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />}
                                                    </button>
                                                ) : <span className="text-slate-300 text-[10px] font-bold">N/A</span>}
                                            </div>
                                        </td>
                                        {type === 'FULL_LAB' ? (
                                            <>
                                                <td className="px-6 py-6 border-l border-slate-100">{renderInput(ev, 'modelLabMarks', handleFieldUpdate, 'w-24 h-12', 0, 100, inputRefs, savingField, handleKeyDown, 'activity1')}</td>
                                                <td className="px-6 py-6 border-l border-slate-100">
                                                    <div className="flex gap-2.5 justify-center">
                                                        {[1, 2].map(n => <Fragment key={n}>{renderInput(ev, `activity${n}`, handleFieldUpdate, 'w-12 h-12', 0, 10, inputRefs, savingField, handleKeyDown, n === 1 ? 'modelLabMarks' : `activity${n-1}`)}</Fragment>)}
                                                    </div>
                                                </td>
                                            </>
                                        ) : type === 'THEORY_WITH_LAB' ? (
                                            <>
                                                <td className="px-6 py-6 border-l border-slate-100">
                                                    <div className="flex gap-2 justify-center">
                                                        {[1, 2, 3].map(n => <Fragment key={n}>{renderInput(ev, `cat${n}`, handleFieldUpdate, 'w-14 h-12', 0, 50, inputRefs, savingField, handleKeyDown, `cat${n+1}`)}</Fragment>)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 border-l border-slate-100">
                                                    <div className="flex gap-1.5 justify-center">
                                                        {[1, 2, 3, 4, 5].map(n => <Fragment key={n}>{renderInput(ev, `assignment${n}`, handleFieldUpdate, 'w-10 h-10', 0, 10, inputRefs, savingField, handleKeyDown, `assignment${n+1}`)}</Fragment>)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 border-l border-slate-100">
                                                    <div className="flex gap-2 justify-center">
                                                        {[1, 2].map(n => <Fragment key={n}>{renderInput(ev, `activity${n}`, handleFieldUpdate, 'w-12 h-12', 0, 10, inputRefs, savingField, handleKeyDown, n === 1 ? 'activity2' : 'modelLabMarks')}</Fragment>)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 border-l border-slate-100">{renderInput(ev, 'modelLabMarks', handleFieldUpdate, 'w-24 h-12', 0, 100, inputRefs, savingField, handleKeyDown, 'attendancePercent')}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-6 border-l border-slate-100">
                                                    <div className="flex gap-2 justify-center">
                                                        {[1, 2, 3].map(n => <Fragment key={n}>{renderInput(ev, `cat${n}`, handleFieldUpdate, 'w-14 h-12', 0, 50, inputRefs, savingField, handleKeyDown, `cat${n+1}`)}</Fragment>)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 border-l border-slate-100">
                                                    <div className="flex gap-1.5 justify-center">
                                                        {[1, 2, 3, 4, 5].map(n => <Fragment key={n}>{renderInput(ev, `assignment${n}`, handleFieldUpdate, 'w-10 h-10', 0, 10, inputRefs, savingField, handleKeyDown, `assignment${n+1}`)}</Fragment>)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 border-l border-slate-100">
                                                    <div className="flex gap-2 justify-center">
                                                        {[1, 2].map(n => <Fragment key={n}>{renderInput(ev, `activity${n}`, handleFieldUpdate, 'w-12 h-12', 0, 10, inputRefs, savingField, handleKeyDown, n === 1 ? 'activity2' : 'attendancePercent')}</Fragment>)}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                        <td className="px-6 py-6 border-l border-slate-100 bg-primary/5">
                                            <div className="flex justify-center">
                                                <input type="number" id={`${ev.id}-attendancePercent`} value={ev.attendancePercent ?? ''} onChange={(e) => handleFieldUpdate(ev.id, 'attendancePercent', e.target.value)}
                                                    ref={el => { if (el) inputRefs.current[`${ev.id}-attendancePercent`] = el; }}
                                                    onKeyDown={(e) => handleKeyDown(e, ev.id, 'attendancePercent', type === 'FULL_LAB' ? 'modelLabMarks' : 'remedial1', 'modelLabMarks')}
                                                    className={`w-20 h-12 bg-white border border-slate-200 rounded-2xl text-center text-sm focus:ring-2 focus:ring-primary outline-none transition-all ${ev.attendancePercent < 75 ? 'text-red-500 font-bold' : 'text-primary font-bold'}`} placeholder="%" min={0} max={100} />
                                            </div>
                                        </td>
                                        {type !== 'FULL_LAB' && (
                                            <td className="px-6 py-6 border-l border-slate-100 bg-orange-50">
                                                <div className="flex gap-2 justify-center">
                                                    {[1, 2, 3].map(n => {
                                                        const isEnabled = ev.attendancePercent < 75 || (ev[`cat${n}`] !== null && ev[`cat${n}`] < 25);
                                                        const fieldId = `${ev.id}-remedial${n}`;
                                                        return (
                                                            <input key={n} type="number" disabled={!isEnabled}
                                                                id={fieldId}
                                                                ref={el => { if (el) inputRefs.current[fieldId] = el; }}
                                                                value={ev[`remedial${n}`] ?? ''} onChange={(e) => handleFieldUpdate(ev.id, `remedial${n}`, e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    const nextField = n < 3 ? `remedial${n+1}` : 'attendancePercent';
                                                                    const prevField = n > 1 ? `remedial${n-1}` : 'attendancePercent';
                                                                    handleKeyDown(e, ev.id, `remedial${n}`, nextField, prevField);
                                                                }}
                                                                className={`w-12 h-12 rounded-2xl text-center text-xs font-bold outline-none transition-all ${isEnabled ? 'bg-white border-orange-200 border-2 text-orange-500 focus:ring-2 focus:ring-orange-400' : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed text-slate-400'}`} placeholder={`R${n}`} min={0} max={50} />
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-6 text-center border-l border-border bg-primary/10 backdrop-blur-sm">
                                            <div className="text-xl font-black text-foreground">{Math.round(ev.internalMarksTotal)}</div>
                                        </td>
                                        <td className="px-4 md:px-8 py-6 text-right whitespace-nowrap">
                                            {ev.staffApproved ? (
                                                <div className="flex items-center justify-end gap-3 text-emerald-400">
                                                    <ShieldCheck className="w-5 h-5" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Finalized</span>
                                                </div>
                                            ) : ev.staffRejected ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-2 text-red-400">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Rejected</span>
                                                    </div>
                                                    {ev.rejectionReason && (
                                                        <div className="text-[9px] text-red-300 max-w-[150px] text-right truncate" title={ev.rejectionReason}>{ev.rejectionReason}</div>
                                                    )}
                                                    <button onClick={() => onClearRejection(ev.id)}
                                                        className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-primary font-bold uppercase tracking-wider mt-1">
                                                        <RotateCcw className="w-3 h-3" /> Clear
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleRejectClick(ev.id)}
                                                        disabled={!isReadyToApprove(ev)}
                                                        className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                                                            !isReadyToApprove(ev) ? 'opacity-20 cursor-not-allowed' : 'border-red-400/20 text-red-400 hover:bg-red-500/10'
                                                        }`}>
                                                        Reject
                                                    </button>
                                                    <button disabled={!isReadyToApprove(ev)} onClick={() => handleApproveClick(ev.id)}
                                                        className={`px-5 py-2.5 rounded-xl border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest transition-all ${
                                                            !isReadyToApprove(ev) ? 'opacity-30 cursor-not-allowed grayscale' : 'bg-primary/10 hover:bg-primary hover:text-white shadow-lg shadow-primary/10'
                                                        }`}>
                                                        Approve
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approve Confirmation Dialog */}
            <AnimatePresence>
                {approveConfirm.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setApproveConfirm({ open: false, evalId: null })} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative z-10 shadow-2xl border border-slate-200">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Approval</h3>
                                <p className="text-sm text-slate-500 mb-6">This action is irreversible. Once approved, marks cannot be modified. Are you sure?</p>
                                <div className="flex gap-3 justify-center">
                                    <button onClick={() => setApproveConfirm({ open: false, evalId: null })}
                                        className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                                    <button onClick={handleApproveConfirm}
                                        className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">Confirm Approve</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Single Reject Modal */}
            <AnimatePresence>
                {rejectModal.open && !bulkRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setRejectModal({ open: false, evalId: null })} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full relative z-10 shadow-2xl border border-slate-200">
                            <div className="text-left">
                                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Reject Evaluation</h3>
                                <p className="text-sm text-slate-500 mb-4">Provide a reason for rejection. The student will be notified.</p>
                                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                                    rows={4} placeholder="e.g., Assignment not submitted, CAT marks too low..."
                                    className="w-full p-4 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none mb-6" />
                                <div className="flex gap-3 justify-end">
                                    <button onClick={() => setRejectModal({ open: false, evalId: null })}
                                        className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                                    <button onClick={handleRejectConfirm} disabled={!rejectReason.trim()}
                                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                                            rejectReason.trim() ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}>Submit Rejection</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bulk Reject Modal */}
            <AnimatePresence>
                {bulkRejectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setBulkRejectModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full relative z-10 shadow-2xl border border-slate-200">
                            <div className="text-left">
                                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                                    <Ban className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Bulk Reject ({selectedEvals.size} students)</h3>
                                <p className="text-sm text-slate-500 mb-4">Provide a common reason for rejection. All selected students will be notified.</p>
                                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                                    rows={4} placeholder="e.g., Incomplete assignments, low attendance..."
                                    className="w-full p-4 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none mb-6" />
                                <div className="flex gap-3 justify-end">
                                    <button onClick={() => setBulkRejectModal(false)}
                                        className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                                    <button onClick={handleBulkRejectConfirm} disabled={!rejectReason.trim()}
                                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                                            rejectReason.trim() ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}>Reject All</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

function renderInput(ev, field, onChange, className, minVal = 0, maxVal = 50, inputRefs, savingField, handleKeyDown, nextField) {
    const val = ev[field];
    const isInvalid = val !== null && val !== undefined && val !== '' && (val < minVal || val > maxVal);
    const fieldId = `${ev.id}-${field}`;
    const isSaving = savingField === fieldId;

    return (
        <div className="flex justify-center relative">
            <input type="number" id={fieldId} value={val ?? ''}
                onChange={(e) => onChange(ev.id, field, e.target.value)}
                ref={el => { if (el) inputRefs.current[fieldId] = el; }}
                onKeyDown={(e) => handleKeyDown(e, ev.id, field, nextField || field, field)}
                className={`${className} border-2 rounded-2xl text-center text-xs font-bold focus:ring-2 outline-none transition-all ${
                    isInvalid
                        ? 'bg-red-50 border-red-300 text-red-600 focus:ring-red-400'
                        : 'bg-slate-100 border-slate-200 focus:ring-primary focus:bg-primary/5 text-foreground'
                }`}
                placeholder={`0-${maxVal}`} min={minVal} max={maxVal} />
            {isSaving && <Save className="absolute -top-1 -right-1 w-3 h-3 text-primary animate-pulse" />}
            {isInvalid && (
                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-red-500 font-bold whitespace-nowrap">max {maxVal}</span>
            )}
        </div>
    );
}