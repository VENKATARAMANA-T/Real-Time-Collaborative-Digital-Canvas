import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import VideoPlayer from '../components/Meeting/VideoPlayer.jsx';

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MeetingNotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await meetingAPI.getMeetingNotes(id);
        if (response.success) {
          setMeeting(response.meeting);
        }
      } catch (err) {
        console.error('Error fetching meeting notes:', err);
        setError(err.response?.data?.message || 'Failed to load meeting notes');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchNotes();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border-dark border-t-primary"></div>
          <p className="text-sm text-slate-400 font-sans">Loading meeting notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-red-400 text-3xl">error</span>
          </div>
          <p className="text-red-400 text-base font-semibold mb-2">{error}</p>
          <p className="text-slate-500 text-sm mb-6">Something went wrong while loading the meeting notes.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!meeting) return null;

  const recordingUrl = meeting.recordingPath
    ? meetingAPI.getRecordingUrl(meeting.recordingPath)
    : null;

  // Build all recordings list (prefer new recordings array, fallback to legacy single)
  const allRecordings = meeting.recordings && meeting.recordings.length > 0
    ? meeting.recordings
    : (recordingUrl ? [{ filename: meeting.recordingPath, recordedBy: meeting.recordedBy, uploadedAt: meeting.endTime }] : []);

  const duration = meeting.startTime && meeting.endTime
    ? Math.round((new Date(meeting.endTime) - new Date(meeting.startTime)) / 60000)
    : null;

  const tabs = [
    { key: 'chat', label: 'Chat History', icon: 'chat', badge: meeting.messages?.length || 0, badgeColor: 'bg-primary/10 text-primary' },
    { key: 'recording', label: 'Recordings', icon: 'videocam', badge: allRecordings.length, badgeColor: 'bg-red-500/10 text-red-400' },
    { key: 'participants', label: 'Participants', icon: 'group', badge: meeting.participants?.length || 0, badgeColor: 'bg-emerald-500/10 text-emerald-400' },
    { key: 'info', label: 'Details', icon: 'info', badge: 0, badgeColor: '' },
  ];

  return (
    <div className="min-h-screen bg-background-dark text-slate-300 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-dark bg-background-dark/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-dark border border-border-dark text-slate-400 hover:text-white hover:border-primary/30 hover:bg-primary/5 transition-all"
              title="Back to Dashboard"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex flex-col items-start">
              <h1 className="text-base font-bold text-white leading-tight text-left">{meeting.name}</h1>
              <p className="text-[11px] text-slate-500 mt-0.5 text-left">{meeting.meetingId}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-slate-400 bg-surface-dark px-3 py-1.5 rounded-lg border border-border-dark">
            <span className="material-symbols-outlined text-[15px]">group</span>
            <span className="font-medium">{meeting.participants?.length || 0} participants</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex items-center justify-center gap-1 mb-6 bg-surface-dark/50 rounded-xl p-1 border border-border-dark/50 w-fit mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? tab.badgeColor : 'bg-white/5 text-slate-500'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Chat History Tab */}
        {activeTab === 'chat' && (
          <div className="max-w-2xl mx-auto">
            {!meeting.messages || meeting.messages.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-16 h-16 rounded-full bg-surface-dark flex items-center justify-center mx-auto mb-4 border border-border-dark">
                  <span className="material-symbols-outlined text-slate-600 text-3xl">chat_bubble_outline</span>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">No Messages</p>
                <p className="text-slate-600 text-xs">No chat messages were sent during this meeting.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border-dark bg-surface-dark/30 overflow-hidden">
                {/* Chat header bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-dark/70 bg-surface-dark/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">chat</span>
                    <span className="text-sm font-semibold text-slate-300">Chat History</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">{meeting.messages.length} message{meeting.messages.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Chat messages area */}
                <div className="px-5 py-5 max-h-[600px] overflow-y-auto custom-scrollbar space-y-4">
                  {meeting.messages.map((msg, i) => {
                    const isCurrentUser = msg.username === (user?.username || user?.name);
                    const isHost = msg.username === meeting.host?.username;

                    // Check if we should show the username label (first msg or different sender from previous)
                    const prevMsg = i > 0 ? meeting.messages[i - 1] : null;
                    const showSender = !prevMsg || prevMsg.username !== msg.username;

                    return (
                      <div key={i} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        {/* Sender label */}
                        {showSender && (
                          <div className={`flex items-center gap-1.5 mb-1.5 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{
                                backgroundColor: isCurrentUser ? 'rgba(19,127,236,0.15)' : isHost ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.12)',
                                color: isCurrentUser ? '#137fec' : isHost ? '#60a5fa' : '#94a3b8'
                              }}
                            >
                              {(msg.username || '?')[0].toUpperCase()}
                            </div>
                            <span className={`text-[11px] font-semibold ${isCurrentUser ? 'text-primary' : isHost ? 'text-blue-400' : 'text-slate-400'}`}>
                              {isCurrentUser ? 'You' : msg.username}
                            </span>
                            {isHost && !isCurrentUser && (
                              <span className="text-[8px] font-bold text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/15 uppercase tracking-wider">Host</span>
                            )}
                          </div>
                        )}

                        {/* Message bubble */}
                        <div className={`relative max-w-[80%] ${isCurrentUser ? 'mr-0' : 'ml-0'}`}>
                          <div
                            className={`px-4 py-2.5 text-[13px] leading-relaxed break-words ${
                              isCurrentUser
                                ? 'bg-primary/15 border border-primary/20 text-slate-200 rounded-2xl rounded-tr-md'
                                : 'bg-white/[0.04] border border-white/[0.06] text-slate-300 rounded-2xl rounded-tl-md'
                            }`}
                          >
                            {msg.msg}
                          </div>
                          {msg.time && (
                            <span className={`text-[10px] text-slate-600 mt-1 block ${isCurrentUser ? 'text-right pr-1' : 'text-left pl-1'}`}>
                              {formatTime(msg.time)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recording Tab */}
        {activeTab === 'recording' && (
          <div className="max-w-3xl mx-auto">
            {allRecordings.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-16 h-16 rounded-full bg-surface-dark flex items-center justify-center mx-auto mb-4 border border-border-dark">
                  <span className="material-symbols-outlined text-slate-600 text-3xl">videocam_off</span>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">No Recordings</p>
                <p className="text-slate-600 text-xs">No recordings are available for this meeting.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allRecordings.map((rec, idx) => {
                  const recUrl = meetingAPI.getRecordingUrl(rec.filename);
                  return (
                    <div key={idx} className="rounded-2xl border border-border-dark bg-surface-dark/30 overflow-hidden">
                      {/* Recording header */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-border-dark/70 bg-surface-dark/50">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-red-400 text-[18px]">videocam</span>
                          <span className="text-sm font-semibold text-slate-300">Recording {allRecordings.length > 1 ? `#${idx + 1}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          {rec.uploadedAt && (
                            <span>{new Date(rec.uploadedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                          )}
                        </div>
                      </div>
                      <div className="p-1">
                        <VideoPlayer
                          src={recUrl}
                          downloadName={`${meeting.name || 'meeting'}_recording_${idx + 1}.webm`}
                        />
                      </div>
                      <div className="flex items-center justify-between px-5 py-3 border-t border-border-dark/70">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="material-symbols-outlined text-[14px] text-red-400">radio_button_checked</span>
                          <span>Recorded by <span className="text-slate-300 font-medium">{rec.recordedBy?.username || 'Unknown'}</span></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-border-dark bg-surface-dark/30 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border-dark/70 bg-surface-dark/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-[18px]">group</span>
                  <span className="text-sm font-semibold text-slate-300">Participants</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">{meeting.participants?.length || 0} total</span>
              </div>

              <div className="divide-y divide-border-dark/40">
                {/* Host */}
                <div className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center text-xs font-bold text-blue-400">
                      {(meeting.host?.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{meeting.host?.username}</span>
                        <span className="text-[9px] font-bold text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/15 uppercase tracking-wider">Host</span>
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-blue-400/40 text-[18px]">shield_person</span>
                </div>

                {/* Other participants */}
                {meeting.participants
                  ?.filter(p => p._id?.toString() !== meeting.host?._id?.toString())
                  .map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.01] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-500/12 flex items-center justify-center text-xs font-bold text-slate-400">
                          {(p.username || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-300">{p.username}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        {p.joinTime && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-emerald-500/50 text-[12px]">login</span>
                            <span>{new Date(p.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                        {p.leaveTime && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-red-400/40 text-[12px]">logout</span>
                            <span>{new Date(p.leaveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Meeting Summary Card */}
            <div className="rounded-2xl border border-border-dark bg-surface-dark/30 overflow-hidden">
              <div className="px-5 py-3 border-b border-border-dark/70 bg-surface-dark/50">
                <h3 className="text-sm font-semibold text-slate-300">Meeting Summary</h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background-dark/60 border border-border-dark/40">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-blue-400 text-lg">badge</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Name</p>
                    <p className="text-sm font-semibold text-white truncate">{meeting.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background-dark/60 border border-border-dark/40">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-purple-400 text-lg">tag</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Meeting ID</p>
                    <p className="text-sm font-semibold text-white truncate">{meeting.meetingId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background-dark/60 border border-border-dark/40">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-emerald-400 text-lg">person</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Host</p>
                    <p className="text-sm font-semibold text-white truncate">{meeting.host?.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background-dark/60 border border-border-dark/40">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-amber-400 text-lg">group</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Participants</p>
                    <p className="text-sm font-semibold text-white">{meeting.participants?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Details Card */}
            <div className="rounded-2xl border border-border-dark bg-surface-dark/30 overflow-hidden">
              <div className="px-5 py-3 border-b border-border-dark/70 bg-surface-dark/50">
                <h3 className="text-sm font-semibold text-slate-300">Time Details</h3>
              </div>
              <div className="p-5 space-y-2.5">
                {meeting.startTime && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-background-dark/60 border border-border-dark/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-400 text-[16px]">play_circle</span>
                      </div>
                      <span className="text-sm text-slate-400">Started</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {new Date(meeting.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                )}
                {meeting.endTime && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-background-dark/60 border border-border-dark/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-400 text-[16px]">stop_circle</span>
                      </div>
                      <span className="text-sm text-slate-400">Ended</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {new Date(meeting.endTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                )}
                {duration !== null && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-background-dark/60 border border-border-dark/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-400 text-[16px]">timer</span>
                      </div>
                      <span className="text-sm text-slate-400">Duration</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration} min`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="rounded-2xl border border-border-dark bg-surface-dark/30 overflow-hidden">
              <div className="px-5 py-3 border-b border-border-dark/70 bg-surface-dark/50">
                <h3 className="text-sm font-semibold text-slate-300">Status</h3>
              </div>
              <div className="p-5 space-y-2.5">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background-dark/60 border border-border-dark/40">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meeting.status === 'ended' ? 'bg-slate-500/10' : 'bg-emerald-500/10'}`}>
                    <span className={`material-symbols-outlined text-[16px] ${meeting.status === 'ended' ? 'text-slate-400' : 'text-emerald-400'}`}>
                      {meeting.status === 'ended' ? 'check_circle' : 'radio_button_checked'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white capitalize">{meeting.status}</span>
                </div>
                {meeting.messages?.length > 0 && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background-dark/60 border border-border-dark/40">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[16px]">chat</span>
                    </div>
                    <span className="text-sm text-slate-400">{meeting.messages.length} chat message{meeting.messages.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {allRecordings.length > 0 && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background-dark/60 border border-border-dark/40">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-red-400 text-[16px]">videocam</span>
                    </div>
                    <span className="text-sm text-slate-400">{allRecordings.length} recording{allRecordings.length !== 1 ? 's' : ''} available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all border border-primary/10 hover:border-primary/20"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
