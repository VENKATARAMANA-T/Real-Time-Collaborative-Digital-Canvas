import React from 'react';
export default function SkeletonCard({ isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl border animate-pulse ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="h-10 w-10 bg-gray-300 rounded-lg mb-4"></div>
      <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
      <div className="h-3 w-1/2 bg-gray-300 rounded"></div>
    </div>
  );
}