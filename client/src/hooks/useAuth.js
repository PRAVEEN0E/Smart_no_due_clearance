import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useEffect, useCallback } from 'react';
import api from '../lib/api';

export default function useAuth() {
    const { user, setAuth, logout } = useAuthStore();
    const navigate = useNavigate();

    const isAdmin = user?.role === 'MENTOR' || user?.role === 'SUPERADMIN';
    const isStaff = user?.role === 'STAFF';
    const isStudent = user?.role === 'STUDENT';

    useEffect(() => {
        if (user?.branding) {
            const root = document.documentElement;
            if (user.branding.primaryColor) {
                root.style.setProperty('--primary', user.branding.primaryColor);
            }
            if (user.branding.secondaryColor) {
                root.style.setProperty('--secondary', user.branding.secondaryColor);
            }
        }
    }, [user]);

    const handleLogout = useCallback(async () => {
        try {
            await api.post('/logout');
        } catch (e) {
            // Ignore logout API errors
        }
        logout();
        navigate('/login');
    }, [logout, navigate]);

    return {
        user,
        setAuth,
        logout: handleLogout,
        isAdmin,
        isStaff,
        isStudent,
        navigate,
        branding: user?.branding
    };
}
