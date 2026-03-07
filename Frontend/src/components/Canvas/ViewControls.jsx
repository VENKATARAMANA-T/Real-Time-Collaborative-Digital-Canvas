import { Minus, Plus, Maximize, Grid3X3 } from 'lucide-react';

const ViewControls = ({
  zoom,
  setZoom,
  showGridlines,
  setShowGridlines,
  snapToGrid,
  setSnapToGrid,
  gridColor,
  setGridColor,
  setPanOffset,
  showCheckerboard,
  toggleCheckerboard
}) => {
  const handleResetView = () => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
  };

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
        onClick={handleResetView}
        className="group relative flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-zinc-800/40 text-zinc-400 hover:text-white hover:bg-zinc-700/60 transition-all border border-zinc-700/30 hover:border-zinc-500/50 shadow-sm active:scale-95"
        title="Reset View (100% & Center)"
      >
        <Maximize size={18} className="group-hover:scale-110 transition-transform duration-200" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 w-1 h-1 rounded-full shadow-[0_0_8px_rgba(37,99,235,1)]" />
      </button>

      <div className="w-[1px] h-6 bg-zinc-800 mx-1"></div>

      <div className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/50">
        <button
          onClick={() => setShowGridlines(!showGridlines)}
          className={`flex flex-col items-center p-1.5 rounded-md transition-all ${showGridlines ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
          title="Toggle Gridlines (Ctrl+G)"
        >
          <Grid3X3 size={16} />
        </button>

        {showGridlines && (
          <div className="flex items-center gap-1 pl-1 border-l border-zinc-700/50 animate-in fade-in slide-in-from-left-2 duration-200">
            {/* Grid color picker */}
            <input
              type="color"
              value={(() => {
                if (!gridColor || gridColor === 'transparent') return '#a1a1aa';
                if (gridColor.startsWith('#')) return gridColor.slice(0, 7);
                if (gridColor.startsWith('rgb')) {
                  const m = gridColor.match(/[\d.]+/g);
                  if (m && m.length >= 3) {
                    const r = parseInt(m[0]).toString(16).padStart(2, '0');
                    const g = parseInt(m[1]).toString(16).padStart(2, '0');
                    const b = parseInt(m[2]).toString(16).padStart(2, '0');
                    return `#${r}${g}${b}`;
                  }
                }
                return '#a1a1aa';
              })()}
              onChange={(e) => setGridColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer bg-transparent border-none appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-zinc-600"
              title="Grid Color"
            />

          </div>
        )}
      </div>



    </div>
  );
};

export default ViewControls;
