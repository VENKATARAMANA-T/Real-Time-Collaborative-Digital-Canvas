import React, { useEffect } from 'react';
import { initCanvasAnimation } from './utils';

export default function HeroSlide({ onAuthOpen, onSlideChange }) {
  useEffect(() => {
    const cleanup = initCanvasAnimation('hero-canvas');
    return cleanup;
  }, []);

  return (
    <div className="w-full h-full flex items-center relative">
      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center w-full">
        <div className="space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            v2.0 Now Available
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Where Teams <br />
            <span className="gradient-text">Create Magic</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
            The infinite canvas for brainstorming, design, and strategy. Real-time collaboration with AI superpowers
            built right in.
          </p>

          <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => onAuthOpen('register')}
              className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-slate-100 transform hover:-translate-y-1 transition-all"
            >
              Start Drawing Free
            </button>
            <button
              onClick={() => onSlideChange(1)}
              className="px-8 py-4 rounded-xl glass font-semibold text-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <span aria-hidden="true">&#9654;</span> Watch Demo
            </button>
          </div>

          <div className="flex items-center gap-6 pt-8 border-t border-slate-800/50 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex -space-x-3">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                className="w-10 h-10 rounded-full border-2 border-[#0f172a]"
                alt="User"
              />
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
                className="w-10 h-10 rounded-full border-2 border-[#0f172a]"
                alt="User"
              />
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bob"
                className="w-10 h-10 rounded-full border-2 border-[#0f172a]"
                alt="User"
              />
              <div className="w-10 h-10 rounded-full border-2 border-[#0f172a] bg-slate-800 flex items-center justify-center text-xs font-bold">
                +2k
              </div>
            </div>
            <div className="text-sm text-slate-500">
              <span className="text-white font-bold">4.9/5</span> from 10,000+ teams
            </div>
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
            <canvas id="hero-canvas" width="600" height="450" className="w-full h-full cursor-crosshair"></canvas>

            <div className="absolute top-20 right-10 p-2 glass rounded-lg flex gap-2 animate-float">
              <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </div>
              <div className="w-8 h-8 bg-slate-700/50 rounded"></div>
              <div className="w-8 h-8 bg-slate-700/50 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer animate-bounce"
        onClick={() => onSlideChange(1)}
      >
        <span className="text-xs text-slate-500 uppercase tracking-widest">Explore</span>
        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  );
}
