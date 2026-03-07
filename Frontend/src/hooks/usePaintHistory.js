import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50;

const usePaintHistory = (canvasRef, elements, layers, activeLayerId, canvasBgColor, showCheckerboard) => {
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const saveState = useCallback((elementsOverride, layersOverride, activeLayerOverride, canvasBgOverride, showCheckerboardOverride) => {
    // Faster cloning that preserves object references (like HTMLImageElement)
    const cloneElements = (els) => els.map(el => {
      const cloned = { ...el };
      if (el.points) cloned.points = [...el.points];
      return cloned;
    });

    const els = Array.isArray(elementsOverride) ? elementsOverride : elements;
    const currentLayers = layersOverride || layers || [];

    const state = {
      elements: cloneElements(els),
      layers: currentLayers.map(l => ({ ...l })),
      activeLayerId: activeLayerOverride || activeLayerId,
      canvasBgColor: canvasBgOverride || canvasBgColor,
      showCheckerboard: showCheckerboardOverride !== undefined ? showCheckerboardOverride : showCheckerboard
    };

    setHistory(prev => {
      const newStack = prev.slice(0, historyStep + 1);
      newStack.push(state);
      return newStack.length > MAX_HISTORY ? newStack.slice(1) : newStack;
    });
    setHistoryStep(prev => {
      const next = historyStep + 1;
      return next >= MAX_HISTORY ? MAX_HISTORY - 1 : next;
    });
  }, [elements, layers, activeLayerId, canvasBgColor, showCheckerboard, historyStep]);

  const loadState = useCallback((step, contextRef, setElements, setSelectedId, setEditingId, setLayers, setActiveLayerId, setCanvasBgColor, setShowCheckerboard) => {
    const state = history[step];
    if (!state) return;

    setElements(state.elements);
    if (state.layers && setLayers) setLayers(state.layers);
    if (state.activeLayerId && setActiveLayerId) setActiveLayerId(state.activeLayerId);
    if (state.canvasBgColor && setCanvasBgColor) setCanvasBgColor(state.canvasBgColor);
    if (state.showCheckerboard !== undefined && setShowCheckerboard) setShowCheckerboard(state.showCheckerboard);
    setSelectedId(null);
    setEditingId(null);
  }, [history]);

  const undo = (contextRef, setElements, setSelectedId, setEditingId, setLayers, setActiveLayerId, setCanvasBgColor, setShowCheckerboard) => {
    if (historyStep > 0) {
      const s = historyStep - 1;
      setHistoryStep(s);
      loadState(s, contextRef, setElements, setSelectedId, setEditingId, setLayers, setActiveLayerId, setCanvasBgColor, setShowCheckerboard);
    }
  };

  const redo = (contextRef, setElements, setSelectedId, setEditingId, setLayers, setActiveLayerId, setCanvasBgColor, setShowCheckerboard) => {
    if (historyStep < history.length - 1) {
      const s = historyStep + 1;
      setHistoryStep(s);
      loadState(s, contextRef, setElements, setSelectedId, setEditingId, setLayers, setActiveLayerId, setCanvasBgColor, setShowCheckerboard);
    }
  };

  return {
    history,
    historyStep,
    saveState,
    undo,
    redo
  };
};

export default usePaintHistory;
