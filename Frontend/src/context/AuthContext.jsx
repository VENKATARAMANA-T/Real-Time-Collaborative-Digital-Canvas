import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check if user is logged in on mount securely via backend
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Actually ping the backend to verify the token is valid (using HTTP-Only cookies)
        const data = await authAPI.getMe();
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user)); // Sync local storage cache
        }
      } catch (err) {
        console.warn('Session verification failed:', err);
        // Token invalid or expired — clear cache entirely so protected routes kick in immediately
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };
    
    verifySession();
  }, []);

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authAPI.register(userData);
      
      if (data.success) {
        // Registration successful, return success
        return { success: true, message: data.message || 'Registration successful! Please login.' };
      }
      
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authAPI.login(credentials);
      
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
      
      return { success: false, message: data.message || 'Login failed' };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      
      // Clear any activation-related flags so home page shows clean
      localStorage.removeItem('collab_activationSent');
      localStorage.removeItem('collab_activationEmail');
      localStorage.removeItem('collab_activationSentTime');
      localStorage.removeItem('collab_activationCompleted');
      localStorage.removeItem('collab_linkExpired');
      localStorage.removeItem('collab_timeLeft');
      
      // Clear password reset related flags
      localStorage.removeItem('collab_resetSent');
      localStorage.removeItem('collab_resetEmail');
      localStorage.removeItem('collab_resetSentTime');
      localStorage.removeItem('collab_resetCompleted');
      localStorage.removeItem('collab_resetLinkExpired');
      
      // Set logout flash message flag
      localStorage.setItem('logoutFlash', JSON.stringify({
        type: 'success',
        message: 'You have been logged out successfully.'
      }));
      
      // Wait for logout animation before redirecting
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUser,
    clearError,
    isAuthenticated: !!user,
    isLoggingOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
