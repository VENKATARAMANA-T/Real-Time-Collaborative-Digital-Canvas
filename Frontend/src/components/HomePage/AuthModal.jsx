import React, { useState } from 'react';
import { authAPI } from '../../services/api';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthModal({ isOpen, onClose, mode, onModeChange, isLoading, onLoginSuccess }) {
  // Forgot password state (kept here since it's modal-specific)
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotFlash, setForgotFlash] = useState({ error: '', success: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivationState, setIsActivationState] = useState(false);

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotFlash({ error: '', success: '' });
    setIsSubmitting(true);

    try {
      const response = await authAPI.forgotPassword(forgotEmail);
      setIsSubmitting(false);
      setForgotFlash({ error: '', success: 'Password reset link sent to your email. The link expires in 5 minutes.' });

      // Auto-close modal and return to homepage after flash message
      setTimeout(() => {
        setForgotFlash({ error: '', success: '' });
        setForgotEmail('');
        onClose();
      }, 3000);
    } catch (error) {
      setIsSubmitting(false);
      setForgotFlash({ error: error.response?.data?.message || 'Failed to send reset link', success: '' });
    }
  };

  const closeForgotFlash = () => setForgotFlash({ error: '', success: '' });

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm opacity-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : ''}`}>
      {/* Hide close button only during activation sequence */}
      {!isActivationState && (
        <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-white z-50 bg-[#0f172a]/50 sm:bg-transparent rounded-full p-1 sm:p-0">
          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      )}

      <div className="relative w-full max-w-md h-auto min-h-[500px] max-h-[90vh] md:h-[680px] perspective-1000 mx-4">
        <div className={`relative w-full h-full min-h-[500px] md:min-h-full transition-transform duration-700 transform-style-3d ${mode === 'register' ? 'rotate-y-180' : ''
          }`}>
          {/* Login Form */}
          <div className={`absolute inset-0 backface-hidden ${mode === 'forgot' ? 'hidden' : ''} overflow-y-auto md:overflow-hidden rounded-2xl`}>
            <LoginForm onClose={onClose} onModeChange={onModeChange} onLoginSuccess={onLoginSuccess} />
          </div>

          {/* Register Form */}
          <div className={`absolute inset-0 backface-hidden rotate-y-180 ${mode === 'forgot' ? 'hidden' : ''} overflow-y-auto md:overflow-hidden rounded-2xl`}>
            <RegisterForm
              onClose={onClose}
              onModeChange={onModeChange}
              onActivationStateChange={setIsActivationState}
            />
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

              {forgotFlash.error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm flex items-start justify-between animate-slideDown">
                  <div className="flex items-start flex-1">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{forgotFlash.error}</span>
                  </div>
                  <button onClick={closeForgotFlash} className="ml-2 text-red-300 hover:text-red-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {forgotFlash.success && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-sm flex items-start justify-between animate-slideDown">
                  <div className="flex items-start flex-1">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{forgotFlash.success}</span>
                  </div>
                  <button onClick={closeForgotFlash} className="ml-2 text-green-300 hover:text-green-100 transition-colors">
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
                    placeholder="youremail@gmail.com"
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
                  className="ml-1 text-sm font-semibold text-orange-400 hover:text-orange-300"
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
