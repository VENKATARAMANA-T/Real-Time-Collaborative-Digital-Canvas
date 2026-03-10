import React from 'react';

const Section = ({ title, children, className = '' }) => (
  <div className={`flex flex-col items-center border-r border-zinc-700/50 px-4 last:border-0 h-full ${className}`}>
    <div className="flex-1 flex items-center gap-1.5">{children}</div>
    <span className="text-[10px] text-zinc-500 font-medium mt-1 uppercase tracking-tighter">{title}</span>
  </div>
);

export default Section;
