import React, { useState } from 'react';
import {
  FileText, FolderOpen, ImageIcon, Clock, Save, Printer, Share2, X,
  Monitor, Settings, Scissors, Copy, Clipboard, ZoomIn, Check, Maximize2,
  Grid3X3, Undo, Redo, LayoutDashboard, ChevronLeft
} from 'lucide-react';
import MenuItem, { MenuDivider } from '../shared/MenuItem';
import IconButton from '../shared/IconButton';

const TopMenu = ({
  isFileMenuOpen,
  setIsFileMenuOpen,
  isEditMenuOpen,
  setIsEditMenuOpen,
  isViewMenuOpen,
  setIsViewMenuOpen,
  handleSave,
  handleExport,
  handleImport,
  handleCopy,
  handleCut,
  handlePaste,
  isDirty,
  clipboard,
  selectedId,
  showRulers,
  setShowRulers,
  showGridlines,
  setShowGridlines,
  gridSize,
  setGridSize,
  showStatusBar,
  setShowStatusBar,
  alwaysShowToolbar,
  setAlwaysShowToolbar,
  handleFullScreen,
  undo,
  redo,
  historyStep,
  historyLength,
  currentView,
  setCurrentView,
  onDashboardClick,
  onShare
}) => {
  return (
    <nav data-tour="topmenu" className="h-12 flex items-center px-2 gap-8 text-sm border-b border-zinc-800/40 bg-gradient-to-r from-[#09090b] to-[#18181b] relative z-[100] backdrop-blur-md shadow-lg">


      <div className={`flex gap-1 relative ${currentView === 'dashboard' ? 'opacity-0 pointer-events-none' : ''}`}>
        {/* Back to Dash Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onDashboardClick) onDashboardClick();
          }}
          className="flex items-center gap-2 px-3 py-1 rounded-md transition-colors hover:bg-zinc-800 text-zinc-300 group"
          title="Back to Dashboard"
        >
          <LayoutDashboard size={16} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
          <span className="font-medium">Dashboard</span>
        </button>

        {/* File Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFileMenuOpen(!isFileMenuOpen);
              setIsEditMenuOpen(false);
              setIsViewMenuOpen(false);
            }}
            className={`px-3 py-1 rounded-md transition-colors ${isFileMenuOpen ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-300'}`}
          >
            Options
          </button>

          {/* File Menu Dropdown */}
          {isFileMenuOpen && (
            <div className="absolute top-9 left-0 w-64 bg-[#1f1f23] border border-zinc-700 rounded-lg shadow-2xl py-2 z-[110] flex flex-col">
              <MenuItem
                icon={ImageIcon}
                label="Import File"
                onClick={() => { handleImport(); setIsFileMenuOpen(false); }}
              />
              <MenuItem
                icon={Save}
                label="Export File"
                onClick={() => { handleExport(); setIsFileMenuOpen(false); }}
              />
              <MenuItem
                icon={Share2}
                label="Share"
                onClick={() => {
                  if (onShare) onShare();
                  setIsFileMenuOpen(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditMenuOpen(!isEditMenuOpen);
              setIsFileMenuOpen(false);
              setIsViewMenuOpen(false);
            }}
            className={`px-3 py-1 rounded-md transition-colors ${isEditMenuOpen ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-300'}`}
          >
            Edit
          </button>

          {/* Edit Menu Dropdown */}
          {isEditMenuOpen && (
            <div className="absolute top-9 left-0 w-48 bg-[#1f1f23] border border-zinc-700 rounded-lg shadow-2xl py-2 z-[110] flex flex-col">
              <MenuItem icon={Scissors} label="Cut" shortcut="Ctrl+X" onClick={() => { handleCut(); setIsEditMenuOpen(false); }} disabled={!selectedId} />
              <MenuItem icon={Copy} label="Copy" shortcut="Ctrl+C" onClick={() => { handleCopy(); setIsEditMenuOpen(false); }} disabled={!selectedId} />
              <MenuItem icon={Clipboard} label="Paste" shortcut="Ctrl+V" onClick={() => { handlePaste(); setIsEditMenuOpen(false); }} disabled={!clipboard} />
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsViewMenuOpen(!isViewMenuOpen);
              setIsFileMenuOpen(false);
              setIsEditMenuOpen(false);
            }}
            className={`px-3 py-1 rounded-md transition-colors ${isViewMenuOpen ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-300'}`}
          >
            View
          </button>

          {/* View Menu Dropdown */}
          {isViewMenuOpen && (
            <div className="absolute top-9 left-0 w-72 bg-[#1f1f23] border border-zinc-700 rounded-lg shadow-2xl py-2 z-[110] flex flex-col">
              <MenuItem icon={ZoomIn} label="Zoom" hasSubmenu />
              <MenuItem
                icon={showRulers ? Check : null}
                label="Rulers"
                shortcut="Ctrl+R"
                onClick={() => { setShowRulers(!showRulers); setIsViewMenuOpen(false); }}
              />
              <MenuItem
                icon={showGridlines ? Check : null}
                label="Gridlines"
                shortcut="Ctrl+G"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGridlines(!showGridlines);
                }}
              />

              {/* Grid Size Control */}
              <div className="px-4 py-2 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <Grid3X3 size={16} className="text-zinc-400" />
                <span className="text-sm text-zinc-300 flex-1">Grid Size</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={gridSize}
                  onChange={(e) => setGridSize(parseInt(e.target.value))}
                  className="w-20 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-zinc-500 w-8 text-right">{gridSize}px</span>
              </div>

              <MenuItem
                icon={showStatusBar ? Check : null}
                label="Status bar"
                onClick={() => { setShowStatusBar(!showStatusBar); setIsViewMenuOpen(false); }}
              />
              <MenuDivider />
              <MenuItem
                icon={alwaysShowToolbar ? Check : null}
                label="Always show toolbar"
                onClick={() => { setAlwaysShowToolbar(true); setIsViewMenuOpen(false); }}
              />
              <MenuItem
                icon={!alwaysShowToolbar ? Check : null}
                label="Automatically hide toolbar"
                onClick={() => { setAlwaysShowToolbar(false); setIsViewMenuOpen(false); }}
              />
              <MenuDivider />
              <MenuItem icon={Maximize2} label="Full screen" shortcut="F11" onClick={handleFullScreen} />

            </div>
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className={`flex items-center gap-3 ${currentView === 'dashboard' ? 'opacity-0 pointer-events-none' : ''}`}>
        <IconButton icon={Undo} disabled={historyStep <= 0} onClick={undo} title="Undo (Ctrl+Z)" />
        <IconButton icon={Redo} disabled={historyStep >= historyLength - 1} onClick={redo} title="Redo (Ctrl+Y)" />
        <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
        {/* Save Button */}
        {/* Save Button */}
        {(() => {
          const [showSavedFeedback, setShowSavedFeedback] = useState(false);

          const onSaveClick = () => {
            handleSave(); // Note: this now only saves internally, it's not the download export
            setShowSavedFeedback(true);
            setTimeout(() => {
              setShowSavedFeedback(false);
            }, 5000); // revert after 5 seconds
          };

          if (showSavedFeedback) {
            return (
              <button
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 border bg-green-500/10 border-green-500/20 text-green-400 cursor-default"
                title="All changes saved"
              >
                <Check size={16} className="text-green-500" />
                <span className="text-xs font-medium">Saved</span>
              </button>
            );
          }

          return (
            <button
              onClick={onSaveClick}
              title={isDirty ? "Unsaved changes (Ctrl+S)" : "Click to save"}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 border bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 active:scale-95"
            >
              <Save size={16} className={isDirty ? "text-blue-400" : "text-zinc-400"} />
              <span className="text-xs font-medium tracking-wide">Save</span>
              {isDirty && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute top-1 right-1 animate-pulse" />}
            </button>
          );
        })()}
      </div>
    </nav>
  );
};

export default TopMenu;
