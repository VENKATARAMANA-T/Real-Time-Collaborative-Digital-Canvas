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

      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    });

    if (canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      contextRef.current = ctx;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      if (savedData) {
        ctx.putImageData(savedData, 0, 0);
      }
    }
    if (tempCanvas) {
      const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
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
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.color;
    ctx.lineWidth = el.strokeWidth;
    ctx.globalAlpha = el.opacity;
    ctx.beginPath();

    if (el.type === 'rect') {
      ctx.strokeRect(el.x, el.y, el.w, el.h);
      if (el.fill) { ctx.fillStyle = el.color; ctx.fillRect(el.x, el.y, el.w, el.h); }
    }
    else if (el.type === 'circle') {
      const radiusX = Math.abs(el.w) / 2;
      const radiusY = Math.abs(el.h) / 2;
      const centerX = el.x + el.w / 2;
      const centerY = el.y + el.h / 2;
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      if (el.fill) { ctx.fillStyle = el.color; ctx.fill(); }
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
      if (el.fill) { ctx.fillStyle = el.color; ctx.fill(); }
      ctx.stroke();
    }
    else if (el.type === 'pentagon') drawRegularPolygon(ctx, el.x, el.y, el.w, el.h, 5, el.fill);
    else if (el.type === 'hexagon') drawRegularPolygon(ctx, el.x, el.y, el.w, el.h, 6, el.fill);
    else if (el.type === 'callout') drawCalloutShape(ctx, el.x, el.y, el.w, el.h, el.fill);
    else if (el.type === 'rhombus') {
      ctx.moveTo(el.x + el.w / 2, el.y);
      ctx.lineTo(el.x + el.w, el.y + el.h / 2);
      ctx.lineTo(el.x + el.w / 2, el.y + el.h);
      ctx.lineTo(el.x, el.y + el.h / 2);
      ctx.closePath();
      if (el.fill) { ctx.fillStyle = el.color; ctx.fill(); }
      ctx.stroke();
    } else if (el.type === 'star') drawStarShape(ctx, el.x, el.y, el.w, el.h, el.fill);
    else if (el.type === 'arrow') drawArrowShape(ctx, el.x, el.y, el.w, el.h, el.fill);
    else if (el.type === 'text') {
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
    elements.forEach(el => drawElement(tCtx, el, el.id === selectedId, el.id === editingId));
  }, [elements, selectedId, editingId, zoom, canvasSize]);

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

    if (tool === 'select' || tool === 'eraser') {
      if (tool === 'eraser') {
        const hit = [...elements].reverse().find(el => isPointInElement(coords.x, coords.y, el));
        if (hit) {
          setElements(prev => prev.filter(el => el.id !== hit.id));
          if (selectedId === hit.id) setSelectedId(null);
          if (editingId === hit.id) setEditingId(null);
          saveState();
          return;
        }
      }

      if (tool === 'select') {
        if (selectedId) {
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
          setSelectedId(hit.id);
          setDragMode('moving');
          dragOffset.current = { x: coords.x - hit.x, y: coords.y - hit.y };
          return;
        } else {
          setSelectedId(null);
          setEditingId(null);
        }
      }
    }

    if (tool === 'pencil' || tool === 'eraser') {
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
      setElements(prev => [...prev, newText]);
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
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const handleMouseMove = (e) => {
    const coords = getCoords(e);
    setCurrPos(coords);

    if (dragMode === 'moving' && selectedId) {
      setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x: coords.x - dragOffset.current.x, y: coords.y - dragOffset.current.y } : el));
    } else if (dragMode === 'resizing' && selectedId) {
      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        return { ...el, w: coords.x - el.x, h: coords.y - el.y };
      }));
    } else if (dragMode === 'creating' && selectedId) {
      setElements(prev => prev.map(el => {
        if (el.id !== selectedId) return el;
        if (el.type === 'text') {
          return { ...el, w: Math.abs(coords.x - startPos.x), h: Math.abs(coords.y - startPos.y) };
        }
        return { ...el, w: coords.x - el.x, h: coords.y - el.y };
      }));
    } else if (isDrawing && (tool === 'pencil' || tool === 'eraser')) {
      const ctx = contextRef.current;
      if (ctx) {
        ctx.strokeStyle = tool === 'eraser' ? 'white' : color;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = opacity;
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
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
