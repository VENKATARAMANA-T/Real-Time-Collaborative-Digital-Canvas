import { Info } from 'lucide-react';

export default function ContextualTooltip({ isDarkMode, title, description, shortcut }) {
  return (
    <div className="absolute z-50 w-64 pointer-events-none" style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' }}>
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-4 shadow-2xl`}>
        <div className="flex items-start space-x-2 mb-2">
          <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
            {shortcut && <kbd className="mt-2 px-2 py-1 text-xs rounded border">{shortcut}</kbd>}
          </div>
        </div>
      </div>
    </div>
  );
}