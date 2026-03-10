import React from 'react';

export default function FeaturesSlide() {
  return (
    <div className="w-full h-full flex items-center justify-center overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 py-10 lg:py-0">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Everything you need to <span className="gradient-text">ship faster</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            Collaborate from anywhere, on any device. We've handled the complexity so you can focus on the creativity.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          <div className="glass-card p-6 md:p-8 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer">
            <div
              className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
              aria-hidden="true"
            >
              <svg className="w-7 h-7 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Real-time Sync</h3>
            <p className="text-slate-400 leading-relaxed">
              Every stroke, shape, and edit appears instantly for all collaborators. Draw together seamlessly — no refresh, no lag, just pure simultaneous creation.
            </p>
          </div>

          <div className="glass-card p-6 md:p-8 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer">
            <div
              className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
              aria-hidden="true"
            >
              {/* AI Agent: robot/brain-circuit icon */}
              <svg className="w-7 h-7 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {/* Head outline */}
                <rect x="5" y="4" width="14" height="12" rx="4" strokeLinecap="round" strokeLinejoin="round" />
                {/* Eyes */}
                <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none" />
                {/* Mouth / neural bar */}
                <path d="M9 13h6" strokeLinecap="round" />
                {/* Antenna */}
                <path d="M12 4V2" strokeLinecap="round" />
                <circle cx="12" cy="1.5" r="0.8" fill="currentColor" stroke="none" />
                {/* Neck + body connector */}
                <path d="M9 16v2a3 3 0 006 0v-2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Side ears / signal waves */}
                <path d="M5 8.5C3.5 8.5 3 9.5 3 10.5S3.5 12.5 5 12.5" strokeLinecap="round" />
                <path d="M19 8.5c1.5 0 2 1 2 2S20.5 12.5 19 12.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">AI Agents</h3>
            <p className="text-slate-400 leading-relaxed">
              Chat with an AI agent that understands your canvas. Ask it to draw shapes, apply colours, clear the board, or guide you through features — all in plain language.
            </p>
          </div>

          <div className="glass-card p-6 md:p-8 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer sm:col-span-2 md:col-span-1">
            <div
              className="w-14 h-14 rounded-xl bg-teal-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
              aria-hidden="true"
            >
              <svg className="w-7 h-7 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="18" cy="5" r="3" strokeLinecap="round" />
                <circle cx="6" cy="12" r="3" strokeLinecap="round" />
                <circle cx="18" cy="19" r="3" strokeLinecap="round" />
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Share & Export</h3>
            <p className="text-slate-400 leading-relaxed">
              Share a live canvas link with anyone, organise boards into folders, and export your work as PNG, SVG, or PDF with a single click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
