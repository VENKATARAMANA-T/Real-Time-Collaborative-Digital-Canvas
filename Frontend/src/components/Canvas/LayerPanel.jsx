import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Plus, Trash2, ChevronUp, ChevronDown, Type, Palette, Merge, SplitSquareVertical } from 'lucide-react';

const LayerPanel = ({
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    deleteLayer,
    toggleVisibility,
    toggleLock,
    reorderLayers,
    updateLayerOpacity,
    updateLayerBgColor,
    updateLayerBlendMode,
    renameLayer,
    mergeLayers,
    splitLayer
}) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [draggingIndex, setDraggingIndex] = useState(null);
    const [dropOverIndex, setDropOverIndex] = useState(null);



    const startEditing = (layer) => {
        setEditingId(layer.id);
        setEditName(layer.name);
    };

    const saveName = (id) => {
        if (editName.trim()) {
            renameLayer(id, editName.trim());
        }
        setEditingId(null);
    };

    const handleDragStart = (e, index) => {
        setDraggingIndex(index);
        e.dataTransfer.setData('index', index);
        e.dataTransfer.effectAllowed = 'move';

        // Minor delay to allow the ghost image to be created from the original state
        setTimeout(() => setDraggingIndex(index), 0);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggingIndex === index) return;
        setDropOverIndex(index);
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('index'), 10);
        if (fromIndex !== index) {
            reorderLayers(fromIndex, index);
        }
        setDraggingIndex(null);
        setDropOverIndex(null);
    };

    return (
        <div data-tour="layers" className="w-72 bg-[#0c0c0e] border-l border-zinc-800 flex flex-col shadow-2xl z-40">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                        <Layers className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">Layers</h3>
                </div>
                <button
                    onClick={addLayer}
                    className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                    title="Add Layer"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 flex flex-col gap-1.5">
                {layers.map((layer, index) => (
                    <div
                        key={layer.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={() => { setDraggingIndex(null); setDropOverIndex(null); }}
                        onClick={() => setActiveLayerId(layer.id)}
                        className={`group p-2 rounded-xl flex flex-col gap-2 cursor-pointer transition-all duration-200 border relative ${activeLayerId === layer.id
                            ? 'bg-blue-600/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                            : 'hover:bg-zinc-800/30 border-transparent hover:border-zinc-800'
                            } ${draggingIndex === index ? 'opacity-20 scale-95 border-dashed border-zinc-700' : ''} 
                              ${dropOverIndex === index ? 'border-t-2 border-t-blue-500 mt-4 pb-2' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-0.5 opacity-30 group-hover:opacity-100 transition-opacity shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-zinc-800 rounded">
                                <div className="grid grid-cols-2 gap-0.5">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="w-0.5 h-0.5 bg-zinc-500 rounded-full" />
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                {editingId === layer.id ? (
                                    <input
                                        autoFocus
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={() => saveName(layer.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && saveName(layer.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-zinc-800 text-xs text-white px-2 py-1 rounded border border-blue-500/50 outline-none"
                                    />
                                ) : (
                                    <div
                                        onDoubleClick={() => startEditing(layer)}
                                        className={`text-xs font-semibold truncate ${activeLayerId === layer.id ? 'text-blue-400' : 'text-zinc-300'}`}
                                    >
                                        {layer.name}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
                                    className={`p-1.5 rounded-lg hover:bg-zinc-700/50 transition-colors ${layer.visible ? 'text-zinc-500 hover:text-zinc-300' : 'text-red-400 bg-red-400/5'}`}
                                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                                >
                                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }}
                                    className={`p-1.5 rounded-lg hover:bg-zinc-700/50 transition-colors ${layer.locked ? 'text-orange-400 bg-orange-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                                >
                                    {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>
                                {layers.length > 1 && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Layer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            {/* Split Layer button */}
                            {layer._mergeHistory && layer._mergeHistory.length > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); splitLayer(layer.id); }}
                                    className="p-1.5 rounded-lg hover:bg-teal-500/10 text-zinc-600 hover:text-teal-400 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Separate Merged Layer"
                                >
                                    <SplitSquareVertical className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {/* Merge Down button — only for non-bottom layers when 2+ layers exist */}
                            {layers.length > 1 && index < layers.length - 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); mergeLayers(layer.id); }}
                                    className="p-1.5 rounded-lg hover:bg-purple-500/10 text-zinc-600 hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Merge Down"
                                >
                                    <Merge className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {activeLayerId === layer.id && (
                            <div className="ml-6 py-2 border-t border-zinc-800/50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold w-12 shrink-0">BG Fill</span>
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="relative w-full h-5 rounded border border-zinc-800 overflow-hidden cursor-pointer bg-zinc-900 group/color">
                                            <div
                                                className="absolute inset-0"
                                                style={{ backgroundColor: layer.bgColor || 'transparent' }}
                                            />
                                            {!layer.bgColor && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                                    <Palette className="w-3 h-3 text-zinc-400" />
                                                </div>
                                            )}
                                            <input
                                                type="color"
                                                value={layer.bgColor || '#ffffff'}
                                                onChange={(e) => updateLayerBgColor(layer.id, e.target.value)}
                                                onInput={(e) => updateLayerBgColor(layer.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        {layer.bgColor && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateLayerBgColor(layer.id, null); }}
                                                className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors uppercase font-bold"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-3 bg-zinc-950/30 border-t border-zinc-800">
                <p className="text-[9px] text-zinc-600 text-center uppercase tracking-widest leading-relaxed">
                    Drag layers to reorder<br />
                    Select background colors for each layer
                </p>
            </div>
        </div>
    );
};

export default LayerPanel;
