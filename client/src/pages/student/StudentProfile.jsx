import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Camera, Upload, Mail, Hash, Calendar, GraduationCap, Building2, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

export default function StudentProfile({ data, onUpdateProfile, onUploadSignature, profileSaving }) {
    const { user: authUser, logout } = useAuthStore();
    const user = data?.user || {};
    const [form, setForm] = useState({
        name: user.name || '',
        dob: user.dob || '',
        department: user.department || '',
        className: user.className || ''
    });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [changingPassword, setChangingPassword] = useState(false);
    const signatureInputRef = useRef(null);

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        const cleaned = {};
        if (form.name !== user.name) cleaned.name = form.name;
        if (form.dob !== user.dob) cleaned.dob = form.dob;
        if (form.department !== user.department) cleaned.department = form.department;
        if (form.className !== user.className) cleaned.className = form.className;
        if (Object.keys(cleaned).length === 0) { toast('No changes to save'); return; }
        await onUpdateProfile(cleaned);
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (file) onUploadSignature(file);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
        if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        setChangingPassword(true);
        try {
            await api.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            toast.success('Password changed!');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
        finally { setChangingPassword(false); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/student" className="p-3 glass rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">My Profile</h1>
                    <p className="text-sm text-muted-foreground">Manage your personal and account information</p>
                </div>
            </div>

            {/* Profile Photo + Signature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8 flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center">
                        {user.signatureUrl ? (
                            <img src={user.signatureUrl} alt="Signature" className="w-20 h-20 object-contain rounded-full" />
                        ) : (
                            <User className="w-10 h-10 text-primary/60" />
                        )}
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg">{user.name || 'Student'}</div>
                        <div className="text-xs text-muted-foreground font-mono">{user.email}</div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8 flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                        {user.signatureUrl ? (
                            <img src={user.signatureUrl} alt="Signature" className="w-full h-full object-contain p-2" />
                        ) : (
                            <Camera className="w-10 h-10 text-primary/60" />
                        )}
                    </div>
                    <button onClick={() => signatureInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-all border border-primary/20">
                        <Upload className="w-4 h-4" /> {user.signatureUrl ? 'Replace Signature' : 'Upload Signature'}
                    </button>
                    <input ref={signatureInputRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                </motion.div>
            </div>

            {/* Personal Information */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Full Name</label>
                        <input value={form.name} onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Email
                        </label>
                        <input value={user.email || ''} disabled
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm opacity-60 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Date of Birth
                        </label>
                        <input value={form.dob} onChange={(e) => handleChange('dob', e.target.value)} placeholder="DD/MM/YYYY"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> Department
                        </label>
                        <input value={form.department} onChange={(e) => handleChange('department', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> Class
                        </label>
                        <input value={form.className} onChange={(e) => handleChange('className', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
                    </div>
                </div>
                <button onClick={handleSave} disabled={profileSaving}
                    className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50">
                    <Save className="w-4 h-4" /> {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </motion.div>

            {/* Change Password */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Change Password</h3>
                <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-end">
                    <div>
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 md:mb-2 block">Current Password</label>
                        <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
                    </div>
                    <div>
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 md:mb-2 block">New Password</label>
                        <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required minLength={8}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
                    </div>
                    <button type="submit" disabled={changingPassword}
                        className="w-full md:w-auto px-5 md:px-6 py-2.5 md:py-3 bg-primary text-white rounded-xl font-bold text-xs md:text-sm hover:bg-primary/90 transition-all disabled:opacity-50 h-fit">
                        {changingPassword ? 'Changing...' : 'Update Password'}
                    </button>
                </form>
            </motion.div>

            {/* Account Security */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="glass rounded-[2.5rem] border border-white/10 p-6 md:p-8">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Account Security</h3>
                <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <div>
                            <div className="text-sm font-bold text-foreground">Secure Login</div>
                            <div className="text-xs text-muted-foreground">JWT-based authentication with httpOnly cookies</div>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-widest">Active</span>
                </div>
            </motion.div>
        </div>
    );
}