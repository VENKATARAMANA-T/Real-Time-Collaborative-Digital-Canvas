import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import ContextualTooltip from '../ui/Tooltip';

export default function Header({ isDarkMode, setIsDarkMode, mode, setMode }) {
  const [hoveredElement, setHoveredElement] = useState(null);
  return (
    <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40 p-4`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold">Help Center</h1>
        </div>
        <div className="flex space-x-4">
          <button onClick={() => setMode(mode === 'beginner' ? 'advanced' : 'beginner')} className="px-4 py-2 bg-indigo-600 text-white rounded">
             Mode: {mode}
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="px-4 py-2 border rounded">
             {isDarkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
    </header>
  );
}