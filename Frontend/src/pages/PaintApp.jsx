import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Scissors, Copy, Clipboard, LayoutDashboard } from 'lucide-react';
import TopMenu from '../components/Canvas/TopMenu';
import Toolbar from '../components/Canvas/Toolbar';
import PropertiesPanel from '../components/Canvas/PropertiesPanel';
import PaintCanvas from '../components/Canvas/PaintCanvas';
import LayerPanel from '../components/Canvas/LayerPanel';
import usePaintHistory from '../hooks/usePaintHistory';
import usePaintTools from '../hooks/usePaintTools';
import { getElementBounds } from '../utils/canvasHelpers';
import { canvasAPI } from '../services/api';
import BotWidget from '../components/Bot/BotWidget';
import HelpOptionsButton from '../components/shared/HelpOptionsButton';
import PaintWalkthrough from '../components/Canvas/PaintWalkthrough';

const PaintApp = () => {
  const { id: canvasId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const tempContextRef = useRef(null);
  const textAreaRef = useRef(null);
  const workspaceRef = useRef(null);
  const mainContainerRef = useRef(null);
  const initialStateSaved = useRef(false);

  const [zoom, setZoom] = useState(100);
  const [canvasSize, setCanvasSize] = useState({ x: 0, y: 0, width: 1920, height: 1080 });
  const [gridSize, setGridSize] = useState(20);
  const [currPos, setCurrPos] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState([]);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [layers, setLayers] = useState([
    { id: 'layer-1', name: 'Background', visible: true, locked: false, opacity: 1, blendMode: 'normal', bgColor: '#ffffff' }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer-1');
  const [canvasBgColor, setCanvasBgColor] = useState('#ffffff');
  const [showCheckerboard, setShowCheckerboard] = useState(false);

  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [showGridlines, setShowGridlines] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridColor, setGridColor] = useState('#b0b0b0');
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [alwaysShowToolbar, setAlwaysShowToolbar] = useState(true);
  const [currentView, setCurrentView] = useState('canvas'); // 'canvas' or 'dashboard'
  const [lastSavedStep, setLastSavedStep] = useState(-1);
  const [notifications, setNotifications] = useState([]);
  const [pasteOffset, setPasteOffset] = useState({ x: 0, y: 0 });
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [navigatingToDashboard, setNavigatingToDashboard] = useState(false);
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
    aiEnabled,
    setAiEnabled,
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
  } = usePaintHistory(canvasRef, elements, layers, activeLayerId, canvasBgColor, showCheckerboard);

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
      const hasFill = s.fill && s.fill !== 'transparent';
      const fillHex = hasFill ? s.fill : null;
      const strokeHex = s.stroke || null;
      return {
        id: Date.now() + idOffset + Math.floor(Math.random() * 1000),
        type: s.shape || s.type || 'rect',
        x: s.x ?? 700,
        y: s.y ?? 300,
        w: s.width ?? s.w ?? 160,
        h: s.height ?? s.h ?? 120,
        color: fillHex || strokeHex || color,
        fillColor: fillHex || undefined,
        strokeColor: strokeHex || undefined,
        fill: hasFill,
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
      w: s.width ?? s.w ?? 300,
      h: s.height ?? s.h ?? 60,
      color: s.color || s.fill || color,
      font: s.fontFamily || s.font || 'Arial',
      fontSize: s.fontSize || 28,
      strokeWidth,
      opacity: 1,
    });

    switch (action.type) {
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
              ? { ...e, w: action.width ?? e.w, h: action.height ?? e.h }
              : e
          );
          setElements(next); saveState(next);
        }
        break;

      case 'MODIFY_SHAPES': {
        // Target elements by explicit ids array OR by matchType (shape type string)
        const targetIds = Array.isArray(action.ids) ? action.ids : null;
        const matchType = action.matchType || null;
        const next = elements.map(e => {
          const isTarget =
            (targetIds && targetIds.includes(e.id)) ||
            (matchType && e.type === matchType);
          if (!isTarget) return e;
          const updated = { ...e };
          if (action.width  !== undefined) updated.w = action.width;
          if (action.height !== undefined) updated.h = action.height;
          if (action.fill   !== undefined) {
            const hasFill = action.fill !== 'transparent';
            updated.fill      = hasFill;
            updated.fillColor = hasFill ? action.fill : undefined;
            if (hasFill) updated.color = action.fill;
          }
          if (action.stroke      !== undefined) updated.strokeColor = action.stroke;
          if (action.strokeWidth !== undefined) updated.strokeWidth = action.strokeWidth;
          if (action.color       !== undefined) updated.color = action.color;
          return updated;
        });
        setElements(next); saveState(next);
        break;
      }

      case 'DUPLICATE_SELECTED':
        if (selectedId) {
          const orig = elements.find(e => e.id === selectedId);
          if (orig) {
            const dup = {
              ...orig, id: Date.now(),
              x: orig.x + (action.offsetX ?? 30),
              y: orig.y + (action.offsetY ?? 30)
            };
            const next = [...elements, dup];
            setElements(next); setSelectedId(dup.id); saveState(next);
          }
        }
        break;

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
              color: fillHex || stroke || color,
              fillColor: fillHex || undefined,
              strokeColor: stroke || undefined,
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

  // Load canvas data from DB on mount
  useEffect(() => {
    if (canvasId) {
      canvasAPI.getById(canvasId).then(canvas => {
        if (canvas && canvas.data) {
          const data = canvas.data;
          if (data.elements) {
            // Restore image elements
            const restored = data.elements.map(el => {
              if (el.type === 'raster-fill' && el.dataUrl && !el.image) {
                const img = new Image();
                img.src = el.dataUrl;
                return { ...el, image: img };
              }
              return el;
            });
            setElements(restored);
          }
          if (data.layers) setLayers(data.layers);
          if (data.activeLayerId) setActiveLayerId(data.activeLayerId);
          if (data.canvasBgColor) setCanvasBgColor(data.canvasBgColor);
          if (data.showCheckerboard !== undefined) setShowCheckerboard(data.showCheckerboard);
        }
      }).catch(err => console.error('Failed to load canvas:', err));
    }
  }, [canvasId]);

  // Save initial state for undo (so first operation can be undone)
  useEffect(() => {
    if (!initialStateSaved.current) {
      initialStateSaved.current = true;
      saveState(elements, layers, activeLayerId, canvasBgColor, showCheckerboard);
      setLastSavedStep(0);
    }
  }, []);

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
    return () => {
      window.removeEventListener('click', closeMenus);
    };
  }, []);


  const handleCopy = useCallback(() => {
    if (selectedId) {
      const el = elements.find(e => e.id === selectedId);
      if (el) {
        // Use getElementBounds to get the true position for ALL element types
        const bounds = getElementBounds(el);

        // Deep clone preserving object references
        const clone = { ...el };
        if (el.points) clone.points = el.points.map(p => ({ ...p }));
        if (el.image) clone.image = el.image;
        if (el.dataUrl) clone.dataUrl = el.dataUrl;

        // Store the computed bounds so paste knows the real position
        clone._bounds = bounds;

        setClipboard(clone);
        setPasteOffset({ x: 0, y: 0 });
      }
    }
  }, [selectedId, elements, setClipboard]);

  const handleCut = useCallback(() => {
    if (selectedId) {
      const el = elements.find(e => e.id === selectedId);
      if (el) {
        const layer = layers.find(l => l.id === (el.layerId || 'layer-1'));
        if (layer?.locked) return;

        const bounds = getElementBounds(el);

        // Deep clone preserving object references
        const clone = { ...el };
        if (el.points) clone.points = el.points.map(p => ({ ...p }));
        if (el.image) clone.image = el.image;
        if (el.dataUrl) clone.dataUrl = el.dataUrl;
        clone._bounds = bounds;
        setClipboard(clone);

        const nextElements = elements.filter(e => e.id !== selectedId);
        setElements(nextElements);
        setSelectedId(null);
        saveState(nextElements);
      }
    }
  }, [selectedId, elements, setClipboard, setSelectedId, saveState, layers]);

  const handlePaste = useCallback((pos = null) => {
    if (clipboard) {
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (activeLayer?.locked || !activeLayer?.visible) return;

      const newId = Date.now();

      // Use stored bounds for the original position (works for ALL element types)
      const origBounds = clipboard._bounds || getElementBounds(clipboard);
      const origX = origBounds.x;
      const origY = origBounds.y;

      // Calculate staggering offset
      const currentOffset = pos ? { x: 0, y: 0 } : {
        x: pasteOffset.x + 20,
        y: pasteOffset.y + 20
      };

      if (!pos) setPasteOffset(currentOffset);

      // The delta from the original position
      const dx = pos ? (pos.x - origX) : currentOffset.x;
      const dy = pos ? (pos.y - origY) : currentOffset.y;

      // Start from the clipboard data
      const newEl = {
        ...clipboard,
        id: newId,
        layerId: activeLayerId
      };

      // Remove the internal bounds marker
      delete newEl._bounds;

      if (clipboard.type === 'path') {
        // Path elements: shift all points by dx/dy
        if (clipboard.points) {
          newEl.points = clipboard.points.map(p => ({
            x: p.x + dx,
            y: p.y + dy
          }));
        }
        // Also shift x/y if they exist (for movement tracking)
        if (clipboard.x !== undefined) newEl.x = clipboard.x + dx;
        if (clipboard.y !== undefined) newEl.y = clipboard.y + dy;
      } else {
        // Shapes, text, raster-fill, etc: shift x/y, preserve w/h
        newEl.x = (clipboard.x !== undefined ? clipboard.x : origX) + dx;
        newEl.y = (clipboard.y !== undefined ? clipboard.y : origY) + dy;
        // Explicitly preserve dimensions
        if (clipboard.w !== undefined) newEl.w = clipboard.w;
        if (clipboard.h !== undefined) newEl.h = clipboard.h;
      }

      // For raster-fill images, ensure the image reference is preserved
      if (clipboard.image) {
        newEl.image = clipboard.image;
      }
      if (!newEl.image && clipboard.dataUrl) {
        const img = new Image();
        img.src = clipboard.dataUrl;
        newEl.image = img;
      }

      const nextElements = [...elements, newEl];
      setElements(nextElements);
      setSelectedId(newId);
      handleToolChange('select'); // switch to Select so pasted element is immediately moveable/resizable
      saveState(nextElements);
    }
  }, [clipboard, elements, setSelectedId, handleToolChange, saveState, layers, activeLayerId, pasteOffset]);

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
    baseUndo(contextRef, setElements, setSelectedId, setEditingId, setLayers, setActiveLayerId, setCanvasBgColor, setShowCheckerboard);
  };

  const redo = () => {
    baseRedo(contextRef, setElements, setSelectedId, setEditingId, setLayers, setActiveLayerId, setCanvasBgColor, setShowCheckerboard);
  };

  const addLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newLayer = {
      id: newId,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      bgColor: 'white'
    };
    const nextLayers = [newLayer, ...layers];
    setLayers(nextLayers);
    setActiveLayerId(newId);
    saveState(elements, nextLayers, newId, canvasBgColor, showCheckerboard);
  };

  const deleteLayer = (id) => {
    if (layers.length <= 1) return;
    const nextLayers = layers.filter(l => l.id !== id);
    const nextElements = elements.filter(el => el.layerId !== id);
    setLayers(nextLayers);
    setElements(nextElements);
    if (activeLayerId === id) setActiveLayerId(nextLayers[0].id);
    saveState(nextElements, nextLayers);
  };

  const toggleLayerVisibility = (id) => {
    const nextLayers = layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
    setLayers(nextLayers);
    saveState(elements, nextLayers);
  };

  const toggleLayerLock = (id) => {
    const nextLayers = layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l);
    setLayers(nextLayers);
    saveState(elements, nextLayers);
  };

  const reorderLayers = (startIndex, endIndex) => {
    const result = Array.from(layers);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setLayers(result);
    saveState(elements, result, activeLayerId, canvasBgColor, showCheckerboard);
  };

  const updateLayerOpacity = (id, opacity) => {
    const nextLayers = layers.map(l => l.id === id ? { ...l, opacity } : l);
    setLayers(nextLayers);
    saveState(elements, nextLayers, activeLayerId, canvasBgColor, showCheckerboard);
  };

  const updateLayerBgColor = (id, bgColor) => {
    const nextLayers = layers.map(l => l.id === id ? { ...l, bgColor } : l);
    setLayers(nextLayers);
    saveState(elements, nextLayers, activeLayerId, canvasBgColor, showCheckerboard);
  };

  const updateLayerBlendMode = (id, blendMode) => {
    const nextLayers = layers.map(l => l.id === id ? { ...l, blendMode } : l);
    setLayers(nextLayers);
    saveState(elements, nextLayers, activeLayerId, canvasBgColor, showCheckerboard);
  };

  const renameLayer = (id, newName) => {
    const nextLayers = layers.map(l => l.id === id ? { ...l, name: newName } : l);
    setLayers(nextLayers);
    saveState(elements, nextLayers, activeLayerId, canvasBgColor, showCheckerboard);
  };

  // Merge active layer DOWN into the layer below it
  const mergeLayers = (sourceId) => {
    if (layers.length <= 1) return; // nothing to merge into

    const sourceIdx = layers.findIndex(l => l.id === sourceId);
    if (sourceIdx === -1) return;

    // Target is the layer BELOW (next index, since layers[0] is top)
    const targetIdx = sourceIdx + 1;
    if (targetIdx >= layers.length) return; // already at the bottom

    const sourceLayer = layers[sourceIdx];
    const targetLayer = layers[targetIdx];

    // Move all elements from source layer to target layer
    const nextElements = elements.map(el => {
      if (el.layerId === sourceId || (!el.layerId && sourceId === 'layer-1')) {
        return {
          ...el,
          layerId: targetLayer.id,
          _mergeHistory: [...(el._mergeHistory || []), sourceId]
        };
      }
      return el;
    });

    // Remove the source layer
    const nextLayers = layers.filter(l => l.id !== sourceId);

    // Update the merged target layer name
    const mergedName = `${sourceLayer.name} + ${targetLayer.name}`;
    const finalLayers = nextLayers.map(l => {
      if (l.id === targetLayer.id) {
        return {
          ...l,
          name: mergedName,
          visible: true,
          _mergeHistory: [...(l._mergeHistory || []), { sourceLayer, oldTargetName: l.name }]
        };
      }
      return l;
    });

    setElements(nextElements);
    setLayers(finalLayers);
    setActiveLayerId(targetLayer.id);
    saveState(nextElements, finalLayers, targetLayer.id, canvasBgColor, showCheckerboard);
  };

  // Separate (un-merge) the most recently merged layer
  const splitLayer = (targetId) => {
    const targetIdx = layers.findIndex(l => l.id === targetId);
    if (targetIdx === -1) return;

    const targetLayer = layers[targetIdx];

    // Check if layer has merge history
    if (!targetLayer._mergeHistory || targetLayer._mergeHistory.length === 0) return;

    const newMergeHistory = [...targetLayer._mergeHistory];
    const lastMerge = newMergeHistory.pop();
    const sourceLayer = lastMerge.sourceLayer;

    // Restore target layer name & history
    const restoredTargetLayer = {
      ...targetLayer,
      name: lastMerge.oldTargetName,
      _mergeHistory: newMergeHistory
    };

    // Insert source layer above the target layer
    const nextLayers = [
      ...layers.slice(0, targetIdx),
      sourceLayer,
      restoredTargetLayer,
      ...layers.slice(targetIdx + 1)
    ];

    // Restore elements' layerId
    const nextElements = elements.map(el => {
      if (el.layerId === targetId && el._mergeHistory && el._mergeHistory.length > 0) {
        const lastSourceId = el._mergeHistory[el._mergeHistory.length - 1];
        if (lastSourceId === sourceLayer.id) {
          const newHistory = [...el._mergeHistory];
          newHistory.pop();
          return { ...el, layerId: sourceLayer.id, _mergeHistory: newHistory };
        }
      }
      return el;
    });

    setElements(nextElements);
    setLayers(nextLayers);
    setActiveLayerId(sourceLayer.id);
    saveState(nextElements, nextLayers, sourceLayer.id, canvasBgColor, showCheckerboard);
  };

  const toggleCheckerboard = () => {
    const next = !showCheckerboard;
    setShowCheckerboard(next);
    saveState(elements, layers, activeLayerId, canvasBgColor, next);
  };

  const updateCanvasBgColor = (newColor) => {
    setCanvasBgColor(newColor);
    saveState(elements, layers, activeLayerId, newColor);
  };

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handleSave = async () => {
    if (canvasId) {
      try {
        // Prepare elements without non-serializable image objects
        const serializableElements = elements.map(el => {
          const clone = { ...el };
          if (el.points) clone.points = [...el.points];
          delete clone.image; // Remove HTMLImageElement (not serializable)
          return clone;
        });
        await canvasAPI.update(canvasId, {
          data: {
            elements: serializableElements,
            layers,
            activeLayerId,
            canvasBgColor,
            showCheckerboard
          }
        });
      } catch (err) {
        console.error('Failed to save canvas:', err);
      }
    }
    setLastSavedStep(historyStep);
  };

  const handleDashboardClick = () => {
    const hasUnsavedChanges = historyStep !== lastSavedStep;
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
    // Auto-save before sharing
    await handleSave();
    try {
      const { shareToken } = await canvasAPI.generateShareToken(canvasId);
      const link = `${window.location.origin}/#/shared/${shareToken}`;
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
      // Fallback
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

  const handleExport = () => {
    // This is the old handleSave logic — it downloads the image
    const exportCanvas = document.createElement('canvas');
    const sourceCanvas = canvasRef.current;
    if (!sourceCanvas) return;

    exportCanvas.width = sourceCanvas.width;
    exportCanvas.height = sourceCanvas.height;
    const ctx = exportCanvas.getContext('2d');

    if (canvasBgColor !== 'transparent') {
      ctx.fillStyle = canvasBgColor;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    ctx.drawImage(sourceCanvas, 0, 0);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const link = document.createElement('a');
    link.download = `paint-pro-${timestamp}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const newId = Date.now();

            // Calculate center of current view
            const viewWidth = workspaceRef.current?.clientWidth || 800;
            const viewHeight = workspaceRef.current?.clientHeight || 600;
            const scale = zoom / 100;

            // Get coordinates in canvas space
            const centerX = panOffset.x + (viewWidth / 2) / scale;
            const centerY = panOffset.y + (viewHeight / 2) / scale;

            // Maintain aspect ratio and limit size to 80% of view
            let w = img.width;
            let h = img.height;
            const maxW = (viewWidth * 0.8) / scale;
            const maxH = (viewHeight * 0.8) / scale;

            if (w > maxW || h > maxH) {
              const ratio = Math.min(maxW / w, maxH / h);
              w *= ratio;
              h *= ratio;
            }

            const newEl = {
              id: newId,
              type: 'raster-fill',
              x: centerX - w / 2,
              y: centerY - h / 2,
              w: w,
              h: h,
              image: img,
              dataUrl: event.target.result,
              layerId: activeLayerId
            };
            const nextElements = [...elements, newEl];
            setElements(nextElements);
            setSelectedId(newId); // Select the imported image
            saveState(nextElements);
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!editingId) {
        if (e.ctrlKey && e.key === 'r') { e.preventDefault(); setShowRulers(prev => !prev); }
        if (e.ctrlKey && e.key === 'g') { e.preventDefault(); setShowGridlines(prev => !prev); }

        if (e.key === 'F11') { e.preventDefault(); handleFullScreen(); }
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
          const el = elements.find(item => item.id === selectedId);
          if (el) {
            const layer = layers.find(l => l.id === (el.layerId || 'layer-1'));
            if (layer?.locked) return;

            const nextElements = elements.filter(item => item.id !== selectedId);
            setElements(nextElements);
            setSelectedId(null);
            saveState(nextElements);
          }
        }
        if (e.metaKey || e.ctrlKey) {
          if (e.key === 'c') { e.preventDefault(); handleCopy(); }
          else if (e.key === 'x') { e.preventDefault(); handleCut(); }
          else if (e.key === 'v') { e.preventDefault(); handlePaste(); }
          else if (e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
          }
          else if (e.key === 'y') { e.preventDefault(); redo(); }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId, elements, layers, activeLayerId, saveState, handleCopy, handleCut, handlePaste]);

  useEffect(() => {
    // Standard starting bounds - the "Reference Sheet"
    let minX = 0;
    let minY = 0;
    let maxX = 1920;
    let maxY = 1080;

    elements.forEach(el => {
      const bounds = getElementBounds(el);
      if (bounds) {
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.w);
        maxY = Math.max(maxY, bounds.y + bounds.h);
      }
    });

    const margin = 1200; // Increased margin for smoother growth
    const target = {
      x: Math.floor((minX / 100)) * 100 - margin, // Align to 100px grid for stability
      y: Math.floor((minY / 100)) * 100 - margin,
      width: Math.ceil(((maxX - minX) + margin * 2) / 100) * 100,
      height: Math.ceil(((maxY - minY) + margin * 2) / 100) * 100
    };

    // Buffer to avoid jitter - only update if change is significant
    const threshold = 400;
    if (Math.abs(target.x - canvasSize.x) > threshold ||
      Math.abs(target.y - canvasSize.y) > threshold ||
      Math.abs(target.width - canvasSize.width) > threshold ||
      Math.abs(target.height - canvasSize.height) > threshold) {
      setCanvasSize(target);
    }
  }, [elements, canvasSize]);

  const collaborators = []; // Simulation removed for "proper" implementation

  return (
    <div ref={workspaceRef} className="flex flex-col h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden font-sans select-none">
      <TopMenu
        isFileMenuOpen={isFileMenuOpen}
        setIsFileMenuOpen={setIsFileMenuOpen}
        isEditMenuOpen={isEditMenuOpen}
        setIsEditMenuOpen={setIsEditMenuOpen}
        isViewMenuOpen={isViewMenuOpen}
        setIsViewMenuOpen={setIsViewMenuOpen}
        handleSave={handleSave}
        handleExport={handleExport}
        handleImport={handleImport}
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
        isDirty={historyStep !== lastSavedStep}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onDashboardClick={handleDashboardClick}
        onShare={handleShare}
      />

      {currentView === 'dashboard' ? (
        <div className="flex-1 bg-zinc-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="max-w-md w-full">
            <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-zinc-700/50">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Welcome Back</h1>
            <p className="text-zinc-500 mb-8 italic">Choose a project to continue or start a fresh canvas.</p>

            <div className="mt-8 pt-8 border-t border-zinc-800/50">
              <p className="text-xs text-zinc-600 uppercase tracking-widest font-bold mb-4">Dashboard Status</p>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-left">
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  System is ready for new creation
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>

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
              snapToGrid={snapToGrid}
              setSnapToGrid={setSnapToGrid}
              gridColor={gridColor}
              setGridColor={setGridColor}
              setPanOffset={setPanOffset}
              canvasBgColor={canvasBgColor}
              updateCanvasBgColor={updateCanvasBgColor}
              showCheckerboard={showCheckerboard}
              toggleCheckerboard={toggleCheckerboard}
            />
          )}

          <main className="flex-1 flex relative overflow-hidden bg-[#09090b]">
            <PropertiesPanel
              strokeWidth={strokeWidth}
              setStrokeWidth={setStrokeWidth}
              canvasBgColor={canvasBgColor}
              setCanvasBgColor={updateCanvasBgColor}
              activeLayerId={activeLayerId}
              layers={layers}
              updateLayerBgColor={updateLayerBgColor}
              aiEnabled={aiEnabled}
              setAiEnabled={setAiEnabled}
            />

            <div ref={mainContainerRef} className="flex-1 overflow-hidden bg-transparent flex items-center justify-center relative">
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
                gridColor={gridColor}
                gridSize={gridSize}
                snapToGrid={snapToGrid}
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
                panOffset={panOffset}
                setPanOffset={setPanOffset}
                layers={layers}
                activeLayerId={activeLayerId}
                canvasBgColor={canvasBgColor}
                showCheckerboard={showCheckerboard}
                collaborators={collaborators}
                aiEnabled={aiEnabled}
                handleCut={handleCut}
                handlePaste={handlePaste}
                clipboard={clipboard}
              />


            </div>
            <LayerPanel
              layers={layers}
              activeLayerId={activeLayerId}
              setActiveLayerId={setActiveLayerId}
              addLayer={addLayer}
              deleteLayer={deleteLayer}
              toggleVisibility={toggleLayerVisibility}
              toggleLock={toggleLayerLock}
              reorderLayers={reorderLayers}
              updateLayerOpacity={updateLayerOpacity}
              updateLayerBgColor={updateLayerBgColor}
              updateLayerBlendMode={updateLayerBlendMode}
              renameLayer={renameLayer}
              mergeLayers={mergeLayers}
              splitLayer={splitLayer}
            />
          </main>
        </>
      )}



      {/* ── Loading overlay for dashboard transition ─────────────────────── */}
      {navigatingToDashboard && (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#09090b] animate-fadeIn">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
          <p className="text-zinc-300 text-lg font-semibold">Returning to Dashboard</p>
          <p className="text-zinc-500 text-sm mt-1">Please wait...</p>
        </div>
      )}

      {/* ── Save / Don't Save Modal ────────────────────────────────────────── */}
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

      {/* ── Share Modal ────────────────────────────────────────────────────── */}
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

      {/* ── Guided Walkthrough ─────────────────────────────────────────── */}
      {showWalkthrough && (
        <PaintWalkthrough
          step={walkthroughStep}
          onNext={() => setWalkthroughStep(s => Math.min(s + 1, 9))}
          onPrev={() => setWalkthroughStep(s => Math.max(s - 1, 0))}
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
              type: e.type,
              id: e.id,
              x: Math.round(e.x),
              y: Math.round(e.y),
              w: Math.round(e.w || 0),
              h: Math.round(e.h || 0),
              color: e.color,
              filled: e.fill,
              text: e.text,
            })),
          }}
        />
      )}

      {/* ── Toast Notifications ────────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className="fixed bottom-10 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-2xl text-sm font-semibold
                backdrop-blur-md border animate-in fade-in slide-in-from-right-4 duration-200
                ${n.type === 'success'
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : n.type === 'error'
                    ? 'bg-red-500/20 border-red-500/30 text-red-300'
                    : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                }`}
            >
              <span className="text-base">
                {n.type === 'success' ? '✓' : n.type === 'error' ? '✕' : 'ℹ'}
              </span>
              {n.message}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        html, body { margin: 0; padding: 0; overflow: hidden; height: 100vh; width: 100vw; background-color: #09090b; }
        body { font-family: 'Inter', sans-serif; color: #e4e4e7; }

        .inner-shadow {
          box-shadow: inset 0 0 100px rgba(0,0,0,0.5);
        }

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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        header .grid-cols-3 button {
          border-radius: 14px !important;
          width: 44px !important;
          height: 44px !important;
          color: #a1a1aa !important;
          border: 1px solid transparent !important;
        }
        header .grid-cols-3 button:hover {
          background-color: rgba(63, 63, 70, 0.3) !important;
          color: #ffffff !important;
          border-color: rgba(161, 161, 170, 0.2) !important;
          transform: translateY(-1px);
        }
        header .grid-cols-3 .bg-zinc-700 {
          background-color: rgba(37, 99, 235, 0.15) !important; 
          color: #60a5fa !important; 
          border-color: rgba(37, 99, 235, 0.3) !important;
          box-shadow: 0 0 15px rgba(37, 99, 235, 0.1);
        }

        header .grid-cols-5 button {
          border-radius: 12px !important;
          width: 40px !important;
          height: 40px !important;
          color: #a1a1aa !important;
        }
        header .grid-cols-5 .bg-blue-600 {
          background-color: #2563eb !important; 
          border: 2px solid rgba(255,255,255,0.2) !important; 
          color: white !important;
          box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.4);
          transform: scale(1.05);
        }

        nav button {
          border-radius: 10px !important;
          padding: 8px 18px !important;
          background-color: #1f1f23 !important;
          color: #e4e4e7 !important;
          font-weight: 600 !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
        }
        nav button:hover {
          background-color: #27272a !important;
          transform: translateY(-1px);
        }

        header .flex.items-center.gap-2 button {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #e4e4e7 !important;
          border-radius: 8px !important;
          width: 32px !important;
          height: 32px !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        header .flex.items-center.gap-2 button:hover:not(.bg-blue-500) {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
        }
        header .flex.items-center.gap-2 button.bg-blue-500 {
          background-color: #2563eb !important; 
          border: 2px solid rgba(255,255,255,0.2) !important; 
          color: white !important;
          box-shadow: 0 8px 16px -4px rgba(37, 99, 235, 0.4) !important;
          transform: scale(1.05) !important;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PaintApp;
