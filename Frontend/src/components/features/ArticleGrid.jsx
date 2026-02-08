import React from 'react';
import SkeletonCard from '../ui/SkeletonCard';

export default function ArticleGrid({ loading, articles, isDarkMode }) {
  if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3].map(i => <SkeletonCard key={i} isDarkMode={isDarkMode}/>)}</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {articles.map(article => (
        <div key={article.id} className={`p-6 rounded-xl border hover:shadow-lg transition ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <article.icon className="w-8 h-8 text-indigo-500 mb-4" />
          <h3 className="font-bold mb-1">{article.title}</h3>
          <p className="text-sm opacity-70">{article.readTime} read</p>
        </div>
      ))}
    </div>
  );
}