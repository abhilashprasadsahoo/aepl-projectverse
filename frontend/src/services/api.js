import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
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

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

// Projects APIs
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getFeatured: () => api.get('/projects/featured'),
  getById: (id) => api.get(`/projects/${id}`),
  checkPurchase: (id) => api.get(`/projects/${id}/check-purchase`)
};

// Orders APIs
export const ordersAPI = {
  createOrder: (projectId) => api.post('/orders/create', { projectId }),
  verifyPayment: (data) => api.post('/orders/verify', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getDownload: (projectId) => api.get(`/orders/${projectId}/download`)
};

// Reviews APIs
export const reviewsAPI = {
  create: (data) => api.post('/reviews', data),
  getByProject: (projectId, params) => api.get(`/reviews/project/${projectId}`, { params }),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`)
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  blockUser: (id) => api.put(`/admin/users/${id}/block`),
  getProjects: (params) => api.get('/admin/projects', { params }),
  createProject: (data) => api.post('/admin/projects', data),
  updateProject: (id, data) => api.put(`/admin/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/admin/projects/${id}`),
  featureProject: (id) => api.put(`/admin/projects/${id}/feature`),
  uploadPreview: (id, formData) => api.post(`/admin/projects/${id}/preview`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadFiles: (id, formData) => api.post(`/admin/projects/${id}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`)
};

export default api;
