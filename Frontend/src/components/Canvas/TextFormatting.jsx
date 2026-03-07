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
            className="absolute inset-0 opacity-0 cursor-pointer bg-zinc-800 text-zinc-200"
            value={textFormat.size}
          >
            {fontSizes.map(s => <option key={s} value={s} className="bg-zinc-800 text-zinc-200">{s}</option>)}
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
    </div>
  );
};

export default TextFormatting;
