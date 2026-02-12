import React from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, Square, ChevronDown
} from 'lucide-react';
import IconButton from '../shared/IconButton';

const TextFormatting = ({ textFormat, updateTextProp, toggleTextProp, fontFamilies, fontSizes }) => {
  return (
    <div className="flex items-center gap-2 h-full">
      <div className="relative group">
        <select
          value={textFormat.font}
          onChange={(e) => updateTextProp({ font: e.target.value })}
          className="w-32 bg-zinc-800 text-xs text-zinc-200 border-none rounded px-2 py-1.5 outline-none appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
        >
          {fontFamilies.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
      </div>

      <div className="relative flex items-center bg-zinc-800 rounded px-1 py-0.5 border border-transparent focus-within:border-zinc-600">
        <input
          type="number"
          value={textFormat.size}
          onChange={(e) => updateTextProp({ size: parseInt(e.target.value) || 12 })}
          className="w-8 bg-transparent text-xs text-center outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none text-zinc-200"
        />
        <div className="relative w-4 h-full flex items-center justify-center">
          <ChevronDown size={10} className="text-zinc-500 pointer-events-none" />
          <select
            onChange={(e) => updateTextProp({ size: parseInt(e.target.value) })}
            className="absolute inset-0 opacity-0 cursor-pointer"
            value={textFormat.size}
          >
            {fontSizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="w-[1px] h-8 bg-zinc-700 mx-1" />
      <IconButton icon={Bold} active={textFormat.bold} onClick={() => toggleTextProp('bold')} />
      <IconButton icon={Italic} active={textFormat.italic} onClick={() => toggleTextProp('italic')} />
      <IconButton icon={Underline} active={textFormat.underline} onClick={() => toggleTextProp('underline')} />
      <IconButton icon={Strikethrough} active={textFormat.strikethrough} onClick={() => toggleTextProp('strikethrough')} />
      <div className="w-[1px] h-8 bg-zinc-700 mx-1" />
      <IconButton icon={AlignLeft} active={textFormat.align === 'left'} onClick={() => updateTextProp({ align: 'left' })} />
      <IconButton icon={AlignCenter} active={textFormat.align === 'center'} onClick={() => updateTextProp({ align: 'center' })} />
      <IconButton icon={AlignRight} active={textFormat.align === 'right'} onClick={() => updateTextProp({ align: 'right' })} />
      <div className="w-[1px] h-8 bg-zinc-700 mx-1" />
      <button
        onClick={() => toggleTextProp('background')}
        className={`flex flex-col items-center p-2 rounded-lg gap-1 ${textFormat.background ? 'bg-zinc-700 text-blue-400' : 'text-zinc-400 hover:bg-zinc-800'}`}
        type="button"
      >
        <Square size={16} fill={textFormat.background ? "currentColor" : "none"} />
        <span className="text-[9px]">Fill</span>
      </button>
    </div>
  );
};

export default TextFormatting;
