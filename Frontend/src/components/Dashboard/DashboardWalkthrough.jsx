import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Welcome to Your Dashboard!',
    desc: "This is your command center. Let's take a quick tour of everything you can do here — it only takes a minute!",
    target: null,
    placement: 'center',
  },
  {
    id: 'sidebar',
    emoji: '🗂️',
    title: 'Navigation Sidebar',
    desc: 'Use the sidebar to switch between views: Home, My Canvases, Meetings, Notifications, Activity Log, and Settings. Your profile and Logout button live at the bottom.',
    target: '[data-tour="dash-sidebar"]',
    placement: 'right',
  },
  {
    id: 'actions',
    emoji: '🚀',
    title: 'Quick-Start Actions',
    desc: 'Three big buttons to get going fast — New Canvas starts a blank project, Create Meeting starts an instant collaboration room, and Join Meeting lets you enter an existing session.',
    target: '[data-tour="dash-actions"]',
    placement: 'below',
  },
  {
    id: 'tabs',
    emoji: '📋',
    title: 'Recent & Meetings Tabs',
    desc: 'Switch between your Recent Canvases, Upcoming Meetings, and Completed meetings right here. Canvas cards have hover menus for Rename, Duplicate, and Delete.',
    target: '[data-tour="dash-tabs"]',
    placement: 'below',
  },
  {
    id: 'search',
    emoji: '🔍',
    title: 'Smart Search',
    desc: "Type anything in the search bar to find canvases and meetings by name or ID instantly. Results appear as you type — press Escape or click 'Clear search' to reset.",
    target: '[data-tour="dash-search"]',
    placement: 'below',
  },
  {
    id: 'notifs',
    emoji: '🔔',
    title: 'Notifications',
    desc: 'The Notifications section shows meeting reminders sent to you in real time. A red badge on the bell icon counts unread alerts. Click any notification to mark it read.',
    target: '[data-tour="dash-notifs-btn"]',
    placement: 'right',
  },
  {
    id: 'activity',
    emoji: '📜',
    title: 'Activity Log',
    desc: 'Every important action — canvas creation, logins, meeting joins, exports — is recorded here with timestamps. Great for reviewing your recent work history.',
    target: '[data-tour="dash-activity-btn"]',
    placement: 'right',
  },
  {
    id: 'settings',
    emoji: '⚙️',
    title: 'Settings',
    desc: 'Update your display name, email, and password. You can also manage your account under the Account tab — including deleting it permanently if needed.',
    target: '[data-tour="dash-settings-btn"]',
    placement: 'right',
  },
  {
    id: 'help',
    emoji: '🤖',
    title: 'AI Assistant & Help',
    desc: "Click the Help button (bottom-right) at any time to open the AI Chat Bot or restart this walkthrough. The bot can answer questions about any feature.",
    target: '[data-tour="help-btn"]',
    placement: 'above-left',
  },
  {
    id: 'done',
    emoji: '🎉',
    title: "You're All Set!",
    desc: 'Happy creating! Go ahead and try making a new canvas or scheduling a meeting. Visit the Help System page (help icon in the header) for detailed documentation.',
    target: null,
    placement: 'center',
  },
];

const CARD_W = 400;
const PAD = 16;
const SPOT_PAD = 8;

function computeCardPos(spotRect, placement, vw, vh) {
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  if (!spotRect) {
    return { top: vh / 2 - 180, left: vw / 2 - CARD_W / 2 };
  }

  const { top, left, w, h } = spotRect;

  switch (placement) {
    case 'below': {
      const cardTop = top + h + PAD;
      const centerLeft = left + w / 2 - CARD_W / 2;
      return {
        top: clamp(cardTop, PAD, vh - 300),
        left: clamp(centerLeft, PAD, vw - CARD_W - PAD),
      };
    }
    case 'right': {
      return {
        top: clamp(top, PAD, vh - 320),
        left: clamp(left + w + PAD, PAD, vw - CARD_W - PAD),
      };
    }
    case 'left': {
      return {
        top: clamp(top, PAD, vh - 320),
        left: clamp(left - CARD_W - PAD, PAD, vw - CARD_W - PAD),
      };
    }
    case 'above-left': {
      return {
        top: clamp(top - 310 - PAD, PAD, vh - 320),
        left: clamp(left - CARD_W - PAD, PAD, vw - CARD_W - PAD),
      };
    }
    default: {
      const centerLeft = left + w / 2 - CARD_W / 2;
      return {
        top: clamp(top + h + PAD, PAD, vh - 300),
        left: clamp(centerLeft, PAD, vw - CARD_W - PAD),
      };
    }
  }
}

