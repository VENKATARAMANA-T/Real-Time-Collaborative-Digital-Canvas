import { useRef, useEffect, useState } from 'react';

function Canvas({
  onCanvasClick,
  canEdit = true,
  onCursorMove,
  onCursorLeave,
  cursors,
  activeTool,
  settings,
  elements,
  onElementsChange,
  onActionStart,
  selectedElementId,
  onSelectElement
}) {
  const canvasRef = useRef(null);
  const helperCanvasRef = useRef(null); // Off-screen canvas for ink layer
  const containerRef = useRef(null);

  // Viewport State for Zoom/Pan
  const [viewport, setViewport] = useState({ scale: 1, offset: { x: 0, y: 0 } });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const [interactionMode, setInteractionMode] = useState('none');
  const [resizeHandle, setResizeHandle] = useState(null);

  // Refs for tracking mouse movement without triggering re-renders constantly
  const currentAction = useRef(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Initialize helper canvas
  useEffect(() => {
    if (!helperCanvasRef.current) {
      helperCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  // Keyboard Listeners for Panning (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat && (e.target === document.body || e.target === containerRef.current)) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Zoom Logic (Wheel & Pinch)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();

      setViewport((prev) => {
        const { left, top } = container.getBoundingClientRect();
        const mouseX = e.clientX - left;
        const mouseY = e.clientY - top;

        // Normalize Delta across browsers (Lines vs Pixels)
        let delta = e.deltaY;
        if (e.deltaMode === 1) {
          delta *= 40;
        } else if (e.deltaMode === 2) {
          delta *= 800;
        }

        // Determine Zoom Direction & Intensity
        let zoomChange = 0;
        const factor = 0.0015;

        if (e.ctrlKey) {
          // Trackpad Pinch
          zoomChange = -delta * factor * 3;
        } else {
          // Mouse Wheel
          zoomChange = delta * factor;
        }

        const newScale = Math.min(Math.max(0.1, prev.scale * Math.exp(zoomChange)), 10);

        // Calculate new offset to zoom towards mouse pointer
        const worldX = (mouseX - prev.offset.x) / prev.scale;
        const worldY = (mouseY - prev.offset.y) / prev.scale;

        const newOffsetX = mouseX - worldX * newScale;
        const newOffsetY = mouseY - worldY * newScale;

        return { scale: newScale, offset: { x: newOffsetX, y: newOffsetY } };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Resize handling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current && helperCanvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        if (canvasRef.current.width !== width * dpr || canvasRef.current.height !== height * dpr) {
          canvasRef.current.width = width * dpr;
          canvasRef.current.height = height * dpr;
          canvasRef.current.style.width = `${width}px`;
          canvasRef.current.style.height = `${height}px`;

          helperCanvasRef.current.width = width * dpr;
          helperCanvasRef.current.height = height * dpr;

          drawScene();
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    handleResize();
    return () => resizeObserver.disconnect();
  }, [elements, selectedElementId, viewport]);

  // Redraw
  useEffect(() => {
    drawScene();
  }, [elements, selectedElementId, viewport]);

  const getCoordinates = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0, screenX: 0, screenY: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX;
    let clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Screen Coordinates
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    // Convert to World Coordinates using Viewport
    const worldX = (screenX - viewport.offset.x) / viewport.scale;
    const worldY = (screenY - viewport.offset.y) / viewport.scale;

    return { x: worldX, y: worldY, screenX, screenY };
  };

  const isPointInElement = (x, y, element) => {
    const buffer = 10 / viewport.scale;
    const rx = element.width < 0 ? element.x + element.width : element.x;
    const ry = element.height < 0 ? element.y + element.height : element.y;
    const rw = Math.abs(element.width);
    const rh = Math.abs(element.height);

    return x >= rx - buffer && x <= rx + rw + buffer && y >= ry - buffer && y <= ry + rh + buffer;
  };

  const getElementAtPosition = (x, y) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (element.type === 'freehand' || element.isEraser) continue;
      if (isPointInElement(x, y, element)) {
        return element;
      }
    }
    return null;
  };

  const getResizeHandleAtPosition = (x, y, element) => {
    const handleSize = 12 / viewport.scale;
    const { x: ex, y: ey, width: w, height: h } = element;

    const handles = [
      { id: 'tl', x: ex, y: ey },
      { id: 'tr', x: ex + w, y: ey },
      { id: 'bl', x: ex, y: ey + h },
      { id: 'br', x: ex + w, y: ey + h }
    ];

    for (const handle of handles) {
      if (Math.abs(x - handle.x) <= handleSize && Math.abs(y - handle.y) <= handleSize) {
        return handle.id;
      }
    }
    return null;
  };

  // --- Rendering Logic ---

  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const paragraphs = text.split('\n');
    let currentY = y;
    paragraphs.forEach((paragraph) => {
      const words = paragraph.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    });
  };

  const drawElement = (ctx, element) => {
    const { x, y, width, height, style, points, type, shapeType } = element;

    ctx.save();

    if (element.isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = style.eraserSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = style.brushColor;

      if (type === 'sticky-note') {
        const noteBg = style.noteFillColor !== undefined ? style.noteFillColor : style.fillColor !== 'transparent' ? style.fillColor : '#fef08a';
        ctx.fillStyle = noteBg;
        ctx.globalAlpha = style.fillOpacity / 100;

        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.fillRect(x, y, width, height);
        ctx.shadowColor = 'transparent';
        ctx.globalAlpha = 1;

        if (element.id !== selectedElementId) {
          const fontSize = style.fontSize || 16;
          const fontFamily = style.fontFamily || 'Inter';
          const fontWeight = style.fontWeight || 'normal';
          const fontStyle = style.fontStyle || 'normal';

          ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
          ctx.fillStyle = style.brushColor || '#000000';
          ctx.textBaseline = 'top';

          let textX = x + 20;
          if (style.textAlign === 'center') textX = x + width / 2;
          if (style.textAlign === 'right') textX = x + width - 20;
          ctx.textAlign = style.textAlign || 'left';

          if (element.text) {
            wrapText(ctx, element.text, textX, y + 20, width - 40, fontSize * 1.5);
          } else {
            ctx.fillStyle = style.brushColor ? `${style.brushColor}20` : 'rgba(0,0,0,0.1)';
            if (style.textAlign === 'center') {
              ctx.fillRect(x + 20, y + 40, width - 40, 6);
              ctx.fillRect(x + 20, y + 60, width - 40, 6);
              ctx.fillRect(x + 40, y + 80, width - 80, 6);
            } else if (style.textAlign === 'right') {
              ctx.fillRect(x + 40, y + 40, width - 60, 6);
              ctx.fillRect(x + 20, y + 60, width - 40, 6);
              ctx.fillRect(x + 60, y + 80, width - 80, 6);
            } else {
              ctx.fillRect(x + 20, y + 40, width - 60, 6);
              ctx.fillRect(x + 20, y + 60, width - 40, 6);
              ctx.fillRect(x + 20, y + 80, width - 80, 6);
            }
          }
        }
      } else if (type === 'shape') {
        ctx.strokeStyle = style.brushColor;
        ctx.lineWidth = style.strokeWidth;
        ctx.globalAlpha = style.strokeOpacity / 100;
        if (style.strokeStyle === 'dashed') ctx.setLineDash([10, 5]);
        else if (style.strokeStyle === 'dotted') ctx.setLineDash([2, 4]);
        else ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = style.brushColor;
        ctx.lineWidth = style.brushSize;
        ctx.globalAlpha = style.brushOpacity / 100;
        if (style.brushType === 'dashed') ctx.setLineDash([style.brushSize * 2, style.brushSize * 1.5]);
        else if (style.brushType === 'dotted') ctx.setLineDash([1, style.brushSize * 2]);
        else ctx.setLineDash([]);

        if (style.brushStyle === 'highlighter') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 0.5;
        }
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    ctx.beginPath();

    if (type === 'freehand' && points) {
      if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
      }
    } else if (type === 'shape') {
      if (shapeType === 'rectangle') {
        ctx.rect(x, y, width, height);
      } else if (shapeType === 'circle') {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const rx = Math.abs(width) / 2;
        const ry = Math.abs(height) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      } else if (shapeType === 'triangle') {
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.closePath();
      } else if (shapeType === 'arrow') {
        const headlen = 10;
        const tox = x + width;
        const toy = y + height;
        const angle = Math.atan2(toy - y, tox - x);
        ctx.moveTo(x, y);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
      } else if (shapeType === 'star') {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const outerRadius = Math.min(Math.abs(width), Math.abs(height)) / 2;
        const innerRadius = outerRadius / 2;
        const spikes = 5;
        let rot = (Math.PI / 2) * 3;
        let step = Math.PI / spikes;
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
          rot += step;
          ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
          rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
      } else if (shapeType === 'line') {
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height);
      }
    }

    if (type !== 'sticky-note') {
      ctx.stroke();
    }

    if (
      type === 'shape' &&
      style.fillColor !== 'transparent' &&
      style.fillOpacity > 0 &&
      !element.isEraser &&
      shapeType !== 'line' &&
      shapeType !== 'arrow'
    ) {
      ctx.fillStyle = style.fillColor;
      ctx.globalAlpha = style.fillOpacity / 100;
      ctx.fill();
    }

    ctx.restore();
  };

  const drawSelection = (ctx, element) => {
    const { x, y, width, height } = element;
    const handleSize = 8 / viewport.scale;

    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1 / viewport.scale;
    ctx.setLineDash([5 / viewport.scale, 5 / viewport.scale]);
    ctx.strokeRect(x, y, width, height);

    // Handles
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.setLineDash([]);

    const handles = [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x, y: y + height },
      { x: x + width, y: y + height }
    ];

    handles.forEach((h) => {
      ctx.beginPath();
      ctx.rect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();
  };

  const drawScene = () => {
    const ctx = canvasRef.current?.getContext('2d');
    const helperCtx = helperCanvasRef.current?.getContext('2d');

    if (!ctx || !helperCtx || !canvasRef.current || !helperCanvasRef.current) return;

    const dpr = window.devicePixelRatio || 1;

    // Reset transforms to identity for clearing
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    helperCtx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    helperCtx.clearRect(0, 0, helperCanvasRef.current.width, helperCanvasRef.current.height);

    // Apply DPR + Viewport transform
    const transformX = viewport.offset.x * dpr;
    const transformY = viewport.offset.y * dpr;
    const transformScale = viewport.scale * dpr;

    ctx.setTransform(transformScale, 0, 0, transformScale, transformX, transformY);
    helperCtx.setTransform(transformScale, 0, 0, transformScale, transformX, transformY);

    // Draw Shapes & Sticky Notes to Main Canvas
    elements.filter((el) => el.type === 'shape' || el.type === 'sticky-note').forEach((el) => drawElement(ctx, el));

    // Draw Ink & Eraser to Helper Canvas
    elements.forEach((el) => {
      if (el.type === 'freehand' || el.isEraser) {
        drawElement(helperCtx, el);
      }
    });

    // Composite Helper Canvas (Ink) onto Main Canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(helperCanvasRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    // Restore transform for Selection UI
    ctx.setTransform(transformScale, 0, 0, transformScale, transformX, transformY);

    // Draw Selection UI (in World Space)
    if (selectedElementId) {
      const selectedEl = elements.find((el) => el.id === selectedElementId);
      if (selectedEl && (selectedEl.type === 'shape' || selectedEl.type === 'sticky-note')) {
        drawSelection(ctx, selectedEl);
      }
    }
  };

  // --- Interaction Logic ---

  const handleMouseDown = (e) => {
    if (onCanvasClick) onCanvasClick();

    if (!canEdit) {
      return;
    }

    // Panning Logic (Spacebar + Click)
    if (isSpacePressed) {
      setIsPanning(true);
      const { screenX, screenY } = getCoordinates(e);
      currentAction.current = {
        startX: 0,
        startY: 0,
        lastMouseX: screenX,
        lastMouseY: screenY
      };
      return;
    }

    const { x, y } = getCoordinates(e);

    // --- Shape Filler Logic ---
    if (activeTool === 'shape-filler') {
      const targetElement = getElementAtPosition(x, y);
      if (targetElement && targetElement.type === 'shape') {
        onActionStart();
        const newElements = elements.map((el) => {
          if (el.id === targetElement.id) {
            return {
              ...el,
              style: {
                ...el.style,
                fillColor: settings.fillColor,
                fillOpacity: settings.fillOpacity
              }
            };
          }
          return el;
        });
        onElementsChange(newElements);
      }
      return;
    }

    if (activeTool === 'sticky-note') {
      onActionStart();
      const noteSize = 180;
      const newElement = {
        id: generateId(),
        type: 'sticky-note',
        x: x - noteSize / 2,
        y: y - noteSize / 2,
        width: noteSize,
        height: noteSize,
        text: '',
        style: {
          ...settings,
          noteFillColor: settings.noteFillColor || '#fef08a'
        }
      };
      onElementsChange([...elements, newElement]);
      onSelectElement(newElement.id);
      setInteractionMode('none');
      return;
    }

    if (activeTool === 'selector') {
      if (selectedElementId) {
        const selectedEl = elements.find((el) => el.id === selectedElementId);
        if (selectedEl) {
          const handle = getResizeHandleAtPosition(x, y, selectedEl);
          if (handle) {
            onActionStart();
            setInteractionMode('resizing');
            setResizeHandle(handle);
            currentAction.current = { startX: x, startY: y, currentId: selectedEl.id, originalElement: { ...selectedEl } };
            return;
          }
        }
      }

      const clickedElement = getElementAtPosition(x, y);
      if (clickedElement) {
        if (clickedElement.id !== selectedElementId) {
          onActionStart();
        }
        onSelectElement(clickedElement.id);
        setInteractionMode('moving');
        currentAction.current = { startX: x, startY: y, currentId: clickedElement.id, originalElement: { ...clickedElement } };
      } else {
        // Panning when clicking on empty space
        onSelectElement(null);
        setIsPanning(true);
        const { screenX, screenY } = getCoordinates(e);
        currentAction.current = {
          startX: 0,
          startY: 0,
          lastMouseX: screenX,
          lastMouseY: screenY
        };
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
      }
    } else if (activeTool === 'brush' || activeTool === 'eraser') {
      if (activeTool === 'eraser') {
        const targetElement = getElementAtPosition(x, y);
        if (targetElement && (targetElement.type === 'shape' || targetElement.type === 'sticky-note')) {
          onActionStart();
          const newElements = elements.filter((el) => el.id !== targetElement.id);
          onElementsChange(newElements);
          return;
        }
      }

      onActionStart();
      setInteractionMode('drawing');

      const newElement = {
        id: generateId(),
        type: 'freehand',
        points: [{ x, y }],
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        style: settings,
        isEraser: activeTool === 'eraser'
      };

      let initialElements = [...elements, newElement];
      if (activeTool === 'eraser') {
        const eraserSize = settings.eraserSize;
        const eraserRadius = eraserSize / 2;
        initialElements = initialElements.filter((el) => {
          if (el.type !== 'shape' && el.type !== 'sticky-note') return true;
          const rx = el.width < 0 ? el.x + el.width : el.x;
          const ry = el.height < 0 ? el.y + el.height : el.y;
          const rw = Math.abs(el.width);
          const rh = Math.abs(el.height);
          const testX = Math.max(rx, Math.min(x, rx + rw));
          const testY = Math.max(ry, Math.min(y, ry + rh));
          const distX = x - testX;
          const distY = y - testY;
          const distance = Math.sqrt(distX * distX + distY * distY);
          return distance > eraserRadius;
        });
      }

      onElementsChange(initialElements);
      currentAction.current = { startX: x, startY: y, currentId: newElement.id };
      onSelectElement(newElement.id);
    } else if (activeTool === 'shapes') {
      onActionStart();
      setInteractionMode('drawing');
      const newElement = {
        id: generateId(),
        type: 'shape',
        shapeType: settings.activeShape,
        x,
        y,
        width: 0,
        height: 0,
        style: settings
      };
      onElementsChange([...elements, newElement]);
      currentAction.current = { startX: x, startY: y, currentId: newElement.id };
      onSelectElement(newElement.id);
    }
  };

  const handlePointerMove = (e) => {
    if (!canEdit || !onCursorMove || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    if (x < 0 || y < 0 || x > 1 || y > 1) return;
    onCursorMove({ x, y });
  };

  const handlePointerLeave = () => {
    if (!canEdit || !onCursorLeave) return;
    onCursorLeave();
  };

  const handleMouseMove = (e) => {
    const { x, y, screenX, screenY } = getCoordinates(e);

    // Panning
    if (isPanning && currentAction.current) {
      const dx = screenX - (currentAction.current.lastMouseX || 0);
      const dy = screenY - (currentAction.current.lastMouseY || 0);

      setViewport((prev) => ({
        ...prev,
        offset: { x: prev.offset.x + dx, y: prev.offset.y + dy }
      }));

      currentAction.current.lastMouseX = screenX;
      currentAction.current.lastMouseY = screenY;
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
      return;
    }

    // Cursor Logic
    if (isSpacePressed) {
      if (containerRef.current) containerRef.current.style.cursor = isPanning ? 'grabbing' : 'grab';
    } else if (activeTool === 'selector') {
      let cursor = 'grab';

      const hoveredElement = getElementAtPosition(x, y);
      const selectedEl = selectedElementId ? elements.find((el) => el.id === selectedElementId) : null;

      if (selectedEl) {
        const handle = getResizeHandleAtPosition(x, y, selectedEl);
        if (handle) {
          cursor = handle === 'tl' || handle === 'br' ? 'nwse-resize' : 'nesw-resize';
        } else if (isPointInElement(x, y, selectedEl)) {
          cursor = 'move';
        } else if (hoveredElement) {
          cursor = 'move';
        }
      } else if (hoveredElement) {
        cursor = 'move';
      }

      if (containerRef.current) containerRef.current.style.cursor = cursor;
    } else if (activeTool === 'shape-filler') {
      if (containerRef.current) containerRef.current.style.cursor = getElementAtPosition(x, y)?.type === 'shape' ? 'copy' : 'default';
    } else if (activeTool === 'sticky-note') {
      if (containerRef.current) containerRef.current.style.cursor = 'copy';
    } else {
      if (containerRef.current) containerRef.current.style.cursor = activeTool === 'eraser' ? 'cell' : 'crosshair';
    }

    if (interactionMode === 'none' || !currentAction.current) return;

    if (interactionMode === 'drawing') {
      let currentElements = [...elements];

      if (activeTool === 'eraser') {
        const eraserSize = settings.eraserSize;
        const eraserRadius = eraserSize / 2;
        currentElements = currentElements.filter((el) => {
          if (el.type !== 'shape' && el.type !== 'sticky-note') return true;
          const rx = el.width < 0 ? el.x + el.width : el.x;
          const ry = el.height < 0 ? el.y + el.height : el.y;
          const rw = Math.abs(el.width);
          const rh = Math.abs(el.height);
          const testX = Math.max(rx, Math.min(x, rx + rw));
          const testY = Math.max(ry, Math.min(y, ry + rh));
          const distX = x - testX;
          const distY = y - testY;
          const distance = Math.sqrt(distX * distX + distY * distY);
          return distance > eraserRadius;
        });
      }

      const updatedElements = currentElements.map((el) => {
        if (el.id === currentAction.current?.currentId) {
          if (el.type === 'freehand') {
            return { ...el, points: [...(el.points || []), { x, y }] };
          } else if (el.type === 'shape') {
            return {
              ...el,
              width: x - currentAction.current.startX,
              height: y - currentAction.current.startY
            };
          }
        }
        return el;
      });
      onElementsChange(updatedElements);
    } else if (interactionMode === 'moving' && currentAction.current.originalElement) {
      const dx = x - currentAction.current.startX;
      const dy = y - currentAction.current.startY;
      const updatedElements = elements.map((el) => {
        if (el.id === currentAction.current?.currentId) {
          return {
            ...el,
            x: currentAction.current.originalElement.x + dx,
            y: currentAction.current.originalElement.y + dy
          };
        }
        return el;
      });
      onElementsChange(updatedElements);
    } else if (interactionMode === 'resizing' && currentAction.current.originalElement && resizeHandle) {
      const original = currentAction.current.originalElement;
      const dx = x - currentAction.current.startX;
      const dy = y - currentAction.current.startY;

      let newX = original.x;
      let newY = original.y;
      let newW = original.width;
      let newH = original.height;

      switch (resizeHandle) {
        case 'br':
          newW = original.width + dx;
          newH = original.height + dy;
          break;
        case 'tr':
          newY = original.y + dy;
          newW = original.width + dx;
          newH = original.height - dy;
          break;
        case 'bl':
          newX = original.x + dx;
          newW = original.width - dx;
          newH = original.height + dy;
          break;
        case 'tl':
          newX = original.x + dx;
          newY = original.y + dy;
          newW = original.width - dx;
          newH = original.height - dy;
          break;
        default:
          break;
      }

      const updatedElements = elements.map((el) => {
        if (el.id === currentAction.current?.currentId) {
          return { ...el, x: newX, y: newY, width: newW, height: newH };
        }
        return el;
      });
      onElementsChange(updatedElements);
    }
  };

  const handleMouseUp = () => {
    setInteractionMode('none');
    setResizeHandle(null);
    setIsPanning(false);
    currentAction.current = null;
  };

  const handleTextChange = (id, text) => {
    onElementsChange(elements.map((el) => (el.id === id ? { ...el, text } : el)));
  };

  return (
    <div ref={containerRef} className="flex-1 relative bg-background-dark canvas-grid overflow-hidden">
      {cursors}
      <canvas
        ref={canvasRef}
        className="touch-none block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseMoveCapture={handlePointerMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={(event) => {
          handlePointerLeave();
          handleMouseUp(event);
        }}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={(event) => {
          handlePointerLeave();
          handleMouseUp(event);
        }}
      />
      {/* Overlay for text editing (Scaled/Positioned for Zoom) */}
      {canEdit && selectedElementId &&
        elements
          .filter((el) => el.id === selectedElementId && el.type === 'sticky-note')
          .map((el) => (
            <textarea
              key={el.id}
              value={el.text || ''}
              onChange={(e) => handleTextChange(el.id, e.target.value)}
              style={{
                position: 'absolute',
                // Apply Viewport Transform to Overlay
                left: `${(el.x + 20) * viewport.scale + viewport.offset.x}px`,
                top: `${(el.y + 20) * viewport.scale + viewport.offset.y}px`,
                width: `${(el.width - 40) * viewport.scale}px`,
                height: `${(el.height - 40) * viewport.scale}px`,
                fontSize: `${(el.style.fontSize || 16) * viewport.scale}px`,
                resize: 'none',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: el.style.fontFamily || 'Inter',
                fontWeight: el.style.fontWeight || 'normal',
                fontStyle: el.style.fontStyle || 'normal',
                textDecoration: el.style.textDecoration || 'none',
                textAlign: el.style.textAlign || 'left',
                color: el.style.brushColor || '#000000',
                lineHeight: '1.5',
                overflow: 'hidden',
                transformOrigin: 'top left'
              }}
              className="focus:outline-none"
              placeholder="Type something..."
              autoFocus
            />
          ))}
    </div>
  );
}

export default Canvas;
