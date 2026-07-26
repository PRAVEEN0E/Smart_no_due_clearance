import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

const AI_PLACEHOLDER = "_AI Feedback is being generated. Check back in a moment._";

export default function useStudentData() {
    const { token: authToken } = useAuthStore();
    const [data, setData] = useState({ evaluations: [], feeRecord: null, hallTicket: null, suggestions: [], user: {} });
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [ticketUrl, setTicketUrl] = useState('');
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [generatingPlanId, setGeneratingPlanId] = useState(null);
    const [activeStudyPlan, setActiveStudyPlan] = useState(null);
    const [hallTicketStatus, setHallTicketStatus] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [examSchedule, setExamSchedule] = useState([]);
    const [profileSaving, setProfileSaving] = useState(false);

    const getFileUrl = useCallback((url) => {
        if (!url) return '#';
        let backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : window.location.origin;
        if (backendBase.endsWith('/')) backendBase = backendBase.slice(0, -1);
        if (url.startsWith('https://res.cloudinary.com')) return url;
        if (url.startsWith('http')) return url;
        return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
    }, [authToken]);

    useEffect(() => { fetchDashboard(); fetchAssignments(); }, []);

    const fetchDashboard = useCallback(async () => {
        try {
            const [statusRes, subRes] = await Promise.all([api.get('/student/status'), api.get('/student/subjects')]);
            setData(statusRes.data);
            setSubjects(subRes.data);
        } catch { } finally { setLoading(false); }
    }, []);

    const fetchHallTicketStatus = useCallback(async () => {
        try {
            const res = await api.get('/student/hallticket/status');
            setHallTicketStatus(res.data);
        } catch { }
    }, []);

    const fetchAssignments = useCallback(async () => {
        try {
            const res = await api.get('/student/assignments');
            setAssignments(res.data);
        } catch { }
    }, []);

    // Poll for AI feedback updates when placeholder text is still shown
    const aiPollRef = useRef(null);
    useEffect(() => {
        const hasPlaceholder = assignments.some(a => a.aiFeedback === AI_PLACEHOLDER);
        if (hasPlaceholder && !aiPollRef.current) {
            aiPollRef.current = setInterval(() => {
                fetchAssignments();
            }, 5000);
        } else if (!hasPlaceholder && aiPollRef.current) {
            clearInterval(aiPollRef.current);
            aiPollRef.current = null;
        }
        return () => {
            if (aiPollRef.current) {
                clearInterval(aiPollRef.current);
                aiPollRef.current = null;
            }
        };
    }, [assignments, fetchAssignments]);

    const fetchExamSchedule = useCallback(async () => {
        try {
            const res = await api.get('/student/exams');
            setExamSchedule(res.data);
        } catch { }
    }, []);

    const handleUpdateProfile = useCallback(async (profileData) => {
        setProfileSaving(true);
        try {
            const res = await api.put('/student/profile', profileData);
            if (res.data?.user) {
                setData(prev => ({ ...prev, user: { ...prev.user, ...res.data.user } }));
            }
            toast.success('Profile updated!');
        } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
        finally { setProfileSaving(false); }
    }, []);

    const handleUploadSignature = useCallback(async (file) => {
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await api.post('/student/profile/signature', form);
            if (res.data?.signatureUrl) {
                setData(prev => ({ ...prev, user: { ...prev.user, signatureUrl: res.data.signatureUrl } }));
            }
            toast.success('Signature uploaded!');
        } catch { toast.error('Signature upload failed'); }
    }, []);

    const handleAssignmentUpload = useCallback(async (subId, e) => {
        const file = e.target.files[0];
        if (!file) return;
        const form = new FormData();
        form.append('subjectId', subId);
        form.append('file', file);
        setUploading(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 15, 90));
        }, 300);

        try {
            await api.post('/student/assignments', form);
            clearInterval(progressInterval);
            setUploadProgress(100);
            setTimeout(() => { setUploadProgress(0); }, 1000);
            toast.success("Assignment submitted! AI feedback is being generated.");
            fetchDashboard();
            fetchAssignments();
        } catch { toast.error("Upload failed."); clearInterval(progressInterval); setUploadProgress(0); }
        finally { setUploading(false); }
    }, [fetchDashboard, fetchAssignments]);

    const handleReplaceAssignment = useCallback(async (assignmentId, file) => {
        const form = new FormData();
        form.append('file', file);
        try {
            await api.put(`/student/assignments/${assignmentId}`, form);
            toast.success('Assignment replaced!');
            fetchAssignments();
        } catch { toast.error('Replace failed'); }
    }, [fetchAssignments]);

    const handleDeleteAssignment = useCallback(async (assignmentId) => {
        if (!window.confirm('Delete this assignment? This cannot be undone.')) return;
        try {
            await api.delete(`/student/assignments/${assignmentId}`);
            toast.success('Assignment deleted');
            fetchAssignments();
        } catch { toast.error('Delete failed'); }
    }, [fetchAssignments]);

    const handleGeneratePrediction = useCallback(async (subjectId) => {
        try {
            await api.post(`/student/predict/${subjectId}`);
            fetchDashboard();
            toast.success("Prediction generated!");
        } catch { toast.error("Failed to generate prediction."); }
    }, [fetchDashboard]);

    const handleGenerateStudyPlan = useCallback(async (subjectId, subjectName) => {
        setGeneratingPlanId(subjectId);
        try {
            const res = await api.post('/student/remedial-plan', { subjectId });
            setActiveStudyPlan({ subjectName, planText: res.data.plan });
            toast.success("Study plan generated!");
        } catch (err) { toast.error(err.response?.data?.message || "Failed to generate study plan."); }
        finally { setGeneratingPlanId(null); }
    }, []);

    const handleDownloadTicket = useCallback(async () => {
        try {
            const res = await api.get('/student/hallticket');
            if (res.data.pdfUrl) { setTicketUrl(getFileUrl(res.data.pdfUrl)); setShowTicketModal(true); }
            else toast.error("Hall ticket URL not found.");
        } catch (err) { toast.error(err.response?.data?.message || "Failed to download hall ticket."); }
    }, [getFileUrl]);

    const handlePayFees = useCallback(async () => {
        setPaymentProcessing(true);
        try {
            const res = await api.post('/student/pay-fees');
            toast.success(res.data.message || 'Payment processed!');
            fetchDashboard();
        } catch (err) { toast.error(err.response?.data?.message || 'Payment failed.'); }
        finally { setPaymentProcessing(false); }
    }, [fetchDashboard]);

    const isAllApproved = useMemo(() => data.evaluations.length > 0 && data.evaluations.every(e => e.staffApproved), [data.evaluations]);
    const isFeeCleared = useMemo(() => data.feeRecord?.feeClearedAuto || data.feeRecord?.feeClearedManual, [data.feeRecord]);
    const canDownloadTicket = useMemo(() => isAllApproved && isFeeCleared, [isAllApproved, isFeeCleared]);

    return {
        data, subjects, loading, uploading, uploadProgress, selectedSubject,
        showTicketModal, ticketUrl, paymentProcessing, generatingPlanId, activeStudyPlan,
        hallTicketStatus, assignments, examSchedule, profileSaving,
        isAllApproved, isFeeCleared, canDownloadTicket,
        setSelectedSubject, setShowTicketModal, setTicketUrl, setActiveStudyPlan,
        fetchDashboard, fetchHallTicketStatus, fetchAssignments, fetchExamSchedule,
        handleAssignmentUpload, handleReplaceAssignment, handleDeleteAssignment,
        handleGeneratePrediction, handleGenerateStudyPlan,
        handleDownloadTicket, handlePayFees, handleUpdateProfile, handleUploadSignature, getFileUrl
    };
}