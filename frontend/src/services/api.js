import axios from 'axios';

// Get API URL from environment variable
// Falls back to '/api' if not set (proxy mode)
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Log API URL in development
if (import.meta.env.DEV) {
    console.log('API Base URL:', baseURL);
}

// Add request interceptor to include JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Don't redirect if it's a login or register request (user entering wrong credentials)
            const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                                   error.config?.url?.includes('/auth/register');
            
            if (!isAuthEndpoint) {
                // Token expired or invalid - only redirect for authenticated requests
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
