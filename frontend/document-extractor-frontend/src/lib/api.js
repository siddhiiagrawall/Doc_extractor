import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:8000/api'; // Adjust this to your Django backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const documentAPI = {
  // Upload and extract document
  extractDocument: (formData) => {
    return api.post('/extract-document/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get all documents
  getDocuments: () => {
    return api.get('/documents/');
  },

  // Get document details
  getDocumentDetail: (documentId) => {
    return api.get(`/documents/${documentId}/`);
  },
};

// Auth API (placeholder for when you implement authentication)
export const authAPI = {
  login: (credentials) => {
    // Always send username and password for backend compatibility
    return api.post('/token/', { username: credentials.username, password: credentials.password });
  },

  register: (userData) => {
    // Only send email and password
    return api.post('/register/', { email: userData.email, password: userData.password });
  },

  logout: () => {
    return api.post('/auth/logout/');
  },

  getProfile: () => {
    return api.get('/auth/profile/');
  },
};

export default api;

