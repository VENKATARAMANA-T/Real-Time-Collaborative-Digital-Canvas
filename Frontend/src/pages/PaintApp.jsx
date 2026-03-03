import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import TopMenu from '../components/Canvas/TopMenu';
import Toolbar from '../components/Canvas/Toolbar';
import PropertiesPanel from '../components/Canvas/PropertiesPanel';
import StatusBar from '../components/Canvas/StatusBar';
import PaintCanvas from '../components/Canvas/PaintCanvas';
import usePaintHistory from '../hooks/usePaintHistory';
import usePaintTools from '../hooks/usePaintTools';
import { canvasAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import BotWidget from '../components/Bot/BotWidget';
import HelpOptionsButton from '../components/shared/HelpOptionsButton';

/* ─── Walkthrough tooltip card (reusable) ─── */
const PaintWalkthroughCard = ({ step, totalSteps, title, description, onBack, onNext, onClose, isLast }) => (
  <div
    data-walkthrough-card
    style={{
      background: 'linear-gradient(135deg, #101922 0%, #1a242f 100%)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      boxShadow: '0 25px 60px -12px rgba(0,0,0,0.55), 0 0 0 1px rgba(19,127,236,0.12)',
    }}
    className="rounded-2xl overflow-hidden w-[370px] border border-[#2d3a4b]/60 wt-step-enter"
  >
    {/* Header */}
    <div className="flex items-center justify-between px-6 pt-5 pb-3">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #137fec 0%, #1065c0 100%)',
            boxShadow: '0 4px 14px rgba(19,127,236,0.45)',
          }}
        >
          {step + 1}
        </div>
        <h3 className="text-[15px] font-bold text-white leading-tight tracking-tight">{title}</h3>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 ml-2 flex-shrink-0"
      >
        <span className="material-icons text-[18px]">close</span>
      </button>
    </div>

    {/* Body */}
    <div className="px-6 pb-4 pt-1">
      <p className="text-[13.5px] text-white/60 leading-relaxed text-center">{description}</p>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between px-6 pb-5">
      {/* Progress dots */}
      <div className="flex gap-[6px] items-center">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: i === step ? 20 : 7,
              height: 7,
              background: i === step
                ? 'linear-gradient(90deg, #137fec, #3b9af5)'
                : 'rgba(255,255,255,0.15)',
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {step > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onBack(); }}
            className="flex items-center gap-1 px-4 py-[7px] text-[13px] font-semibold text-white/60 hover:text-white border border-[#2d3a4b] hover:border-white/25 rounded-lg transition-all duration-200"
          >
            <span className="material-icons text-[16px]">chevron_left</span>
            Back
          </button>
        )}
        {isLast ? (
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="flex items-center gap-[6px] px-5 py-[7px] text-[13px] font-bold text-white rounded-lg transition-all duration-200 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #137fec 0%, #1065c0 100%)',
              boxShadow: '0 4px 14px rgba(19,127,236,0.35)',
            }}
          >
            🎨 Finish
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="flex items-center gap-1 px-5 py-[7px] text-[13px] font-bold text-white rounded-lg transition-all duration-200 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #137fec 0%, #1065c0 100%)',
              boxShadow: '0 4px 14px rgba(19,127,236,0.35)',
            }}
          >
            Next
            <span className="material-icons text-[16px]">chevron_right</span>
          </button>
        )}
      </div>
    </div>
  </div>
);

