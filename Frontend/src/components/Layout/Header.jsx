import React from 'react';
import { BookOpen, Moon, Sun } from 'lucide-react';

export default function Header({ isDarkMode, setIsDarkMode }) {
  return (
    <header className={`border-b p-4 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen className="text-indigo-600" />
          <h1 className="font-bold text-xl">Help Center</h1>
        </div>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}