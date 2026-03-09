import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function ActivateAccount() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'expired' | 'error'
  const [message, setMessage] = useState('');
  const activatedRef = useRef(false);

  useEffect(() => {
    if (activatedRef.current) return; // Prevent double invocation in StrictMode
    activatedRef.current = true;

    const activate = async () => {
      try {
        const data = await authAPI.activateAccount(token);
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Your account has been activated successfully!');
          
          // Notify the original registration tab via BroadcastChannel only
          try {
            const channel = new BroadcastChannel('collabcanvas_activation');
            channel.postMessage({ type: 'ACCOUNT_ACTIVATED', success: true });
            channel.close();
          } catch (e) { 
            console.warn('BroadcastChannel not supported'); 
          }
        } else {
          setStatus('error');
          setMessage(data.message || 'Activation failed. Please try again.');
        }
      } catch (err) {
        const isExpired = err.response?.status === 410 || err.response?.data?.expired;
        if (isExpired) {
          setStatus('expired');
          setMessage(err.response?.data?.message || 'This activation link has expired.');
        } else {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Activation failed. Invalid link.');
        }
      }
    };

    if (token) {
      activate();
    } else {
      setStatus('error');
      setMessage('Invalid activation link.');
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="bg-[#0f172a] rounded-2xl p-10 shadow-2xl border border-slate-800 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative w-20 h-20">
                {/* Outer spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                {/* Inner spinning ring */}
                <div className="absolute inset-3 rounded-full border-4 border-cyan-500/20"></div>
                <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Activating Your Account</h2>
            <p className="text-slate-400 text-sm">Please wait while we verify your email...</p>
            <div className="mt-6 flex justify-center gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="bg-[#0f172a] rounded-2xl p-10 shadow-2xl border border-green-500/30 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/30">
                <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your Account is Activated</h2>
            <p className="text-slate-400 text-sm mb-8">You can now login to your account.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-lg bg-green-600 hover:bg-green-500 font-bold text-white transition-all shadow-lg hover:shadow-green-500/25"
            >
              Go Back to Home Page
            </button>
          </div>
        )}

        {/* Expired State */}
        {status === 'expired' && (
          <div className="bg-[#0f172a] rounded-2xl p-10 shadow-2xl border border-orange-500/30 text-center animate-fadeIn">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center border-2 border-orange-500/30">
                <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Link Expired</h2>
            <p className="text-orange-300 text-sm mb-6">{message}</p>
            <p className="text-slate-400 text-sm mb-8">
              The activation link has expired. Please go back and register again to get a new link.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-lg bg-orange-600 hover:bg-orange-500 font-bold text-white transition-all shadow-lg hover:shadow-orange-500/25"
            >
              Go to Home Page
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="bg-[#0f172a] rounded-2xl p-10 shadow-2xl border border-red-500/30 text-center animate-fadeIn">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/30">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Activation Failed</h2>
            <p className="text-red-300 text-sm mb-6">{message}</p>
            <p className="text-slate-400 text-sm mb-8">
              The activation link is invalid. Please register again.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold text-white transition-all shadow-lg hover:shadow-purple-500/25"
            >
              Go to Home Page
            </button>
          </div>
        )}
      </div>

      {/* CSS for fadeIn animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
