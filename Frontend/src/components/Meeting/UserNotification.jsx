import { useEffect, useState } from 'react';

function UserNotification({ message, type = 'join', duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  const getBgColor = () => {
    switch (type) {
      case 'join':
        return 'bg-emerald-500/20';
      case 'leave':
        return 'bg-red-500/20';
      case 'end':
        return 'bg-orange-500/20';
      default:
        return 'bg-blue-500/20';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'join':
        return 'border-emerald-500/40';
      case 'leave':
        return 'border-red-500/40';
      case 'end':
        return 'border-orange-500/40';
      default:
        return 'border-blue-500/40';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'join':
        return 'text-emerald-400';
      case 'leave':
        return 'text-red-400';
      case 'end':
        return 'text-orange-400';
      default:
        return 'text-blue-400';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'join':
        return 'person_add';
      case 'leave':
        return 'person_remove';
      case 'end':
        return 'call_end';
      default:
        return 'info';
    }
  };

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 backdrop-blur-md border rounded-xl p-4 shadow-2xl transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      } ${getBgColor()} ${getBorderColor()}`}
    >
      <div className={`flex items-center gap-3 ${getTextColor()} font-medium text-sm`}>
        <span className="material-symbols-outlined text-lg">{getIcon()}</span>
        <span>{message}</span>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="ml-2 text-slate-300/80 hover:text-white transition-colors"
          title="Dismiss"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
}

export default UserNotification;
