import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const authPaths = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/refresh',
      '/auth/logout',
    ];
    const isAuthRequest = authPaths.some((path) => originalRequest?.url?.includes(path));

    // If error is 401 and we haven't tried refresh yet
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, avoid reload loops on public pages
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        const isPublicPath = ['/', '/home', '/reset-password'].includes(window.location.pathname);
        const hasRedirected = sessionStorage.getItem('authRedirected') === 'true';

        if (!isPublicPath && !hasRedirected) {
          sessionStorage.setItem('authRedirected', 'true');
          window.location.replace('/');
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success) {
      // Store user data and token
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
    }
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

// Canvas API endpoints (placeholder for future use)
export const canvasAPI = {
  getAll: async () => {
    const response = await api.get('/canvases');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/canvases/${id}`);
    return response.data;
  },

  create: async (canvasData) => {
    const response = await api.post('/canvases', canvasData);
    return response.data;
  },

  update: async (id, canvasData) => {
    console.log('Updating canvas with ID:', id, 'Data:', canvasData);
    const response = await api.put(`/canvases/${id}`, canvasData);
    console.log('Update response:', response.data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/canvases/${id}`);
    return response.data;
  },
};

// User API endpoints (placeholder for future use)
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (userId, userData) => {
    const response = await api.put(`/users/${userId}/profile`, userData);
    if (response.data) {
      // Update localStorage with new user data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return response.data;
  },

  updatePassword: async (userId, passwordData) => {
    const response = await api.put(`/users/${userId}/password`, passwordData);
    return response.data;
  },

  getActivityLogs: async (userId) => {
    const response = await api.get(`/users/${userId}/activity-logs`);
    return response.data;
  },
};

export const meetingAPI = {
  create: async (payload = {}) => {
    const response = await api.post('/meetings', payload);
    return response.data;
  },

  generateCredentials: async () => {
    const response = await api.post('/meetings/generate-credentials');
    return response.data;
  },

  createInstant: async (payload = {}) => {
    const response = await api.post('/meetings/instant', payload);
    return response.data;
  },

  start: async (meetingDbId) => {
    const response = await api.put(`/meetings/${meetingDbId}/start`);
    return response.data;
  },

  end: async (meetingDbId) => {
    const response = await api.put(`/meetings/${meetingDbId}/end`);
    return response.data;
  },

  join: async (meetingId, password) => {
    const response = await api.post('/meetings/join', { meetingId, password });
    return response.data;
  },

  joinByLink: async (token) => {
    const response = await api.post(`/meetings/join-link/${token}`);
    return response.data;
  },

  getDetails: async (meetingDbId) => {
    const response = await api.get(`/meetings/${meetingDbId}`);
    return response.data;
  },

  leave: async (meetingDbId) => {
    const response = await api.put(`/meetings/${meetingDbId}/leave`);
    return response.data;
  },

  updatePermission: async (meetingDbId, userId, permission) => {
    const response = await api.put(`/meetings/${meetingDbId}/permissions`, {
      userId,
      permission
    });
    return response.data;
  }
};

export const chatAPI = {
  getHistory: async (meetingDbId) => {
    const response = await api.get(`/chat/${meetingDbId}`);
    return response.data;
  },

  toggleGlobal: async (meetingDbId, isEnabled) => {
    const response = await api.put(`/chat/${meetingDbId}/toggle-global`, { isEnabled });
    return response.data;
  },

  toggleUser: async (meetingDbId, userId, canChat) => {
    const response = await api.put(`/chat/${meetingDbId}/toggle-user`, { userId, canChat });
    return response.data;
  }
};

export default api;
