import React from 'react';
import {
  Pencil, Eraser, Type as TextIcon, MousePointer2, Square as FillIcon
} from 'lucide-react';
import IconButton from '../shared/IconButton';
import Section from '../shared/Section';
import TextFormatting from './TextFormatting';
import ShapesPanel from './ShapesPanel';
import ColorPalette from './ColorPalette';
import ViewControls from './ViewControls';

const Toolbar = ({
  tool,
  handleToolChange,
  fillMode,
  setFillMode,
  isTextToolActive,
  textFormat,
  updateTextProp,
  toggleTextProp,
  fontFamilies,
  fontSizes,
  color,
  updateColor,
  palette,
  zoom,
  setZoom,
  showGridlines,
  setShowGridlines
}) => {
  return (
    <header className="bg-[#18181b] border-b border-zinc-800 p-2 flex items-stretch gap-1 shrink-0 overflow-x-auto no-scrollbar">
      <Section title="Tools">
        <div className="grid grid-cols-3 gap-1 h-full">
          <IconButton icon={Pencil} active={tool === 'pencil'} onClick={() => handleToolChange('pencil')} />
          <IconButton icon={Eraser} active={tool === 'eraser'} onClick={() => handleToolChange('eraser')} />
          <IconButton icon={TextIcon} active={tool === 'text'} onClick={() => handleToolChange('text')} />
          <IconButton icon={MousePointer2} active={tool === 'select'} onClick={() => handleToolChange('select')} />
          <IconButton
            icon={fillMode ? FillIcon : FillIcon}
            active={fillMode}
            onClick={() => setFillMode(!fillMode)}
            label="Fill Mode"
          />
        </div>
      </Section>

      {isTextToolActive && (
        <Section title="Text Formatting">
          <TextFormatting
            textFormat={textFormat}
            updateTextProp={updateTextProp}
            toggleTextProp={toggleTextProp}
            fontFamilies={fontFamilies}
            fontSizes={fontSizes}
          />
        </Section>
      )}

      {!isTextToolActive && (
        <Section title="Shapes">
          <ShapesPanel tool={tool} handleToolChange={handleToolChange} />
        </Section>
      )}

      <Section title="Colors" className="!items-start">
        <ColorPalette color={color} updateColor={updateColor} palette={palette} />
      </Section>

      <Section title="View">
        <ViewControls
          zoom={zoom}
          setZoom={setZoom}
          showGridlines={showGridlines}
          setShowGridlines={setShowGridlines}
        />
      </Section>
    </header>
  );
};

export default Toolbar;
