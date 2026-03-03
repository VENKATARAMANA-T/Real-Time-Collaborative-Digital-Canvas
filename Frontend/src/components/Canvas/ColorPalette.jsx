import React from 'react';

// Friendly name map for common palette colors
const COLOR_NAMES = {
  '#000000': 'Black',       '#ffffff': 'White',       '#ef4444': 'Red',
  '#f97316': 'Orange',      '#f59e0b': 'Amber',       '#eab308': 'Yellow',
  '#84cc16': 'Lime',        '#22c55e': 'Green',       '#10b981': 'Emerald',
  '#14b8a6': 'Teal',        '#06b6d4': 'Cyan',        '#3b82f6': 'Blue',
  '#6366f1': 'Indigo',      '#8b5cf6': 'Violet',      '#a855f7': 'Purple',
  '#ec4899': 'Pink',        '#f43f5e': 'Rose',        '#64748b': 'Slate',
  '#6b7280': 'Gray',        '#78716c': 'Stone',       '#292524': 'Dark Brown',
  '#1c1917': 'Near Black',  '#fafafa': 'Near White',  '#fde68a': 'Light Yellow',
};

const getColorLabel = (hex) => {
  const key = hex.toLowerCase();
  return COLOR_NAMES[key] || hex.toUpperCase();
};

const ColorSwatch = ({ c, active, onClick }) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`w-5 h-5 rounded-full border border-zinc-700 transition-all duration-150 active:scale-90
        ${active ? 'ring-2 ring-blue-500 scale-110 z-10 shadow-md' : 'hover:scale-110 hover:border-zinc-500'}`}
      style={{ backgroundColor: c }}
    />
    {/* Swatch tooltip */}
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+6px)] z-[300]
      opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100
      transition-all duration-150 origin-bottom">
      <div className="bg-[#0f1924] border border-[#2d3a4b] rounded-lg shadow-xl px-2.5 py-1.5 flex flex-col items-center gap-0.5">
        <div className="w-5 h-5 rounded-md border border-white/10 shadow-sm" style={{ backgroundColor: c }} />
        <p className="text-white text-[10.5px] font-semibold whitespace-nowrap leading-tight">{getColorLabel(c)}</p>
        <p className="text-zinc-400 text-[9.5px] font-mono whitespace-nowrap">{c.toUpperCase()}</p>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2 h-2
        bg-[#0f1924] border-r border-b border-[#2d3a4b] rotate-45" />
    </div>
  </div>
);

const ColorPalette = ({ color, updateColor, palette }) => (
  <div className="flex items-center gap-4 h-full mt-1">
    {/* Active color picker */}
    <div className="relative group cursor-pointer">
      <div className="w-10 h-10 rounded-full bg-zinc-800 border-[3px] border-zinc-600 flex items-center justify-center shadow-inner group-hover:border-[#137fec] transition-colors duration-200">
        <div className="w-6 h-6 rounded-full shadow-sm transition-colors duration-200" style={{ backgroundColor: color }} />
      </div>
      <input
        type="color"
        value={color}
        onChange={(e) => updateColor(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      {/* Picker tooltip */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] z-[300]
        opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100
        transition-all duration-200 origin-bottom">
        <div className="bg-[#0f1924] border border-[#2d3a4b] rounded-xl shadow-2xl px-3 py-2 w-40">
          <p className="text-white text-[11.5px] font-semibold">Custom Color</p>
          <p className="text-zinc-400 text-[10.5px] mt-0.5">Click to open color picker</p>
          <p className="text-[#137fec] text-[10px] font-mono mt-1">{color.toUpperCase()}</p>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5
          bg-[#0f1924] border-r border-b border-[#2d3a4b] rotate-45" />
      </div>
    </div>

    <div className="w-[1px] h-8 bg-zinc-800/50" />

    <div className="grid grid-cols-10 gap-1.5">
      {palette.map((c, i) => (
        <ColorSwatch key={i} c={c} active={color === c} onClick={() => updateColor(c)} />
      ))}
    </div>
  </div>
);

export default ColorPalette;
