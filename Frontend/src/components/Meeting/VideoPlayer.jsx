import { useRef, useEffect, useState } from 'react';

/**
 * Video Player using native <video controls>.
 *
 * Fixes the webm duration bug: MediaRecorder-generated .webm files
 * lack duration metadata (browser reports Infinity), which breaks
 * the native seekbar. Fix: seek to a huge value on load → browser
 * resolves the real duration → seek back to 0. Native controls work
 * perfectly after that.
 */
export default function VideoPlayer({ src, downloadName }) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    let cancelled = false;

    const fixDuration = () => {
      if (cancelled) return;

      // If the browser already knows the real duration, nothing to fix
      if (Number.isFinite(v.duration) && v.duration > 0) {
        setReady(true);
        return;
      }

      // Seek to a huge value — browser clamps to real end & computes duration
      const onSeeked = () => {
        v.removeEventListener('seeked', onSeeked);
        if (cancelled) return;
        v.currentTime = 0; // seek back to start
        setReady(true);
      };
      v.addEventListener('seeked', onSeeked);
      v.currentTime = 1e101;
    };

    const onLoadedMetadata = () => fixDuration();
    const onDurationChange = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) {
        setReady(true);
      }
    };

    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('durationchange', onDurationChange);

    // If metadata already loaded (cached)
    if (v.readyState >= 1) fixDuration();

    return () => {
      cancelled = true;
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('durationchange', onDurationChange);
    };
  }, [src]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full aspect-video"
        preload="auto"
        playsInline
      >
        Your browser does not support the video tag.
      </video>

      {/* Loading overlay until duration is resolved */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
            <span className="text-xs text-slate-400">Loading video...</span>
          </div>
        </div>
      )}
    </div>
  );
}
