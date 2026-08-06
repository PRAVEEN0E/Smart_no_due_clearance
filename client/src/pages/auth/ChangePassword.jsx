import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import api from '../../lib/api';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { getPageTitle, getCanonical } from '../../lib/seo';

export default function ChangePassword() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, setAuth, navigate } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            return toast.error("New passwords do not match");
        }
        if (newPassword.length < 6) {
            return toast.error("New password must be at least 6 characters");
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            toast.success("Password updated successfully!");
            
            // Update auth state so needsPasswordChange becomes false
            const updatedUser = { ...user, needsPasswordChange: false };
            setAuth(updatedUser);

            // Redirect to appropriate dashboard
            if (updatedUser.role === 'SUPERADMIN') navigate('/superadmin');
            else if (updatedUser.role === 'MENTOR') navigate('/mentor');
            else if (updatedUser.role === 'STAFF') navigate('/staff');
            else navigate('/student');
            
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>{getPageTitle('Change Password')}</title>
                <meta name="description" content="Update your NoDueNest account password securely." />
                <meta property="og:title" content={getPageTitle('Change Password')} />
                <meta name="twitter:title" content={getPageTitle('Change Password')} />
                <link rel="canonical" href={getCanonical('/change-password')} />
                <meta name="robots" content="noindex" />
            </Helmet>
            <div className="min-h-[80vh] flex items-center justify-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[32px] shadow-xl max-w-md w-full border border-slate-100 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8" />
                </div>
                
                <h2 className="text-2xl font-black text-center text-slate-800 mb-2">Change Password</h2>
                <p className="text-center text-slate-500 mb-8 text-sm">
                    For your security, please change your default password before continuing.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Current Password</label>
                        <input
                            type="password"
                            required
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                        <input
                            type="password"
                            required
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                        {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                </form>
            </motion.div>
        </div>
        </>
    );
}
