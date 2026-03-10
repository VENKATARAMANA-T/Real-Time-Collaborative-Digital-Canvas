import {
  PlayCircle, Settings, Zap, Lightbulb, Video, HelpCircle
} from 'lucide-react';

export const helpArticles = [
  {
    id: 1, title: 'Getting Started Guide', category: 'Basics', icon: PlayCircle, readTime: '5 min',
    details: { intro: 'Welcome to our Digital Canvas Application!', sections: [] }
  },
  {
    id: 2, title: 'Understanding Tools', category: 'Features', icon: Settings, readTime: '8 min',
    details: { intro: 'Master all the powerful tools.', sections: [] }
  },
  { id: 3, title: 'Keyboard Shortcuts', category: 'Productivity', icon: Zap, readTime: '4 min', details: { intro: 'Shortcuts...', sections: [] } },
  { id: 4, title: 'Advanced Techniques', category: 'Advanced', icon: Lightbulb, readTime: '10 min', details: { intro: 'Advanced...', sections: [] } },
  { id: 5, title: 'Video Tutorials', category: 'Learning', icon: Video, readTime: '15 min', details: { intro: 'Videos...', sections: [] } },
  { id: 6, title: 'Troubleshooting', category: 'Support', icon: HelpCircle, readTime: '7 min', details: { intro: 'Help...', sections: [] } }
];

export const faqs = [
  { q: 'How do I start using the platform?', a: 'Begin with our Getting Started guide...' },
  { q: 'What are the keyboard shortcuts?', a: 'Press Ctrl+K to view all shortcuts...' },
  { q: 'Can I switch between beginner and advanced mode?', a: 'Yes! Use the mode toggle in Settings.' },
  { q: 'How do I get contextual help?', a: 'Hover over any tool or feature to see tooltips.' },
  { q: 'Where can I provide feedback?', a: 'Click the feedback button in the bottom right corner.' }
];