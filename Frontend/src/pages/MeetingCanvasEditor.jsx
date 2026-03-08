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
  const canvasCompRef = useRef(null);
  const fileInputRef = useRef(null);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileMenuRef = useRef(null);

  const [activeTool, setActiveTool] = useState('selector');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [canvasTitle, setCanvasTitle] = useState('Meeting Canvas');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [navigatingToDashboard, setNavigatingToDashboard] = useState(false);
  const [lastSavedElements, setLastSavedElements] = useState(null);

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
          setLastSavedElements(loadedElements);
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
      setLastSavedElements(elements);

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

  const handleDashboardClick = () => {
    const hasUnsavedChanges = elements !== lastSavedElements;
    if (hasUnsavedChanges) {
      setShowSavePrompt(true);
    } else {
      goToDashboard();
    }
  };

  const goToDashboard = () => {
    setShowSavePrompt(false);
    setNavigatingToDashboard(true);
    setTimeout(() => navigate('/dashboard'), 600);
  };

  const handleSaveAndGo = async () => {
    await handleSave();
    goToDashboard();
  };

  const handleShare = async () => {
    if (!canvasId) return;
    await handleSave();
    try {
      const { shareToken } = await canvasAPI.generateShareToken(canvasId);
      const link = `${window.location.origin}/shared/${shareToken}`;
      setShareLink(link);
      setShareCopied(false);
      setShowShareModal(true);
    } catch (err) {
      console.error('Failed to generate share link:', err);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
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

  // Close file menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target)) {
        setFileMenuOpen(false);
      }
    };
    if (fileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fileMenuOpen]);

  // --- Export: calls the Canvas component's exportCanvas via ref ---
  const handleExport = () => {
    setFileMenuOpen(false);
    if (canvasCompRef.current?.exportCanvas) {
      canvasCompRef.current.exportCanvas();
    }
  };

  // --- Import: open file dialog, read image, add as element ---
  const handleImportClick = () => {
    setFileMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept images only
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new window.Image();
      img.onload = () => {
        // Scale image to fit nicely on canvas (max 800px wide/tall)
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }

        const newElement = {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'image',
          src: dataUrl,
          x: 100,
          y: 100,
          width: w,
          height: h,
          style: {}
        };

        saveToHistory();
        setElements((prev) => [...prev, newElement]);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // Reset the input so the same file can be re-imported
    e.target.value = '';
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
            onClick={handleDashboardClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Back to Dashboard"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="h-6 w-[1px] bg-white/10"></div>

          {/* File dropdown menu */}
          <div className="relative" ref={fileMenuRef}>
            <button
              onClick={() => setFileMenuOpen((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            >
              File
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            {fileMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl py-1.5 z-[100]">
                <button
                  onClick={handleImportClick}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  Import Image
                </button>
                <button
                  onClick={handleExport}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Export as PNG
                </button>
                <div className="border-t border-white/10 my-1"></div>
                <button
                  onClick={() => { setFileMenuOpen(false); handleSave(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save
                </button>
              </div>
            )}
          </div>

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

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImportFile}
      />

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
          onImportImage={handleImportClick}
          onExportCanvas={handleExport}
          onShare={handleShare}
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
          ref={canvasCompRef}
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

      {/* Navigating overlay */}
      {navigatingToDashboard && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0a0a0c]/90 backdrop-blur-md transition-opacity">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400 text-sm font-medium">Returning to dashboard...</p>
          </div>
        </div>
      )}

      {/* Save / Don't Save Modal */}
      {showSavePrompt && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl">
            <button
              onClick={() => setShowSavePrompt(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white">Unsaved Changes</h3>
              <p className="text-slate-400 text-sm mt-2">You have unsaved changes on this canvas. Would you like to save before leaving?</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSaveAndGo}
                className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-500 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Save & Go to Dashboard
              </button>
              <button
                onClick={goToDashboard}
                className="w-full rounded-lg border border-white/10 py-3 font-bold text-zinc-300 transition-all hover:bg-white/5"
              >
                Don't Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white">Share Canvas</h3>
              <p className="text-slate-400 text-sm mt-2">Anyone with this link can view your canvas (read-only). They'll need an account to access it.</p>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Shareable Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-lg bg-[#1e293b] border border-white/10 text-white text-sm font-mono truncate"
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopyShareLink}
                  className={`px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                    shareCopied
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {shareCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Note:</span> Recipients must be registered and logged in to view this canvas. They can download a copy to their Personal Sketches folder to edit.
              </p>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 rounded-lg border border-white/10 py-3 font-bold text-white transition-all hover:bg-white/5"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingCanvasEditor;
