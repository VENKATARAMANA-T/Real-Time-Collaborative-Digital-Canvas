import React from 'react';
import { Sparkles } from 'lucide-react';

const PropertiesPanel = ({
  strokeWidth,
  setStrokeWidth,
  canvasBgColor,
  setCanvasBgColor,
  activeLayerId,
  layers,
  updateLayerBgColor,
  aiEnabled,
  setAiEnabled
}) => {
  const activeLayer = layers.find(l => l.id === activeLayerId);

  return (
    <aside className="w-20 flex flex-col items-center py-8 gap-10 bg-gradient-to-b from-[#18181b]/90 to-[#09090b]/95 border-r border-zinc-800/40 backdrop-blur-2xl shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.3)] z-50">
      <div className="flex flex-col items-center gap-6 group">
        <div className="h-48 flex flex-col items-center gap-3">
          <div className="relative w-10 flex-1 flex items-center justify-center">
            <input
              type="range"
              min="1"
              max="200"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
              aria-label="Pencil size"
              className="w-40 h-1.5 -rotate-90 rounded-full accent-blue-500 cursor-pointer bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
            />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-bold font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded tracking-tighter tabular-nums">
              {strokeWidth}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Size</span>
          </div>
        </div>

        <div className="w-12 h-[1px] bg-zinc-800/50" />

        <button
          onClick={() => setAiEnabled(!aiEnabled)}
          className={`relative group/ai w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all duration-300 ${aiEnabled
              ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105'
              : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/80'
            }`}
          title={aiEnabled ? 'AI Shape Correction: ON' : 'AI Shape Correction: OFF'}
        >
          <Sparkles size={18} className={`${aiEnabled ? 'animate-pulse' : 'group-hover/ai:scale-110 transition-transform'}`} />
          <div className="text-[8px] font-black mt-1 tracking-tighter">AI</div>
          {aiEnabled && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-[#18181b] animate-bounce" />
          )}
        </button>
      </div>

      <div className="flex-1" />
    </aside>
  );
};

export default PropertiesPanel;
