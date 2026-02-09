import React from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ isDarkMode, searchQuery, setSearchQuery }) {
  return (
    <div className="mb-8 max-w-2xl mx-auto relative">
      <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search help articles..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
      />
    </div>
  );
}