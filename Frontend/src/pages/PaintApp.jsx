import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopMenu from '../components/Canvas/TopMenu';
import Toolbar from '../components/Canvas/Toolbar';
import PropertiesPanel from '../components/Canvas/PropertiesPanel';
import StatusBar from '../components/Canvas/StatusBar';
import PaintCanvas from '../components/Canvas/PaintCanvas';
import usePaintHistory from '../hooks/usePaintHistory';
import usePaintTools from '../hooks/usePaintTools';
import { canvasAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

const PaintApp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const canvasRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const tempContextRef = useRef(null);
  const textAreaRef = useRef(null);
  const workspaceRef = useRef(null);
  const mainContainerRef = useRef(null);

  const [activeCanvasId, setActiveCanvasId] = useState(id || null);
  const [canvasTitle, setCanvasTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(true);
  const [loadedPixelData, setLoadedPixelData] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [titleInput, setTitleInput] = useState('');

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

  const handleSave = async () => {
    // If no title and no active ID, show modal
    if (!activeCanvasId && !canvasTitle.trim()) {
      setShowTitleModal(true);
      return;
    }
    await performSave(canvasTitle);
  };

  const performSave = async (title) => {
    try {
      setIsSaving(true);
      setSaveMessage('Saving...');
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasRef.current.width;
      exportCanvas.height = canvasRef.current.height;
      const exportCtx = exportCanvas.getContext('2d');
      if (canvasRef.current) {
        exportCtx.drawImage(canvasRef.current, 0, 0);
      }
      if (tempCanvasRef.current) {
        exportCtx.drawImage(tempCanvasRef.current, 0, 0);
      }
      const pixelData = exportCanvas.toDataURL('image/png');

      // Generate username text badge as thumbnail
      const username = user?.username || 'User';
      const badgeCanvas = document.createElement('canvas');
      badgeCanvas.width = 400;
      badgeCanvas.height = 200;
      const badgeCtx = badgeCanvas.getContext('2d');
      badgeCtx.fillStyle = '#1d7ff2';
      badgeCtx.fillRect(0, 0, 400, 200);
      badgeCtx.fillStyle = '#ffffff';
      badgeCtx.font = 'bold 48px Arial';
      badgeCtx.textAlign = 'center';
      badgeCtx.textBaseline = 'middle';
      badgeCtx.fillText(username, 200, 100);
      const thumbnail = badgeCanvas.toDataURL('image/png');

      const payload = {
        title: title || 'Untitled Canvas',
        folderId: null, // Personal Sketches folder (update with actual ID if needed)
        data: {
          elements,
          canvasSize,
          pixelData
        },
        thumbnail
      };

      console.log('Saving canvas with payload:', payload);

      if (activeCanvasId) {
        await canvasAPI.update(activeCanvasId, payload);
      } else {
        const created = await canvasAPI.create(payload);
        if (created?._id) {
          setActiveCanvasId(created._id);
          setCanvasTitle(created.title);
          navigate(`/paint/${created._id}`, { replace: true });
        }
      }
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      setSaveMessage(error.response?.data?.message || 'Save failed');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
      setShowTitleModal(false);
    }
  };

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      setCanvasTitle(titleInput.trim());
      performSave(titleInput.trim());
    }
  };

  useEffect(() => {
    setActiveCanvasId(id || null);
  }, [id]);

  useEffect(() => {
    if (!loadedPixelData || !canvasRef.current || !contextRef.current) return;

    const img = new Image();
    img.src = loadedPixelData;
    img.onload = () => {
      if (!canvasRef.current || !contextRef.current) return;
      const ctx = contextRef.current;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
    };
  }, [loadedPixelData]);

  useEffect(() => {
    let isMounted = true;

    const loadCanvas = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      setIsLoadingCanvas(true);
      setLoadError('');

      if (!activeCanvasId) {
        if (isMounted) setIsLoadingCanvas(false);
        return;
      }

      try {
        const canvas = await canvasAPI.getById(activeCanvasId);
        if (!isMounted) return;

        const nextElements = canvas?.data?.elements || [];
        setElements(nextElements);
        if (canvas?.data?.canvasSize) {
          setCanvasSize(canvas.data.canvasSize);
        }
        if (canvas?.title) {
          setCanvasTitle(canvas.title);
        }
        const serverPixelData = canvas?.data?.pixelData || null;
        setLoadedPixelData(serverPixelData);
        if (!serverPixelData && contextRef.current && canvasRef.current) {
          const ctx = contextRef.current;
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setLoadError('');

        setTimeout(() => {
          if (isMounted) saveState(nextElements);
        }, 0);
      } catch (error) {
        if (isMounted) {
          setLoadError(error.response?.data?.message || 'Failed to load canvas');
        }
      } finally {
        if (isMounted) setIsLoadingCanvas(false);
      }
    };

    loadCanvas();
    return () => {
      isMounted = false;
    };
  }, [activeCanvasId, navigate, saveState, user]);

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
        onBack={() => navigate('/dashboard')}
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

      {/* Title Modal */}
      {showTitleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-[#18181b] border border-zinc-700 rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Enter Canvas Title</h3>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. My Awesome Drawing"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowTitleModal(false)}
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleTitleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
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
