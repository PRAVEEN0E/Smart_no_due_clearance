import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import useAuth from './useAuth';

const EMPTY_FORM = {
    name: '', email: '', registerNumber: '', password: '', code: '',
    type: 'FULL_THEORY', content: '', priority: 1, syllabusText: '',
    className: '', semester: '4', examDate: '', examSession: 'FN'
};

export default function useMentorData() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ studentCount: 0, staffCount: 0, subjectCount: 0, totalApprovals: 0 });
    const [classStats, setClassStats] = useState([]);
    const [deptStats, setDeptStats] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [staff, setStaff] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [collegeWorkflow, setCollegeWorkflow] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('students');
    const [searchQuery, setSearchQuery] = useState('');
    const [modalMode, setModalMode] = useState('student');
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [editingId, setEditingId] = useState(null);
    const [assignData, setAssignData] = useState({ staffId: '', subjectId: '' });
    const [activeStudent, setActiveStudent] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showStudentAssignModal, setShowStudentAssignModal] = useState(false);
    const [showCommonFeeModal, setShowCommonFeeModal] = useState(false);
    const [showCustomClearanceModal, setShowCustomClearanceModal] = useState(false);
    const [commonFeeAmount, setCommonFeeAmount] = useState('');
    const [addingCommonFee, setAddingCommonFee] = useState(false);
    const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
    const [newWorkflowStep, setNewWorkflowStep] = useState({ id: '', label: '', type: 'CUSTOM', required: true });

    // Server-side pagination & filters
    const [studentPage, setStudentPage] = useState(1);
    const [studentTotal, setStudentTotal] = useState(0);
    const [studentTotalPages, setStudentTotalPages] = useState(1);
    const [studentLimit] = useState(50);
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterClassName, setFilterClassName] = useState('');
    const [filterFeeStatus, setFilterFeeStatus] = useState('all');
    const [filterArchived, setFilterArchived] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const searchTimer = useRef(null);

    const fetchStudents = useCallback(async (page, query, dept, cls, feeStatus, archived, sBy, sOrd) => {
        try {
            const params = { page, limit: studentLimit };
            if (query) params.search = query;
            if (dept) params.department = dept;
            if (cls) params.className = cls;
            if (feeStatus && feeStatus !== 'all') params.feeStatus = feeStatus;
            if (archived) params.archived = 'true';
            if (sBy) params.sortBy = sBy;
            if (sOrd) params.sortOrder = sOrd;

            const res = await api.get('/mentor/students', { params });
            const d = res.data;
            setStudents(d?.data || []);
            setStudentTotal(d?.total || 0);
            setStudentTotalPages(d?.totalPages || 1);
            setStudentPage(d?.page || 1);
        } catch (err) {
            toast.error("Failed to load students");
        }
    }, [studentLimit]);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, subjectsRes, staffRes, annRes, collegeRes, htRes] = await Promise.all([
                api.get('/mentor/analytics'),
                api.get('/mentor/subjects'),
                api.get('/mentor/staff'),
                api.get('/mentor/announcements'),
                api.get('/mentor/college'),
                api.get('/mentor/hall-tickets', { params: { limit: 1 } })
            ]);
            const s = statsRes.data.stats || {};
            const ht = htRes.data?.stats || {};
            setStats({
                ...s,
                hallTicketsReady: ht.ready || 0,
                hallTicketsBlocked: ht.blocked || 0,
                feesPending: ht.pendingFees || 0,
                pendingClearance: ht.pendingApprovals || 0
            });
            setClassStats(statsRes.data.classStats || []);
            setDeptStats(statsRes.data.deptStats || []);
            setSubjects(subjectsRes.data || []);
            setStaff(staffRes.data || []);
            setAnnouncements(annRes.data || []);
            setCollegeWorkflow(collegeRes?.data?.workflow || [
                { id: 'FEES', label: 'Financial Dues', type: 'FEE', required: true },
                { id: 'ACADEMICS', label: 'Academic Approvals', type: 'STAFF_APPROVAL', required: true }
            ]);
            fetchStudents(1, '', '', '', 'all', false, 'createdAt', 'desc');
        } catch (err) {
            toast.error("Some data failed to load. Please refresh.");
        } finally {
            setLoading(false);
        }
    }, [fetchStudents]);

    useEffect(() => {
        fetchData();
        const timer = setTimeout(() => setLoading(false), 15000);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const fetchAuditLogs = useCallback(async (page = 1, query = '') => {
        try {
            const params = { page, limit: 50 };
            if (query) params.search = query;
            const res = await api.get('/mentor/audit-logs', { params });
            setAuditLogs(res.data?.data || []);
        } catch {
            // Silent fail for audit logs
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'audit') {
            fetchAuditLogs(1, searchQuery);
        }
    }, [activeTab, fetchAuditLogs]);

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            if (activeTab === 'students') {
                fetchStudents(1, query, filterDepartment, filterClassName, filterFeeStatus, filterArchived, sortBy, sortOrder);
            } else if (activeTab === 'audit') {
                fetchAuditLogs(1, query);
            }
        }, 400);
    }, [activeTab, fetchStudents, fetchAuditLogs, filterDepartment, filterClassName, filterFeeStatus, filterArchived, sortBy, sortOrder]);

    const handleFilterChange = useCallback((filters) => {
        if (filters.department !== undefined) setFilterDepartment(filters.department);
        if (filters.className !== undefined) setFilterClassName(filters.className);
        if (filters.feeStatus !== undefined) setFilterFeeStatus(filters.feeStatus);
        if (filters.archived !== undefined) setFilterArchived(filters.archived);
        if (filters.sortBy !== undefined) setSortBy(filters.sortBy);
        if (filters.sortOrder !== undefined) setSortOrder(filters.sortOrder);
        fetchStudents(1, searchQuery,
            filters.department !== undefined ? filters.department : filterDepartment,
            filters.className !== undefined ? filters.className : filterClassName,
            filters.feeStatus !== undefined ? filters.feeStatus : filterFeeStatus,
            filters.archived !== undefined ? filters.archived : filterArchived,
            filters.sortBy !== undefined ? filters.sortBy : sortBy,
            filters.sortOrder !== undefined ? filters.sortOrder : sortOrder
        );
    }, [fetchStudents, searchQuery, filterDepartment, filterClassName, filterFeeStatus, filterArchived, sortBy, sortOrder]);

    const handlePageChange = useCallback((page) => {
        fetchStudents(page, searchQuery, filterDepartment, filterClassName, filterFeeStatus, filterArchived, sortBy, sortOrder);
    }, [fetchStudents, searchQuery, filterDepartment, filterClassName, filterFeeStatus, filterArchived, sortBy, sortOrder]);

    const handleBulkUpload = useCallback(async (type, e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        const form = new FormData();
        form.append('file', file);
        setUploadLoading(true);
        const toastId = toast.loading(`Uploading ${type}...`);
        try {
            const endpoint = type === 'students' ? '/mentor/bulk-students' : '/mentor/bulk-fees';
            const res = await api.post(endpoint, form);
            fetchData();
            const results = res.data?.results || [];
            const updated = results.filter(r => r.status === 'Updated').length;
            const created = results.filter(r => r.status === 'Created').length;
            const failed = results.filter(r => r.status === 'Failed');
            failed.forEach(f => toast.error(`Failed [${f.email}]: ${f.reason}`, { duration: 8000 }));
            toast.success(`Upload done! Created: ${created}, Updated: ${updated}${failed.length ? `, Failed: ${failed.length}` : ''}`, { id: toastId, duration: 5000 });
        } catch (err) {
            toast.error(`Upload failed: ${err.response?.data?.message || err.message}`, { id: toastId });
        } finally {
            setUploadLoading(false);
        }
    }, [fetchData]);

    const handleEditClick = useCallback((mode, item) => {
        setModalMode(mode);
        setEditingId(item.id);
        if (mode === 'subject') {
            setFormData({ ...EMPTY_FORM, name: item.name, code: item.code, type: item.type, syllabusText: item.syllabusText || '', semester: item.semester?.toString() || '4', examDate: item.examDate || '', examSession: item.examSession || 'FN' });
        } else if (mode === 'announcement') {
            setFormData({ ...EMPTY_FORM, name: item.title, content: item.content, type: item.type || 'GENERAL', priority: item.priority || 1 });
        } else {
            setFormData({ ...EMPTY_FORM, name: item.name, email: item.email, registerNumber: item.registerNumber || '' });
        }
        setShowAddModal(true);
    }, []);

    const handleAddItem = useCallback(async (e) => {
        e.preventDefault();
        try {
            const isEditing = !!editingId;
            const method = isEditing ? 'put' : 'post';
            const idPath = isEditing ? `/${editingId}` : '';
            let endpoint, payload;
            if (modalMode === 'student') {
                endpoint = `/mentor/students${idPath}`;
                payload = { name: formData.name, email: formData.email, registerNumber: formData.registerNumber || undefined, className: formData.className || undefined };
                if (formData.password) payload.password = formData.password;
            } else if (modalMode === 'staff') {
                endpoint = `/mentor/staff${idPath}`;
                payload = { name: formData.name, email: formData.email };
                if (formData.password) payload.password = formData.password;
            } else if (modalMode === 'announcement') {
                endpoint = `/mentor/announcements${idPath}`;
                payload = { title: formData.name, content: formData.content, type: formData.type, priority: formData.priority };
            } else {
                endpoint = `/mentor/subjects${idPath}`;
                payload = { name: formData.name, code: formData.code, type: formData.type, syllabusText: formData.syllabusText, semester: parseInt(formData.semester) || 4, examDate: formData.examDate || null, examSession: formData.examSession || 'FN' };
            }
            await api[method](endpoint, payload);
            fetchData();
            closeModals();
            toast.success(`${modalMode} ${isEditing ? 'updated' : 'added'} successfully!`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to process request");
        }
    }, [editingId, modalMode, formData, fetchData]);

    const handleDeleteItem = useCallback(async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            const map = { student: '/mentor/students/', staff: '/mentor/staff/', subject: '/mentor/subjects/', announcement: '/mentor/announcements/' };
            await api.delete(map[type] + id);
            fetchData();
            toast.success(`${type} deleted successfully.`);
        } catch { toast.error("Failed to delete item."); }
    }, [fetchData]);

    const handleRestoreItem = useCallback(async (type, id) => {
        if (!window.confirm(`Restore this ${type}?`)) return;
        try {
            const map = { student: '/mentor/students/', staff: '/mentor/staff/', subject: '/mentor/subjects/', announcement: '/mentor/announcements/' };
            await api.post(`${map[type]}${id}/restore`);
            fetchData();
            toast.success(`${type} restored successfully.`);
        } catch { toast.error("Failed to restore item."); }
    }, [fetchData]);

    const handleToggleFee = useCallback(async (studentId, currentStatus) => {
        try {
            await api.put(`/mentor/fees/${studentId}`, { feeClearedManual: !currentStatus });
            fetchData();
            toast.success("Fee status updated successfully.");
        } catch { toast.error("Failed to update fee status."); }
    }, [fetchData]);

    const handleAssignStaff = useCallback(async (e) => {
        e.preventDefault();
        try {
            await api.post('/mentor/assign/staff', assignData);
            fetchData();
            setShowAssignModal(false);
            setAssignData({ staffId: '', subjectId: '' });
            toast.success("Staff assigned to subject successfully!");
        } catch { toast.error("Assignment failed. Check if mapping already exists."); }
    }, [assignData, fetchData]);

    const handleAssignStudent = useCallback(async (subjectId) => {
        try {
            await api.post('/mentor/assign/student', { studentId: activeStudent.id, subjectId });
            fetchData();
            toast.success(`Student assigned to ${subjects.find(s => s.id === subjectId)?.name}`);
        } catch { toast.error("Assignment failed or student already enrolled."); }
    }, [activeStudent, subjects, fetchData]);

    const handleExportFees = useCallback(async () => {
        try {
            const res = await api.get('/mentor/export/fees', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', 'Student_Fee_Balances.xlsx');
            document.body.appendChild(link); link.click(); link.remove();
            toast.success("Fee report exported successfully!");
        } catch { toast.error("Export failed"); }
    }, []);

    const handleExportFeesPDF = useCallback(async () => {
        try {
            const res = await api.get('/mentor/export/pdf/fees', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', 'Student_Fee_Report.pdf');
            document.body.appendChild(link); link.click(); link.remove();
            toast.success("Fee report PDF exported!");
        } catch { toast.error("PDF Export failed"); }
    }, []);

    const closeModals = useCallback(() => {
        setShowAddModal(false); setShowAssignModal(false); setShowStudentAssignModal(false);
        setShowCommonFeeModal(false); setShowCustomClearanceModal(false);
        setEditingId(null); setFormData({ ...EMPTY_FORM }); setCommonFeeAmount('');
    }, []);

    const handleAssignCommonFee = useCallback(async (e) => {
        e.preventDefault();
        if (!commonFeeAmount || isNaN(commonFeeAmount) || commonFeeAmount <= 0) return toast.error("Please enter a valid amount");
        try {
            setAddingCommonFee(true);
            const res = await api.post('/mentor/bulk-add-common-fee', { amount: commonFeeAmount });
            toast.success(res.data.message || "Fee added successfully");
            setCommonFeeAmount(''); setShowCommonFeeModal(false); fetchData();
        } catch (err) { toast.error(err.response?.data?.message || "Failed to add common fee"); }
        finally { setAddingCommonFee(false); }
    }, [commonFeeAmount, fetchData]);

    const handleSaveWorkflow = useCallback(async (updatedWorkflow) => {
        try {
            setIsSavingWorkflow(true);
            await api.put('/mentor/college/workflow', { workflow: updatedWorkflow });
            setCollegeWorkflow(updatedWorkflow);
            toast.success("Workflow updated successfully!");
        } catch { toast.error("Failed to update workflow."); }
        finally { setIsSavingWorkflow(false); }
    }, []);

    const handleToggleCustomClearance = useCallback(async (stepId, currentClearedStatus) => {
        if (!activeStudent) return;
        try {
            const nextStatus = !currentClearedStatus;
            await api.put(`/mentor/students/${activeStudent.id}/custom-clearance`, { stepId, cleared: nextStatus });
            toast.success("Clearance toggled successfully!");
            setStudents(prev => prev.map(s => {
                if (s.id === activeStudent.id) {
                    const clearances = { ...(s.customClearance || {}), [stepId]: { cleared: nextStatus, updatedAt: new Date().toISOString(), updatedBy: user.name } };
                    return { ...s, customClearance: clearances };
                } return s;
            }));
            setActiveStudent(prev => {
                if (!prev) return prev;
                const clearances = { ...(prev.customClearance || {}), [stepId]: { cleared: nextStatus, updatedAt: new Date().toISOString(), updatedBy: user.name } };
                return { ...prev, customClearance: clearances };
            });
        } catch { toast.error("Failed to update student clearance."); }
    }, [activeStudent, user?.name]);

    const getFilteredData = useMemo(() => {
        const items = activeTab === 'students' ? students : activeTab === 'staff' ? staff : activeTab === 'subjects' ? subjects : activeTab === 'announcements' ? announcements : auditLogs;
        if (!searchQuery) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(item => {
            if (activeTab === 'staff') return (item.name || '').toLowerCase().includes(q) || (item.email || '').toLowerCase().includes(q);
            if (activeTab === 'subjects') return (item.name || '').toLowerCase().includes(q) || (item.code || '').toLowerCase().includes(q);
            if (activeTab === 'announcements') return (item.title || '').toLowerCase().includes(q) || (item.content || '').toLowerCase().includes(q);
            if (activeTab === 'audit') return (item.action || '').toLowerCase().includes(q) || (item.userEmail || '').toLowerCase().includes(q);
            return false;
        });
    }, [activeTab, searchQuery, students, staff, subjects, announcements, auditLogs]);

    return {
        user, stats, classStats, deptStats, students, subjects, staff, auditLogs, announcements,
        collegeWorkflow, loading, uploadLoading, activeTab, searchQuery, modalMode, formData,
        editingId, assignData, activeStudent, showAddModal, showAssignModal, showStudentAssignModal,
        showCommonFeeModal, showCustomClearanceModal, commonFeeAmount, addingCommonFee,
        isSavingWorkflow, newWorkflowStep, getFilteredData,
        studentPage, studentTotal, studentTotalPages, studentLimit,
        filterDepartment, filterClassName, filterFeeStatus, filterArchived,
        sortBy, sortOrder,
        setActiveTab, setModalMode, setFormData, setEditingId,
        setAssignData, setActiveStudent, setShowAddModal, setShowAssignModal,
        setShowStudentAssignModal, setShowCommonFeeModal, setShowCustomClearanceModal,
        setCommonFeeAmount, setNewWorkflowStep,
        setStudentPage, setFilterDepartment, setFilterClassName,
        setFilterFeeStatus, setFilterArchived, setSortBy, setSortOrder,
        fetchData, handleBulkUpload, handleEditClick, handleAddItem, handleDeleteItem, handleRestoreItem,
        handleToggleFee, handleAssignStaff, handleAssignStudent, handleExportFees,
        handleExportFeesPDF, closeModals, handleAssignCommonFee, handleSaveWorkflow,
        handleToggleCustomClearance, handleSearch, handleFilterChange, handlePageChange,
        fetchStudents, fetchAuditLogs
    };
}
