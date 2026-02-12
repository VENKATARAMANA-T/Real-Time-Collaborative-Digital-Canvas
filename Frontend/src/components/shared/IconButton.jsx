import React from 'react';

const IconButton = ({ icon: Icon, active, onClick, label, disabled, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    type="button"
    className={`group flex flex-col items-center p-2 rounded-lg transition-all 
      ${disabled ? 'opacity-20 cursor-default' : 'text-zinc-300 hover:bg-zinc-800'}
      ${active ? 'bg-zinc-700 text-blue-400' : ''}`}
    title={title || label}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
  </button>
);

export default IconButton;
