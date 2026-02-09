import { useState, useCallback } from 'react';

const usePaintTools = () => {
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [opacity, setOpacity] = useState(1);
  const [fillMode, setFillMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [clipboard, setClipboard] = useState(null);

  const [textFormat, setTextFormat] = useState({
    font: 'Arial',
    size: 24,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    align: 'left',
    background: false
  });

  const handleToolChange = useCallback((newTool) => {
    if (editingId) {
      setEditingId(null);
    }
    if (newTool !== 'select') {
      setSelectedId(null);
    }
    setTool(newTool);
  }, [editingId]);

  const updateColor = useCallback((newColor, elements, setElements, saveState) => {
    setColor(newColor);
    if (selectedId) {
      setElements(prev => prev.map(el =>
        el.id === selectedId ? { ...el, color: newColor } : el
      ));
      saveState();
    }
  }, [selectedId]);

  const updateTextProp = useCallback((updates, selectedId, setElements, saveState) => {
    setTextFormat(prev => ({ ...prev, ...updates }));
    if (selectedId) {
      setElements(prev => prev.map(el => {
        if (el.id === selectedId && el.type === 'text') {
          const newEl = { ...el, ...updates };
          if ('size' in updates) {
            newEl.fontSize = updates.size;
          }
          return newEl;
        }
        return el;
      }));
      saveState();
    }
  }, []);

  const toggleTextProp = useCallback((prop, selectedId, setElements, saveState) => {
    const newVal = !textFormat[prop];
    updateTextProp({ [prop]: newVal }, selectedId, setElements, saveState);
  }, [textFormat, updateTextProp]);

  return {
    tool,
    setTool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    opacity,
    setOpacity,
    fillMode,
    setFillMode,
    selectedId,
    setSelectedId,
    editingId,
    setEditingId,
    clipboard,
    setClipboard,
    textFormat,
    setTextFormat,
    handleToolChange,
    updateColor,
    updateTextProp,
    toggleTextProp
  };
};

export default usePaintTools;
