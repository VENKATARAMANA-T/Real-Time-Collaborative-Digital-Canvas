import { useState, useRef, useEffect } from 'react';

function Footer({
  onLeave,
  onEnd,
  isLeaving = false,
  isEnding = false,
  meetingRole = 'participant',
  durationLabel = '00:00:00',
  onToggleCanvasMode,
  isCollaborativeMode = false,
  micOn = true,
  videoOn = true,
  onToggleMic,
  onToggleVideo,
  hostSettings = {},
  onUpdateHostSettings,
  onEmojiReaction,
  onRaiseHand,
  isHandRaised = false,
  onToggleScreenShare,
  isScreenSharing = false,
  isScreenSharePending = false,
  screenSharerName = null,
  onToggleRecording,
  isRecording = false,
  recorderName = null
}) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const settingsMenuRef = useRef(null);
  const emojiMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  const isHost = meetingRole === 'host';
  const isActionInProgress = isLeaving || isEnding;

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) {
        setShowSettingsMenu(false);
      }
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(e.target)) {
        setShowEmojiMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    if (showSettingsMenu || showEmojiMenu || showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu, showEmojiMenu, showMoreMenu]);

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

          <button
            onClick={onToggleScreenShare}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all relative ${
              isScreenSharing
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25'
                : isScreenSharePending
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25'
                  : screenSharerName
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
            disabled={!!screenSharerName && !isScreenSharing}
            title={
              isScreenSharing
                ? 'Stop sharing'
                : isScreenSharePending
                  ? 'Waiting for host approval... (click to cancel)'
                  : screenSharerName
                    ? `${screenSharerName} is sharing`
                    : 'Share your screen'
            }
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">
              {isScreenSharing ? 'cancel_presentation' : 'present_to_all'}
            </span>
            {isScreenSharing && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
            )}
            {isScreenSharePending && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Recording Button - only shown when host enabled it */}
          {hostSettings.isScreenRecordingAllowed && (
            <button
              onClick={onToggleRecording}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all relative ${
                isRecording
                  ? 'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25'
                  : recorderName
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              disabled={!!recorderName && !isRecording}
              title={
                isRecording
                  ? 'Stop recording'
                  : recorderName
                    ? `${recorderName} is recording`
                    : 'Start recording'
              }
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">
                {isRecording ? 'stop_circle' : 'radio_button_checked'}
              </span>
              {isRecording && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          )}

          <div className="relative" ref={emojiMenuRef}>
            <button
              className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              onClick={() => setShowEmojiMenu((prev) => !prev)}
              type="button"
              title="React with emoji"
            >
              <span className="material-symbols-outlined text-[22px]">add_reaction</span>
            </button>
            {showEmojiMenu && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 rounded-2xl border border-white/10 bg-[#0f172a]/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl z-[999]">
                {['👍', '❤️', '😂', '👏', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-xl hover:bg-white/10 hover:scale-125 transition-all"
                    onClick={() => {
                      setShowEmojiMenu(false);
                      if (onEmojiReaction) onEmojiReaction(emoji);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={moreMenuRef}>
            <button
              className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              onClick={() => setShowMoreMenu((prev) => !prev)}
              type="button"
              title="More options"
            >
              <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            </button>
            {showMoreMenu && (
              <div className="absolute bottom-14 left-0 w-52 rounded-2xl border border-white/10 bg-[#0f172a]/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden z-[999]">
                <button
                  type="button"
                  className={`w-full px-4 py-3 text-left text-sm font-semibold hover:bg-white/5 flex items-center gap-3 ${
                    isHandRaised ? 'text-amber-300' : 'text-slate-200'
                  }`}
                  onClick={() => {
                    setShowMoreMenu(false);
                    if (onRaiseHand) onRaiseHand();
                  }}
                >
                  <span className={`material-symbols-outlined text-base ${isHandRaised ? 'text-amber-300' : 'text-slate-400'}`}>back_hand</span>
                  {isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                  {isHandRaised && (
                    <span className="ml-auto text-[9px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">UP</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isHost ? (
          <div className="relative" ref={settingsMenuRef}>
            <button
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                showSettingsMenu
                  ? 'text-white bg-white/10 ring-2 ring-primary/30'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setShowSettingsMenu((prev) => !prev)}
              type="button"
              title="Host Settings"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>

            {showSettingsMenu && (
              <div className="absolute bottom-14 right-0 w-60 rounded-2xl border border-white/10 bg-[#0f172a]/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden z-[999]">
                <div className="px-4 py-2.5 border-b border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Host Controls</span>
                </div>

                {/* Mute All */}
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/5 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (onUpdateHostSettings) {
                      onUpdateHostSettings({ isAllMuted: !hostSettings.isAllMuted });
                    }
                  }}
                >
                  <span className={`material-symbols-outlined text-base ${hostSettings.isAllMuted ? 'text-red-400' : 'text-emerald-300'}`}>
                    {hostSettings.isAllMuted ? 'mic_off' : 'mic'}
                  </span>
                  {hostSettings.isAllMuted ? 'Unmute All' : 'Mute All'}
                  {hostSettings.isAllMuted && (
                    <span className="ml-auto text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">ON</span>
                  )}
                </button>

                {/* Turn Off All Video */}
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/5 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (onUpdateHostSettings) {
                      onUpdateHostSettings({ isAllVideoOff: !hostSettings.isAllVideoOff });
                    }
                  }}
                >
                  <span className={`material-symbols-outlined text-base ${hostSettings.isAllVideoOff ? 'text-red-400' : 'text-blue-300'}`}>
                    {hostSettings.isAllVideoOff ? 'videocam_off' : 'videocam'}
                  </span>
                  {hostSettings.isAllVideoOff ? 'Enable All Video' : 'Turn Off All Video'}
                  {hostSettings.isAllVideoOff && (
                    <span className="ml-auto text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">ON</span>
                  )}
                </button>

                <div className="h-[1px] w-full bg-white/5"></div>

                {/* Enable/Disable Chat */}
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/5 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (onUpdateHostSettings) {
                      onUpdateHostSettings({ isChatEnabled: !hostSettings.isChatEnabled });
                    }
                  }}
                >
                  <span className={`material-symbols-outlined text-base ${hostSettings.isChatEnabled ? 'text-emerald-300' : 'text-red-400'}`}>
                    {hostSettings.isChatEnabled ? 'chat' : 'speaker_notes_off'}
                  </span>
                  {hostSettings.isChatEnabled ? 'Disable Chat' : 'Enable Chat'}
                  {!hostSettings.isChatEnabled && (
                    <span className="ml-auto text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">OFF</span>
                  )}
                </button>

                <div className="h-[1px] w-full bg-white/5"></div>

                {/* Canvas Mode Toggle */}
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/5 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (onToggleCanvasMode) onToggleCanvasMode();
                  }}
                >
                  <span className={`material-symbols-outlined text-base ${isCollaborativeMode ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {isCollaborativeMode ? 'group' : 'lock'}
                  </span>
                  {isCollaborativeMode ? 'Lock Canvas' : 'Enable Collaboration'}
                  {isCollaborativeMode && (
                    <span className="ml-auto text-[9px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">COLLAB</span>
                  )}
                </button>

                <div className="h-[1px] w-full bg-white/5"></div>

                {/* Allow Screen Recording Toggle */}
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-white/5 flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    if (onUpdateHostSettings) {
                      onUpdateHostSettings({ isScreenRecordingAllowed: !hostSettings.isScreenRecordingAllowed });
                    }
                  }}
                >
                  <span className={`material-symbols-outlined text-base ${hostSettings.isScreenRecordingAllowed ? 'text-red-400' : 'text-slate-400'}`}>
                    {hostSettings.isScreenRecordingAllowed ? 'radio_button_checked' : 'fiber_manual_record'}
                  </span>
                  {hostSettings.isScreenRecordingAllowed ? 'Disable Recording' : 'Allow Recording'}
                  {hostSettings.isScreenRecordingAllowed && (
                    <span className="ml-auto text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">REC</span>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        )}
        
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
