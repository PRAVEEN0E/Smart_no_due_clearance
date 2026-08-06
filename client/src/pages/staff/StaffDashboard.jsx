import { Helmet } from 'react-helmet-async';
import { getPageTitle, getCanonical } from '../../lib/seo';
import { SkeletonStats, SkeletonTable } from '../../components/Skeletons';
import StaffHeader from '../../components/staff/StaffHeader';
import StaffAnalyticsCards from '../../components/staff/StaffAnalyticsCards';
import StaffCharts from '../../components/staff/StaffCharts';
import StaffEvaluationTable from '../../components/staff/StaffEvaluationTable';
import StaffStudentModal from '../../components/staff/StaffStudentModal';
import StaffDashboardWidgets from '../../components/staff/StaffDashboardWidgets';
import CourseMaterials from '../../components/CourseMaterials';
import ExamQRScanner from './ExamQRScanner';
import useStaffData from '../../hooks/useStaffData';

export default function StaffDashboard() {
    const d = useStaffData();

    if (d.loading) return (
        <>
            <Helmet>
                <title>{getPageTitle('Staff Dashboard')}</title>
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
                <title>{getPageTitle('Staff Dashboard')}</title>
                <meta name="description" content="Staff portal for evaluating student assignments, managing course materials, and tracking clearances on NoDueNest." />
                <meta property="og:title" content={getPageTitle('Staff Dashboard')} />
                <meta name="twitter:title" content={getPageTitle('Staff Dashboard')} />
                <link rel="canonical" href={getCanonical('/staff')} />
                <meta name="robots" content="noindex" />
            </Helmet>
            <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
            <StaffHeader activeTab={d.activeTab} setActiveTab={d.setActiveTab}
                onExportExcel={d.handleExportExcel} onExportPDF={d.handleExportPDF} />

            {d.activeTab === 'performance' ? (
                <>
                    <StaffDashboardWidgets analytics={d.analytics} evaluations={d.evaluations} />

                    <StaffAnalyticsCards avgMarks={d.avgMarks} approvedCount={d.approvedCount}
                        evaluations={d.evaluations} topScore={d.topScore}
                        rejectedCount={d.rejectedCount} pendingCount={d.pendingCount} />

                    <StaffCharts analytics={d.analytics} selectedSubject={d.selectedSubject} evaluations={d.evaluations} />

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                        <div className="xl:col-span-3 space-y-8">
                            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                                {d.subjects.map((sub) => (
                                    <button key={sub.id} onClick={() => d.setSelectedSubject(sub)}
                                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all whitespace-nowrap min-w-[200px] ${
                                            d.selectedSubject?.subjectId === sub.subjectId
                                                ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white'
                                                : 'glass border-white/5 text-muted-foreground hover:border-white/20'
                                        }`}>
                                        <div className="text-left">
                                            <div className="text-sm font-bold">{sub.subject.name}</div>
                                            <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono">{sub.subject.code}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <StaffEvaluationTable selectedSubject={d.selectedSubject}
                                evaluations={d.filteredEvaluations} onUpdateMark={d.handleUpdateMark}
                                onApprove={d.handleApprove} onReject={d.handleReject}
                                onClearRejection={d.handleClearRejection}
                                isReadyToApprove={d.isReadyToApprove}
                                onViewStudent={(s) => d.setActiveStudent(s)}
                                searchQuery={d.searchQuery} onSearchChange={d.setSearchQuery}
                                statusFilter={d.statusFilter} onStatusFilterChange={d.setStatusFilter}
                                selectedEvals={d.selectedEvals} onToggleSelect={d.toggleSelectEval}
                                onToggleSelectAll={d.toggleSelectAll}
                                onBulkApprove={d.handleBulkApprove} onBulkReject={d.handleBulkReject} />
                        </div>

                        <div className="space-y-6">
                            <div className="glass p-6 rounded-[2.5rem] border border-white/10 h-full">
                                <CourseMaterials subjectId={d.selectedSubject?.subjectId} role="STAFF" />
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <ExamQRScanner subjects={d.subjects} />
            )}

            <StaffStudentModal activeStudent={d.activeStudent} previewUrl={d.previewUrl}
                onClose={() => { d.setActiveStudent(null); d.setPreviewUrl(null); }}
                onPreview={(url) => d.setPreviewUrl(url)}
                evaluations={d.evaluations} selectedSubject={d.selectedSubject}
                getFullUrl={d.getFullUrl} />
        </div>
        </>
    );
}