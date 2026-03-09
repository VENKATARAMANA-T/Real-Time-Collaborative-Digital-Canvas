import React from 'react';
import {
  Square, Circle, Triangle, Minus as LineIcon, Star,
  Pentagon, Hexagon, MessageSquare, MoveRight, Diamond
} from 'lucide-react';

const SHAPES = [
  { id: 'rect', Icon: Square, label: 'Rectangle', desc: 'Draw rectangles & squares. Hold Shift for perfect square.' },
  { id: 'circle', Icon: Circle, label: 'Ellipse', desc: 'Draw ellipses & circles. Hold Shift for perfect circle.' },
  { id: 'triangle', Icon: Triangle, label: 'Triangle', desc: 'Draw triangular shapes.' },
  { id: 'line', Icon: LineIcon, label: 'Line', desc: 'Draw straight lines between two points.' },
  { id: 'star', Icon: Star, label: 'Star', desc: 'Draw five-pointed star shapes.' },
  { id: 'pentagon', Icon: Pentagon, label: 'Pentagon', desc: 'Draw five-sided polygon shapes.' },
  { id: 'hexagon', Icon: Hexagon, label: 'Hexagon', desc: 'Draw six-sided polygon shapes.' },
  { id: 'callout', Icon: MessageSquare, label: 'Callout', desc: 'Draw speech bubble shapes for annotations.' },
  { id: 'arrow', Icon: MoveRight, label: 'Arrow', desc: 'Draw directional arrow shapes.' },
  { id: 'rhombus', Icon: Diamond, label: 'Diamond', desc: 'Draw diamond / rhombus shapes.' },
];

const ShapeBtn = ({ shape, active, onClick }) => {
  const { Icon, label, desc } = shape;
  return (
    <div className="relative group z-10 hover:z-[301]">
      <button
        onClick={onClick}
        className={`p-1.5 rounded flex items-center justify-center transition-all duration-150
          ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
      >
        <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
      </button>

      {/* Tooltip — renders BELOW the button */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] z-[300]
        opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100
        transition-all duration-200 origin-top">
        {/* Arrow pointing UP */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[5px] w-2.5 h-2.5
          bg-[#111827] border-l border-t border-[#374151] rotate-45" />
        <div className="bg-gradient-to-b from-[#111827] to-[#0d1117] border border-[#374151]/80 rounded-xl px-3.5 py-2.5 min-w-[160px] w-max max-w-[220px]" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(55,65,81,0.3)' }}>
          <p className="text-[#e5e7eb] text-[11.5px] font-semibold leading-tight tracking-wide">{label}</p>
          <p className="text-[#9ca3af] text-[10.5px] leading-snug mt-1 whitespace-normal break-words">{desc}</p>
        </div>
      </div>
    </div>
  );
};

const ShapesPanel = ({ tool, handleToolChange }) => (
  <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-900/50 rounded-lg border border-zinc-700 overflow-visible">
    {SHAPES.map(shape => (
      <ShapeBtn
        key={shape.id}
        shape={shape}
        active={tool === shape.id}
        onClick={() => handleToolChange(shape.id)}
      />
    ))}
  </div>
);

export default ShapesPanel;
