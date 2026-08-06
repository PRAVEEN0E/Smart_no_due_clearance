import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import useAuth from './hooks/useAuth';
import useAuthStore from './store/authStore';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import PublicLayout from './components/public/PublicLayout';
import { SITE_NAME, SITE_TAGLINE, SITE_URL, SITE_DESC, SITE_KEYWORDS, OG_IMAGE, LOCALE } from './lib/seo';

// Lazy load pages for performance
// LandingPage is imported EAGERLY (it's the home route): a dynamic chunk would
// add a network round-trip after the entry executes, delaying FCP/LCP on the
// public marketing site. It's small (5KB gzip) and framer-motion-free.
import LandingPage from './components/public/LandingPage';
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const DashboardLayout = lazy(() => import('./components/DashboardLayout'));
const MentorDashboard = lazy(() => import('./pages/mentor/MentorDashboard'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const Verification = lazy(() => import('./pages/Verification'));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));
const AboutPage = lazy(() => import('./components/public/AboutPage'));
const FeaturesPage = lazy(() => import('./components/public/FeaturesPage'));
const ContactPage = lazy(() => import('./components/public/ContactPage'));
const PrivacyPage = lazy(() => import('./components/public/PrivacyPage'));
const TermsPage = lazy(() => import('./components/public/TermsPage'));
const VerifyLandingPage = lazy(() => import('./components/public/VerifyLandingPage'));
const NotFoundPage = lazy(() => import('./components/public/NotFoundPage'));

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
            <section aria-label="Loading" className="min-h-screen flex flex-col items-center justify-center bg-slate-50" role="status">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" aria-hidden="true" />
                <p className="text-sm font-black text-primary animate-pulse tracking-widest uppercase italic">Initializing System Core...</p>
            </section>
        );
    }

    return (
        <ErrorBoundary>
            <Helmet>
                <html lang="en" />
                <title>{`${SITE_NAME} — ${SITE_TAGLINE}`}</title>
                <meta name="description" content={SITE_DESC} />
                <meta name="keywords" content={SITE_KEYWORDS} />
                <meta property="og:title" content={`${SITE_NAME} — ${SITE_TAGLINE}`} />
                <meta property="og:description" content={SITE_DESC} />
                <meta property="og:url" content={SITE_URL} />
                <meta property="og:image" content={OG_IMAGE} />
                <meta property="og:locale" content={LOCALE} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${SITE_NAME} — ${SITE_TAGLINE}`} />
                <meta name="twitter:description" content={SITE_DESC} />
                <meta name="twitter:image" content={OG_IMAGE} />
            </Helmet>
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
                <section aria-label="Loading page" className="min-h-screen flex flex-col items-center justify-center bg-slate-50" role="status">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" aria-hidden="true" />
                    <p className="text-sm font-black text-primary animate-pulse tracking-widest uppercase italic">Loading...</p>
                </section>
            }>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify/hallticket/:studentId" element={<Verification />} />
                    <Route path="/verify" element={<PublicLayout><VerifyLandingPage /></PublicLayout>} />
                    <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
                    <Route path="/features" element={<PublicLayout><FeaturesPage /></PublicLayout>} />
                    <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
                    <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
                    <Route path="/terms" element={<PublicLayout><TermsPage /></PublicLayout>} />
                    <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
                    <Route path="/change-password" element={<ProtectedRoute isPasswordRoute={true}><ChangePassword /></ProtectedRoute>} />
                    <Route path="/mentor/*" element={<ProtectedRoute roles={['MENTOR', 'SUPERADMIN']}><MentorDashboard /></ProtectedRoute>} />
                    <Route path="/staff/*" element={<ProtectedRoute roles={['STAFF']}><StaffDashboard /></ProtectedRoute>} />
                    <Route path="/student/*" element={<ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/superadmin/*" element={<ProtectedRoute roles={['SUPERADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}

export default App;
