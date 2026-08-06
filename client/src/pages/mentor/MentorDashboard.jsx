import { Helmet } from 'react-helmet-async';
import { getPageTitle, getCanonical } from '../../lib/seo';
import { SkeletonStats, SkeletonTable } from '../../components/Skeletons';
import MentorHeader from '../../components/mentor/MentorHeader';
import MentorStatsGrid from '../../components/mentor/MentorStatsGrid';
import MentorTable from '../../components/mentor/MentorTable';
import MentorAnalyticsSidebar from '../../components/mentor/MentorAnalyticsSidebar';
import MentorModals from '../../components/mentor/MentorModals';
import WorkflowCustomizer from '../../components/mentor/WorkflowCustomizer';
import useMentorData from '../../hooks/useMentorData';

export default function MentorDashboard() {
    const d = useMentorData();

    if (d.loading) return (
        <>
            <Helmet>
                <title>{getPageTitle('Mentor Dashboard')}</title>
                <meta name="robots" content="noindex" />
            </Helmet>
            <div className="space-y-8 p-4">
                <SkeletonStats count={4} />
                <SkeletonTable rows={6} cols={4} />
            </div>
        </>
    );

    return (
        <>
            <Helmet>
                <title>{getPageTitle('Mentor Dashboard')}</title>
                <meta name="description" content="Mentor portal for managing student batches, tracking clearances, and monitoring progress on NoDueNest." />
                <meta property="og:title" content={getPageTitle('Mentor Dashboard')} />
                <meta name="twitter:title" content={getPageTitle('Mentor Dashboard')} />
                <link rel="canonical" href={getCanonical('/mentor')} />
                <meta name="robots" content="noindex" />
            </Helmet>
            <div className="space-y-8 animate-in fade-in duration-700">
            <MentorHeader
                onAnnounce={() => { d.setModalMode('announcement'); d.setShowAddModal(true); }}
                onBulkUpload={d.handleBulkUpload}
                onExportFees={d.handleExportFees}
                onExportPDF={d.handleExportFeesPDF}
                uploadLoading={d.uploadLoading}
            />
            <MentorStatsGrid stats={d.stats} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <MentorTable
                    activeTab={d.activeTab} setActiveTab={d.setActiveTab}
                    searchQuery={d.searchQuery} getFilteredData={d.getFilteredData} user={d.user}
                    onAddClick={(mode) => { d.setModalMode(mode); d.setShowAddModal(true); }}
                    onEditClick={d.handleEditClick} onDeleteItem={d.handleDeleteItem}
                    onToggleFee={d.handleToggleFee}
                    onEnrollStudent={(s) => { d.setActiveStudent(s); d.setShowStudentAssignModal(true); }}
                    onCustomClearance={(s) => { d.setActiveStudent(s); d.setShowCustomClearanceModal(true); }}
                    onAssignStaff={(sub) => { d.setAssignData({ ...d.assignData, subjectId: sub.id }); d.setShowAssignModal(true); }}
                    onAuditLog={<WorkflowCustomizer workflow={d.collegeWorkflow} onSave={d.handleSaveWorkflow}
                        isSaving={d.isSavingWorkflow} newStep={d.newWorkflowStep} setNewStep={d.setNewWorkflowStep} />}
                    onRestoreItem={d.handleRestoreItem}
                    onSearch={d.handleSearch}
                    studentPage={d.studentPage} studentTotal={d.studentTotal}
                    studentTotalPages={d.studentTotalPages} onPageChange={d.handlePageChange}
                    filterFeeStatus={d.filterFeeStatus} onFilterChange={d.handleFilterChange}
                />
                <MentorAnalyticsSidebar
                    subjects={d.subjects} onAddClick={(mode) => { d.setModalMode(mode); d.setShowAddModal(true); }}
                    onBulkUpload={d.handleBulkUpload} uploadLoading={d.uploadLoading}
                    onCommonFee={() => d.setShowCommonFeeModal(true)}
                />
            </div>
            <MentorModals
                showCustomClearanceModal={d.showCustomClearanceModal}
                showStudentAssignModal={d.showStudentAssignModal}
                showAddModal={d.showAddModal}
                showAssignModal={d.showAssignModal}
                showCommonFeeModal={d.showCommonFeeModal}
                closeModals={d.closeModals}
                activeStudent={d.activeStudent}
                collegeWorkflow={d.collegeWorkflow}
                handleToggleCustomClearance={d.handleToggleCustomClearance}
                subjects={d.subjects}
                handleAssignStudent={d.handleAssignStudent}
                modalMode={d.modalMode}
                formData={d.formData}
                setFormData={d.setFormData}
                editingId={d.editingId}
                handleAddItem={d.handleAddItem}
                staff={d.staff}
                assignData={d.assignData}
                setAssignData={d.setAssignData}
                handleAssignStaff={d.handleAssignStaff}
                commonFeeAmount={d.commonFeeAmount}
                setCommonFeeAmount={d.setCommonFeeAmount}
                handleAssignCommonFee={d.handleAssignCommonFee}
                addingCommonFee={d.addingCommonFee}
            />
        </div>
        </>
    );
}
