import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isHydrated: false,

    hydrate: () => {
        try {
            const stored = sessionStorage.getItem('auth');
            if (stored) {
                const parsed = JSON.parse(stored);
                set({ user: parsed.user, token: parsed.token, isHydrated: true });
                return;
            }
        } catch (e) {
            // Corrupted storage, ignore
        }
        set({ isHydrated: true });
    },

    setAuth: (user, token) => {
        // Store minimal non-sensitive user info in sessionStorage for tab persistence
        // JWT is stored in httpOnly cookie - NOT accessible from JavaScript
        try {
            const safeData = {
                user: {
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
                },
                token: token || null
            };
            sessionStorage.setItem('auth', JSON.stringify(safeData));
            set({ user: safeData.user, token: safeData.token });
        } catch (e) {
            // Storage full or unavailable
            set({ user: null, token: null });
        }
    },

    logout: () => {
        try {
            sessionStorage.removeItem('auth');
        } catch (e) {
            // Ignore
        }
        set({ user: null, token: null });
    }
}));

export default useAuthStore;
