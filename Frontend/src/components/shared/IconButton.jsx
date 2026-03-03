import React from 'react';

const IconButton = ({ icon: Icon, active, onClick, label, disabled, title, description, tooltipAlign = 'center' }) => {
  const hAlign =
    tooltipAlign === 'left'  ? 'left-0' :
    tooltipAlign === 'right' ? 'right-0' :
    'left-1/2 -translate-x-1/2';
  const arrowAlign =
    tooltipAlign === 'left'  ? 'left-3' :
    tooltipAlign === 'right' ? 'right-3' :
    'left-1/2 -translate-x-1/2';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center p-2 rounded-lg transition-all
        ${disabled ? 'opacity-20 cursor-default' : 'text-zinc-300 hover:bg-zinc-800'}
        ${active ? 'bg-zinc-700 text-blue-400' : ''}`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />

      {/* Tooltip */}
      {(title || label) && (
        <div className={`absolute bottom-[calc(100%+8px)] z-[300] pointer-events-none
          opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100
          transition-all duration-200 origin-bottom ${hAlign}`}>
          <div className="bg-[#0f1924] border border-[#2d3a4b] rounded-xl shadow-2xl px-3 py-2 min-w-[120px] max-w-[200px]">
            <p className="text-white text-[11.5px] font-semibold leading-tight whitespace-nowrap">{title || label}</p>
            {description && <p className="text-zinc-400 text-[10.5px] leading-snug mt-0.5">{description}</p>}
          </div>
          <div className={`absolute -bottom-[5px] w-2.5 h-2.5 bg-[#0f1924] border-r border-b border-[#2d3a4b] rotate-45 ${arrowAlign}`} />
        </div>
      )}
    </button>
  );
};

export default IconButton;
