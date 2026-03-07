import React, { useState } from 'react';

const ColorPalette = ({ color, updateColor, palette, canvasBgColor, updateCanvasBgColor }) => {
  const [target, setTarget] = useState('fg'); // 'fg' for Color, 'bg' for Canvas

  const activeColor = target === 'fg' ? color : canvasBgColor;

  const handleColorChange = (newColor) => {
    if (target === 'fg') {
      updateColor(newColor);
    } else {
      updateCanvasBgColor(newColor);
    }
  };

  return (
    <div className="flex items-center gap-4 h-full mt-1">
      <div className="flex flex-col gap-1.5 min-w-[60px]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 py-0.5">
          Color
        </span>
      </div>

      <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 relative">
        <div
          className="relative w-9 h-9 rounded-lg cursor-pointer transition-all duration-300 ring-2 ring-blue-500 scale-105 z-10 shadow-lg"
          title={target === 'fg' ? 'Foreground Color' : 'Canvas Background'}
        >
          <div className="absolute inset-0 rounded-lg border-2 border-zinc-700/50 shadow-inner" style={{ backgroundColor: activeColor }} />
          <input
            type="color"
            value={activeColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-10 gap-1.5">
        {palette.map((c, i) => (
          <button
            key={i}
            onClick={() => handleColorChange(c)}
            className={`w-5 h-5 rounded-full border border-zinc-700/50 transition-all duration-200 active:scale-75 ${activeColor === c ? 'ring-2 ring-blue-500 scale-125 z-10 shadow-lg shadow-blue-500/20' : 'hover:scale-125'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;
