/**
 * API client configuration
 */
import axios from 'axios';

// Use environment variable or default to relative path to use Vite proxy
const API_ROOT = import.meta.env.VITE_API_URL || '';

// Clean up the URL and ensure it ends with /api
const cleanRoot = API_ROOT.replace(/\/+$/, '');
const API_BASE_URL = cleanRoot.endsWith('/api') 
  ? cleanRoot 
  : `${cleanRoot}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
