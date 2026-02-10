import React, { useState, useRef, useEffect, useCallback } from 'react';
import TopMenu from '../components/Canvas/TopMenu';
import Toolbar from '../components/Canvas/Toolbar';
import PropertiesPanel from '../components/Canvas/PropertiesPanel';
import StatusBar from '../components/Canvas/StatusBar';
import PaintCanvas from '../components/Canvas/PaintCanvas';
import usePaintHistory from '../hooks/usePaintHistory';
import usePaintTools from '../hooks/usePaintTools';

const PaintApp = () => {
  const canvasRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const tempContextRef = useRef(null);
  const textAreaRef = useRef(null);
  const workspaceRef = useRef(null);
  const mainContainerRef = useRef(null);

  const [zoom, setZoom] = useState(100);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [gridSize, setGridSize] = useState(20);
  const [currPos, setCurrPos] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState([]);

  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [showGridlines, setShowGridlines] = useState(false);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [alwaysShowToolbar, setAlwaysShowToolbar] = useState(true);

  const {
    tool,
    color,
    strokeWidth,
    setStrokeWidth,
    opacity,
    fillMode,
    setFillMode,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    clipboard,
    setClipboard,
    textFormat,
    handleToolChange,
    updateColor: baseUpdateColor,
    updateTextProp: baseUpdateTextProp,
    toggleTextProp: baseToggleTextProp
  } = usePaintTools();

  const {
    history,
    historyStep,
    saveState,
    undo: baseUndo,
    redo: baseRedo
  } = usePaintHistory(canvasRef, elements);

  const palette = [
    '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
    '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'
  ];

  const fontFamilies = ['Arial', 'Calibri', 'Verdana', 'Times New Roman', 'Georgia', 'Courier New', 'Brush Script MT', 'Comic Sans MS'];
  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

  const isTextToolActive = tool === 'text' || (selectedId && elements.find(e => e.id === selectedId)?.type === 'text');

  useEffect(() => {
    if (editingId && textAreaRef.current) {
      textAreaRef.current.focus();
      const val = textAreaRef.current.value;
      textAreaRef.current.setSelectionRange(val.length, val.length);
    }
  }, [editingId]);

  useEffect(() => {
    const closeMenus = () => {
      setIsFileMenuOpen(false);
      setIsViewMenuOpen(false);
      setIsEditMenuOpen(false);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  const handleCopy = useCallback(() => {
    if (selectedId) {
      const el = elements.find(e => e.id === selectedId);
      if (el) setClipboard(JSON.parse(JSON.stringify(el)));
    }
  }, [selectedId, elements, setClipboard]);

  const handleCut = useCallback(() => {
    if (selectedId) {
      const el = elements.find(e => e.id === selectedId);
      if (el) {
        setClipboard(JSON.parse(JSON.stringify(el)));
        const nextElements = elements.filter(e => e.id !== selectedId);
        setElements(nextElements);
        setSelectedId(null);
        saveState(nextElements);
      }
    }
  }, [selectedId, elements, setClipboard, setSelectedId, saveState]);

  const handlePaste = useCallback(() => {
    if (clipboard) {
      const newId = Date.now();
      const newEl = {
        ...clipboard,
        id: newId,
        x: clipboard.x + 20,
        y: clipboard.y + 20
      };
      const nextElements = [...elements, newEl];
      setElements(nextElements);
      setSelectedId(newId);
      saveState(nextElements);
    }
  }, [clipboard, elements, setSelectedId, saveState]);

  const updateColor = (newColor) => {
    baseUpdateColor(newColor, elements, setElements, saveState);
  };

  const updateTextProp = (updates) => {
    baseUpdateTextProp(updates, selectedId, setElements, saveState);
  };

  const toggleTextProp = (prop) => {
    baseToggleTextProp(prop, selectedId, setElements, saveState);
  };

  const undo = () => {
    baseUndo(contextRef, setElements, setSelectedId, setEditingId);
  };

  const redo = () => {
    baseRedo(contextRef, setElements, setSelectedId, setEditingId);
  };

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleSave = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasRef.current.width;
    exportCanvas.height = canvasRef.current.height;
    const ctx = exportCanvas.getContext('2d');
    ctx.drawImage(canvasRef.current, 0, 0);
    const link = document.createElement('a');
    link.download = 'modern-paint-pro.png';
    link.href = exportCanvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!editingId) {
        if (e.ctrlKey && e.key === 'r') { e.preventDefault(); setShowRulers(prev => !prev); }
        if (e.ctrlKey && e.key === 'g') { e.preventDefault(); setShowGridlines(prev => !prev); }
        if (e.key === 'F11') { e.preventDefault(); handleFullScreen(); }
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
          const nextElements = elements.filter(el => el.id !== selectedId);
          setElements(nextElements);
          setSelectedId(null);
          saveState(nextElements);
        }
        if (e.metaKey || e.ctrlKey) {
          if (e.key === 'c') { e.preventDefault(); handleCopy(); }
          else if (e.key === 'x') { e.preventDefault(); handleCut(); }
          else if (e.key === 'v') { e.preventDefault(); handlePaste(); }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId, elements, saveState, handleCopy, handleCut, handlePaste]);

  return (
    <div ref={workspaceRef} className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-200 overflow-hidden font-sans select-none">
      <TopMenu
        isFileMenuOpen={isFileMenuOpen}
        setIsFileMenuOpen={setIsFileMenuOpen}
        isEditMenuOpen={isEditMenuOpen}
        setIsEditMenuOpen={setIsEditMenuOpen}
        isViewMenuOpen={isViewMenuOpen}
        setIsViewMenuOpen={setIsViewMenuOpen}
        handleSave={handleSave}
        handleCopy={handleCopy}
        handleCut={handleCut}
        handlePaste={handlePaste}
        clipboard={clipboard}
        selectedId={selectedId}
        showRulers={showRulers}
        setShowRulers={setShowRulers}
        showGridlines={showGridlines}
        setShowGridlines={setShowGridlines}
        gridSize={gridSize}
        setGridSize={setGridSize}
        showStatusBar={showStatusBar}
        setShowStatusBar={setShowStatusBar}
        alwaysShowToolbar={alwaysShowToolbar}
        setAlwaysShowToolbar={setAlwaysShowToolbar}
        handleFullScreen={handleFullScreen}
        undo={undo}
        redo={redo}
        historyStep={historyStep}
        historyLength={history.length}
      />

      {alwaysShowToolbar && (
        <Toolbar
          tool={tool}
          handleToolChange={handleToolChange}
          fillMode={fillMode}
          setFillMode={setFillMode}
          isTextToolActive={isTextToolActive}
          textFormat={textFormat}
          updateTextProp={updateTextProp}
          toggleTextProp={toggleTextProp}
          fontFamilies={fontFamilies}
          fontSizes={fontSizes}
          color={color}
          updateColor={updateColor}
          palette={palette}
          zoom={zoom}
          setZoom={setZoom}
          showGridlines={showGridlines}
          setShowGridlines={setShowGridlines}
        />
      )}

      <main className="flex-1 flex relative overflow-hidden bg-[#09090b]">
        <PropertiesPanel strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth} />

        <div ref={mainContainerRef} className="flex-1 overflow-hidden bg-zinc-950 flex items-center justify-center relative">
          <PaintCanvas
            canvasRef={canvasRef}
            tempCanvasRef={tempCanvasRef}
            contextRef={contextRef}
            tempContextRef={tempContextRef}
            textAreaRef={textAreaRef}
            mainContainerRef={mainContainerRef}
            canvasSize={canvasSize}
            setCanvasSize={setCanvasSize}
            zoom={zoom}
            setZoom={setZoom}
            showRulers={showRulers}
            showGridlines={showGridlines}
            gridSize={gridSize}
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            opacity={opacity}
            fillMode={fillMode}
            elements={elements}
            setElements={setElements}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            editingId={editingId}
            setEditingId={setEditingId}
            textFormat={textFormat}
            saveState={saveState}
          />
        </div>
      </main>

      {showStatusBar && (
        <StatusBar currPos={currPos} canvasSize={canvasSize} zoom={zoom} setZoom={setZoom} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        html, body { margin: 0; padding: 0; overflow: hidden; height: 100vh; width: 100vw; background-color: #0c0c0e; }
        body { font-family: 'Inter', sans-serif; color: #a1a1aa; }

        nav button, 
        header .grid-cols-3 button, 
        header .grid-cols-5 button {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          cursor: pointer;
          display: flex !important;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.2s ease;
        }

        header .grid-cols-3 button {
          border-radius: 12px !important;
          width: 42px !important;
          height: 42px !important;
          color: #e4e4e7 !important;
        }
        header .grid-cols-3 button:hover {
          background-color: rgba(39, 39, 42, 0.5) !important;
        }
        header .grid-cols-3 .bg-zinc-700 {
          background-color: #27272a !important; 
          color: #3b82f6 !important; 
        }

        header .grid-cols-5 button {
          border-radius: 10px !important;
          width: 38px !important;
          height: 38px !important;
          color: #e4e4e7 !important;
        }
        header .grid-cols-5 .bg-blue-600 {
          background-color: #2563eb !important; 
          border: 2px solid white !important; 
          color: white !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }

        nav button {
          border-radius: 8px !important;
          padding: 6px 16px !important;
          background-color: #18181b !important;
          color: white !important;
        }

        header .flex.items-center.gap-2 button {
          background-color: #ffffff !important;
          color: #18181b !important;
          border-radius: 6px !important;
          width: 30px !important;
          height: 30px !important;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        canvas { image-rendering: pixelated; }
      `}</style>
    </div>
  );
};

export default PaintApp;
