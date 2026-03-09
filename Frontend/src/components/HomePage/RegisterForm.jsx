import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { io } from 'socket.io-client';

export default function RegisterForm({ onClose, onModeChange, onActivationStateChange }) {
  const { register, error, clearError } = useAuth();
  const socketRef = useRef(null);

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [flash, setFlash] = useState({ error: '', success: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activationSent, setActivationSent] = useState(() => {
    // Check if activation was sent and if it hasn't expired
    const isSent = localStorage.getItem('collab_activationSent') === 'true';
    const sentTime = localStorage.getItem('collab_activationSentTime');
    
    if (!isSent || !sentTime) {
      return false;
    }
    
    // Check if 5 minutes (300 seconds) has elapsed
    const elapsed = (Date.now() - parseInt(sentTime, 10)) / 1000;
    if (elapsed > 300) {
      // Clear old state if expired
      localStorage.removeItem('collab_activationSent');
      localStorage.removeItem('collab_activationSentTime');
      localStorage.removeItem('collab_activationEmail');
      localStorage.removeItem('collab_timeLeft');
      return false;
    }
    
    return isSent;
  });
  const [activationEmail, setActivationEmail] = useState(() => {
    return localStorage.getItem('collab_activationEmail') || '';
  });
  const [activationComplete, setActivationComplete] = useState(() => {
    // Check persisted state first (when user closes and reopens tab)
    return localStorage.getItem('collab_activationCompleted') === 'true';
  });
  const [linkExpired, setLinkExpired] = useState(() => {
    // Check explicit expired flag first
    if (localStorage.getItem('collab_linkExpired') === 'true') {
      return true;
    }
    
    // Check if activation was sent and if 5 minutes have elapsed
    const sentTime = localStorage.getItem('collab_activationSentTime');
    if (sentTime) {
      const elapsed = (Date.now() - parseInt(sentTime, 10)) / 1000;
      if (elapsed > 300) {
        // Auto-expire if time has passed
        return true;
      }
    }
    
    return false;
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const sentTime = localStorage.getItem('collab_activationSentTime');
    
    if (!sentTime) {
      return 300; // Default 5 minutes
    }
    
    // Calculate remaining time from when it was originally sent
    const elapsed = (Date.now() - parseInt(sentTime, 10)) / 1000;
    const remaining = Math.max(0, 300 - Math.floor(elapsed));
    
    return remaining;
  });

  // Persist state to localStorage on changes
  useEffect(() => {
    localStorage.setItem('collab_activationSent', activationSent);
    localStorage.setItem('collab_activationEmail', activationEmail);
    localStorage.setItem('collab_linkExpired', linkExpired);
    localStorage.setItem('collab_timeLeft', timeLeft);
    
    // Persist activation complete state using a different key
    if (activationComplete) {
      localStorage.setItem('collab_activationCompleted', 'true');
      // Clean up temporary flags when activation is complete
      localStorage.removeItem('collab_activationSent');
      localStorage.removeItem('collab_activationSentTime');
      localStorage.removeItem('collab_timeLeft');
    } else if (linkExpired) {
      // Clean up when link expires
      localStorage.removeItem('collab_activationCompleted');
      localStorage.removeItem('collab_activationSentTime');
    }
  }, [activationSent, activationEmail, linkExpired, timeLeft, activationComplete]);

  const clearFlash = () => setFlash({ error: '', success: '' });

  // Initialize Socket.io and join activation waiting room
  useEffect(() => {
    if (!activationSent || activationComplete || linkExpired) return;

    // Initialize socket connection
    if (!socketRef.current) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const socketUrl = apiUrl.replace(/\/api\/?$/, '');
      
      socketRef.current = io(socketUrl, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected, joining activation waiting room');
        if (activationEmail) {
          socketRef.current.emit('join_activation_waiting', { email: activationEmail });
        }
      });

      // Listen for account activation event
      socketRef.current.on('account_activated', (data) => {
        console.log('Account activated event received:', data);
        if (data.success && data.email === activationEmail) {
          setActivationComplete(true);
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }

    return () => {
      // Don't disconnect socket yet, user might go to another tab
      // We'll keep it connected to receive activation events
    };
  }, [activationSent, activationComplete, linkExpired, activationEmail]);

  // Listen for activation success from the other tab via BroadcastChannel or via Socket.io
  // IMPORTANT: ONLY trust socket events from server, not localStorage
  // This prevents false activations from spurious localStorage changes
  useEffect(() => {
    if (!activationSent || activationComplete || linkExpired) return;

    let channel;
    try {
      channel = new BroadcastChannel('collabcanvas_activation');
      channel.onmessage = (event) => {
        if (event.data?.type === 'ACCOUNT_ACTIVATED' && event.data?.success) {
          setActivationComplete(true);
        }
      };
    } catch (e) { /* BroadcastChannel not supported */ }

    return () => {
      try { channel?.close(); } catch (e) {}
    };
  }, [activationSent, activationComplete, linkExpired]);

  // 5-minute countdown timer for activation link expiry + polling for activation completion
  useEffect(() => {
    if (!activationSent || activationComplete || linkExpired) return;

    if (onActivationStateChange) onActivationStateChange(true);

    // Only reset to 300 if this is a fresh activation, otherwise keep saved value from localStorage
    if (timeLeft === 0 || timeLeft === 300 && !localStorage.getItem('collab_timeLeft')) {
      setTimeLeft(300);
    }
    
    // Timer countdown
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setLinkExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
    };
  }, [activationSent, activationComplete, linkExpired, onActivationStateChange]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current && activationEmail && activationComplete) {
        socketRef.current.emit('leave_activation_waiting', { email: activationEmail });
      }
    };
  }, []);

  const handleCloseActivationCard = () => {
    // User clicked the X button to close the activation waiting card
    // But only if not checking - this is to prevent accidental closing
    const confirmClose = window.confirm(
      'Are you sure you want to close this? You can still activate your account by clicking the email link.\n\nClosing will take you back to the registration form.'
    );
    
    if (confirmClose) {
      localStorage.removeItem('collab_activationSent');
      localStorage.removeItem('collab_activationEmail');
      localStorage.removeItem('collab_linkExpired');
      localStorage.removeItem('collab_timeLeft');
      localStorage.removeItem('collab_activationCompleted');
      localStorage.removeItem('collab_activationSentTime');
      setActivationSent(false);
      setActivationEmail('');
      setActivationComplete(false);
      setLinkExpired(false);
      setTimeLeft(300);
      clearFlash();
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      if (onActivationStateChange) onActivationStateChange(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearFlash();
    setIsSubmitting(true);

    const result = await register({
      username: regUsername,
      email: regEmail,
      password: regPassword
    });

    setIsSubmitting(false);

    if (result.success) {
      setActivationSent(true);
      setActivationEmail(regEmail);
      // Save timestamp when activation is sent
      localStorage.setItem('collab_activationSentTime', Date.now().toString());
      setFlash({ error: '', success: result.message || 'Activation link has been sent to your email address. Please check your email to activate your account.' });
      // Don't auto-clear success here, the UI turns into the Activation flow
    } else {
      setFlash({ error: result.message || 'Registration failed', success: '' });
      setTimeout(() => setFlash({ error: '', success: '' }), 3000);
    }
  };

  return (
    <div className="w-full h-full glass-card rounded-2xl p-8 flex flex-col shadow-2xl bg-[#0f172a]">

      {/* Activation Link Sent State */}
      {activationSent ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">

          {/* After activation is complete */}
          {activationComplete ? (
            <>
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/30">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Activation Successful! 🎉</h3>
              <p className="text-green-300 text-sm mb-2">Your account has been activated successfully.</p>
              <p className="text-slate-400 text-sm mb-8 px-4">You can now login with your credentials.</p>
              <div className="w-full">
                <button
                  onClick={() => {
                    localStorage.removeItem('collab_activationSent');
                    localStorage.removeItem('collab_activationEmail');
                    localStorage.removeItem('collab_linkExpired');
                    localStorage.removeItem('collab_timeLeft');
                    localStorage.removeItem('collab_activationCompleted');
                    localStorage.removeItem('collab_activationSentTime');
                    setActivationSent(false);
                    setActivationEmail('');
                    setActivationComplete(false);
                    setLinkExpired(false);
                    setTimeLeft(300);
                    clearFlash();
                    if (onActivationStateChange) onActivationStateChange(false);
                    if (onModeChange) onModeChange('login');
                  }}
                  className="w-full py-3.5 rounded-lg bg-green-600 hover:bg-green-500 font-bold text-white transition-all shadow-lg hover:shadow-green-500/25"
                >
                  Go to Login
                </button>
              </div>
            </>

          ) : linkExpired ? (
            <>
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500/30">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Account Creation Failed</h3>
              <p className="text-red-300 text-sm mb-2">Your activation link has expired.</p>
              <p className="text-slate-400 text-sm mb-8 px-4">The 5-minute window to activate your account has passed. Please sign up again to get a new activation link sent to your email.</p>
              <div className="w-full">
                <button
                  onClick={() => {
                    localStorage.removeItem('collab_activationSent');
                    localStorage.removeItem('collab_activationEmail');
                    localStorage.removeItem('collab_linkExpired');
                    localStorage.removeItem('collab_timeLeft');
                    localStorage.removeItem('collab_activationCompleted');
                    localStorage.removeItem('collab_activationSentTime');
                    setActivationSent(false);
                    setActivationEmail('');
                    setActivationComplete(false);
                    setLinkExpired(false);
                    setTimeLeft(300);
                    clearFlash();
                    setRegUsername('');
                    setRegEmail('');
                    setRegPassword('');
                    if (onActivationStateChange) onActivationStateChange(false);
                  }}
                  className="w-full py-3.5 rounded-lg bg-red-600 hover:bg-red-500 font-bold text-white transition-all shadow-lg hover:shadow-red-500/25"
                >
                  Try Again
                </button>
              </div>
            </>

          ) : (
            /* Waiting for verification */
            <>
              <button
                onClick={handleCloseActivationCard}
                className="absolute top-4 right-4 p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                title="Close (you can still activate via email link)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-cyan-500/30">
                <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Check Your Email</h3>
              <p className="text-cyan-300 text-sm mb-2">Activation link sent to your email address</p>
              <p className="text-slate-400 text-sm mb-4 px-4">
                We've sent an activation link to <span className="text-cyan-400 font-semibold">{activationEmail}</span>.
                Please open your email and click the link to activate your account.
              </p>

              {/* Countdown timer */}
              <div className="mb-4 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Link expires in</p>
                <p className={`text-2xl font-mono font-bold ${timeLeft <= 60 ? 'text-orange-400' : 'text-cyan-400'}`}>
                  {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                </p>
              </div>

              {/* Animated waiting indicator */}
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span>Waiting for email verification</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
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
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm"
                placeholder="youremail@gmail.com"
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
              className="w-full py-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold transition-all shadow-lg hover:shadow-cyan-500/25 mt-4 disabled:opacity-70 disabled:cursor-not-allowed text-white"
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

          {onModeChange && (
            <div className="text-center mt-3 pt-3 border-t border-slate-700/50">
              <span className="text-slate-400 text-sm">Already have an account?</span>
              <button
                onClick={() => onModeChange('login')}
                className="text-cyan-400 font-semibold hover:text-cyan-300 ml-1 text-sm"
              >
                Sign In
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
