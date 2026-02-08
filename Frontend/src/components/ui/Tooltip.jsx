import React from 'react';
import { Info } from 'lucide-react';

export default function ContextualTooltip({ isDarkMode, title, description }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 z-50">
      <div className={`p-3 rounded-lg shadow-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          <div><p className="font-bold text-xs">{title}</p><p className="text-[10px] opacity-80">{description}</p></div>
        </div>
      </div>
    </div>
  );
}