const PaintWalkthroughOverlay = ({ step, setStep, onClose }) => {
  const [rect, setRect] = useState(null);

  const steps = [
    {
      title: "Navigation & Menus",
      description: "Access file operations, editing tools, and view options from the top menu bar.",
      elementId: "paint-topmenu"
    },
    {
      title: "Painting Tools",
      description: "Select from Pencil, Brush, Eraser, Shapes and more to create your artwork.",
      elementId: "paint-toolbar"
    },
    {
      title: "Tool Properties",
      description: "Customize your active tool — adjust stroke width, opacity, and fill settings here.",
      elementId: "paint-properties"
    },
    {
      title: "Status & Information",
      description: "View cursor coordinates, canvas size, and adjust zoom levels for precision.",
      elementId: "paint-statusbar"
    },
    {
      title: "Ready to paint! 🎨",
      description: "You're all set to use the canvas editor. Click the Help icon at any time to re-run this guide.",
      elementId: null
    }
  ];

  const currentStep = steps[step];
  const hasElement = !!currentStep.elementId;

  useEffect(() => {
    setRect(null);
    if (!currentStep.elementId) return;

    const updateRect = () => {
      const el = document.getElementById(currentStep.elementId);
      if (el) {
        const bounds = el.getBoundingClientRect();
        setRect({ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height });
      }
    };

    updateRect();
    const timer = setTimeout(updateRect, 80);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('resize', updateRect);
      clearTimeout(timer);
    };
  }, [step]);

  // ── Final step: centered floating card ──
  if (!hasElement) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
        <PaintWalkthroughCard
          key={step}
          step={step}
          totalSteps={steps.length}
          title={currentStep.title}
          description={currentStep.description}
          onBack={() => setStep(step - 1)}
          onNext={() => {}}
          onClose={onClose}
          isLast={true}
        />
      </div>
    );
  }

  // ── Waiting for rect ──
  if (!rect) {
    return <div className="fixed inset-0 z-[200] bg-black/70 pointer-events-auto" />;
  }

  // ── Position tooltip ──
  const TOOLTIP_H = 230;
  const GAP = 16;
  const fitsBelow = rect.top + rect.height + GAP + TOOLTIP_H <= window.innerHeight;
  const rawTop = fitsBelow ? rect.top + rect.height + GAP : rect.top - TOOLTIP_H - GAP;
  const tooltipTop = Math.max(12, Math.min(window.innerHeight - TOOLTIP_H - 12, rawTop));
  const tooltipLeft = Math.max(12, Math.min(window.innerWidth - 386, rect.left + rect.width / 2 - 185));

  const PAD = 8;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Spotlight cutout with purple glow border */}
      <div
        className="absolute rounded-xl"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
          border: '2px solid rgba(19,127,236,0.6)',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.7), 0 0 30px 4px rgba(19,127,236,0.25), inset 0 0 20px 2px rgba(19,127,236,0.08)',
          borderRadius: 14,
        }}
      />

      {/* Tooltip card */}
      <div
        className="absolute pointer-events-auto"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <PaintWalkthroughCard
          key={step}
          step={step}
          totalSteps={steps.length}
          title={currentStep.title}
          description={currentStep.description}
          onBack={() => setStep(step - 1)}
          onNext={() => setStep(step + 1)}
          onClose={onClose}
          isLast={false}
        />
      </div>
    </div>
  );
};

