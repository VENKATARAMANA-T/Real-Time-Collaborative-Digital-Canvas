import React from 'react';

const IconButton = ({ icon: Icon, active, onClick, label, disabled, title, description, tooltipAlign = 'center' }) => {
  const hAlign =
    tooltipAlign === 'left' ? 'left-0' :
      tooltipAlign === 'right' ? 'right-0' :
        'left-1/2 -translate-x-1/2';
  const arrowAlign =
    tooltipAlign === 'left' ? 'left-3' :
      tooltipAlign === 'right' ? 'right-3' :
        'left-1/2 -translate-x-1/2';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative z-10 hover:z-[301] flex flex-col items-center p-2 rounded-lg transition-all
        ${disabled ? 'opacity-20 cursor-default' : 'text-zinc-300 hover:bg-zinc-800'}
        ${active ? 'bg-zinc-700 text-blue-400' : ''}`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />

      {/* Tooltip — renders BELOW the button */}
      {(title || label) && (
        <div className={`absolute top-[calc(100%+10px)] z-[300] pointer-events-none
          opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100
          transition-all duration-200 origin-top ${hAlign}`}>
          {/* Arrow pointing UP */}
          <div className={`absolute -top-[5px] w-2.5 h-2.5 bg-[#111827] border-l border-t border-[#374151] rotate-45 ${arrowAlign}`} />
          <div className="bg-gradient-to-b from-[#111827] to-[#0d1117] border border-[#374151]/80 rounded-xl px-3.5 py-2.5 min-w-[130px] w-max max-w-[250px]" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(55,65,81,0.3)' }}>
            <p className="text-[#e5e7eb] text-[11.5px] font-semibold leading-tight tracking-wide">{title || label}</p>
            {description && <p className="text-[#9ca3af] text-[10.5px] leading-snug mt-1 whitespace-normal break-words">{description}</p>}
          </div>
        </div>
      )}
    </button>
  );
};

export default IconButton;
