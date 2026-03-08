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
      '/auth/activate',
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

  activateAccount: async (token) => {
    const response = await api.get(`/auth/activate/${token}`);
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

  duplicate: async (id) => {
    const response = await api.post(`/canvases/${id}/duplicate`);
    return response.data;
  },

  // EPIC 4: File Management, Storage, History & Export

  toggleFavorite: async (id) => {
    const response = await api.patch(`/canvases/${id}/favorite`);
    return response.data;
  },

  rename: async (id, title) => {
    const response = await api.patch(`/canvases/${id}/rename`, { title });
    return response.data;
  },

  exportJson: async (id) => {
    const response = await api.get(`/canvases/${id}/export`);
    return response.data;
  },

  saveVersion: async (id) => {
    const response = await api.post(`/canvases/${id}/versions`);
    return response.data;
  },

  getVersions: async (id) => {
    const response = await api.get(`/canvases/${id}/versions`);
    return response.data;
  },

  restoreVersion: async (id, versionId) => {
    const response = await api.put(`/canvases/${id}/versions/${versionId}/restore`);
    return response.data;
  },

  autosave: async (id, data) => {
    const response = await api.put(`/canvases/${id}/autosave`, data);
    return response.data;
  },

  importImage: async (id, imageData) => {
    // Support both base64 and FormData
    if (imageData instanceof FormData) {
      const response = await api.post(`/canvases/${id}/import-image`, imageData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
    const response = await api.post(`/canvases/${id}/import-image`, { image: imageData });
    return response.data;
  },

  getDrawingActions: async (id) => {
    const response = await api.get(`/canvases/${id}/drawing-actions`);
    return response.data;
  },

  backupCanvas: async (id) => {
    const response = await api.post(`/canvases/${id}/backup`);
    return response.data;
  },

  syncCanvas: async (id, syncData) => {
    const response = await api.put(`/canvases/${id}/sync`, syncData);
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

  getMyMeetings: async () => {
    const response = await api.get('/meetings');
    return response.data;
  },

  start: async (meetingDbId) => {
    const response = await api.put(`/meetings/${meetingDbId}/start`);
    return response.data;
  },

  end: async (meetingDbId, canvasData = {}) => {
    const response = await api.put(`/meetings/${meetingDbId}/end`, canvasData);
    return response.data;
  },

  cancel: async (meetingDbId) => {
    const response = await api.delete(`/meetings/${meetingDbId}/cancel`);
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
  },

  updateHostSettings: async (meetingDbId, settings) => {
    const response = await api.put(`/meetings/${meetingDbId}/host-settings`, settings);
    return response.data;
  },

  uploadRecording: async (meetingDbId, blob) => {
    const formData = new FormData();
    formData.append('recording', blob, 'recording.webm');
    const response = await api.post(`/meetings/${meetingDbId}/recording`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000 // 5 min timeout for large uploads
    });
    return response.data;
  },

  getMeetingNotes: async (meetingDbId) => {
    const response = await api.get(`/meetings/${meetingDbId}/notes`);
    return response.data;
  },

  getRecordingUrl: (filename) => {
    if (!filename) return null;
    // If it's already a full URL, return as-is
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    // Local recording served from backend /api/recordings/:filename
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseURL.replace('/api', '')}/api/recordings/${filename}`;
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

export const folderAPI = {
  getAll: async () => {
    const response = await api.get('/folders');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/folders/${id}`);
    return response.data;
  },

  create: async (folderData) => {
    const response = await api.post('/folders', folderData);
    return response.data;
  },

  update: async (id, folderData) => {
    const response = await api.put(`/folders/${id}`, folderData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/folders/${id}`);
    return response.data;
  },

  getCanvases: async (id) => {
    const response = await api.get(`/folders/${id}/canvases`);
    return response.data;
  }
};

// Cloudinary Upload API endpoints
export const uploadAPI = {
  // Upload a single base64 image (canvas thumbnails, imported images, etc.)
  uploadImage: async (imageData, type = 'general') => {
    const response = await api.post('/upload/image', {
      image: imageData,
      folder: 'RealTimeDigitalCanvas',
      type,
    });
    return response.data;
  },

  // Upload multiple base64 images (canvas with imported images)
  uploadImages: async (images) => {
    const response = await api.post('/upload/images', {
      images,
      folder: 'RealTimeDigitalCanvas',
    });
    return response.data;
  },

  // Upload a file (profile picture, etc.)
  uploadFile: async (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('folder', 'RealTimeDigitalCanvas');
    const response = await api.post('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Upload a recording
  uploadRecording: async (blob, meetingId) => {
    const formData = new FormData();
    formData.append('recording', blob, 'recording.webm');
    formData.append('meetingId', meetingId);
    const response = await api.post('/upload/recording', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 min timeout
    });
    return response.data;
  },

  // Delete a Cloudinary resource
  deleteUpload: async (publicId, resourceType = 'image') => {
    const response = await api.delete('/upload/delete', {
      data: { publicId, resourceType },
    });
    return response.data;
  },
};

export const notificationAPI = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};

export default api;
