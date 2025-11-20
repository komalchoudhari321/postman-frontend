import axios from 'axios';

// 🚨 ACTION: CHANGE THIS TO YOUR ACTUAL NODE.JS BACKEND BASE URL 🚨
const API_BASE_URL = 'http://localhost:5000/api'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach the JWT token for protected routes
apiClient.interceptors.request.use(
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try { localStorage.removeItem('token'); } catch (_) {}
    }
    return Promise.reject(error);
  }
);

export default apiClient;