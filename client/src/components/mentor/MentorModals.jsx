import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, BookOpen, ShieldCheck, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';

function ModalOverlay({ isOpen, onClose, title, children, size = 'md' }) {
    const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={`${sizes[size] || sizes.md} w-full relative z-10 shadow-2xl`}>
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function ClearanceModal({ show, onClose, activeStudent, collegeWorkflow, onToggle }) {
    return (
        <ModalOverlay isOpen={show} onClose={onClose} title="Clearance Checklist">
            <div className="glass p-8 rounded-3xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Clearance Checklist</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="mb-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Student</div>
                    <div className="text-lg font-bold text-foreground">{activeStudent?.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{activeStudent?.email}</div>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {collegeWorkflow.filter(s => s.type !== 'FEE' && s.type !== 'STAFF_APPROVAL').map(step => {
                        const cr = activeStudent?.customClearance?.[step.id] || {};
                        const cleared = !!cr.cleared;
                        return (
                            <div key={step.id} className="flex items-center justify-between p-4 bg-muted border border-border rounded-2xl">
                                <div>
                                    <div className="font-bold text-sm text-foreground">{step.label}</div>
                                    <div className="text-[9px] text-muted-foreground font-mono uppercase">ID: {step.id}</div>
                                    {cr.updatedAt && <div className="text-[8px] text-muted-foreground mt-1">Cleared by {cr.updatedBy || 'System'} on {new Date(cr.updatedAt).toLocaleDateString()}</div>}
                                </div>
                                <button onClick={() => onToggle(step.id, cleared)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${cleared ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-card text-foreground border border-border hover:bg-accent/10'}`}>
                                    {cleared ? 'Cleared' : 'Pending'}
                                </button>
                            </div>
                        );
                    })}
                    {collegeWorkflow.filter(s => s.type !== 'FEE' && s.type !== 'STAFF_APPROVAL').length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-xs italic">No custom clearance steps configured.</div>
                    )}
                </div>
            </div>
        </ModalOverlay>
    );
}

function EnrollModal({ show, onClose, activeStudent, subjects, onAssign }) {
    return (
        <ModalOverlay isOpen={show} onClose={onClose} title="Enroll Student">
            <div className="glass p-8 rounded-3xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-bold">Enroll Student</h1>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Enrolling</div>
                    <div className="text-lg font-bold text-primary">{activeStudent?.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{activeStudent?.email}</div>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {subjects.map(sub => (
                        <button key={sub.id} onClick={() => onAssign(sub.id)}
                            className="w-full p-4 glass border-white/5 hover:border-primary/50 text-left rounded-2xl transition-all flex items-center justify-between group">
                            <div><div className="font-bold text-sm">{sub.name}</div><div className="text-[10px] font-mono opacity-60">{sub.code}</div></div>
                            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))}
                </div>
            </div>
        </ModalOverlay>
    );
}

function AddEditModal({ show, onClose, modalMode, formData, setFormData, editingId, onSubmit }) {
    return (
        <ModalOverlay isOpen={show} onClose={onClose} title={`${editingId ? 'Update' : 'Create New'} ${modalMode}`}>
            <div className="glass p-8 rounded-3xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{editingId ? 'Update' : 'Create New'} {modalMode}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    {modalMode === 'announcement' ? (
                        <>
                            <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Title</label>
                                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                            <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Content</label>
                                <textarea required value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 min-h-[100px] outline-none focus:ring-2 focus:ring-primary/20" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Notice Type</label>
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none">
                                        <option value="EXAM">Exam</option><option value="FEE">Fee</option><option value="GENERAL">General</option><option value="HOLIDAY">Holiday</option>
                                    </select></div>
                                <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Priority</label>
                                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none">
                                        <option value="1">Info</option><option value="2">Important</option><option value="3">Critical</option>
                                    </select></div>
                            </div>
                        </>
                    ) : modalMode !== 'subject' ? (
                        <>
                            <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">{modalMode === 'student' ? 'Student Name' : 'Faculty Name'}</label>
                                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                            <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">College Email</label>
                                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                            {modalMode === 'student' && (
                                <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Register Number</label>
                                    <input required type="text" value={formData.registerNumber || ''} onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                            )}
                            <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">{editingId ? 'New Password (Optional)' : 'Password'}</label>
                                <input required={!editingId} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingId ? "Leave blank to keep current" : "Enter password"}
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                            {modalMode === 'student' && (
                                <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Class / Section</label>
                                    <input type="text" value={formData.className} onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                                        placeholder="e.g. III Year CSE - A"
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Subject Name</label>
                                    <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                                <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Code</label>
                                    <input required type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-primary/20" /></div>
                            </div>
                            <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Category</label>
                                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none">
                                    <option value="FULL_THEORY">Full Theory</option>
                                    <option value="FULL_LAB">Practical/Lab</option>
                                    <option value="THEORY_WITH_LAB">Hybrid (Theory+Lab)</option>
                                </select></div>
                            <div className="grid grid-cols-3 gap-3">
                                <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Sem</label>
                                    <input required type="number" min="1" max="8" value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        className="w-full bg-muted border border-border rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                                <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Exam Date</label>
                                    <input required type="text" placeholder="DD/MM/YYYY" value={formData.examDate}
                                        onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                                        className="w-full bg-muted border border-border rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-primary/20 font-mono" /></div>
                                <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Session</label>
                                    <select value={formData.examSession} onChange={(e) => setFormData({ ...formData, examSession: e.target.value })}
                                        className="w-full bg-muted border border-border rounded-xl px-3 py-3 outline-none focus:ring-2 focus:ring-primary/20">
                                        <option value="FN">FN</option><option value="AN">AN</option>
                                    </select></div>
                            </div>
                            <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Syllabus Content</label>
                                <textarea value={formData.syllabusText} onChange={(e) => setFormData({ ...formData, syllabusText: e.target.value })}
                                    placeholder="Paste subject units, topics or learning outcomes here..."
                                    className="w-full bg-muted border border-border rounded-xl px-4 py-3 min-h-[150px] text-xs leading-relaxed outline-none focus:ring-2 focus:ring-primary/20" /></div>
                        </>
                    )}
                    <button type="submit" className="w-full premium-gradient py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all mt-6">
                        {editingId ? 'Update Changes' : 'Confirm and Save'}
                    </button>
                </form>
            </div>
        </ModalOverlay>
    );
}

function StaffMappingModal({ show, onClose, staff, subjects, assignData, setAssignData, onSubmit }) {
    return (
        <ModalOverlay isOpen={show} onClose={onClose} title="Subject Allocation">
            <div className="glass p-8 rounded-3xl border border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Subject Allocation</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div><label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">Faculty Member</label>
                        <select required value={assignData.staffId} onChange={(e) => setAssignData({ ...assignData, staffId: e.target.value })}
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 font-medium">
                            <option value="">Select Faculty...</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select></div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
                        <div><div className="text-[10px] text-primary font-bold uppercase tracking-wider">Linking To</div>
                            <div className="font-bold">{subjects.find(s => s.id === assignData.subjectId)?.name}</div></div>
                    </div>
                    <button type="submit" className="w-full premium-gradient py-4 rounded-xl font-bold text-white shadow-lg shadow-primary/20 active:scale-95 transition-all">Create Connection</button>
                </form>
            </div>
        </ModalOverlay>
    );
}

function CommonFeeModal({ show, onClose, amount, setAmount, onSubmit, adding }) {
    return (
        <ModalOverlay isOpen={show} onClose={onClose} title="Assign Common Fee">
            <div className="bg-card w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2"><Wallet className="w-5 h-5 text-amber-500" />Assign Common Fee</h3>
                    <button onClick={onClose} className="p-2 hover:bg-accent/10 rounded-full transition-all text-muted-foreground"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={onSubmit} className="p-6 space-y-6">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>This fee will be instantly added to the balance of <strong>every student</strong> under your mentorship.</p>
                    </div>
                    <div><label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2 text-left">Fee Amount (₹)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1"
                                className="w-full bg-muted border border-border rounded-xl pl-8 pr-4 py-3 text-foreground font-bold outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all" placeholder="e.g. 500" />
                        </div></div>
                    <button type="submit" disabled={adding || !amount}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50">
                        {adding ? 'Applying Fee...' : 'Apply Common Fee'}
                    </button>
                </form>
            </div>
        </ModalOverlay>
    );
}

export default function MentorModals(props) {
    const {
        showCustomClearanceModal, showStudentAssignModal, showAddModal, showAssignModal, showCommonFeeModal,
        closeModals, activeStudent, collegeWorkflow, handleToggleCustomClearance, subjects, handleAssignStudent,
        modalMode, formData, setFormData, editingId, handleAddItem, staff, assignData, setAssignData,
        handleAssignStaff, commonFeeAmount, setCommonFeeAmount, handleAssignCommonFee, addingCommonFee,
    } = props;

    return (
        <>
            <ClearanceModal show={showCustomClearanceModal} onClose={closeModals} activeStudent={activeStudent}
                collegeWorkflow={collegeWorkflow} onToggle={handleToggleCustomClearance} />
            <EnrollModal show={showStudentAssignModal} onClose={closeModals} activeStudent={activeStudent}
                subjects={subjects} onAssign={handleAssignStudent} />
            <AddEditModal show={showAddModal} onClose={closeModals} modalMode={modalMode}
                formData={formData} setFormData={setFormData} editingId={editingId} onSubmit={handleAddItem} />
            <StaffMappingModal show={showAssignModal} onClose={closeModals} staff={staff}
                subjects={subjects} assignData={assignData} setAssignData={setAssignData} onSubmit={handleAssignStaff} />
            <CommonFeeModal show={showCommonFeeModal} onClose={closeModals} amount={commonFeeAmount}
                setAmount={setCommonFeeAmount} onSubmit={handleAssignCommonFee} adding={addingCommonFee} />
        </>
    );
}
