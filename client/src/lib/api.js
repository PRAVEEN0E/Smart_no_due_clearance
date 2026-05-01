import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 15000, // 15 second timeout
});

api.interceptors.request.use((config) => {
    // Skip API calls entirely if browser is offline
    if (!navigator.onLine) {
        return Promise.reject({
            response: { data: { message: 'No internet connection. Please check your network and try again.' } },
            message: 'Network Error'
        });
    }
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Detect network/offline errors and provide a clear message
        if (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
            error.response = {
                data: { message: 'Unable to connect to server. Please check your internet connection.' },
                status: 0
            };
        }
        // Handle 408 Request Timeout
        if (error.response?.status === 408) {
            error.response.data = { message: 'Request timed out. The server may be unreachable — check your internet connection.' };
        }
        return Promise.reject(error);
    }
);

export default api;
