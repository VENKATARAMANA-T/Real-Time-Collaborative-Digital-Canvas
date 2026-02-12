import React from 'react';

export default function Navbar({ onSlideChange, onAuthOpen }) {
  return (
    <nav className="fixed top-0 w-full z-50 h-[80px] flex items-center border-b border-white/5 bg-[#0f172a]/85 backdrop-blur-xl shadow-lg shadow-purple-900/10">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSlideChange(0)}>
          <div className="w-10 h-10 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-cyan-400 rounded-lg blur opacity-40 group-hover:opacity-100 transition-opacity"></div>
            <svg
              className="w-10 h-10 relative z-10 text-white drop-shadow-lg transform group-hover:rotate-180 transition-transform duration-700"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="url(#logo-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="url(#logo-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="url(#logo-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="logo-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a855f7" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-100 group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
            CollabCanvas
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => onSlideChange(0)}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          >
            Home
          </button>
          <button
            onClick={() => onSlideChange(1)}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          >
            Features
          </button>
          <button
            onClick={() => onSlideChange(2)}
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          >
            Start Free
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onAuthOpen('login')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => onAuthOpen('register')}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 font-medium text-sm text-white shadow-lg shadow-purple-500/25 glow-button"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
