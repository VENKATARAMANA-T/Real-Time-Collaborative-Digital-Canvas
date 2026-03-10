import React from 'react';
import {
  Pencil, Eraser, Type as TextIcon, MousePointer2, PaintBucket as FillIcon, Hand
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
  setShowGridlines,
  snapToGrid,
  setSnapToGrid,
  gridColor,
  setGridColor,
  setPanOffset,
  canvasBgColor,
  updateCanvasBgColor,
  showCheckerboard,
  toggleCheckerboard
}) => {

  return (
    <header className="bg-gradient-to-r from-[#18181b]/95 via-[#18181b]/90 to-[#09090b]/95 border-b border-zinc-800/40 p-3 flex items-stretch gap-2 shrink-0 overflow-x-auto no-scrollbar relative backdrop-blur-3xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] z-50">
      <Section title="Tools">
        <div className="grid grid-cols-3 gap-1 h-full">
          <IconButton icon={Pencil} active={tool === 'pencil'} onClick={() => handleToolChange('pencil')} />
          <IconButton icon={Eraser} active={tool === 'eraser'} onClick={() => handleToolChange('eraser')} />
          <IconButton icon={TextIcon} active={tool === 'text'} onClick={() => handleToolChange('text')} />
          <IconButton icon={MousePointer2} active={tool === 'select'} onClick={() => handleToolChange('select')} />
          <IconButton icon={Hand} active={tool === 'hand'} onClick={() => handleToolChange('hand')} />
          <IconButton icon={FillIcon} active={tool === 'bucket'} onClick={() => handleToolChange('bucket')} />
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
        <ColorPalette
          color={color}
          updateColor={updateColor}
          palette={palette}
          canvasBgColor={canvasBgColor}
          updateCanvasBgColor={updateCanvasBgColor}
        />
      </Section>

      <Section title="View">
        <ViewControls
          zoom={zoom}
          setZoom={setZoom}
          showGridlines={showGridlines}
          setShowGridlines={setShowGridlines}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          gridColor={gridColor}
          setGridColor={setGridColor}
          setPanOffset={setPanOffset}
          showCheckerboard={showCheckerboard}
          toggleCheckerboard={toggleCheckerboard}
        />
      </Section>
    </header >
  );
};

export default Toolbar;
