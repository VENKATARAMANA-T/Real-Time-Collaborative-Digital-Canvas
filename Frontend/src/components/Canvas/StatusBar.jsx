import React from 'react';
import { MousePointer2, Maximize2, Minus, Plus } from 'lucide-react';

const StatusBar = ({ currPos, canvasSize, zoom, setZoom }) => {
  return (
    <footer className="h-8 bg-[#18181b] border-t border-zinc-800 flex items-center justify-between px-4 text-[11px] text-zinc-500 shrink-0">
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2">
          <MousePointer2 size={12} /> {Math.round(currPos.x)}, {Math.round(currPos.y)}px
        </span>
        <span className="flex items-center gap-2">
          <Maximize2 size={12} /> {canvasSize.width} × {canvasSize.height}px
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Minus 
            size={12} 
            className="cursor-pointer hover:text-white transition-colors" 
            onClick={() => setZoom(z => Math.max(z - 10, 10))} 
          />
          <div className="w-24 bg-zinc-800 h-1 rounded-full relative">
            <input
              type="range"
              min="10"
              max="500"
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="absolute h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(zoom / 500) * 100}%` }}
            />
          </div>
          <span className="w-10 font-mono text-center">{zoom}%</span>
          <Plus 
            size={12} 
            className="cursor-pointer hover:text-white transition-colors" 
            onClick={() => setZoom(z => Math.min(z + 10, 500))} 
          />
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
