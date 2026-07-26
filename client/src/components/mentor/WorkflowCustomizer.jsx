import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkflowCustomizer({ workflow, onSave, isSaving, newStep, setNewStep }) {
    const [localWorkflow, setLocalWorkflow] = useState([...workflow]);

    useEffect(() => { setLocalWorkflow([...workflow]); }, [workflow]);

    const handleToggleRequired = (index) => {
        const next = [...localWorkflow];
        next[index].required = !next[index].required;
        setLocalWorkflow(next);
    };

    const handleDeleteStep = (index) => {
        const step = localWorkflow[index];
        if (step.type === 'FEE' || step.type === 'STAFF_APPROVAL') {
            toast.error("Core steps (Financial/Academic) cannot be deleted.");
            return;
        }
        setLocalWorkflow(localWorkflow.filter((_, i) => i !== index));
    };

    const handleAddStep = (e) => {
        e.preventDefault();
        if (!newStep.id || !newStep.label) { toast.error("ID and Label are required."); return; }
        const cleanId = newStep.id.toUpperCase().replace(/[^A-Z0-9_]/g, '');
        if (localWorkflow.some(s => s.id === cleanId)) { toast.error("A step with this ID already exists."); return; }
        setLocalWorkflow([...localWorkflow, { ...newStep, id: cleanId }]);
        setNewStep({ id: '', label: '', type: 'CUSTOM', required: true });
        toast.success("New clearance step added to draft.");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                <h3 className="font-bold text-foreground text-sm mb-1">Clearance Workflow Designer</h3>
                <p className="text-xs text-muted-foreground">Configure the sequence of approvals required before a student's hall ticket is unlocked.</p>
            </div>
            <div className="space-y-3">
                {localWorkflow.map((step, idx) => (
                    <div key={step.id || idx} className="flex items-center justify-between p-4 bg-muted border border-border rounded-2xl">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-sm">{step.label}</span>
                                <span className="text-[9px] font-mono uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{step.type}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">ID: {step.id}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={step.required} onChange={() => handleToggleRequired(idx)}
                                    className="rounded border-border text-primary focus:ring-primary w-4 h-4" />
                                <span className="text-xs font-bold text-muted-foreground">Required</span>
                            </label>
                            {step.type !== 'FEE' && step.type !== 'STAFF_APPROVAL' && (
                                <button type="button" onClick={() => handleDeleteStep(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleAddStep} className="p-4 bg-card border border-border rounded-2xl space-y-4">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Add Custom Clearance Step</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Unique Step ID</label>
                        <input type="text" placeholder="e.g. LIBRARY, SPORTS" value={newStep.id}
                            onChange={(e) => setNewStep({ ...newStep, id: e.target.value })}
                            className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary font-mono" required />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Display Label</label>
                        <input type="text" placeholder="e.g. Library Books Return" value={newStep.label}
                            onChange={(e) => setNewStep({ ...newStep, label: e.target.value })}
                            className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary" required />
                    </div>
                </div>
                <button type="submit" className="flex items-center justify-center gap-2 bg-foreground text-background font-bold py-2 px-4 rounded-xl text-xs hover:bg-foreground/80 transition-all">
                    <Plus className="w-4 h-4" /> Add Step to Draft
                </button>
            </form>
            <button type="button" onClick={() => onSave(localWorkflow)} disabled={isSaving}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 text-sm">
                {isSaving ? "Saving changes..." : "Save and Deploy Workflow"}
            </button>
        </div>
    );
}
