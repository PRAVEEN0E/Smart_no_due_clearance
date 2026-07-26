import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 15000,
    withCredentials: true
});

api.interceptors.request.use(async (config) => {
    if (!navigator.onLine) {
        return Promise.reject({
            response: {
                data: { message: 'No internet connection. Please check your network and try again.' },
                code: 'NETWORK_OFFLINE'
            },
            message: 'Network Error'
        });
    }

    const token = sessionStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized - clear auth state
        if (error.response?.status === 401) {
            const store = useAuthStore.getState();
            if (store.user) {
                store.logout();
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }

        if (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
            error.response = {
                data: { message: 'Unable to connect to server. Please check your internet connection.', code: 'NETWORK_ERROR' },
                status: 0
            };
        }

        if (error.response?.status === 408) {
            error.response.data = {
                message: 'Request timed out. The server may be unreachable.',
                code: 'TIMEOUT'
            };
        }

        return Promise.reject(error);
    }
);

export default api;
