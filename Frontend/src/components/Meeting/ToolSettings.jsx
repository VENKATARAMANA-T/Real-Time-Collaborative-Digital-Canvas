import { useState, useRef, useEffect, useCallback } from 'react';

// --- Helper Components ---

// Slider that calculates percentage for the CSS-based fill effect defined in index.css
const Slider = ({ min, max, value, onChange }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full"
      style={{ '--value': `${percentage}%` }}
    />
  );
};

// Gradient slider for Hue with custom override styles
const HueSlider = ({ value, onChange }) => {
  return (
    <>
      <style>{`
        input[type="range"].hue-slider::-webkit-slider-runnable-track {
            background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
            height: 10px;
            border-radius: 99px;
        }
        input[type="range"].hue-slider::-webkit-slider-thumb {
            margin-top: -3px; /* (16px thumb - 10px track) / 2 * -1 = -3px */
            background: #3b82f6;
            border: 2px solid #ffffff;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
        }
      `}</style>
      <input
        type="range"
        min={0}
        max={360}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hue-slider w-full h-3 rounded-full appearance-none cursor-pointer focus:outline-none"
      />
    </>
  );
};

// --- Color Utils ---

const hsvToHex = (h, s, v) => {
  const sat = s / 100;
  const val = v / 100;
  let r = 0;
  let g = 0;
  let b = 0;
  let i = Math.floor(h / 60);
  let f = h / 60 - i;
  let p = val * (1 - sat);
  let q = val * (1 - f * sat);
  let t = val * (1 - (1 - f) * sat);
  switch (i % 6) {
    case 0:
      r = val;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = val;
      b = p;
      break;
    case 2:
      r = p;
      g = val;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = val;
      break;
    case 4:
      r = t;
      g = p;
      b = val;
      break;
    case 5:
      r = val;
      g = p;
      b = q;
      break;
    default:
      break;
  }
  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// The HSV Color Builder
const ColorBuilder = ({ onAdd, onCancel }) => {
  const [hue, setHue] = useState(210);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const svRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSvChange = useCallback(
    (e) => {
      if (!svRef.current) return;
      const rect = svRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      const newS = (x / rect.width) * 100;
      const newV = 100 - (y / rect.height) * 100;

      setSaturation(newS);
      setBrightness(newV);
    },
    [setSaturation, setBrightness]
  );

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleSvChange(e);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) handleSvChange(e);
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleSvChange]);

  const currentColor = hsvToHex(hue, saturation, brightness);

  return (
    <div className="flex flex-col gap-4 bg-black/20 p-4 rounded-xl border border-white/5 animate-in fade-in zoom-in-95 duration-200">
      {/* Saturation/Value Box */}
      <div
        ref={svRef}
        className="w-full h-32 rounded-lg relative cursor-crosshair overflow-hidden shadow-inner ring-1 ring-white/10"
        style={{
          backgroundColor: `hsl(${hue}, 100%, 50%)`
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #fff, transparent)' }}></div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000, transparent)' }}></div>

        {/* Handle */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/20"
          style={{
            left: `${saturation}%`,
            top: `${100 - brightness}%`,
            backgroundColor: currentColor
          }}
        ></div>
      </div>

      {/* Hue Slider */}
      <div className="flex flex-col gap-2">
        <HueSlider value={hue} onChange={setHue} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10"
        >
          Cancel
        </button>
        <button
          onClick={() => onAdd(currentColor)}
          className="flex-1 py-2 text-xs bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20 font-medium flex items-center justify-center gap-2"
        >
          <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: currentColor }}></div>
          Add
        </button>
      </div>
    </div>
  );
};

// --- Main Component ---

