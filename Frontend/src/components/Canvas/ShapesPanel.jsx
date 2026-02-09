import React from 'react';
import {
  Square, Circle, Triangle, Minus as LineIcon, Star,
  Pentagon, Hexagon, MessageSquare, MoveRight, Diamond
} from 'lucide-react';

const ShapesPanel = ({ tool, handleToolChange }) => {
  return (
    <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-900/50 rounded-lg border border-zinc-700">
      <button onClick={() => handleToolChange('rect')} className={`p-1.5 rounded ${tool === 'rect' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}>
        <Square size={18} />
      </button>
      <button onClick={() => handleToolChange('circle')} className={`p-1.5 rounded ${tool === 'circle' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}>
        <Circle size={18} />
      </button>
      <button onClick={() => handleToolChange('triangle')} className={`p-1.5 rounded ${tool === 'triangle' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}>
        <Triangle size={18} />
      </button>
      <button onClick={() => handleToolChange('line')} className={`p-1.5 rounded ${tool === 'line' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}>
        <LineIcon size={18} />
      </button>
      <button onClick={() => handleToolChange('star')} className={`p-1.5 rounded ${tool === 'star' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}>
        <Star size={18} />
      </button>
      <button onClick={() => handleToolChange('pentagon')} className={`p-1.5 rounded ${tool === 'pentagon' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}>
        <Pentagon size={18} />
      </button>
      <button onClick={() => handleToolChange('hexagon')} className={`p-1.5 rounded ${tool === 'hexagon' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}>
        <Hexagon size={18} />
      </button>
      <button onClick={() => handleToolChange('callout')} className={`p-1.5 rounded ${tool === 'callout' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}>
        <MessageSquare size={18} />
      </button>
      <button onClick={() => handleToolChange('arrow')} className={`p-1.5 rounded ${tool === 'arrow' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}>
        <MoveRight size={18} />
      </button>
      <button onClick={() => handleToolChange('rhombus')} className={`p-1.5 rounded ${tool === 'rhombus' ? 'bg-blue-600' : 'hover:bg-zinc-800'}`}>
        <Diamond size={18} />
      </button>
    </div>
  );
};

export default ShapesPanel;
