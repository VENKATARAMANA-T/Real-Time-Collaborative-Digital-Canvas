import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY = 50;

const usePaintHistory = (canvasRef, elements) => {
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const saveState = useCallback((elementsOverride) => {
    if (!canvasRef.current) return;
    const pixelData = canvasRef.current.toDataURL();
    const els = Array.isArray(elementsOverride) ? elementsOverride : elements;
    const state = { pixelData, elements: JSON.parse(JSON.stringify(els)) };

    setHistory(prev => {
      const newStack = prev.slice(0, historyStep + 1);
      newStack.push(state);
      return newStack.length > MAX_HISTORY ? newStack.slice(1) : newStack;
    });
    setHistoryStep(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [elements, historyStep, canvasRef]);

  const loadState = useCallback((step, contextRef, setElements, setSelectedId, setEditingId) => {
    const state = history[step];
    if (!state || !contextRef.current) return;

    const img = new Image();
    img.src = state.pixelData;
    img.onload = () => {
      if (!contextRef.current) return;
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      contextRef.current.drawImage(img, 0, 0, canvasRef.current.width / 2, canvasRef.current.height / 2);
      setElements(state.elements);
      setSelectedId(null);
      setEditingId(null);
    };
  }, [history, canvasRef]);

  const undo = (contextRef, setElements, setSelectedId, setEditingId) => {
    if (historyStep > 0) {
      const s = historyStep - 1;
      setHistoryStep(s);
      loadState(s, contextRef, setElements, setSelectedId, setEditingId);
    }
  };

  const redo = (contextRef, setElements, setSelectedId, setEditingId) => {
    if (historyStep < history.length - 1) {
      const s = historyStep + 1;
      setHistoryStep(s);
      loadState(s, contextRef, setElements, setSelectedId, setEditingId);
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
