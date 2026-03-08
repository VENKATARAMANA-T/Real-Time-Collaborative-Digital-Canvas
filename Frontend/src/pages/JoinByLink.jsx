import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { meetingAPI } from '../services/api.js';

function JoinByLink() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | error | joining
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Not logged in — redirect to home with return URL
      sessionStorage.setItem('returnAfterLogin', `/join-link/${token}`);
      navigate('/', { replace: true });
      return;
    }

    const joinViaLink = async () => {
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
            audioEnabled: true,
            videoEnabled: true,
          }
        });
      } catch (error) {
        const msg = error?.response?.data?.message || 'Failed to join meeting';
        setErrorMsg(msg);
        setStatus('error');
      }
    };

    joinViaLink();
  }, [token, user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
      <div className="w-full max-w-sm text-center p-8">
        {(status === 'loading' || status === 'joining') && (
          <div>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500"></div>
            <p className="text-slate-300 font-medium">Joining meeting...</p>
            <p className="text-slate-500 text-sm mt-1">Please wait</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15">
              <span className="material-icons text-rose-400 text-3xl">error_outline</span>
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
