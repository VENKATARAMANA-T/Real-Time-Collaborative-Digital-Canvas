import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [showDashboard, setShowDashboard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('User');

  const canvasRef = useRef(null);
  const particlesRef = useRef(null);
  const lastScrollTime = useRef(0);

  useEffect(() => {
    if (!particlesRef.current) return;
    const container = particlesRef.current;
    // Clear existing
    container.innerHTML = '';
    
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 3;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.background = 'rgba(255,255,255,' + (Math.random() * 0.3 + 0.1) + ')';
      p.style.position = 'absolute';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.borderRadius = '50%';
      p.style.pointerEvents = 'none';
      
      const duration = Math.random() * 10 + 10;
      p.style.transition = `top ${duration}s linear, left ${duration}s linear`;
      
      container.appendChild(p);

      const animate = () => {
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
      };
      // Initial move
      setTimeout(animate, 100);
      // Loop
      const interval = setInterval(animate, duration * 1000);
      return () => clearInterval(interval);
    }
  }, []);

  // --- HERO CANVAS ANIMATION ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let t = 0;

    const draw = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.01;

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 5) {
        const y = canvas.height / 2 + Math.sin(x * 0.01 + t) * 50;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x += 5) {
        const y = canvas.height / 2 + Math.cos(x * 0.02 - t) * 50 + 20;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      const boxX = (Math.sin(t) * 100) + canvas.width / 2;
      const boxY = (Math.cos(t * 1.5) * 50) + canvas.height / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(boxX - 30, boxY - 30, 60, 60);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.strokeRect(boxX - 30, boxY - 30, 60, 60);

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // --- SCROLL HANDLING ---
  useEffect(() => {
    const handleScroll = (e) => {
      if (showDashboard || showAuth) return;
      const now = Date.now();
      if (now - lastScrollTime.current < 1000) return;

      if (e.deltaY > 0) {
        if (currentSlide < 2) {
          setCurrentSlide(prev => prev + 1);
          lastScrollTime.current = now;
        }
      } else if (e.deltaY < 0) {
        if (currentSlide > 0) {
          setCurrentSlide(prev => prev - 1);
          lastScrollTime.current = now;
        }
      }
    };

    window.addEventListener('wheel', handleScroll);
    return () => window.removeEventListener('wheel', handleScroll);
  }, [currentSlide, showDashboard, showAuth]);

  // --- HANDLERS ---
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowAuth(false);
      setShowDashboard(true);
      if (authMode === 'login') {
        const email = document.getElementById('login-id').value;
        setUserName(email.split('@')[0]);
      } else {
        const user = document.getElementById('reg-username').value;
        setUserName(user);
      }
    }, 1500);
  };

  return (
    <div className="bg-[#0f172a] text-white min-h-screen font-sans selection:bg-purple-500/30 overflow-hidden relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] animate-blob" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-orange-600/20 rounded-full blur-[100px] animate-blob" style={{animationDelay: '4s'}}></div>
        <div ref={particlesRef} className="absolute inset-0"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass h-[80px] flex items-center border-b-0 shadow-lg shadow-purple-900/10">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setCurrentSlide(0); setShowDashboard(false); }}>
            <div className="w-10 h-10 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-cyan-400 rounded-lg blur opacity-40 group-hover:opacity-100 transition-opacity"></div>
              <svg className="w-10 h-10 relative z-10 text-white drop-shadow-lg transform group-hover:rotate-180 transition-transform duration-700" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#logo-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="url(#logo-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="url(#logo-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="logo-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a855f7" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">CollabCanvas</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Home', 'Features', 'Pricing'].map((item, idx) => (
              <button 
                key={item} 
                onClick={() => { setCurrentSlide(idx); setShowDashboard(false); }}
                className={`text-sm font-medium transition-all hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ${currentSlide === idx && !showDashboard ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => { setShowAuth(true); setAuthMode('login'); }} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</button>
            <button onClick={() => { setShowAuth(true); setAuthMode('register'); }} className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 font-medium text-sm text-white shadow-lg shadow-purple-500/25 glow-button">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Main Slides Container */}
      <main className="slide-container relative z-10" style={{ marginTop: '80px' }}>
        
        {/* SLIDE 0: HERO */}
        <div className={`slide flex items-center ${currentSlide === 0 ? 'active' : currentSlide > 0 ? 'prev' : ''}`}>
          <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider animate-fade-up">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> v2.0 Now Available
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
                Where Teams <br /> <span className="gradient-text">Create Magic</span>
              </h1>
              <p className="text-lg text-slate-400 max-w-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
                The infinite canvas for brainstorming, design, and strategy. Real-time collaboration with AI superpowers built right in.
              </p>
              <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <button onClick={() => { setShowAuth(true); setAuthMode('register'); }} className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-slate-100 transform hover:-translate-y-1 transition-all">Start Drawing Free</button>
                <button onClick={() => setCurrentSlide(1)} className="px-8 py-4 rounded-xl glass font-semibold text-lg hover:bg-white/10 transition-colors flex items-center gap-2"><span>▶</span> Watch Demo</button>
              </div>
              <div className="flex items-center gap-6 pt-8 border-t border-slate-800/50 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex -space-x-3">
                  {['Felix', 'Aneka', 'Bob'].map(seed => (
                    <img key={seed} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} className="w-10 h-10 rounded-full border-2 border-[#0f172a]" alt="User" />
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-[#0f172a] bg-slate-800 flex items-center justify-center text-xs font-bold">+2k</div>
                </div>
                <div className="text-sm text-slate-500"><span className="text-white font-bold">4.9/5</span> from 10,000+ teams</div>
              </div>
            </div>
            <div className="relative animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-3xl opacity-30 blur-2xl animate-pulse"></div>
              <div className="glass-card rounded-2xl p-2 relative overflow-hidden h-[500px] hover:shadow-2xl hover:shadow-purple-500/20 transition-all border border-white/10">
                <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="h-6 w-32 bg-white/5 rounded mx-auto"></div>
                </div>
                <canvas ref={canvasRef} width="600" height="450" className="w-full h-full cursor-crosshair"></canvas>
                <div className="absolute top-20 right-10 p-2 glass rounded-lg flex gap-2 animate-float">
                  <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">✎</div>
                  <div className="w-8 h-8 bg-slate-700/50 rounded"></div>
                  <div className="w-8 h-8 bg-slate-700/50 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer animate-bounce" onClick={() => setCurrentSlide(1)}>
            <span className="text-xs text-slate-500 uppercase tracking-widest">Explore</span>
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        {/* SLIDE 1: FEATURES */}
        <div className={`slide flex items-center justify-center ${currentSlide === 1 ? 'active' : currentSlide > 1 ? 'prev' : ''}`}>
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">Everything you need to <span className="gradient-text">ship faster</span></h2>
              <p className="text-lg text-slate-400">Collaborate from anywhere, on any device. We've handled the complexity so you can focus on the creativity.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: '⚡', title: 'Real-time Sync', desc: "Changes propagate instantly. Whether you're in Tokyo or New York, you're looking at the same board.", color: 'purple' },
                { icon: '🤖', title: 'AI Copilot', desc: "Let AI generate templates, summarize sticky notes, and even clean up your messy sketches.", color: 'cyan' },
                { icon: '🔒', title: 'Enterprise Ready', desc: "SSO, SCIM, and advanced permissions control. We keep your intellectual property safe.", color: 'orange' },
              ].map((card, i) => (
                <div key={i} className="glass-card p-8 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer">
                  <div className={`w-14 h-14 rounded-xl bg-${card.color}-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>{card.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SLIDE 2: CTA */}
        <div className={`slide flex items-center justify-center ${currentSlide === 2 ? 'active' : ''}`}>
          <div className="container mx-auto px-6 text-center relative z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent blur-3xl -z-10"></div>
            <h2 className="text-5xl lg:text-7xl font-bold mb-8">Ready to get started?</h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">Join over 100,000 creative teams shipping better products with CollabCanvas.</p>
            <button onClick={() => { setShowAuth(true); setAuthMode('register'); }} className="px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 text-xl font-bold shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all">Create Free Account</button>
            <p className="mt-6 text-sm text-slate-500">No credit card required • Free forever plan available</p>
          </div>
        </div>
      </main>

      {/* Side Dots */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4">
        {[0, 1, 2].map(idx => (
          <button 
            key={idx} 
            onClick={() => setCurrentSlide(idx)} 
            className={`w-3 h-3 rounded-full transition-all shadow-lg ${currentSlide === idx ? 'bg-white' : 'bg-slate-600 hover:bg-purple-400'}`}
          ></button>
        ))}
      </div>

      {/* AUTH MODAL */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-up">
          <button onClick={() => setShowAuth(false)} className="absolute top-6 right-6 text-white/50 hover:text-white z-50">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <div className="relative w-full max-w-md h-[550px] perspective-1000">
            <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${authMode === 'register' ? 'rotate-y-180' : ''}`}>
              
              <div className="absolute inset-0 backface-hidden">
                <div className="w-full h-full glass-card rounded-2xl p-8 flex flex-col shadow-2xl bg-[#0f172a]">
                  <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl text-purple-400">👋</div>
                    <h3 className="text-2xl font-bold">Welcome Back</h3>
                    <p className="text-slate-400 text-sm">Enter your credentials to access your workspace.</p>
                  </div>
                  <form onSubmit={handleAuthSubmit} className="space-y-4 flex-1">
                    <div><label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label><input type="text" id="login-id" className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm" placeholder="user@example.com" required /></div>
                    <div><label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label><input type="password" className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm" placeholder="••••••••" required /></div>
                    <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold transition-all shadow-lg hover:shadow-purple-500/25 mt-4 disabled:opacity-70">{isLoading ? 'Signing In...' : 'Sign In'}</button>
                  </form>
                  <div className="text-center mt-6 pt-6 border-t border-slate-700/50">
                    <span className="text-slate-400 text-sm">New to CollabCanvas?</span>
                    <button onClick={() => setAuthMode('register')} className="text-purple-400 font-semibold hover:text-purple-300 ml-1 text-sm">Create an account</button>
                  </div>
                </div>
              </div>

              {/* BACK: REGISTER */}
              <div className="absolute inset-0 backface-hidden rotate-y-180">
                <div className="w-full h-full glass-card rounded-2xl p-8 flex flex-col shadow-2xl bg-[#0f172a]">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-cyan-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl text-cyan-400">🚀</div>
                    <h3 className="text-2xl font-bold">Create Account</h3>
                    <p className="text-slate-400 text-sm">Join the collaboration revolution.</p>
                  </div>
                  <form onSubmit={handleAuthSubmit} className="space-y-3 flex-1">
                    <div><label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Username</label><input type="text" id="reg-username" className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm" placeholder="cool_creator" required /></div>
                    <div><label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label><input type="email" className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm" placeholder="user@example.com" required /></div>
                    <div><label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label><input type="password" className="w-full px-4 py-3 rounded-lg premium-input text-white text-sm" placeholder="Strong password" required /></div>
                    <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold transition-all shadow-lg hover:shadow-cyan-500/25 mt-4 disabled:opacity-70">{isLoading ? 'Creating...' : 'Sign Up Free'}</button>
                  </form>
                  <div className="text-center mt-6 pt-6 border-t border-slate-700/50">
                    <span className="text-slate-400 text-sm">Already have an account?</span>
                    <button onClick={() => setAuthMode('login')} className="text-cyan-400 font-semibold hover:text-cyan-300 ml-1 text-sm">Sign In</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD OVERLAY */}
      {showDashboard && (
        <div className="fixed inset-0 z-[60] bg-[#0f172a] overflow-y-auto animate-fade-up">
          <nav className="h-20 border-b border-slate-800 flex items-center px-8 justify-between bg-slate-900/50 sticky top-0 backdrop-blur-xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative">
                <svg className="w-10 h-10 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#dash-logo-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 17L12 22L22 17" stroke="url(#dash-logo-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 12L12 17L22 12" stroke="url(#dash-logo-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><defs><linearGradient id="dash-logo-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#a855f7" /><stop offset="1" stopColor="#06b6d4" /></linearGradient></defs></svg>
              </div>
              <span className="font-bold text-lg hidden md:block">Dashboard</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-sm text-slate-400">Online</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-right hidden md:block"><div className="text-sm font-bold text-white">{userName}</div><div className="text-xs text-slate-400">Pro Plan</div></span>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} className="w-10 h-10 rounded-full border border-slate-600" alt="Avatar" />
              </div>
            </div>
          </nav>

          <div className="container mx-auto px-6 py-10 space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-800 pb-8">
              <div><h1 className="text-4xl font-bold mb-2">Good Evening! 🌙</h1><p className="text-slate-400">You have <span className="text-white font-bold">12 tasks</span> pending for this week.</p></div>
              <div className="flex gap-3"><button className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors text-sm font-medium">Import</button><button className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors text-sm font-medium flex items-center gap-2"><span>+</span> New Project</button></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🎨', val: '24', label: 'Total Projects', change: '+12%', color: 'purple' },
                { icon: '👥', val: '1,204', label: 'Active Members', change: '+5%', color: 'cyan' },
                { icon: '⚡', val: '99.9%', label: 'Server Uptime', change: '0%', color: 'orange' },
                { icon: '👁', val: '45.2k', label: 'Total Views', change: '+24%', color: 'pink' },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-2xl glass-card hover:bg-white/5 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 bg-${stat.color}-500/20 text-${stat.color}-400 rounded-lg group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">{stat.change}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.val}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><span className="w-1 h-6 bg-purple-500 rounded-full"></span> Recent Projects</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { title: 'Website Redesign 2024', user: 'Alex', time: '2 hours ago', color: 'purple' },
                  { title: 'Q1 Marketing Assets', user: 'Sarah', time: '1 day ago', color: 'cyan' },
                  { title: 'Analytics Report', user: 'Mike', time: '3 days ago', color: 'orange' },
                ].map((proj, i) => (
                  <div key={i} className={`rounded-2xl overflow-hidden glass-card cursor-pointer group border border-slate-700 hover:border-${proj.color}-500 transition-colors`}>
                    <div className="h-40 bg-slate-800 relative overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-tr from-${proj.color}-900/50 to-transparent`}></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className={`font-bold text-lg mb-1 group-hover:text-${proj.color}-400 transition-colors`}>{proj.title}</h3>
                      <p className="text-sm text-slate-500">Edited {proj.time} by <span className="text-slate-300">{proj.user}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
