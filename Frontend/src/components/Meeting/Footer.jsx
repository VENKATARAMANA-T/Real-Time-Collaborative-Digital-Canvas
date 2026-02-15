import { useState } from 'react';

function Footer({
  onLeave,
  onEnd,
  isLeaving = false,
  isEnding = false,
  meetingRole = 'participant',
  durationLabel = '00:00:00',
  onLockCanvas,
  onEnableCollaboration,
  micOn = true,
  videoOn = true,
  onToggleMic,
  onToggleVideo
}) {
  const [showHostMenu, setShowHostMenu] = useState(false);

  const isHost = meetingRole === 'host';
  const isActionInProgress = isLeaving || isEnding;

  return (
    <footer className="h-20 border-t border-border-dark bg-background-dark/95 backdrop-blur-xl flex items-center justify-between px-8 z-50 shrink-0">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Duration</span>
          <span className="text-sm font-medium tabular-nums text-white">{durationLabel}</span>
        </div>
        <div className="h-8 w-[1px] bg-white/10"></div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Signal</span>
            <div className="flex gap-0.5 mt-0.5">
              <div className="w-1 h-2 bg-primary rounded-full"></div>
              <div className="w-1 h-3 bg-primary rounded-full"></div>
              <div className="w-1 h-4 bg-primary rounded-full"></div>
              <div className="w-1 h-2.5 bg-primary/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 glass px-4 py-2 rounded-2xl shadow-xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleMic}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              micOn
                ? 'text-white hover:bg-white/10'
                : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {micOn ? 'mic' : 'mic_off'}
            </span>
          </button>

          <button
            onClick={onToggleVideo}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              videoOn
                ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-blue-600'
                : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${videoOn ? 'filled' : ''}`}>
              {videoOn ? 'videocam' : 'videocam_off'}
            </span>
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

          <button className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined text-[22px]">present_to_all</span>
          </button>
          <button className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined text-[22px]">add_reaction</span>
          </button>
          <div className="relative">
            <button
              className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              onClick={() => {
                if (!isHost) return;
                setShowHostMenu((prev) => !prev);
              }}
              type="button"
              title={isHost ? 'More options' : 'Options available for host'}
            >
              <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            </button>
            {isHost && showHostMenu && (
              <div className="absolute bottom-14 left-0 w-52 rounded-2xl border border-white/10 bg-[#0f172a]/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/5 flex items-center gap-3"
                  onClick={() => {
                    setShowHostMenu(false);
                    if (onLockCanvas) {
                      onLockCanvas();
                    }
                  }}
                >
                  <span className="material-symbols-outlined text-base text-amber-300">lock</span>
                  Lock Canvas
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/5 flex items-center gap-3"
                  onClick={() => {
                    setShowHostMenu(false);
                    if (onEnableCollaboration) {
                      onEnableCollaboration();
                    }
                  }}
                >
                  <span className="material-symbols-outlined text-base text-emerald-300">group</span>
                  Collaborative Mode
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
        
        {isHost ? (
          <button
            className={`bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 h-11 rounded-xl text-xs font-bold transition-all border border-red-500/20 flex items-center gap-2 group${
              isActionInProgress ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            onClick={onEnd}
            disabled={isActionInProgress}
            type="button"
            title="End meeting for all participants"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isEnding ? 'hourglass_empty' : 'call_end'}
            </span>
            {isEnding ? 'Ending...' : 'End Meeting'}
          </button>
        ) : (
          <button
            className={`bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 h-11 rounded-xl text-xs font-bold transition-all border border-red-500/20 flex items-center gap-2 group ${
              isActionInProgress ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            onClick={onLeave}
            disabled={isActionInProgress}
            type="button"
            title="Leave the meeting"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isLeaving ? 'hourglass_empty' : 'call_end'}
            </span>
            {isLeaving ? 'Leaving...' : 'Leave Meeting'}
          </button>
        )}
      </div>
    </footer>
  );
}

export default Footer;
