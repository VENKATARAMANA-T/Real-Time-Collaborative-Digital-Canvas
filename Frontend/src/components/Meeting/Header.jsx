import { useMemo, useState } from 'react';
import InviteModal from './InviteModal';

const getInitials = (name) => {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function Header({ meetingId, meetingPassword, participants = [] }) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  const activeParticipants = useMemo(
    () => participants.filter((participant) => participant.isActive !== false),
    [participants]
  );
  const displayParticipants = activeParticipants.slice(0, 3);
  const remainingCount = Math.max(activeParticipants.length - displayParticipants.length, 0);

  return (
    <>
      <header className="h-16 border-b border-border-dark flex items-center justify-between px-6 bg-background-dark z-50 shrink-0">
        <div className="flex items-center gap-6 ">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-[22px]">hub</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white text-start">Collaborative Canvas</span>
              <nav className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                <span>Projects</span>
                <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                <span className="text-slate-300">Live Workshop Session</span>
              </nav>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Collaborating Now</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {displayParticipants.map((participant) => (
                <div
                  key={participant._id}
                  className="w-8 h-8 rounded-full border-2 border-background-dark bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-200 ring-1 ring-white/10"
                  title={participant.username}
                >
                  {getInitials(participant.username || 'U')}
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="w-8 h-8 rounded-full border-2 border-background-dark bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 ring-1 ring-white/10">
                  +{remainingCount}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
              <span className="material-symbols-outlined text-[14px]">group</span>
              <span>{activeParticipants.length}</span>
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Invite
          </button>
        </div>
      </header>
      
      {showInviteModal && (
        <InviteModal
          meetingId={meetingId}
          meetingPassword={meetingPassword}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  );
}

export default Header;

