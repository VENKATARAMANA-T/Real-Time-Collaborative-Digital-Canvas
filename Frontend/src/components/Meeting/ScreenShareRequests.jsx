import { useEffect, useState } from 'react';

function ScreenShareRequests({ requests = [], onApprove, onDecline }) {
  const [exiting, setExiting] = useState({});

  // Auto-animate out items that are being removed
  const handleAction = (requestUserId, action) => {
    setExiting((prev) => ({ ...prev, [requestUserId]: true }));
    setTimeout(() => {
      if (action === 'approve') {
        onApprove(requestUserId);
      } else {
        onDecline(requestUserId);
      }
    }, 250);
  };

  if (!requests.length) return null;

  return (
    <div className="fixed top-20 right-6 z-[200] flex flex-col gap-2 max-w-sm">
      {requests.map((req) => (
        <div
          key={req.userId}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border border-blue-500/30 bg-[#0f172a]/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-250 ${
            exiting[req.userId] ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100'
          }`}
        >
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-400 text-[20px]">present_to_all</span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-100 truncate">
              {req.username}
            </p>
            <p className="text-[11px] text-slate-400">wants to share their screen</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleAction(req.userId, 'approve')}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/25 transition-all"
              title="Allow screen share"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
            </button>
            <button
              type="button"
              onClick={() => handleAction(req.userId, 'decline')}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 border border-red-500/25 transition-all"
              title="Decline screen share"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ScreenShareRequests;
