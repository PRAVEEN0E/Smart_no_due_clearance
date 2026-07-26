import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { LogOut, Clock, Sparkles } from 'lucide-react';
import useAuth from './hooks/useAuth';
import useAuthStore from './store/authStore';
import NotificationBell from './components/NotificationBell';
import OfflineBanner from './components/OfflineBanner';
import ThemeToggle from './components/ThemeToggle';
import PushNotificationManager from './components/PushNotificationManager';
import AnnouncementTicker from './components/AnnouncementTicker';
import { Toaster } from 'react-hot-toast';
import api from './lib/api';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const MentorDashboard = lazy(() => import('./pages/mentor/MentorDashboard'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const Verification = lazy(() => import('./pages/Verification'));
const AIChatBubble = lazy(() => import('./components/AIChatBubble'));
import ErrorBoundary from './components/ErrorBoundary';
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));

const DashboardLayout = ({ children }) => {
    const { logout, user } = useAuth();
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
            <AnnouncementTicker />
            <OfflineBanner />
            <nav className="border-b border-black/5 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        {user?.branding?.logoUrl ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-black/5 bg-white flex items-center justify-center p-1">
                                <img src={user.branding.logoUrl} alt={user.collegeName} className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-primary border border-primary/30 text-xs md:text-base shrink-0">
                                {user?.collegeName ? user.collegeName[0] : 'N'}
                            </div>
                        )}
                        <h1 className="text-lg md:text-xl font-black italic tracking-tighter truncate text-slate-800 uppercase">
                            {user?.collegeName || 'NO DUE SYSTEM'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-1 md:gap-4">
                        <ThemeToggle />
                        <PushNotificationManager />
                        <NotificationBell />

                        <div className="hidden xs:block h-6 md:h-8 w-[1px] bg-black/5 mx-1 md:mx-2" />

                        <div className="hidden lg:flex flex-col items-end text-right">
                            <span className="text-sm font-bold text-slate-700 leading-none">{user?.name}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black mt-1">{user?.role}</span>
                        </div>

                        <button
                            onClick={logout}
                            aria-label="Logout"
                            className="p-2 md:p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg md:rounded-xl border border-black/5 transition-all group"
                        >
                            <LogOut className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-1">{children}</main>

            <footer className="mt-auto py-6 text-center border-t border-black/5 bg-white/30 backdrop-blur-sm">
                <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary/60" />
                    Made by TalentNest
                    <Sparkles className="w-4 h-4 text-primary/60" />
                </p>
            </footer>

            {user?.role === 'STUDENT' && <AIChatBubble />}
        </div>
    );
};

const MaintenanceScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-500 mb-10 shadow-xl shadow-amber-200">
            <Clock className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-4 uppercase italic">Node Lockdown</h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto mb-10 leading-relaxed italic">
            This institutional node is currently under scheduled maintenance.
            Access will be restored once the infrastructure updates are complete.
        </p>
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            System Node: Offline
        </div>
        <Link to="/" className="mt-12 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">Return to Home</Link>
    </div>
);

const ProtectedRoute = ({ children, roles, isPasswordRoute = false }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;

    if (user?.role !== 'SUPERADMIN' && user?.isMaintenance) {
        return <MaintenanceScreen />;
    }

    if (user?.needsPasswordChange && !isPasswordRoute) {
        return <Navigate to="/change-password" />;
    }

    if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
    return <DashboardLayout>{children}</DashboardLayout>;
};

function App() {
    const [isReady, setIsReady] = useState(false);
    const hydrate = useAuthStore((state) => state.hydrate);

    useEffect(() => {
        hydrate();
        setIsReady(true);
    }, [hydrate]);

    if (!isReady) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-sm font-black text-primary animate-pulse tracking-widest uppercase italic">Initializing System Core...</p>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: '#ffffff',
                        color: '#1e293b',
                        border: '1px solid rgba(0,0,0,0.05)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '16px',
                        fontSize: '14px',
                        padding: '16px 24px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#7c3aed',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <Suspense fallback={
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-sm font-black text-primary animate-pulse tracking-widest uppercase italic">Initializing System Core...</p>
                </div>
            }>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify/hallticket/:studentId" element={<Verification />} />
                    <Route path="/change-password" element={<ProtectedRoute isPasswordRoute={true}><ChangePassword /></ProtectedRoute>} />
                    <Route path="/mentor/*" element={<ProtectedRoute roles={['MENTOR', 'SUPERADMIN']}><MentorDashboard /></ProtectedRoute>} />
                    <Route path="/staff/*" element={<ProtectedRoute roles={['STAFF']}><StaffDashboard /></ProtectedRoute>} />
                    <Route path="/student/*" element={<ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/superadmin/*" element={<ProtectedRoute roles={['SUPERADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}

export default App;
