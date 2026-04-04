import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
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
import { Analytics } from '@vercel/analytics/react';

const DashboardLayout = ({ children, title }) => {
    const { logout, user } = useAuth();
    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <AnnouncementTicker />
            <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {user?.college?.logoUrl ? (
                            <img src={user.college.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1" />
                        ) : (
                            <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center font-black text-primary border border-primary/30">N</div>
                        )}
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black italic tracking-tighter leading-none">NO DUE</h1>
                            <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-[0.2em]">{user?.college?.name || 'FRAMEWORK'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />

                        <div className="h-8 w-[1px] bg-white/5 mx-2" />

                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-bold">{user?.name}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-black">{user?.role}</span>
                        </div>

                        <button
                            onClick={logout}
                            className="p-2.5 hover:bg-red-500/10 hover:text-red-400 rounded-xl border border-white/10 transition-all text-muted-foreground group"
                        >
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto p-6 md:p-8">{children}</main>
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

import { SocketProvider } from './context/SocketContext';

function App() {
    return (
        <SocketProvider>
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: {
                        background: '#0a1919',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '16px',
                        fontSize: '14px',
                        padding: '16px 24px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
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
            <Analytics />
        </SocketProvider>
    );
}


export default App;
