function Toolbar({ activeTool, setActiveTool, onUndo, onRedo, canUndo, canRedo, canEdit = true }) {
  
  const tools = [
    { id: 'selector', icon: 'arrow_selector_tool', title: 'Selector' },
    { id: 'brush', icon: 'brush', title: 'Brush' },
    { id: 'eraser', icon: 'ink_eraser', title: 'Eraser' },
    { id: 'color-picker', icon: 'colorize', title: 'Color Picker' },
    { id: 'shapes', icon: 'shapes', title: 'Shapes' },
    { id: 'shape-filler', icon: 'format_color_fill', title: 'Shape Filler' },
    { id: 'sticky-note', icon: 'sticky_note_2', title: 'Sticky Note' }
  ];

  return (
    <div className="w-16 border-r border-border-dark flex flex-col items-center py-4 gap-3 bg-background-dark z-40 overflow-y-auto relative shrink-0">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => {
            if (!canEdit) return;
            setActiveTool(tool.id);
          }}
          disabled={!canEdit}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 ${
            activeTool === tool.id && canEdit
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : canEdit
                ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                : 'text-slate-700 cursor-not-allowed'
          }`}
          title={tool.title}
        >
          <span className={`material-symbols-outlined ${activeTool === tool.id || tool.filled ? 'filled' : ''}`}>
            {tool.icon}
          </span>
        </button>
      ))}

      <div className="h-[1px] w-8 bg-white/10 my-1 shrink-0"></div>

      <button
        onClick={onUndo}
        disabled={!canUndo || !canEdit}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 ${
          !canUndo || !canEdit
            ? 'text-slate-700 cursor-not-allowed'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
        title="Undo"
      >
        <span className="material-symbols-outlined">undo</span>
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo || !canEdit}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 ${
          !canRedo || !canEdit
            ? 'text-slate-700 cursor-not-allowed'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
        title="Redo"
      >
        <span className="material-symbols-outlined">redo</span>
      </button>

      <div className="h-[1px] w-8 bg-white/10 my-1 shrink-0"></div>

      <button
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shrink-0 ${
          canEdit ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-700 cursor-not-allowed'
        }`}
        title="Save Project"
        disabled={!canEdit}
      >
        <span className="material-symbols-outlined">save</span>
      </button>
    </div>
  );
}

export default Toolbar;
