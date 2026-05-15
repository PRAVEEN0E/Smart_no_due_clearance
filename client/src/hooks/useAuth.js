import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useEffect } from 'react';

export default function useAuth() {
    const { user, token, setAuth, logout } = useAuthStore();
    const navigate = useNavigate();

    const isAdmin = user?.role === 'MENTOR' || user?.role === 'SUPERADMIN';
    const isStaff = user?.role === 'STAFF';
    const isStudent = user?.role === 'STUDENT';

    useEffect(() => {
        if (user?.branding) {
            const root = document.documentElement;
            if (user.branding.primaryColor) {
                // Convert hex to HSL if possible, or just use hex (Tailwind might need HSL for opacity)
                // For simplicity now, we'll just set the variables
                root.style.setProperty('--primary', user.branding.primaryColor);
            }
            if (user.branding.secondaryColor) {
                root.style.setProperty('--secondary', user.branding.secondaryColor);
            }
        }
    }, [user]);

    return { user, token, setAuth, logout, isAdmin, isStaff, isStudent, navigate, branding: user?.branding };
}
