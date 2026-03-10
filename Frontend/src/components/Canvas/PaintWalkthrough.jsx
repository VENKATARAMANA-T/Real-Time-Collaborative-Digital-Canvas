import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Welcome to Paint Pro!',
    desc: "Let's take a quick tour of all the key features. This walkthrough takes less than a minute!",
    target: null,
    placement: 'center',
  },
  {
    id: 'tools',
    emoji: '✏️',
    title: 'Drawing Tools',
    desc: 'Pencil — freehand draw · Eraser — remove strokes · Text — add a text box · Select — move & resize elements · Hand — pan the canvas · Fill Bucket — flood-fill an area.',
    target: '[data-tour="tools"]',
    placement: 'below',
  },
  {
    id: 'shapes',
    emoji: '⬡',
    title: 'Shapes Panel',
    desc: 'Pick a shape (rectangle, circle, triangle, line, star, arrow, etc.) then click and drag on the canvas to draw it. Combine shapes to build complex illustrations!',
    target: '[data-tour="shapes"]',
    placement: 'below',
  },
  {
    id: 'colors',
    emoji: '🎨',
    title: 'Colors & Palette',
    desc: 'Click any color swatch to set the stroke/fill color, or use the custom color picker for any color. The canvas background color can be configured separately.',
    target: '[data-tour="colors"]',
    placement: 'below',
  },
  {
    id: 'view',
    emoji: '🔍',
    title: 'View Controls',
    desc: 'Zoom in/out with the slider · Toggle gridlines (Ctrl+G) · Enable snap-to-grid for precise alignment · Checkerboard background for transparent canvases · Reset view button.',
    target: '[data-tour="view"]',
    placement: 'below',
  },
  {
    id: 'properties',
    emoji: '⚙️',
    title: 'Properties Panel',
    desc: 'Adjust stroke width with the vertical slider (drag up for thicker strokes). Toggle AI Shape Correction to automatically perfect the shapes you sketch freehand.',
    target: '[data-tour="properties"]',
    placement: 'right',
  },
  {
    id: 'layers',
    emoji: '📚',
    title: 'Layers Panel',
    desc: 'Organize artwork across multiple layers. Add new layers (+), rename by double-clicking, toggle visibility (eye icon), lock to prevent edits, drag rows to reorder, and merge layers down.',
    target: '[data-tour="layers"]',
    placement: 'left',
  },
  {
    id: 'menu',
    emoji: '💾',
    title: 'Save, Export & Share',
    desc: 'Use the Options menu to Save the canvas to the cloud, Export as a PNG image, or Import a photo. Hit the Share icon for a read-only link you can send to anyone.',
    target: '[data-tour="topmenu"]',
    placement: 'below',
  },
  {
    id: 'help',
    emoji: '🤖',
    title: 'AI Assistant & Help',
    desc: 'Click the Help button (bottom-right corner) at any time to open the AI Art Assistant — draw shapes by command, change colors, undo/redo — or restart this tour.',
    target: '[data-tour="help-btn"]',
    placement: 'above-left',
  },
  {
    id: 'done',
    emoji: '🎉',
    title: "You're All Set!",
    desc: 'Happy creating! Quick shortcuts: Ctrl+Z undo · Ctrl+Y redo · Delete key removes the selection · Scroll wheel zooms · Hold the Hand tool and drag to pan.',
    target: null,
    placement: 'center',
  },
];

const CARD_W = 400;
const PAD = 16;

function computeCardPos(spotRect, placement, vw, vh) {
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  if (!spotRect) {
    return {
      top: vh / 2 - 170,
      left: vw / 2 - CARD_W / 2,
    };
  }

  const { top, left, w, h } = spotRect;

  switch (placement) {
    case 'below': {
      const cardTop = top + h + PAD;
      const centerLeft = left + w / 2 - CARD_W / 2;
      return {
        top: clamp(cardTop, PAD, vh - 280),
        left: clamp(centerLeft, PAD, vw - CARD_W - PAD),
      };
    }
    case 'right': {
      return {
        top: clamp(top, PAD, vh - 300),
        left: clamp(left + w + PAD, PAD, vw - CARD_W - PAD),
      };
    }
    case 'left': {
      return {
        top: clamp(top, PAD, vh - 300),
        left: clamp(left - CARD_W - PAD, PAD, vw - CARD_W - PAD),
      };
    }
    case 'above-left': {
      return {
        top: clamp(top - 300 - PAD, PAD, vh - 300),
        left: clamp(left - CARD_W - PAD, PAD, vw - CARD_W - PAD),
      };
    }
    default: {
      const centerLeft = left + w / 2 - CARD_W / 2;
      return {
        top: clamp(top + h + PAD, PAD, vh - 280),
        left: clamp(centerLeft, PAD, vw - CARD_W - PAD),
      };
    }
  }
}

const SPOT_PAD = 8;

const PaintWalkthrough = ({ step, onNext, onPrev, onClose }) => {
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
    // Small delay lets DOM fully settle (e.g. after toolbar renders)
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
      {/* ── Dark overlay with spotlight cutout ────────────────────────────── */}
      <div className="fixed inset-0 z-[190] pointer-events-none">
        {spotRect ? (
          <svg
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
          >
            <defs>
              <mask id="wt-spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotRect.left}
                  y={spotRect.top}
                  width={spotRect.w}
                  height={spotRect.h}
                  rx="10"
                  ry="10"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.82)"
              mask="url(#wt-spotlight-mask)"
            />
          </svg>
        ) : (
          <div className="absolute inset-0 bg-black/80" />
        )}
      </div>

      {/* ── Spotlight glow border ─────────────────────────────────────────── */}
      {spotRect && (
        <div
          className="fixed pointer-events-none z-[191] rounded-[10px] transition-all duration-300"
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

      {/* ── Interaction blocker (card remains clickable) ──────────────────── */}
      <div className="fixed inset-0 z-[192]" />

      {/* ── Tooltip card ─────────────────────────────────────────────────── */}
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
        <div className="h-1 bg-zinc-800/80">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl leading-none">{current.emoji}</span>
              <h3 className="text-base font-bold text-white leading-tight">{current.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors p-1.5 -mt-1 -mr-1 rounded-lg hover:bg-white/5 shrink-0"
              title="Close tour"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed mb-5">{current.desc}</p>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-5 h-2 bg-blue-500'
                    : i < step
                    ? 'w-2 h-2 bg-blue-400/40'
                    : 'w-2 h-2 bg-zinc-700'
                }`}
              />
            ))}
            <span className="ml-auto text-xs text-zinc-500 font-mono">
              {step + 1} / {total}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700/60 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm font-medium transition-all"
                >
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              <button
                onClick={step === total - 1 ? onClose : onNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
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

export default PaintWalkthrough;
