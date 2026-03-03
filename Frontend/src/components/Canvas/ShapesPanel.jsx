import React from 'react';
import {
  Square, Circle, Triangle, Minus as LineIcon, Star,
  Pentagon, Hexagon, MessageSquare, MoveRight, Diamond
} from 'lucide-react';

const SHAPES = [
  { id: 'rect',     Icon: Square,       label: 'Rectangle',  desc: 'Draw rectangles & squares. Hold Shift for perfect square.' },
  { id: 'circle',   Icon: Circle,       label: 'Ellipse',    desc: 'Draw ellipses & circles. Hold Shift for perfect circle.' },
  { id: 'triangle', Icon: Triangle,     label: 'Triangle',   desc: 'Draw triangular shapes.' },
  { id: 'line',     Icon: LineIcon,     label: 'Line',       desc: 'Draw straight lines between two points.' },
  { id: 'star',     Icon: Star,         label: 'Star',       desc: 'Draw five-pointed star shapes.' },
  { id: 'pentagon', Icon: Pentagon,     label: 'Pentagon',   desc: 'Draw five-sided polygon shapes.' },
  { id: 'hexagon',  Icon: Hexagon,      label: 'Hexagon',    desc: 'Draw six-sided polygon shapes.' },
  { id: 'callout',  Icon: MessageSquare,label: 'Callout',    desc: 'Draw speech bubble shapes for annotations.' },
  { id: 'arrow',    Icon: MoveRight,    label: 'Arrow',      desc: 'Draw directional arrow shapes.' },
  { id: 'rhombus',  Icon: Diamond,      label: 'Diamond',    desc: 'Draw diamond / rhombus shapes.' },
];

const ShapeBtn = ({ shape, active, onClick }) => {
  const { Icon, label, desc } = shape;
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`p-1.5 rounded flex items-center justify-center transition-all duration-150
          ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}
      >
        <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
      </button>

      {/* Tooltip */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] z-[300]
        opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100
        transition-all duration-200 origin-bottom">
        <div className="bg-[#0f1924] border border-[#2d3a4b] rounded-xl shadow-2xl px-3 py-2 w-44">
          <p className="text-white text-[11.5px] font-semibold leading-tight">{label}</p>
          <p className="text-zinc-400 text-[10.5px] leading-snug mt-0.5">{desc}</p>
        </div>
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5
          bg-[#0f1924] border-r border-b border-[#2d3a4b] rotate-45" />
      </div>
    </div>
  );
};

const ShapesPanel = ({ tool, handleToolChange }) => (
  <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-900/50 rounded-lg border border-zinc-700">
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
