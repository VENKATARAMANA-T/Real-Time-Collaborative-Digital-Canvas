import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authAPI } from '../../services/api';

export default function AuthModal({ isOpen, onClose, mode, onModeChange, isLoading }) {
  const { register, login, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  
  // UI state
  const [flashByMode, setFlashByMode] = useState({
    login: { error: '', success: '' },
    register: { error: '', success: '' },
    forgot: { error: '', success: '' },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setModeFlash = (targetMode, updates) => {
    setFlashByMode((prev) => ({
      ...prev,
      [targetMode]: { ...prev[targetMode], ...updates },
    }));
  };

  const clearModeFlash = (targetMode) => {
    setModeFlash(targetMode, { error: '', success: '' });
  };

  useEffect(() => {
    if (!isOpen) {
      // Clear all form fields
      setLoginEmail('');
      setLoginPassword('');
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setForgotEmail('');
      setFlashByMode({
        login: { error: '', success: '' },
        register: { error: '', success: '' },
        forgot: { error: '', success: '' },
      });
      clearError();
    }
  }, [isOpen, clearError]);

  useEffect(() => {
    if (error) {
      setModeFlash('login', { error });
    }
  }, [error]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearModeFlash('login');
    setIsSubmitting(true);
    
    const result = await login({ email: loginEmail, password: loginPassword });
    
    setIsSubmitting(false);
    
    if (result.success) {
      setModeFlash('login', { success: 'Login successful! Redirecting to dashboard...' });
      // Redirect to dashboard after 1 second
      setTimeout(() => {
        onClose();
        navigate('/dashboard');
      }, 1000);
    } else {
      setModeFlash('login', { error: result.message || 'Login failed' });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    clearModeFlash('register');
    setIsSubmitting(true);
    
    const result = await register({ 
      username: regUsername, 
      email: regEmail, 
      password: regPassword 
    });
    
    setIsSubmitting(false);
    
    if (result.success) {
      setModeFlash('register', { success: result.message || 'Registration successful! Please login.' });
      // Switch to login mode after 2 seconds
      setTimeout(() => {
        clearModeFlash('register');
        onModeChange('login');
      }, 2000);
    } else {
      setModeFlash('register', { error: result.message || 'Registration failed' });
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    clearModeFlash('forgot');
    setIsSubmitting(true);
    
    try {
      const response = await authAPI.forgotPassword(forgotEmail);
      setIsSubmitting(false);
      setModeFlash('forgot', { success: response.message || 'Reset link sent to your email.' });
      
      // Switch back to login after 3 seconds
      setTimeout(() => {
        clearModeFlash('forgot');
        onModeChange('login');
      }, 3000);
    } catch (error) {
      setIsSubmitting(false);
      setModeFlash('forgot', { error: error.response?.data?.message || 'Failed to send reset link' });
    }
  };

  const closeFlashMessage = () => {
    clearModeFlash(mode);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm opacity-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : ''}`}>
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white z-50">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <div className="relative w-full max-w-md h-[600px] perspective-1000">
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
          mode === 'register' ? 'rotate-y-180' : ''
        }`}>
          {/* Login Form */}
          <div className={`absolute inset-0 backface-hidden ${mode === 'forgot' ? 'hidden' : ''}`}>
            <div className="w-full h-full glass-card rounded-2xl p-8 flex flex-col shadow-2xl bg-[#0f172a]">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-purple-300">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 3l1.5 3 3 .5-2.2 2.2.5 3-2.8-1.5-2.8 1.5.5-3L7.5 6.5l3-.5L12 3z" />
                    <path d="M5 14.5l1 2 2 .5-1.5 1.5.4 2-1.9-1-1.9 1 .4-2L2 17l2-.5 1-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">Welcome Back</h3>
                <p className="text-slate-400 text-sm">Enter your credentials to access your workspace.</p>
              </div>

              {/* Error and Success Messages */}
              {flashByMode.login.error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm flex items-start justify-between animate-slideDown">
                  <div className="flex items-start flex-1">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{flashByMode.login.error}</span>
                  </div>
                  <button 
                    onClick={closeFlashMessage}
                    className="ml-2 text-red-300 hover:text-red-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {flashByMode.login.success && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-sm flex items-start justify-between animate-slideDown">
                  <div className="flex items-start flex-1">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{flashByMode.login.success}</span>
                  </div>
                  <button 
                    onClick={closeFlashMessage}
                    className="ml-2 text-green-300 hover:text-green-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => onModeChange('forgot')}
                    className="text-purple-400 hover:text-purple-300 text-xs mt-2 inline-block"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold transition-all shadow-lg hover:shadow-purple-500/25 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-slate-700/50">
                <span className="text-slate-400 text-sm">New to CollabCanvas?</span>
                <button
                  onClick={() => onModeChange('register')}
                  className="text-purple-400 font-semibold hover:text-purple-300 ml-1 text-sm"
                >
                  Create an account
                </button>
              </div>
            </div>
          </div>

          {/* Register Form */}
          <div className={`absolute inset-0 backface-hidden rotate-y-180 ${mode === 'forgot' ? 'hidden' : ''}`}>
            <div className="w-full h-full glass-card rounded-2xl p-8 flex flex-col shadow-2xl bg-[#0f172a]">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-cyan-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-cyan-300">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 19c1.5-3 4-5 7-7 2-2 4.5-4.5 7-7 0 4-1 7-3 9-2 2-4 3.5-6 5-2 2-3 3-5 4l0-4z" />
                    <path d="M9 15l-3 3" />
                    <path d="M14 10l-3 3" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">Create Account</h3>
                <p className="text-slate-400 text-sm">Join the collaboration revolution.</p>
              </div>

              {/* Error and Success Messages */}
              {flashByMode.register.error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm flex items-start justify-between animate-slideDown">
                  <div className="flex items-start flex-1">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{flashByMode.register.error}</span>
                  </div>
                  <button 
                    onClick={closeFlashMessage}
                    className="ml-2 text-red-300 hover:text-red-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {flashByMode.register.success && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-sm flex items-start justify-between animate-slideDown">
                  <div className="flex items-start flex-1">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{flashByMode.register.success}</span>
                  </div>
                  <button 
                    onClick={closeFlashMessage}
                    className="ml-2 text-green-300 hover:text-green-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Username</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                    placeholder="cool_creator"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                    placeholder="Strong password"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold transition-all shadow-lg hover:shadow-cyan-500/25 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : 'Sign Up Free'}
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-slate-700/50">
                <span className="text-slate-400 text-sm">Already have an account?</span>
                <button
                  onClick={() => onModeChange('login')}
                  className="text-cyan-400 font-semibold hover:text-cyan-300 ml-1 text-sm"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          {/* Forgot Password Form */}
          <div className={`absolute inset-0 ${mode === 'forgot' ? 'block' : 'hidden'}`}>
            <div className="w-full h-full glass-card rounded-2xl p-8 flex flex-col shadow-2xl bg-[#0f172a] transform transition-all duration-500">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-orange-300">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold">Reset Password</h3>
                <p className="text-slate-400 text-sm">Enter your email to receive a reset link.</p>
              </div>

              {/* Error and Success Messages */}
              {flashByMode.forgot.error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm flex items-start justify-between animate-slideDown">
                  <div className="flex items-start flex-1">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{flashByMode.forgot.error}</span>
                  </div>
                  <button 
                    onClick={closeFlashMessage}
                    className="ml-2 text-red-300 hover:text-red-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {flashByMode.forgot.success && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-sm flex items-start justify-between animate-slideDown">
                  <div className="flex items-start flex-1">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{flashByMode.forgot.success}</span>
                  </div>
                  <button 
                    onClick={closeFlashMessage}
                    className="ml-2 text-green-300 hover:text-green-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                    placeholder="user@example.com"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    We'll send you a link to reset your password.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 font-bold transition-all shadow-lg hover:shadow-orange-500/25 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <div className="text-center mt-6 pt-6 border-t border-slate-700/50">
                <span className="text-slate-400 text-sm">Remember your password?</span>
                <button
                  onClick={() => onModeChange('login')}
                  className="text-orange-400 font-semibold hover:text-orange-300 ml-1 text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
