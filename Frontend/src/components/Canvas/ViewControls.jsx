import React from 'react';
import { Minus, Plus, Maximize, Grid3X3 } from 'lucide-react';

const ViewControls = ({ zoom, setZoom, showGridlines, setShowGridlines }) => {
  return (
    <div className="flex items-center gap-2 h-full">
      <button
        onClick={() => setZoom(z => Math.max(z - 10, 10))}
        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
        title="Zoom Out"
      >
        <Minus size={16} />
      </button>

      <div className="flex flex-col items-center justify-center w-20">
        <input
          type="range"
          min="10"
          max="500"
          value={zoom}
          onChange={(e) => setZoom(parseInt(e.target.value))}
          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-[10px] text-zinc-400 mt-1 font-mono">{zoom}%</span>
      </div>

      <button
        onClick={() => setZoom(z => Math.min(z + 10, 500))}
        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
        title="Zoom In"
      >
        <Plus size={16} />
      </button>

      <div className="w-[1px] h-6 bg-zinc-800 mx-1"></div>

      <button
        onClick={() => setZoom(100)}
        className="flex flex-col items-center p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
        title="Fit to Screen"
      >
        <Maximize size={16} />
      </button>

      <div className="w-[1px] h-6 bg-zinc-800 mx-1"></div>

      <button
        onClick={() => setShowGridlines(!showGridlines)}
        className={`flex flex-col items-center p-1 rounded transition-colors ${showGridlines ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
        title="Toggle Gridlines (Ctrl+G)"
      >
        <Grid3X3 size={16} />
      </button>
    </div>
  );
};

export default ViewControls;
