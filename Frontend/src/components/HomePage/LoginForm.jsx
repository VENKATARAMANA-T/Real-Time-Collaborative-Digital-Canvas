import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function LoginForm({ onClose, onModeChange, onLoginSuccess }) {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [flash, setFlash] = useState({ error: '', success: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error) {
      setFlash(prev => ({ ...prev, error }));
      const timer = setTimeout(() => {
        setFlash(prev => ({ ...prev, error: '' }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const clearFlash = () => setFlash({ error: '', success: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearFlash();
    setIsSubmitting(true);

    const result = await login({ email: loginEmail, password: loginPassword });
    setIsSubmitting(false);

    if (result.success) {
      setFlash({ error: '', success: 'Login successful! Redirecting...' });
      setTimeout(() => {
        if (onClose) onClose();
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          const redirectPath = localStorage.getItem('redirectAfterLogin');
          if (redirectPath) {
            localStorage.removeItem('redirectAfterLogin');
            navigate(redirectPath);
          } else {
            navigate('/dashboard');
          }
        }
      }, 1000);
    } else {
      setFlash({ error: result.message || 'Login failed', success: '' });
      setTimeout(() => setFlash({ error: '', success: '' }), 3000);
    }
  };

  return (
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

      {flash.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm flex items-start justify-between animate-slideDown">
          <div className="flex items-start flex-1">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{flash.error}</span>
          </div>
          <button onClick={clearFlash} className="ml-2 text-red-300 hover:text-red-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {flash.success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-sm flex items-start justify-between animate-slideDown">
          <div className="flex items-start flex-1">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{flash.success}</span>
          </div>
          <button onClick={clearFlash} className="ml-2 text-green-300 hover:text-green-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
            placeholder="youremail@gmail.com"
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
          {onModeChange && (
            <button
              type="button"
              onClick={() => onModeChange('forgot')}
              className="text-purple-400 hover:text-purple-300 text-xs mt-2 inline-block"
            >
              Forgot Password?
            </button>
          )}
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

      {onModeChange && (
        <div className="text-center mt-4 pt-4 border-t border-slate-700/50">
          <span className="text-slate-400 text-sm">New to CollabCanvas?</span>
          <button
            onClick={() => onModeChange('register')}
            className="text-purple-400 font-semibold hover:text-purple-300 ml-1 text-sm"
          >
            Create an account
          </button>
        </div>
      )}
    </div>
  );
}
