import React from 'react';
import { MousePointer2, Maximize2, Minus, Plus } from 'lucide-react';

const StatusBar = ({ currPos, canvasSize, zoom, setZoom }) => {
  return (
    <footer className="h-8 bg-blue-600 border-t border-blue-500/50 flex items-center justify-between px-4 text-[11px] text-blue-50 shrink-0 shadow-[0_-4px_12px_rgba(37,99,235,0.2)]">
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2 font-medium">
          <MousePointer2 size={12} className="text-blue-200" /> {Math.round(currPos.x)}, {Math.round(currPos.y)}px
        </span>
        <span className="flex items-center gap-2 font-medium" title="Virtual Canvas Extents">
          <Maximize2 size={12} className="text-blue-200" /> {canvasSize.width} × {canvasSize.height}px
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Minus
            size={12}
            className="cursor-pointer hover:text-white transition-colors"
            onClick={() => setZoom(z => Math.max(z - 10, 10))}
          />
          <div className="w-24 bg-blue-800/50 h-1 rounded-full relative">
            <input
              type="range"
              min="10"
              max="500"
              value={zoom}
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="absolute h-full bg-white rounded-full transition-all shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              style={{ width: `${(zoom / 500) * 100}%` }}
            />
          </div>
          <span className="w-10 font-mono text-center font-bold">{zoom}%</span>
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
