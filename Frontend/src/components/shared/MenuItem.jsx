import React from 'react';
import { ChevronRight } from 'lucide-react';

const MenuItem = ({ icon: Icon, label, shortcut, onClick, hasSubmenu, danger, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    type="button"
    className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-zinc-800 transition-colors
      ${danger ? 'text-red-400 hover:text-red-300' : 'text-zinc-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    <div className="w-5 flex items-center justify-center text-zinc-400">
      {Icon && <Icon size={16} />}
    </div>
    <span className="flex-1 text-sm">{label}</span>
    {shortcut && <span className="text-xs text-zinc-500 font-medium ml-4">{shortcut}</span>}
    {hasSubmenu && <ChevronRight size={14} className="text-zinc-500" />}
  </button>
);

export const MenuDivider = () => <div className="h-px bg-zinc-800 my-1 mx-2" />;

export default MenuItem;
