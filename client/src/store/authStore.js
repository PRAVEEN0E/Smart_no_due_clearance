import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: null,
    isHydrated: false,

    hydrate: () => {
        try {
            const stored = sessionStorage.getItem('auth_user');
            if (stored) {
                const parsed = JSON.parse(stored);
                set({ user: parsed, isHydrated: true });
                return;
            }
        } catch (e) {
            // Corrupted storage, ignore
        }
        set({ isHydrated: true });
    },

    setAuth: (user) => {
        // Store minimal non-sensitive user info in sessionStorage for tab persistence
        // JWT is ONLY in httpOnly cookie — never accessible from JavaScript
        const safeUser = user
            ? {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email,
                collegeId: user.collegeId,
                collegeName: user.collegeName || user.college?.name || null,
                branding: user.branding || user.college || null,
                className: user.className,
                department: user.department,
                isMaintenance: user.isMaintenance,
                needsPasswordChange: user.needsPasswordChange
            }
            : null;

        try {
            if (safeUser) {
                sessionStorage.setItem('auth_user', JSON.stringify(safeUser));
            } else {
                sessionStorage.removeItem('auth_user');
            }
        } catch (e) {
            // Storage full or unavailable — ignore
        }
        set({ user: safeUser });
    },

    logout: () => {
        try {
            sessionStorage.removeItem('auth_user');
        } catch (e) {
            // Ignore
        }
        set({ user: null });
    }
}));

export default useAuthStore;
