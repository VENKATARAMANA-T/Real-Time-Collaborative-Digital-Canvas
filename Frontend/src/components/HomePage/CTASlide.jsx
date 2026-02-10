import React from 'react';

export default function CTASlide({ onAuthOpen }) {
  return (
    <div className="w-full h-full flex items-center justify-center relative z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent blur-3xl -z-10"></div>
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-5xl lg:text-7xl font-bold mb-8">Ready to get started?</h2>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Join over 100,000 creative teams shipping better products with CollabCanvas.
        </p>

        <button
          onClick={() => onAuthOpen('register')}
          className="px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 text-xl font-bold shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
        >
          Create Free Account
        </button>
        <p className="mt-6 text-sm text-slate-500">No credit card required &#8226; Free forever plan available</p>
      </div>
    </div>
  );
}
