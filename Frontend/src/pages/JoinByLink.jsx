import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { meetingAPI } from '../services/api.js';

function JoinByLink() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | error | joining | permissions
  const [errorMsg, setErrorMsg] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Not logged in — navigate to login page with redirect
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/login');
      return;
    }

    // Logged in — show permissions card
    setStatus('permissions');
  }, [user, authLoading, navigate]);

  const handleJoinMeeting = async () => {
    try {
      setStatus('joining');
      const data = await meetingAPI.joinByLink(token);
      navigate(`/meeting/${data.meetingId}`, {
        replace: true,
        state: {
          meetingDbId: data.meetingDbId,
          meetingId: data.meetingId,
          role: data.role,
          permission: data.permission,
          status: data.meetingStatus,
          audioEnabled,
          videoEnabled,
        }
      });
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to join meeting';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        <div className="w-full max-w-sm text-center p-8">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500"></div>
          <p className="text-slate-300 font-medium">Loading...</p>
          <p className="text-slate-500 text-sm mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (status === 'permissions') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <span className="material-symbols-outlined">login</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Join Meeting</h3>
            <p className="text-slate-400 text-sm">Configure your device settings before joining.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <span className="text-sm text-slate-200">Device Settings</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAudioEnabled((prev) => !prev)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                    audioEnabled
                      ? 'border-emerald-400/60 bg-emerald-800 text-white'
                      : 'border-rose-400/60 bg-rose-500 text-white'
                  }`}
                  type="button"
                  title={audioEnabled ? 'Disable Audio' : 'Enable Audio'}
                >
                  <span className="material-symbols-outlined">{audioEnabled ? 'mic' : 'mic_off'}</span>
                </button>
                <button
                  onClick={() => setVideoEnabled((prev) => !prev)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                    videoEnabled
                      ? 'border-emerald-400/60 bg-emerald-800 text-white'
                      : 'border-rose-400/60 bg-rose-500 text-white'
                  }`}
                  type="button"
                  title={videoEnabled ? 'Disable Video' : 'Enable Video'}
                >
                  <span className="material-symbols-outlined">{videoEnabled ? 'videocam' : 'videocam_off'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleJoinMeeting}
              className="w-full rounded-lg bg-emerald-600 py-3 font-bold text-white transition-all hover:bg-emerald-500"
              type="button"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="w-full max-w-sm text-center p-8">
        {status === 'joining' && (
          <div>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500"></div>
            <p className="text-slate-300 font-medium">Joining meeting...</p>
            <p className="text-slate-500 text-sm mt-1">Please wait</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15">
              <span className="material-symbols-outlined text-rose-400 text-3xl">error</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Cannot Join Meeting</h2>
            <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
            <button
              className="px-6 py-2.5 rounded-lg bg-slate-700 text-white text-sm font-semibold hover:bg-slate-600 transition-all"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default JoinByLink;
