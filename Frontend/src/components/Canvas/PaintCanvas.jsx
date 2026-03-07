import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Square, Circle, Triangle, Minus as LineIcon, Star,
  Pentagon, Hexagon, MessageSquare, MoveRight, Diamond,
  Zap, X, Scissors, Clipboard
} from 'lucide-react';
import {
  drawRegularPolygon,
  drawStarShape,
  drawArrowShape,
  drawCalloutShape,
  getElementBounds,
  isPointInElement,
  drawElement,
  recognizeShape,
  floodFill
} from '../../utils/canvasHelpers';

const PaintCanvas = ({
  canvasRef,
  tempCanvasRef,
  contextRef,
  tempContextRef,
  textAreaRef,
  mainContainerRef,
  canvasSize,
  setCanvasSize,
  zoom,
  setZoom,
  showRulers,
  showGridlines,
  gridColor,
  gridSize,
  tool,
  color,
  strokeWidth,
  opacity,
  fillMode,
  elements,
  setElements,
  selectedId,
  setSelectedId,
  editingId,
  setEditingId,
  textFormat,
  saveState,
  panOffset,
  setPanOffset,
  layers,
  activeLayerId,
  canvasBgColor,
  showCheckerboard,
  collaborators,
  aiEnabled,
  handleCut,
  handlePaste,
  clipboard,
  snapToGrid
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currPos, setCurrPos] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState(null);
  const [pendingCorrection, setPendingCorrection] = useState(null);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const pinchStartDist = useRef(null);
  const pinchStartZoom = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastMouseDownTime = useRef(0); // guard: skip 2nd mousedown in a dblclick

  const isStickyResize = useRef(false);

  const containerRef = useRef(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !tempCanvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    [canvas, tempCanvas].forEach(c => {
      c.width = width * dpr;
      c.height = height * dpr;
      c.style.width = width + 'px';
      c.style.height = height + 'px';

      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    });

    contextRef.current = canvas.getContext('2d');
    tempContextRef.current = tempCanvas.getContext('2d');

    // Trigger a redraw after the canvas has been forcefully cleared by resizing
    setRenderTrigger(prev => prev + 1);
  }, [canvasRef, tempCanvasRef, contextRef, tempContextRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      initCanvas();
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [initCanvas]);

  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        const zoomFactor = delta > 0 ? 1.1 : 0.9;

        setZoom(prevZoom => {
          const newZoom = Math.min(Math.max(prevZoom * zoomFactor, 10), 500);
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const oldScale = prevZoom / 100;
          const newScale = newZoom / 100;

          setPanOffset(prevPan => ({
            x: prevPan.x + (mouseX / oldScale) - (mouseX / newScale),
            y: prevPan.y + (mouseY / oldScale) - (mouseY / newScale)
          }));

          return Math.round(newZoom);
        });
      } else {
        // Vertical panning when not zooming
        setPanOffset(prev => ({
          ...prev,
          y: prev.y + e.deltaY / (zoom / 100)
        }));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [mainContainerRef, setZoom]);

  useEffect(() => {
    const tCtx = tempContextRef.current;
    const canvas = tempCanvasRef.current;
    if (!tCtx || !canvas) return;
    const s = zoom / 100;
    const dpr = window.devicePixelRatio || 1;
    const vWidth = canvas.width / dpr;
    const vHeight = canvas.height / dpr;

    // Viewport bounds in world coordinates
    const viewLeft = panOffset.x;
    const viewTop = panOffset.y;
    const viewRight = panOffset.x + vWidth / s;
    const viewBottom = panOffset.y + vHeight / s;

    const isVisible = (el) => {
      const b = getElementBounds(el);
      const margin = 50;
      return !(b.x + b.w + margin < viewLeft ||
        b.x - margin > viewRight ||
        b.y + b.h + margin < viewTop ||
        b.y - margin > viewBottom);
    };

    tCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tCtx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Enter Infinite Coordinate Space
    tCtx.setTransform(s * dpr, 0, 0, s * dpr, -panOffset.x * s * dpr, -panOffset.y * s * dpr);

    // Process layers from bottom to top (reversed array)
    [...layers].reverse().forEach(layer => {
      if (!layer.visible) return;
      tCtx.save();
      tCtx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;

      // Draw elements for this layer
      elements
        .filter(el => (el.layerId === layer.id || (!el.layerId && layer.id === 'layer-1')) && isVisible(el))
        .forEach(el => drawElement(tCtx, el, el.id === selectedId, el.id === editingId));
      tCtx.restore();
    });
  }, [elements, selectedId, editingId, zoom, canvasSize, panOffset, layers, renderTrigger]);

  const drawCheckerboard = (ctx, width, height, panX, panY, zoom) => {
    const size = 20 * (zoom / 100);
    const rows = Math.ceil(height / size) + 2;
    const cols = Math.ceil(width / size) + 2;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset for pattern
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1f1f23' : '#18181b';
        ctx.fillRect(c * size - (panX * (zoom / 100) % size), r * size - (panY * (zoom / 100) % size), size, size);
      }
    }
    ctx.restore();
  };

  const drawGrid = (ctx, panX, panY, zoom, gridSize) => {
    const s = zoom / 100;
    const dpr = window.devicePixelRatio || 1;

    // ── Density guard: skip if lines would be < 4 css-px apart ────────────
    const pixelSpacing = gridSize * s;
    if (pixelSpacing < 4) return;

    // ── Resolve base color (hex only inside) ──────────────────────────────
    let r = 107, g = 114, b = 128; // #6b7280 default
    if (gridColor && gridColor.startsWith('#')) {
      const hex = gridColor.replace('#', '');
      if (hex.length >= 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
    } else if (gridColor && gridColor.startsWith('rgb')) {
      const m = gridColor.match(/\d+/g);
      if (m && m.length >= 3) {
        r = parseInt(m[0]);
        g = parseInt(m[1]);
        b = parseInt(m[2]);
      }
    }

    const minorColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
    const majorColor = `rgba(${r}, ${g}, ${b}, 0.7)`;

    ctx.save();
    // Work in world-coordinate space (caller already set the transform,
    // so we DON'T change it — just clip to the canvas paper area)
    ctx.beginPath();
    ctx.rect(canvasSize.x, canvasSize.y, canvasSize.width, canvasSize.height);
    ctx.clip();

    // ── Visible world bounds — intersect viewport with canvas paper ────────
    const startX = Math.max(canvasSize.x, Math.floor(panX / gridSize) * gridSize);
    const endX = Math.min(canvasSize.x + canvasSize.width, Math.floor(panX / gridSize) * gridSize + (window.innerWidth / s) + gridSize * 2);
    const startY = Math.max(canvasSize.y, Math.floor(panY / gridSize) * gridSize);
    const endY = Math.min(canvasSize.y + canvasSize.height, Math.floor(panY / gridSize) * gridSize + (window.innerHeight / s) + gridSize * 2);

    const thinLine = 1 / (s * dpr);
    const thickLine = 2 / (s * dpr);
    const majorEvery = 5;

    // ── Minor lines ────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.strokeStyle = minorColor;
    ctx.lineWidth = thinLine;

    for (let x = startX; x <= endX; x += gridSize) {
      if (Math.round(x / gridSize) % majorEvery === 0) continue;
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      if (Math.round(y / gridSize) % majorEvery === 0) continue;
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // ── Major lines (every 5 cells) ────────────────────────────────────────
    ctx.beginPath();
    ctx.strokeStyle = majorColor;
    ctx.lineWidth = thickLine;

    for (let x = startX; x <= endX; x += gridSize) {
      if (Math.round(x / gridSize) % majorEvery !== 0) continue;
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      if (Math.round(y / gridSize) % majorEvery !== 0) continue;
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    ctx.restore();
  };

  useEffect(() => {
    const bCtx = contextRef.current;
    const canvas = canvasRef.current;
    if (!bCtx || !canvas) return;
    const s = zoom / 100;
    const dpr = window.devicePixelRatio || 1;
    const vWidth = canvas.width / dpr;
    const vHeight = canvas.height / dpr;

    // Viewport bounds in world coordinates
    const viewLeft = panOffset.x;
    const viewTop = panOffset.y;
    const viewRight = panOffset.x + vWidth / s;
    const viewBottom = panOffset.y + vHeight / s;

    const isVisible = (el) => {
      const b = getElementBounds(el);
      // Add a small buffer for safety
      const margin = 50;
      return !(b.x + b.w + margin < viewLeft ||
        b.x - margin > viewRight ||
        b.y + b.h + margin < viewTop ||
        b.y - margin > viewBottom);
    };

    // Clear everything first
    bCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bCtx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    if (showCheckerboard) {
      drawCheckerboard(bCtx, canvas.width / dpr, canvas.height / dpr, panOffset.x, panOffset.y, zoom);
    }

    // Enter Infinite Coordinate Space
    bCtx.setTransform(s * dpr, 0, 0, s * dpr, -panOffset.x * s * dpr, -panOffset.y * s * dpr);

    // 1. Draw the white canvas paper area — always visible regardless of layer state
    bCtx.fillStyle = canvasBgColor || '#ffffff';
    bCtx.fillRect(canvasSize.x, canvasSize.y, canvasSize.width, canvasSize.height);

    // 2. Draw the layers from bottom to top — backgrounds first
    [...layers].reverse().forEach((layer) => {
      if (!layer.visible) return;
      if (layer.bgColor) {
        bCtx.save();
        bCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bCtx.fillStyle = layer.bgColor;
        bCtx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        bCtx.restore();
        // Restore world transform after layer bg
        bCtx.setTransform(s * dpr, 0, 0, s * dpr, -panOffset.x * s * dpr, -panOffset.y * s * dpr);
      }
    });

    // 3. Grid — on top of backgrounds, below all elements
    // Grid visibility is tied to the active layer's visibility.
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (showGridlines && activeLayer?.visible) {
      bCtx.save();
      drawGrid(bCtx, panOffset.x, panOffset.y, zoom, gridSize);
      bCtx.restore();
    }

    // 4. Restore the world-coordinate transform for drawing elements
    bCtx.setTransform(s * dpr, 0, 0, s * dpr, -panOffset.x * s * dpr, -panOffset.y * s * dpr);

    // 5. Draw layer elements on top of the grid
    [...layers].reverse().forEach((layer) => {
      if (!layer.visible) return;
      elements
        .filter(el => (el.layerId === layer.id || (!el.layerId && layer.id === 'layer-1')) && isVisible(el))
        .forEach(el => drawElement(bCtx, el, false, el.id === editingId));
    });

    // 3. Draw selection handles for the currently selected element (on top)
    if (selectedId && !editingId) {
      const selectedEl = elements.find(el => el.id === selectedId);
      if (selectedEl && isVisible(selectedEl)) {
        const layer = layers.find(l => l.id === (selectedEl.layerId || 'layer-1'));
        if (layer?.visible) {
          drawElement(bCtx, selectedEl, true, false);
        }
      }
    }

    // Draw AI Correction Preview
    if (pendingCorrection) {
      bCtx.save();
      const s = zoom / 100;
      const dpr = window.devicePixelRatio || 1;
      bCtx.setTransform(s * dpr, 0, 0, s * dpr, -panOffset.x * s * dpr, -panOffset.y * s * dpr);

      // Draw with ghost effect
      bCtx.globalAlpha = 0.4;
      bCtx.setLineDash([5, 5]);
      drawElement(bCtx, {
        ...pendingCorrection.suggestion,
        color: '#3b82f6', // Use brand blue for preview
      }, false, false);
      bCtx.restore();
    }

    // Draw Collaborators removed for "proper" implementation
  }, [elements, selectedId, editingId, zoom, canvasSize, panOffset, layers, activeLayerId, canvasBgColor, gridColor, showCheckerboard, showGridlines, gridSize, tool, JSON.stringify(collaborators), renderTrigger]);

  const getCoords = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const scale = (zoom / 100);
    let rawX = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) / scale + panOffset.x;
    let rawY = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) / scale + panOffset.y;



    return { x: rawX, y: rawY };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();

    // Guard: if this mousedown is within 300ms of the previous one, it’s the second
    // click of a double-click. Skip creating a new element to prevent state overwrite.
    const now = Date.now();
    const isDoubleClickSecond = (now - lastMouseDownTime.current) < 300;
    lastMouseDownTime.current = now;
    if (isStickyResize.current) {
      isStickyResize.current = false;
      setDragMode(null);
      saveState();
      return;
    }

    const coords = getCoords(e);
    setStartPos(coords);
    setPendingCorrection(null);
    const activeLayer = layers.find(l => l.id === activeLayerId);

    if (tool === 'bucket') {
      if (activeLayer?.locked || !activeLayer?.visible) return;

      // Find the topmost element at this position
      const hit = [...elements].reverse().find(el => {
        const layer = layers.find(l => l.id === (el.layerId || 'layer-1'));
        return layer?.visible && isPointInElement(coords.x, coords.y, el);
      });

      if (hit) {
        // Only allow filling shapes that support it
        const supportFill = ['rect', 'circle', 'ellipse', 'triangle', 'polygon', 'star', 'arrow', 'callout', 'rhombus', 'path'].includes(hit.type);
        if (supportFill) {
          const nextElements = elements.map(el =>
            el.id === hit.id ? { ...el, color: color, fill: true } : el
          );
          setElements(nextElements);
          saveState(nextElements);
        }
      }
      return;
    }

    if (tool === 'hand') {
      setDragMode('panning');
      dragOffset.current = { x: e.clientX, y: e.clientY };
      return;
    }


    // Special "Plane White Space" mode: Hidden + Locked
    const isPlaneWhite = !activeLayer?.visible && activeLayer?.locked;

    // Block creation/drawing tools if active layer is hidden or locked (unless it's the plane white space)
    const isToolAction = ['pencil', 'eraser', 'text', 'rect', 'circle', 'polygon', 'star', 'arrow', 'callout'].includes(tool);
    if (isToolAction && (!activeLayer?.visible || activeLayer?.locked) && !isPlaneWhite) return;

    if (tool === 'select' || tool === 'eraser') {
      // Filter elements: ignore hidden layers for hit detection
      const selectableElements = elements.filter(el => {
        const layer = layers.find(l => l.id === (el.layerId || 'layer-1'));
        return layer?.visible;
      });

      if (tool === 'eraser') {
        const hit = [...selectableElements].reverse().find(el => isPointInElement(coords.x, coords.y, el));
        if (hit) {
          // Block deletion if layer is locked
          const layer = layers.find(l => l.id === (hit.layerId || 'layer-1'));
          if (layer?.locked) return;

          const nextElements = elements.filter(el => el.id !== hit.id);
          setElements(nextElements);
          if (selectedId === hit.id) setSelectedId(null);
          if (editingId === hit.id) setEditingId(null);
          saveState(nextElements);
          return;
        }
      }

      if (tool === 'select') {
        if (selectedId) {
          const el = elements.find(item => item.id === selectedId);
          if (el) {
            const layer = layers.find(l => l.id === (el.layerId || 'layer-1'));
            const bounds = getElementBounds(el);

            // Block interaction if layer is locked or hidden
            if (layer?.visible && !layer?.locked) {
              // Rotation handle check
              if (el.type !== 'path') {
                const cx = el.x + el.w / 2;
                const cy = el.y + el.h / 2;
                const angle = el.rotation || 0;
                // Handle pos in element space: (cx, el.y - 24)
                // Offset from center: (0, -h/2 - 24)
                const offsetY = -Math.abs(el.h) / 2 - 24;
                const hx = cx + offsetY * -Math.sin(angle);
                const hy = cy + offsetY * Math.cos(angle);

                const dist = Math.sqrt((coords.x - hx) ** 2 + (coords.y - hy) ** 2);
                if (dist < 15 / (zoom / 100)) {
                  setDragMode('rotating');
                  return;
                }
              }

              // Resize handle check
              if (coords.x >= bounds.x + bounds.w && coords.x <= bounds.x + bounds.w + 15 &&
                coords.y >= bounds.y + bounds.h && coords.y <= bounds.y + bounds.h + 15) {
                if ((el.type !== 'text') && (el.w < 0 || el.h < 0)) {
                  const normalized = { ...el, x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h };
                  setElements(prev => prev.map(item => item.id === selectedId ? normalized : item));
                }
                setDragMode('resizing');
                return;
              }
            }
          }
        }

        const hit = [...selectableElements].reverse().find(el => isPointInElement(coords.x, coords.y, el));
        if (hit) {
          setSelectedId(hit.id);
          const layer = layers.find(l => l.id === (hit.layerId || 'layer-1'));
          // Only allow moving if not locked
          if (layer && !layer.locked) {
            setDragMode('moving');
            // For path elements, hit.x/hit.y are undefined — use element bounds instead
            const anchorX = hit.type === 'path' ? getElementBounds(hit).x : (hit.x ?? coords.x);
            const anchorY = hit.type === 'path' ? getElementBounds(hit).y : (hit.y ?? coords.y);
            dragOffset.current = { x: coords.x - anchorX, y: coords.y - anchorY };
          }
          return;
        } else {
          setSelectedId(null);
          setEditingId(null);
        }
      }
    }

    if (tool === 'pencil' || tool === 'eraser') {
      if (isDoubleClickSecond) return; // skip 2nd mousedown in dblclick
      setIsDrawing(true);
      const newPath = {
        id: Date.now(),
        type: 'path',
        points: [coords],
        color,
        strokeWidth,
        opacity,
        isEraser: tool === 'eraser',
        layerId: activeLayerId
      };
      setElements(prev => [...prev, newPath]); // functional update: always uses latest state
      setSelectedId(newPath.id);
      return;
    }

    if (e.touches && e.touches.length === 2) {
      const dist = Math.sqrt(
        (e.touches[0].clientX - e.touches[1].clientX) ** 2 +
        (e.touches[0].clientY - e.touches[1].clientY) ** 2
      );
      pinchStartDist.current = dist;
      pinchStartZoom.current = zoom;
      return;
    }

    if (tool === 'text') {
      const hit = [...elements].reverse().find(el => isPointInElement(coords.x, coords.y, el));
      if (hit && hit.type === 'text') {
        setSelectedId(hit.id);
        setEditingId(hit.id);
        return;
      }
      if (isDoubleClickSecond) return; // skip 2nd mousedown in dblclick

      setIsDrawing(true);
      setDragMode('creating');
      const newId = Date.now();
      const newText = {
        id: newId,
        type: 'text',
        text: '',
        x: coords.x,
        y: coords.y,
        w: 150,
        h: 40,
        color: color,
        strokeWidth,
        opacity,
        ...textFormat,
        fontSize: textFormat.size,
        layerId: activeLayerId
      };
      setElements(prev => [...prev, newText]); // functional update
      setSelectedId(newId);
      return;
    }

    if (isDoubleClickSecond) return; // skip 2nd mousedown in dblclick
    setIsDrawing(true);
    setDragMode('creating');
    const newEl = {
      id: Date.now(),
      type: tool,
      x: coords.x, y: coords.y, w: 0, h: 0,
      color, strokeWidth, opacity,
      fill: fillMode,
      layerId: activeLayerId
    };
    setElements(prev => [...prev, newEl]); // functional update
    setSelectedId(newEl.id);
  };

  // ── Snap helper: round to nearest grid point when snapping is enabled ──
  const snap = (v) => (snapToGrid && showGridlines ? Math.round(v / gridSize) * gridSize : v);

  const handleMouseMove = (e) => {
    const coords = getCoords(e);
    setCurrPos(coords);

    if (dragMode === 'moving' && selectedId) {
      setElements(elements.map(el => {
        if (el.id !== selectedId) return el;
        const rawX = coords.x - dragOffset.current.x;
        const rawY = coords.y - dragOffset.current.y;
        const newX = snap(rawX);
        const newY = snap(rawY);
        const dx = newX - el.x;
        const dy = newY - el.y;

        const nextEl = { ...el, x: newX, y: newY };
        if (el.type === 'path' && el.points) {
          nextEl.points = el.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        }
        return nextEl;
      }));
    } else if (dragMode === 'resizing' && selectedId) {
      setElements(elements.map(el => {
        if (el.id !== selectedId) return el;
        return { ...el, w: snap(coords.x) - el.x, h: snap(coords.y) - el.y };
      }));
    } else if (dragMode === 'creating' && selectedId) {
      setElements(elements.map(el => {
        if (el.id !== selectedId) return el;
        if (el.type === 'text') {
          return { ...el, w: Math.abs(snap(coords.x) - startPos.x), h: Math.abs(snap(coords.y) - startPos.y) };
        }
        return { ...el, w: snap(coords.x) - el.x, h: snap(coords.y) - el.y };
      }));
    } else if (dragMode === 'rotating' && selectedId) {
      setElements(elements.map(el => {
        if (el.id !== selectedId) return el;
        const cx = el.x + el.w / 2;
        const cy = el.y + el.h / 2;
        const angle = Math.atan2(coords.y - cy, coords.x - cx);
        return { ...el, rotation: angle + Math.PI / 2 };
      }));
    } else if (dragMode === 'moving' || dragMode === 'resizing' || dragMode === 'rotating') {
      // Check if element's layer is locked
      if (selectedId) {
        const el = elements.find(e => e.id === selectedId);
        const layer = layers.find(l => l.id === (el.layerId || 'layer-1'));
        if (layer?.locked) return;
      }
    } else if (dragMode === 'panning') {
      const dx = (e.clientX - dragOffset.current.x) / (zoom / 100);
      const dy = (e.clientY - dragOffset.current.y) / (zoom / 100);
      setPanOffset({ x: panOffset.x - dx, y: panOffset.y - dy });
      dragOffset.current = { x: e.clientX, y: e.clientY };
    } else if (isDrawing && (tool === 'pencil' || tool === 'eraser')) {
      if (selectedId) {
        setElements(prev => prev.map(el => {
          if (el.id === selectedId && el.type === 'path') {
            return { ...el, points: [...el.points, coords] };
          }
          return el;
        }));
      }
    } else if (e.touches && e.touches.length === 2 && pinchStartDist.current) {
      const dist = Math.sqrt(
        (e.touches[0].clientX - e.touches[1].clientX) ** 2 +
        (e.touches[0].clientY - e.touches[1].clientY) ** 2
      );
      const ratio = dist / pinchStartDist.current;
      const newZoom = Math.min(Math.max(pinchStartZoom.current * ratio, 10), 500);
      setZoom(Math.round(newZoom));
    }
  };

  const handleMouseUp = () => {
    if (isStickyResize.current) return;

    if (dragMode === 'creating' && tool === 'text' && selectedId) {
      setEditingId(selectedId);
      setElements(prev => prev.map(el => {
        if (el.id === selectedId && (el.h < 10 || el.w < 10)) {
          const defSize = textFormat.size || 24;
          return { ...el, h: defSize * 2, w: 150, fontSize: defSize };
        }
        return el;
      }));
    }

    if (dragMode || isDrawing) saveState();


    // AI Shape Correction check
    if (aiEnabled && tool === 'pencil' && isDrawing) {
      const lastEl = elements[elements.length - 1];
      if (lastEl && lastEl.type === 'path' && lastEl.points.length > 10) {
        const candidates = recognizeShape(lastEl.points);
        if (candidates && candidates.length > 0) {
          setPendingCorrection({
            originalId: lastEl.id,
            suggestions: candidates.map(c => ({
              ...c,
              id: Date.now() + Math.random(),
              color: lastEl.color,
              strokeWidth: lastEl.strokeWidth,
              opacity: lastEl.opacity,
              layerId: lastEl.layerId || activeLayerId,
              fill: false
            }))
          });
        }
      }
    }

    setIsDrawing(false);
    setDragMode(null);
    pinchStartDist.current = null;
    pinchStartZoom.current = null;
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    const coords = getCoords(e);
    const hit = [...elements].reverse().find(el => {
      const layer = layers.find(l => l.id === (el.layerId || 'layer-1'));
      return layer?.visible && isPointInElement(coords.x, coords.y, el);
    });

    if (hit && hit.type === 'text') {
      const layer = layers.find(l => l.id === (hit.layerId || 'layer-1'));
      if (layer?.locked) {
        setSelectedId(hit.id);
        return;
      }
      setSelectedId(hit.id);
      setEditingId(hit.id);
    }
  };



  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
    >
      {showRulers && (
        <>
          <div className="absolute top-0 left-0 right-0 h-6 bg-zinc-900 border-b border-zinc-800 flex items-end z-30" style={{ paddingLeft: '24px' }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="flex-1 border-r border-zinc-700 h-2 relative">
                <span className="absolute -top-3 left-0 text-[8px] text-zinc-500">{i * 100}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-0 bottom-0 left-0 w-6 bg-zinc-900 border-r border-zinc-800 flex flex-col items-end z-30" style={{ paddingTop: '24px' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex-1 border-b border-zinc-700 w-2 relative">
                <span className="absolute -left-4 top-0 text-[8px] text-zinc-500">{i * 100}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="relative border border-zinc-200 w-full h-full overflow-hidden select-none bg-transparent">
        <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

        <canvas
          ref={tempCanvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          className={`absolute inset-0 z-20 touch-none ${(() => {
            const activeLayer = layers.find(l => l.id === activeLayerId);
            if (activeLayer?.locked || !activeLayer?.visible) return 'cursor-not-allowed';
            return tool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair';
          })()
            } `}
        />

        {editingId && (() => {
          const el = elements.find(e => e.id === editingId);
          if (!el) return null;

          return (
            <textarea
              ref={textAreaRef}
              autoFocus
              value={el.text}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.target.blur();
                }
                e.stopPropagation();
              }}
              onChange={(e) => {
                const val = e.target.value;
                setElements(prev => prev.map(item => item.id === editingId ? { ...item, text: val } : item));
              }}
              onBlur={() => {
                if (el.text.trim() === '') {
                  setElements(prev => prev.filter(item => item.id !== editingId));
                }
                setEditingId(null);
                saveState();
              }}
              style={{
                position: 'absolute',
                left: (el.x - panOffset.x) * (zoom / 100),
                top: (el.y - panOffset.y) * (zoom / 100),
                width: Math.abs(el.w) + 'px',
                height: Math.abs(el.h) + 'px',
                font: `${el.bold ? 'bold ' : ''}${el.italic ? 'italic ' : ''}${el.fontSize}px ${el.font || 'sans-serif'} `,
                color: el.color,
                textAlign: el.align || 'left',
                background: 'transparent',
                border: '1px dashed #3b82f6',
                outline: 'none',
                padding: 0,
                margin: 0,
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: '1.2',
                zIndex: 100,
                resize: 'none',
                transformOrigin: 'top left',
                transform: `scale(${zoom / 100})`,
              }}
            />
          );
        })()}

        {pendingCorrection && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-auto">
            <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 shadow-2xl rounded-2xl p-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800/50 rounded-xl mr-2">
                <Zap size={14} className="text-yellow-400 fill-yellow-400/20" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">AI Suggestions</span>
              </div>

              <div className="h-8 w-[1px] bg-zinc-800 mx-1" />

              {pendingCorrection.suggestions.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[600px] px-1 py-1">
                  {/* "None" Option */}
                  <button
                    onClick={() => setPendingCorrection(null)}
                    className="group relative flex flex-col items-center justify-center w-12 h-12 bg-zinc-800/30 hover:bg-zinc-700/50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-dashed border-zinc-700"
                    title="None (Keep Original)"
                  >
                    <span className="text-[9px] font-bold text-zinc-500 group-hover:text-zinc-300">NONE</span>
                  </button>

                  <div className="w-[1px] h-8 bg-zinc-800/50 self-center mx-1" />

                  {pendingCorrection.suggestions.map((s, idx) => {
                    const ShapeIcon = {
                      'rect': Square,
                      'circle': Circle,
                      'triangle': Triangle,
                      'line': LineIcon,
                      'star': Star,
                      'pentagon': Pentagon,
                      'hexagon': Hexagon,
                      'callout': MessageSquare,
                      'arrow': MoveRight,
                      'rhombus': Diamond,
                      'ellipse': Circle // Reuse circle for ellipse
                    }[s.type] || Zap;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setElements(prev => prev.map(el => el.id === pendingCorrection.originalId ? { ...s, id: el.id, layerId: el.layerId } : el));
                          setPendingCorrection(null);
                          saveState();
                        }}
                        className="group relative flex items-center justify-center w-12 h-12 bg-zinc-800/50 hover:bg-blue-600 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg hover:shadow-blue-500/20"
                        title={`Add ${s.type}`}
                      >
                        <ShapeIcon size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-2 text-zinc-500 text-xs font-medium italic">
                  No similar shape found
                </div>
              )}

              <div className="h-8 w-[1px] bg-zinc-800 mx-2" />

              <button
                onClick={() => setPendingCorrection(null)}
                className="w-10 h-10 flex items-center justify-center bg-zinc-800/50 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-xl transition-all active:scale-95"
                title="Discard Suggestion"
              >
                <X size={18} />
              </button>
            </div>
            {pendingCorrection.suggestions.length > 0 && (
              <div className="text-[10px] text-zinc-500 font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                Click a shape to replace your drawing or "NONE" to keep original
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaintCanvas;
