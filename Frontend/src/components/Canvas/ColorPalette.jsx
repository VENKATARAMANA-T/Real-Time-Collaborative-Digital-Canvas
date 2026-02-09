import React from 'react';
import { ChevronDown } from 'lucide-react';

const ColorPalette = ({ color, updateColor, palette }) => {
  return (
    <div className="flex items-center gap-4 h-full mt-1">
      <div className="relative group cursor-pointer" title="Click to choose custom color">
        <div className="w-10 h-10 rounded-full bg-zinc-800 border-[3px] border-zinc-600 flex items-center justify-center shadow-inner group-hover:border-zinc-500 transition-colors">
          <div className="w-6 h-6 rounded-full shadow-sm transition-colors duration-200" style={{ backgroundColor: color }} />
        </div>
        <input
          type="color"
          value={color}
          onChange={(e) => updateColor(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="w-[1px] h-8 bg-zinc-800/50" />

      <div className="grid grid-cols-10 gap-1.5">
        {palette.map((c, i) => (
          <button
            key={i}
            onClick={() => updateColor(c)}
            className={`w-5 h-5 rounded-full border border-zinc-700 transition-transform active:scale-90 ${color === c ? 'ring-2 ring-blue-500 scale-110 z-10' : 'hover:scale-110'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPalette;
