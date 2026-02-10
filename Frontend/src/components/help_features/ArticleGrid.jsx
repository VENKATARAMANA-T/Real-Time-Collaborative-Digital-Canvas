import React from 'react';
import SkeletonCard from '../help_layout/SkeletonCard';

export default function ArticleGrid({ loading, articles, isDarkMode }) {
  if (loading) return <div className="grid grid-cols-3 gap-6">{[1,2,3].map(i => <SkeletonCard key={i} isDarkMode={isDarkMode}/>)}</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {articles.map(article => (
        <div key={article.id} className={`p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start space-x-4">
             <div className="p-3 rounded-lg bg-indigo-50"><article.icon className="text-indigo-600"/></div>
             <div><h3 className="font-semibold">{article.title}</h3><p className="text-sm text-gray-500">{article.readTime}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}
