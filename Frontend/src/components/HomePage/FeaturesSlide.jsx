import React from 'react';

export default function FeaturesSlide() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Everything you need to <span className="gradient-text">ship faster</span>
          </h2>
          <p className="text-lg text-slate-400">
            Collaborate from anywhere, on any device. We've handled the complexity so you can focus on the creativity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer">
            <div
              className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform"
              aria-hidden="true"
            >
              &#9889;
            </div>
            <h3 className="text-xl font-bold mb-3">Real-time Sync</h3>
            <p className="text-slate-400 leading-relaxed">
              Changes propagate instantly. Whether you're in Tokyo or New York, you're looking at the same board.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer">
            <div
              className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform"
              aria-hidden="true"
            >
              &#129302;
            </div>
            <h3 className="text-xl font-bold mb-3">AI Copilot</h3>
            <p className="text-slate-400 leading-relaxed">
              Let AI generate templates, summarize sticky notes, and even clean up your messy sketches.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer">
            <div
              className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform"
              aria-hidden="true"
            >
              &#128274;
            </div>
            <h3 className="text-xl font-bold mb-3">Enterprise Ready</h3>
            <p className="text-slate-400 leading-relaxed">
              SSO, SCIM, and advanced permissions control. We keep your intellectual property safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
