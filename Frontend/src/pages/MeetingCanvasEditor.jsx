import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../pages/meeting.css';
import Toolbar from '../components/Meeting/Toolbar';
import Canvas from '../components/Meeting/Canvas';
import ToolSettings from '../components/Meeting/ToolSettings';
import { useAuth } from '../context/AuthContext.jsx';
import { canvasAPI } from '../services/api.js';

function MeetingCanvasEditor() {
  const navigate = useNavigate();
  const { id: canvasId } = useParams();
  const { user } = useAuth();

  const [activeTool, setActiveTool] = useState('selector');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [canvasTitle, setCanvasTitle] = useState('Meeting Canvas');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Canvas Elements & History
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Persistent Color Palettes
  const [customBrushColors, setCustomBrushColors] = useState([
    '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#a855f7', '#ffffff'
  ]);
  const [customFillColors, setCustomFillColors] = useState([
    '#ffffff', '#94a3b8', '#0f172a', '#ef4444', '#f97316', '#fbbf24',
    '#10b981', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7'
  ]);
  const [customNoteColors, setCustomNoteColors] = useState([
    '#fef08a', '#fbcfe8', '#bae6fd', '#bbf7d0', '#fed7aa'
  ]);

  // Drawing tool settings
  const [settings, setSettings] = useState({
    brushSize: 5,
    brushOpacity: 100,
    brushColor: '#3b82f6',
    brushStyle: 'edit',
    brushType: 'solid',
    eraserSize: 20,
    fillColor: 'transparent',
    fillOpacity: 100,
    strokeWidth: 4,
    strokeOpacity: 100,
    strokeStyle: 'solid',
    activeShape: 'rectangle',
    noteFillColor: '#fef08a',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'center'
  });

  // Set dark background
  useEffect(() => {
    const previousBackground = document.body.style.backgroundColor;
    const previousColor = document.body.style.color;
    document.body.style.backgroundColor = '#0a0a0c';
    document.body.style.color = '#cbd5e1';
    return () => {
      document.body.style.backgroundColor = previousBackground;
      document.body.style.color = previousColor;
    };
  }, []);

  // Load canvas data
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (!canvasId) {
      navigate('/dashboard');
      return;
    }

    const loadCanvas = async () => {
      setIsLoading(true);
      try {
        const canvas = await canvasAPI.getById(canvasId);
        if (canvas) {
          setCanvasTitle(canvas.title || 'Meeting Canvas');
          const loadedElements = canvas?.data?.elements || [];
          setElements(loadedElements);
        }
      } catch (error) {
        console.error('Failed to load meeting canvas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCanvas();
  }, [canvasId, user, navigate]);

  // Auto-save every 30 seconds
  const autoSaveTimerRef = useRef(null);
  useEffect(() => {
    if (!canvasId || elements.length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true);
    }, 30000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [elements, canvasId]);

  // Save function
  const handleSave = async (silent = false) => {
    if (isSaving || !canvasId) return;
    try {
      setIsSaving(true);
      if (!silent) setSaveMessage('Saving...');

      const payload = {
        title: canvasTitle,
        data: { elements },
        thumbnail: ''
      };
      await canvasAPI.update(canvasId, payload);

      if (!silent) {
        setSaveMessage('Saved!');
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (error) {
      console.error('Save failed:', error);
      if (!silent) {
        setSaveMessage('Save failed');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Undo/Redo
  const saveToHistory = useCallback(() => {
    setHistory((prev) => [...prev, elements]);
    setRedoStack([]);
  }, [elements]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setRedoStack((prev) => [elements, ...prev]);
    setElements(previousState);
    setHistory((prev) => prev.slice(0, -1));
  }, [elements, history]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setHistory((prev) => [...prev, elements]);
    setElements(nextState);
    setRedoStack((prev) => prev.slice(1));
  }, [elements, redoStack]);

  // Tool change logic
  const handleToolChange = (tool) => {
    if (activeTool === tool) {
      setIsSettingsVisible(!isSettingsVisible);
    } else {
      setActiveTool(tool);
      if (tool !== 'selector') {
        setIsSettingsVisible(true);
      } else {
        setIsSettingsVisible(false);
      }
    }
  };

  const handleCanvasClick = () => {
    setIsSettingsVisible(false);
  };

  const handleSelectionChange = (id) => {
    setSelectedElementId(id);
    if (id) {
      const el = elements.find((e) => e.id === id);
      if (el) {
        setSettings((prev) => ({ ...prev, ...el.style }));
      }
    } else {
      setIsSettingsVisible(false);
    }
  };

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    if (selectedElementId) {
      setElements((prevElements) =>
        prevElements.map((el) => {
          if (el.id === selectedElementId) {
            return { ...el, style: { ...el.style, ...newSettings } };
          }
          return el;
        })
      );
    }
  };

  const getEffectiveSettingsTool = () => {
    if (activeTool !== 'selector') return activeTool;
    if (selectedElementId) {
      const el = elements.find((e) => e.id === selectedElementId);
      if (el) {
        if (el.type === 'sticky-note') return 'sticky-note';
        if (el.type === 'shape') return 'shapes';
        if (el.type === 'freehand') return 'brush';
      }
    }
    return activeTool;
  };

  const settingsTool = getEffectiveSettingsTool();

  const handleElementsChange = useCallback((newElements) => {
    setElements(newElements);
  }, []);

  // Guard: loading
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0c] text-slate-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0c] text-slate-300 font-sans selection:bg-primary/30 selection:text-white">
      {/* Simple Header - No meeting options */}
      <header className="h-14 border-b border-border-dark flex items-center justify-between px-6 bg-background-dark z-50 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Back to Dashboard"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-[18px]">videocam</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white truncate max-w-[300px]">{canvasTitle}</span>
              <span className="text-[10px] text-amber-400/80 font-medium uppercase tracking-wider">Meeting Canvas</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              saveMessage === 'Saved!' ? 'text-emerald-400 bg-emerald-500/10' : 
              saveMessage === 'Saving...' ? 'text-blue-400 bg-blue-500/10' : 
              'text-red-400 bg-red-500/10'
            }`}>
              {saveMessage}
            </span>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Main Area: Toolbar + Canvas + ToolSettings */}
      <main className="flex-1 flex overflow-hidden relative">
        <Toolbar
          activeTool={activeTool}
          setActiveTool={handleToolChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.length > 0}
          canRedo={redoStack.length > 0}
          canEdit={true}
        />

        <ToolSettings
          tool={settingsTool}
          key={settingsTool}
          visible={isSettingsVisible}
          settings={settings}
          updateSettings={updateSettings}
          customColors={customBrushColors}
          setCustomColors={setCustomBrushColors}
          customFillColors={customFillColors}
          setCustomFillColors={setCustomFillColors}
          customNoteColors={customNoteColors}
          setCustomNoteColors={setCustomNoteColors}
        />

        <Canvas
          activeTool={activeTool}
          canEdit={true}
          onCursorMove={() => {}}
          onCursorLeave={() => {}}
          cursors={null}
          settings={settings}
          elements={elements}
          onElementsChange={handleElementsChange}
          onActionStart={saveToHistory}
          onCanvasClick={handleCanvasClick}
          selectedElementId={selectedElementId}
          onSelectElement={handleSelectionChange}
        />
      </main>
    </div>
  );
}

export default MeetingCanvasEditor;
