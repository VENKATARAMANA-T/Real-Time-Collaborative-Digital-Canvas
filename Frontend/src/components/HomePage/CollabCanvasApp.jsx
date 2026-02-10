import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import BackgroundAmbience from './BackgroundAmbience';
import HeroSlide from './HeroSlide';
import FeaturesSlide from './FeaturesSlide';
import CTASlide from './CTASlide';
import NavDots from './NavDots';
import AuthModal from './AuthModal';
import Dashboard from './Dashboard';

export default function CollabCanvasApp() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showDashboard, setShowDashboard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('User');
  const lastScrollTime = useRef(0);

  // Scroll wheel navigation
  useEffect(() => {
    const handleWheel = (e) => {
      if (showDashboard || showAuth) return;

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
  }, [currentSlide, showDashboard, showAuth]);

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
    setShowDashboard(false);
  };

  const handleAuthOpen = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const handleAuthClose = () => {
    setShowAuth(false);
  };

  const handleAuthSubmit = ({ mode, loginId, regUsername }) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowAuth(false);
      setShowDashboard(true);
      if (mode === 'login') {
        const name = (loginId || 'User').split('@')[0] || 'User';
        setUserName(name);
      } else {
        setUserName(regUsername || 'User');
      }
    }, 1500);
  };

  const slides = [
    <HeroSlide key="hero" onAuthOpen={handleAuthOpen} onSlideChange={handleSlideChange} />,
    <FeaturesSlide key="features" />,
    <CTASlide key="cta" onAuthOpen={handleAuthOpen} />,
  ];

  return (
    <div className="bg-[#0f172a] text-white min-h-screen font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* Background Ambience */}
      <BackgroundAmbience />

      {/* Navigation */}
      <Navbar onSlideChange={handleSlideChange} onAuthOpen={handleAuthOpen} />

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
        onSubmit={handleAuthSubmit}
      />

      {/* Dashboard */}
      <Dashboard isOpen={showDashboard} userName={userName} />
    </div>
  );
}