const DashboardWalkthrough = ({ step, onNext, onPrev, onClose }) => {
  const [spotRect, setSpotRect] = useState(null);
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);

  const updateSpot = useCallback(() => {
    const current = STEPS[step];
    if (!current) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    setVw(w);
    setVh(h);
    if (current.target) {
      const el = document.querySelector(current.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setSpotRect({
          top: r.top - SPOT_PAD,
          left: r.left - SPOT_PAD,
          w: r.width + SPOT_PAD * 2,
          h: r.height + SPOT_PAD * 2,
        });
        return;
      }
    }
    setSpotRect(null);
  }, [step]);

  useEffect(() => {
    const t = setTimeout(updateSpot, 60);
    window.addEventListener('resize', updateSpot);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateSpot);
    };
  }, [updateSpot]);

  const current = STEPS[step];
  if (!current) return null;

  const total = STEPS.length;
  const cardPos = computeCardPos(spotRect, current.placement, vw, vh);

  return (
    <>
      {/* Dark overlay with spotlight cutout */}
      <div className="fixed inset-0 z-[190] pointer-events-none">
        {spotRect ? (
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
          >
            <defs>
              <mask id="dash-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotRect.left}
                  y={spotRect.top}
                  width={spotRect.w}
                  height={spotRect.h}
                  rx="12"
                  ry="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.82)"
              mask="url(#dash-spotlight-mask)"
            />
          </svg>
        ) : (
          <div className="absolute inset-0 bg-black/80" />
        )}
      </div>

      {/* Spotlight glow border */}
      {spotRect && (
        <div
          className="fixed pointer-events-none z-[191] rounded-[12px] transition-all duration-300"
          style={{
            top: spotRect.top,
            left: spotRect.left,
            width: spotRect.w,
            height: spotRect.h,
            boxShadow:
              '0 0 0 2px rgba(59,130,246,0.7), 0 0 0 4px rgba(59,130,246,0.15), 0 0 28px rgba(59,130,246,0.25)',
          }}
        />
      )}

      {/* Interaction blocker */}
      <div className="fixed inset-0 z-[192]" />

      {/* Tooltip card */}
      <div
        className="fixed z-[193] bg-[#0f172a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
        style={{
          width: CARD_W,
          top: cardPos.top,
          left: cardPos.left,
          transition: 'top 0.4s cubic-bezier(0.4,0,0.2,1), left 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-[#1f2a3b]">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${((step + 1) / total) * 100}%`,
              background: 'linear-gradient(to right, #1d7ff2, #15938c)',
            }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl leading-none">{current.emoji}</span>
              <h3 className="text-base font-bold text-white leading-tight">{current.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors p-1.5 -mt-1 -mr-1 rounded-lg hover:bg-white/5 shrink-0"
              title="Close tour"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-5">{current.desc}</p>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 8,
                  height: 8,
                  backgroundColor:
                    i === step ? '#1d7ff2' : i < step ? 'rgba(29,127,242,0.35)' : '#1f2a3b',
                }}
              />
            ))}
            <span className="ml-auto text-xs text-slate-500 font-mono">
              {step + 1} / {total}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#2d3a4b] text-slate-300 hover:text-white hover:border-slate-500 text-sm font-medium transition-all"
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              <button
                onClick={step === total - 1 ? onClose : onNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-white text-sm font-semibold transition-all shadow-lg"
                style={{ background: '#1d7ff2', boxShadow: '0 4px 12px rgba(29,127,242,0.3)' }}
              >
                {step === total - 1 ? (
                  '🎉 Finish!'
                ) : (
                  <>
                    Next <ChevronRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardWalkthrough;
