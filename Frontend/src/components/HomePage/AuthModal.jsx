import React, { useState, useEffect } from 'react';

export default function AuthModal({ isOpen, onClose, mode, onModeChange, isLoading, onSubmit }) {
  const [loginId, setLoginId] = useState('');
  const [regUsername, setRegUsername] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setLoginId('');
      setRegUsername('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ mode, loginId, regUsername });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm opacity-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : ''}`}>
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white z-50">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <div className="relative w-full max-w-md h-[550px] perspective-1000">
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${mode === 'register' ? 'rotate-y-180' : ''}`}>
          <div className="absolute inset-0 backface-hidden">
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

              <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email or Username</label>
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1 flex justify-between">
                    <span>Password</span>
                    <a href="#" className="text-purple-400 hover:text-purple-300 normal-case">
                      Forgot?
                    </a>
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                    placeholder="********"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold transition-all shadow-lg hover:shadow-purple-500/25 mt-4 disabled:opacity-70"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
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

          <div className="absolute inset-0 backface-hidden rotate-y-180">
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

              <form onSubmit={handleSubmit} className="space-y-3 flex-1">
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
                    className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                    placeholder="Strong password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold transition-all shadow-lg hover:shadow-cyan-500/25 mt-4 disabled:opacity-70"
                >
                  {isLoading ? 'Creating...' : 'Sign Up Free'}
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
        </div>
      </div>
    </div>
  );
}
