import React from 'react';

export default function NavDots({ currentSlide, onSlideChange }) {
  const dots = [0, 1, 2];

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4">
      {dots.map((dot) => (
        <button
          key={dot}
          onClick={() => onSlideChange(dot)}
          className={`w-3 h-3 rounded-full transition-all shadow-lg nav-dot ${
            currentSlide === dot ? 'bg-white' : 'bg-slate-600 hover:bg-purple-400'
          }`}
        ></button>
      ))}
    </div>
  );
}
