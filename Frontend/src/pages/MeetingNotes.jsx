import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import VideoPlayer from '../components/Meeting/VideoPlayer.jsx';

export default function MeetingNotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500"></div>
          <p className="text-sm text-slate-400">Loading meeting notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-red-400 text-5xl block mb-4">error</span>
          <p className="text-red-400 text-lg font-semibold mb-2">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary text-sm font-bold hover:underline"
          >
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

  const duration = meeting.startTime && meeting.endTime
    ? Math.round((new Date(meeting.endTime) - new Date(meeting.startTime)) / 60000)
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0c]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              title="Back to Dashboard"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{meeting.name}</h1>
              <p className="text-xs text-slate-500">
                Meeting ID: {meeting.meetingId}
                {meeting.endTime && (
                  <> &middot; Ended {new Date(meeting.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                )}
                {duration !== null && <> &middot; {duration}m</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm mr-1">group</span>
              {meeting.participants?.length || 0} participants
            </div>
            {meeting.recordedBy && (
              <div className="flex items-center text-xs text-red-400">
                <span className="material-symbols-outlined text-sm mr-1">radio_button_checked</span>
                Recorded by {meeting.recordedBy.username}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-white/5 pb-0">
          <button
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'chat'
                ? 'text-white border-primary'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="material-symbols-outlined text-sm mr-2 align-middle">chat</span>
            Chat History
            {meeting.messages?.length > 0 && (
              <span className="ml-2 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {meeting.messages.length}
              </span>
            )}
          </button>
          <button
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'recording'
                ? 'text-white border-primary'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('recording')}
          >
            <span className="material-symbols-outlined text-sm mr-2 align-middle">videocam</span>
            Recording
            {recordingUrl && (
              <span className="ml-2 text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
                1
              </span>
            )}
          </button>
          <button
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'participants'
                ? 'text-white border-primary'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('participants')}
          >
            <span className="material-symbols-outlined text-sm mr-2 align-middle">group</span>
            Participants
          </button>
          <button
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'info'
                ? 'text-white border-primary'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('info')}
          >
            <span className="material-symbols-outlined text-sm mr-2 align-middle">info</span>
            Info
          </button>
        </div>

        {/* Chat History Tab */}
        {activeTab === 'chat' && (
          <div className="max-w-3xl">
            {!meeting.messages || meeting.messages.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-slate-600 text-5xl block mb-3">chat_bubble_outline</span>
                <p className="text-slate-500 text-sm">No chat messages in this meeting.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {meeting.messages.map((msg, i) => {
                  const isCurrentUser = msg.username === (user?.username || user?.name);
                  const isHost = msg.username === meeting.host?.username;
                  return (
                    <div key={i} className="group flex items-start gap-3 py-2.5 px-4 rounded-xl hover:bg-white/[0.02] transition-all">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: isHost ? 'rgba(59,130,246,0.15)' : 'rgba(100,116,139,0.15)',
                          color: isHost ? '#60a5fa' : '#94a3b8'
                        }}
                      >
                        {(msg.username || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-sm font-semibold ${isCurrentUser ? 'text-primary' : isHost ? 'text-blue-400' : 'text-slate-300'}`}>
                            {msg.username}
                          </span>
                          {isHost && (
                            <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">HOST</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mt-0.5 break-words">{msg.msg}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recording Tab */}
        {activeTab === 'recording' && (
          <div className="max-w-4xl">
            {!recordingUrl ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-slate-600 text-5xl block mb-3">videocam_off</span>
                <p className="text-slate-500 text-sm">No recording available for this meeting.</p>
              </div>
            ) : (
              <div>
                <VideoPlayer
                  src={recordingUrl}
                  downloadName={`${meeting.name || 'meeting'}_recording.webm`}
                />
                <div className="flex items-center justify-between mt-4 px-1">
                  <div className="flex items-center text-xs text-slate-500">
                    <span className="material-symbols-outlined text-sm mr-1">radio_button_checked</span>
                    Recorded by {meeting.recordedBy?.username || 'Unknown'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="max-w-2xl">
            <div className="space-y-2">
              {/* Host */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center text-sm font-bold text-blue-400">
                  {(meeting.host?.username || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{meeting.host?.username}</span>
                    <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">HOST</span>
                  </div>
                </div>
              </div>
              {/* Participants */}
              {meeting.participants
                ?.filter(p => p._id?.toString() !== meeting.host?._id?.toString())
                .map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-500/15 flex items-center justify-center text-sm font-bold text-slate-400">
                        {(p.username || '?')[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-300">{p.username}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {p.joinTime && (
                        <span>Joined {new Date(p.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      {p.leaveTime && (
                        <span className="ml-2 text-slate-600">· Left {new Date(p.leaveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="max-w-3xl">
            <div className="space-y-6">
              {/* Meeting Summary Card */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Meeting Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-400 text-lg">badge</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Meeting Name</p>
                      <p className="text-sm font-semibold text-white">{meeting.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-400 text-lg">tag</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Meeting ID</p>
                      <p className="text-sm font-semibold text-white">{meeting.meetingId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-400 text-lg">person</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Host</p>
                      <p className="text-sm font-semibold text-white">{meeting.host?.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-400 text-lg">group</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Participants</p>
                      <p className="text-sm font-semibold text-white">{meeting.participants?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Details Card */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Time Details</h3>
                <div className="space-y-3">
                  {meeting.startTime && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-400 text-lg">play_circle</span>
                        <span className="text-sm text-slate-400">Started</span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {new Date(meeting.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  )}
                  {meeting.endTime && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-400 text-lg">stop_circle</span>
                        <span className="text-sm text-slate-400">Ended</span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {new Date(meeting.endTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  )}
                  {duration !== null && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-lg">timer</span>
                        <span className="text-sm text-slate-400">Duration</span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Card */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Status</h3>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className={`material-symbols-outlined text-lg ${meeting.status === 'ended' ? 'text-slate-400' : 'text-emerald-400'}`}>
                    {meeting.status === 'ended' ? 'check_circle' : 'radio_button_checked'}
                  </span>
                  <span className="text-sm font-semibold text-white capitalize">{meeting.status}</span>
                </div>
                {meeting.messages?.length > 0 && (
                  <div className="flex items-center gap-3 p-3 mt-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="material-symbols-outlined text-primary text-lg">chat</span>
                    <span className="text-sm text-slate-400">{meeting.messages.length} chat message{meeting.messages.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {recordingUrl && (
                  <div className="flex items-center gap-3 p-3 mt-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="material-symbols-outlined text-red-400 text-lg">videocam</span>
                    <span className="text-sm text-slate-400">Recording available</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-all"
              >
                OK — Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
