const getInitials = (name) => {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function MemberCard({ name, role = 'member', status, mic, video, brush, onBrushClick, brushDisabled }) {
  const isHost = role === 'host';
  const initials = getInitials(name);

  // Theme colors
  const activeBg = isHost ? 'bg-gold' : 'bg-primary';
  const activeText = isHost ? 'text-black' : 'text-white';
  const activeBorder = isHost ? 'border-gold/40' : 'border-primary/40';
  const activeShadow = isHost ? 'shadow-gold/20' : 'shadow-primary/25';

  const disabledBg = 'bg-red-500/10';
  const disabledText = 'text-red-500';
  const disabledBorder = 'border-red-500/20';

  const getButtonStyle = (isActive) => {
    return `w-7 h-7 rounded-lg backdrop-blur-md border flex items-center justify-center transition-all ${
      isActive
        ? `${activeBg} ${activeText} ${activeBorder} shadow-lg ${activeShadow}`
        : `${disabledBg} ${disabledText} ${disabledBorder} hover:bg-red-500/20`
    }`;
  };

  return (
    <div
      className={`relative aspect-video w-full rounded-2xl overflow-hidden border transition-all group flex flex-col items-center justify-center gap-3 shadow-lg ${
        isHost ? 'bg-gold/5 border-gold/40 shadow-gold/5' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.07]'
      }`}
    >
      {isHost && (
        <div className="absolute top-3 left-3 px-2 py-0.5 bg-gold text-black rounded text-[8px] font-black uppercase tracking-widest z-10 shadow-sm">
          Host
        </div>
      )}

      {/* Avatar (Initials Only) */}
      <div
        className={`w-16 h-16 rounded-full border-4 overflow-hidden shadow-2xl flex items-center justify-center relative z-10 ${
          isHost ? 'border-gold/30 bg-gold/10' : 'border-white/10 bg-white/5'
        }`}
      >
        <div className={`text-xl font-bold ${isHost ? 'text-gold' : 'text-purple-400'}`}>{initials}</div>

        {!video && (
          <div className="absolute inset-0 flex items-center justify-center bg-background-dark/50 backdrop-blur-[2px]">
            <span className="material-symbols-outlined text-white/70 text-2xl">videocam_off</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center z-10">
        <span className="text-sm font-bold text-white tracking-wide block drop-shadow-md">{name}</span>
        <span className={`text-[9px] font-medium uppercase tracking-tight ${isHost ? 'text-gold/80' : 'text-slate-500'}`}>
          {status}
        </span>
      </div>

      {/* Brush (Left) */}
      <div className="absolute bottom-3 left-3 z-20" title={brush ? 'Drawing Enabled' : 'Drawing Disabled'}>
        <button
          className={getButtonStyle(brush)}
          type="button"
          onClick={onBrushClick}
          disabled={brushDisabled}
        >
          <span className={`material-symbols-outlined text-[14px] ${brush ? 'filled' : ''}`}>brush</span>
        </button>
      </div>

      {/* Media Controls (Right) */}
      <div className="absolute bottom-3 right-3 flex gap-2 z-20">
        <div className={getButtonStyle(mic)} title={mic ? 'Mic On' : 'Mic Off'}>
          <span className={`material-symbols-outlined text-[14px] ${mic ? 'filled' : ''}`}>{mic ? 'mic' : 'mic_off'}</span>
        </div>
        <div className={getButtonStyle(video)} title={video ? 'Camera On' : 'Camera Off'}>
          <span className={`material-symbols-outlined text-[14px] ${video ? 'filled' : ''}`}>{video ? 'videocam' : 'videocam_off'}</span>
        </div>
      </div>
    </div>
  );
}

import ChatBox from '../Collaboration/ChatBox';
import { useEffect, useState } from 'react';
import { meetingAPI } from '../../services/api';

function Sidebar({
  isOpen,
  view,
  setView,
  toggle,
  socket,
  meetingDbId,
  currentUser,
  currentRole,
  canEdit,
  localMedia,
  onToggleEditPermission
}) {
  const displayName = currentUser?.username || currentUser?.name || 'You';
  const memberStatus = currentRole === 'host' ? 'Hosting' : 'Participant';
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await meetingAPI.getDetails(meetingDbId);
        if (response.success) {
          // Filter to show only active participants (those who haven't left)
          const activeParticipants = response.meeting.participants.filter(p => p.isActive !== false);
          setParticipants(activeParticipants);
        }
      } catch (error) {
        console.error('Error fetching meeting participants:', error);
      } finally {
        setLoading(false);
      }
    };

    if (meetingDbId) {
      fetchParticipants();
    }
  }, [meetingDbId]);

  // Listen for real-time participant updates
  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = () => {
      // Refresh participant list when someone joins
      meetingAPI.getDetails(meetingDbId)
        .then(response => {
          if (response.success) {
            const activeParticipants = response.meeting.participants.filter(p => p.isActive !== false);
            setParticipants(activeParticipants);
          }
        })
        .catch(error => console.error('Error updating participants:', error));
    };

    const handleUserLeft = () => {
      // Refresh participant list when someone leaves
      meetingAPI.getDetails(meetingDbId)
        .then(response => {
          if (response.success) {
            const activeParticipants = response.meeting.participants.filter(p => p.isActive !== false);
            setParticipants(activeParticipants);
          }
        })
        .catch(error => console.error('Error updating participants:', error));
    };

    const handleEditPermissionUpdated = (data) => {
      if (!data?.userId) return;
      setParticipants((prev) =>
        prev.map((participant) =>
          participant._id === data.userId
            ? { ...participant, permission: data.permission }
            : participant
        )
      );
    };

    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('edit_permission_updated', handleEditPermissionUpdated);

    return () => {
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('edit_permission_updated', handleEditPermissionUpdated);
    };
  }, [socket, meetingDbId]);

  const handleBrushToggle = async (participantId, nextPermission) => {
    if (currentRole !== 'host' || !onToggleEditPermission) return;
    await onToggleEditPermission(participantId, nextPermission);
    setParticipants((prev) =>
      prev.map((participant) =>
        participant._id === participantId
          ? { ...participant, permission: nextPermission }
          : participant
      )
    );
  };
  return (
    <aside
      className={`bg-background-dark border-l border-border-dark flex flex-col z-50 shadow-2xl shrink-0 transition-all duration-300 ${
        isOpen ? 'w-80' : 'w-8'
      }`}
    >
      {isOpen ? (
        <>
          <div className="p-4 bg-background-dark flex items-center gap-3">
            <div className="flex-1 bg-black/40 rounded-full p-1 flex items-center border border-white/5">
              <button
                onClick={() => setView('members')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-full tracking-widest uppercase transition-all ${
                  view === 'members' ? 'text-white bg-white/10 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Members
              </button>
              <button
                onClick={() => setView('chat')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-full tracking-widest uppercase transition-all ${
                  view === 'chat' ? 'text-white bg-white/10 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chat
              </button>
            </div>
            <button
              onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
              title="Hide Sidebar"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          <div className="h-[1px] w-full bg-white/5"></div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {view === 'members' ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <span>Loading members...</span>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <span>No members in meeting</span>
                  </div>
                ) : (
                  <>
                    {/* Host First */}
                    {participants.filter(p => p.role === 'host').map(participant => (
                      <MemberCard
                        key={participant._id}
                        name={participant.username}
                        role={participant.role}
                        status={participant.role === 'host' ? 'Hosting' : 'Participant'}
                        mic={participant._id === currentUser?._id ? localMedia?.mic ?? true : true}
                        video={participant._id === currentUser?._id ? localMedia?.video ?? true : true}
                        brush={true}
                        onBrushClick={undefined}
                        brushDisabled={true}
                      />
                    ))}

                    {/* Other Members */}
                    {participants.filter(p => p.role !== 'host').map(participant => (
                      <MemberCard
                        key={participant._id}
                        name={participant.username}
                        role={participant.role}
                        status={participant.role === 'host' ? 'Hosting' : 'Participant'}
                        mic={participant._id === currentUser?._id ? localMedia?.mic ?? true : true}
                        video={participant._id === currentUser?._id ? localMedia?.video ?? true : true}
                        brush={participant.permission === 'edit'}
                        onBrushClick={() =>
                          handleBrushToggle(
                            participant._id,
                            participant.permission === 'edit' ? 'view' : 'edit'
                          )
                        }
                        brushDisabled={currentRole !== 'host'}
                      />
                    ))}
                  </>
                )}
              </div>
            ) : (
              <ChatBox
                meetingDbId={meetingDbId}
                socket={socket}
                currentUsername={currentUser?.username || currentUser?.name}
              />
            )}
          </div>
        </>
      ) : (
        <div className="h-full w-full flex items-center justify-center relative">
          <button
            onClick={toggle}
            className="bg-background-dark/90 backdrop-blur-xl border border-r-0 border-white/10 w-8 h-24 rounded-l-xl flex items-center justify-center hover:bg-white/10 transition-all group overflow-hidden shadow-2xl"
            title="Show Sidebar"
          >
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-outlined text-white text-2xl group-hover:scale-110 transition-transform relative z-10">
              chevron_left
            </span>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-12 bg-primary rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
