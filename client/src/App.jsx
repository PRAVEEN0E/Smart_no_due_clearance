import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { LogOut, Layout, Download, AlertCircle, CreditCard } from 'lucide-react';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MentorDashboard from './pages/mentor/MentorDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import useAuth from './hooks/useAuth';
import NotificationBell from './components/NotificationBell';
import AnnouncementTicker from './components/AnnouncementTicker';
import { Toaster } from 'react-hot-toast';

// Shared Layout for Dashboards
import Verification from './pages/Verification';
import AIChatBubble from './components/AIChatBubble';

const DashboardLayout = ({ children }) => {
    const { logout, user } = useAuth();
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <AnnouncementTicker />
            <nav className="border-b border-black/5 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-primary border border-primary/30 text-xs md:text-base shrink-0">N</div>
                        <h1 className="text-lg md:text-xl font-black italic tracking-tighter truncate text-slate-800">NO DUE <span className="hidden sm:inline text-primary/60 not-italic font-medium">FRAMEWORK</span></h1>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <NotificationBell />

                        <div className="hidden xs:block h-6 md:h-8 w-[1px] bg-black/5 mx-1 md:mx-2" />

                        <div className="hidden lg:flex flex-col items-end text-right">
                            <span className="text-sm font-bold text-slate-700 leading-none">{user?.name}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-black mt-1">{user?.role}</span>
                        </div>

                        <button
                            onClick={logout}
                            className="p-2 md:p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg md:rounded-xl border border-black/5 transition-all group"
                        >
                            <LogOut className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto p-4 md:p-8">{children}</main>
            {user?.role === 'STUDENT' && <AIChatBubble />}
        </div>
    );
};

const ProtectedRoute = ({ children, roles }) => {
    const { user, token } = useAuth();
    if (!token) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
    return <DashboardLayout>{children}</DashboardLayout>;
};

function App() {
    return (
        <>
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
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify/hallticket/:studentId" element={<Verification />} />
                <Route path="/mentor/*" element={<ProtectedRoute roles={['MENTOR', 'SUPERADMIN']}><MentorDashboard /></ProtectedRoute>} />
                <Route path="/staff/*" element={<ProtectedRoute roles={['STAFF']}><StaffDashboard /></ProtectedRoute>} />
                <Route path="/student/*" element={<ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </>
    );
}

export default App;
