import React from 'react';
import { X } from 'lucide-react';

export default function FeedbackModal({ onClose, isDarkMode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Send Feedback</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <textarea className="w-full p-3 border rounded-lg mb-4 h-32 dark:bg-gray-700 dark:border-gray-600" placeholder="Type here..."></textarea>
        <button onClick={onClose} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">Submit</button>
      </div>
    </div>
  );
}