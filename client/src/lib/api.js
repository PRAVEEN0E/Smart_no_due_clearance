import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 15000,
    withCredentials: true, // Send cookies (httpOnly JWT) with every request
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    // Skip API calls entirely if browser is offline
    if (!navigator.onLine) {
        return Promise.reject({
            response: {
                data: { message: 'No internet connection. Please check your network and try again.' },
                code: 'NETWORK_OFFLINE'
            },
            message: 'Network Error'
        });
    }

    // Get CSRF token from meta tag or store
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken && !config.headers['X-CSRF-Token']) {
        config.headers['X-CSRF-Token'] = csrfToken;
    }

    // Attach auth token as fallback for WebSocket/SSE connections
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized - clear auth state
        if (error.response?.status === 401) {
            const authStore = useAuthStore.getState();
            if (authStore.user) {
                authStore.logout();
                // Only redirect if not already on login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }

        // Handle CSRF errors
        if (error.response?.status === 403 && error.response?.data?.code === 'CSRF_INVALID_TOKEN') {
            console.warn('CSRF token validation failed. Refreshing page.');
            window.location.reload();
        }

        // Detect network/offline errors
        if (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
            error.response = {
                data: { message: 'Unable to connect to server. Please check your internet connection.', code: 'NETWORK_ERROR' },
                status: 0
            };
        }

        // Handle 408 Request Timeout
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
