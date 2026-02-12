import { useState } from 'react';

function InviteModal({ meetingId, meetingPassword, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="relative w-96 mx-4">
        {/* Glass Morphism Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
            title="Close"
          >
            <span className="material-symbols-outlined text-white text-lg">close</span>
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Invite to Meeting</h2>
            <p className="text-slate-300 text-sm">Share these details with others</p>
          </div>

          {/* Meeting ID Section */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Meeting ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={meetingId || ''}
                readOnly
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
              <button
                onClick={() => copyToClipboard(meetingId, 'id')}
                className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  copiedField === 'id'
                    ? 'bg-emerald-500/80 text-white'
                    : 'bg-primary/80 hover:bg-primary text-white'
                }`}
                title="Copy Meeting ID"
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedField === 'id' ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
            {copiedField === 'id' && (
              <p className="text-emerald-400 text-xs mt-2 font-medium">Copied to clipboard!</p>
            )}
          </div>

          {/* Password Section */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Meeting Password
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={meetingPassword || ''}
                readOnly
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary/50 transition-all tracking-wider"
              />
              <button
                onClick={() => copyToClipboard(meetingPassword, 'password')}
                className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  copiedField === 'password'
                    ? 'bg-emerald-500/80 text-white'
                    : 'bg-primary/80 hover:bg-primary text-white'
                }`}
                title="Copy Password"
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedField === 'password' ? 'check' : 'content_copy'}
                </span>
              </button>
            </div>
            {copiedField === 'password' && (
              <p className="text-emerald-400 text-xs mt-2 font-medium">Copied to clipboard!</p>
            )}
          </div>

          {/* Info Message */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
            <p className="text-xs text-primary/80 font-medium">
              <span className="material-symbols-outlined text-sm align-middle mr-2">info</span>
              Share these details with participants to join the meeting.
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteModal;
