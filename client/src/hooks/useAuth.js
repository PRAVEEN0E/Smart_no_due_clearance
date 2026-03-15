import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useEffect } from 'react';

export default function useAuth() {
    const { user, token, setAuth, logout } = useAuthStore();
    const navigate = useNavigate();

    const isAdmin = user?.role === 'MENTOR';
    const isStaff = user?.role === 'STAFF';
    const isStudent = user?.role === 'STUDENT';

    return { user, token, setAuth, logout, isAdmin, isStaff, isStudent, navigate };
}
