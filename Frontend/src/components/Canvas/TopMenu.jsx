import React from 'react';
import {
  FileText, FolderOpen, ImageIcon, Clock, Save, Printer, Share2, X,
  Monitor, Settings, Scissors, Copy, Clipboard, ZoomIn, Check, Maximize2,
  Grid3X3, Undo, Redo
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
  handleCopy,
  handleCut,
  handlePaste,
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
  historyLength
}) => {
  return (
    <nav className="h-10 flex items-center px-4 gap-6 text-sm border-b border-zinc-800 bg-[#09090b] relative z-[100]">
      <div className="flex items-center gap-1 text-zinc-400">
        <img src="https://upload.wikimedia.org/wikipedia/commons/1/13/Logo_of_Microsoft_Paint.svg" className="w-4 h-4 mr-2" alt="logo" />
        <span className="text-zinc-100 font-medium">Modern Paint Pro</span>
      </div>
      
      <div className="flex gap-1 relative">
        {/* File Menu */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFileMenuOpen(!isFileMenuOpen);
            setIsEditMenuOpen(false);
            setIsViewMenuOpen(false);
          }}
          className={`px-3 py-1 rounded-md transition-colors ${isFileMenuOpen ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-300'}`}
        >
          File
        </button>

        {/* Edit Menu */}
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

        {/* View Menu */}
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

        {/* File Menu Dropdown */}
        {isFileMenuOpen && (
          <div className="absolute top-9 left-0 w-72 bg-[#1f1f23] border border-zinc-700 rounded-lg shadow-2xl py-2 z-[110] flex flex-col">
            <MenuItem icon={FileText} label="New" shortcut="Ctrl+N" onClick={() => window.location.reload()} />
            <MenuItem icon={FolderOpen} label="Open" shortcut="Ctrl+O" />
            <MenuItem icon={ImageIcon} label="Import to canvas" hasSubmenu />
            <MenuItem icon={Clock} label="Recent" hasSubmenu />
            <MenuDivider />
            <MenuItem icon={Save} label="Save" shortcut="Ctrl+S" onClick={handleSave} />
            <MenuItem icon={Save} label="Save as" hasSubmenu />
            <MenuItem icon={Save} label="Save as project" shortcut="Ctrl+Shift+S" />
            <MenuDivider />
            <MenuItem icon={Printer} label="Print" hasSubmenu />
            <MenuItem icon={Share2} label="Share" />
            <MenuDivider />
            <MenuItem icon={Monitor} label="Set as desktop background" hasSubmenu disabled />
            <MenuItem icon={Settings} label="Image properties" shortcut="Ctrl+E" />
            <MenuDivider />
            <MenuItem icon={X} label="Exit" danger onClick={() => alert("Application Exit")} />
          </div>
        )}

        {/* Edit Menu Dropdown */}
        {isEditMenuOpen && (
          <div className="absolute top-9 left-14 w-48 bg-[#1f1f23] border border-zinc-700 rounded-lg shadow-2xl py-2 z-[110] flex flex-col">
            <MenuItem icon={Scissors} label="Cut" shortcut="Ctrl+X" onClick={() => { handleCut(); setIsEditMenuOpen(false); }} disabled={!selectedId} />
            <MenuItem icon={Copy} label="Copy" shortcut="Ctrl+C" onClick={() => { handleCopy(); setIsEditMenuOpen(false); }} disabled={!selectedId} />
            <MenuItem icon={Clipboard} label="Paste" shortcut="Ctrl+V" onClick={() => { handlePaste(); setIsEditMenuOpen(false); }} disabled={!clipboard} />
          </div>
        )}

        {/* View Menu Dropdown */}
        {isViewMenuOpen && (
          <div className="absolute top-9 left-28 w-72 bg-[#1f1f23] border border-zinc-700 rounded-lg shadow-2xl py-2 z-[110] flex flex-col">
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
            <MenuItem icon={ImageIcon} label="Thumbnail" />
          </div>
        )}
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-3">
        <IconButton icon={Undo} disabled={historyStep <= 0} onClick={undo} title="Undo (Ctrl+Z)" />
        <IconButton icon={Redo} disabled={historyStep >= historyLength - 1} onClick={redo} title="Redo (Ctrl+Y)" />
        <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
        <IconButton icon={Save} onClick={handleSave} title="Save (Download)" />
      </div>
    </nav>
  );
};

export default TopMenu;