const PaintApp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  // Support ?title= query param for offline new-canvas creation
  const queryTitle = new URLSearchParams(location.search).get('title') || '';
  const canvasRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const tempContextRef = useRef(null);
  const textAreaRef = useRef(null);
  const workspaceRef = useRef(null);
  const mainContainerRef = useRef(null);

  const [activeCanvasId, setActiveCanvasId] = useState(id || null);
  const [canvasTitle, setCanvasTitle] = useState(queryTitle);
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
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);

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

  // Bot Actions Integration — 15 agentic action types
  const handleBotAction = useCallback((action) => {
    // Map bot JSON → canvas element schema: w/h/color/fill(bool)/opacity
    const buildShape = (s, idOffset = 0) => {
      const hasFill    = s.fill && s.fill !== 'transparent';
      const fillHex    = hasFill ? s.fill : null;
      const strokeHex  = s.stroke || null;
      // fillColor/strokeColor are separate fields for dual-color rendering
      return {
        id: Date.now() + idOffset + Math.floor(Math.random() * 1000),
        type: s.shape || s.type || 'rect',
        x: s.x ?? 700,
        y: s.y ?? 300,
        w: s.width  ?? s.w ?? 160,
        h: s.height ?? s.h ?? 120,
        color:       fillHex || strokeHex || color, // legacy fallback
        fillColor:   fillHex   || undefined,        // interior color (undefined = use color)
        strokeColor: strokeHex || undefined,        // border color (undefined = use color)
        fill:  hasFill,                             // boolean: true = filled shape
        strokeWidth: s.strokeWidth ?? strokeWidth,
        opacity: s.opacity ?? 1,
        rotation: s.rotation ?? 0,
      };
    };

    const buildText = (s) => ({
      id: Date.now() + Math.floor(Math.random() * 1000),
      type: 'text',
      text: s.text || 'Text',
      x: s.x ?? 700,
      y: s.y ?? 300,
      w: s.width  ?? s.w ?? 300,
      h: s.height ?? s.h ?? 60,
      color: s.color || s.fill || color,
      font: s.fontFamily || s.font || 'Arial',
      fontSize: s.fontSize || 28,
      strokeWidth,
      opacity: 1,
    });

    switch (action.type) {
      // ── Canvas-level ─────────────────────────────────────────
      case 'CLEAR_CANVAS':
        setElements([]);
        saveState([]);
        break;

      case 'FILL_BACKGROUND': {
        if (action.color) {
          const bg = buildShape({
            type: 'rect', x: 0, y: 0,
            width: canvasSize.width, height: canvasSize.height,
            fill: action.color, stroke: action.color,
          });
          // Remove any existing full-canvas background rects so stacking doesn't hide the new one
          const withoutOldBg = elements.filter(e =>
            !(e.type === 'rect' && e.x <= 0 && e.y <= 0 &&
              e.w >= canvasSize.width * 0.9 && e.h >= canvasSize.height * 0.9)
          );
          const next = [bg, ...withoutOldBg];
          setElements(next); saveState(next);
        }
        break;
      }

      case 'UNDO':
        baseUndo(contextRef, setElements, setSelectedId, setEditingId);
        break;

      case 'REDO':
        baseRedo(contextRef, setElements, setSelectedId, setEditingId);
        break;

      // ── Tool / style ──────────────────────────────────────────
      case 'CHANGE_TOOL':
        if (action.tool) handleToolChange(action.tool);
        break;

      case 'CHANGE_COLOR':
        if (action.color) baseUpdateColor(action.color, elements, setElements, saveState);
        break;

      case 'SET_STROKE_WIDTH':
        if (action.width !== undefined) setStrokeWidth(Math.max(1, Math.min(50, action.width)));
        break;

      case 'SET_FILL_MODE':
        setFillMode(action.enabled !== undefined ? Boolean(action.enabled) : !fillMode);
        break;

      case 'SET_ZOOM':
        if (action.zoom !== undefined) setZoom(Math.max(10, Math.min(500, action.zoom)));
        break;

      // ── Selection & editing ───────────────────────────────────
      case 'SELECT_LAST':
        if (elements.length > 0) setSelectedId(elements[elements.length - 1].id);
        break;

      case 'DELETE_SELECTED':
        if (selectedId) {
          const next = elements.filter(e => e.id !== selectedId);
          setElements(next); setSelectedId(null); saveState(next);
        }
        break;

      case 'MOVE_SELECTED':
        if (selectedId) {
          const next = elements.map(e =>
            e.id === selectedId
              ? { ...e, x: e.x + (action.dx || 0), y: e.y + (action.dy || 0) }
              : e
          );
          setElements(next); saveState(next);
        }
        break;

      case 'RESIZE_SELECTED':
        if (selectedId) {
          const next = elements.map(e =>
            e.id === selectedId
              ? { ...e,
                  w: action.width  ?? e.w,
                  h: action.height ?? e.h }
              : e
          );
          setElements(next); saveState(next);
        }
        break;

      case 'DUPLICATE_SELECTED':
        if (selectedId) {
          const orig = elements.find(e => e.id === selectedId);
          if (orig) {
            const dup = { ...orig, id: Date.now(),
              x: orig.x + (action.offsetX ?? 30),
              y: orig.y + (action.offsetY ?? 30) };
            const next = [...elements, dup];
            setElements(next); setSelectedId(dup.id); saveState(next);
          }
        }
        break;

      // ── Drawing ───────────────────────────────────────────────
      case 'DRAW_SHAPE': {
        const newShape = buildShape(action);
        const next = [...elements, newShape];
        setElements(next); setSelectedId(newShape.id); saveState(next);
        break;
      }

      case 'DRAW_MULTIPLE': {
        if (Array.isArray(action.shapes) && action.shapes.length > 0) {
          const newShapes = action.shapes.map((s, i) => buildShape(s, i * 10));
          const next = [...elements, ...newShapes];
          setElements(next); setSelectedId(newShapes[newShapes.length - 1].id); saveState(next);
        }
        break;
      }

      case 'ARRANGE_GRID': {
        const { shape = 'rect', rows = 3, cols = 3,
          x = 200, y = 150, width = 80, height = 80,
          colSpacing = 20, rowSpacing = 20,
          fill, stroke, strokeWidth: sw } = action;
        const newShapes = [];
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const hasFill = fill && fill !== 'transparent';
            const fillHex = hasFill ? fill : null;
            newShapes.push({
              id: Date.now() + r * 1000 + c,
              type: shape,
              x: x + c * (width + colSpacing),
              y: y + r * (height + rowSpacing),
              w: width, h: height,
              color:       fillHex || stroke || color,
              fillColor:   fillHex   || undefined,
              strokeColor: stroke    || undefined,
              fill: hasFill,
              strokeWidth: sw ?? strokeWidth,
              opacity: 1, rotation: 0,
            });
          }
        const next = [...elements, ...newShapes];
        setElements(next); saveState(next);
        break;
      }

      case 'ADD_TEXT': {
        const newText = buildText(action);
        const next = [...elements, newText];
        setElements(next); setSelectedId(newText.id); saveState(next);
        break;
      }

      default:
        console.warn('Unknown bot action:', action.type);
    }
  }, [elements, color, strokeWidth, fillMode, selectedId, canvasSize,
      handleToolChange, baseUpdateColor, saveState,
      setStrokeWidth, setFillMode, setZoom, setSelectedId,
      baseUndo, baseRedo, contextRef, setEditingId]);

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
      const pixelData = exportCanvas.toDataURL('image/webp', 0.7);

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
      const thumbnail = badgeCanvas.toDataURL('image/webp', 0.6);

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
      // Only redirect to login when trying to open a specific canvas that requires auth
      if (!user && activeCanvasId) {
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
  }, [activeCanvasId, navigate, user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!editingId) {
        const key = e.key.toLowerCase();
        if (e.ctrlKey && key === 'r') { e.preventDefault(); setShowRulers(prev => !prev); }
        if (e.ctrlKey && key === 'g') { e.preventDefault(); setShowGridlines(prev => !prev); }
        if (e.key === 'F11') { e.preventDefault(); handleFullScreen(); }
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
          const nextElements = elements.filter(el => el.id !== selectedId);
          setElements(nextElements);
          setSelectedId(null);
          saveState(nextElements);
        }
        if (e.metaKey || e.ctrlKey) {
          if (key === 'c') { e.preventDefault(); handleCopy(); }
          else if (key === 'x') { e.preventDefault(); handleCut(); }
          else if (key === 'v') { e.preventDefault(); handlePaste(); }
          else if (key === 's') { e.preventDefault(); handleSave(); }
          else if (key === 'z') { e.preventDefault(); undo(); }
          else if (key === 'y') { e.preventDefault(); redo(); }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId, elements, saveState, handleCopy, handleCut, handlePaste, handleSave, undo, redo]);

  return (
    <div ref={workspaceRef} className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-200 overflow-hidden font-sans select-none">
      <TopMenu
        id="paint-topmenu"
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
          id="paint-toolbar"
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
        <PropertiesPanel id="paint-properties" strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth} />

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
        <StatusBar id="paint-statusbar" currPos={currPos} canvasSize={canvasSize} zoom={zoom} setZoom={setZoom} />
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

        #paint-topmenu button, 
        #paint-toolbar .grid-cols-3 button, 
        #paint-toolbar .grid-cols-5 button {
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

        #paint-toolbar .grid-cols-3 button {
          border-radius: 12px !important;
          width: 42px !important;
          height: 42px !important;
          color: #e4e4e7 !important;
        }
        #paint-toolbar .grid-cols-3 button:hover {
          background-color: rgba(39, 39, 42, 0.5) !important;
        }
        #paint-toolbar .grid-cols-3 .bg-zinc-700 {
          background-color: #27272a !important; 
          color: #3b82f6 !important; 
        }

        #paint-toolbar .grid-cols-5 button {
          border-radius: 10px !important;
          width: 38px !important;
          height: 38px !important;
          color: #e4e4e7 !important;
        }
        #paint-toolbar .grid-cols-5 .bg-blue-600 {
          background-color: #2563eb !important; 
          border: 2px solid white !important; 
          color: white !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }

        #paint-topmenu button {
          border-radius: 8px !important;
          padding: 6px 16px !important;
          background-color: #18181b !important;
          color: white !important;
        }

        #paint-toolbar .flex.items-center.gap-2 button {
          background-color: #ffffff !important;
          color: #18181b !important;
          border-radius: 6px !important;
          width: 30px !important;
          height: 30px !important;
        }

        /* Walkthrough overlay: keep Material Icons font intact */
        [data-walkthrough-card] .material-icons {
          font-family: 'Material Icons' !important;
          font-weight: normal !important;
          font-style: normal !important;
          font-size: inherit !important;
          line-height: 1 !important;
          letter-spacing: normal !important;
          text-transform: none !important;
          display: inline-block !important;
          white-space: nowrap !important;
          -webkit-font-smoothing: antialiased !important;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        canvas { image-rendering: pixelated; }
      `}</style>
      {/* Walkthrough Overlay */}
      {showWalkthrough && (
        <PaintWalkthroughOverlay
          step={walkthroughStep}
          setStep={setWalkthroughStep}
          onClose={() => setShowWalkthrough(false)}
        />
      )}

      {/* Floating AI & Help Options */}
      <HelpOptionsButton
        onBotClick={() => setIsBotOpen(true)}
        onWalkthroughClick={() => {
          setWalkthroughStep(0);
          setShowWalkthrough(true);
        }}
      />

      {/* AI Bot Widget */}
      {isBotOpen && (
        <BotWidget
          onClose={() => setIsBotOpen(false)}
          onAction={handleBotAction}
          contextSnapshot={{
            view: 'paint',
            tool,
            color,
            strokeWidth,
            fillMode,
            zoom,
            canvasSize,
            elementsCount: elements.length,
            selectedElementId: selectedId,
            elements: elements.slice(-15).map(e => ({
              type:   e.type,
              id:     e.id,
              x:      Math.round(e.x),
              y:      Math.round(e.y),
              w:      Math.round(e.w  || 0),
              h:      Math.round(e.h  || 0),
              color:  e.color,          // single color field (hex)
              filled: e.fill,           // boolean: true = filled shape
              text:   e.text,
            })),
          }}
        />
      )}
    </div>
  );
};

export default PaintApp;
