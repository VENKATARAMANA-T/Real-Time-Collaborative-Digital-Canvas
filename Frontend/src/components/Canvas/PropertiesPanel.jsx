import React from 'react';
import { Settings } from 'lucide-react';

const PropertiesPanel = ({ strokeWidth, setStrokeWidth }) => {
  return (
    <aside className="w-16 flex flex-col items-center py-8 gap-12 bg-zinc-900/30 border-r border-zinc-800/50 backdrop-blur-xl shrink-0">
      <div className="flex flex-col items-center gap-4 group">
        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
          <Settings size={18} />
        </div>
        <div className="h-48 flex flex-col items-center gap-2">
          <input
            type="range"
            orient="vertical"
            min="1"
            max="100"
            value={strokeWidth}
            onChange={e => setStrokeWidth(parseInt(e.target.value))}
            className="appearance-none w-1 h-32 bg-zinc-700 rounded-full accent-blue-500 cursor-pointer"
            style={{ WebkitAppearance: 'slider-vertical' }}
          />
          <span className="text-[10px] font-mono text-zinc-500">{strokeWidth}px</span>
        </div>
      </div>
    </aside>
  );
};

export default PropertiesPanel;
