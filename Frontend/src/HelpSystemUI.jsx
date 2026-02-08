import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { helpArticles, faqs } from './data/helpData';
import Header from './components/layout/Header';
import SearchBar from './components/features/SearchBar';
import ArticleGrid from './components/features/ArticleGrid';
import FeedbackModal from './components/modals/FeedbackModal';

export default function HelpSystemUI() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => { setTimeout(() => setLoading(false), 1000); }, []);

  const filtered = helpArticles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <SearchBar isDarkMode={isDarkMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <button onClick={() => setShowFeedback(true)} className="mb-6 flex items-center gap-2 text-indigo-500 font-medium hover:underline">
          <MessageSquare className="w-4 h-4" /> Give Feedback
        </button>
        <ArticleGrid loading={loading} articles={filtered} isDarkMode={isDarkMode} />
      </main>
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} isDarkMode={isDarkMode} />}
    </div>
  );
}