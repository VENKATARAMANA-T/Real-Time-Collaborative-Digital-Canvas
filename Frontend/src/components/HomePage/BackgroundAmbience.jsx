import React, { useEffect } from 'react';
import { initParticles } from './utils';

export default function BackgroundAmbience() {
  useEffect(() => {
    const cleanup = initParticles('particles');
    return cleanup;
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-blob"></div>
      <div
        className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] animate-blob"
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className="absolute -bottom-32 left-1/3 w-96 h-96 bg-orange-600/20 rounded-full blur-[100px] animate-blob"
        style={{ animationDelay: '4s' }}
      ></div>
      <div id="particles" className="absolute inset-0"></div>
    </div>
  );
}
