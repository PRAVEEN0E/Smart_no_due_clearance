import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

export default function useStaffData() {
    const { token: authToken } = useAuthStore();
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [evaluations, setEvaluations] = useState([]);
    const [analytics, setAnalytics] = useState({ distribution: [], trends: [], approvedCount: 0, rejectedCount: 0, pendingCount: 0 });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('performance');
    const [activeStudent, setActiveStudent] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEvals, setSelectedEvals] = useState(new Set());
    const analyticsTimeoutRef = useRef(null);

    useEffect(() => { fetchSubjects(); }, []);

    useEffect(() => {
        if (selectedSubject) fetchData();
    }, [selectedSubject, statusFilter]);

    const fetchSubjects = useCallback(async () => {
        try {
            const res = await api.get('/staff/subjects');
            const data = res.data || [];
            setSubjects(data);
            if (data.length > 0) setSelectedSubject(data[0]);
        } catch { toast.error('Failed to load subjects'); } finally { setLoading(false); }
    }, []);

    const fetchData = useCallback(async () => {
        if (!selectedSubject) return;
        setLoading(true);
        try {
            const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
            const [evalRes, analyticsRes] = await Promise.all([
                api.get(`/staff/evaluations${statusParam}`),
                api.get('/staff/analytics')
            ]);
            const allEval = evalRes.data || [];
            setEvaluations(allEval.filter(e => e.subjectId === selectedSubject.subjectId));
            setAnalytics(analyticsRes.data || { distribution: [], trends: [], approvedCount: 0, rejectedCount: 0, pendingCount: 0 });
        } catch { toast.error('Failed to load evaluation data'); } finally { setLoading(false); }
    }, [selectedSubject, statusFilter]);

    const refreshAnalyticsDebounced = useCallback(() => {
        if (analyticsTimeoutRef.current) clearTimeout(analyticsTimeoutRef.current);
        analyticsTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await api.get('/staff/analytics');
                setAnalytics(res.data || { distribution: [], trends: [], approvedCount: 0, rejectedCount: 0, pendingCount: 0 });
            } catch { toast.error('Failed to refresh analytics'); }
        }, 1500);
    }, []);

    const handleUpdateMark = useCallback(async (evalId, field, value) => {
        const numericValue = value === '' ? null : (field === 'attendancePercent' ? parseFloat(value) : parseInt(value));
        setEvaluations(prev => prev.map(ev => ev.id === evalId ? { ...ev, [field]: numericValue } : ev));
        try {
            const res = await api.put(`/staff/marks/${evalId}`, { [field]: numericValue });
            setEvaluations(prev => prev.map(ev => {
                if (ev.id === evalId) return { ...ev, internalMarksTotal: res.data.internalMarksTotal, aiPrediction: res.data.aiPrediction };
                return ev;
            }));
            refreshAnalyticsDebounced();
        } catch (err) { toast.error(err.response?.data?.message || "Failed to update mark"); }
    }, [refreshAnalyticsDebounced]);

    const handleApprove = useCallback(async (evalId) => {
        try {
            await api.post(`/staff/approve/${evalId}`);
            fetchData();
            toast.success("Student approved successfully!");
        } catch (err) {
            const msg = err.response?.data?.message || "Approval failed";
            toast.error(msg);
        }
    }, [fetchData]);

    const handleReject = useCallback(async (evalId, rejectionReason) => {
        try {
            await api.post(`/staff/reject/${evalId}`, { rejectionReason });
            fetchData();
            toast.success("Student rejected with remarks.");
        } catch (err) {
            const msg = err.response?.data?.message || "Rejection failed";
            toast.error(msg);
        }
    }, [fetchData]);

    const handleClearRejection = useCallback(async (evalId) => {
        try {
            await api.post(`/staff/reject/${evalId}/clear`);
            fetchData();
            toast.success("Rejection cleared.");
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to clear rejection";
            toast.error(msg);
        }
    }, [fetchData]);

    const handleBulkApprove = useCallback(async () => {
        if (selectedEvals.size === 0) { toast.error("No students selected"); return; }
        if (!window.confirm(`Approve ${selectedEvals.size} selected student(s)?`)) return;
        let success = 0, fail = 0;
        for (const evalId of selectedEvals) {
            try {
                await api.post(`/staff/approve/${evalId}`);
                success++;
            } catch { fail++; }
        }
        toast.success(`Approved ${success} student(s)${fail ? ` (${fail} failed)` : ''}`);
        setSelectedEvals(new Set());
        fetchData();
    }, [selectedEvals, fetchData]);

    const handleBulkReject = useCallback(async (reason) => {
        if (selectedEvals.size === 0) { toast.error("No students selected"); return; }
        if (!window.confirm(`Reject ${selectedEvals.size} selected student(s)?`)) return;
        let success = 0, fail = 0;
        for (const evalId of selectedEvals) {
            try {
                await api.post(`/staff/reject/${evalId}`, { rejectionReason: reason });
                success++;
            } catch { fail++; }
        }
        toast.success(`Rejected ${success} student(s)${fail ? ` (${fail} failed)` : ''}`);
        setSelectedEvals(new Set());
        fetchData();
    }, [selectedEvals, fetchData]);

    const handleRegenerateFeedback = useCallback(async (assignmentId) => {
        try {
            const res = await api.post(`/staff/regenerate-feedback/${assignmentId}`);
            setEvaluations(prev => prev.map(ev => ({
                ...ev, student: { ...ev.student, assignments: ev.student.assignments?.map(asgn =>
                    asgn.id === assignmentId ? { ...asgn, aiFeedback: res.data.aiFeedback } : asgn
                )}
            })));
        } catch { toast.error("Feedback regeneration failed"); }
    }, []);

    const handleExportExcel = useCallback(async () => {
        if (!selectedSubject) return;
        try {
            const res = await api.get(`/staff/export/excel/${selectedSubject.subjectId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `Marks_${selectedSubject.subject.code}.xlsx`);
            document.body.appendChild(link); link.click(); link.remove();
            toast.success("Excel exported successfully!");
        } catch { toast.error("Export failed"); }
    }, [selectedSubject]);

    const handleExportPDF = useCallback(async () => {
        if (!selectedSubject) return;
        try {
            const res = await api.get(`/staff/export/pdf/${selectedSubject.subjectId}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `Marks_${selectedSubject.subject.code}.pdf`);
            document.body.appendChild(link); link.click(); link.remove();
            toast.success("PDF exported successfully!");
        } catch { toast.error("Export failed"); }
    }, [selectedSubject]);

    const handleBulkExportExcel = useCallback(async () => {
        if (selectedEvals.size === 0) { toast.error("No students selected"); return; }
        if (!selectedSubject) return;
        if (!window.confirm(`Export Excel for ${selectedEvals.size} selected student(s)?`)) return;
        handleExportExcel();
    }, [selectedEvals, selectedSubject, handleExportExcel]);

    const handleBulkExportPDF = useCallback(async () => {
        if (selectedEvals.size === 0) { toast.error("No students selected"); return; }
        if (!selectedSubject) return;
        if (!window.confirm(`Export PDF for ${selectedEvals.size} selected student(s)?`)) return;
        handleExportPDF();
    }, [selectedEvals, selectedSubject, handleExportPDF]);

    const filteredEvaluations = useMemo(() => {
        if (!searchQuery.trim()) return evaluations;
        const q = searchQuery.toLowerCase();
        return evaluations.filter(ev =>
            ev.student.name.toLowerCase().includes(q) ||
            ev.student.email.toLowerCase().includes(q)
        );
    }, [evaluations, searchQuery]);

    const toggleSelectEval = useCallback((evalId) => {
        setSelectedEvals(prev => {
            const next = new Set(prev);
            if (next.has(evalId)) next.delete(evalId);
            else next.add(evalId);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        const currentFiltered = filteredEvaluations;
        if (selectedEvals.size === currentFiltered.length && currentFiltered.length > 0) {
            setSelectedEvals(new Set());
        } else {
            setSelectedEvals(new Set(currentFiltered.map(e => e.id)));
        }
    }, [selectedEvals, filteredEvaluations]);

    const isReadyToApprove = useCallback((ev) => {
        const type = selectedSubject?.subject.type;
        const isLab = type === 'FULL_LAB';
        const isHybrid = type === 'THEORY_WITH_LAB';
        if (ev.staffApproved || ev.staffRejected) return false;
        if (isLab) return ev.modelLabMarks !== null && ev.activity1 !== null && ev.activity2 !== null && ev.attendancePercent !== null;
        if (isHybrid) return ev.cat1 !== null && ev.cat2 !== null && ev.cat3 !== null && ev.activity1 !== null && ev.activity2 !== null && ev.attendancePercent !== null && ev.modelLabMarks !== null && [1,2,3,4,5].every(n => ev[`assignment${n}`] !== null);
        return ev.cat1 !== null && ev.cat2 !== null && ev.cat3 !== null && ev.activity1 !== null && ev.activity2 !== null && ev.attendancePercent !== null && [1,2,3,4,5].every(n => ev[`assignment${n}`] !== null);
    }, [selectedSubject]);

    const avgMarks = useMemo(() => evaluations.length > 0 ? evaluations.reduce((acc, curr) => acc + (curr.internalMarksTotal || 0), 0) / evaluations.length : 0, [evaluations]);
    const approvedCount = useMemo(() => evaluations.filter(e => e.staffApproved).length, [evaluations]);
    const rejectedCount = useMemo(() => evaluations.filter(e => e.staffRejected).length, [evaluations]);
    const pendingCount = useMemo(() => evaluations.filter(e => !e.staffApproved && !e.staffRejected).length, [evaluations]);
    const topScore = useMemo(() => evaluations.length > 0 ? Math.max(...evaluations.map(e => e.internalMarksTotal || 0)).toFixed(1) : '0.0', [evaluations]);

    const getFullUrl = useCallback((url) => {
        if (!url) return '';
        let backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : window.location.origin;
        if (backendBase.endsWith('/')) backendBase = backendBase.slice(0, -1);
        if (url.startsWith('https://res.cloudinary.com')) return url;
        if (url.startsWith('http')) return url;
        let path = url;
        if (!path.startsWith('/') && !path.startsWith('uploads/')) path = `/uploads/${path}`;
        else if (!path.startsWith('/')) path = `/${path}`;
        return `${backendBase}${path}`;
    }, [authToken]);

    const isImage = useCallback((url) => {
        if (!url) return false;
        const decodedUrl = decodeURIComponent(url);
        const path = decodedUrl.split('?')[0].toLowerCase();
        if (path.endsWith('.pdf')) return false;
        return /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(path) || decodedUrl.includes('image/upload');
    }, []);

    return {
        subjects, selectedSubject, evaluations, filteredEvaluations, analytics, loading, activeTab, activeStudent, previewUrl,
        avgMarks, approvedCount, rejectedCount, pendingCount, topScore, getFullUrl, isImage,
        statusFilter, searchQuery, selectedEvals,
        setSelectedSubject, setActiveTab, setActiveStudent, setPreviewUrl,
        setStatusFilter, setSearchQuery, toggleSelectEval, toggleSelectAll, setSelectedEvals,
        handleUpdateMark, handleApprove, handleReject, handleClearRejection,
        handleBulkApprove, handleBulkReject, handleBulkExportExcel, handleBulkExportPDF,
        handleRegenerateFeedback, handleExportExcel, handleExportPDF, isReadyToApprove, fetchData
    };
}