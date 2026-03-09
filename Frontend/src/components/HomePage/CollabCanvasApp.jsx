import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from './Navbar';
import BackgroundAmbience from './BackgroundAmbience';
import HeroSlide from './HeroSlide';
import FeaturesSlide from './FeaturesSlide';
import CTASlide from './CTASlide';
import NavDots from './NavDots';
import AuthModal from './AuthModal';

// Logout Loading Overlay
function LogoutOverlay({ isLoggingOut }) {
  if (!isLoggingOut) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-[#0f172a] px-12 py-12 shadow-2xl">
        {/* Animated spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
        </div>
        <p className="text-sm font-semibold text-slate-100">Logging out...</p>
      </div>
    </div>
  );
}

export default function CollabCanvasApp({ initialShowAuth = false, initialAuthMode = 'login' }) {
  const { user, isLoggingOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(initialShowAuth);
  const [authMode, setAuthMode] = useState(initialAuthMode);
  const [isLoading, setIsLoading] = useState(false);
  const [flash, setFlash] = useState(null);
  const lastScrollTime = useRef(0);

  // Auto-open modal to register view if user is in the middle of activating via locally stored flag
  useEffect(() => {
    // Check for logout flash message FIRST
    const logoutFlashStr = localStorage.getItem('logoutFlash');
    if (logoutFlashStr) {
      try {
        const logoutFlashData = JSON.parse(logoutFlashStr);
        setFlash(logoutFlashData);
        localStorage.removeItem('logoutFlash');
        // Don't show auth modal and return early if logout flash exists
        setShowAuth(false);
        return;
      } catch (e) {
        console.error('Error parsing logout flash:', e);
        localStorage.removeItem('logoutFlash');
      }
    }
    
    // Auto-open modal for activation (only if no logout flash)
    if (localStorage.getItem('collab_activationSent') === 'true') {
      setAuthMode('register');
      setShowAuth(true);
    }
  }, []);

  // Scroll wheel navigation
  useEffect(() => {
    const handleWheel = (e) => {
      if (showAuth) return;

      const now = Date.now();
      if (now - lastScrollTime.current < 1000) return;

      if (e.deltaY > 0) {
        if (currentSlide < 2) {
          setCurrentSlide((prev) => prev + 1);
          lastScrollTime.current = now;
        }
      } else if (e.deltaY < 0) {
        if (currentSlide > 0) {
          setCurrentSlide((prev) => prev - 1);
          lastScrollTime.current = now;
        }
      }
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentSlide, showAuth]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  const handleAuthOpen = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const handleAuthClose = () => {
    setShowAuth(false);
    if (['/login', '/register', '/forgot-password'].includes(location.pathname)) {
      navigate('/', { replace: true });
    }
  };

  const handleLoginSuccess = () => {
    setShowAuth(false);
    const redirectPath = localStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  useEffect(() => {
    if (location.state?.flash) {
      setFlash(location.state.flash);
      navigate(location.pathname, { replace: true, state: {} });
    }
    return undefined;
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!flash) return undefined;
    const timeoutId = setTimeout(() => setFlash(null), 3000);
    return () => clearTimeout(timeoutId);
  }, [flash]);

  const slides = [
    <HeroSlide key="hero" onAuthOpen={handleAuthOpen} onSlideChange={handleSlideChange} />,
    <FeaturesSlide key="features" />,
    <CTASlide key="cta" onAuthOpen={handleAuthOpen} />,
  ];

  return (
    <div className="bg-[#0f172a] text-white min-h-screen font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* Logout Loading Overlay */}
      <LogoutOverlay isLoggingOut={isLoggingOut} />

      {/* Background Ambience */}
      <BackgroundAmbience />

      {/* Navigation */}
      <Navbar onSlideChange={handleSlideChange} onAuthOpen={handleAuthOpen} />

      {flash && (
        <div className="fixed top-24 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4">
          <div
            className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm shadow-xl ${
              flash.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
            }`}
          >
            <span>{flash.message}</span>
            <button className="text-xs font-semibold uppercase tracking-widest" onClick={() => setFlash(null)} type="button">
              X
            </button>
          </div>
        </div>
      )}

      {/* Main Slides Container */}
      <main className="slide-container relative z-10" style={{ marginTop: '80px' }}>
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`slide ${currentSlide === index ? 'active' : ''} ${index < currentSlide ? 'prev' : ''}`}
          >
            {slide}
          </div>
        ))}
      </main>

      {/* Navigation Dots */}
      <NavDots currentSlide={currentSlide} onSlideChange={handleSlideChange} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={handleAuthClose}
        mode={authMode}
        onModeChange={setAuthMode}
        isLoading={isLoading}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}

