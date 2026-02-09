import React from 'react';
import { X, Check } from 'lucide-react';

export default function FeedbackModal({ onClose, isDarkMode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className={`p-6 rounded-2xl max-w-md w-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <div className="flex justify-between mb-4">
          <h3 className="text-xl font-bold">Send Feedback</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <textarea className="w-full p-3 border rounded-lg mb-4 text-black" rows="4" placeholder="Tell us more..."></textarea>
        <button onClick={onClose} className="w-full bg-indigo-600 text-white py-2 rounded-lg">Submit Feedback</button>
      </div>
    </div>
  );
}