function ToolSettings({
  tool,
  visible,
  settings,
  updateSettings,
  customColors,
  setCustomColors,
  customFillColors,
  setCustomFillColors,
  customNoteColors,
  setCustomNoteColors
}) {
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [isAddingFill, setIsAddingFill] = useState(false);
  const [isAddingNoteColor, setIsAddingNoteColor] = useState(false);

  const handleAddColor = (newColor) => {
    setCustomColors([...customColors, newColor]);
    updateSettings({ brushColor: newColor });
    setIsAddingColor(false);
  };

  const handleAddFill = (newColor) => {
    setCustomFillColors([...customFillColors, newColor]);
    updateSettings({ fillColor: newColor });
    setIsAddingFill(false);
  };

  const handleAddNoteColor = (newColor) => {
    setCustomNoteColors([...customNoteColors, newColor]);
    updateSettings({ noteFillColor: newColor });
    setIsAddingNoteColor(false);
  };

  if (['selector', 'save'].includes(tool)) return null;

  const shapeIcons = [
    { id: 'line', icon: 'horizontal_rule' },
    { id: 'circle', icon: 'circle' },
    { id: 'rectangle', icon: 'rectangle' },
    { id: 'triangle', icon: 'change_history' },
    { id: 'arrow', icon: 'arrow_back' },
    { id: 'star', icon: 'star' }
  ];

  const renderContent = () => {
    switch (tool) {
      case 'brush':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brush Style</span>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ brushStyle: 'edit' })}
                  className={`flex-1 h-11 border rounded-xl flex items-center justify-center transition-all ${
                    settings.brushStyle === 'edit'
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button
                  onClick={() => updateSettings({ brushStyle: 'stylus' })}
                  className={`flex-1 h-11 border rounded-xl flex items-center justify-center transition-all ${
                    settings.brushStyle === 'stylus'
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">stylus</span>
                </button>
                <button
                  onClick={() => updateSettings({ brushStyle: 'highlighter' })}
                  className={`flex-1 h-11 border rounded-xl flex items-center justify-center transition-all ${
                    settings.brushStyle === 'highlighter'
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">ink_highlighter</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Brush Type</span>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ brushType: 'solid' })}
                  className={`flex-1 h-11 border rounded-xl flex items-center justify-center transition-all ${
                    settings.brushType === 'solid'
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">horizontal_rule</span>
                </button>
                <button
                  onClick={() => updateSettings({ brushType: 'dashed' })}
                  className={`flex-1 h-11 border rounded-xl flex items-center justify-center transition-all ${
                    settings.brushType === 'dashed'
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex gap-[4px] items-center">
                    <div className="w-2 h-0.5 bg-current rounded-full"></div>
                    <div className="w-2 h-0.5 bg-current rounded-full"></div>
                  </div>
                </button>
                <button
                  onClick={() => updateSettings({ brushType: 'dotted' })}
                  className={`flex-1 h-11 border rounded-xl flex items-center justify-center transition-all ${
                    settings.brushType === 'dotted'
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                </button>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5"></div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Size</span>
                <span className="text-[10px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  {settings.brushSize}px
                </span>
              </div>
              <Slider min={1} max={100} value={settings.brushSize} onChange={(val) => updateSettings({ brushSize: val })} />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opacity</span>
                <span className="text-[10px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  {settings.brushOpacity}%
                </span>
              </div>
              <Slider min={0} max={100} value={settings.brushOpacity} onChange={(val) => updateSettings({ brushOpacity: val })} />
            </div>
          </div>
        );

      case 'eraser':
        return (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Eraser Size</span>
                <span className="text-[10px] font-bold text-primary tabular-nums bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {settings.eraserSize}px
                </span>
              </div>
              <Slider min={1} max={100} value={settings.eraserSize} onChange={(val) => updateSettings({ eraserSize: val })} />
            </div>
          </div>
        );

      case 'color-picker':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Palette</span>
                <span className="text-[9px] text-slate-600">{customColors.length} Colors</span>
              </div>

              {isAddingColor ? (
                <ColorBuilder onAdd={handleAddColor} onCancel={() => setIsAddingColor(false)} />
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {customColors.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => updateSettings({ brushColor: c })}
                      className={`aspect-square rounded-lg cursor-pointer border transition-all flex items-center justify-center relative ${
                        settings.brushColor === c
                          ? 'ring-2 ring-white border-transparent scale-110 z-10'
                          : 'border-white/10 hover:scale-110 hover:border-white/30'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {settings.brushColor === c && c === '#ffffff' && (
                        <span className="material-symbols-outlined text-[14px] text-black">check</span>
                      )}
                      {settings.brushColor === c && c !== '#ffffff' && (
                        <span className="material-symbols-outlined text-[14px] text-white">check</span>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setIsAddingColor(true)}
                    className="aspect-square rounded-lg border-dashed border border-white/20 hover:border-primary/50 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-[1px] w-full bg-white/5"></div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opacity</span>
                <span className="text-[10px] font-mono text-slate-300">{settings.brushOpacity}%</span>
              </div>
              <Slider min={0} max={100} value={settings.brushOpacity} onChange={(val) => updateSettings({ brushOpacity: val })} />
            </div>
          </div>
        );

      case 'shapes':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Geometry</span>
              <div className="grid grid-cols-5 gap-3">
                {shapeIcons.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => updateSettings({ activeShape: s.id })}
                    className={`aspect-square flex items-center justify-center rounded-xl transition-all border ${
                      settings.activeShape === s.id
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                        : 'text-slate-400 bg-white/5 border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5"></div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Stroke Style</span>
              <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => updateSettings({ strokeStyle: 'solid' })}
                  className={`flex-1 h-9 flex items-center justify-center rounded-lg transition-all ${
                    settings.strokeStyle === 'solid'
                      ? 'bg-white/10 text-white shadow-sm border border-white/5'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="w-6 h-0.5 bg-current"></div>
                </button>
                <button
                  onClick={() => updateSettings({ strokeStyle: 'dashed' })}
                  className={`flex-1 h-9 flex items-center justify-center rounded-lg transition-all ${
                    settings.strokeStyle === 'dashed'
                      ? 'bg-white/10 text-white shadow-sm border border-white/5'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="w-6 h-0.5 border-b-2 border-dashed border-current"></div>
                </button>
                <button
                  onClick={() => updateSettings({ strokeStyle: 'dotted' })}
                  className={`flex-1 h-9 flex items-center justify-center rounded-lg transition-all ${
                    settings.strokeStyle === 'dotted'
                      ? 'bg-white/10 text-white shadow-sm border border-white/5'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="w-6 h-0.5 border-b-2 border-dotted border-current"></div>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stroke Width</span>
                  <span className="text-[10px] font-mono text-slate-300">{settings.strokeWidth}px</span>
                </div>
                <Slider min={1} max={20} value={settings.strokeWidth} onChange={(val) => updateSettings({ strokeWidth: val })} />
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Opacity</span>
                  <span className="text-[10px] font-mono text-slate-300">{settings.strokeOpacity}%</span>
                </div>
                <Slider min={0} max={100} value={settings.strokeOpacity} onChange={(val) => updateSettings({ strokeOpacity: val })} />
              </div>
            </div>
          </div>
        );

      case 'shape-filler':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fill Color</span>
                <span className="text-[9px] text-slate-600">{customFillColors.length + 1} Presets</span>
              </div>

              {isAddingFill ? (
                <ColorBuilder onAdd={handleAddFill} onCancel={() => setIsAddingFill(false)} />
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {/* None Option */}
                  <div
                    onClick={() => updateSettings({ fillColor: 'transparent' })}
                    className={`aspect-square rounded-lg cursor-pointer border transition-all flex items-center justify-center relative bg-white/5 ${
                      settings.fillColor === 'transparent'
                        ? 'ring-2 ring-white border-transparent scale-110 z-10'
                        : 'border-white/10 hover:scale-110 hover:border-white/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-slate-400 text-lg">block</span>
                  </div>

                  {customFillColors.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => updateSettings({ fillColor: c })}
                      className={`aspect-square rounded-lg cursor-pointer border transition-all flex items-center justify-center relative ${
                        settings.fillColor === c
                          ? 'ring-2 ring-white border-transparent scale-110 z-10'
                          : 'border-white/10 hover:scale-110 hover:border-white/30'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {settings.fillColor === c && c === '#ffffff' && (
                        <span className="material-symbols-outlined text-[14px] text-black">check</span>
                      )}
                      {settings.fillColor === c && c !== '#ffffff' && (
                        <span className="material-symbols-outlined text-[14px] text-white">check</span>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setIsAddingFill(true)}
                    className="aspect-square rounded-lg border-dashed border border-white/20 hover:border-primary/50 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-[1px] w-full bg-white/5"></div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fill Opacity</span>
                <span className="text-[10px] font-mono text-slate-300">{settings.fillOpacity}%</span>
              </div>
              <Slider min={0} max={100} value={settings.fillOpacity} onChange={(val) => updateSettings({ fillOpacity: val })} />
            </div>
          </div>
        );

      case 'sticky-note':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Note Color</span>
              {isAddingNoteColor ? (
                <ColorBuilder onAdd={handleAddNoteColor} onCancel={() => setIsAddingNoteColor(false)} />
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {customNoteColors.map((hex, i) => (
                    <div
                      key={i}
                      onClick={() => updateSettings({ noteFillColor: hex })}
                      className={`aspect-square rounded-full cursor-pointer transition-all shadow-sm ${
                        settings.noteFillColor === hex
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background-dark scale-110'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: hex }}
                    ></div>
                  ))}
                  <button
                    onClick={() => setIsAddingNoteColor(true)}
                    className="aspect-square rounded-full border-dashed border border-white/20 hover:border-primary/50 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-[1px] w-full bg-white/5"></div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Text Style</span>
              <div className="flex gap-2">
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                  className="flex-1 bg-background-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                >
                  <option value="Inter" className="bg-background-dark text-white">
                    Inter
                  </option>
                  <option value="serif" className="bg-background-dark text-white">
                    Serif
                  </option>
                  <option value="monospace" className="bg-background-dark text-white">
                    Mono
                  </option>
                </select>
                <select
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                  className="w-20 bg-background-dark border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                >
                  {[12, 14, 16, 20, 24, 32].map((size) => (
                    <option key={size} value={size} className="bg-background-dark text-white">
                      {size}px
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {[
                  { id: 'bold', icon: 'format_bold', prop: 'fontWeight', activeVal: 'bold', inactiveVal: 'normal' },
                  { id: 'italic', icon: 'format_italic', prop: 'fontStyle', activeVal: 'italic', inactiveVal: 'normal' },
                  { id: 'underline', icon: 'format_underlined', prop: 'textDecoration', activeVal: 'underline', inactiveVal: 'none' },
                  { id: 'strike', icon: 'format_strikethrough', prop: 'textDecoration', activeVal: 'line-through', inactiveVal: 'none' }
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() =>
                      updateSettings({
                        [btn.prop]: settings[btn.prop] === btn.activeVal ? btn.inactiveVal : btn.activeVal
                      })
                    }
                    className={`flex-1 h-8 rounded-lg flex items-center justify-center transition-all ${
                      settings[btn.prop] === btn.activeVal ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{btn.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alignment</span>
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => updateSettings({ textAlign: align })}
                    className={`flex-1 h-10 rounded-lg flex items-center justify-center transition-all ${
                      settings.textAlign === align ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">format_align_{align}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Note Opacity</span>
                <span className="text-[10px] font-mono text-slate-300">{settings.fillOpacity}%</span>
              </div>
              <Slider min={0} max={100} value={settings.fillOpacity} onChange={(val) => updateSettings({ fillOpacity: val })} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute left-[72px] top-4 glass w-72 p-6 rounded-2xl shadow-2xl z-[60] border border-white/10 transition-all duration-300 ease-out origin-left ${
        visible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
      }`}
    >
      {renderContent()}
    </div>
  );
}

export default ToolSettings;
