import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  drawRegularPolygon,
  drawStarShape,
  drawArrowShape,
  drawCalloutShape,
  getElementBounds,
  isPointInElement
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
  saveState
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currPos, setCurrPos] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isStickyResize = useRef(false);
  
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionRect, setSelectionRect] = useState(null);
  const multiDragOffsets = useRef({});
  
  // Pencil drawing state (decoupled from selection)
  const pencilPoints = useRef([]);
  const activeDrawingId = useRef(null);

  const initCanvas = useCallback((preserveData = false) => {
    const canvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;

    let width = 1920;
    let height = 1080;
    if (mainContainerRef.current) {
      width = mainContainerRef.current.clientWidth;
      height = mainContainerRef.current.clientHeight;
    }
    setCanvasSize({ width, height });

    let savedData = null;
    if (preserveData && contextRef.current && canvas) {
      try {
        savedData = contextRef.current.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
        console.warn("Could not save canvas state during resize", e);
      }
    }

    [canvas, tempCanvas].forEach(c => {
      if (!c) return;
      c.style.width = `${width}px`;
      c.style.height = `${height}px`;
      c.width = width * 2;
      c.height = height * 2;

      const ctx = c.getContext('2d');
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    });

    if (canvas) {
      const ctx = canvas.getContext('2d');
      contextRef.current = ctx;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      if (savedData) {
        ctx.putImageData(savedData, 0, 0);
      }
    }
    if (tempCanvas) {
      const ctx = tempCanvas.getContext('2d');
      tempContextRef.current = ctx;
    }
  }, [canvasRef, tempCanvasRef, contextRef, tempContextRef, mainContainerRef, setCanvasSize]);

  useEffect(() => {
    const timer = setTimeout(() => initCanvas(false), 50);
    const handleResize = () => initCanvas(true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [initCanvas]);

  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        setZoom(prevZoom => {
          const zoomFactor = delta > 0 ? 1.1 : 0.9;
          const newZoom = Math.min(Math.max(prevZoom * zoomFactor, 10), 500);
          return Math.round(newZoom);
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [mainContainerRef, setZoom]);

  const drawElement = (ctx, el, isSelected, isEditing) => {
    if (!ctx) return;
    ctx.save();
    // Support separate fillColor / strokeColor fields (from bot) or fall back to el.color
    const strokeCol = el.strokeColor ?? el.color;
    const fillCol   = el.fillColor   ?? el.color;
    ctx.strokeStyle = strokeCol;
    ctx.fillStyle   = fillCol;
    ctx.lineWidth = el.strokeWidth;
    ctx.globalAlpha = el.opacity;
    ctx.beginPath();

    if (el.type === 'rect') {
      ctx.strokeRect(el.x, el.y, el.w, el.h);
      if (el.fill) { ctx.fillStyle = fillCol; ctx.fillRect(el.x, el.y, el.w, el.h); }
    }
    else if (el.type === 'circle') {
      const radiusX = Math.abs(el.w) / 2;
      const radiusY = Math.abs(el.h) / 2;
      const centerX = el.x + el.w / 2;
      const centerY = el.y + el.h / 2;
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      if (el.fill) { ctx.fillStyle = fillCol; ctx.fill(); }
      ctx.strokeStyle = strokeCol;
      ctx.stroke();
    }
    else if (el.type === 'line') {
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x + el.w, el.y + el.h);
      ctx.stroke();
    }
    else if (el.type === 'triangle') {
      ctx.moveTo(el.x + el.w / 2, el.y);
      ctx.lineTo(el.x, el.y + el.h);
      ctx.lineTo(el.x + el.w, el.y + el.h);
      ctx.closePath();
      if (el.fill) { ctx.fillStyle = fillCol; ctx.fill(); }
      ctx.strokeStyle = strokeCol; ctx.stroke();
    }
    else if (el.type === 'pentagon') drawRegularPolygon(ctx, el.x, el.y, el.w, el.h, 5, el.fill, fillCol, strokeCol);
    else if (el.type === 'hexagon') drawRegularPolygon(ctx, el.x, el.y, el.w, el.h, 6, el.fill, fillCol, strokeCol);
    else if (el.type === 'callout') drawCalloutShape(ctx, el.x, el.y, el.w, el.h, el.fill, fillCol, strokeCol);
    else if (el.type === 'rhombus') {
      ctx.moveTo(el.x + el.w / 2, el.y);
      ctx.lineTo(el.x + el.w, el.y + el.h / 2);
      ctx.lineTo(el.x + el.w / 2, el.y + el.h);
      ctx.lineTo(el.x, el.y + el.h / 2);
      ctx.closePath();
      if (el.fill) { ctx.fillStyle = fillCol; ctx.fill(); }
      ctx.strokeStyle = strokeCol; ctx.stroke();
    } else if (el.type === 'star') drawStarShape(ctx, el.x, el.y, el.w, el.h, el.fill, fillCol, strokeCol);
    else if (el.type === 'arrow') drawArrowShape(ctx, el.x, el.y, el.w, el.h, el.fill, fillCol, strokeCol);    else if (el.type === 'path') {
      if (el.points && el.points.length > 0) {
        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length - 2; i++) {
          const xc = (el.points[i].x + el.points[i + 1].x) / 2;
          const yc = (el.points[i].y + el.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc);
        }
        if (el.points.length > 2) {
          ctx.quadraticCurveTo(
            el.points[el.points.length - 2].x,
            el.points[el.points.length - 2].y,
            el.points[el.points.length - 1].x,
            el.points[el.points.length - 1].y
          );
        } else if (el.points.length === 2) {
          ctx.lineTo(el.points[1].x, el.points[1].y);
        }
        ctx.stroke();
        ctx.restore();
      }
    }    else if (el.type === 'text') {
      if (!isEditing) {
        const fontSize = el.fontSize || 24;
        const lineHeight = fontSize * 1.2;
        const fontStr = `${el.bold ? 'bold ' : ''}${el.italic ? 'italic ' : ''}${fontSize}px ${el.font || 'sans-serif'}`;
        ctx.font = fontStr;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';

        const maxWidth = Math.abs(el.w);
        const paragraphs = (el.text || '').split('\n');
        const lines = [];

        paragraphs.forEach(paragraph => {
          const pWords = paragraph.split(' ');
          let currentLine = pWords[0];
          for (let i = 1; i < pWords.length; i++) {
            const word = pWords[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) currentLine += " " + word;
            else { lines.push(currentLine); currentLine = word; }
          }
          lines.push(currentLine);
        });

        if (el.background) {
          ctx.save();
          ctx.fillStyle = el.backgroundColor || 'rgba(255,255,255,0.8)';
          ctx.fillRect(el.x, el.y, el.w, el.h);
          ctx.restore();
        }

        ctx.fillStyle = el.color;
        lines.forEach((line, i) => {
          const lineY = el.y + (i * lineHeight);
          let lineX = el.x;
          const m = ctx.measureText(line);
          if (el.align === 'center') lineX = el.x + (el.w - m.width) / 2;
          else if (el.align === 'right') lineX = el.x + (el.w - m.width);

          ctx.fillText(line, lineX, lineY);
          if (el.underline || el.strikethrough) {
            if (el.underline) {
              ctx.beginPath();
              ctx.moveTo(lineX, lineY + fontSize + 2);
              ctx.lineTo(lineX + m.width, lineY + fontSize + 2);
              ctx.lineWidth = 1;
              ctx.stroke();
            }
            if (el.strikethrough) {
              ctx.beginPath();
              ctx.moveTo(lineX, lineY + fontSize / 2);
              ctx.lineTo(lineX + m.width, lineY + fontSize / 2);
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
      }
    }

    if (isSelected && !isEditing) {
      const bounds = getElementBounds(el);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8);

      ctx.setLineDash([]);
      ctx.fillStyle = 'white';
      ctx.fillRect(bounds.x + bounds.w + 2, bounds.y + bounds.h + 2, 8, 8);
      ctx.strokeRect(bounds.x + bounds.w + 2, bounds.y + bounds.h + 2, 8, 8);
    }
    ctx.restore();
  };

  useEffect(() => {
    const tCtx = tempContextRef.current;
    if (!tCtx) return;
    tCtx.clearRect(0, 0, 2304, 1296);
    elements.forEach(el => {
      const isSel = el.id === selectedId || selectedIds.has(el.id);
      drawElement(tCtx, el, isSel, el.id === editingId);
    });
    
    // Draw selection rectangle
    if (selectionRect) {
      tCtx.save();
      tCtx.setLineDash([4, 4]);
      tCtx.strokeStyle = '#3b82f6';
      tCtx.lineWidth = 1;
      tCtx.fillStyle = 'rgba(59, 130, 246, 0.08)';
      tCtx.fillRect(selectionRect.x, selectionRect.y, selectionRect.w, selectionRect.h);
      tCtx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.w, selectionRect.h);
      tCtx.setLineDash([]);
      tCtx.restore();
    }
  }, [elements, selectedId, selectedIds, editingId, zoom, canvasSize, selectionRect]);

  const getCoords = (e) => {
    const rect = tempCanvasRef.current.getBoundingClientRect();
    const scale = zoom / 100;
    return {
      x: ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) / scale,
      y: ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) / scale
    };
  };

  const handleMouseDown = (e) => {
    if (isStickyResize.current) {
      isStickyResize.current = false;
      setDragMode(null);
      saveState();
      return;
    }

    const coords = getCoords(e);
    setStartPos(coords);
    const shiftKey = e.shiftKey;

    if (tool === 'select' || tool === 'eraser') {
      if (tool === 'eraser') {
        const hit = [...elements].reverse().find(el => isPointInElement(coords.x, coords.y, el));
        if (hit) {
          const nextElements = elements.filter(el => el.id !== hit.id);
          setElements(nextElements);
          if (selectedId === hit.id) setSelectedId(null);
          if (editingId === hit.id) setEditingId(null);
          setSelectedIds(prev => { const n = new Set(prev); n.delete(hit.id); return n; });
          saveState(nextElements);
          return;
        }
      }

      if (tool === 'select') {
        // Check resize handle on single selected element
        if (selectedId && selectedIds.size <= 1) {
          const el = elements.find(item => item.id === selectedId);
          if (el) {
            const bounds = getElementBounds(el);
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

        const hit = [...elements].reverse().find(el => isPointInElement(coords.x, coords.y, el));
        if (hit) {
          if (shiftKey) {
            // Shift-click: toggle in multi-select
            setSelectedIds(prev => {
              const n = new Set(prev);
              if (n.has(hit.id)) { n.delete(hit.id); } else { n.add(hit.id); }
              return n;
            });
            setSelectedId(hit.id);
            return;
          }

          // If clicking an already-selected element in a multi-selection, start multi-drag
          if (selectedIds.has(hit.id) && selectedIds.size > 1) {
            multiDragOffsets.current = {};
            elements.forEach(el => {
              if (selectedIds.has(el.id)) {
                multiDragOffsets.current[el.id] = { x: coords.x - el.x, y: coords.y - el.y };
              }
            });
            setDragMode('multi-moving');
            return;
          }

          // Single click without shift: select only this element
          setSelectedId(hit.id);
          setSelectedIds(new Set([hit.id]));
          setDragMode('moving');
          dragOffset.current = { x: coords.x - hit.x, y: coords.y - hit.y };
          return;
        } else {
          // Clicked empty space: start rubber-band selection
          setSelectedId(null);
          setSelectedIds(new Set());
          setEditingId(null);
          setSelectionRect({ x: coords.x, y: coords.y, w: 0, h: 0 });
          setDragMode('selecting');
        }
      }
    }

    if (tool === 'pencil') {
      setIsDrawing(true);
      setSelectedId(null);
      setSelectedIds(new Set());
      pencilPoints.current = [{ x: coords.x, y: coords.y }];
      const newId = Date.now();
      activeDrawingId.current = newId;
      const newPath = {
        id: newId,
        type: 'path',
        points: [{ x: coords.x, y: coords.y }],
        x: coords.x, y: coords.y, w: 0, h: 0,
        color, strokeWidth, opacity,
        fill: false
      };
      setElements(prev => [...prev, newPath]);
      setDragMode('creating');
      return;
    }

    if (tool === 'eraser') {
      setIsDrawing(true);
      if (contextRef.current) {
        contextRef.current.beginPath();
        contextRef.current.moveTo(coords.x, coords.y);
      }
      return;
    }

    if (tool === 'text') {
      const hit = [...elements].reverse().find(el => isPointInElement(coords.x, coords.y, el));
      if (hit && hit.type === 'text') {
        setSelectedId(hit.id);
        setEditingId(hit.id);
        return;
      }

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
        fontSize: textFormat.size
      };
      setElements([...elements, newText]);
      setSelectedId(newId);
      return;
    }

    setIsDrawing(true);
    setDragMode('creating');
    const newEl = {
      id: Date.now(),
      type: tool,
      x: coords.x, y: coords.y, w: 0, h: 0,
      color, strokeWidth, opacity,
      fill: fillMode
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleMouseMove = (e) => {
    const coords = getCoords(e);
    setCurrPos(coords);

    if (dragMode === 'multi-moving') {
      setElements(prev => prev.map(el => {
        if (!selectedIds.has(el.id)) return el;
        const off = multiDragOffsets.current[el.id];
        if (!off) return el;
        const nx = coords.x - off.x;
        const ny = coords.y - off.y;
        if (el.type === 'path' && el.points) {
          const dx = nx - el.x;
          const dy = ny - el.y;
          return { ...el, x: nx, y: ny, points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
        }
        return { ...el, x: nx, y: ny };
      }));
    } else if (dragMode === 'moving' && selectedId) {
      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        const nx = coords.x - dragOffset.current.x;
        const ny = coords.y - dragOffset.current.y;
        if (el.type === 'path' && el.points) {
          const dx = nx - el.x;
          const dy = ny - el.y;
          return { ...el, x: nx, y: ny, points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
        }
        return { ...el, x: nx, y: ny };
      }));
    } else if (dragMode === 'resizing' && selectedId) {
      setElements(elements.map(el => {
        if (el.id !== selectedId) return el;
        return { ...el, w: coords.x - el.x, h: coords.y - el.y };
      }));
    } else if (dragMode === 'selecting') {
      setSelectionRect(prev => prev ? {
        ...prev,
        w: coords.x - prev.x,
        h: coords.y - prev.y
      } : null);
    } else if (dragMode === 'creating' && activeDrawingId.current && tool === 'pencil') {
      setElements(prev => prev.map(el => {
        if (el.id !== activeDrawingId.current) return el;
        pencilPoints.current.push({ x: coords.x, y: coords.y });
        const pts = [...pencilPoints.current];
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        const minX = Math.min(...xs), minY = Math.min(...ys);
        const maxX = Math.max(...xs), maxY = Math.max(...ys);
        return { ...el, points: pts, x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      }));
    } else if (dragMode === 'creating' && selectedId) {
      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        if (el.type === 'text') {
          return { ...el, w: Math.abs(coords.x - startPos.x), h: Math.abs(coords.y - startPos.y) };
        }
        return { ...el, w: coords.x - el.x, h: coords.y - el.y };
      }));
    } else if (isDrawing && tool === 'eraser') {
      const ctx = contextRef.current;
      if (ctx) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = opacity;
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    if (isStickyResize.current) return;

    if (dragMode === 'selecting' && selectionRect) {
      // Normalize the rectangle (handle negative w/h from dragging up-left)
      const rx = selectionRect.w < 0 ? selectionRect.x + selectionRect.w : selectionRect.x;
      const ry = selectionRect.h < 0 ? selectionRect.y + selectionRect.h : selectionRect.y;
      const rw = Math.abs(selectionRect.w);
      const rh = Math.abs(selectionRect.h);

      const ids = new Set();
      elements.forEach(el => {
        const b = getElementBounds(el);
        // Check if element bounds intersect the selection rectangle
        if (b.x < rx + rw && b.x + b.w > rx && b.y < ry + rh && b.y + b.h > ry) {
          ids.add(el.id);
        }
      });
      setSelectedIds(ids);
      if (ids.size === 1) {
        setSelectedId([...ids][0]);
      } else if (ids.size > 1) {
        setSelectedId([...ids][0]);
      }
      setSelectionRect(null);
      setDragMode(null);
      return;
    }

    if (dragMode === 'creating' && tool === 'pencil' && activeDrawingId.current) {
      // Finalize pencil path — don't select it, keep canvas clean
      pencilPoints.current = null;
      activeDrawingId.current = null;
    }

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
    setIsDrawing(false);
    setDragMode(null);
  };

  const handleDoubleClick = (e) => {
    const coords = getCoords(e);
    const hit = [...elements].reverse().find(el => isPointInElement(coords.x, coords.y, el));

    if (hit) {
      if (hit.type === 'text') {
        setSelectedId(hit.id);
        setEditingId(hit.id);
      } else {
        setSelectedId(hit.id);
        setDragMode('resizing');
        isStickyResize.current = true;
      }
    }
  };

  return (
    <div
      className="relative shadow-[0_0_80px_rgba(0,0,0,0.6)] transition-transform duration-200 ease-out origin-center"
      style={{
        transform: `scale(${zoom / 100})`,
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`
      }}
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

      <div className="relative border border-zinc-800 bg-white w-full h-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 z-10" />

        {showGridlines && (
          <div
            className="absolute inset-0 z-[15] pointer-events-none opacity-[0.2]"
            style={{
              backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
              backgroundSize: `${gridSize}px ${gridSize}px`
            }}
          />
        )}

        <canvas
          ref={tempCanvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          className="relative z-20 touch-none cursor-crosshair"
        />

        {editingId && (() => {
          const el = elements.find(e => e.id === editingId);
          if (!el) return null;

          return (
            <textarea
              ref={textAreaRef}
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
                left: el.x,
                top: el.y,
                width: Math.abs(el.w) + 'px',
                height: Math.abs(el.h) + 'px',
                font: `${el.bold ? 'bold ' : ''}${el.italic ? 'italic ' : ''}${el.fontSize}px ${el.font || 'sans-serif'}`,
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
              }}
            />
          );
        })()}
      </div>
    </div>
  );
};

export default PaintCanvas;
